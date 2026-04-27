// adhd.js — Nivelato logic + canvas engine

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
  if (sixteenths === 0)  return `${sign}${whole}"`;
  if (sixteenths === 16) return `${sign}${whole + 1}"`;
  const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
  const g = gcd(sixteenths, 16);
  const n = sixteenths / g, d = 16 / g;
  if (whole === 0) return `${sign}${n}/${d}"`;
  return `${sign}${whole} ${n}/${d}"`;
}

// ─── STEP STATE ────────────────────────────────────────────────────────────
let currentStep = 0;
const TOTAL_STEPS = 5;

function goStep(n) {
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`step-${n}`)?.classList.add('active');
  currentStep = n;
  document.getElementById('step-num').textContent = n;
  const pct = (n / TOTAL_STEPS) * 100;
  document.getElementById('progress-bar').style.width = pct + '%';
  recalcAll();
  if (n === TOTAL_STEPS) renderSummary();
  animateCanvas(n);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function nextStep() { if (currentStep < TOTAL_STEPS) goStep(currentStep + 1); }
function prevStep() { if (currentStep > 0)           goStep(currentStep - 1); }

// ─── CALCULATIONS ──────────────────────────────────────────────────────────
let results = {};

function calcDesnivel_wall(a, b) {
  const diff = a - b;
  if (Math.abs(diff) < 0.001) return { val: 0, dir: 'NIVEL', label: 'Nivel', raw: 0 };
  const val = Math.abs(diff);
  const dir = diff > 0 ? 'ADENTRO' : 'AFUERA';
  return { val, dir, label: `${toFracStr(val)} ${dir}`, raw: diff };
}

function calcDesnivel_horiz(a, b) {
  const diff = a - b;
  if (Math.abs(diff) < 0.001) return { val: 0, dir: 'NIVEL', label: 'Nivel', raw: 0 };
  const val = Math.abs(diff);
  const dir = diff > 0 ? 'BAJA DER' : 'SUBE DER';
  return { val, dir, label: `${toFracStr(val)} ${dir}`, raw: diff };
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

  updatePill('desn-pared-izq', results.paredIzq);
  updatePill('desn-pared-der', results.paredDer);
  updatePill('desn-techo',     results.techo);
  updatePill('desn-piso',      results.piso);

  drawCanvas();
}

function updatePill(id, result) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = result.label;
  if (result.val > 0) el.classList.add('has-value');
  else el.classList.remove('has-value');
}

// ─── VALIDATION ────────────────────────────────────────────────────────────
const TOLERANCE = 0.0625;

function runValidation() {
  const warnings = [];
  const pI_A = readVal('pI-a-whole','pI-a-frac'), pI_B = readVal('pI-b-whole','pI-b-frac');
  const pD_A = readVal('pD-a-whole','pD-a-frac'), pD_B = readVal('pD-b-whole','pD-b-frac');
  const t_A  = readVal('t-a-whole', 't-a-frac'),  t_B  = readVal('t-b-whole', 't-b-frac');
  const p_A  = readVal('p-a-whole', 'p-a-frac'),  p_B  = readVal('p-b-whole', 'p-b-frac');
  const ancho = readVal('hueco-ancho-whole','hueco-ancho-frac');
  const alto  = readVal('hueco-alto-whole', 'hueco-alto-frac');
  const anyEntered = pI_A||pI_B||pD_A||pD_B||t_A||t_B||p_A||p_B;
  if (!anyEntered) return [];

  if (alto > 0 && (pI_A > 0||pI_B > 0) && (pD_A > 0||pD_B > 0)) {
    const netIzq = alto - (pI_A - pI_B);
    const netDer = alto - (pD_A - pD_B);
    if (Math.abs(netIzq - netDer) > TOLERANCE)
      warnings.push(`Paredes no cuadran (dif: ${toFracStr(Math.abs(netIzq - netDer))})`);
  }
  if (ancho > 0 && (t_A > 0||t_B > 0) && (p_A > 0||p_B > 0)) {
    const netT = ancho - (t_A - t_B);
    const netP = ancho - (p_A - p_B);
    if (Math.abs(netT - netP) > TOLERANCE)
      warnings.push(`Techo/Piso no cuadran (dif: ${toFracStr(Math.abs(netT - netP))})`);
  }
  if ((pI_A||pI_B||pD_A||pD_B||p_A||p_B) && t_A === 0 && t_B === 0)
    warnings.push('Faltan niveles de techo');
  if (anyEntered && (ancho === 0 || alto === 0))
    warnings.push('Falta medida del hueco');
  return warnings;
}

