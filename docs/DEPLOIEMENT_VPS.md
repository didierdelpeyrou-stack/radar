# Mettre RADAR en ligne sur le VPS — guide complet

Ce guide donne **toutes les instructions** pour publier RADAR sur
`https://radar.h-ia.fr`. Deux méthodes :

- **Option A — VPS dédié** : RADAR est seul sur la machine → une commande Docker.
- **Option B — VPS mutualisé H/IA** : RADAR cohabite avec d'autres sites derrière
  un **Caddy central** → build statique + bloc Caddy + stack Supabase séparée.
  **C'est la méthode réellement utilisée en production** (VPS `185.170.58.106`).

> Données de santé / sociales → **localisation UE exclusive**, RLS active, pas de
> tracking tiers, sauvegardes chiffrées. Voir la fin du document.

---

## 0. Prérequis (communs)

1. **DNS** : créer un enregistrement **A** `radar.h-ia.fr → <IP du VPS>`
   (hébergeur DNS = Hostinger hPanel → Zone DNS). TTL court (300 s) le temps des tests.
2. **Ports** : `80` et `443` ouverts (Let's Encrypt / TLS).
3. **Accès** : SSH au VPS (`ssh root@<IP>`).
4. Vérifier la résolution : `dig +short radar.h-ia.fr` doit renvoyer l'IP.

---

## Option A — VPS dédié (le plus simple)

Le dépôt contient déjà `Dockerfile`, `Caddyfile`, `docker-compose.yml` : un Caddy
intégré build le front, sert la SPA et obtient le certificat TLS tout seul.

```bash
git clone <repo> radar && cd radar
cp .env.example .env
#   éditer .env :
#     VITE_SUPABASE_URL=https://radar.h-ia.fr
#     VITE_SUPABASE_ANON_KEY=<clé anon de l'instance Supabase>
docker compose up -d --build
```

→ Dès que le DNS pointe sur le VPS, `https://radar.h-ia.fr` est servi (TLS auto).
L'app fonctionne en **local-first** tant que Supabase n'est pas joint (voir §B.3).

---

## Option B — VPS mutualisé H/IA (méthode de production réelle)

Sur le VPS H/IA, un **seul Caddy** (conteneur `hia-caddy`) occupe déjà 80/443 et sert
tous les domaines. On **n'utilise donc pas** le `docker-compose.yml` du dépôt (il
entrerait en conflit). RADAR est servi en **statique** par ce Caddy central, et la
stack Supabase tourne à part.

> Repère clé : le conteneur `hia-caddy` monte l'hôte `/srv/hia/public` sur `/srv`.
> Donc un site servi par `root * /srv/radar` (côté Caddy) = dossier hôte
> **`/srv/hia/public/radar`**.

### B.1 — Publier le front statique

Sur le poste de dev (ou en CI) :

```bash
# Build de production avec l'URL + la clé anon
VITE_SUPABASE_URL=https://radar.h-ia.fr \
VITE_SUPABASE_ANON_KEY=<clé anon> \
npm ci && npm run build          # → dist/

# Déployer dans le webroot du Caddy central
rsync -az --delete dist/ root@<IP>:/srv/hia/public/radar/
```

### B.2 — Bloc Caddy central

Ajouter ce bloc au Caddyfile central (`/srv/hia/Caddyfile` sur le VPS), puis valider
et recharger **sans coupure** :

```caddy
radar.h-ia.fr {
    encode zstd gzip

    # API Supabase (si la stack §B.3 est déployée) → Kong sur le réseau Docker
    @supabase path /rest/* /auth/* /storage/* /realtime/* /functions/*
    handle @supabase {
        reverse_proxy supabase-kong:8000
    }

    # SPA statique (HashRouter : tout retombe sur index.html)
    handle {
        root * /srv/radar
        try_files {path} /index.html
        file_server
    }

    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "no-referrer"
        -Server
    }
}
```

```bash
# Sur le VPS — toujours faire une sauvegarde du Caddyfile avant
cp /srv/hia/Caddyfile /srv/hia/Caddyfile.bak-$(date +%Y%m%d-%H%M%S)
docker exec hia-caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
docker exec hia-caddy caddy reload   --config /etc/caddy/Caddyfile --adapter caddyfile
```

→ Caddy émet le certificat Let's Encrypt à la première requête sur `radar.h-ia.fr`
(le DNS doit déjà pointer sur le VPS). Vérifier : `curl -I https://radar.h-ia.fr`.

À ce stade l'app est **en ligne en local-first** (sans persistance serveur).

### B.3 — Stack Supabase self-hostée (persistance + auth)

RADAR utilise Supabase (Postgres + GoTrue + PostgREST + Storage + Kong + pg_cron).

```bash
# Sur le VPS
git clone --depth 1 --filter=blob:none --sparse https://github.com/supabase/supabase /tmp/supabase-src
cd /tmp/supabase-src && git sparse-checkout set docker
mkdir -p /opt/radar-supabase && cp -r docker/. /opt/radar-supabase/
cd /opt/radar-supabase && cp .env.example .env
```

**Secrets** à renseigner dans `/opt/radar-supabase/.env` (générer, ne jamais committer) :

- `POSTGRES_PASSWORD`, `JWT_SECRET` (≥ 32 caractères), `SECRET_KEY_BASE`,
  `VAULT_ENC_KEY`, `PG_META_CRYPTO_KEY`, `DASHBOARD_PASSWORD`, `LOGFLARE_*`.
