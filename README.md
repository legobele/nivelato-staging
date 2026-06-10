# Nivelato

Field measurement tool for glass shop technicians in Puerto Ricocalculates out-of-squareness (desnivel / descuadre) for door and window openings using laser measurements.

## What it does

A mobile-first 5-step wizard that takes laser measurements from walls, ceiling, and floor, then visualizes the deformed opening with exact dimensions.

**6 steps:**
1. **Hueco**  enter bottom width and left height (base dimensions)
2. **Pared Izquierda**  laser to left wall at bottom (A) and top (B)
3. **Pared Derecha**  laser to right wall at bottom (A) and top (B)
4. **Arriba**  laser to ceiling at left (A) and right (B)
5. **Abajo**  laser to floor at left (A) and right (B)
6. **Resumen**  validation, computed dimensions, share via WhatsApp/SMS

**Key features:**
- Interactive canvas showing level reference (dashed) + actual deformed opening (solid blue)
- Desnivel arrows on each edge showing deviation direction and amount
- Step highlight that glows the active edge
- All 4 dimension lines displayed (bottom, top, left, right) with computed values
- Auto-fills opposite-side measurements from reference data
- Pinch-zoom, drag-to-pan, per-field focus
- Firebase Firestore save + org-based dashboard
- Join code system for employees

## Stack

- Pure HTML + CSS + JS  no framework, no build step
- Firebase Auth + Firestore
- GitHub Pages
- Cloudflare Workers + Fly.io

## Files

| File | Purpose |
|---|---|
| index.html | Main 5-step tool |
| dashboard.html | Owner/supervisor dashboard |
| login.html | Auth, org creation, join codes |
| adhd.js | All logic, canvas, calculations |
| autism.css | Styles |
| auth-guard.js | Auth routing + Firestore save |
| firebase-config.js | Firebase init |

## File naming convention

The file names are correct. Do not rename them.

## Author

benj + the other 15 authors or something
"// rebuild trigger $(date)"  
