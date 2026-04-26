// adhd.js — logic, calculations, LCD lag, share

// ─── LCD LAG ───────────────────────────────────────────────────────────────
// Every input gets a 120ms fake processing delay on value commit
document.querySelectorAll('input[type="number"]').forEach(input => {
  input.addEventListener('change', () => {
    const orig = input.style.opacity;
    input.style.opacity = '0.3';
    setTimeout(() => {
      input.style.opacity = orig || '1';
      recalcAll();
    }, 120);
  });
});

// ─── TAB NAVIGATION ────────────────────────────────────────────────────────
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
  btn.addEventListener('click', () => {
    goTab(btn.dataset.tab);
  });
});

// ─── FRACTION HELPERS ──────────────────────────────────────────────────────
function readFraction(wholeId, numId, denId) {
  const whole = parseFloat(document.getElementById(wholeId)?.value) || 0;
  const num   = parseFloat(document.getElementById(numId)?.value)   || 0;
  const den   = parseFloat(document.getElementById(denId)?.value)   || 1;
  return whole + (den !== 0 ? num / den : 0);
}

// Convert decimal inches to whole + fraction string (denominator up to 16)
function toFractionStr(decimal) {
  if (decimal === 0) return '0"';
  const whole = Math.floor(Math.abs(decimal));
  const frac  = Math.abs(decimal) - whole;

  const denoms = [2, 4, 8, 16];
  let bestNum = 0, bestDen = 1, bestErr = Infinity;
  for (const d of denoms) {
    const n = Math.round(frac * d);
    const err = Math.abs(frac - n / d);
    if (err < bestErr) { bestErr = err; bestNum = n; bestDen = d; }
  }

  // Simplify
  const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
  if (bestNum > 0) {
    const g = gcd(bestNum, bestDen);
    bestNum /= g; bestDen /= g;
  }

  const sign = decimal < 0 ? '-' : '';
  if (bestNum === 0) return `${sign}${whole}"`;
  if (whole === 0)   return `${sign}${bestNum}/${bestDen}"`;
  return `${sign}${whole} ${bestNum}/${bestDen}"`;
}

// ─── CALCULATIONS ──────────────────────────────────────────────────────────
let results = {};

function recalcAll() {
  // PAREDES — LEFT (A=bottom, B=top)
  const A = readFraction('pI-a-whole', 'pI-a-num', 'pI-a-den');
  const B = readFraction('pI-b-whole', 'pI-b-num', 'pI-b-den');
  // PAREDES — RIGHT (C=bottom, D=top)
  const C = readFraction('pD-c-whole', 'pD-c-num', 'pD-c-den');
  const D = readFraction('pD-d-whole', 'pD-d-num', 'pD-d-den');
  // TECHO (a=left, b=right)
  const Ta = readFraction('t-a-whole', 't-a-num', 't-a-den');
  const Tb = readFraction('t-b-whole', 't-b-num', 't-b-den');
  // PISO (e=left, f=right)
  const Pe = readFraction('p-e-whole', 'p-e-num', 'p-e-den');
  const Pf = readFraction('p-f-whole', 'p-f-num', 'p-f-den');
  // AREA
  const areaX = readFraction('area-x-whole', 'area-x-num', 'area-x-den');
  const areaY = readFraction('area-y-whole', 'area-y-num', 'area-y-den');

  // Left wall: A<B → leans left by B-A; A>B → leans right by A-B
  const leftDiff = B - A;
  results.paredIzq = {
    val: Math.abs(leftDiff),
    dir: leftDiff > 0 ? 'IZQ' : leftDiff < 0 ? 'DER' : 'NIVEL'
  };

  // Right wall: C>D → leans left by C-D; C<D → leans right by D-C
  const rightDiff = C - D;
  results.paredDer = {
    val: Math.abs(rightDiff),
    dir: rightDiff > 0 ? 'IZQ' : rightDiff < 0 ? 'DER' : 'NIVEL'
  };

  // Techo: a>b → lower on right; a<b → higher on right
  const techoDiff = Ta - Tb;
  results.techo = {
    val: Math.abs(techoDiff),
    dir: techoDiff > 0 ? '↘ BAJA DER' : techoDiff < 0 ? '↗ SUBE DER' : 'NIVEL'
  };

  // Piso: same logic as techo
  const pisoDiff = Pe - Pf;
  results.piso = {
    val: Math.abs(pisoDiff),
    dir: pisoDiff > 0 ? '↘ BAJA DER' : pisoDiff < 0 ? '↗ SUBE DER' : 'NIVEL'
  };

  results.area = { x: areaX, y: areaY };
}

