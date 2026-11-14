# Modulo 3 — Superfici Parametriche, Gerarchie e Sistemi Articolati

Un cubo è fatto di facce piane. Come si costruiscono solidi curvi (come il toro di `RETOOL`) oppure meccanismi composti da più parti indipendenti che ruotano su se stesse mentre orbitano in una struttura più grande (come `hollowCube`, `cluster` o `drawEvolvingStructure3D`)?

La risposta sta in due strumenti potenti: **equazioni parametriche `(u, v)`** e **trasformazioni gerarchiche (spazio locale -> spazio mondo)**.

---

## 1. Superfici parametriche 3D: il Toro senza mesh

Per disegnare una superficie curva non ti servono file `.obj` né triangolazioni: ti bastano **due angoli** `u` e `v` che variano da `0` a `2 * Math.PI`.

Immagina un **toro** (ciambella):
* L'angolo `u` fa il giro lungo l'anello principale di raggio maggiore `R`.
* L'angolo `v` fa il giro attorno alla sezione circolare del tubo di raggio minore `r`.

```ts
// Da torus in components/laboratorio/laracon-cybersec-site.tsx (righe 1297-1318)
const R = 0.74; // Raggio dell'anello
const r = 0.28; // Spessore del tubo

for (let iu = 0; iu < stepsU; iu++) {
  const u = (iu / stepsU) * Math.PI * 2;
  const cu = Math.cos(u);
  const su = Math.sin(u);

  for (let iv = 0; iv < stepsV; iv++) {
    const v = (iv / stepsV) * Math.PI * 2;
    const cv = Math.cos(v);
    const sv = Math.sin(v);

    // 1. Posizione 3D del punto sulla superficie
    const ox = (R + r * cv) * cu;
    const oy = (R + r * cv) * su;
    const oz = r * sv;

    // 2. Normale esatta nel punto (basta togliere R!)
    const nx = cv * cu;
    const ny = cv * su;
    const nz = sv;

    // 3. Ruota sia il punto che la normale
    const rp = rotatePoint(ox, oy, oz, rx, ry);
    const rn = rotatePoint(nx, ny, nz, rx, ry);

    // 4. Backface culling rapido: salta i punti dietro il tubo
    if (rn[2] < -0.1) continue;

    // 5. Shading morbido usando il dot product con la direzione luce
    const lum = Math.max(0.18, 0.35 + rn[0] * 0.35 - rn[1] * 0.38 + rn[2] * 0.45);
    // ... proiezione prospettica e splatPoint su zBuf
  }
}
```

### Perché la normale è così semplice?

Il centro locale della sezione circolare del tubo sta a distanza `R` dall'origine nella direzione `(cu, su, 0)`. Il punto sul tubo è quel centro più un vettore di lunghezza `r` in direzione `(cv*cu, cv*su, sv)`. Quindi quella direzione stessa è già un vettore unitario perpendicolare alla superficie!

*Suggerimento sul campionamento*: il numero di passi `stepsU` e `stepsV` (`56 × 26`) deve essere abbastanza denso da non lasciare "buchi" tra un pixel proiettato e il vicino sulla griglia di destinazione.

---

## 2. Gerarchie spaziali: Spazio Locale -> Spazio Padre -> Spazio Mondo

Nel Modulo 2 ruotavi tutto intorno all'origine `[0, 0, 0]`. Ma cosa succede se vuoi un satellite o un blocco che **gira sul proprio asse** mentre **orbita o si sposta** dentro una scena che a sua volta sta ruotando?

Devi applicare le trasformazioni **dall'interno verso l'esterno**:

```text
[ Vertice locale dell'oggetto (lx, ly, lz) ]
                  |
                  v  rotatePoint(..., boxRx, boxRy)
[ Orientato nel suo sistema locale (br) ]
                  |
                  v  + center[0..2]   (traslazione nel sistema del padre)
[ Posizionato nella scena (center + br) ]
                  |
                  v  rotatePoint(..., sceneRx, sceneRy)
[ Orientato nello spazio camera (rp) ]
```

