# Percorso da 0 a Pro: Oggetti 3D Procedurali, Fisica e Dinamica su Canvas

Questo percorso ti guida passo dopo passo a progettare e scrivere da zero oggetti 3D animati, sistemi fisici reattivi e rendering stilizzati (dithering Bayer, griglie discrete, raymarching SDF) in TypeScript e HTML5 `<canvas>`, **senza dipendere da motori 3D esterni** come Three.js.

Ogni modulo collega la **teoria intuitiva** (come *pensare* il moto e le forze) all'**implementazione reale** usata in questo repository.

---

## Mappa dei moduli

| Modulo | File | Focus principale | Riferimento nel progetto |
| :--- | :--- | :--- | :--- |
| **0** | [01-modulo-0-griglia-tempo-e-dithering.md](./01-modulo-0-griglia-tempo-e-dithering.md) | Loop temporale, buffer su CPU, coordinate normalizzate, Bayer dithering 8×8 | `PixelDitherCanvas`, `BAYER_8X8`, `tunnel`, `wave` in `components/laboratorio/laracon-cybersec-site.tsx` |
| **1** | [02-modulo-1-fisica-2d-particelle-e-molle.md](./02-modulo-1-fisica-2d-particelle-e-molle.md) | Legge di Hooke, smorzamento, integrazione numerica, campi radiali, memoria SoA | `TabDitherPhysics` (`tab-dither-physics.tsx`), `TabTopologyMesh` (`tab-topology-mesh.tsx`) |
| **2** | [03-modulo-2-motore-3d-da-zero.md](./03-modulo-2-motore-3d-da-zero.md) | Rotazioni 3D, proiezione prospettica, normali, luce direzionale, Z-buffer & culling | `rotatePoint`, `splatPoint`, `drawFilledBox3D`, `CrystalPortfolio` (`crystal-portfolio.tsx`) |
| **3** | [04-modulo-3-superfici-parametriche-e-gerarchie.md](./04-modulo-3-superfici-parametriche-e-gerarchie.md) | Superfici curve `(u, v)`, spazi locali/globali, moduli articolati e sfasamento | `torus`, `drawRotatedBox3D`, `hollowCube`, `drawEvolvingStructure3D` |
| **4** | [05-modulo-4-sdf-raymarching-e-dinamica-organica.md](./05-modulo-4-sdf-raymarching-e-dinamica-organica.md) | Signed Distance Fields, Sphere Tracing, normali via gradiente, morphing e moto biologico | `evalMutantShape`, `drawMutantMorph3D` |
| **5** | [06-modulo-5-regia-timeline-e-architettura-pro.md](./06-modulo-5-regia-timeline-e-architettura-pro.md) | Coreografie a fasi, input umani come energia, performance budget e accessibilità | `exploitCube`, `LaraconCybersecSite`, `IntersectionObserver`, `prefers-reduced-motion` |
| **6** | [07-modulo-6-ponte-verso-glsl-e-shaders.md](./07-modulo-6-ponte-verso-glsl-e-shaders.md) | Quando restare su Canvas 2D e come tradurre 1:1 la stessa matematica in WebGL / GLSL | Architettura GPU & Fragment Shader |

---

## Prima di scrivere codice: come pensare fisica e dinamica

La differenza tra un'animazione che sembra "fatta a mano col righello" e una che trasmette **peso, materia e intenzione** sta in tre decisioni mentali prese prima dell'implementazione.

### 1. Separa sempre Simulazione e Resa visiva

```text
[ Input umani + Tempo (dt) ]
            |
            v
[ 1. SIMULAZIONE / GEOMETRIA ]  --> Spazio astratto: coordinate (-1..+1), velocita',
                                    forze, distanze, intensita' luminosa (0..1)
            |
            v
[ 2. PROIEZIONE / CAMPIONAMENTO ] -> Mappa lo spazio 3D sulla griglia (cols x rows)
                                     risolvendo chi sta davanti (Z-buffer / culling)
            |
            v
[ 3. QUANTIZZAZIONE / STILE ]    --> Traduce la luminanza in pixel, croci Bayer,
                                     ASCII, colori piatti o gradienti
```