function renderValidation() {
  const el = document.getElementById('validation-block');
  if (!el) return;
  const warnings = runValidation();
  if (warnings.length === 0) {
    el.textContent = '✓ Medidas OK';
    el.className = 'val-ok';
  } else {
    el.innerHTML = warnings.map(w => `⚠ ${w}`).join('<br>');
    el.className = 'val-warn';
  }
}

// ─── SUMMARY ───────────────────────────────────────────────────────────────
function renderSummary() {
  const ancho = readVal('hueco-ancho-whole','hueco-ancho-frac');
  const alto  = readVal('hueco-alto-whole', 'hueco-alto-frac');
  const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  set('res-area',      `${ancho > 0 ? toFracStr(ancho) : '—'} × ${alto > 0 ? toFracStr(alto) : '—'}`);
  set('res-pared-izq', results.paredIzq?.label || '—');
  set('res-pared-der', results.paredDer?.label || '—');
  set('res-techo',     results.techo?.label    || '—');
  set('res-piso',      results.piso?.label     || '—');
  renderValidation();
}

// ─── SHARE ─────────────────────────────────────────────────────────────────
function showShare() {
  const warnings = runValidation();
  if (warnings.length > 0) {
    const ok = confirm('Hay advertencias en las medidas:\n\n' + warnings.join('\n') + '\n\n¿Continuar de todas formas?');
    if (!ok) return;
  }
  document.getElementById('share-block')?.classList.remove('hidden');
}

function buildShareText() {
  const notas    = document.getElementById('notas-field')?.value?.trim();
  const ancho    = readVal('hueco-ancho-whole','hueco-ancho-frac');
  const alto     = readVal('hueco-alto-whole', 'hueco-alto-frac');
  const warnings = runValidation();
  const lines = [
    'NIVELATO — MEDIDAS',
    `HUECO:     ${ancho > 0 ? toFracStr(ancho) : '—'} × ${alto > 0 ? toFracStr(alto) : '—'}`,
    '─────────────────',
    `TECHO:     ${results.techo?.label    || '—'}`,
    `PISO:      ${results.piso?.label     || '—'}`,
    `PARED IZQ: ${results.paredIzq?.label || '—'}`,
    `PARED DER: ${results.paredDer?.label || '—'}`,
  ];
  if (warnings.length > 0) { lines.push('─────────────────'); warnings.forEach(w => lines.push(`⚠ ${w}`)); }
  if (notas) lines.push(`NOTAS: ${notas}`);
  return lines.join('\n');
}

function shareViaSMS()      { window.location.href = `sms:?body=${encodeURIComponent(buildShareText())}`; }
function shareViaWhatsApp() { window.open(`https://wa.me/?text=${encodeURIComponent(buildShareText())}`, '_blank'); }

// ─── CANVAS ENGINE ─────────────────────────────────────────────────────────
const canvas  = document.getElementById('drawing-canvas');
const ctx     = canvas.getContext('2d');

// viewport state — animated
let vp = { x: 0, y: 0, scale: 1 };
let vpTarget = { x: 0, y: 0, scale: 1 };
let animFrame = null;

function resizeCanvas() {
  const wrap = document.getElementById('canvas-wrap');
  canvas.width  = wrap.offsetWidth  * window.devicePixelRatio;
  canvas.height = wrap.offsetHeight * window.devicePixelRatio;
  canvas.style.width  = wrap.offsetWidth  + 'px';
  canvas.style.height = wrap.offsetHeight + 'px';
  drawCanvas();
}

// Per-step viewport targets: { focusX, focusY, zoom }
// focusX/Y = 0..1 relative to the glass rect (0,0 = top-left, 1,1 = bottom-right)
const STEP_VIEWS = [
  { focusX: 0.5, focusY: 0.5, zoom: 0.75 }, // step 0 — hueco, full view slightly smaller
  { focusX: 0.0, focusY: 0.5, zoom: 1.3  }, // step 1 — pared izq, zoom left
  { focusX: 1.0, focusY: 0.5, zoom: 1.3  }, // step 2 — pared der, zoom right
  { focusX: 0.5, focusY: 0.0, zoom: 1.3  }, // step 3 — techo, zoom top
  { focusX: 0.5, focusY: 1.0, zoom: 1.3  }, // step 4 — piso, zoom bottom
  { focusX: 0.5, focusY: 0.5, zoom: 0.82 }, // step 5 — summary, full view
];

