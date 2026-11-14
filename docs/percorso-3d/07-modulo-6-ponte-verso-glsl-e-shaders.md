# Modulo 6 (Ponte Pro) — Quando restare su Canvas 2D e quando passare a GLSL / GPU

Arrivato a questo punto sai già scrivere un piccolo motore grafico completo da zero in TypeScript puro. L'ultima competenza di livello Pro è **scegliere l'architettura giusta** e sapere come portare tutta questa matematica sulla GPU quando i requisiti cambiano.

---

## 1. Canvas 2D Software Engine vs WebGL / GLSL: quando usare cosa

Il tuo progetto attuale dimostra una lezione preziosa: spesso **non serve Three.js né WebGL** per ottenere un risultato distintivo.

| Criterio | CPU `<canvas>` 2D + Buffer | GPU WebGL / Shader GLSL |
| :--- | :--- | :--- |
| **Estetica pixel / halftone / ASCII a bassa densità** | **Ideale**: controlli ogni glifo, croce `+`/`×`, gap da 1px con nitidezza matematica | Possibile, ma richiede scrivere più boilerplate shader |
| **Peso bundle & avvio istantaneo** | **Zero KB di dipendenze**; nessuna compilazione shader al boot | Richiede setup WebGL o libreria (es. Three.js ~150KB+ gzipped) |
| **Risoluzione / Numero di pixel calcolati** | Ottimo fino a ~`100 × 80` celle (`< 10.000` celle) | Necessario se vuoi **full-screen 4K** o **100.000+ particelle / raymarching ad alta risoluzione** |
| **Effetti ottici continui** | Difficile (blur pesanti, rifrazione RGB pixel-per-pixel lenta su CPU) | **Naturale**: rifrazione cromatica, distorsioni, post-processing a 120fps |
| **Accessibilità & determinismo cross-browser** | Funziona ovunque senza problemi di driver WebGL o limiti di contesti attivi (ricorda che i browser limitano a ~8–16 contesti WebGL contemporanei in una sola pagina!) | Se metti 9 canvas WebGL nella stessa pagina rischi il crash `WebGL context lost`! |

*Nota fondamentale sull'ultimo punto*: in una pagina con **9 scene dithered simultanee** come la tua home, usare Canvas 2D evita completamente il limite hardware dei contesti WebGL del browser!

---

## 2. La traduzione 1:1 da TypeScript CPU a Fragment Shader GLSL

La bellezza di aver imparato i Moduli 0, 2 e 4 è che **la matematica non cambia di una virgola** passando a GLSL (il linguaggio delle GPU): cambia solo chi esegue il ciclo `for (gy) for (gx)`.

Su CPU scrivi il doppio ciclo `for`. In un **Fragment Shader**, la GPU esegue la stessa funzione **in parallelo su migliaia di core contemporaneamente** per ogni pixel `gl_FragCoord.xy`.

### Tabella di traduzione rapida

| Concetto in questo percorso (TS) | Equivalente in GLSL (GPU) |
| :--- | :--- |
| `(gx / cols - 0.5) * 2 * (cols / rows)` | `vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;` |
| `time` (`dt` accumulato) | `uniform float u_time;` |
| `pointerRef` smorzato `(mx, my)` | `uniform vec2 u_mouse;` |
| `Vec3 = [x, y, z]` | `vec3 p = vec3(x, y, z);` |
| `Math.hypot(x, y, z)` | `length(p)` |
| `rotatePoint(...)` | Moltiplicazione `p.xz *= mat2(c, -s, s, c);` |
| `BAYER_8X8[gy & 7][gx & 7] / 64` | Funzione `bayer8x8(ivec2(gl_FragCoord.xy / cellSize))` o texture 8×8 nearest-neighbor |
| `evalMutantShape(...)` (Modulo 4) | Identica in `float map(vec3 p)`! |
| `evalSDF(hx + eps) - ...` | `normalize(vec3(map(p+e.xyy)-map(p-e.xyy), ...))` |

