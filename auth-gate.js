/* Fem Forex — écran de connexion (auth-gate.js)
   1) Remplis les 2 lignes ci-dessous avec les infos de ton projet Supabase.
   2) Ajoute <script src="auth-gate.js"></script> juste après <body> dans index.html. */
(function () {
  'use strict';
  var SUPABASE_URL = 'https://zjzonneuxuefaypqzlfa.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_QfXIz8PAMHIozUGc3sdXBg_wGoZZtA5';    // clé publique (publishable) : peut être visible

  var USE_CODE = false; // false = e-mail avec lien (e-mail Supabase par défaut). true = code à 6 chiffres (nécessite SMTP personnalisé).
  var I18N = {
    fr: {
      tag: 'Ton journal de trading, ton progrès.', login: 'Connexion', signup: 'Créer un compte',
      email: 'Adresse e-mail', pass: 'Mot de passe', pass2: 'Confirmer le mot de passe', newPass: 'Nouveau mot de passe',
      bLogin: 'Se connecter', bSignup: 'Créer mon compte', bForgot: 'Envoyer le lien', bNew: 'Enregistrer',
      forgot: 'Mot de passe oublié ?', back: '← Retour', lang: 'Langue',
      checkMail: 'Compte créé. Ouvre le lien reçu par e-mail, puis connecte-toi.', resetSent: 'Lien envoyé. Vérifie ta boîte mail.',
      passDone: 'Mot de passe modifié.', eCreds: 'E-mail ou mot de passe incorrect.', eConfirm: 'Confirme d’abord ton e-mail (lien reçu).',
      eExists: 'Un compte existe déjà avec cet e-mail.', eMatch: 'Les mots de passe ne correspondent pas.', eShort: 'Mot de passe : 8 caractères minimum.',
      eMail: 'Adresse e-mail invalide.', eConf: 'Configuration manquante : renseigne SUPABASE_URL et SUPABASE_KEY dans auth-gate.js.',
      eNet: 'Connexion impossible. Vérifie internet puis recharge la page.', wait: 'Un instant…',
      code: 'Code de vérification', bVerify: 'Vérifier', resend: 'Renvoyer le code', codeSent: 'Code envoyé. Entre le code reçu par e-mail.', eCode: 'Code invalide ou expiré.', backS: '← Changer d’e-mail'
    },
    en: {
      tag: 'Your trading journal, your progress.', login: 'Sign in', signup: 'Create account',
      email: 'Email address', pass: 'Password', pass2: 'Confirm password', newPass: 'New password',
      bLogin: 'Sign in', bSignup: 'Create my account', bForgot: 'Send link', bNew: 'Save',
      forgot: 'Forgot password?', back: '← Back', lang: 'Language',
      checkMail: 'Account created. Open the link sent by email, then sign in.', resetSent: 'Link sent. Check your inbox.',
      passDone: 'Password updated.', eCreds: 'Incorrect email or password.', eConfirm: 'Please confirm your email first (link sent).',
      eExists: 'An account already exists with this email.', eMatch: 'Passwords do not match.', eShort: 'Password: 8 characters minimum.',
      eMail: 'Invalid email address.', eConf: 'Missing setup: fill SUPABASE_URL and SUPABASE_KEY in auth-gate.js.',
      eNet: 'Cannot connect. Check your internet and reload.', wait: 'One moment…',
      code: 'Verification code', bVerify: 'Verify', resend: 'Resend code', codeSent: 'Code sent. Enter the code from your email.', eCode: 'Invalid or expired code.', backS: '← Change email'
    }
  };
  var lang = 'fr';
  try { lang = localStorage.getItem('ff-lang') || (navigator.language || 'fr').slice(0, 2); } catch (e) {}
  if (!I18N[lang]) lang = 'fr';
  var mode = 'login', pending = '', sb = null, busy = false, raf = 0;
  function T(k) { return I18N[lang][k] || k; }

  var css = '#ff-gate{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:20px;overflow:auto;color:#E8ECEF;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:radial-gradient(120% 90% at 20% 0%,#142235 0%,#070a0d 60%);transition:opacity .45s}' +
    '#ff-gate::before{content:"";position:absolute;inset:-30%;background:conic-gradient(from 0deg at 50% 50%,rgba(226,179,74,.16),rgba(60,192,143,.12),rgba(80,120,255,.12),rgba(226,179,74,.16));filter:blur(70px);animation:ffspin 40s linear infinite}' +
    '@keyframes ffspin{to{transform:rotate(360deg)}}#ff-gate.off{opacity:0;pointer-events:none}#ff-gate canvas{position:absolute;inset:0;width:100%;height:100%}' +
    '#ff-card{position:relative;width:100%;max-width:400px;padding:26px 22px;border-radius:24px;background:rgba(16,22,30,.68);border:1px solid rgba(255,255,255,.1);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);box-shadow:0 24px 70px rgba(0,0,0,.5)}' +
    '#ff-card .mk{width:52px;height:52px;border-radius:15px;margin:0 auto 12px;display:grid;place-items:center;background:linear-gradient(145deg,#EBC25E,#C99528);box-shadow:0 8px 24px rgba(226,179,74,.4)}' +
    '#ff-card .mk svg{width:28px;height:28px;stroke:#17130A;fill:none;stroke-width:2.2;stroke-linecap:round}' +
    '#ff-card h1{margin:0;text-align:center;font-size:24px;letter-spacing:-.01em}#ff-card .tg{margin:4px 0 18px;text-align:center;color:#94A0AA;font-size:13.5px}' +
    '#ff-card .tabs{display:flex;gap:6px;padding:4px;border-radius:12px;background:rgba(255,255,255,.06);margin-bottom:14px}' +
    '#ff-card .tabs button{flex:1;border:0;border-radius:9px;padding:10px 6px;background:none;color:#94A0AA;font:600 14px inherit;cursor:pointer}' +
    '#ff-card .tabs button.on{background:#E2B34A;color:#17130A}#ff-card label{display:block;margin:10px 0 4px;font-size:12.5px;color:#94A0AA}' +
    '#ff-card input,#ff-card select{width:100%;min-height:46px;border-radius:11px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#E8ECEF;padding:0 12px;font-size:16px}' +
    '#ff-card input:focus,#ff-card select:focus{outline:none;border-color:#E2B34A;box-shadow:0 0 0 3px rgba(226,179,74,.22)}' +
    '#ff-card .go{width:100%;margin-top:16px;min-height:50px;border:0;border-radius:12px;background:linear-gradient(180deg,#E8BF58,#D7A93B);color:#17130A;font:700 16px inherit;cursor:pointer;box-shadow:0 8px 20px rgba(226,179,74,.3)}' +
    '#ff-card .go[disabled]{opacity:.6}#ff-card .lk{display:block;margin:12px auto 0;background:none;border:0;color:#94A0AA;font-size:13.5px;cursor:pointer;text-decoration:underline}' +
    '#ff-card .ms{min-height:20px;margin-top:12px;text-align:center;font-size:13.5px}#ff-card .ms.e{color:#FF7466}#ff-card .ms.k{color:#3CC08F}' +
    '#ff-card .lg{margin-top:14px}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var g = document.createElement('div'); g.id = 'ff-gate'; g.setAttribute('role', 'dialog'); g.setAttribute('aria-modal', 'true');
  g.innerHTML = '<canvas aria-hidden="true"></canvas><div id="ff-card"><div class="mk"><svg viewBox="0 0 24 24"><path d="M6 5v14M12 8v10M18 4v13"/></svg></div>' +
    '<h1>Fem Forex</h1><p class="tg" id="g-tag"></p><div class="tabs" id="g-tabs"><button type="button" data-m="login"></button><button type="button" data-m="signup"></button></div>' +
    '<form id="g-form" novalidate><div id="g-fe"><label id="g-le"></label><input id="g-email" type="email" autocomplete="email" inputmode="email"></div>' +
    '<div id="g-fp"><label id="g-lp"></label><input id="g-pass" type="password" autocomplete="current-password"></div>' +
    '<div id="g-fp2"><label id="g-lp2"></label><input id="g-pass2" type="password" autocomplete="new-password"></div>' +
    '<div id="g-fc"><label id="g-lc"></label><input id="g-code" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="10" style="text-align:center;letter-spacing:.3em;font-size:22px"></div>' +
    '<button class="go" id="g-go" type="submit"></button></form><button class="lk" id="g-alt" type="button"></button><button class="lk" id="g-back" type="button"></button><div class="ms" id="g-ms" role="alert"></div>' +
    '<div class="lg"><label id="g-ll"></label><select id="g-lang"><option value="fr">Français</option><option value="en">English</option></select></div></div>';
  document.documentElement.style.overflow = 'hidden';
  (document.body || document.documentElement).appendChild(g);
  function $(i) { return document.getElementById(i); }

  function msg(t, c) { var m = $('g-ms'); m.textContent = t || ''; m.className = 'ms' + (c ? ' ' + c : ''); }
  function render() {
    var s = mode === 'login' || mode === 'signup', v = mode === 'verify';
    $('g-tag').textContent = T('tag'); $('g-ll').textContent = T('lang'); $('g-lang').value = lang;
    $('g-tabs').style.display = s ? 'flex' : 'none';
    var b = $('g-tabs').children; b[0].textContent = T('login'); b[1].textContent = T('signup');
    b[0].className = mode === 'login' ? 'on' : ''; b[1].className = mode === 'signup' ? 'on' : '';
    $('g-fe').style.display = (mode === 'recover' || v) ? 'none' : 'block'; $('g-fp').style.display = (mode === 'forgot' || v) ? 'none' : 'block';
    $('g-fc').style.display = v ? 'block' : 'none'; $('g-lc').textContent = T('code'); $('g-back').textContent = T('backS'); $('g-back').style.display = v ? 'block' : 'none';
    $('g-fp2').style.display = mode === 'signup' ? 'block' : 'none';
    $('g-le').textContent = T('email'); $('g-lp').textContent = mode === 'recover' ? T('newPass') : T('pass'); $('g-lp2').textContent = T('pass2');
    $('g-pass').autocomplete = mode === 'login' ? 'current-password' : 'new-password';
    $('g-go').textContent = { login: T('bLogin'), signup: T('bSignup'), forgot: T('bForgot'), recover: T('bNew'), verify: T('bVerify') }[mode];
    $('g-alt').textContent = mode === 'login' ? T('forgot') : (mode === 'signup' ? '' : (v ? T('resend') : T('back')));
    $('g-alt').style.display = mode === 'signup' ? 'none' : 'block';
  }
  function setMode(m) { mode = m; msg(''); render(); }

  function nice(e) {
    var t = (e && e.message) || '';
    if (/invalid login/i.test(t)) return T('eCreds'); if (/not confirmed/i.test(t)) return T('eConfirm'); if (/token|otp|expired/i.test(t)) return T('eCode');
    if (/already/i.test(t)) return T('eExists'); if (/fetch|network/i.test(t)) return T('eNet'); return t || T('eNet');
  }
  function ready() { return /^https:\/\//.test(SUPABASE_URL) && SUPABASE_KEY.length > 40; }
  function hide() { g.classList.add('off'); document.documentElement.style.overflow = ''; setTimeout(function () { g.style.display = 'none'; cancelAnimationFrame(raf); }, 480); }
  function show() { g.style.display = 'flex'; document.documentElement.style.overflow = 'hidden'; requestAnimationFrame(function () { g.classList.remove('off'); }); anim(); }

  $('g-form').addEventListener('submit', async function (ev) {
    ev.preventDefault(); if (busy) return;
    if (!ready() || !sb) { msg(ready() ? T('eNet') : T('eConf'), 'e'); return; }
    var email = $('g-email').value.trim(), p = $('g-pass').value, p2 = $('g-pass2').value;
    if (mode !== 'recover' && mode !== 'verify' && !/^\S+@\S+\.\S+$/.test(email)) { msg(T('eMail'), 'e'); return; }
    if ((mode === 'signup' || mode === 'recover') && p.length < 8) { msg(T('eShort'), 'e'); return; }
    if (mode === 'signup' && p !== p2) { msg(T('eMatch'), 'e'); return; }
    busy = true; $('g-go').disabled = true; msg(T('wait'));
    try {
      var r;
      if (mode === 'login') { r = await sb.auth.signInWithPassword({ email: email, password: p }); if (r.error) throw r.error; }
      else if (mode === 'signup') { r = await sb.auth.signUp({ email: email, password: p, options: { emailRedirectTo: location.origin } }); if (r.error) throw r.error; if (r.data && r.data.session) return; if (USE_CODE) { pending = email; mode = 'verify'; render(); msg(T('codeSent'), 'k'); } else { mode = 'login'; render(); msg(T('checkMail'), 'k'); } }
      else if (mode === 'verify') { r = await sb.auth.verifyOtp({ email: pending, token: $('g-code').value.trim(), type: 'signup' }); if (r.error) throw r.error; hide(); }
      else if (mode === 'forgot') { r = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin }); if (r.error) throw r.error; msg(T('resetSent'), 'k'); }
      else { r = await sb.auth.updateUser({ password: p }); if (r.error) throw r.error; msg(T('passDone'), 'k'); hide(); }
    } catch (e) {
      if (USE_CODE && mode === 'login' && /not confirmed/i.test((e && e.message) || '')) { pending = email; try { await sb.auth.resend({ type: 'signup', email: email }); } catch (x) {} mode = 'verify'; render(); msg(T('codeSent'), 'k'); }
      else msg(nice(e), 'e');
    }
    busy = false; $('g-go').disabled = false;
  });
  $('g-tabs').addEventListener('click', function (e) { var m = e.target.getAttribute && e.target.getAttribute('data-m'); if (m) setMode(m); });
  $('g-alt').addEventListener('click', async function () {
    if (mode === 'verify') { try { await sb.auth.resend({ type: 'signup', email: pending }); msg(T('codeSent'), 'k'); } catch (e) { msg(nice(e), 'e'); } return; }
    setMode(mode === 'login' ? 'forgot' : 'login');
  });
  $('g-back').addEventListener('click', function () { setMode('signup'); });
  $('g-lang').addEventListener('change', function () {
    lang = this.value; try { localStorage.setItem('ff-lang', lang); } catch (e) {}
    render(); window.dispatchEvent(new CustomEvent('ff-lang', { detail: lang }));
  });

  /* Fond animé : réseau de points qui monte + courbe de croissance, net en haute résolution */
  var cv = g.querySelector('canvas'), cx = cv.getContext('2d'), W, H, D, P = [], t0 = 0;
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function size() {
    D = Math.min(window.devicePixelRatio || 1, 2.5); W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * D); cv.height = Math.round(H * D); cx.setTransform(D, 0, 0, D, 0, 0);
    var n = Math.round(Math.min(90, W * H / 13000)); P = [];
    for (var i = 0; i < n; i++) P.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .25, vy: -(Math.random() * .35 + .08), r: Math.random() * 1.6 + .6, c: Math.random() < .6 ? '226,179,74' : '60,192,143' });
  }
  function curveY(x) { return H * (.86 - .62 * Math.pow(x / W, 1.5)) + Math.sin(x / 38 + t0 / 900) * 7; }
  function frame() {
    t0 += 16; cx.clearRect(0, 0, W, H);
    var len = Math.min(1, (t0 % 9000) / 6500) * W, i, j, a, b, d;
    cx.lineWidth = 2; cx.shadowBlur = 14; cx.shadowColor = 'rgba(226,179,74,.7)'; cx.strokeStyle = 'rgba(226,179,74,.55)'; cx.beginPath();
    for (i = 0; i <= len; i += 6) { if (i) cx.lineTo(i, curveY(i)); else cx.moveTo(0, curveY(0)); } cx.stroke(); cx.shadowBlur = 0;
    for (i = 0; i < P.length; i++) {
      a = P[i]; if (!still) { a.x += a.vx; a.y += a.vy; } if (a.y < -10) { a.y = H + 10; a.x = Math.random() * W; } if (a.x < -10) a.x = W + 10; if (a.x > W + 10) a.x = -10;
      cx.fillStyle = 'rgba(' + a.c + ',.85)'; cx.beginPath(); cx.arc(a.x, a.y, a.r, 0, 6.2832); cx.fill();
      for (j = i + 1; j < P.length; j++) { b = P[j]; d = Math.hypot(a.x - b.x, a.y - b.y); if (d < 110) { cx.strokeStyle = 'rgba(' + a.c + ',' + (.22 * (1 - d / 110)) + ')'; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke(); } }
    }
    if (!still && !document.hidden) raf = requestAnimationFrame(frame); else if (!still) raf = requestAnimationFrame(frame);
  }
  function anim() { cancelAnimationFrame(raf); size(); frame(); }
  window.addEventListener('resize', function () { if (g.style.display !== 'none') size(); });

  render(); anim();

  /* Supabase */
  window.FFAuth = { signOut: function () { return sb ? sb.auth.signOut() : Promise.resolve(); }, getLang: function () { return lang; } };
  if (!ready()) { msg(T('eConf'), 'e'); return; }
  var s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.108.2/dist/umd/supabase.js';
  s.onerror = function () { msg(T('eNet'), 'e'); };
  s.onload = function () {
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    sb.auth.onAuthStateChange(function (ev, ses) {
      if (ev === 'PASSWORD_RECOVERY') { setMode('recover'); show(); }
      else if (ev === 'SIGNED_OUT') { setMode('login'); show(); }
      else if (ses && ses.user && mode !== 'recover') hide();
    });
    sb.auth.getSession().then(function (r) { if (r.data && r.data.session && mode !== 'recover') hide(); });
  };
  document.head.appendChild(s);
})();
