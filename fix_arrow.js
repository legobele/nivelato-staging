const fs = require('fs');
let c = fs.readFileSync('glass-app/adhd.js', 'utf8');
let i = c.indexOf('Small tick mark');
if (i < 0) { console.log('NOT FOUND'); process.exit(1); }
// Find where the code ends — after the closing } of the else block, before the next line
let snippetStart = c.indexOf('// Small tick mark', i);
let snippetEnd = snippetStart;
// Find the pattern: after the else block's closing }, there will be a line with just "  }"
for (let j = snippetStart; j < c.length; j++) {
  if (c.substring(j, j+5) === '\n  }\n' || c.substring(j, j+7) === '\n  }\r\n') {
    snippetEnd = j + (c[j+4]==='\r' ? 7 : 5);
    break;
  }
}
if (snippetEnd <= snippetStart) { console.log('COULD NOT FIND END'); process.exit(1); }
let oldSnippet = c.substring(snippetStart, snippetEnd);
console.log('OLD:', JSON.stringify(oldSnippet).substring(0,500));

const newSnippet = `        // Tick + measurement label at the offset point
    const tickLen = 4 / scale;
    ctx.fillStyle = COLOR;
    ctx.font = "bold " + (11 / scale) + "px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (side === "left" || side === "right") {
      ctx.beginPath();
      ctx.moveTo(ax2, ay2 - tickLen);
      ctx.lineTo(ax2, ay2 + tickLen);
      ctx.stroke();
      ctx.textAlign = side === "left" ? "right" : "left";
      ctx.fillText(HAS_DESNIVEL ? result.label : "", ax2 + (side === "left" ? -6/scale : 6/scale), ay2);
    } else {
      ctx.beginPath();
      ctx.moveTo(ax2 - tickLen, ay2);
      ctx.lineTo(ax2 + tickLen, ay2);
      ctx.stroke();
      ctx.textBaseline = side === "top" ? "bottom" : "top";
      ctx.fillText(HAS_DESNIVEL ? result.label : "", ax2, ay2 + (side === "top" ? -6/scale : 6/scale));
    }
  }`;

c = c.substring(0, snippetStart) + newSnippet + c.substring(snippetEnd);
fs.writeFileSync('glass-app/adhd.js', c, 'utf8');
console.log('REPLACED. Size:', fs.statSync('glass-app/adhd.js').size);