- `ANON_KEY` et `SERVICE_ROLE_KEY` = **JWT HS256 signés avec `JWT_SECRET`**
  (payload `{"role":"anon"|"service_role","iss":"supabase","iat":…,"exp":…}`).
- `SUPABASE_PUBLIC_URL` = `API_EXTERNAL_URL` = `SITE_URL` = `https://radar.h-ia.fr`.
- `ENABLE_EMAIL_AUTOCONFIRM=true` tant qu'aucun SMTP n'est branché.

> Un générateur prêt à l'emploi est fourni dans le projet H/IA
> (`gen_supabase_env.py`) : il écrit le `.env` complet et imprime l'`ANON_KEY` (clé
> publique à mettre dans le build front).

**Sécurité réseau — impératif** (Docker contourne UFW sur ce VPS) :

```bash
# Lier TOUS les ports publiés à 127.0.0.1 (kong, postgres, pooler) :
sed -i 's#- ${KONG_HTTP_PORT}:8000/tcp#- 127.0.0.1:${KONG_HTTP_PORT}:8000/tcp#'  docker-compose.yml
sed -i 's#- ${KONG_HTTPS_PORT}:8443/tcp#- 127.0.0.1:${KONG_HTTPS_PORT}:8443/tcp#' docker-compose.yml
sed -i 's#- ${POSTGRES_PORT}:5432#- 127.0.0.1:${POSTGRES_PORT}:5432#'             docker-compose.yml
sed -i 's#- ${POOLER_PROXY_PORT_TRANSACTION}:6543#- 127.0.0.1:${POOLER_PROXY_PORT_TRANSACTION}:6543#' docker-compose.yml
# Si 8000 est déjà pris sur localhost, déplacer Kong : KONG_HTTP_PORT=8001, KONG_HTTPS_PORT=8444 dans .env
```

**Rendre Kong joignable par le Caddy central** (réseau `hia_default`) via un override
chargé en plus du compose :

```bash
cat > /opt/radar-supabase/docker-compose.override.yml <<'YAML'
services:
  kong:
    networks:
      default:
      hia_default:
networks:
  hia_default:
    external: true
YAML
# COMPOSE_FILE doit inclure l'override, sinon il est ignoré :
sed -i 's/^COMPOSE_FILE=.*/COMPOSE_FILE=docker-compose.yml:docker-compose.override.yml/' .env
```

**Démarrer + appliquer le schéma** :

```bash
cd /opt/radar-supabase
docker compose up -d
docker compose ps                      # tout doit être healthy
# Schéma + données (depuis le dépôt radar) :
docker exec -i supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 < /chemin/radar/supabase/migrations/0001_init.sql
docker exec -i supabase-db psql -U postgres -d postgres                     < /chemin/radar/supabase/seed.sql
```

Le job **`pg_cron`** d'anonymisation J+24 mois est planifié par la migration
(`shared_preload_libraries=pg_cron` est déjà fourni par l'image `supabase/postgres`).

### B.4 — Rebuild du front avec la clé anon, puis re-déploiement

```bash
VITE_SUPABASE_URL=https://radar.h-ia.fr \
VITE_SUPABASE_ANON_KEY=<ANON_KEY générée en §B.3> \
npm run build
rsync -az --delete dist/ root@<IP>:/srv/hia/public/radar/
```

### B.5 — Vérifications

```bash
curl -I  https://radar.h-ia.fr/                                   # 200, HTTP/2
curl -s  https://radar.h-ia.fr/auth/v1/health -H "apikey: <anon>" # GoTrue OK
curl -s  "https://radar.h-ia.fr/rest/v1/dispositifs?select=*&limit=1" \
         -H "apikey: <anon>" -H "Authorization: Bearer <anon>"     # 200, [] si RLS
# Aucun port Supabase exposé publiquement :
for p in 8000 8001 5432 6543; do curl -s --max-time 5 http://<IP>:$p/ -o /dev/null -w "$p:%{http_code}\n"; done
```

---

## Mises à jour ultérieures

```bash
git pull
VITE_SUPABASE_URL=https://radar.h-ia.fr VITE_SUPABASE_ANON_KEY=<anon> npm run build
rsync -az --delete dist/ root@<IP>:/srv/hia/public/radar/
```

C'est une PWA : le service worker se met à jour à la visite suivante. Le bloc Caddy
ne change pas. Aucune coupure.

---

## RGPD, sauvegardes, supervision (avant go-live réel)

- **RLS** active et testée sur toutes les tables (un `cad` ne voit que ses dossiers ;
  le rôle `accueil` n'accède à aucun dossier nominatif).
- **Localisation UE exclusive** ; **pas de Google Fonts** ni tracking tiers (polices
  vendorisées). En-têtes de sécurité servis par le bloc Caddy ci-dessus.
- **Sauvegardes** : `pg_dump` chiffré quotidien + snapshot du bucket Storage, déposés
  hors site (UE). **Documenter ET tester une restauration.**
- **Secrets** : `/opt/radar-supabase/.env` en `chmod 600`. `SERVICE_ROLE_KEY` et mots
  de passe ne quittent jamais le serveur. Seule l'`ANON_KEY` (publique) entre dans le
  build front.
- **Supervision** : sondes de disponibilité sur `radar.h-ia.fr` + `…/auth/v1/health`.

---

## Variante pilote (MVP) — Supabase Cloud UE

Pour un pilote rapide sans self-host : créer un projet **Supabase Cloud région UE**,
puis builder le front avec son `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`. Le code
est strictement identique. **Bascule vers le self-host H/IA obligatoire avant toute
mise en production réelle** (données sensibles).