---

## 3. Esempio concreto: il Modulo 4 (SDF + Bayer) tradotto in Shader

Guarda quanto assomiglia il raymarching visto nel Modulo 4 a un vero Fragment Shader GLSL:

```glsl
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;

float sdMutant(vec3 p) {
  float r = length(p);
  vec3 u = p / max(r, 0.0001);
  float rip = 0.035 * sin(u.x * 6.5 + u_time * 3.1) * cos(u.y * 6.5 - u_time * 2.4);
  return r - (0.65 + rip);
}

vec3 calcNormal(vec3 p) {
  vec2 e = vec2(0.015, 0.0);
  return normalize(vec3(
    sdMutant(p + e.xyy) - sdMutant(p - e.xyy),
    sdMutant(p + e.yxy) - sdMutant(p - e.yxy),
    sdMutant(p + e.yyx) - sdMutant(p - e.yyx)
  ));
}

void main() {
  // 1. Griglia logica a blocchi stile pixel-locked (es. celle da 5px)
  float cell = 5.0;
  vec2 snappedCoord = floor(gl_FragCoord.xy / cell) * cell + cell * 0.5;
  vec2 uv = (snappedCoord - 0.5 * u_resolution) / u_resolution.y * 2.5;

  // 2. Camera e raggio
  vec3 ro = vec3(0.0, 0.0, 4.5);
  vec3 rd = normalize(vec3(uv, -4.5));

  float t = 3.0;
  bool hit = false;
  for (int i = 0; i < 40; i++) {
    vec3 p = ro + rd * t;
    float d = sdMutant(p);
    if (d < 0.01) { hit = true; break; }
    t += d * 0.62;
    if (t > 6.5) break;
  }

  if (!hit) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    return;
  }

  vec3 p = ro + rd * t;
  vec3 n = calcNormal(p);
  float lum = max(0.18, 0.35 + dot(n, normalize(vec3(0.45, 0.55, 0.72))));

  gl_FragColor = vec4(vec3(lum), 1.0);
}
```

Se hai completato i Moduli 0–5, **leggi questo shader senza difficoltà**, perché hai già capito ogni singolo numero che c'è dentro!

---

## 4. E per la Fisica pesante (100.000+ particelle)?

Quando le particelle del Modulo 1 superano la soglia di ciò che la CPU aggiorna comodamente in JS (`~20.000–30.000` a 60fps):

1. **Passo intermedio su CPU**: Sposta il `Float32Array` dentro un **Web Worker** usando `SharedArrayBuffer` o trasferimento veloce, lasciando libero il thread UI di React.
2. **Passo GPU vero (GPGPU / Ping-Pong FBO o WebGPU Compute)**: Memorizzi `(x, y, vx, vy)` dentro i canali RGBA di una texture `Float32` invece che in `Float32Array`, e un compute/fragment shader applica la Legge di Hooke e il campo del mouse in parallelo su un milione di particelle.

---

## Riepilogo finale del tuo kit mentale

Indipendentemente dallo strumento (Canvas 2D, WebGL o WebGPU), il processo creativo resta identico:

1. **Rappresenta lo stato** in numeri puliti e normalizzati.
2. **Applica il moto o le forze** (onde, curve a fasi, molle `stiffness`/`damping`, campi radiali) rispettando il tempo `dt`.
3. **Proietta o interseca lo spazio** (Z-buffer, rotazioni locali/globali, raymarching SDF).
4. **Quantizza nello stile** (matrice di Bayer, glifi, palette contrastate, luce sui bordi).
5. **Proteggi l'esperienza utente** (`IntersectionObserver`, zero allocazioni nel loop, `prefers-reduced-motion`).

Torna all'[Indice del Percorso](./00-indice-e-mentalita.md) per rivedere la mappa completa o iniziare dal Modulo 0.
