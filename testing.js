// testing.js — full-screen watermark for staging/testing builds
// Shows repeating diagonal "TESTING" across the entire viewport on non-production domains.

(function(){
  var host = window.location.hostname;
  var path = window.location.pathname || '';
  if (host === 'nivelato.app' || host === 'www.nivelato.app') return;
  if (host === 'legobele.github.io' && !path.startsWith('/nivelato-staging')) return;

  if (document.getElementById('testing-watermark')) return;

  // Prevent context menu, copy, cut — mild screenshot deterrence
  document.addEventListener('contextmenu', function(e) { e.preventDefault(); });
  document.addEventListener('copy', function(e) { e.preventDefault(); });
  document.addEventListener('cut', function(e) { e.preventDefault(); });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'PrintScreen' || (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's'))) {
      e.preventDefault();
    }
  });

  var w = window.innerWidth;
  var h = window.innerHeight;
  var size = Math.min(w, h) * 0.25;

  var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('id', 'testing-watermark');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:2147483647;pointer-events:none;';

  // Create a repeating diagonal pattern of TESTING across the full viewport
  var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  var pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
  pattern.setAttribute('id', 'watermark-pattern');
  pattern.setAttribute('patternUnits', 'userSpaceOnUse');
  pattern.setAttribute('width', size * 3);
  pattern.setAttribute('height', size * 3);
  pattern.setAttribute('patternTransform', 'rotate(-28)');

  var txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  txt.setAttribute('x', size * 0.5);
  txt.setAttribute('y', size * 0.5);
  txt.setAttribute('font-family', 'system-ui, sans-serif');
  txt.setAttribute('font-size', size);
  txt.setAttribute('font-weight', '900');
  txt.setAttribute('fill', 'rgba(220, 53, 69, 0.12)');
  txt.setAttribute('stroke', 'rgba(220, 53, 69, 0.06)');
  txt.setAttribute('stroke-width', '1');
  txt.textContent = 'TESTING';
  pattern.appendChild(txt);

  // Second instance to fill gaps
  var txt2 = txt.cloneNode(true);
  txt2.setAttribute('x', size * 2);
  txt2.setAttribute('y', size * 2);
  pattern.appendChild(txt2);

  defs.appendChild(pattern);
  svg.appendChild(defs);

  var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('width', '100%');
  rect.setAttribute('height', '100%');
  rect.setAttribute('fill', 'url(#watermark-pattern)');
  svg.appendChild(rect);

  function appendWatermark() {
    if (document.body) {
      document.body.appendChild(svg);
    } else {
      document.addEventListener('DOMContentLoaded', function() { document.body.appendChild(svg); });
    }
  }
  appendWatermark();

  // No resize handler needed — SVG pattern fills viewport dynamically
})();
