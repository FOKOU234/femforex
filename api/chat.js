// Fem Forex - Coach (Vercel serverless function). La cle Gemini reste secrete dans Vercel (GEMINI_API_KEY).
const SB_URL = process.env.SB_URL || 'https://zjzonneuxuefaypqzlfa.supabase.co';
const SB_KEY = process.env.SB_KEY || 'sb_publishable_QfXIz8PAMHIozUGc3sdXBg_wGoZZtA5';
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const DAILY_MAX = parseInt(process.env.COACH_DAILY_MAX || '40', 10);
const used = {};

const LANGS = { fr: 'français', en: 'English', es: 'español', pt: 'português', de: 'Deutsch', it: 'italiano' };

const RULES = `Tu es "Coach", le coach de trading personnel de Fem dans son journal Fem Forex. Elle apprend le trading sur un compte démo avec une méthode "liquidité + order blocks".
Règles :
- Réponds dans la langue demandée, avec des mots très simples et des comparaisons simples de la vie de tous les jours. Phrases courtes.
- Base-toi UNIQUEMENT sur les données fournies. N'invente aucun chiffre. Si une donnée manque, dis-le.
- Ne prédis jamais le marché et ne donne aucun signal d'achat ou de vente.
- Si l'échantillon est petit (moins de 20 trades sur la période), dis-le clairement et reste prudent.
- Sois honnête et direct, mais encourage aussi : cite toujours au moins un vrai point positif avant les points à améliorer.
- Termine par UNE seule action concrète à faire en priorité.
- Format : titres courts commençant par "## ", listes avec "- ". Pas de tableaux. Environ 250 mots (environ 450 pour un bilan complet).`;

function send(res, code, obj) { res.status(code).json(obj); }

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'method' });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return send(res, 500, { error: 'no_key' });

  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return send(res, 401, { error: 'auth' });
  let uid;
  try {
    const r = await fetch(SB_URL + '/auth/v1/user', { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + token } });
    if (!r.ok) return send(res, 401, { error: 'auth' });
    const u = await r.json();
    uid = u && u.id;
    if (!uid) return send(res, 401, { error: 'auth' });
  } catch (e) { return send(res, 401, { error: 'auth' }); }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = null; } }
  const msgs = body && Array.isArray(body.messages) ? body.messages : null;
  if (!msgs || !msgs.length) return send(res, 400, { error: 'bad' });

  const day = new Date().toISOString().slice(0, 10);
  const k = uid + ':' + day;
  for (const x in used) if (x.slice(-10) !== day) delete used[x];
  if ((used[k] || 0) >= DAILY_MAX) return send(res, 429, { error: 'daily' });

  const lang = LANGS[body.lang] || LANGS.fr;
  const ctx = String(body.context || '').slice(0, 60000);
  const system = RULES + '\nLangue de réponse : ' + lang + '.\n\n=== DONNÉES DU TRADER ===\n' + ctx;
  const contents = msgs.slice(-10).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(m.content || '').slice(0, 4000) }]
  }));
  if (contents[0].role !== 'user') contents.shift();
  if (!contents.length) return send(res, 400, { error: 'bad' });

  let r;
  try {
    r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(MODEL) + ':generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { maxOutputTokens: 2048, temperature: 0.4 }
      })
    });
  } catch (e) { return send(res, 502, { error: 'upstream' }); }

  if (r.status === 429) return send(res, 429, { error: 'quota' });
  if (r.status === 404) return send(res, 404, { error: 'model' });
  if (r.status === 400 || r.status === 401 || r.status === 403) return send(res, 403, { error: 'key' });
  if (!r.ok) return send(res, 502, { error: 'upstream' });

  let j;
  try { j = await r.json(); } catch (e) { return send(res, 502, { error: 'upstream' }); }
  const parts = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [];
  const text = parts.filter(p => p.text && !p.thought).map(p => p.text).join('').trim();
  if (!text) return send(res, 502, { error: 'empty' });
  used[k] = (used[k] || 0) + 1;
  send(res, 200, { reply: text, model: MODEL });
};
