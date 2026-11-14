# Modulo 5 — Regia Fisica, Timeline Narrativa e Architettura Pro

Saper far ruotare un cubo o fare raymarching di una sfera non basta ancora per un componente di livello professionale. Ciò che trasforma una demo tecnica in un elemento di design indimenticabile è la **regia**: trasformare il movimento in una **storia leggibile** e garantire **60fps stabili e accessibilità reale** su qualsiasi dispositivo.

Questo modulo analizza il componente più complesso e maturo del tuo repository: `exploitCube` ([righe 816–1227](file:///c:/Users/matti/Documents/progetti/portfolio/components/laboratorio/laracon-cybersec-site.tsx#L816-L1227)) e il wrapper `PixelDitherCanvas` ([righe 1404–1602](file:///c:/Users/matti/Documents/progetti/portfolio/components/laboratorio/laracon-cybersec-site.tsx#L1404-L1602)).

---

## 1. Dalla "forma che gira" alla Coreografia in Atti

Guarda cosa comunica `exploitCube` senza usare una sola riga di testo dentro il canvas: **una chiave bianca entra in un sistema protetto esploso, apre una breccia e ne estrae un flusso di dati**.

Come si progetta una sequenza così complessa senza perdere il controllo? Dividi un ciclo normalizzato `p` (da `0.0` a `1.0` su `6.0` secondi) in **atti discreti concatenati**, ciascuno con una propria curva `ease`:

| Intervallo `p` | Atto narrativo | Fisica e geometria coinvolta |
| :--- | :--- | :--- |
| **`0.00 .. 0.14`** | **Sgancio** | Il tassello bianco in sospensione si stacca dalla posizione di riposo avanzando lungo `+Z`. |
| **`0.14 .. 0.32`** | **Arco d'attacco** | Traiettoria parabolica in 3D (`tz += sin(u * PI) * 0.24`), rotazione locale del tassello che si allinea a zero e **linea di puntamento** verso il centro della faccia (`drawLine3D`). |
| **`0.32 .. 0.43`** | **Inserimento** | Il tassello colpisce il centro esatto della faccia frontale e scompare dentro la cavità. |
| **`0.36 .. 0.52`** | **Impatto & Shockwave** | Un rettangolo luminoso si espande mentre la luminanza decade (`(1 - shockT)`): trasferimento visivo dell'energia d'urto! |
| **`0.40 .. 0.54`** | **Apertura della breccia** | `holeHalf` si allarga aprendo un quadrato nella faccia frontale, con pulizia dello `zBuf` interno (**maschera cavità nera**) e spessore 3D del bordo (`rimZ0`, `drawQuadZ3D`). |
| **`0.54 .. 0.88`** | **Emissione continua** | Il nucleo interno ruota veloce; 6 corsie sinuose emettono scie e pacchetti 3D (`drawRotatedBox3D`) lungo curve che si aprono a ventaglio uscendo dal foro. |
| **`0.88 .. 1.00`** | **Richiusura & Reset** | Il foro si richiude (`closeOut`) e il tassello ricompare nella posizione iniziale pronto per il ciclo successivo. |

### Regola chiave della regia: Sovrapposizione (Overlapping Action)

Nota gli intervalli sopra: l'impatto inizia a `0.36`, mentre l'inserimento finisce a `0.43` e il foro comincia ad aprirsi a `0.40`. **Le fasi si sovrappongono leggermente**. Se aspettassi la fine esatta di una fase prima di avviare la successiva, tutto sembrerebbe una presentazione PowerPoint a scatti.

---

## 2. Gestire i Trigger Umani senza Sfarfallii (Isteresi & Smorzamento)

Quando leghi una scena allo scroll della pagina (come in `LaraconCybersecSite`, [righe 2329–2353](file:///c:/Users/matti/Documents/progetti/portfolio/components/laboratorio/laracon-cybersec-site.tsx#L2329-L2353)):

### A. Usa l'Isteresi sui confini di attivazione

* Attivi lo stato quando il centro della card scende sotto il `58%` della viewport (`c1 <= vh * 0.58`).
* Disattivi lo stato solo quando la cima della card torna sotto il `48%` (`r1.top > vh * 0.48`).

Quella "fascia morta" tra attivazione e disattivazione (**isteresi**) impedisce all'animazione di accendersi e spegnersi continuamente se l'utente fa un micro-scroll proprio sul punto limite!

### B. Smorza le transizioni in modo asimmetrico

In `PixelDitherCanvas` ([righe 1458–1468](file:///c:/Users/matti/Documents/progetti/portfolio/components/laboratorio/laracon-cybersec-site.tsx#L1458-L1468)):

```ts
// Entra più scattante (0.12), esce più morbido (0.08)
currentExplode += (target - currentExplode) * (target > currentExplode ? 0.12 : 0.08);
```

E quando `target` torna a `0` (l'utente scorre via), il ciclo dell'animazione non taglia secco a metà strada: `exploitCycle *= Math.max(0, 1 - dt * 4)` lo fa rientrare dolcemente verso il riposo.

---

## 3. Multi-colore nello stesso Z-Buffer senza sacrificare le prestazioni

A volte vuoi un dettaglio di colore diverso dentro la stessa scena 3D (il tassello bianco `#F4F3FA` dentro al cubo viola `#8B46FF`), e i due oggetti devono potersi **coprire a vicenda correttamente** in base alla profondità!

Anziché usare due `<canvas>` sovrapposti (dove il bianco starebbe sempre sopra il viola anche quando passa dietro!), aggiungi un terzo array leggero grande quanto il buffer:

```ts
const colorBuf = new Uint8Array(cols * rows); // 0 = colore primario, 1 = colore accento
```

Quando disegni il tassello bianco dentro `splatPoint`, passi `colorId = 1`. Alla fine del frame, quando disegni sul `<canvas>`, raggruppi i cambi di `ctx.fillStyle` solo quando il colore cambia (`if (nextColor !== activeColor)`), evitando centinaia di cambi di stato inutili nel contesto Canvas 2D.

---

## 4. La Checklist Ingegneristica da Produzione

Prima di considerare finito qualsiasi componente 3D interattivo sul web, verifica questi 5 punti — sono tutti presenti in `PixelDitherCanvas`:

1. **Zero Allocazioni per Frame**: `buf`, `zBuf` e `colorBuf` vengono allocati **una sola volta** nel `useEffect` al mount (o resize) e puliti con `.fill(0)`. Mai `new Float32Array()` o `particles.push()` ogni frame dentro `drawFrame`.
2. **Sospensione Automatica fuori Viewport (`IntersectionObserver`)**: se hai 9 oggetti 3D in una pagina lunga, l'utente ne vede al massimo 1 o 2 alla volta. Usare `IntersectionObserver` (`threshold: 0.05`) per fermare `cancelAnimationFrame` quando il canvas esce dallo schermo risparmia il 70–80% di CPU e batteria.
3. **Rispetto reale di `prefers-reduced-motion: reduce`**:
   Non mostrare uno schermo vuoto né far girare l'animazione ignorando la preferenza! Fissa il clock su un **istante chiave rappresentativo** (es. `time = 0.6`, `exploitCycle = 0.66`), disegna esattamente **1 fotogramma statico nitido** e non riaccodare `requestAnimationFrame` ([righe 1437–1541](file:///c:/Users/matti/Documents/progetti/portfolio/components/laboratorio/laracon-cybersec-site.tsx#L1437-L1541)).
4. **Pulizia Event Listener & Timer**: ogni `requestAnimationFrame`, `IntersectionObserver`, `scroll` e `pointermove` deve avere il proprio cleanup nel `return` di `useEffect`.
5. **CSS `imageRendering: "pixelated"`**: fondamentale sui canvas a risoluzione logica bassa affinché i bordi dei blocchi dithered restino taglienti quando il CSS ridimensiona l'elemento in layout responsive.

---

## 5. Progetto Finale "Capolavoro" del Modulo 5

Progetta da zero un oggetto originale a tua scelta (ad esempio: **una serratura crittografica 3D**, **un firewall a scudi concentrici** o **un nodo AI che filtra pacchetti**) seguendo questo ordine rigoroso:

1. Scrivi su carta la **tabella degli atti `p in [0..1]`** (riposo, attivazione, picco fisico, stato stazionario, rientro).
2. Implementa il **prototipo geometrico** su `buf` + `zBuf` senza ancora animazioni complesse.
3. Aggiungi **fisica secondaria** (camera smorzata dal mouse, rimbalzo o onda d'urto all'impatto, pacchetti su traiettoria curva).
4. Applica la **checklist da produzione**: zero allocazioni nel loop, `IntersectionObserver`, `dt` clampato e frame statico su `prefers-reduced-motion`.

---

Prossimo passo (opzionale per scalare su GPU): **[Modulo 6 — Ponte verso WebGL e Shader GLSL](./07-modulo-6-ponte-verso-glsl-e-shaders.md)**.