È esattamente ciò che fa `drawRotatedBox3D` ([righe 228–299](file:///c:/Users/matti/Documents/progetti/portfolio/components/laboratorio/laracon-cybersec-site.tsx#L228-L299)):

```ts
// Rotazione della normale in due passaggi per mantenere l'illuminazione corretta!
const localNormal = rotatePoint(face.normal[0], face.normal[1], face.normal[2], boxRx, boxRy);
const worldNormal = rotatePoint(localNormal[0], localNormal[1], localNormal[2], rx, ry);

// Rotazione e traslazione del punto
const br = rotatePoint(lx, ly, lz, boxRx, boxRy);
const rp = rotatePoint(center[0] + br[0], center[1] + br[1], center[2] + br[2], rx, ry);
```

*Regola fondamentale*: **trasla solo dopo la rotazione locale, e ruota nel mondo dopo aver traslato**. Se invertissi l'ordine, l'oggetto orbiterebbe prima attorno all'origine e poi girerebbe sul posto sbagliato.

---

## 3. Costruire strutture complesse da primitive semplici

Una volta che hai `drawFilledBox3D` e `drawRotatedBox3D`, qualsiasi architettura geometrica diventa una **lista dichiarativa di blocchi** (`center` + `half-extents`):

* **`cluster`** ([righe 1254–1264](file:///c:/Users/matti/Documents/progetti/portfolio/components/laboratorio/laracon-cybersec-site.tsx#L1254-L1264)): 6 parallelepipedi asimmetrici di varie dimensioni attorno al centro — grazie allo `zBuf` si intersecano senza glitch grafici.
* **`hollowCube`** ([righe 1364–1380](file:///c:/Users/matti/Documents/progetti/portfolio/components/laboratorio/laracon-cybersec-site.tsx#L1364-L1380)): 12 travi spesse lungo gli spigoli di un cubo. Invece di modellare un cubo forato in Blender, ti bastano 12 righe di coordinate!

### Da struttura statica a meccanismo evolutivo (`drawEvolvingStructure3D`)

Guarda come `drawEvolvingStructure3D` ([righe 351–458](file:///c:/Users/matti/Documents/progetti/portfolio/components/laboratorio/laracon-cybersec-site.tsx#L351-L458)) usa la stessa geometria in tre stati dinamici distinti:

1. **Stato 0 (`Retool`) — Disgregazione**: alcune travi vengono omesse, altre spostate con un leggero *drift* oscillante (`0.24 + 0.05 * sin(t * 1.8 + i)`) e inclinate con `drawRotatedBox3D`. Nota il fattore `+ i`: **sfasare ogni elemento con il suo indice** evita che tutti i pezzi oscillino all'unisono come soldatini.
2. **Stato 1 (`Adapt`) — Allineamento guidato**: compare un impulso `adaptPulse` (`0.5 + 0.5 * sin(t * 2.0)`) e `drawLine3D` disegna guide assiali tra il centro/target e le piastre in movimento. Le linee di guida comunicano visivamente il **vincolo fisico** verso cui il sistema sta convergendo!
3. **Stato 2 (`Evolve`) — Coesione e micro-respiro**: tutte le 12 travi sono bloccate e le piastre si agganciano al nucleo con un micro-respiro quasi impercettibile (`0.39 + sin(t * 1.4) * 0.012`), trasmettendo tensione strutturale invece di rigidità morta.

---

## 4. Come pensare la dinamica dei sistemi multi-oggetto

Quando progetti un oggetto composto da `N` pezzi (un cluster, una gabbia, una costellazione):

1. **Rompi la simmetria temporale**: usa sempre uno sfasamento per indice (`t * freq + i * 1.1`) o semi pseudocasuali deterministici per far sembrare i pezzi entità fisiche indipendenti.
2. **Differenzia le scale di massa**:
   * Pezzi grandi (il telaio principale) -> movimento lento, bassa frequenza, ampiezza piccola.
   * Pezzi piccoli (satelliti, pacchetti, frammenti) -> movimento veloce, alta frequenza, rotazioni locali più rapide.
   Questo contrasto di scala fa percepire subito quali parti pesano di più e quali pesano di meno!
3. **Usa vincoli visivi**: quando due corpi si attirano o si riallineano, una semplice linea sottile (`drawLine3D`) o un bagliore sul punto d'aggancio raddoppia la chiarezza della fisica percepita.

---

## 5. Laboratorio pratico del Modulo 3

Costruisci una scena chiamata **"Nucleo + Satelliti Elasticizzati"**:

1. Disegna un **toro** centrale inclinato che ruota lentamente.
2. Attorno al toro fai orbitare 6 piccoli blocchi ruotati localmente (`drawRotatedBox3D`), sfasati angolarmente di `(i / 6) * Math.PI * 2`.
3. Aggiungi un'interazione con il mouse o il click: quando tieni premuto il tasto del mouse, i satelliti passano da **orbita esterna larga** (`radius = 1.25`) ad **aggancio sul nucleo** (`radius = 0.45`), usando una molla `stiffness / damping` (Modulo 1) per ogni satellite con valori di rigidità leggermente diversi per creare un assemblaggio scaglionato e meccanico.

### Sfide aggiuntive

1. **Toro modulato (preludio al Modulo 4)**: modella dinamicamente `r` del toro in funzione dell'angolo `u` e del tempo `t`: `const r = 0.24 + 0.06 * Math.sin(u * 4 - t * 3)`. Vedrai un'onda viaggiare lungo l'anello!
2. **Sfera geodetica / Anello di Saturno**: costruisci un anello di 300 particelle 3D attorno al cubo esploso applicando a ciascuna un'orbita ellittica ruotata nel sistema di riferimento locale.

---

Prossimo passo: **[Modulo 4 — SDF, Raymarching e Dinamica Organica](./05-modulo-4-sdf-raymarching-e-dinamica-organica.md)**.
