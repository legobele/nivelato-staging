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

function getLingerView(leavingStep) {
  // Returns a { focusX, focusY, zoom } to hang on after leaving a step,
  // based on which field actually had data entered. Returns null = zoom out normally.
  if (leavingStep === 1) {
    // pared izq: check A (piso = bottom-left) and B (techo = top-left)
    const hasA = readVal('pI-a-whole','pI-a-frac') > 0;
    const hasB = readVal('pI-b-whole','pI-b-frac') > 0;
    if (hasA && hasB) return { focusX: 0.0, focusY: 0.5, zoom: 2.2 }; // full left edge
    if (hasA)         return { focusX: 0.0, focusY: 1.0, zoom: 3.0 }; // bottom-left
    if (hasB)         return { focusX: 0.0, focusY: 0.0, zoom: 3.0 }; // top-left
  }
  if (leavingStep === 2) {
    const hasA = readVal('pD-a-whole','pD-a-frac') > 0;
    const hasB = readVal('pD-b-whole','pD-b-frac') > 0;
    if (hasA && hasB) return { focusX: 1.0, focusY: 0.5, zoom: 2.2 };
    if (hasA)         return { focusX: 1.0, focusY: 1.0, zoom: 3.0 };
    if (hasB)         return { focusX: 1.0, focusY: 0.0, zoom: 3.0 };
  }
  if (leavingStep === 3) {
    const hasA = readVal('t-a-whole','t-a-frac') > 0;
    const hasB = readVal('t-b-whole','t-b-frac') > 0;
    if (hasA && hasB) return { focusX: 0.5, focusY: 0.0, zoom: 2.2 };
    if (hasA)         return { focusX: 0.0, focusY: 0.0, zoom: 3.0 };
    if (hasB)         return { focusX: 1.0, focusY: 0.0, zoom: 3.0 };
  }
  if (leavingStep === 4) {
    const hasA = readVal('p-a-whole','p-a-frac') > 0;
    const hasB = readVal('p-b-whole','p-b-frac') > 0;
    if (hasA && hasB) return { focusX: 0.5, focusY: 1.0, zoom: 2.2 };
    if (hasA)         return { focusX: 0.0, focusY: 1.0, zoom: 3.0 };
    if (hasB)         return { focusX: 1.0, focusY: 1.0, zoom: 3.0 };
  }
  return null;
}

