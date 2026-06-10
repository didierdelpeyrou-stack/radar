-- ═══════════════════════════════════════════════════════════════════════════
-- RADAR — Schéma initial + Row Level Security (Supabase / Postgres 16).
-- Données = catégories particulières (santé, situation administrative) :
-- RLS STRICTE sur toutes les tables, journal d'audit, anonymisation J+24 mois.
-- Cf. protocole §1.3 / §4 (RGPD non négociable).
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";
create extension if not exists pg_cron;

-- ─── Rôles applicatifs ──────────────────────────────────────────────────────
create type role_app as enum ('admin', 'cad', 'ep', 'invite');
create type statut_dossier as enum ('actif', 'clos');
create type verdict_detection as enum ('eligible_probable', 'a_verifier', 'non_eligible', 'deja_percu');
create type statut_demarche as enum ('EC', 'OK', 'REF', 'RC', 'ATT');

-- ─── profiles (1-1 avec auth.users) ──────────────────────────────────────────
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nom text not null,
  role role_app not null default 'invite',
  actif boolean not null default true,
  created_at timestamptz not null default now()
);

-- Helpers de sécurité (SECURITY DEFINER pour lire le rôle sans récursion RLS).
create or replace function auth_role() returns role_app
  language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function is_admin() returns boolean
  language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from profiles where id = auth.uid()), false)
$$;

-- ─── dossiers ────────────────────────────────────────────────────────────────
create sequence if not exists ref_courte_seq;
create table dossiers (
  id uuid primary key default uuid_generate_v4(),
  ref_courte text unique not null
    default 'SR-' || extract(year from now())::text || '-' || lpad(nextval('ref_courte_seq')::text, 4, '0'),
  accompagnant_id uuid not null references profiles (id),
  statut statut_dossier not null default 'actif',
  mode_contact text,
  profil_type text, -- famille | isole | handicap | primo_arrivant | senior (tri uniquement, §10)
  motif_cloture text,
  synthese_cloture text,
  date_derniere_intervention timestamptz not null default now(),
  anonymise_le timestamptz,
  created_at timestamptz not null default now()
);
create index on dossiers (accompagnant_id);

