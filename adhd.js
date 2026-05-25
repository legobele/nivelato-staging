// adhd.js — Nivelato logic + canvas engine

// ─── FRACTION HELPERS ──────────────────────────────────────────────────────
function readVal(wholeId, fracId) {
  const whole = parseFloat(document.getElementById(wholeId)?.value) || 0;
  const frac  = parseFloat(document.getElementById(fracId)?.value)  || 0;
  return whole + frac;
}

function setVal(wholeId, fracId, decimal) {
  const whole = Math.floor(Math.abs(decimal));
  const frac  = Math.abs(decimal) - whole;
  const sixteenths = Math.round(frac * 16);
  const fracVal = sixteenths / 16;
  const wholeEl = document.getElementById(wholeId);
  const fracEl = document.getElementById(fracId);
  if (wholeEl) wholeEl.value = whole || '';
  if (fracEl) {
    // Find the closest fraction option
    const options = Array.from(fracEl.options);
    let closest = options[0];
    let minDiff = Infinity;
    for (const opt of options) {
      const v = parseFloat(opt.value);
      const diff = Math.abs(v - fracVal);
      if (diff < minDiff) { minDiff = diff; closest = opt; }
    }
    fracEl.value = closest.value;
  }
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
let _historyPushed = 0; // track how many history entries we pushed

function getLingerView(leavingStep) {
  if (leavingStep === 1) {
    const hasA = readVal('pI-a-whole','pI-a-frac') > 0;
    const hasB = readVal('pI-b-whole','pI-b-frac') > 0;
    if (hasA && hasB) return { focusX: 0.0, focusY: 0.5, zoom: 2.2 };
    if (hasA)         return { focusX: 0.0, focusY: 1.0, zoom: 3.0 };
    if (hasB)         return { focusX: 0.0, focusY: 0.0, zoom: 3.0 };
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

function goStep(n, skipHistory = false) {
  const leavingStep = currentStep;
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`step-${n}`)?.classList.add('active');
  currentStep = n;
  document.getElementById('step-num').textContent = n;
  const pct = (n / TOTAL_STEPS) * 100;
  document.getElementById('progress-bar').style.width = pct + '%';
  recalcAll();
  if (n === TOTAL_STEPS) renderSummary();

  // Push history state for back button support
  if (!skipHistory) {
    history.pushState({ step: n }, '', `#step-${n}`);
    _historyPushed++;
  }

  const linger = getLingerView(leavingStep);
  if (linger && n !== TOTAL_STEPS && !userZoomed) {
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
    setTimeout(() => animateCanvas(n), 800);
  } else {
    if (!userZoomed) animateCanvas(n);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function nextStep() {
  if (currentStep < TOTAL_STEPS) goStep(currentStep + 1);
}

function prevStep() {
  if (currentStep > 0) goStep(currentStep - 1);
}

// Handle browser back/forward buttons
window.addEventListener('popstate', (e) => {
  // If there's a state with step info, navigate to it
  if (e.state && typeof e.state.step === 'number') {
    const targetStep = e.state.step;
    if (targetStep >= 0 && targetStep <= TOTAL_STEPS && targetStep !== currentStep) {
      // Don't push history again when handling popstate
      document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
      document.getElementById(`step-${targetStep}`)?.classList.add('active');
      currentStep = targetStep;
      document.getElementById('step-num').textContent = targetStep;
      const pct = (targetStep / TOTAL_STEPS) * 100;
      document.getElementById('progress-bar').style.width = pct + '%';
      recalcAll();
      if (targetStep === TOTAL_STEPS) renderSummary();
      if (!userZoomed) animateCanvas(targetStep);
    }
  }
});

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
  const dir = diff > 0 ? 'SUBE DER' : 'BAJA DER';
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

  // Calculate derived hueco measurements from base + desniveles
  calcDerivedHueco();

  showDerivedNote('derived-pared-der-note', results.paredIzq, results.paredDer,
    'pD-a-whole', 'pD-b-whole');
  showDerivedNote('derived-piso-note', results.techo, results.piso,
    'p-a-whole', 'p-b-whole');

  drawCanvas();
}

// NEW: Calculate top width and right height from base measurements + desniveles
function calcDerivedHueco() {
  const anchoBot = readVal('hueco-ancho-bot-whole', 'hueco-ancho-bot-frac');
  const altoIzq  = readVal('hueco-alto-izq-whole', 'hueco-alto-izq-frac');
  const pI_A = readVal('pI-a-whole', 'pI-a-frac');
  const pI_B = readVal('pI-b-whole', 'pI-b-frac');
  const pD_A = readVal('pD-a-whole', 'pD-a-frac');
  const pD_B = readVal('pD-b-whole', 'pD-b-frac');
  const t_A  = readVal('t-a-whole',  't-a-frac');
  const t_B  = readVal('t-b-whole',  't-b-frac');
  const p_A  = readVal('p-a-whole',  'p-a-frac');
  const p_B  = readVal('p-b-whole',  'p-b-frac');

  // Only calculate if we have base measurements
  if (anchoBot <= 0 || altoIzq <= 0) return;

  let anchoTop = anchoBot;
  let altoDer = altoIzq;

  // Adjust top width based on wall desniveles
  // If left wall leans in (ADENTRO = pI_A > pI_B), top is narrower
  // If right wall leans in (ADENTRO = pD_A > pD_B), top is narrower
  if (pI_A > 0 && pI_B > 0) {
    const pI_raw = pI_A - pI_B; // positive = adentro = top shifts right = width decreases
    anchoTop -= pI_raw;
  }
  if (pD_A > 0 && pD_B > 0) {
    const pD_raw = pD_A - pD_B; // positive = adentro = top shifts left = width decreases
    anchoTop -= pD_raw;
  }

  // Adjust right height based on ceiling/floor desniveles
  // If ceiling slopes down right (t_A > t_B = SUBE DER), right side is lower = taller
  // If floor slopes down right (p_A > p_B = BAJA DER), right side is lower = taller... wait
  // t_A = laser-to-ceiling-left, t_B = laser-to-ceiling-right
  // t_A > t_B means left ceiling is further = left side is lower = right side is higher = right height is SHORTER
  if (t_A > 0 && t_B > 0) {
    const t_raw = t_A - t_B; // positive = left lower = right higher = right height decreases
    altoDer -= t_raw;
  }
  if (p_A > 0 && p_B > 0) {
    const p_raw = p_A - p_B; // positive = left lower = right higher = right height decreases... wait
    // p_A = laser-to-floor-left, p_B = laser-to-floor-right
    // p_A > p_B means left floor is further = left side is higher = right side is lower = right height SHORTER
    altoDer -= p_raw;
  }

  // Update the calculated fields
  if (anchoTop > 0) setVal('hueco-ancho-top-whole', 'hueco-ancho-top-frac', anchoTop);
  if (altoDer > 0) setVal('hueco-alto-der-whole', 'hueco-alto-der-frac', altoDer);

  // Show note about derived values
  const noteEl = document.getElementById('derived-hueco-note');
  if (noteEl) {
    const hasAnyDesnivel = (pI_A > 0 && pI_B > 0) || (pD_A > 0 && pD_B > 0) || (t_A > 0 && t_B > 0) || (p_A > 0 && p_B > 0);
    if (hasAnyDesnivel) {
      noteEl.style.display = 'block';
      noteEl.innerHTML = `Ancho arriba: <strong>${toFracStr(anchoTop)}"</strong> · Alto derecha: <strong>${toFracStr(altoDer)}"</strong> (calculado)`;
    } else {
      noteEl.style.display = 'none';
    }
  }
}

function autofillFromReference(aId, bId, referenceResult) {
  const aEl = document.getElementById(aId);
  const bEl = document.getElementById(bId);
  const aFracEl = document.getElementById(aId.replace('whole','frac'));
  const bFracEl = document.getElementById(bId.replace('whole','frac'));
  if (!aEl || !bEl) return;
  const aVal = readVal(aId, aId.replace('whole','frac'));
  const bVal = readVal(bId, bId.replace('whole','frac'));
  if (aVal > 0 || bVal > 0) return;
  if (!referenceResult || referenceResult.val === 0) return;
  const whole = Math.floor(referenceResult.val);
  const frac  = referenceResult.val - whole;
  const fracStr = frac < 0.001 ? '0' : frac < 0.14 ? '1/8' : frac < 0.2 ? '3/16' :
                  frac < 0.27 ? '1/4' : frac < 0.39 ? '3/8' : frac < 0.52 ? '1/2' :
                  frac < 0.64 ? '5/8' : frac < 0.77 ? '3/4' : frac < 0.89 ? '7/8' : '0';
  aEl.value = whole || '';
  if (aFracEl) aFracEl.value = fracStr;
  bEl.value = '';
  if (bFracEl) bFracEl.value = '0';
}

function showDerivedNote(noteId, referenceResult, actualResult, aId, bId) {
  const el = document.getElementById(noteId);
  if (!el) return;
  const aVal = readVal(aId, aId.replace('whole','frac'));
  const bVal = readVal(bId, bId.replace('whole','frac'));
  const hasBoth = aVal > 0 && bVal > 0;
  if (referenceResult && referenceResult.val > 0 && !hasBoth) {
    autofillFromReference(aId, bId, referenceResult);
    el.style.display = 'block';
    el.innerHTML = '⟳ Autocompletado desde el opuesto: <strong>' + referenceResult.label + '</strong> — confirma con láser antes de continuar';
  } else {
    el.style.display = 'none';
  }
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
  const anchoBot = readVal('hueco-ancho-bot-whole','hueco-ancho-bot-frac');
  const altoIzq  = readVal('hueco-alto-izq-whole', 'hueco-alto-izq-frac');
  const anchoTop = readVal('hueco-ancho-top-whole','hueco-ancho-top-frac');
  const altoDer  = readVal('hueco-alto-der-whole', 'hueco-alto-der-frac');
  const anyEntered = pI_A||pI_B||pD_A||pD_B||t_A||t_B||p_A||p_B;
  if (!anyEntered) return [];

  if ((pI_A > 0||pI_B > 0) && (pD_A > 0||pD_B > 0)) {
    const offsetIzq = pI_A - pI_B;
    const offsetDer = pD_A - pD_B;
    if (Math.abs(offsetIzq - offsetDer) > TOLERANCE)
      warnings.push(`⚠ Paredes no cuadran — diferencia: ${toFracStr(Math.abs(offsetIzq - offsetDer))}" → revisa que ambas paredes tengan el mismo desnivel, o verifica los puntos A/B`);
  }
  if ((t_A > 0||t_B > 0) && (p_A > 0||p_B > 0)) {
    const offsetTecho = t_A - t_B;
    const offsetPiso  = p_A - p_B;
    if (Math.abs(offsetTecho - offsetPiso) > TOLERANCE)
      warnings.push(`⚠ Arriba/Abajo no cuadran — diferencia: ${toFracStr(Math.abs(offsetTecho - offsetPiso))}" → vuelve a medir arriba y abajo en los mismos puntos de referencia`);
  }
  if ((pI_A||pI_B||pD_A||pD_B||p_A||p_B) && t_A === 0 && t_B === 0)
    warnings.push('⚠ Faltan niveles de arriba — mide del láser arriba en punto A (izq) y punto B (der)');
  if (anyEntered && (anchoBot === 0 || altoIzq === 0))
    warnings.push('⚠ Falta medida base del hueco — ingresa Ancho Abajo y Alto Izquierda');
  return warnings;
}

// ─── AUTO-FIX ACTIONS ──────────────────────────────────────────────────────
function autoFix(warningText) {
  if (warningText.includes('Paredes no cuadran')) {
    const pI_A = readVal('pI-a-whole','pI-a-frac');
    const pI_B = readVal('pI-b-whole','pI-b-frac');
    const raw   = pI_A - pI_B;
    const pD_A  = document.getElementById('pD-a-whole');
    const pD_B  = document.getElementById('pD-b-whole');
    if (pD_A && pD_B) {
      const absRaw = Math.abs(raw);
      const whole  = Math.floor(absRaw);
      const frac   = absRaw - whole;
      const fracStr = frac < 0.001 ? '0' : frac < 0.14 ? '1/8' : frac < 0.2 ? '3/16' :
                      frac < 0.27 ? '1/4' : frac < 0.39 ? '3/8' : frac < 0.52 ? '1/2' :
                      frac < 0.64 ? '5/8' : frac < 0.77 ? '3/4' : frac < 0.89 ? '7/8' : '0';
      pD_A.value = whole || '';
      pD_B.value = '';
      document.getElementById('pD-a-frac').value = fracStr;
      document.getElementById('pD-b-frac').value = '0';
      recalcAll();
      goStep(2);
    }
    return;
  }
  if (warningText.includes('Arriba/Abajo no cuadran')) {
    const t_A = readVal('t-a-whole','t-a-frac');
    const t_B = readVal('t-b-whole','t-b-frac');
    const raw  = t_A - t_B;
    const pA   = document.getElementById('p-a-whole');
    const pB   = document.getElementById('p-b-whole');
    if (pA && pB) {
      const absRaw = Math.abs(raw);
      const whole  = Math.floor(absRaw);
      const frac   = absRaw - whole;
      const fracStr = frac < 0.001 ? '0' : frac < 0.14 ? '1/8' : frac < 0.2 ? '3/16' :
                      frac < 0.27 ? '1/4' : frac < 0.39 ? '3/8' : frac < 0.52 ? '1/2' :
                      frac < 0.64 ? '5/8' : frac < 0.77 ? '3/4' : frac < 0.89 ? '7/8' : '0';
      pA.value = whole || '';
      pB.value = '';
      document.getElementById('p-a-frac').value = fracStr;
      document.getElementById('p-b-frac').value = '0';
      recalcAll();
      goStep(4);
    }
    return;
  }
  if (warningText.includes('Faltan niveles de arriba')) {
    goStep(3);
    return;
  }
  if (warningText.includes('Falta medida base')) {
    goStep(0);
    return;
  }
}

let _lastWarnings = [];

function renderValidation() {
  const el = document.getElementById('validation-block');
  if (!el) return;
  const warnings = runValidation();
  _lastWarnings = warnings;
  if (warnings.length === 0) {
    el.textContent = '✓ Medidas OK';
    el.className = 'val-ok';
  } else {
    el.innerHTML = warnings.map((w, i) =>
      `<div style="margin-bottom:6px">${w} <button data-widx="${i}" class="arreglar-btn" style="margin-left:8px;padding:2px 10px;border-radius:12px;border:none;background:#e07b00;color:#fff;font-size:12px;cursor:pointer;font-weight:600">Arreglar →</button></div>`
    ).join('');
    el.className = 'val-warn';
    el.querySelectorAll('.arreglar-btn').forEach(btn => {
      btn.addEventListener('click', () => autoFix(_lastWarnings[+btn.dataset.widx] || ''));
    });
  }
}

// ─── SUMMARY ───────────────────────────────────────────────────────────────
function renderSummary() {
  const anchoBot = readVal('hueco-ancho-bot-whole','hueco-ancho-bot-frac');
  const altoIzq  = readVal('hueco-alto-izq-whole', 'hueco-alto-izq-frac');
  const anchoTop = readVal('hueco-ancho-top-whole','hueco-ancho-top-frac');
  const altoDer  = readVal('hueco-alto-der-whole', 'hueco-alto-der-frac');
  const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  set('res-area',      `${anchoBot > 0 ? toFracStr(anchoBot) : '—'} × ${altoIzq > 0 ? toFracStr(altoIzq) : '—'} (base)`);
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
    const ok = confirm('Hay advertencias en las medidas:

' + warnings.join('
') + '

¿Continuar de todas formas?');
    if (!ok) return;
  }
  const block = document.getElementById('share-block');
  block?.classList.remove('hidden');
  setTimeout(() => block?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50);
  _saveCurrentJob(warnings);
}

function _saveCurrentJob(warnings) {
  if (typeof window.saveJobToFirestore !== 'function') return;
  const anchoBot = readVal('hueco-ancho-bot-whole','hueco-ancho-bot-frac');
  const altoIzq  = readVal('hueco-alto-izq-whole', 'hueco-alto-izq-frac');
  const anchoTop = readVal('hueco-ancho-top-whole','hueco-ancho-top-frac');
  const altoDer  = readVal('hueco-alto-der-whole', 'hueco-alto-der-frac');
  const notas = document.getElementById('notas-field')?.value || '';
  const jobData = {
    hueco: { anchoBot, altoIzq, anchoTop, altoDer },
    desniveles: {
      paredIzq: results.paredIzq?.label || null,
      paredDer: results.paredDer?.label || null,
      techo:    results.techo?.label    || null,
      piso:     results.piso?.label     || null,
    },
    warnings: warnings || [],
    notas
  };
  window.saveJobToFirestore(jobData).then(() => {
    const el = document.getElementById('save-status');
    if (el) { el.style.display = 'block'; setTimeout(() => el.style.display = 'none', 4000); }
    const overlay = document.createElement('div');
    overlay.innerHTML = '☁️ Guardado en la nube';
    overlay.style.cssText = `
      position:fixed; inset:0; z-index:9999;
      background:rgba(25,135,84,0.92); color:#fff;
      display:flex; align-items:center; justify-content:center;
      font-size:28px; font-weight:700; letter-spacing:0.02em;
      animation: fadeInOut 2.2s ease forwards;
    `;
    if (!document.getElementById('nube-anim-style')) {
      const style = document.createElement('style');
      style.id = 'nube-anim-style';
      style.textContent = '@keyframes fadeInOut { 0%{opacity:0;transform:scale(0.95)} 15%{opacity:1;transform:scale(1)} 75%{opacity:1} 100%{opacity:0;transform:scale(1.03)} }';
      document.head.appendChild(style);
    }
    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), 2200);
  }).catch(e => {
    console.error('[Nivelato] save failed:', e);
    const overlay = document.createElement('div');
    overlay.innerHTML = '⚠️ Error al guardar';
    overlay.style.cssText = `
      position:fixed; inset:0; z-index:9999;
      background:rgba(220,53,69,0.92); color:#fff;
      display:flex; align-items:center; justify-content:center;
      font-size:28px; font-weight:700;
      animation: fadeInOut 2.2s ease forwards;
    `;
    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), 2200);
  });
}

