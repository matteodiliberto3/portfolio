# Modulo 1 — Pensare la Fisica 2D: Forze, Molle, Smorzamento e Particelle

Prima di applicare la fisica in 3D, conviene dominarla in 2D su una popolazione di punti o nodi: le leggi sono esattamente le stesse, ma vedi subito sullo schermo ogni squilibrio numerico.

In questo modulo impari **come modellare la dinamica reale** dietro effetti come lo scudo di particelle elastiche ([tab-dither-physics.tsx](file:///c:/Users/matti/Documents/progetti/portfolio/components/laboratorio/tab-dither-physics.tsx#L192-L217)) e i grafi con shockwave ([tab-topology-mesh.tsx](file:///c:/Users/matti/Documents/progetti/portfolio/components/laboratorio/tab-topology-mesh.tsx#L101-L276)).

---

## 1. Il cambio di paradigma: dall'assegnazione all'integrazione

Nel Modulo 0 scrivevi: *"al tempo `t`, l'oggetto sta nel punto X"*.
Nella dinamica fisica, invece, **non tocchi mai direttamente la posizione con `sin(t)`**. Ogni elemento possiede uno stato:

* `x, y`: posizione attuale
* `ox, oy`: posizione di equilibrio (casa / ancora elastica)
* `vx, vy`: velocità attuale (quanto si sposta per ogni unità di tempo)

La catena causale di ogni singolo frame è sempre:

```text
[ Forze esterne + Forza elastica ]
               |  (F = m * a  --> con massa m = 1, accelerazione = forza)
               v
     [ Aggiorna Velocita' ]   -->  v = (v + a) * damping
               |
               v
     [ Aggiorna Posizione ]   -->  pos = pos + v
```

Questa sequenza si chiama **Eulero semi-implicito** (*Symplectic Euler*): a differenza dell'Eulero ingenuo (che aggiorna prima la posizione con la vecchia velocità), aggiornare **prima la velocità** e **poi la posizione con la nuova velocità** mantiene stabili le molle evitando che guadagnino energia infinita da sole.

---

## 2. Anatomia di una molla: Legge di Hooke + Damping

Una molla che riporta una particella verso la sua posizione originale `(ox, oy)` obbedisce a due sole righe di codice:

```ts
// 1. Forza di richiamo proporzionale alla distanza dalla "casa" (Legge di Hooke: F = -k * dx)
const fx = (ox - x) * stiffness;
const fy = (oy - y) * stiffness;

// 2. Integra la forza nella velocità e dissipa energia con l'attrito (damping)
vx = (vx + fx) * damping;
vy = (vy + fy) * damping;

// 3. Integra la velocità nella posizione
x += vx;
y += vy;
```

### Come pensare e tarare `stiffness` e `damping`

Non scegliere numeri a caso: questi due parametri determinano il carattere fisico dell'oggetto.

| `stiffness` | `damping` | Comportamento visivo | Metafora fisica |
| :--- | :--- | :--- | :--- |
| Alta (`0.15 - 0.25`) | Basso (`0.70 - 0.80`) | Scatta indietro subito e si ferma secco senza vibrare | Elastico corto in olio denso |
| Media (`0.06 - 0.10`) | Medio (`0.86 - 0.90`) | Rientro fluido con micro-rimbalzo elegante *(come il preset `emil` in `TabDitherPhysics`)* | Sospensione sportiva ben tarata |
| Bassa (`0.02 - 0.04`) | Alto (`0.94 - 0.98`) | Galleggia a lungo, oscilla molte volte prima di fermarsi | Pendolo nell'aria / gelatina |
| Qualsiasi | `>= 1.0` | **Esplosione numerica**: l'energia cresce ogni frame | Bug / moto perpetuo divergente |

> **Attenzione al frame rate**: nell'esempio semplificato sopra (`vx = (vx + fx) * damping`), il passo temporale è implicitamente "1 frame". Se vuoi che una molla si comporti **identicamente** a 60 Hz e a 120 Hz, normalizza rispetto a `dt`:
> ```ts
> // Passo fisico indipendente dagli Hz del monitor (riferimento 60fps = 1/60)
> const dtNorm = Math.min(0.05, dt) * 60;
> vx = (vx + fx * dtNorm) * Math.pow(damping, dtNorm);
> vy = (vy + fy * dtNorm) * Math.pow(damping, dtNorm);
> x += vx * dtNorm;
> y += vy * dtNorm;
> ```
> Usare `Math.pow(damping, dtNorm)` garantisce che se su 60 Hz perdi il 12% di velocità in 1/60s, a 120 Hz ne perdi l'equivalente esatto in due passi da 1/120s.

---

## 3. Campi di forza: far reagire la materia al cursore

Quando il mouse entra nel canvas, immaginiamolo come un **campo di forza radiale** di raggio `R`.

### Passo 1: calcola distanza e direzione normalizzata

```ts
const dx = x - mouse.x;
const dy = y - mouse.y;
const d = Math.hypot(dx, dy);

if (d < radius && d > 0.001) {
  const nx = dx / d; // vettore unitario che punta LONTANO dal mouse
  const ny = dy / d;
  ...
}
```

*(Nota la guardia `d > 0.001`: senza di essa, se la particella finisce esattamente sotto al cursore, `d = 0` produce una divisione `0 / 0 = NaN` che distrugge tutto il frame!)*

### Passo 2: scegli il profilo di decadimento (Falloff)

* **Lineare**: `1 - d / radius` — spinge in modo uniforme, bordo visibile "duro".
* **Cubico** (usato in [tab-dither-physics.tsx](file:///c:/Users/matti/Documents/progetti/portfolio/components/laboratorio/tab-dither-physics.tsx#L207)):
  ```ts
  const factor = Math.pow(1 - d / radius, 3) * mouseForce;
  vx += nx * factor;
  vy += ny * factor;
  ```
  Al bordo del raggio `d ≈ radius`, `(1 - 1)^3` scende dolcemente a zero con pendenza nulla; vicino al centro invece esplode di forza. Questo rende il cursore molto più naturale.

### Passo 3 (Pro): trasferire il momento del cursore (`velocityTransfer`)

Un cursore fermo può respingere radialmente, ma un cursore che **taglia veloce** lo schermo dovrebbe trascinare le particelle nella direzione del taglio!
Per farlo, misura la velocità del puntatore tra due eventi (`mouse.vx = mouse.x - mouse.prevX`):

```ts
const falloff = Math.pow(1 - d / radius, 2);
vx += mouse.vx * velocityTransfer * falloff;
vy += mouse.vy * velocityTransfer * falloff;
```

E ricordati di smorzare `mouse.vx *= 0.85` ogni frame in cui il mouse smette di muoversi, altrimenti resta incastrata l'ultima velocità registrata!

---

## 4. Shockwave e campi transitori

In `TabTopologyMesh` ([righe 101–110](file:///c:/Users/matti/Documents/progetti/portfolio/components/laboratorio/tab-topology-mesh.tsx#L101-L110)), un clic genera un'onda d'urto: un cerchio che parte da `r = 10` e cresce ogni frame finché `alpha <= 0`.

Puoi combinare l'onda grafica con una **vera onda d'urto fisica**: ogni nodo che si trova vicino al fronte dell'onda (`Math.abs(distFromOrigin - shock.r) < shockWidth`) riceve un impulso verso l'esterno proporzionale a `shock.alpha`. Così il clic "muove" fisicamente la rete mentre il cerchio luminoso la attraversa.

---

## 5. Architettura memoria: Structure of Arrays (`Float32Array`)

Se animi 50 particelle, un array di oggetti `{ x, y, vx, vy }[]` funziona bene.
Se ne animi **20.000**, gli oggetti JS sparsi in memoria causano *cache miss* della CPU e pause del Garbage Collector.

La tecnica pro (usata in `TabDitherPhysics`, [righe 78–86](file:///c:/Users/matti/Documents/progetti/portfolio/components/laboratorio/tab-dither-physics.tsx#L78-L86)) è **Structure of Arrays (SoA)**:

```ts
const count = validPoints.length;
const x  = new Float32Array(count);
const y  = new Float32Array(count);
const ox = new Float32Array(count);
const oy = new Float32Array(count);
const vx = new Float32Array(count);
const vy = new Float32Array(count);
```

Tutti i valori di `x` sono contigui in RAM in blocchi da 4 byte: la CPU precarica la cache automaticamente e il ciclo `for (let i = 0; i < count; i++)` gira con una velocità vicina al C.

---

## 6. Laboratorio pratico del Modulo 1

Costruisci una griglia di 3.000 micro-quadrati a forma di cerchio o scudo e aggiungi **tre modalità fisiche**:

1. **Repulsione (`repel`)**: `vx += nx * factor`
2. **Attrazione magnetica (`attract`)**: inverti il segno `vx -= nx * factor`, aggiungendo una forza tangenziale `vx += -ny * swirl; vy += nx * swirl` per creare un vortice!
3. **Taglio (`slice`)**: applica solo `mouse.vx * velocityTransfer` così il logo si squarcia lungo la direzione del movimento e poi si ricuce elasticamente.

### Checklist di debug fisico (quando "qualcosa esplode")

* Le particelle spariscono all'infinito appena tocco il bordo? Controlla `d > 0.001` prima di dividere per `d`.
* Tutto vibra all'infinito senza fermarsi mai? `damping` è `>= 1` oppure `stiffness` è troppo alta rispetto al passo temporale.
* Quando cambio tab del browser poi tutto esplode? Manca il clamping di `dt`.
* La forza del mouse continua a spingere dopo che ho smesso di muoverlo? Non stai azzerando o smorzando `mouse.vx` / `mouse.vy` nel loop di render.

---

Prossimo passo: **[Modulo 2 — Il Motore 3D Software da Zero](./03-modulo-2-motore-3d-da-zero.md)**.