function getGlassRect() {
  // Glass rect in logical canvas coords (before devicePixelRatio)
  const W = canvas.width  / window.devicePixelRatio;
  const H = canvas.height / window.devicePixelRatio;
  const ancho = readVal('hueco-ancho-whole','hueco-ancho-frac') || 48;
  const alto  = readVal('hueco-alto-whole', 'hueco-alto-frac')  || 36;
  const aspect = ancho / alto;
  const padding = 60;
  let gW = W - padding * 2;
  let gH = gW / aspect;
  if (gH > H - padding * 2) { gH = H - padding * 2; gW = gH * aspect; }
  const gX = (W - gW) / 2;
  const gY = (H - gH) / 2;
  return { x: gX, y: gY, w: gW, h: gH };
}

function animateCanvas(step) {
  const sv  = STEP_VIEWS[step] || STEP_VIEWS[0];
  const W   = canvas.width  / window.devicePixelRatio;
  const H   = canvas.height / window.devicePixelRatio;
  const gr  = getGlassRect();

  // world point to focus on
  const wx = gr.x + sv.focusX * gr.w;
  const wy = gr.y + sv.focusY * gr.h;

  vpTarget.scale = sv.zoom;
  vpTarget.x = W / 2 - wx * sv.zoom;
  vpTarget.y = H / 2 - wy * sv.zoom;

  if (animFrame) cancelAnimationFrame(animFrame);
  smoothAnimate();
}

function smoothAnimate() {
  const ease = 0.1;
  vp.x     += (vpTarget.x     - vp.x)     * ease;
  vp.y     += (vpTarget.y     - vp.y)     * ease;
  vp.scale += (vpTarget.scale - vp.scale) * ease;

  drawCanvas();

  const dx = Math.abs(vp.x - vpTarget.x);
  const dy = Math.abs(vp.y - vpTarget.y);
  const ds = Math.abs(vp.scale - vpTarget.scale);
  if (dx > 0.1 || dy > 0.1 || ds > 0.001) {
    animFrame = requestAnimationFrame(smoothAnimate);
  } else {
    vp.x = vpTarget.x; vp.y = vpTarget.y; vp.scale = vpTarget.scale;
    drawCanvas();
  }
}