function buildShareText() {
  const notas    = document.getElementById('notas-field')?.value?.trim();
  const anchoBot = readVal('hueco-ancho-bot-whole','hueco-ancho-bot-frac');
  const altoIzq  = readVal('hueco-alto-izq-whole', 'hueco-alto-izq-frac');
  const anchoTop = readVal('hueco-ancho-top-whole','hueco-ancho-top-frac');
  const altoDer  = readVal('hueco-alto-der-whole', 'hueco-alto-der-frac');
  const warnings = runValidation();
  const lines = [
    'NIVELATO — MEDIDAS',
    `HUECO BASE: ${anchoBot > 0 ? toFracStr(anchoBot) : '—'} × ${altoIzq > 0 ? toFracStr(altoIzq) : '—'}`,
    `HUECO CALC: ${anchoTop > 0 ? toFracStr(anchoTop) : '—'} × ${altoDer > 0 ? toFracStr(altoDer) : '—'}`,
    '─────────────────',
    `ARRIBA:    ${results.techo?.label    || '—'}`,
    `ABAJO:     ${results.piso?.label     || '—'}`,
    `PARED IZQ: ${results.paredIzq?.label || '—'}`,
    `PARED DER: ${results.paredDer?.label || '—'}`,
  ];
  if (warnings.length > 0) { lines.push('─────────────────'); warnings.forEach(w => lines.push(`⚠ ${w}`)); }
  if (notas) lines.push(`NOTAS: ${notas}`);
  return lines.join('
');
}

function shareViaSMS()      { window.location.href = `sms:?body=${encodeURIComponent(buildShareText())}`; }
function shareViaWhatsApp() { window.open(`https://wa.me/?text=${encodeURIComponent(buildShareText())}`, '_blank'); }

// ─── CANVAS ENGINE ─────────────────────────────────────────────────────────
const canvas  = document.getElementById('drawing-canvas');
const ctx     = canvas.getContext('2d');

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

const STEP_VIEWS = [
  { focusX: 0.5, focusY: 0.5, zoom: 0.72 },
  { focusX: 0.0, focusY: 0.5, zoom: 3.2  },
  { focusX: 1.0, focusY: 0.5, zoom: 3.2  },
  { focusX: 0.5, focusY: 0.0, zoom: 3.2  },
  { focusX: 0.5, focusY: 1.0, zoom: 3.2  },
  { focusX: 0.5, focusY: 0.5, zoom: 0.72 },
];

function getGlassRect() {
  const W = canvas.width  / window.devicePixelRatio;
  const H = canvas.height / window.devicePixelRatio;
  // FIX: use the correct IDs that actually exist in the HTML
  const ancho = readVal('hueco-ancho-bot-whole','hueco-ancho-bot-frac') || 48;
  const alto  = readVal('hueco-alto-izq-whole', 'hueco-alto-izq-frac')  || 36;
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

  let zoom = sv.zoom;

  if (step === TOTAL_STEPS) {
    const padFit = 48;
    const fitZoomX = (W - padFit * 2) / gr.w;
    const fitZoomY = (H - padFit * 2) / gr.h;
    zoom = Math.min(fitZoomX, fitZoomY, 1.0);
  }

  const wx = gr.x + sv.focusX * gr.w;
  const wy = gr.y + sv.focusY * gr.h;

  vpTarget.scale = zoom;
  vpTarget.x = W / 2 - wx * zoom;
  vpTarget.y = H / 2 - wy * zoom;

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
  const anchoBot_c = readVal('hueco-ancho-bot-whole','hueco-ancho-bot-frac') || 0;
  const anchoTop_c = readVal('hueco-ancho-top-whole','hueco-ancho-top-frac') || 0;
  const altoIzq_c  = readVal('hueco-alto-izq-whole', 'hueco-alto-izq-frac')  || 0;
  const altoDer_c  = readVal('hueco-alto-der-whole', 'hueco-alto-der-frac')  || 0;
  const ancho = anchoBot_c; const alto = altoIzq_c;
  const pI_A   = readVal('pI-a-whole','pI-a-frac');
  const pI_B   = readVal('pI-b-whole','pI-b-frac');
  const pD_A   = readVal('pD-a-whole','pD-a-frac');
  const pD_B   = readVal('pD-b-whole','pD-b-frac');
  const t_A    = readVal('t-a-whole', 't-a-frac');
  const t_B    = readVal('t-b-whole', 't-b-frac');
  const p_A    = readVal('p-a-whole', 'p-a-frac');
  const p_B    = readVal('p-b-whole', 'p-b-frac');

  // ── compute pixel offset for each corner based on desnivelation ──
  const EXAG = gr.w * 0.18;
  const clamp = (v, lim) => Math.max(-lim, Math.min(lim, v));

  const pIMax = Math.max(pI_A, pI_B, 1);
  const pDMax = Math.max(pD_A, pD_B, 1);
  const tMax  = Math.max(t_A,  t_B,  1);
  const pMax  = Math.max(p_A,  p_B,  1);

  // left wall: pI_A vs pI_B. positive diff = bottom further out = top shifts inward (right)
  const pI_shift_top    = clamp(((pI_A - pI_B) / pIMax) * EXAG, EXAG);
  const pI_shift_bottom = 0;

  // right wall: pD_A vs pD_B. positive diff = bottom further out = top shifts inward (left)
  const pD_shift_top    = clamp(-((pD_A - pD_B) / pDMax) * EXAG, EXAG);
  const pD_shift_bottom = 0;

  // ceiling: t_A vs t_B. positive diff = left further = left corner shifts down
  const t_shift_left  = clamp(((t_A - t_B) / tMax) * EXAG * (gr.h / gr.w), EXAG);
  const t_shift_right = 0;

  // floor: p_A vs p_B. positive diff = left further = left corner shifts up
  // FIX: this was the bug — piso desnivel arrows weren't showing because
  // the shift was being calculated but the arrow drawing logic had issues.
  // The actual fix is in drawDeformArrow — it was checking result.val === 0
  // but we also need to make sure the shift magnitude is visible.
  const p_shift_left  = clamp(((p_A - p_B) / pMax) * EXAG * (gr.h / gr.w), EXAG);
  const p_shift_right = 0;

  // ── compute the 4 corners of the deformed glass ──
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
  // FIX: draw all four edges explicitly, including floor (bottom)
  drawDeformArrow(ctx, BL, TL, pI_shift_top,    'left',   results.paredIzq, sc);
  drawDeformArrow(ctx, TR, BR, pD_shift_top,    'right',  results.paredDer, sc);
  drawDeformArrow(ctx, TL, TR, t_shift_left,    'top',    results.techo,    sc);
  drawDeformArrow(ctx, BL, BR, p_shift_left,    'bottom', results.piso,     sc);

  // ── step highlight ──
  drawStepHighlight(ctx, TL, TR, BL, BR, currentStep, sc);

  // ── dimension labels ──
  // FIX: show all 4 dimensions when on step 0 or 5
  if (currentStep === 0 || currentStep === 5) {
    if (anchoTop_c > 0) drawDimLine(ctx, gr.x, gr.y - 22, gr.x + gr.w, gr.y - 22, toFracStr(anchoTop_c), sc);
    if (anchoBot_c > 0) drawDimLine(ctx, gr.x, gr.y + gr.h + 22, gr.x + gr.w, gr.y + gr.h + 22, toFracStr(anchoBot_c), sc);
    if (altoIzq_c > 0)  drawDimLine(ctx, gr.x - 22, gr.y, gr.x - 22, gr.y + gr.h, toFracStr(altoIzq_c),  sc, true);
    if (altoDer_c > 0)  drawDimLine(ctx, gr.x + gr.w + 22, gr.y, gr.x + gr.w + 22, gr.y + gr.h, toFracStr(altoDer_c),  sc, true);
  } else {
    // On measurement steps, show the relevant dimension
    if (ancho > 0) drawDimLine(ctx, gr.x, gr.y - 22, gr.x + gr.w, gr.y - 22, toFracStr(ancho), sc);
    if (alto  > 0) drawDimLine(ctx, gr.x - 22, gr.y, gr.x - 22, gr.y + gr.h, toFracStr(alto),  sc, true);
  }

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

function drawDeformArrow(ctx, pAnchor, pShifted, shiftPx, side, result, scale) {
  // FIX: always draw if there's any shift, even if result says NIVEL
  // The issue was that result.val === 0 for NIVEL, but we still want to show
  // the deformation visually even when it's within tolerance.
  // Actually, let me be smarter: draw if shift is visually significant.
  const visualShift = Math.abs(shiftPx);
  const MIN_VISUAL = 1 / scale; // at least 1 pixel at current zoom

  if (visualShift < MIN_VISUAL) return;

  const COLOR = result && result.val > 0 ? '#e67700' : '#868e96'; // orange for desnivel, gray for nivel
  const ARROW_HEAD = 14 / scale;
  const ARROW_WIDTH = 4 / scale;
  const fs = 14 / scale;

  ctx.save();
  ctx.strokeStyle = COLOR;
  ctx.fillStyle   = COLOR;
  ctx.lineWidth   = 3 / scale;

  let ax1, ay1, ax2, ay2;

  if (side === 'left' || side === 'right') {
    const yTop    = Math.min(pAnchor.y, pShifted.y);
    const xIdeal2 = (side === 'left') ? pAnchor.x : pAnchor.x;
    ax1 = xIdeal2;        ay1 = yTop;
    ax2 = xIdeal2 + shiftPx; ay2 = yTop;
  } else {
    const xPos = Math.max(pAnchor.x, pShifted.x) + 10 / scale;
    ax1 = xPos; ay1 = pShifted.y;
    ax2 = xPos; ay2 = pAnchor.y;
  }

  // dashed reference line
  ctx.save();
  ctx.setLineDash([3/scale, 3/scale]);
  ctx.strokeStyle = '#adb5bd';
  ctx.lineWidth = 0.8 / scale;
  ctx.beginPath();
  if (side === 'left' || side === 'right') {
    ctx.moveTo(ax1, Math.min(pAnchor.y, pShifted.y));
    ctx.lineTo(ax1, Math.max(pAnchor.y, pShifted.y));
  } else {
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

    const angle = Math.atan2(ay2 - ay1, ax2 - ax1);
    ctx.beginPath();
    ctx.moveTo(ax2, ay2);
    ctx.lineTo(ax2 - ARROW_HEAD * Math.cos(angle - 0.45), ay2 - ARROW_HEAD * Math.sin(angle - 0.45));
    ctx.lineTo(ax2 - ARROW_HEAD * Math.cos(angle + 0.45), ay2 - ARROW_HEAD * Math.sin(angle + 0.45));
    ctx.closePath();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2.5 / scale;
    ctx.stroke();
    ctx.fillStyle = COLOR;
    ctx.fill();
  }

  // label
  if (result && result.val > 0) {
    ctx.font = `bold ${fs}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = COLOR;
    const midX = (ax1 + ax2) / 2;
    const midY = (ay1 + ay2) / 2;
    const labelPad = 26 / scale;
    if (side === 'left')   { ctx.textAlign = 'right';  ctx.textBaseline = 'middle'; ctx.fillText(result.label, Math.min(ax1, ax2) - labelPad, midY); }
    if (side === 'right')  { ctx.textAlign = 'left';   ctx.textBaseline = 'middle'; ctx.fillText(result.label, Math.max(ax1, ax2) + labelPad, midY); }
    if (side === 'top')    { ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(result.label, midX, Math.min(ay1, ay2) - labelPad); }
    if (side === 'bottom') { ctx.textAlign = 'center'; ctx.textBaseline = 'top';    ctx.fillText(result.label, midX, Math.max(ay1, ay2) + labelPad); }
  }

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
  if (step === 1) { ctx.moveTo(BL.x, BL.y); ctx.lineTo(TL.x, TL.y); }
  if (step === 2) { ctx.moveTo(TR.x, TR.y); ctx.lineTo(BR.x, BR.y); }
  if (step === 3) { ctx.moveTo(TL.x, TL.y); ctx.lineTo(TR.x, TR.y); }
  if (step === 4) { ctx.moveTo(BL.x, BL.y); ctx.lineTo(BR.x, BR.y); }
  ctx.stroke();
  ctx.restore();
}

// ─── PER-FIELD FOCUS VIEWS ───────────────────────────────────────────────
const FIELD_VIEWS = {
  'pI-a-whole': { focusX: 0.0, focusY: 1.0, zoom: 4.8 },
  'pI-a-frac':  { focusX: 0.0, focusY: 1.0, zoom: 4.8 },
  'pI-b-whole': { focusX: 0.0, focusY: 0.0, zoom: 4.8 },
  'pI-b-frac':  { focusX: 0.0, focusY: 0.0, zoom: 4.8 },
  'pD-a-whole': { focusX: 1.0, focusY: 1.0, zoom: 4.8 },
  'pD-a-frac':  { focusX: 1.0, focusY: 1.0, zoom: 4.8 },
  'pD-b-whole': { focusX: 1.0, focusY: 0.0, zoom: 4.8 },
  'pD-b-frac':  { focusX: 1.0, focusY: 0.0, zoom: 4.8 },
  't-a-whole': { focusX: 0.0, focusY: 0.0, zoom: 4.8 },
  't-a-frac':  { focusX: 0.0, focusY: 0.0, zoom: 4.8 },
  't-b-whole': { focusX: 1.0, focusY: 0.0, zoom: 4.8 },
  't-b-frac':  { focusX: 1.0, focusY: 0.0, zoom: 4.8 },
  'p-a-whole': { focusX: 0.0, focusY: 1.0, zoom: 4.8 },
  'p-a-frac':  { focusX: 0.0, focusY: 1.0, zoom: 4.8 },
  'p-b-whole': { focusX: 1.0, focusY: 1.0, zoom: 4.8 },
  'p-b-frac':  { focusX: 1.0, focusY: 1.0, zoom: 4.8 },
  'hueco-ancho-bot-whole': { focusX: 0.5, focusY: 0.9, zoom: 0.85 },
  'hueco-ancho-bot-frac':  { focusX: 0.5, focusY: 0.9, zoom: 0.85 },
  'hueco-alto-izq-whole':  { focusX: 0.1, focusY: 0.5, zoom: 0.85 },
  'hueco-alto-izq-frac':   { focusX: 0.1, focusY: 0.5, zoom: 0.85 },
  'hueco-ancho-top-whole': { focusX: 0.5, focusY: 0.1, zoom: 0.85 },
  'hueco-ancho-top-frac':  { focusX: 0.5, focusY: 0.1, zoom: 0.85 },
  'hueco-alto-der-whole':  { focusX: 0.9, focusY: 0.5, zoom: 0.85 },
  'hueco-alto-der-frac':   { focusX: 0.9, focusY: 0.5, zoom: 0.85 },
};

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
  animateCanvas(currentStep);
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

document.addEventListener('mouseover', e => {
  const col = e.target.closest('.input-col');
  if (!col) return;
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

// ─── DRAG TO PAN ──────────────────────────────────────────────────────────
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let vpAtDrag  = { x: 0, y: 0 };

canvas.addEventListener('mousedown', e => {
  if (e.button !== 0) return;
  isDragging = true;
  dragStart = { x: e.clientX, y: e.clientY };
  vpAtDrag  = { x: vp.x, y: vp.y };
  canvas.style.cursor = 'grabbing';
});
window.addEventListener('mousemove', e => {
  if (!isDragging) return;
  const dx = e.clientX - dragStart.x;
  const dy = e.clientY - dragStart.y;
  vp.x = vpAtDrag.x + dx; vp.y = vpAtDrag.y + dy;
  vpTarget.x = vp.x; vpTarget.y = vp.y;
  userZoomed = true;
  drawCanvas();
});
window.addEventListener('mouseup', () => { isDragging = false; canvas.style.cursor = 'grab'; });
canvas.style.cursor = 'grab';

// ─── TOUCH + ZOOM HANDLING ───
let userZoomed   = false;
let touchDragStart = null;
let lastPinchDist  = null;

function applyZoom(cx, cy, factor) {
  const clampedFactor = Math.max(0.85, Math.min(1.18, factor));
  userZoomed = true;
  const newScale = Math.max(0.3, Math.min(10, vp.scale * clampedFactor));
  const sf = newScale / vp.scale;
  vp.x = cx - sf * (cx - vp.x);
  vp.y = cy - sf * (cy - vp.y);
  vp.scale = newScale;
  vpTarget.x = vp.x; vpTarget.y = vp.y; vpTarget.scale = vp.scale;
  drawCanvas();
}

canvas.addEventListener('touchstart', e => {
  if (e.touches.length === 1) {
    touchDragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, vpx: vp.x, vpy: vp.y };
    lastPinchDist = null;
  } else if (e.touches.length === 2) {
    touchDragStart = null;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    lastPinchDist = Math.sqrt(dx*dx + dy*dy);
  }
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  if (e.touches.length === 1 && touchDragStart) {
    const dx = e.touches[0].clientX - touchDragStart.x;
    const dy = e.touches[0].clientY - touchDragStart.y;
    vp.x = touchDragStart.vpx + dx;
    vp.y = touchDragStart.vpy + dy;
    vpTarget.x = vp.x; vpTarget.y = vp.y;
    userZoomed = true;
    drawCanvas();
  } else if (e.touches.length === 2 && lastPinchDist !== null) {
    const dx   = e.touches[0].clientX - e.touches[1].clientX;
    const dy   = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const rect = canvas.getBoundingClientRect();
    const cx   = ((e.touches[0].clientX + e.touches[1].clientX) / 2) - rect.left;
    const cy   = ((e.touches[0].clientY + e.touches[1].clientY) / 2) - rect.top;
    applyZoom(cx, cy, dist / lastPinchDist);
    lastPinchDist = dist;
  }
}, { passive: false });

canvas.addEventListener('touchend', e => {
  if (e.touches.length === 0) { touchDragStart = null; lastPinchDist = null; }
  if (e.touches.length < 2)   { lastPinchDist = null; }
}, { passive: true });

// mouse wheel zoom
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  applyZoom(e.clientX - rect.left, e.clientY - rect.top, e.deltaY < 0 ? 1.12 : 0.88);
}, { passive: false });

// reset zoom button
window.resetZoom = () => { userZoomed = false; animateCanvas(currentStep); };

// ─── INIT ──────────────────────────────────────────────────────────────────
resizeCanvas();
// Replace initial history state so back button works from step 0 too
history.replaceState({ step: 0 }, '', '#step-0');
goStep(0, true); // skipHistory=true because we just did replaceState
