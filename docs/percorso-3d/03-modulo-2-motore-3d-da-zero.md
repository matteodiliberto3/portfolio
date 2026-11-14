# Modulo 2 — Il Motore 3D Software da Zero (Senza Librerie)

Un motore 3D non è magia nera: per disegnare un cubo rotante con ombreggiature e profondità ti servono **quattro sole idee matematiche**: rotazione, proiezione prospettica, prodotto scalare per la luce e Z-buffer per decidere cosa copre cosa.

In questo modulo costruisci l'esatto nucleo alla base di `rotatePoint`, `splatPoint` e `drawFilledBox3D` in [laracon-cybersec-site.tsx](file:///c:/Users/matti/Documents/progetti/portfolio/components/laboratorio/laracon-cybersec-site.tsx#L75-L226), confrontandolo anche con l'approccio poligonale di [crystal-portfolio.tsx](file:///c:/Users/matti/Documents/progetti/portfolio/components/laboratorio/crystal-portfolio.tsx#L85-L140).

---

## 1. Rotazioni 3D: pensare per piani che girano

Ruotare un punto `(x, y, z)` in 3D significa applicare due rotazioni 2D di seguito:

1. **Imbardata (`ry`, attorno all'asse verticale Y)**: sposta le coordinate `x` e `z`, lasciando fermo `y`.
2. **Beccheggio (`rx`, attorno all'asse orizzontale X)**: sposta le coordinate `y` e `z`, lasciando fermo `x`.

```ts
type Vec3 = [number, number, number];

function rotatePoint(x: number, y: number, z: number, rx: number, ry: number): Vec3 {
  // 1. Rotazione attorno all'asse Y (gira a destra/sinistra)
  const cosY = Math.cos(ry);
  const sinY = Math.sin(ry);
  const x1 = x * cosY - z * sinY;
  const z1 = x * sinY + z * cosY;

  // 2. Rotazione attorno all'asse X (inclina verso l'alto/basso)
  const cosX = Math.cos(rx);
  const sinX = Math.sin(rx);
  const y2 = y * cosX - z1 * sinX;
  const z2 = y * sinX + z1 * cosX;

  return [x1, y2, z2];
}
```

### Perché l'ordine Y poi X conta

Nelle rotazioni 3D l'ordine non è commutativo (`Ry * Rx` è diverso da `Rx * Ry`). Ruotando **prima attorno a Y** (l'asse verticale dell'oggetto) e **poi inclinando su X** verso lo spettatore ottieni una classica camera orbitale stabile: l'oggetto gira come su un piatto girevole inclinato verso di te.

---

## 2. Proiezione prospettica: trasformare `z` in grandezza

La legge fisica della prospettiva è semplice: **più un punto è lontano dalla camera, più appare piccolo verso il centro**.

Fai attenzione alla **convenzione di segno dell'asse Z** che scegli:

| Convenzione | Dove punta `+Z` | Formula prospettiva | Esempio nel repo |
| :--- | :--- | :--- | :--- |
| **Verso l'osservatore** | `+Z` esce dallo schermo verso di te (più vicino = `z` più grande) | `persp = d / (d - z * k)` | `laracon-cybersec-site.tsx` (`4.5 / (4.5 - rp[2] * 0.4)`) |
| **Dentro lo schermo** | `+Z` entra nello schermo (più lontano = `z` più grande) | `persp = d / (d + z)` | `crystal-portfolio.tsx` (`450 / (450 + z2)`) |

In entrambi i casi:

```ts
const sx = centerX + x_ruotata * scale * persp;
const sy = centerY + y_ruotata * scale * persp;
```

*Attenzione alla singolarità*: se `z` si avvicina così tanto alla camera da annullare il denominatore (`d - z * k <= 0`), `persp` va all'infinito e il punto esplode dietro la camera! Nel motore di `laracon-cybersec-site.tsx` questo si evita limitando `Math.min(3.4, rp[2])` per impedire che particelle o facce oltrepassino l'obiettivo.

---

## 3. Luce e Normali: perché una faccia è chiara e l'altra è scura

Come decide il motore quale faccia di un cubo è luminosa? Usa la **normale della faccia**, cioè un vettore di lunghezza 1 perpendicolare alla superficie che punta verso l'esterno (es. `[0, 0, 1]` per la faccia frontale, `[1, 0, 0]` per la faccia destra).

1. **Ruoti la normale** esattamente come hai ruotato i vertici (usando `rotatePoint`): ottieni `rn`.
2. Fissiamo una **direzione della luce** costante nello spazio (es. luce da in alto-a-destra-fronte: `L = [0.45, -0.55, 0.72]`, ricorda che in Canvas `+Y` punta in basso quindi `-0.55` viene dall'alto!).
3. Calcoli il **prodotto scalare (*dot product*)**:
   ```ts
   const lDot = rn[0] * 0.45 - rn[1] * 0.55 + rn[2] * 0.72;
   ```
   * Se `rn` guarda verso la luce -> `lDot` vicino a `+1` (luminanza alta).
   * Se `rn` è perpendicolare alla luce -> `lDot ≈ 0`.
   * Se è girata dall'altra parte -> `lDot < 0`.

Aggiungendo un minimo di **luce ambientale** (`Math.max(0.18, ...)`), le facce in ombra non spariscono nel nero totale ma mostrano la trama sottile del dithering.

---

## 4. Occlusione: Backface Culling vs Z-Buffer

Se disegni tutte e 6 le facce di un cubo in ordine fisso nell'array, una faccia dietro potrebbe finire disegnata *sopra* una faccia davanti! Hai due soluzioni:

### Soluzione A — Backface Culling (veloce, per solidi chiusi e convessi)

* **Idea**: se una faccia punta via dalla camera, non disegnarla nemmeno!
* *Con normale 3D*: se `+Z` punta verso di noi e `rn[2] < 0` (con un piccolo margine `-0.15` per evitare buchi ai bordi), saltiamo tutta la faccia (`continue`).
* *Con vertici 2D proiettati* (usato in `CrystalPortfolio`, [righe 114–121](file:///c:/Users/matti/Documents/progetti/portfolio/components/laboratorio/crystal-portfolio.tsx#L114-L121)): calcoli il prodotto vettoriale 2D di due lati del triangolo `normalZ = v1x * v2y - v1y * v2x`. Il segno di `normalZ` dice se i vertici sullo schermo girano in senso orario o antiorario: cioè se stai guardando il davanti o il retro della faccia!

### Soluzione B — Z-Buffer (universale, necessario per facce esplose e più oggetti)

Quando un cubo **esplode** (`explodeOffset > 0`), inizi a vedere *dentro* il cubo: le facce posteriori diventano visibili attraverso le fessure tra quelle anteriori, quindi il culling non basta! E se due oggetti si intersecano, nessuno dei due è interamente "davanti" all'altro.

Serve un secondo array grande quanto lo schermo logico: `zBuf = new Float32Array(cols * rows)` inizializzato a `-Infinity` (`-1e9`).

Ogni volta che scrivi un punto alla cella `(gx, gy)` con profondità `pz`:

```ts
// Versione concettuale di splatPoint (assumendo +Z verso la camera)
const idx = gy * cols + gx;
if (pz >= zBuf[idx]) {
  zBuf[idx] = pz;     // Ora questo pixel è il più vicino!
  buf[idx] = lum;     // Aggiorna la luminanza
}
```

Se un punto appartiene a una faccia posteriore (`pz = -0.8`) e la cella contiene già una faccia anteriore (`zBuf[idx] = +0.7`), il punto viene scartato automaticamente.

---

## 5. Dinamica applicata al 3D

Adesso puoi dare **vita fisica** al solido su due assi:

1. **Camera / Rotazione reattiva al cursore con inerzia**:
   Non collegare direttamente `ry = mouseX`: usa una variabile smorzata `p.x += (p.tx - p.x) * 0.08` come nel Modulo 0, oppure applica una velocità angolare con attrito (`angVel = (angVel + impulse) * 0.94`) così puoi "lanciare" il cubo col cursore e vederlo rallentare per inerzia!
2. **Esplosione fisica lungo le normali**:
   Ogni faccia conosce la propria normale (direzione verso l'esterno). Spostare il piano della faccia di `half[2] + explodeOffset` fa aprire il cubo lungo i 6 assi naturali, mantenendo intatta la coerenza geometrica e le ombre ([righe 189–194](file:///c:/Users/matti/Documents/progetti/portfolio/components/laboratorio/laracon-cybersec-site.tsx#L189-L194)).
3. **Edge Highlighting**:
   Quando campioni una faccia su griglia `(iu, iv)` tra `0` e `steps`, se `iu === 0 || iu === steps` stai campionando uno spigolo: aumenti la luminanza di `+0.16` per disegnare automaticamente bordi nitidi senza dover tracciare linee separate.

---

## 6. Laboratorio pratico del Modulo 2

Implementa una funzione `drawBox3D` da zero dentro il tuo ciclo del Modulo 0:

1. Prepara `buf = new Float32Array(cols * rows)` e `zBuf = new Float32Array(cols * rows)`.
2. A inizio di ogni frame: `buf.fill(0); zBuf.fill(-1e9);`.
3. Campiona tutte e 6 le facce di un cubo di semi-lato `0.75` su una griglia `14 × 14` per faccia.
4. Aggiungi uno slider o un trigger click/scroll che fa oscillare `explodeTarget` tra `0` e `0.45`, inseguito da `currentExplode` con una molla smorzata (dal Modulo 1!).

### Sfide per verificare che hai padroneggiato il modulo

1. **Confronto Z-buffer**: spegni temporaneamente il controllo `pz >= zBuf[idx]` mentre il cubo ruota e osserva l'artefatto visivo (*sorting glitch*). Riaccendilo e guarda sparire ogni sovrapposizione errata.
2. **Linee 3D nel buffer (`drawLine3D`)**: scrivi una funzione che interpola tra due punti 3D `A` e `B` dopo averli ruotati e li deposita nello stesso `zBuf`: ora puoi mischiare wireframe e solidi opachi nello stesso spazio!
3. **Esplosione con rimbalzo**: invece di `currentExplode += (target - currentExplode) * 0.08`, usa una vera molla (`vel = (vel + (target - explode) * stiffness) * damping`): quando il cubo si richiude, sbatterà e vibrerà leggermente come metallo vero!

---

Prossimo passo: **[Modulo 3 — Superfici Parametriche e Sistemi Gerarchici](./04-modulo-3-superfici-parametriche-e-gerarchie.md)**.