// ─── RENDER MEDIDAS ────────────────────────────────────────────────────────
function renderMedidas() {
  const fmt = (r) => {
    if (!r || r.val === undefined) return '—';
    if (r.val === 0) return 'NIVEL';
    return `${toFractionStr(r.val)} ${r.dir}`;
  };

  const setLCD = (id, text) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.opacity = '0.2';
    setTimeout(() => {
      el.textContent = text;
      el.style.opacity = '1';
    }, 140);
  };

  setLCD('res-techo',     fmt(results.techo));
  setLCD('res-pared-izq', fmt(results.paredIzq));
  setLCD('res-pared-der', fmt(results.paredDer));
  setLCD('res-piso',      fmt(results.piso));

  const areaEl = document.getElementById('res-area');
  if (areaEl && results.area) {
    areaEl.style.opacity = '0.2';
    setTimeout(() => {
      const x = results.area.x > 0 ? toFractionStr(results.area.x) : '—';
      const y = results.area.y > 0 ? toFractionStr(results.area.y) : '—';
      areaEl.textContent = `${x} × ${y}`;
      areaEl.style.opacity = '1';
    }, 160);
  }

  // mark tabs done
  ['paredes','techo','piso'].forEach(t => {
    document.querySelector(`.tab[data-tab="${t}"]`)?.classList.add('done');
  });
}

// ─── SHARE ─────────────────────────────────────────────────────────────────
function showShare() {
  const block = document.getElementById('share-block');
  if (block) block.classList.remove('hidden');
}

async function captureScreenshot() {
  // Use html2canvas if available, otherwise fall back to share sheet
  if (typeof html2canvas !== 'undefined') {
    const el = document.getElementById('tab-medidas');
    const canvas = await html2canvas(el, {
      backgroundColor: '#0a0a0a',
      scale: 2
    });
    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  }
  return null;
}

function buildShareText() {
  const notas = document.getElementById('notas-field')?.value?.trim();
  const area = results.area
    ? `${toFractionStr(results.area.x)} × ${toFractionStr(results.area.y)}`
    : '—';

  const lines = [
    '📐 DESCUADRE',
    `ÁREA: ${area}`,
    `TECHO:      ${results.techo    ? (results.techo.val    === 0 ? 'NIVEL' : toFractionStr(results.techo.val)    + ' ' + results.techo.dir)    : '—'}`,
    `PISO:       ${results.piso     ? (results.piso.val     === 0 ? 'NIVEL' : toFractionStr(results.piso.val)     + ' ' + results.piso.dir)     : '—'}`,
    `PARED IZQ:  ${results.paredIzq ? (results.paredIzq.val === 0 ? 'NIVEL' : toFractionStr(results.paredIzq.val) + ' ' + results.paredIzq.dir) : '—'}`,
    `PARED DER:  ${results.paredDer ? (results.paredDer.val === 0 ? 'NIVEL' : toFractionStr(results.paredDer.val) + ' ' + results.paredDer.dir) : '—'}`,
  ];
  if (notas) lines.push(`NOTAS: ${notas}`);
  return lines.join('\n');
}

async function shareViaSMS() {
  const text = encodeURIComponent(buildShareText());
  // SMS uri — works on iOS and Android
  window.location.href = `sms:?body=${text}`;
}

async function shareViaWhatsApp() {
  const text = encodeURIComponent(buildShareText());
  // WhatsApp deep link
  window.open(`https://wa.me/?text=${text}`, '_blank');
}

// ─── INIT ──────────────────────────────────────────────────────────────────
recalcAll();