function goStep(n) {
  const leavingStep = currentStep;
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`step-${n}`)?.classList.add('active');
  currentStep = n;
  document.getElementById('step-num').textContent = n;
  const pct = (n / TOTAL_STEPS) * 100;
  document.getElementById('progress-bar').style.width = pct + '%';
  recalcAll();
  if (n === TOTAL_STEPS) renderSummary();

  // if leaving a measurement step that had data, linger on that area briefly
  // then after a delay, animate to the new step's default view
  const linger = getLingerView(leavingStep);
  if (linger && n !== TOTAL_STEPS) {
    // snap to linger view first
    const W  = canvas.width  / window.devicePixelRatio;
    const H  = canvas.height / window.devicePixelRatio;
    const gr = getGlassRect();
    const wx = gr.x + linger.focusX * gr.w;
    const wy = gr.y + linger.focusY * gr.h;
    vpTarget.scale = linger.zoom;
    vpTarget.x = W / 2 - wx * linger.zoom;
    vpTarget.y = H / 2 - wy * linger.zoom;
    if (animFrame) cancelAnimationFrame(animFrame);
    smoothAnimate();
    // then after 800ms, transition to the new step's view
    setTimeout(() => animateCanvas(n), 800);
  } else {
    animateCanvas(n);
  }

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
  { focusX: 0.5, focusY: 0.5, zoom: 0.72 }, // step 0 — hueco, full glass visible
  { focusX: 0.0, focusY: 0.5, zoom: 3.2  }, // step 1 — pared izq, slam into left edge
  { focusX: 1.0, focusY: 0.5, zoom: 3.2  }, // step 2 — pared der, slam into right edge
  { focusX: 0.5, focusY: 0.0, zoom: 3.2  }, // step 3 — techo, slam into top edge
  { focusX: 0.5, focusY: 1.0, zoom: 3.2  }, // step 4 — piso, slam into bottom edge
  { focusX: 0.5, focusY: 0.5, zoom: 0.72 }, // step 5 — summary, full glass again
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
  const W   = canvas.width  / dpr;
  const H   = canvas.height / dpr;

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.translate(vp.x, vp.y);
  ctx.scale(vp.scale, vp.scale);

  const gr  = getGlassRect();
  const sc  = vp.scale;

  // ── read raw values ──
  const ancho  = readVal('hueco-ancho-whole','hueco-ancho-frac') || 0;
  const alto   = readVal('hueco-alto-whole', 'hueco-alto-frac')  || 0;
  const pI_A   = readVal('pI-a-whole','pI-a-frac'); // left wall, bottom measurement
  const pI_B   = readVal('pI-b-whole','pI-b-frac'); // left wall, top measurement
  const pD_A   = readVal('pD-a-whole','pD-a-frac'); // right wall, bottom
  const pD_B   = readVal('pD-b-whole','pD-b-frac'); // right wall, top
  const t_A    = readVal('t-a-whole', 't-a-frac');  // ceiling, left
  const t_B    = readVal('t-b-whole', 't-b-frac');  // ceiling, right
  const p_A    = readVal('p-a-whole', 'p-a-frac');  // floor, left
  const p_B    = readVal('p-b-whole', 'p-b-frac');  // floor, right

  // ── compute pixel offset for each corner based on desnivelation ──
  // For walls: ADENTRO = wall leans in = top corner shifts inward
  //   pI (left wall): diff = pI_A - pI_B. positive = bottom further = top shifts right (inward)
  //   We exaggerate visually by a fixed scale factor
  const EXAG = gr.w * 0.18; // max visual exaggeration = 18% of glass width
  const clamp = (v, lim) => Math.max(-lim, Math.min(lim, v));

  // normalize desnivel relative to overall dimension (or use raw inch ratio)
  // walls: pI_A vs pI_B — difference in inches
  const pIMax = Math.max(pI_A, pI_B, 1);
  const pDMax = Math.max(pD_A, pD_B, 1);
  const tMax  = Math.max(t_A,  t_B,  1);
  const pMax  = Math.max(p_A,  p_B,  1);

  // pixel shifts — positive = outward from glass center
  // left wall: if pI_A > pI_B → bottom is further out → top corner shifts inward (right)
  const pI_shift_top    = clamp(((pI_A - pI_B) / pIMax) * EXAG, EXAG);
  const pI_shift_bottom = 0; // anchor bottom

  // right wall: if pD_A > pD_B → same logic, top shifts inward (left)
  const pD_shift_top    = clamp(-((pD_A - pD_B) / pDMax) * EXAG, EXAG);
  const pD_shift_bottom = 0;

  // ceiling: if t_A > t_B → left side lower → left corner shifts down
  const t_shift_left  = clamp(((t_A - t_B) / tMax) * EXAG * (gr.h / gr.w), EXAG);
  const t_shift_right = 0;

  // floor: if p_A > p_B → left side lower → left corner shifts up
  const p_shift_left  = clamp(-((p_A - p_B) / pMax) * EXAG * (gr.h / gr.w), EXAG);
  const p_shift_right = 0;

  // ── compute the 4 corners of the deformed glass ──
  // corners: TL, TR, BR, BL
  // Left wall controls TL/BL x offset, right wall controls TR/BR x offset
  // Ceiling controls TL/TR y offset, floor controls BL/BR y offset
  const TL = { x: gr.x + pI_shift_top,    y: gr.y + t_shift_left  };
  const TR = { x: gr.x + gr.w + pD_shift_top,    y: gr.y + t_shift_right };
  const BR = { x: gr.x + gr.w + pD_shift_bottom, y: gr.y + gr.h + p_shift_right };
  const BL = { x: gr.x + pI_shift_bottom, y: gr.y + gr.h + p_shift_left };

  // ── draw deformed glass shape ──
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(TL.x, TL.y);
  ctx.lineTo(TR.x, TR.y);
  ctx.lineTo(BR.x, BR.y);
  ctx.lineTo(BL.x, BL.y);
  ctx.closePath();
  ctx.fillStyle = '#e7f5ff';
  ctx.fill();
  ctx.strokeStyle = '#1971c2';
  ctx.lineWidth = 0.8 / sc;
  ctx.stroke();
  ctx.restore();

  // ── draw desnivel arrows on each edge ──
  drawDeformArrow(ctx, BL, TL, pI_shift_top,    'left',   results.paredIzq, sc);
  drawDeformArrow(ctx, TR, BR, pD_shift_top,    'right',  results.paredDer, sc);
  drawDeformArrow(ctx, TL, TR, t_shift_left,    'top',    results.techo,    sc);
  drawDeformArrow(ctx, BL, BR, p_shift_left,    'bottom', results.piso,     sc);

  // ── step highlight (glow on active edge) ──
  drawStepHighlight(ctx, TL, TR, BL, BR, currentStep, sc);

  // ── dimension labels ──
  if (ancho > 0) drawDimLine(ctx, gr.x, gr.y - 22, gr.x + gr.w, gr.y - 22, toFracStr(ancho), sc);
  if (alto  > 0) drawDimLine(ctx, gr.x - 22, gr.y, gr.x - 22, gr.y + gr.h, toFracStr(alto),  sc, true);

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

