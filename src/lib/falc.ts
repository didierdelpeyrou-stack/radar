// Client du backend IA souveraine (Gemma sur le serveur H/IA, France).
// L'IA REFORMULE en langage clair (FALC) les droits détectés par le moteur
// déterministe — elle ne décide AUCUN droit (§3). Relecture humaine obligatoire
// avant toute remise à la personne.

// Toujours same-origin : en prod, Caddy route /api/* vers le backend IA ;
// en dev, le proxy Vite (vite.config.ts) fait suivre vers radar.h-ia.fr.
// Une URL relative évite tout problème de CORS.
const BACKEND = '';

export interface FalcInput {
  situation: string;
  droits: string[];
  prochaines_etapes: string[];
}

/** Génère le résumé FALC en streaming. `onToken` reçoit le texte cumulé. */
export async function genererResumeFalc(input: FalcInput, onToken: (texteCumule: string) => void): Promise<string> {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 120000);
  try {
    const resp = await fetch(`${BACKEND}/api/redige-stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctrl.signal,
      body: JSON.stringify(input),
    });
    if (!resp.ok || !resp.body) throw new Error('HTTP ' + resp.status);
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let acc = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const parts = buf.split('\n\n');
      buf = parts.pop() ?? '';
      for (const p of parts) {
        const line = p.replace(/^data: /, '').trim();
        if (!line) continue;
        try {
          const ev = JSON.parse(line);
          if (ev.error) throw new Error(ev.error);
          if (ev.t) {
            acc += ev.t;
            onToken(acc);
          }
        } catch (e) {
          if (e instanceof Error && e.message && !(e instanceof SyntaxError)) throw e;
          /* ligne partielle — ignorée */
        }
      }
    }
    return acc;
  } finally {
    clearTimeout(timeout);
  }
}
