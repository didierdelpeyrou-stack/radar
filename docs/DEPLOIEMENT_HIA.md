# Déploiement sur l'infrastructure H/IA

RADAR est hébergé et exploité par **H/IA** (h-ia.fr), sous convention de
mutualisation (article 261 B du CGI) intégrant une clause de sous-traitance RGPD
article 28 : Solidarité Roquette = responsable de traitement, H/IA = sous-traitant
(instructions documentées, registre, notification d'incident < 72 h, **localisation
UE exclusive**, réversibilité).

## Cible : `https://radar.h-ia.fr`

```
[ Caddy / nginx + TLS Let's Encrypt ]
        │
        ├── frontend statique (dist/ — sortie de `npm run build`)
        └── /rest, /auth, /storage → Supabase self-hosted (Docker Compose)
                                      Postgres 16 · GoTrue · PostgREST · Storage · pg_cron
```

## Étapes

1. **Supabase self-hosted** : partir de la stack Docker officielle
   (`supabase/docker`). Renseigner `POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`,
   `SERVICE_ROLE_KEY`, SMTP.
2. **Migrations** : appliquer `supabase/migrations/0001_init.sql` puis le seed
   `supabase/seed.sql` (`npm run seed:sql` pour le régénérer depuis le catalogue TS).
   Vérifier que `pg_cron` est chargé (`shared_preload_libraries`) — il porte
   l'anonymisation J+24 mois.
3. **Frontend** : `npm run build` → servir `dist/` via le reverse proxy.
   `VITE_SUPABASE_URL=https://radar.h-ia.fr`, `VITE_SUPABASE_ANON_KEY=<anon>`.
4. **TLS** : Caddy gère Let's Encrypt automatiquement sur `radar.h-ia.fr`.
5. **Sauvegardes** : `pg_dump` chiffré quotidien + snapshot du bucket Storage,
   déposés hors site (UE). **Documenter et tester une restauration.**
6. **Supervision** : brancher les métriques applicatives + sondes de disponibilité
   sur le Prometheus/Grafana existant de H/IA (alerting).

## Variante pilote (MVP)

Supabase Cloud, **région UE**. Le code est strictement identique : seules
`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` changent. **Bascule vers le self-host
H/IA obligatoire avant toute mise en production réelle** (données de santé).

## Garde-fous RGPD à la mise en service

- RLS active et testée sur toutes les tables (un `cad` ne voit pas les dossiers d'un
  autre `ep` non affecté ; `invite` n'accède à aucun dossier nominatif).
- Polices auto-hébergées (DM Sans) — **pas de Google Fonts en runtime**, pas de
  tracking tiers.
- Page « Mentions & registre » en ligne (finalités, base légale = consentement, DPO).
