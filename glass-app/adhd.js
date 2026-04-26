// adhd.js — nivelato logic

// ─── FRACTION HELPERS ──────────────────────────────────────────────────────
function readVal(wholeId, fracId) {
  const whole = parseFloat(document.getElementById(wholeId)?.value) || 0;
  const frac  = parseFloat(document.getElementById(fracId)?.value)  || 0;
  return whole + frac;
}

function toFracStr(decimal) {
  if (decimal === 0) return '0"';
  const whole = Math.floor(Math.abs(decimal));
  const frac  = Math.abs(decimal) - whole;
  const sixteenths = Math.round(frac * 16);
  const sign = decimal < 0 ? '-' : '';

  if (sixteenths === 0) return `${sign}${whole}"`;
  if (sixteenths === 16) return `${sign}${whole + 1}"`;

  const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
  const g = gcd(sixteenths, 16);
  const n = sixteenths / g;
  const d = 16 / g;

  if (whole === 0) return `${sign}${n}/${d}"`;
  return `${sign}${whole} ${n}/${d}"`;
}

// ─── TAB NAV ───────────────────────────────────────────────────────────────
function goTab(tabId) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));

  const btn = document.querySelector(`.tab[data-tab="${tabId}"]`);
  const sec = document.getElementById(`tab-${tabId}`);
  if (btn) btn.classList.add('active');
  if (sec) sec.classList.add('active');

  if (tabId === 'medidas') {
    recalcAll();
    renderMedidas();
  }
}

document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => goTab(btn.dataset.tab));
});

// ─── LCD FLICKER ───────────────────────────────────────────────────────────
function lcdFlicker(el, newText) {
  if (!el) return;
  el.style.opacity = '0.15';
  setTimeout(() => {
    el.textContent = newText;
    el.style.opacity = '1';
  }, 300);
}

// ─── CALCULATIONS ──────────────────────────────────────────────────────────
let results = {};

// walls: A (piso) is priority reference. diff = A - B.
// if A > B → wall leans AFUERA (toward outside) at top
// if A < B → wall leans ADENTRO (toward inside) at top
function calcDesnivel_wall(a, b) {
  const diff = a - b;
  if (Math.abs(diff) < 0.001) return { val: 0, dir: 'NIVEL', label: 'NIVEL' };
  const val = Math.abs(diff);
  // A is the piso (bottom) reading — larger A means wall is farther at bottom
  // → top is closer → leans ADENTRO at top / AFUERA at bottom
  const dir   = diff > 0 ? 'ADENTRO' : 'AFUERA';
  const label = diff > 0 ? `${toFracStr(val)} ADENTRO` : `${toFracStr(val)} AFUERA`;
  return { val, dir, label };
}

// ceiling/floor: A (izquierda) is priority reference. diff = A - B.
// if A > B → right side is lower → slopes DOWN toward right
// if A < B → right side is higher → slopes UP toward right
function calcDesnivel_horiz(a, b) {
  const diff = a - b;
  if (Math.abs(diff) < 0.001) return { val: 0, dir: 'NIVEL', label: 'NIVEL' };
  const val   = Math.abs(diff);
  const dir   = diff > 0 ? 'BAJA DER' : 'SUBE DER';
  const label = diff > 0 ? `${toFracStr(val)} BAJA DER` : `${toFracStr(val)} SUBE DER`;
  return { val, dir, label };
}

function recalcAll() {
  const pI_A = readVal('pI-a-whole', 'pI-a-frac');
  const pI_B = readVal('pI-b-whole', 'pI-b-frac');
  const pD_A = readVal('pD-a-whole', 'pD-a-frac');
  const pD_B = readVal('pD-b-whole', 'pD-b-frac');
  const t_A  = readVal('t-a-whole',  't-a-frac');
  const t_B  = readVal('t-b-whole',  't-b-frac');
  const p_A  = readVal('p-a-whole',  'p-a-frac');
  const p_B  = readVal('p-b-whole',  'p-b-frac');

  results.paredIzq = calcDesnivel_wall(pI_A, pI_B);
  results.paredDer = calcDesnivel_wall(pD_A, pD_B);
  results.techo    = calcDesnivel_horiz(t_A, t_B);
  results.piso     = calcDesnivel_horiz(p_A, p_B);

  updateLiveDesnivel('desn-pared-izq', results.paredIzq);
  updateLiveDesnivel('desn-pared-der', results.paredDer);
  updateLiveDesnivel('desn-techo',     results.techo);
  updateLiveDesnivel('desn-piso',      results.piso);
}