// drawDeformArrow: draws a perpendicular arrow at the shifted corner showing the desnivel amount
// p1 = anchor corner (no shift), p2 = shifted corner
function drawDeformArrow(ctx, pAnchor, pShifted, shiftPx, side, result, scale) {
  if (!result || result.val === 0) return;
  const COLOR = '#e67700';
  const ARROW_HEAD = 5 / scale;
  const fs = 10 / scale;

  ctx.save();
  ctx.strokeStyle = COLOR;
  ctx.fillStyle   = COLOR;
  ctx.lineWidth   = 1.2 / scale;

  // draw a small perpendicular double-headed arrow at the shifted corner
  // showing the displacement from where the corner would be (straight) to where it is (shifted)
  let ax1, ay1, ax2, ay2; // arrow from "ideal" to "actual" position

  if (side === 'left' || side === 'right') {
    // arrow always at the TOP of the wall edge (min y of the two corners)
    const yTop    = Math.min(pAnchor.y, pShifted.y);
    const xIdeal  = (side === 'left') ? Math.max(pAnchor.x, pShifted.x) - shiftPx
                                      : Math.min(pAnchor.x, pShifted.x) - shiftPx;
    // ideal x = where the top corner would be if perfectly straight (= anchor x)
    const xIdeal2 = (side === 'left') ? pAnchor.x : pAnchor.x;
    ax1 = xIdeal2;        ay1 = yTop;
    ax2 = xIdeal2 + shiftPx; ay2 = yTop;
  } else {
    // techo + piso: arrow at RIGHT edge (max x of the two corners)
    const xRight  = Math.max(pAnchor.x, pShifted.x);
    const yIdeal  = (side === 'top') ? Math.max(pAnchor.y, pShifted.y) - shiftPx
                                     : Math.min(pAnchor.y, pShifted.y) - shiftPx;
    const yIdeal2 = (side === 'top') ? pAnchor.y : pAnchor.y;
    ax1 = xRight; ay1 = yIdeal2;
    ax2 = xRight; ay2 = yIdeal2 + shiftPx;
  }

  // dashed reference line showing the ideal straight edge at that point
  ctx.save();
  ctx.setLineDash([3/scale, 3/scale]);
  ctx.strokeStyle = '#adb5bd';
  ctx.lineWidth = 0.8 / scale;
  ctx.beginPath();
  if (side === 'left' || side === 'right') {
    // vertical dashed line from top anchor down to where bottom anchor is
    ctx.moveTo(ax1, Math.min(pAnchor.y, pShifted.y));
    ctx.lineTo(ax1, Math.max(pAnchor.y, pShifted.y));
  } else {
    // horizontal dashed line from left anchor across to right anchor
    ctx.moveTo(Math.min(pAnchor.x, pShifted.x), ay1);
    ctx.lineTo(Math.max(pAnchor.x, pShifted.x), ay1);
  }
  ctx.stroke();
  ctx.restore();

  // solid arrow from ideal to shifted
  if (Math.abs(shiftPx) > 2 / scale) {
    ctx.beginPath();
    ctx.moveTo(ax1, ay1);
    ctx.lineTo(ax2, ay2);
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 1.5 / scale;
    ctx.stroke();

    // arrowhead at shifted end
    const angle = Math.atan2(ay2 - ay1, ax2 - ax1);
    ctx.beginPath();
    ctx.moveTo(ax2, ay2);
    ctx.lineTo(ax2 - ARROW_HEAD * Math.cos(angle - 0.4), ay2 - ARROW_HEAD * Math.sin(angle - 0.4));
    ctx.lineTo(ax2 - ARROW_HEAD * Math.cos(angle + 0.4), ay2 - ARROW_HEAD * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fillStyle = COLOR;
    ctx.fill();
  }

  // label
  ctx.font = `bold ${fs}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = COLOR;
  const midX = (ax1 + ax2) / 2;
  const midY = (ay1 + ay2) / 2;
  const labelOff = 10 / scale;
  const labelPad = 18 / scale;
  if (side === 'left')   { ctx.textAlign = 'right';  ctx.textBaseline = 'middle'; ctx.fillText(result.label, Math.min(ax1, ax2) - labelPad, midY); }
  if (side === 'right')  { ctx.textAlign = 'left';   ctx.textBaseline = 'middle'; ctx.fillText(result.label, Math.max(ax1, ax2) + labelPad, midY); }
  if (side === 'top')    { ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(result.label, midX, Math.min(ay1, ay2) - labelPad); }
  if (side === 'bottom') { ctx.textAlign = 'center'; ctx.textBaseline = 'top';    ctx.fillText(result.label, midX, Math.max(ay1, ay2) + labelPad); }

  ctx.restore();
}

function drawStepHighlight(ctx, TL, TR, BL, BR, step, scale) {
  if (step === 0 || step === 5) return;
  ctx.save();
  ctx.strokeStyle = '#1971c2';
  ctx.lineWidth = 2 / scale;
  ctx.shadowColor = 'rgba(25, 113, 194, 0.4)';
  ctx.shadowBlur  = 6 / scale;
  ctx.lineCap = 'round';

  ctx.beginPath();
  if (step === 1) { ctx.moveTo(BL.x, BL.y); ctx.lineTo(TL.x, TL.y); } // left edge
  if (step === 2) { ctx.moveTo(TR.x, TR.y); ctx.lineTo(BR.x, BR.y); } // right edge
  if (step === 3) { ctx.moveTo(TL.x, TL.y); ctx.lineTo(TR.x, TR.y); } // top edge
  if (step === 4) { ctx.moveTo(BL.x, BL.y); ctx.lineTo(BR.x, BR.y); } // bottom edge
  ctx.stroke();
  ctx.restore();
}

// ─── PER-FIELD FOCUS VIEWS ───────────────────────────────────────────────
// Each field ID maps to { focusX, focusY, zoom } on the glass rect
const FIELD_VIEWS = {
  // step 1 — pared izquierda
  'pI-a-whole': { focusX: 0.0, focusY: 1.0, zoom: 4.8 }, // bottom-left corner (piso)
  'pI-a-frac':  { focusX: 0.0, focusY: 1.0, zoom: 4.8 },
  'pI-b-whole': { focusX: 0.0, focusY: 0.0, zoom: 4.8 }, // top-left corner (techo)
  'pI-b-frac':  { focusX: 0.0, focusY: 0.0, zoom: 4.8 },
  // step 2 — pared derecha
  'pD-a-whole': { focusX: 1.0, focusY: 1.0, zoom: 4.8 }, // bottom-right corner (piso)
  'pD-a-frac':  { focusX: 1.0, focusY: 1.0, zoom: 4.8 },
  'pD-b-whole': { focusX: 1.0, focusY: 0.0, zoom: 4.8 }, // top-right corner (techo)
  'pD-b-frac':  { focusX: 1.0, focusY: 0.0, zoom: 4.8 },
  // step 3 — techo
  't-a-whole': { focusX: 0.0, focusY: 0.0, zoom: 4.8 }, // top-left
  't-a-frac':  { focusX: 0.0, focusY: 0.0, zoom: 4.8 },
  't-b-whole': { focusX: 1.0, focusY: 0.0, zoom: 4.8 }, // top-right
  't-b-frac':  { focusX: 1.0, focusY: 0.0, zoom: 4.8 },
  // step 4 — piso
  'p-a-whole': { focusX: 0.0, focusY: 1.0, zoom: 4.8 }, // bottom-left
  'p-a-frac':  { focusX: 0.0, focusY: 1.0, zoom: 4.8 },
  'p-b-whole': { focusX: 1.0, focusY: 1.0, zoom: 4.8 }, // bottom-right
  'p-b-frac':  { focusX: 1.0, focusY: 1.0, zoom: 4.8 },
  // step 0 — hueco (center, full view)
  'hueco-ancho-whole': { focusX: 0.5, focusY: 0.5, zoom: 0.72 },
  'hueco-ancho-frac':  { focusX: 0.5, focusY: 0.5, zoom: 0.72 },
  'hueco-alto-whole':  { focusX: 0.5, focusY: 0.5, zoom: 0.72 },
  'hueco-alto-frac':   { focusX: 0.5, focusY: 0.5, zoom: 0.72 },
};

// highlighted field id — used to draw a dot on the canvas
let activeFieldId = null;

function focusField(fieldId) {
  const sv = FIELD_VIEWS[fieldId];
  if (!sv) return;
  activeFieldId = fieldId;
  const W  = canvas.width  / window.devicePixelRatio;
  const H  = canvas.height / window.devicePixelRatio;
  const gr = getGlassRect();
  const wx = gr.x + sv.focusX * gr.w;
  const wy = gr.y + sv.focusY * gr.h;
  vpTarget.scale = sv.zoom;
  vpTarget.x = W / 2 - wx * sv.zoom;
  vpTarget.y = H / 2 - wy * sv.zoom;
  if (animFrame) cancelAnimationFrame(animFrame);
  smoothAnimate();
}

function blurField() {
  activeFieldId = null;
  animateCanvas(currentStep); // snap back to step-level view
}

// ─── WIRE UP INPUTS ────────────────────────────────────────────────────────
document.addEventListener('input',  e => { if (['input','select'].includes(e.target.tagName.toLowerCase())) recalcAll(); });
document.addEventListener('change', e => { if (['input','select'].includes(e.target.tagName.toLowerCase())) recalcAll(); });

document.addEventListener('focusin', e => {
  const id = e.target.id;
  if (FIELD_VIEWS[id]) focusField(id);
});

document.addEventListener('focusout', e => {
  const id = e.target.id;
  if (FIELD_VIEWS[id]) blurField();
});

// mouseenter on input-col cards (hover over whole card = zoom to its region)
document.addEventListener('mouseover', e => {
  const col = e.target.closest('.input-col');
  if (!col) return;
  // find the number input inside to determine which field
  const inp = col.querySelector('input[type="number"]');
  if (inp && FIELD_VIEWS[inp.id]) focusField(inp.id);
});

document.addEventListener('mouseout', e => {
  const col = e.target.closest('.input-col');
  if (!col) return;
  const related = e.relatedTarget;
  if (!related || !col.contains(related)) blurField();
});

window.addEventListener('resize', resizeCanvas);

// ─── INIT ──────────────────────────────────────────────────────────────────
resizeCanvas();
goStep(0);
