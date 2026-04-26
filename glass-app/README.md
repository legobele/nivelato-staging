# descuadre

a glass shop measurement tool for calculating wall/roof/floor out-of-squareness (descuadre).

built for production use at a family glass shop in puerto rico. employees use it in the field to figure out how off a door/window opening is before cutting glass.

## what it does

takes laser measurements from walls, roof, and floor — outputs the exact desnivel (deviation) for each surface in inches + fractions, with direction (izquierda/derecha).

**4 tabs:**
- **Paredes** — left wall (A/B) + right wall (C/D) measurements + opening dimensions
- **Techo** — roof laser measurements (a/b)
- **Piso** — floor laser measurements (e/f)
- **Medidas** — results screen with interactive diagram. tap any side to edit that section. share via SMS or WhatsApp.

## math

| measurement | logic |
|---|---|
| left wall | A=bottom, B=top. diff = B-A. positive → leans left, negative → leans right |
| right wall | C=bottom, D=top. diff = C-D. positive → leans left, negative → leans right |
| techo | a=left, b=right. diff = a-b. positive → drops right, negative → rises right |
| piso | e=left, f=right. same logic as techo |

outputs in whole + fraction inches (e.g. `3/8" IZQ`).

## stack

literally just:
- `index.html`
- `autism.css`
- `adhd.js`

no build step. no dependencies. no framework. open `index.html` and go.

## deployment

github pages. that's it.

## file naming convention

the file names are correct. do not rename them.

## author

benj (14, AuDHD, the main owner's nephew)
