# Modulo 0 — La Griglia Discreta, il Tempo e il Dithering di Bayer

Prima di ruotare cubi nello spazio 3D, devi padroneggiare il **piano di disegno**: come trasformare numeri puri in un'immagine animata coerente, indipendente dalla dimensione dello schermo e stilisticamente controllata.

In `components/laboratorio/laracon-cybersec-site.tsx`, il segreto estetico di tutti gli oggetti 3D non è la complessità dei poligoni: è lavorare su una **griglia logica a bassa risoluzione** (es. `80 × 60` celle) filtrata da una **matrice di dithering ordinato 8×8**.

---

## 1. Il modello mentale: lo schermo come matrice di luminanza

Dimentica `ctx.arc()`, gradienti sfumati o ombre CSS. Pensa al canvas come a una **mappa di intensità luminosa**:

* Ogni cella `(gx, gy)` contiene un solo numero `lum` tra `0.0` (buio totale) e `1.0` (luce massima).
* Tutta la simulazione matematica scrive in un array monodimensionale `Float32Array(cols * rows)`:
  ```ts
  const idx = gy * cols + gx;
  buf[idx] = luminanza; // 0..1
  ```
* Solo **alla fine del frame** un renderer legge `buf` e disegna sullo schermo rettangoli, punti o croci halftone.

### Perché conviene usare una griglia discreta?

1. **Velocità estrema**: invece di calcolare 1920×1080 pixel su CPU, calcoli `80 × 60 = 4.800` celle (430 volte meno lavoro!).
2. **Stile grafico coerente**: ogni forma — sia un cubo, una sfera o un'onda — parla lo stesso linguaggio visivo.
3. **Portabilità verso GPU**: ragionare per cella `(gx, gy)` è identico a scrivere un fragment shader GLSL.

---

## 2. Coordinate normalizzate e rapporto d'aspetto

Non scrivere mai coordinate in pixel fissi (es. `x = 240`). Se raddoppi la larghezza del canvas, il disegno si spezza. Normalizza sempre rispetto al centro e compensa l'aspect ratio:

```ts
const aspect = cols / rows;

for (let gy = 0; gy < rows; gy++) {
  // y normalizzata in [-1 .. +1], con 0 al centro verticale
  const y = (gy / rows - 0.5) * 2;

  for (let gx = 0; gx < cols; gx++) {
    // x normalizzata e corretta per aspect ratio, così un cerchio resta tondo
    const x = (gx / cols - 0.5) * 2 * aspect;

    // Qui (0, 0) è esattamente il centro dello schermo!
  }
}
```

Se dimentichi `* aspect`, su un canvas rettangolare `720 × 420` i cerchi diventano ellissi schiacciate.

---

## 3. Tempo continuo (`t`) vs Passo discreto (`dt`)

Nel loop di animazione (`requestAnimationFrame`), i monitor non vanno tutti a 60 Hz: oggi molti vanno a 120 Hz o 144 Hz, mentre su batteria scendono a 30 Hz.

* **Sbagliato**: `time += 0.016` ogni frame (su un monitor a 120 Hz va al doppio della velocità!).
* **Corretto**: misura i secondi reali trascorsi dall'ultimo frame:

```ts
const dt = Math.min(0.05, (now - lastTs) / 1000);
lastTs = now;
time += dt;
```

### Perché `Math.min(0.05, ...)` è obbligatorio

Se l'utente cambia scheda del browser per 30 secondi e poi torna, `now - lastTs` vale `30` secondi! Senza clamping, `dt = 30` farà fare alla tua dinamica un salto gigante (e nei moduli fisici con velocità e molle farà letteralmente esplodere le particelle fuori dallo schermo). Limitare `dt` a `0.05s` (equivalente a 20 fps minimi) garantisce che la simulazione vada semplicemente "in pausa" quando il browser sospende il tab.

---

## 4. Come pensare la dinamica in 2D: onde, distanze e fase

Anche senza vera fisica newtoniana, puoi creare movimento credibile combinando tre idee matematiche:

