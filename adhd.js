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

// ─── LCD FLICKER ───────────────────────────────────────────────────────────
// Global flicker: dims element, waits, then sets new text and fades back in.
// Used everywhere so ALL display updates feel like a real LCD screen.
function lcdFlicker(el, newText, delay = 280) {
  if (!el) return;
  el.style.transition = 'opacity 0.08s ease';
  el.style.opacity = '0.1';
  setTimeout(() => {
    el.textContent = newText;
    el.style.transition = 'opacity 0.18s ease';
    el.style.opacity = '1';
  }, delay);
}

// Flicker for desnivel display blocks (slightly different timing for feel)
function lcdFlickerDesnivel(el, newText) {
  if (!el) return;
  el.style.transition = 'opacity 0.06s';
  el.style.opacity = '0.08';
  setTimeout(() => {
    el.textContent = newText;
    el.style.transition = 'opacity 0.22s ease';
    el.style.opacity = '1';
  }, 220);
}

// ─── TAB NAV ───────────────────────────────────────────────────────────────
function goTab(tabId) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));

  const btn = document.querySelector(`.tab[data-tab="${tabId}"]`);
  const sec = document.getElementById(`tab-${tabId}`);
  if (btn) btn.classList.add('active');
  if (sec) sec.classList.add('active');

  // flicker ALL result displays when switching to medidas
  if (tabId === 'medidas') {
    recalcAll();
    renderMedidas();
  }
}

document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => goTab(btn.dataset.tab));
});

// ─── CALCULATIONS ──────────────────────────────────────────────────────────
let results = {};

// walls: A (piso) is priority reference.
// diff = A - B. A > B → ADENTRO. A < B → AFUERA.
function calcDesnivel_wall(a, b) {
  const diff = a - b;
  if (Math.abs(diff) < 0.001) return { val: 0, dir: 'NIVEL', label: 'NIVEL' };
  const val   = Math.abs(diff);
  const dir   = diff > 0 ? 'ADENTRO' : 'AFUERA';
  const label = `${toFracStr(val)} ${dir}`;
  return { val, dir, label };
}

// ceiling/floor: A (izquierda) is priority reference.
// diff = A - B. A > B → BAJA DER. A < B → SUBE DER.
function calcDesnivel_horiz(a, b) {
  const diff = a - b;
  if (Math.abs(diff) < 0.001) return { val: 0, dir: 'NIVEL', label: 'NIVEL' };
  const val   = Math.abs(diff);
  const dir   = diff > 0 ? 'BAJA DER' : 'SUBE DER';
  const label = `${toFracStr(val)} ${dir}`;
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

  // live desnivel flicker on input tabs
  lcdFlickerDesnivel(document.getElementById('desn-pared-izq'),
    `DESNIVEL: ${results.paredIzq.label}`);
  lcdFlickerDesnivel(document.getElementById('desn-pared-der'),
    `DESNIVEL: ${results.paredDer.label}`);
  lcdFlickerDesnivel(document.getElementById('desn-techo'),
    `DESNIVEL: ${results.techo.label}`);
  lcdFlickerDesnivel(document.getElementById('desn-piso'),
    `DESNIVEL: ${results.piso.label}`);
}

// ─── WIRE UP ALL INPUTS ────────────────────────────────────────────────────
function wireInputs() {
  // wire ALL number inputs and selects globally — catches hueco too
  document.addEventListener('input', (e) => {
    const tag = e.target.tagName.toLowerCase();
    if (tag === 'input' || tag === 'select') {
      recalcAll();
      // if medidas tab is active, re-render it too
      if (document.getElementById('tab-medidas')?.classList.contains('active')) {
        renderMedidas();
      }
    }
  });
  document.addEventListener('change', (e) => {
    const tag = e.target.tagName.toLowerCase();
    if (tag === 'input' || tag === 'select') {
      recalcAll();
      if (document.getElementById('tab-medidas')?.classList.contains('active')) {
        renderMedidas();
      }
    }
  });
}

// ─── RENDER MEDIDAS ────────────────────────────────────────────────────────
function renderMedidas() {
  lcdFlicker(document.getElementById('res-techo'),     results.techo?.label    || '—');
  lcdFlicker(document.getElementById('res-piso'),      results.piso?.label     || '—');
  lcdFlicker(document.getElementById('res-pared-izq'), results.paredIzq?.label || '—');
  lcdFlicker(document.getElementById('res-pared-der'), results.paredDer?.label || '—');

  renderHueco();

  ['pared-izq','pared-der','techo','piso'].forEach(t => {
    document.querySelector(`.tab[data-tab="${t}"]`)?.classList.add('done');
  });
}

// ─── HUECO (raw opening) ───────────────────────────────────────────────────
function renderHueco() {
  const ancho  = readVal('hueco-ancho-whole', 'hueco-ancho-frac');
  const alto   = readVal('hueco-alto-whole',  'hueco-alto-frac');
  const areaEl = document.getElementById('res-area');
  if (!areaEl) return;
  const anchoStr = ancho > 0 ? toFracStr(ancho) : '—';
  const altoStr  = alto  > 0 ? toFracStr(alto)  : '—';
  lcdFlicker(areaEl, `${anchoStr} × ${altoStr}`);
}

// ─── SHARE ─────────────────────────────────────────────────────────────────
function showShare() {
  document.getElementById('share-block')?.classList.remove('hidden');
}

function buildShareText() {
  const notas = document.getElementById('notas-field')?.value?.trim();
  const ancho = readVal('hueco-ancho-whole', 'hueco-ancho-frac');
  const alto  = readVal('hueco-alto-whole',  'hueco-alto-frac');
  const lines = [
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