-- ─── personnes (séparée pour purge facile à l'anonymisation) ──────────────────
create table personnes (
  dossier_id uuid primary key references dossiers (id) on delete cascade,
  nom text, prenom text, naissance date,
  telephone text, email text,
  langues text[], besoin_linguistique text
);

-- ─── consentements (traçage RGPD, étape 1) ────────────────────────────────────
create table consentements (
  id uuid primary key default uuid_generate_v4(),
  dossier_id uuid not null references dossiers (id) on delete cascade,
  accompagnement boolean not null,   -- case 1
  mesure_impact boolean not null,    -- case 2 (FSU)
  mode text not null,                -- 'oral_confirme' | 'signe_ecran'
  accompagnant_id uuid not null references profiles (id),
  horodatage timestamptz not null default now()
);

-- ─── diagnostics (7 blocs JSONB — Annexe C) ───────────────────────────────────
create table diagnostics (
  dossier_id uuid primary key references dossiers (id) on delete cascade,
  bloc1 jsonb, bloc2 jsonb, bloc3 jsonb, bloc4 jsonb,
  bloc5 jsonb, bloc6 jsonb, bloc7 jsonb,
  urgences jsonb,
  qf_calcule numeric, taux_effort_calcule numeric,
  version int not null default 1,
  updated_at timestamptz not null default now()
);

-- ─── simulations mesdroitssociaux ─────────────────────────────────────────────
create table simulations_mds (
  id uuid primary key default uuid_generate_v4(),
  dossier_id uuid not null references dossiers (id) on delete cascade,
  date timestamptz not null default now(),
  mode text not null,                -- 'franceconnect' | 'rapide'
  resultats jsonb,                   -- [{prestation, statut, montant}]
  comptes_verifies jsonb,
  pdf_path text
);

-- ─── detections (sortie du moteur — traçabilité du verdict) ────────────────────
create table detections (
  id uuid primary key default uuid_generate_v4(),
  dossier_id uuid not null references dossiers (id) on delete cascade,
  date timestamptz not null default now(),
  moteur_version text not null,
  resultats jsonb not null           -- [{dispositif_id, verdict, raison, montant_estime, questions_manquantes}]
);

-- ─── plans d'action ────────────────────────────────────────────────────────────
create table plans_action (
  dossier_id uuid primary key references dossiers (id) on delete cascade,
  items jsonb not null default '[]'  -- [{dispositif_id, priorite, souhaite_engager, qui_fait_quoi,
                                     --   echeance, pj[], statut, montant_obtenu, date_ouverture_droit}]
);

-- ─── rdv ─────────────────────────────────────────────────────────────────────
create table rdv (
  id uuid primary key default uuid_generate_v4(),
  dossier_id uuid not null references dossiers (id) on delete cascade,
  date timestamptz not null,
  duree_min int,
  contenu text,
  prochaine_etape text
);

-- ─── référentiels (catalogue, règles, PJ) — éditables par admin ────────────────
create table dispositifs (
  id text primary key,
  nom text not null,
  organisme text,
  niveau text,            -- national | paris | idf
  couvert_par_mds boolean not null default false,
  determinant text,
  profils text[],
  description text,
  lien_demarche text,
  actif boolean not null default true
);

create table regles (
  dispositif_id text not null references dispositifs (id) on delete cascade,
  version text not null,
  conditions jsonb not null default '[]',
  montants jsonb,
  non_cumuls text[] default '{}',
  declencheurs text[] default '{}',
  date_source date,
  source text,
  a_verifier boolean not null default true,
  primary key (dispositif_id, version)
);

create table pieces_justificatives (
  demarche_id text primary key,
  items jsonb not null
);

-- ─── audit_log (qui a ouvert quel dossier quand) ───────────────────────────────
create table audit_log (
  id bigserial primary key,
  user_id uuid references profiles (id),
  dossier_id uuid references dossiers (id) on delete set null,
  action text not null,
  horodatage timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- Un dossier n'est visible que par son accompagnant référent + admin (§1).
-- ═══════════════════════════════════════════════════════════════════════════
alter table profiles            enable row level security;
alter table dossiers            enable row level security;
alter table personnes           enable row level security;
alter table consentements       enable row level security;
alter table diagnostics         enable row level security;
alter table simulations_mds     enable row level security;
alter table detections          enable row level security;
alter table plans_action        enable row level security;
alter table rdv                 enable row level security;
alter table audit_log           enable row level security;
alter table dispositifs         enable row level security;
alter table regles              enable row level security;
alter table pieces_justificatives enable row level security;

-- profiles : chacun lit/écrit le sien ; admin gère tout.
create policy profiles_self_read on profiles for select using (id = auth.uid() or is_admin());
create policy profiles_self_upd  on profiles for update using (id = auth.uid() or is_admin());
create policy profiles_admin_all on profiles for all using (is_admin()) with check (is_admin());

-- dossiers : référent ou admin (cad voit tout, ep seulement les siens — affiné côté app).
create policy dossiers_acces on dossiers for select
  using (accompagnant_id = auth.uid() or auth_role() in ('cad', 'admin'));
create policy dossiers_ecriture on dossiers for all
  using (accompagnant_id = auth.uid() or auth_role() in ('cad', 'admin'))
  with check (accompagnant_id = auth.uid() or auth_role() in ('cad', 'admin'));

-- Macro : table fille visible si le dossier parent l'est.
create or replace function peut_voir_dossier(d uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from dossiers x
    where x.id = d and (x.accompagnant_id = auth.uid() or auth_role() in ('cad', 'admin'))
  )
$$;

do $$
declare t text;
begin
  foreach t in array array['personnes','consentements','diagnostics','simulations_mds','detections','plans_action','rdv']
  loop
    execute format(
      'create policy %1$s_acces on %1$s for all using (peut_voir_dossier(dossier_id)) with check (peut_voir_dossier(dossier_id));',
      t);
  end loop;
end $$;

-- audit_log : insertion par tout utilisateur authentifié, lecture admin seule.
create policy audit_insert on audit_log for insert with check (auth.uid() is not null);
create policy audit_read on audit_log for select using (is_admin());

-- référentiels : lecture pour tous les authentifiés, écriture admin seule.
create policy disp_read on dispositifs for select using (auth.uid() is not null);
create policy disp_admin on dispositifs for all using (is_admin()) with check (is_admin());
create policy regles_read on regles for select using (auth.uid() is not null);
create policy regles_admin on regles for all using (is_admin()) with check (is_admin());
create policy pj_read on pieces_justificatives for select using (auth.uid() is not null);
create policy pj_admin on pieces_justificatives for all using (is_admin()) with check (is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- ANONYMISATION J+24 mois (RGPD §4) — purge des identifiants, conservation des
-- agrégats. Planifiée par pg_cron (quotidienne, 03:00).
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function anonymiser_dossiers_expires() returns void
  language plpgsql security definer set search_path = public as $$
begin
  delete from personnes p using dossiers d
    where p.dossier_id = d.id
      and d.statut = 'clos'
      and d.date_derniere_intervention < now() - interval '24 months'
      and d.anonymise_le is null;

  update dossiers d set anonymise_le = now()
    where d.statut = 'clos'
      and d.date_derniere_intervention < now() - interval '24 months'
      and d.anonymise_le is null;
end $$;

select cron.schedule('anonymisation-j24', '0 3 * * *', $$select anonymiser_dossiers_expires()$$);

-- ═══════════════════════════════════════════════════════════════════════════
-- Indicateurs anonymisés (dashboard impact / export FSU). Vue matérialisée :
-- aucun identifiant, uniquement des agrégats.
-- ═══════════════════════════════════════════════════════════════════════════
create materialized view indicateurs_mensuels as
select
  date_trunc('month', d.created_at) as mois,
  d.profil_type,
  count(*) as file_active,
  count(*) filter (where d.statut = 'clos' and d.motif_cloture = 'sortie_autonomie') as sorties_autonomie,
  count(*) filter (where d.statut = 'clos' and d.motif_cloture = 'reorientation') as reorientations
from dossiers d
group by 1, 2;

create unique index on indicateurs_mensuels (mois, profil_type);