Se mischi il calcolo fisico con i pixel del monitor, cambi dimensione del canvas e si rompe tutto. Se separi gli strati, la stessa simulazione può uscire in stile *halftone Bayer*, *wireframe*, *ASCII* o *shader GPU*.

### 2. Scegli tra Moto Guidato e Moto Simulato

Non ogni effetto richiede vera fisica con forze e accelerazioni. Scegli lo strumento più pulito per il risultato che vuoi:

| Tipo | Come ragiona | Quando usarlo | Esempio concreto |
| :--- | :--- | :--- | :--- |
| **Moto guidato (Cinematico / Procedurale)** | Calcola direttamente `posizione = f(t)` usando onde (`sin`/`cos`), easing (`smoothstep`) e fasi `[0..1]`. | Rotazioni continue, battiti ritmici, tunnel, sequenze temporali precise dove tutto deve chiudersi in sync. | Morphing cardiaco in `drawMutantMorph3D`; arco e flusso di `exploitCube`. |
| **Moto simulato (Dinamico)** | L'oggetto ha stato `(pos, vel)`. Ogni frame calcoli le forze `F`, aggiorni `vel`, poi aggiorni `pos`. | Interazioni imprevedibili con mouse/touch, ritorno elastico, urti, sciame di particelle, smoothing organico. | Scudo particellare in `TabDitherPhysics`; smoothing cursore (`p.x += (p.tx - p.x) * 0.08`). |

*Regola pratica*: nella maggior parte dei componenti pro si **combinano entrambi**. La struttura globale segue una coreografia guidata, mentre camera, micro-oscillazioni e interazioni umane passano da uno strato dinamico smorzato.

### 3. I tre ingredienti del "feel" fisico

1. **Inerzia (niente scatti istantanei)**: un oggetto fisico non cambia velocità all'istante. Anche un semplice inseguimento verso un `target` (`current += (target - current) * rate`) introduce un ritardo naturale che fa percepire la massa.
2. **Smorzamento (`damping`)**: in natura l'energia si dissipa per attrito. Senza smorzamento una molla oscilla all'infinito; con troppo smorzamento sembra immersa nel miele; con la giusta taratura rimbalza una volta e si assesta con precisione.
3. **Risposte non lineari (`ease`, potenze, esponenziali)**: le curve lineari sembrano robotiche. Un campo di forza che decade con `(1 - dist / r)^3` o una transizione con `smoothstep` (`u * u * (3 - 2 * u)`) comunicano accelerazione e decelerazione credibili.

---

## Il workflow dei 4 foglietti (prima di aprire l'editor)

Quando vuoi inventare un oggetto nuovo da zero, rispondi su carta a queste 4 domande:

1. **Identità fisica**: cos'è questo oggetto? Un blocco rigido e pesante, un meccanismo a incastri, un fluido mutante, o una nuvola di particelle?
2. **Legge del moto**: cosa lo anima a riposo (onda, rotazione, respiro) e cosa lo frena (attrito, ritorno elastico, fine corsa)?
3. **Accoppiamento con l'utente**: il cursore sposta la camera, respinge materia o altera la velocità? Lo scroll innesca uno stato o modula l'energia continua?
4. **Regola di leggibilità**: a bassa risoluzione logica (es. griglia 80×60), la silhouette si capisce subito anche da ferma? Dove metti il contrasto di luce (ombre nette, bordi illuminati, rim light)?

---

## Come prepararti per gli esercizi

Per seguire tutti i moduli ti basta un singolo componente React/TypeScript con un `<canvas>` (o persino una pagina HTML + `<script type="module">`) e zero librerie esterne.

Un template minimo per testare subito ogni modulo:

```ts
function createLoop(
  draw: (t: number, dt: number, pointer: { x: number; y: number }) => void
) {
  let time = 0;
  let lastTs = performance.now();
  let rafId = 0;
  const pointer = { x: 0, y: 0 };

  const tick = (now: number) => {
    // Regola d'oro: clampa sempre dt (max 50ms) per evitare salti se cambi tab
    const dt = Math.min(0.05, Math.max(0, (now - lastTs) / 1000));
    lastTs = now;
    time += dt;

    draw(time, dt, pointer);
    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(rafId);
}
```

Inizia dal **[Modulo 0: La Griglia, il Tempo e il Dithering](./01-modulo-0-griglia-tempo-e-dithering.md)**.
