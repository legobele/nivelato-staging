$path = "C:\Users\bnjlebron\nivelato\glass-app\adhd.js"
$c = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

$old = "// Small tick mark at the end (no arrowhead)" + [char]13 + [char]10 + "    const tickLen = 4 / scale;" + [char]13 + [char]10 + "    if (side === 'left' || side === 'right') {" + [char]13 + [char]10 + "      ctx.beginPath();" + [char]13 + [char]10 + "      ctx.moveTo(ax2, ay2 - tickLen);" + [char]13 + [char]10 + "      ctx.lineTo(ax2, ay2 + tickLen);" + [char]13 + [char]10 + "      ctx.stroke();" + [char]13 + [char]10 + "    } else {" + [char]13 + [char]10 + "      ctx.beginPath();" + [char]13 + [char]10 + "      ctx.moveTo(ax2 - tickLen, ay2);" + [char]13 + [char]10 + "      ctx.lineTo(ax2 + tickLen, ay2);" + [char]13 + [char]10 + "      ctx.stroke();" + [char]13 + [char]10 + "    }"

$new = "// Tick + measurement label at the offset point" + [char]13 + [char]10 + "    const tickLen = 4 / scale;" + [char]13 + [char]10 + "    ctx.fillStyle = COLOR;" + [char]13 + [char]10 + '    ctx.font = "bold " + (11 / scale) + "px Inter, system-ui, sans-serif";' + [char]13 + [char]10 + '    ctx.textAlign = "center";' + [char]13 + [char]10 + '    ctx.textBaseline = "middle";' + [char]13 + [char]10 + "    if (side === `"left`" || side === `"right`") {" + [char]13 + [char]10 + "      ctx.beginPath();" + [char]13 + [char]10 + "      ctx.moveTo(ax2, ay2 - tickLen);" + [char]13 + [char]10 + "      ctx.lineTo(ax2, ay2 + tickLen);" + [char]13 + [char]10 + "      ctx.stroke();" + [char]13 + [char]10 + '      ctx.textAlign = side === "left" ? "right" : "left";' + [char]13 + [char]10 + '      ctx.fillText(HAS_DESNIVEL ? result.label : "", ax2 + (side === "left" ? -6/scale : 6/scale), ay2);' + [char]13 + [char]10 + "    } else {" + [char]13 + [char]10 + "      ctx.beginPath();" + [char]13 + [char]10 + "      ctx.moveTo(ax2 - tickLen, ay2);" + [char]13 + [char]10 + "      ctx.lineTo(ax2 + tickLen, ay2);" + [char]13 + [char]10 + "      ctx.stroke();" + [char]13 + [char]10 + '      ctx.textBaseline = side === "top" ? "bottom" : "top";' + [char]13 + [char]10 + '      ctx.fillText(HAS_DESNIVEL ? result.label : "", ax2, ay2 + (side === "top" ? -6/scale : 6/scale));' + [char]13 + [char]10 + "    }"

if ($c.Contains($old)) {
    $c = $c.Replace($old, $new)
    [System.IO.File]::WriteAllText($path, $c, [System.Text.Encoding]::UTF8)
    Write-Host "REPLACED"
} else {
    Write-Host "NOT FOUND"
    # Debug: show the area around the match
    $idx = $c.IndexOf("Small tick mark")
    Write-Host "Index: $idx"
    $chunk = $c.Substring($idx, 350)
    Write-Host "Found:"
    Write-Host $chunk
}
