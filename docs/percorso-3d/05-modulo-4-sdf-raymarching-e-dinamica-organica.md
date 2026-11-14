# Modulo 4 — SDF, Raymarching e Dinamica Organica

Finora abbiamo descritto gli oggetti in modo **esplicito**: *"campiona punti lungo una faccia o lungo gli angoli `u, v`"*. Funziona benissimo per meccanismi rigidi, ma diventa difficilissimo se vuoi far **fondere** una stella in un anello o far pulsare una creatura fluida senza strappi.

In questo modulo impari la tecnica usata da `mutant` (`evalMutantShape` e `drawMutantMorph3D`, [righe 460–624](file:///c:/Users/matti/Documents/progetti/portfolio/components/laboratorio/laracon-cybersec-site.tsx#L460-L624)): **Signed Distance Fields (SDF)** + **Sphere Tracing (Raymarching)**.

---

## 1. Cos'è un Signed Distance Field (SDF)?

Un'SDF è una funzione che prende un punto qualunque dello spazio `(px, py, pz)` e risponde a una sola domanda:

> *"Quanto dista questo punto dalla superficie dell'oggetto?"*

* **`d > 0`**: sei **fuori** dall'oggetto (`d` è la distanza minima sicura prima di toccarlo).
* **`d == 0`**: sei **esattamente sulla superficie**.
* **`d < 0`**: sei **dentro** l'oggetto.

### Tre SDF fondamentali da sapere a memoria

```ts
// 1. Sfera centrata nell'origine di raggio R
const sdSphere = (x: number, y: number, z: number, R: number) =>
  Math.hypot(x, y, z) - R;

// 2. Toro sul piano XY (raggio anello R, raggio tubo r)
const sdTorus = (x: number, y: number, z: number, R: number, r: number) =>
  Math.hypot(Math.hypot(x, y) - R, z) - r;

// 3. Deformazione armonica su una sfera (alla base delle forme organiche!)
// Se ux, uy, uz è la direzione normalizzata (p / length(p)):
const sdOrganic = (x: number, y: number, z: number, wave: number) =>
  Math.hypot(x, y, z) - (0.62 + wave);
```

### Il superpotere del morphing

Con i poligoni fondere una stella con un toro è un incubo topologico. Con le SDF basta una interpolazione lineare tra due numeri:

```ts
const d = (1 - blend) * dA + blend * dB;
```

Dove `blend` varia tra `0` e `1`! La superficie zero si trasforma fluidamente da una topologia all'altra senza mai bucarsi.

---

## 2. Come funziona il Raymarching (Sphere Tracing)

Con le mesh proietti i punti dall'oggetto allo schermo. Nel Raymarching fai l'esatto opposto: **parti da ogni cella `(gx, gy)` dello schermo e spari un raggio nello spazio 3D** finché non colpisci l'oggetto.

```text
  Camera --------> [ passo = d1 ] ---> [ d2 ] -> [ d3 ] -> HIT! (d < 0.012)
   (ro)    raggio        |                |         |
         direzione      Sfera            Sfera     Sfera
           (rd)        sicura           sicura    sicura
```

Poiché l'SDF garantisce che entro una sfera di raggio `d` non ci sia nessuna superficie, puoi avanzare lungo il raggio di `d` in un colpo solo (o `d * 0.62` quando l'SDF è deformata da seni/coseni molto ripidi, per non "bucare" i picchi sottili!).

### Il trucco della "Camera Inversa"

Anziché ruotare la formula matematica della stella in 3D ad ogni passo del ciclo interno (sarebbe lento!), **ruoti una sola volta l'origine del raggio (`ro`) e la direzione del raggio (`rd`) al contrario** (`Rx(-rx)` poi `Ry(-ry)`), esattamente come fa `drawMutantMorph3D` ([righe 560–591](file:///c:/Users/matti/Documents/progetti/portfolio/components/laboratorio/laracon-cybersec-site.tsx#L560-L591)). Così dentro il ciclo di raymarching l'oggetto resta fermo nel proprio spazio locale!

### L'ottimizzazione vitale su CPU: Bounding Sphere

Su una griglia `84 × 56`, la metà dei pixel guarda il vuoto attorno all'oggetto. Fare 32 iterazioni di raymarching su pixel che non colpiranno mai nulla è puro spreco.
Prima di far partire il raggio, controlla se il pixel sullo schermo è fuori dal cerchio massimo possibile dell'oggetto (`boundR2`, [righe 569–580](file:///c:/Users/matti/Documents/progetti/portfolio/components/laboratorio/laracon-cybersec-site.tsx#L569-L580)):

```ts
if (px * px + py * py > boundR2) continue; // Salta immediatamente!
```

Questo taglia oltre il 50–65% del costo CPU senza cambiare un solo pixel del risultato.

---

## 3. Calcolare Normali e Luce su una forma qualsiasi

Una volta che il raggio colpisce la superficie nel punto `(hx, hy, hz)`, come sai dove punta la superficie per calcolare la luce? Non hai facce o triangoli!

Misuri la **pendenza locale (gradiente)** dell'SDF assaggiando un minuscolo passo `eps` (es. `0.015`) sui tre assi:

```ts
const eps = 0.015;
const nx = evalSDF(hx + eps, hy, hz) - evalSDF(hx - eps, hy, hz);
const ny = evalSDF(hx, hy + eps, hz) - evalSDF(hx, hy - eps, hz);
const nz = evalSDF(hx, hy, hz + eps) - evalSDF(hx, hy, hz - eps);
const len = Math.hypot(nx, ny, nz) || 1;
// Riporta la normale dallo spazio locale a quello della camera:
const rn = rotatePoint(nx / len, ny / len, nz / len, rx, ry);
```

### Rim Light: dare volume su fondo nero

Sul nero puro `#010101` un oggetto scuro rischia di fondersi nello sfondo lungo i bordi. Calcolando quanto la normale guarda di taglio (`Math.abs(rn[2]) ≈ 0`), aggiungi un alone o contrasto sui contorni (**Fresnel / Rim light**, [riga 619](file:///c:/Users/matti/Documents/progetti/portfolio/components/laboratorio/laracon-cybersec-site.tsx#L619)):

```ts
const rim = Math.pow(Math.max(0, 1 - Math.abs(rn[2])), 1.8) * 0.18;
```

---

## 4. Come pensare la Dinamica Organica e Biologica

Un cubo gira a velocità costante. Un organismo vivente no: ha **ritmi asimmetrici, tensioni durante il cambiamento ed espansioni elastiche**. Ecco i tre segreti usati in `drawMutantMorph3D` ([righe 474–545](file:///c:/Users/matti/Documents/progetti/portfolio/components/laboratorio/laracon-cybersec-site.tsx#L474-L545)):

1. **Battito cardiaco asimmetrico (`lub-dub`) con curve gaussiane**:
   Una semplice `sin(t)` dà un respiro lineare troppo docile. Due campane gaussiane ravvicinate dentro un ciclo `[0..1]` producono la doppia sistole cardiaca (*tu-tum... tu-tum...*):
   ```ts
   const beatPhase = (t * 0.92) % 1;
   const lub = Math.exp(-Math.pow((beatPhase - 0.14) / 0.075, 2));
   const dub = 0.62 * Math.exp(-Math.pow((beatPhase - 0.30) / 0.085, 2));
   const beat = lub + dub;
   ```
2. **Sospensione + Transizione veloce (Hold & Morph)**:
   Se un oggetto muta di continuo senza pause, l'occhio non legge mai la forma. Dedica il 62% del ciclo a **mantenere** la forma `idxA` viva sul posto (`rawBlend = 0`) e il restante 38% a trasformarla fluidamente in `idxB` con `smoothstep`:
   ```ts
   const rawBlend = Math.max(0, Math.min(1, (local - 0.62) / 0.38));
   const blend = rawBlend * rawBlend * (3 - 2 * rawBlend);
   ```
3. **Accoppiamento dell'energia di trasformazione (`morphSurge`)**:
   Quando una materia cambia forma, deve "agitarsi" di più nel picco centrale della mutazione!
   `const morphSurge = Math.sin(blend * Math.PI);` vale `0` a riposo (`blend = 0` o `1`) e tocca `1.0` esattamente a metà trasformazione (`blend = 0.5`). Usandolo per aumentare l'ampiezza delle increspature superficiali (`ripAmp`), la superficie ribolle solo mentre muta e si acquieta quando raggiunge la nuova forma!

*Dettaglio matematico sulla scala*: se scali la forma di `pulse`, dividi le coordinate in ingresso per `pulse` (`sx = px / pulse`) e poi **rimoltiplica la distanza SDF risultante per `pulse`** (`dist * pulse`), così lo step del raymarching resta metricamente corretto.

---

## 5. Laboratorio pratico del Modulo 4

Costruisci una mini-scena Raymarching su una griglia `70 × 70` (usa `cellSize = 5` o `6` così resta fluida a 60fps anche su CPU):

1. Scrivi due SDF: una sfera ondulata e un toro ondulato (`evalShapeA`, `evalShapeB`).
2. Fai partire `32` iterazioni massime per raggio con bound circolare e calcolo delle normali via gradiente.
3. Collega `beat` e `morphSurge` alla scala dell'oggetto e all'ampiezza delle increspature.

### Sfide per verificare che hai padroneggiato il modulo

1. **Smooth Minimum (`smin`) al posto del morphing lineare**: cerca o implementa `smin(d1, d2, k)` per fondere **due sfere orbitanti** come gocce di mercurio che si uniscono e si separano nello spazio!
2. **Interazione fisica con il cursore**: quando il mouse è vicino al centro dell'oggetto SDF, aggiungi una leggera "ammaccatura" o attrazione sferica verso la direzione del puntatore dentro la funzione `evalSDF`.
3. **Senza `0.62` nel passo**: prova a mettere `rayT += d * 1.0` invece di `rayT += d * 0.62` su una forma con molte onde alte e osserva gli artefatti sui bordi (*overstepping*): capirai visceralmente perché le SDF deformate non sono più "esatte" e richiedono passi prudenti.

---

Prossimo passo: **[Modulo 5 — Regia Fisica, Timeline Narrativa e Architettura Pro](./06-modulo-5-regia-timeline-e-architettura-pro.md)**.
