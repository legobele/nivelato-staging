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

  // simplify
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

// ─── LCD FLICKER ON INPUT ──────────────────────────────────────────────────
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

function calcDesnivel(a, b) {
  // A (piso/izq) is priority — diff = A - B
  const diff = a - b;
  return { val: Math.abs(diff), dir: diff > 0 ? 'IZQ' : diff < 0 ? 'DER' : 'NIVEL' };
}

function calcDesnivel_horiz(a, b) {
  // A (izquierda) priority — diff = A - B
  const diff = a - b;
  return { val: Math.abs(diff), dir: diff > 0 ? '↘ BAJA DER' : diff < 0 ? '↗ SUBE DER' : 'NIVEL' };
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

  results.paredIzq = calcDesnivel(pI_A, pI_B);
  results.paredDer = calcDesnivel(pD_A, pD_B);
  results.techo    = calcDesnivel_horiz(t_A, t_B);
  results.piso     = calcDesnivel_horiz(p_A, p_B);

  // live desnivel per-tab
  updateLiveDesnivel('desn-pared-izq', results.paredIzq);
  updateLiveDesnivel('desn-pared-der', results.paredDer);
  updateLiveDesnivel('desn-techo',     results.techo);
  updateLiveDesnivel('desn-piso',      results.piso);
}

function fmtDesnivel(r) {
  if (!r) return '—';
  if (r.val === 0) return 'NIVEL';
  return `${toFracStr(r.val)} ${r.dir}`;
}

function updateLiveDesnivel(elId, r) {
  const el = document.getElementById(elId);
  if (!el) return;
  const text = r ? `DESNIVEL: ${fmtDesnivel(r)}` : 'DESNIVEL: —';
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
  lcdFlicker(document.getElementById('res-techo'),     fmtDesnivel(results.techo));
  lcdFlicker(document.getElementById('res-pared-izq'), fmtDesnivel(results.paredIzq));
  lcdFlicker(document.getElementById('res-pared-der'), fmtDesnivel(results.paredDer));
  lcdFlicker(document.getElementById('res-piso'),      fmtDesnivel(results.piso));

  // area: placeholder until formula confirmed with mom
  const areaEl = document.getElementById('res-area');
  if (areaEl) {
    areaEl.style.opacity = '0.2';
    setTimeout(() => {
      areaEl.textContent = '— × —';
      areaEl.style.opacity = '1';
    }, 300);
  }

  // mark tabs done
  ['pared-izq','pared-der','techo','piso'].forEach(t => {
    document.querySelector(`.tab[data-tab="${t}"]`)?.classList.add('done');
  });
}

// ─── SHARE ─────────────────────────────────────────────────────────────────
function showShare() {
  document.getElementById('share-block')?.classList.remove('hidden');
}

function buildShareText() {
  const notas = document.getElementById('notas-field')?.value?.trim();
  const lines = [
    'NIVELATO — DESCUADRE',
    `TECHO:     ${fmtDesnivel(results.techo)}`,
    `PISO:      ${fmtDesnivel(results.piso)}`,
    `PARED IZQ: ${fmtDesnivel(results.paredIzq)}`,
    `PARED DER: ${fmtDesnivel(results.paredDer)}`,
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