1. **Funzione di distanza (metrica)**: definisce la forma dello spazio.
   * Euclidea `Math.hypot(x, y)` -> cerchi e sfere (`dome`, `sunDome`).
   * Chebyshev `Math.max(Math.abs(x), Math.abs(y))` -> quadrati concentrici.
   * Metrica ottagonale (usata in `tunnel`, [righe 783–785](file:///c:/Users/matti/Documents/progetti/portfolio/components/laboratorio/laracon-cybersec-site.tsx#L783-L785)):
     ```ts
     const dist = Math.max(Math.abs(x), Math.abs(y), (Math.abs(x) + Math.abs(y)) * 0.707);
     ```
2. **Compressione prospettica `1 / dist`**: più ti avvicini al centro (`dist` piccolo), più le onde sembrano fitte in lontananza. Appena aggiungi `- t * speed` dentro `Math.sin(...)`, gli anelli scorrono verso l'osservatore:
   ```ts
   const pulse = Math.sin((1 / (dist + 0.08)) * 1.9 - t * 3.4);
   ```
3. **Vignettatura e decadimento**: moltiplicare la luce per una rampa legata alla distanza (`vignette`) evita tagli netti e simula la profondità di campo o la perdita di luce nel buio.

---

## 5. Il Bayer Dithering 8×8: trasformare grigi in geometria

Se hai solo 4 o 5 livelli visivi (vuoto, puntino, quadrato medio, croce `+`/`×`, blocco pieno) e passi da una luminanza continua `0..1` a questi gradini, vedresti brutte bande nette (*color banding*).

Il **dithering ordinato di Bayer** aggiunge un microscopico offset deterministico basato sulla posizione `(gx, gy)` prima di decidere il livello della cella:

```ts
const BAYER_8X8 = [
  [ 0, 32,  8, 40,  2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44,  4, 36, 14, 46,  6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [ 3, 35, 11, 43,  1, 33,  9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47,  7, 39, 13, 45,  5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
];
```

Nel rendering (vedi `PixelDitherCanvas`, [righe 1486–1536](file:///c:/Users/matti/Documents/progetti/portfolio/components/laboratorio/laracon-cybersec-site.tsx#L1486-L1536)):

```ts
const bayerVal = BAYER_8X8[gy & 7][gx & 7] / 64; // 0.0 .. ~0.98
const level = lum + (bayerVal - 0.5) * 0.22;     // +/- 0.11 attorno alla luminanza
```

*Nota pro*: `gx & 7` è equivalente a `gx % 8` per interi non negativi ed è istantaneo. L'ampiezza `0.22` controlla quanto la sfumatura è "granulosa": troppo bassa mostra bande di scalino, troppo alta dissolve i bordi netti dell'oggetto.

### La scala dei glifi (halftone personalizzato)

Invece di disegnare solo quadratini di dimensione variabile, `PixelDitherCanvas` mappa `level` in 5 simboli con spessore crescente:
* `< 0.08`: vuoto (sfondo)
* `0.08 .. 0.24`: micro-punto centrato
* `0.24 .. 0.44`: quadrato medio (50% cella)
* `0.44 .. 0.66`: croci `+` e `×` alternate con `(gx + gy) & 1`
* `0.66 .. 0.86`: blocco con gap da 1px
* `>= 0.86`: blocco pieno

L'alternanza `+` / `×` crea quella texture editoriale/tecnica che resta leggibile anche a distanza.

---

## 6. Laboratorio pratico del Modulo 0

Costruisci un piccolo file `dither-tunnel-lab.ts` partendo da questa struttura e prova a modificare i parametri uno alla volta:

```ts
export function renderTunnelFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cellSize: number,
  t: number,
  mx: number, // -1 .. +1
  my: number  // -1 .. +1
) {
  const cols = Math.floor(width / cellSize);
  const rows = Math.floor(height / cellSize);
  const aspect = cols / rows;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#3E3EE0";

  for (let gy = 0; gy < rows; gy++) {
    const y = (gy / rows - 0.5) * 2 - my * 0.15;
    const bRow = BAYER_8X8[gy & 7];

    for (let gx = 0; gx < cols; gx++) {
      const x = (gx / cols - 0.5) * 2 * aspect - mx * 0.15;
      const dist = Math.max(Math.abs(x), Math.abs(y), (Math.abs(x) + Math.abs(y)) * 0.707);
      if (dist < 0.18) continue;

      const pulse = Math.sin((1 / (dist + 0.08)) * 1.9 - t * 3.4);
      const vignette = Math.min(1, (dist - 0.18) * 1.15);
      const lum = vignette * (0.48 + 0.52 * Math.max(0, pulse));

      const level = lum + (bRow[gx & 7] / 64 - 0.5) * 0.22;
      if (level < 0.1) continue;

      const px = gx * cellSize;
      const py = gy * cellSize;
      const size = Math.max(1, Math.round(cellSize * Math.min(1, level)));
      const off = Math.floor((cellSize - size) * 0.5);
      ctx.fillRect(px + off, py + off, size, size);
    }
  }
}
```

### Sfide per verificare che hai padroneggiato il modulo

1. **Sfera luminosa (`dome`)**: sostituisci la metrica ottagonale con `r = Math.hypot(x, y)`. Se `r <= radius`, calcola la terza dimensione immaginaria `z = Math.sqrt(radius * radius - r * r)` e usa `z / radius` come luminanza: hai appena ottenuto una semisfera 3D illuminata pur lavorando in 2D!
2. **Onde interferenti**: somma due sorgenti puntiformi `sin(d1 * 12 - t * 3) + sin(d2 * 12 - t * 3)` spostando una sorgente con il cursore del mouse.
3. **Smoothing del cursore**: invece di passare direttamente `(mx, my)` alla funzione, fai inseguire il bersaglio con `p.x += (targetX - p.x) * 0.08` per eliminare ogni tremolio della mano.

---

Prossimo passo: **[Modulo 1 — Pensare la Fisica 2D: Particelle, Molle e Campi](./02-modulo-1-fisica-2d-particelle-e-molle.md)**.
