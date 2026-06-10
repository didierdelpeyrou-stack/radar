#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// Export Hermes — paquet de handoff COMPLET pour un développeur successeur (CLI).
// Copie l'INTÉGRALITÉ du projet (code, config, docs, schéma base) — hors
// node_modules / dist / .git / artefacts — + un manifeste et des index Hermes
// (journal git, routes & rôles). Produit aussi un tarball horodaté.
// Le successeur peut `npm install && npm run dev` directement.
// Aucune dépendance externe. Usage :  node scripts/hermes-export.mjs  (ou `make hermes`).
// ─────────────────────────────────────────────────────────────────────────

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'export-hermes');
const PROJET = 'RADAR';

const log = (s) => process.stdout.write(s + '\n');
const r = (p) => join(ROOT, p);
const o = (p) => join(OUT, p);

function sh(cmd, fallback = '') {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return fallback;
  }
}

function write(rel, content) {
  const to = o(rel);
  mkdirSync(dirname(to), { recursive: true });
  writeFileSync(to, content, 'utf8');
  log(`  ✓ ${rel}`);
}

// Exclusions de la copie (artefacts, lourds, non portables).
const EXCLUDES = [
  './node_modules', './dist', './.git', './export-hermes', './.claude',
  './coverage', './.vite', './tsconfig.tsbuildinfo', './radar-hermes-*.tgz',
];

// ── 0. Repartir propre ──────────────────────────────────────────────────
log(`\n📦 Export Hermes (projet complet) — ${PROJET}\n`);
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

// ── 1. Copie intégrale du projet (hors exclusions) ──────────────────────
// tar-pipe : robuste, POSIX, gère les exclusions et la copie dans un sous-dossier.
log('1. Copie du projet complet');
const excl = EXCLUDES.map((e) => `--exclude='${e}'`).join(' ');
sh(`tar -cf - ${excl} -C "${ROOT}" . | tar -xf - -C "${OUT}"`);
const nbFichiers = sh(`find "${OUT}" -type f | wc -l`, '?').trim();
log(`  ✓ ${nbFichiers} fichiers copiés (code, config, docs, supabase/)`);

// ── 2. Index Hermes (références rapides) ────────────────────────────────
log('2. Index Hermes');
write('reference/git-log.txt', sh('git log --oneline -40', '(git indisponible)') + '\n');

const app = existsSync(r('src/App.tsx')) ? readFileSync(r('src/App.tsx'), 'utf8') : '';
const session = existsSync(r('src/lib/session.tsx')) ? readFileSync(r('src/lib/session.tsx'), 'utf8') : '';
const routes = [...app.matchAll(/path="([^"]+)"/g)].map((m) => m[1]);
const roles = [...session.matchAll(/value:\s*'([a-z]+)',\s*label:\s*'([^']+)'/g)].map((m) => `${m[1]} — ${m[2]}`);
const catalogue = existsSync(r('src/domain/catalogue.ts')) ? readFileSync(r('src/domain/catalogue.ts'), 'utf8') : '';
const dispositifsCount = (catalogue.match(/^\s{4}id:\s*'/gm) || []).length;
write(
  'reference/routes-roles.txt',
  [
    `${PROJET} — routes & rôles (extrait automatique)`,
    '',
    'ROUTES (HashRouter) :',
    ...routes.map((p) => `  ${p}`),
    '',
    'RÔLES :',
    ...roles.map((x) => `  ${x}`),
    '',
    `DISPOSITIFS au catalogue : ${dispositifsCount}`,
    '',
  ].join('\n'),
);

// ── 3. Manifeste ────────────────────────────────────────────────────────
log('3. Manifeste');
const head = sh('git rev-parse --short HEAD', '(hors git)');
const branch = sh('git rev-parse --abbrev-ref HEAD', '(?)');
const dirty = sh('git status --porcelain', '');
const stamp = new Date().toISOString();
write(
  'MANIFEST.txt',
  [
    `EXPORT HERMES (PROJET COMPLET) — ${PROJET}`,
    `Généré le        : ${stamp}`,
    `Commit (HEAD)    : ${head} (branche ${branch})${dirty ? ' — + modifications non committées incluses' : ''}`,
    `Fichiers         : ${nbFichiers}`,
    `Dispositifs      : ${dispositifsCount}`,
    `Rôles            : ${roles.length}`,
    '',
    'Point d’entrée OBLIGATOIRE pour le successeur : HERMES.md',
    '',
    'Démarrer en local :',
    '  npm install',
    '  npm run dev        # http://localhost:5173',
    '  npm test           # 27 tests moteur',
    '',
    'METTRE EN LIGNE SUR LE VPS : docs/DEPLOIEMENT_VPS.md (guide complet,',
    '  option A « VPS dédié » = docker compose up -d --build,',
    '  option B « VPS mutualisé H/IA » = build statique + Caddy central + Supabase).',
    '  Schéma base : supabase/migrations/ + supabase/seed.sql.',
    '',
  ].join('\n'),
);

// ── 4. Tarball horodaté ─────────────────────────────────────────────────
log('4. Archive');
const day = stamp.slice(0, 10).replace(/-/g, '');
const tgz = `radar-hermes-${day}.tgz`;
sh(`tar -czf "${join(ROOT, tgz)}" -C "${ROOT}" export-hermes`);
const taille = sh(`du -h "${join(ROOT, tgz)}" | cut -f1`, '?');
log(`  ✓ ${tgz} (${taille})`);

log(`\n✅ Projet complet exporté — ${nbFichiers} fichiers dans export-hermes/  →  ${tgz}`);
log('   Point d’entrée successeur : export-hermes/HERMES.md  ·  démarrage : npm install && npm run dev\n');