function drawCanvas() {
  const dpr = window.devicePixelRatio;
  const CW  = canvas.width;
  const CH  = canvas.height;
  const W   = CW / dpr;
  const H   = CH / dpr;

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  // background
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(0, 0, W, H);

  // apply viewport transform
  ctx.save();
  ctx.translate(vp.x, vp.y);
  ctx.scale(vp.scale, vp.scale);

  const gr = getGlassRect();

  // ── glass rectangle ──
  ctx.fillStyle = '#e7f5ff';
  ctx.strokeStyle = '#1971c2';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(gr.x, gr.y, gr.w, gr.h);
  ctx.fill();
  ctx.stroke();

  // ── dimension labels (hueco) ──
  const ancho = readVal('hueco-ancho-whole','hueco-ancho-frac');
  const alto  = readVal('hueco-alto-whole', 'hueco-alto-frac');

  ctx.fillStyle = '#495057';
  ctx.font = `${13 / vp.scale}px Inter, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  if (ancho > 0) {
    drawDimLine(ctx, gr.x, gr.y - 22, gr.x + gr.w, gr.y - 22, toFracStr(ancho), vp.scale);
  }
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  if (alto > 0) {
    drawDimLine(ctx, gr.x - 22, gr.y, gr.x - 22, gr.y + gr.h, toFracStr(alto), vp.scale, true);
  }

  // ── desnivel markers ──
  drawDesnivelMarkers(ctx, gr, vp.scale);

  // ── step highlight ──
  drawStepHighlight(ctx, gr, currentStep, vp.scale);

  ctx.restore();
  ctx.restore();
}

function drawDimLine(ctx, x1, y1, x2, y2, label, scale, vertical = false) {
  const tickLen = 6 / scale;
  ctx.save();
  ctx.strokeStyle = '#adb5bd';
  ctx.lineWidth = 1 / scale;
  ctx.setLineDash([3 / scale, 3 / scale]);
  ctx.beginPath();
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  // ticks
  if (!vertical) {
    ctx.beginPath(); ctx.moveTo(x1, y1 - tickLen); ctx.lineTo(x1, y1 + tickLen); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2, y2 - tickLen); ctx.lineTo(x2, y2 + tickLen); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(x1 - tickLen, y1); ctx.lineTo(x1 + tickLen, y1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2 - tickLen, y2); ctx.lineTo(x2 + tickLen, y2); ctx.stroke();
  }
  ctx.fillStyle = '#495057';
  ctx.font = `bold ${12 / scale}px Inter, system-ui, sans-serif`;
  if (!vertical) {
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(label, (x1 + x2) / 2, y1 - 2 / scale);
  } else {
    ctx.save(); ctx.translate((x1 + x2) / 2, (y1 + y2) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(label, 0, -2 / scale);
    ctx.restore();
  }
  ctx.restore();
}

function drawDesnivelMarkers(ctx, gr, scale) {
  const COLORS = { ok: '#2f9e44', warn: '#e67700' };
  const fs = 11 / scale;

  // Pared Izquierda — left edge
  if (results.paredIzq && results.paredIzq.val > 0) {
    drawEdgeMarker(ctx, gr.x, gr.y, gr.x, gr.y + gr.h,
      results.paredIzq.label, 'left', scale, COLORS.ok);
  }
  // Pared Derecha — right edge
  if (results.paredDer && results.paredDer.val > 0) {
    drawEdgeMarker(ctx, gr.x + gr.w, gr.y, gr.x + gr.w, gr.y + gr.h,
      results.paredDer.label, 'right', scale, COLORS.ok);
  }
  // Techo — top edge
  if (results.techo && results.techo.val > 0) {
    drawEdgeMarker(ctx, gr.x, gr.y, gr.x + gr.w, gr.y,
      results.techo.label, 'top', scale, COLORS.ok);
  }
  // Piso — bottom edge
  if (results.piso && results.piso.val > 0) {
    drawEdgeMarker(ctx, gr.x, gr.y + gr.h, gr.x + gr.w, gr.y + gr.h,
      results.piso.label, 'bottom', scale, COLORS.ok);
  }
}

function drawEdgeMarker(ctx, x1, y1, x2, y2, label, side, scale, color) {
  const offset = 18 / scale;
  const fs     = 10 / scale;
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `600 ${fs}px Inter, system-ui, sans-serif`;

  let tx, ty;
  if (side === 'left')   { tx = x1 - offset; ty = (y1 + y2) / 2; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; }
  if (side === 'right')  { tx = x1 + offset; ty = (y1 + y2) / 2; ctx.textAlign = 'left';  ctx.textBaseline = 'middle'; }
  if (side === 'top')    { tx = (x1 + x2) / 2; ty = y1 - offset; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; }
  if (side === 'bottom') { tx = (x1 + x2) / 2; ty = y1 + offset; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; }

  // arrow indicator
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5 / scale;
  ctx.beginPath();
  if (side === 'left')   { ctx.moveTo(x1, (y1+y2)/2); ctx.lineTo(tx + 4/scale, ty); }
  if (side === 'right')  { ctx.moveTo(x1, (y1+y2)/2); ctx.lineTo(tx - 4/scale, ty); }
  if (side === 'top')    { ctx.moveTo((x1+x2)/2, y1); ctx.lineTo(tx, ty + 4/scale); }
  if (side === 'bottom') { ctx.moveTo((x1+x2)/2, y1); ctx.lineTo(tx, ty - 4/scale); }
  ctx.stroke();

  ctx.fillText(label, tx, ty);
  ctx.restore();
}

function drawStepHighlight(ctx, gr, step, scale) {
  if (step === 0 || step === 5) return;
  ctx.save();
  ctx.strokeStyle = '#1971c2';
  ctx.lineWidth = 3 / scale;
  ctx.shadowColor = 'rgba(25, 113, 194, 0.35)';
  ctx.shadowBlur  = 8 / scale;
  const pad = 4 / scale;

  ctx.beginPath();
  if (step === 1) { // pared izq — left edge
    ctx.moveTo(gr.x - pad, gr.y - pad);
    ctx.lineTo(gr.x - pad, gr.y + gr.h + pad);
  } else if (step === 2) { // pared der — right edge
    ctx.moveTo(gr.x + gr.w + pad, gr.y - pad);
    ctx.lineTo(gr.x + gr.w + pad, gr.y + gr.h + pad);
  } else if (step === 3) { // techo — top edge
    ctx.moveTo(gr.x - pad, gr.y - pad);
    ctx.lineTo(gr.x + gr.w + pad, gr.y - pad);
  } else if (step === 4) { // piso — bottom edge
    ctx.moveTo(gr.x - pad, gr.y + gr.h + pad);
    ctx.lineTo(gr.x + gr.w + pad, gr.y + gr.h + pad);
  }
  ctx.stroke();
  ctx.restore();
}

// ─── WIRE UP INPUTS ────────────────────────────────────────────────────────
document.addEventListener('input',  e => { if (['input','select'].includes(e.target.tagName.toLowerCase())) recalcAll(); });
document.addEventListener('change', e => { if (['input','select'].includes(e.target.tagName.toLowerCase())) recalcAll(); });
window.addEventListener('resize', resizeCanvas);

// ─── INIT ──────────────────────────────────────────────────────────────────
resizeCanvas();
goStep(0);