function updateLiveDesnivel(elId, r) {
  const el = document.getElementById(elId);
  if (!el) return;
  const text = r ? `DESNIVEL: ${r.label}` : 'DESNIVEL: —';
  el.style.opacity = '0.2';
  setTimeout(() => {
    el.textContent = text;
    el.style.opacity = '1';
  }, 300);
}

// ─── WIRE UP ALL INPUTS ────────────────────────────────────────────────────
function wireInputs() {
  document.querySelectorAll('input[type="number"], select.frac-select').forEach(el => {
    el.addEventListener('change', () => recalcAll());
    el.addEventListener('input',  () => recalcAll());
  });
}

// ─── RENDER MEDIDAS ────────────────────────────────────────────────────────
function renderMedidas() {
  // techo
  const techoEl = document.getElementById('res-techo');
  lcdFlicker(techoEl, results.techo?.label || '—');

  // piso
  const pisoEl = document.getElementById('res-piso');
  lcdFlicker(pisoEl, results.piso?.label || '—');

  // pared izq — show both A and B readings + desnivel
  const pIEl = document.getElementById('res-pared-izq');
  lcdFlicker(pIEl, results.paredIzq?.label || '—');

  // pared der
  const pDEl = document.getElementById('res-pared-der');
  lcdFlicker(pDEl, results.paredDer?.label || '—');

  // hueco display — raw opening from priority A points
  renderHueco();

  // mark tabs done
  ['pared-izq','pared-der','techo','piso'].forEach(t => {
    document.querySelector(`.tab[data-tab="${t}"]`)?.classList.add('done');
  });
}

// ─── HUECO (raw opening) ───────────────────────────────────────────────────
// Ancho and alto are entered manually by the user on the Medidas screen
function renderHueco() {
  const ancho = readVal('hueco-ancho-whole', 'hueco-ancho-frac');
  const alto  = readVal('hueco-alto-whole',  'hueco-alto-frac');
  const areaEl = document.getElementById('res-area');
  if (!areaEl) return;
  const anchoStr = ancho > 0 ? toFracStr(ancho) : '—';
  const altoStr  = alto  > 0 ? toFracStr(alto)  : '—';
  areaEl.style.opacity = '0.2';
  setTimeout(() => {
    areaEl.textContent = `${anchoStr} × ${altoStr}`;
    areaEl.style.opacity = '1';
  }, 300);
}

// ─── SHARE ─────────────────────────────────────────────────────────────────
function showShare() {
  document.getElementById('share-block')?.classList.remove('hidden');
}

function buildShareText() {
  const notas  = document.getElementById('notas-field')?.value?.trim();
  const ancho  = readVal('hueco-ancho-whole', 'hueco-ancho-frac');
  const alto   = readVal('hueco-alto-whole',  'hueco-alto-frac');
  const lines  = [
    'NIVELATO — MEDIDAS',
    `HUECO:     ${ancho > 0 ? toFracStr(ancho) : '—'} × ${alto > 0 ? toFracStr(alto) : '—'}`,
    '─────────────────',
    `TECHO:     ${results.techo?.label    || '—'}`,
    `PISO:      ${results.piso?.label     || '—'}`,
    `PARED IZQ: ${results.paredIzq?.label || '—'}`,
    `PARED DER: ${results.paredDer?.label || '—'}`,
  ];
  if (notas) lines.push(`NOTAS: ${notas}`);
  return lines.join('\n');
}

function shareViaSMS() {
  window.location.href = `sms:?body=${encodeURIComponent(buildShareText())}`;
}

function shareViaWhatsApp() {
  window.open(`https://wa.me/?text=${encodeURIComponent(buildShareText())}`, '_blank');
}

// ─── INIT ──────────────────────────────────────────────────────────────────
wireInputs();
recalcAll();

// wire hueco inputs separately (they're in the medidas tab)
document.addEventListener('input', (e) => {
  if (e.target.id?.startsWith('hueco-')) renderHueco();
});
document.addEventListener('change', (e) => {
  if (e.target.id?.startsWith('hueco-')) renderHueco();
});
