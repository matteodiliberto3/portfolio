# Diario di lavoro — sito di presentazione

Cosa è stato fatto, perché, con quali comandi e con quale codice. Scritto per chi vuole capire il ragionamento, non solo il risultato. Nessun segreto è riportato qui: le credenziali vivono solo in `.env.local` (ignorato da git) e nelle variabili d'ambiente di Vercel.

---

## 1. Impianto del progetto

**Stack**: Next.js 16 (App Router, Turbopack), React 19, TypeScript, CSS scritto a mano in `app/globals.css` (Tailwind v4 è importato ma non usato per lo stile). Nessuna libreria di animazione: tutto il movimento è CSS, per un motivo preciso spiegato al §3.

**Comandi iniziali**

```powershell
npx create-next-app@latest site --ts --app --eslint
# la cartella "SITO PRESENTAZIONE" non è un nome npm valido, quindi lo scaffold
# è stato fatto in ./site e poi spostato alla radice; package.json rinominato "sito-presentazione"
npm run dev      # server di sviluppo su http://localhost:3000
npx tsc --noEmit # controllo tipi, eseguito dopo ogni modifica
npm run lint     # eslint con le regole Next
```

**Struttura**

```
app/
  layout.tsx            font (Geist, Geist Mono, Instrument Serif), <html lang="it">
  page.tsx              la home: Opening → About → Works → Interlude → Process → Contact
  globals.css           token, ruoli tipografici, tutto il movimento
  lavori/[slug]/page.tsx  pagina di dettaglio di ogni lavoro
  prenota/page.tsx      schermata di prenotazione
  api/disponibilita/route.ts   GET: slot liberi di un mese
  api/prenota/route.ts         POST: crea l'evento sul calendario
components/
  reveal.tsx            wrapper che anima l'ingresso (e il rientro) degli elementi
  heading.tsx           titolo di capitolo con parole che salgono da una maschera
  opening.tsx, about.tsx, works.tsx, interlude.tsx, process.tsx, contact.tsx, site-nav.tsx
  booking/booking.tsx   UI di prenotazione (client component)
lib/
  projects.ts           dati dei cinque lavori
  booking/rules.ts      regole di disponibilità + aritmetica dei fusi orari
  booking/google.ts     client REST minimale per Google Calendar (solo server)
  booking/availability.ts  incrocio regole × impegni; modalità di prova
  booking/rate-limit.ts    limitatore per IP in memoria
public/
  portrait.jpg, stills/*.png   ritratto e schermate dei lavori (1440×900)
```

Le schermate dei lavori sono state catturate con Edge headless:

```powershell
& "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe" --headless=new --disable-gpu `
  --hide-scrollbars --window-size=1440,900 --virtual-time-budget=12000 `
  --screenshot="public\stills\voltra.png" "https://voltra.onrender.com/"
```

`--virtual-time-budget` fa avanzare il tempo virtuale della pagina così anche i siti che si animano al caricamento vengono catturati a regime.

---

## 2. Design system

Token in `:root` (`app/globals.css`):

| token | valore | uso |
| --- | --- | --- |
| `--paper` | `#e6e1d8` | sfondo, "la carta" |
| `--paper-2` | `#ddd7cc` | superfici secondarie, tende |
| `--ink` | `#14171c` | testo principale, bottoni pieni |
| `--ink-2` | `#3c3934` | testo secondario, accenti nei titoli |
| `--muted` | `#5e5a54` | etichette, didascalie |
| `--line` | `rgba(20,23,28,.16)` | bordi |
| `--signal` | `#d6f25a` | il pallino "online" |

Tre ruoli tipografici, e basta: **Instrument Serif** per display e titoli di capitolo; **Geist** per corpo e titoli dei lavori; **Geist Mono** maiuscolo 12px per etichette, chip, navigazione. La gerarchia nasce dal contrasto tra questi tre, non da pesi diversi.

Curve di movimento condivise:

```css
--ease-out:   cubic-bezier(0.19, 1, 0.22, 1);        /* ease-out-expo: ingressi, rivelazioni */
--ease-press: cubic-bezier(0.25, 0.46, 0.45, 0.94);  /* pressione dei bottoni */
--ease-move:  cubic-bezier(0.645, 0.045, 0.355, 1);  /* spostamenti sullo schermo */
```

---

## 3. Principi di movimento applicati

Derivano dal corso *Animations on the Web* di Emil Kowalski. In pratica:

- **Solo `transform` e `opacity`** vengono animati: sono le due proprietà che il browser compone sulla GPU senza ricalcolare layout. Niente `height`, `margin`, `top`.
- **Curve asimmetriche e forti** (ease-out-expo): partenza rapida, arrivo morbido. Le curve predefinite (`ease`, `ease-in-out`) sono troppo deboli e fanno sembrare tutto piatto.
- **Durate**: pressione 150ms, hover 120ms, pannelli 240–320ms, ingressi grandi 640–900ms. L'uscita è sempre più corta dell'ingresso o assente.
- **Transizioni, non keyframe, per tutto ciò che può essere interrotto**: le transizioni ripartono dallo stato corrente, i keyframe da zero. Keyframe solo per l'intro di caricamento, che non può essere interrotta.
- **Hover solo con puntatore fine**: `@media (hover: hover) and (pointer: fine)`, altrimenti su touch il tap lascia lo stato hover appeso.
- **Pressione sentita, non vista**: `scale(0.985)` su `:active`.
- **Un ingresso per contenitore**: non si fa scorrere un pannello e poi gocciolare i suoi figli.
- **Lo stagger ha una gerarchia**: la cosa più importante arriva prima; i ritardi variano per importanza.
- **Movimento ridotto = più gentile, non zero**: in `@media (prefers-reduced-motion: reduce)` ogni animazione ha una variante a sola dissolvenza.
- **Il contenuto è visibile senza JavaScript**: le classi che nascondono (`opacity: 0`) vengono applicate solo dopo che lo script ha aggiunto `data-reveal`.

Perché niente `motion/react`: era stato installato all'inizio e poi rimosso. Tutto ciò che serviva (ingressi, stagger, scroll) si fa in CSS, che gira fuori dal thread principale e non pesa sul bundle.

---

## 4. Il componente `Reveal`

Un wrapper client che osserva l'elemento con `IntersectionObserver` e aggiunge attributi; il CSS fa il resto.

```tsx
// components/reveal.tsx (essenziale)
useEffect(() => {
  const node = ref.current!;
  if (alreadyInView(node)) node.dataset.in = "";   // già sullo schermo: niente flash
  node.dataset.reveal = "";

  const enter = new IntersectionObserver(
    (es) => es.forEach((e) => e.isIntersecting && (node.dataset.in = "")),
    { rootMargin: "0px 0px -15% 0px", threshold: 0.05 },     // entra al 15% dal basso
  );
  const leave = new IntersectionObserver(
    (es) => es.forEach((e) => !e.isIntersecting && delete node.dataset.in),
    { rootMargin: "12% 0px 12% 0px", threshold: 0 },          // esce solo se del tutto fuori
  );
  enter.observe(node); leave.observe(node);
  return () => { enter.disconnect(); leave.disconnect(); };
}, []);
```

Due osservatori con soglie diverse: uno decide *quando entrare* (l'elemento deve essere salito un po' dal bordo), l'altro *quando azzerare* (solo fuori schermo, con un margine del 12% oltre il bordo, così il reset non si vede mai). Il reset è istantaneo via CSS:

```css
[data-reveal]:not([data-in]) { opacity: 0; transform: translateY(14px); }
[data-reveal] { transition: opacity 640ms var(--ease-out), transform 640ms var(--ease-out);
                transition-delay: var(--reveal-delay, 0ms); }
[data-reveal]:not([data-in]) { transition-duration: 0ms; transition-delay: 0ms; } /* reset secco */
```

Un dettaglio: in CSS la transizione usa i valori `transition-*` dello **stato di arrivo**. Quindi quando `data-in` viene aggiunto si anima in 640ms; quando viene tolto si applica lo stato `:not([data-in])` che ha durata 0, cioè istantaneo. Un solo meccanismo, due comportamenti.

Prima versione: si animava una volta sola (`unobserve` dopo il primo ingresso). Cambiata su richiesta perché il sito deve animarsi anche tornando indietro.

---

## 5. Titoli di capitolo (`Heading`)

Ogni titolo viene spezzato in parole; ogni parola sta in una maschera con `overflow: hidden` e sale da `translateY(112%)` a 0 con un ritardo crescente.

```tsx
// components/heading.tsx: "/" nel testo = a capo voluto
"Tre passi. / Nessun salto nel vuoto."
```

```css
.h-word-mask { display: inline-block; overflow: hidden; padding: .04em .06em .1em 0; }
.h-word { display: inline-block; transition: transform 900ms var(--ease-out);
          transition-delay: calc(260ms + var(--w) * 60ms); }
.heading[data-reveal]:not([data-in]) .h-word { transform: translateY(112%); }
```

`--w` è l'indice della parola, passato inline. Il padding della maschera evita che le discendenti (g, p, q) vengano tagliate. Per gli screen reader il titolo intero è in uno `<span class="sr-only">`, e la versione spezzata ha `aria-hidden`.

Le etichette numerate «( 01 ) —— Chi sono» esistevano e sono state poi nascoste su richiesta (`hideEyebrow`): restano solo nel testo per screen reader.

---

## 6. L'apertura (hero)

Nome su due righe, lede, bottone e ritratto entrano con keyframe al caricamento (`rise`, `curtain` via `clip-path`, `settle` con scala da 1.08 a 1). I keyframe sono la scelta giusta qui perché l'intro parte da sola e non viene interrotta.

Per farla ripartire quando si torna in alto senza rompere il primo caricamento:

```css
.opening[data-reveal]:not([data-in]) .intro-line { animation: none; opacity: 0; transform: translateY(110%); }
```

Quando la sezione è del tutto fuori schermo, il `Reveal` toglie `data-in`, la regola sopra rimuove l'animazione; quando si rientra, `animation-name` passa da `none` a `rise` e il browser fa ripartire i keyframe dal primo frame. Al primo caricamento `alreadyInView()` mette `data-in` in modo sincrono, quindi quella regola non scatta mai e non c'è flash.

---

## 7. Lavori

Lista alternata destra/sinistra. Ogni schermata ha una **tenda** color carta che scivola via a destra quando entra:

```css
.work-curtain { position: absolute; inset: 0; background: var(--paper-2);
                transform: translateX(101%); transition: transform 900ms var(--ease-out) 40ms; }
[data-reveal]:not([data-in]) .work-curtain { transform: translateX(0); }
```

Il testo accanto entra con ritardi diversi (indice 120ms, titolo 180ms, sommario 260ms, chip 340ms): la gerarchia dello stagger.

---

## 8. L'interludio «Ma quindi… come lavoro?»

Richiesta: dopo i lavori, uno schermo pieno che si scrive con lo scroll. Vincolo: restare sulla carta, senza sfondo blu.

**Struttura**: un tratto alto 300vh (`.interlude-track`) con dentro un pannello `position: sticky; top: 0; height: 100vh`. Il pannello resta fermo mentre il tratto scorre sotto: quello scorrimento è la "linea del tempo".

**Tecnica**: CSS scroll-driven animations, senza JavaScript.

```css
@supports (animation-timeline: view()) {
  .interlude-track { view-timeline-name: --interlude; view-timeline-axis: block; }

  .il-word, .il-dot {
    opacity: 0; transform: translateY(0.35em);
    animation: il-write linear both;
    animation-timeline: --interlude;
    --slot: 7%;
    --start: calc(6% + var(--k) * var(--slot));
    animation-range: contain var(--start) contain calc(var(--start) + var(--slot));
  }
  .il-dot    { --slot: 4%; --start: calc(22% + (var(--k) - 2) * var(--slot)); }
  .il-word-2 { --slot: 9%; --start: calc(44% + var(--k) * var(--slot)); }
}
```

- `view-timeline-name` sul tratto crea una timeline nominata che misura quanto il tratto è attraversato dalla finestra.
- `animation-range: contain X% contain Y%`: la fase `contain` è quella in cui il tratto copre interamente la finestra, cioè mentre il pannello è agganciato. Ogni parola prende una fetta di quella fase.
- `--k` è l'indice del token, passato inline; le fette sono calcolate con `calc`, quindi aggiungere una parola è un numero.
- `linear` è corretto qui: la "curva" la fa la mano di chi scorre.
- Tornando indietro tutto si cancella nello stesso ordine: la timeline è lo scroll, in entrambe le direzioni.

**Il vuoto iniziale**: prima dell'aggancio entrava una schermata di carta bianca (le parole erano invisibili fino a `contain 0%`). Soluzione originale: **la domanda esiste prima delle parole**. Un `?` gigante in Instrument Serif, `font-size: min(96vh, 60vw)`, colore inchiostro con `opacity: 0.055`, come un timbro a secco nella carta. È lì da subito, prende inchiostro mentre si scrive «Ma quindi…» (`opacity → 0.13`), e si ritira (`scale(0.94)`, `opacity → 0`) esattamente mentre si scrive il piccolo «?» di «lavoro?».

```css
.interlude-mark {
  animation: il-ink linear both, il-settle linear both;
  animation-timeline: --interlude, --interlude;
  animation-range: contain 0% contain 40%, contain 50% contain 66%;
}
```

Due animazioni sullo stesso elemento: la seconda compone sopra la prima, e con `both` ogni una tiene il suo ultimo frame. Stesso schema per l'indicazione «Continua a scorrere» in alto a destra (entra a `contain 0–6%`, esce a `74–90%`).

Fallback: dove `animation-timeline` non è supportato il testo è semplicemente scritto; con movimento ridotto il pannello non si aggancia e il segno resta come filigrana fissa.

---

## 9. La schermata di prenotazione (`/prenota`)

### Architettura

```
browser ── GET /api/disponibilita?mese=2026-10 ──▶ route ──▶ availability ──▶ google.busyBetween (free/busy)
                                                                  └──▶ rules.freeSlots (regole × impegni)
browser ── POST /api/prenota {start,name,email,topic} ──▶ route ──▶ availability.isSlotFree (ricontrollo)
                                                                └──▶ google.createCall (evento + invito + Meet)
```

Chi visita riceve **solo gli slot liberi**, mai i tuoi impegni. Il refresh token non lascia il server (`import "server-only"` fa fallire la build se quel modulo finisse in un bundle client).

### Regole (`lib/booking/rules.ts`)

```ts
export const rules = {
  timeZone: "Europe/Rome",
  workDays: [1, 2, 3, 4, 5],        // lun–ven
  dayStart: { h: 9, m: 30 }, dayEnd: { h: 18, m: 0 },
  slotMinutes: 30, bufferMinutes: 15, minNoticeHours: 24, horizonDays: 21,
};
```

La parte delicata è il fuso: un orario "9:30 a Roma" è un istante UTC diverso in estate e in inverno. Senza librerie, si usa `Intl.DateTimeFormat` con `timeZone` per misurare l'offset:

```ts
function tzOffsetMs(at: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", /* y m d h m s */ })
    .formatToParts(at);
  // ricompone le parti come se fossero UTC e confronta con l'istante reale
  return Date.UTC(...) - at.getTime();
}
export function zonedToUtc(day, h, m, tz) {
  const guess = Date.UTC(y, mo - 1, d, h, m);
  let utc = guess - tzOffsetMs(new Date(guess), tz);
  const second = tzOffsetMs(new Date(utc), tz);   // seconda passata per i cambi d'ora
  if (guess - second !== utc) utc = guess - second;
  return utc;
}
```

`freeSlots(day, busy)` genera gli slot dalle 9:30 alle 18:00, scarta quelli prima di `now + 24h` e quelli che si sovrappongono a un impegno allargato del buffer (`start < b.end + buffer && end > b.start - buffer`).

### Client Google (`lib/booking/google.ts`)

REST puro, niente `googleapis` (pesa molto per tre chiamate):

1. `POST https://oauth2.googleapis.com/token` con `grant_type=refresh_token` → access token (in cache fino a scadenza).
2. `POST /calendar/v3/freeBusy` con `timeMin/timeMax/items` → intervalli occupati.
3. `POST /calendar/v3/calendars/{id}/events?conferenceDataVersion=1&sendUpdates=all` con `attendees` e `conferenceData.createRequest` → evento con il cliente invitato e link Meet; Google spedisce gli inviti.

### Modalità di prova

Se manca una delle tre variabili, `isConfigured()` è falso e `availability.ts` usa un pattern deterministico di impegni finti (hash della data) così l'interfaccia mostra giorni pieni e buchi realistici; la conferma restituisce `demo: true` senza creare nulla. L'etichetta «Modalità di prova · orari di esempio» dice la verità a chi guarda.

### Difese nell'API `POST /api/prenota`

- validazione dei campi (nome ≥ 2, email con regex, topic ≤ 600, `start` multiplo di 60s);
- **ricontrollo dello slot sul calendario** al momento della conferma → `409` se nel frattempo è stato preso (niente doppie prenotazioni);
- **honeypot**: un campo `website` invisibile; se è pieno, si risponde `ok` senza fare nulla;
- **rate limit** per IP: 5 prenotazioni/ora, 60 letture/minuto (`lib/booking/rate-limit.ts`, in memoria).

### UI (`components/booking/booking.tsx`)

Stato: mese corrente, direzione del cambio mese, cache per mese, giorno, slot, campi, esito. Tre passi nella colonna destra.

Scelte di movimento:

- selezionare giorno/orario è frequente → evidenziazione **istantanea** (`transition-duration: 0ms` sullo stato premuto);
- ogni pannello sostituito entra con 8px + dissolvenza in 260ms tramite `@starting-style` (nessuno stato "mounted" in React):

```css
.bk-panel {
  transition: opacity 260ms var(--ease-out), transform 260ms var(--ease-out);
  @starting-style { opacity: 0; transform: translateY(8px); }
}
```

- gli orari entrano in fila a 25ms l'uno dall'altro con tetto a 10 (`--i`), così lo stagger non blocca il clic;
- il cambio mese ha una direzione (`data-dir` → `--dx`), da destra se avanzi, da sinistra se torni;
- frecce e giorni con tastiera si muovono senza animazione;
- su mobile, scegliendo un giorno, il pannello degli orari viene portato in vista con `scrollIntoView`.

Un errore di lint utile: `react-hooks/set-state-in-effect` vietava `setLoading(true)` dentro l'effetto. Soluzione: `loading` è **derivato** (`!data && !loadError`), e un `Set` in un `useRef` evita richieste doppie per lo stesso mese.

---

## 10. Il collegamento a Google: cosa è successo e perché

Obiettivo: far agire il sito a nome tuo sul tuo calendario. Il modo corretto per un account Gmail personale è **OAuth con refresh token**: tu acconsenti una volta, il server conserva un token di lunga durata e lo scambia ogni ora con un access token.

Passi nella Google Cloud Console:

1. nuovo progetto («portfolio prenotazione»);
2. **API e servizi → Libreria → Google Calendar API → Abilita**;
3. **Schermata consenso OAuth**: tipo Esterno, tua email tra gli utenti di test, poi **Pubblica** (in stato Testing i refresh token scadono dopo 7 giorni);
4. **Credenziali → ID client OAuth → Applicazione web**, con l'URI di reindirizzamento del metodo che si usa per il consenso;
5. ottenere il refresh token con un consenso nel browser.

Errori incontrati, in ordine, e cosa significano:

| errore | causa | cura |
| --- | --- | --- |
| pagina «Chiavi API» con «non hai l'autorizzazione» | la ricerca ha portato ad *Agent Platform* (Vertex AI), prodotto sbagliato; e per Calendar non serve una chiave API ma un client OAuth | percorso dal menu, non dalla barra di ricerca |
| `unauthorized_client` al refresh | il token era stato emesso per il client **predefinito** del Playground, perché «Authorize» era stato premuto prima di inserire le proprie credenziali nell'ingranaggio | rifare il consenso con ID/secret propri già inseriti |
| `redirect_uri_mismatch` | il client non aveva `https://developers.google.com/oauthplayground` tra gli URI autorizzati | aggiungerlo e attendere la propagazione (minuti) |
| `invalid_client · The OAuth client was not found` | refuso nell'ID client incollato nel Playground | ricopiare l'ID esatto |

Per verificare che ID e secret fossero validi **senza** passare dal Playground, ho interrogato direttamente l'endpoint dei token con un codice finto:

```powershell
curl.exe -s -X POST https://oauth2.googleapis.com/token `
  -d "client_id=$cid" -d "client_secret=$sec" -d "code=test" `
  -d "redirect_uri=https://developers.google.com/oauthplayground" -d "grant_type=authorization_code"
# → {"error":"invalid_grant","error_description":"Malformed auth code."}
```

`invalid_grant` significa «credenziali giuste, codice sbagliato»; se il secret fosse stato errato la risposta sarebbe stata `invalid_client`. Da qui la certezza che il problema fosse solo il token.

### Lo script di consenso locale

Per evitare il Playground: un file Node temporaneo (fuori dal repository) che

1. legge ID e secret da `.env.local`;
2. apre un server locale su `http://localhost:53682/callback`;
3. apre il browser sull'URL di autorizzazione di Google con `access_type=offline&prompt=consent` (senza `offline` non arriva il refresh token; `prompt=consent` forza il rilascio anche se il consenso era già stato dato);
4. riceve il `code` sul callback, lo scambia con `grant_type=authorization_code`;
5. scrive `GOOGLE_REFRESH_TOKEN=…` in `.env.local` e fa una chiamata free/busy di verifica.

Richiede che `http://localhost:53682/callback` sia tra gli URI autorizzati del client. Alla fine dell'operazione lo script viene cancellato.

### Variabili d'ambiente

```env
GOOGLE_CLIENT_ID=…apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-…
GOOGLE_REFRESH_TOKEN=1//…
GOOGLE_CALENDAR_ID=primary
```

In locale in `.env.local` (`.gitignore` ha `.env*` con eccezione `!.env.example`); in produzione in Vercel → Settings → Environment Variables. Per revocare l'accesso: myaccount.google.com → Sicurezza → Connessioni a app e servizi di terze parti.

---

## 11. Come sono state verificate le schermate

Il browser integrato di Cursor non era disponibile, quindi Edge headless pilotato via **Chrome DevTools Protocol** con uno script Node temporaneo in `%TEMP%`:

```powershell
& msedge.exe --headless=new --disable-gpu --hide-scrollbars --remote-debugging-port=9333 `
  --user-data-dir=$env:TEMP\edge-cdp-profile --window-size=1440,900 about:blank
node "$env:TEMP\portfolio-preview\shoot.mjs" "$env:TEMP\portfolio-preview"
```

Lo script si collega al WebSocket di `http://127.0.0.1:9333/json`, e usa:

- `Page.navigate` per aprire la pagina;
- `Emulation.setDeviceMetricsOverride` per fissare la finestra (o simulare un telefono 390×844);
- `Runtime.evaluate` per scorrere a una posizione precisa (`window.scrollTo`) o cliccare (`el.click()`), e per leggere stati (`getAnimations()`, `hasAttribute('data-in')`);
- `Page.captureScreenshot` per il frame.

Così si può fotografare l'animazione *a metà* (per esempio a 380ms dall'ingresso, o al 30% del tratto dell'interludio) e vedere se la coreografia è quella voluta. Profilo e script vengono rimossi alla fine di ogni sessione; niente di tutto questo sta nel repository.

Per riempire i campi del form in modo che React se ne accorga non basta assegnare `.value`: si usa il setter nativo e si emette un evento `input`:

```js
Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, "Prova");
el.dispatchEvent(new Event("input", { bubbles: true }));
```

---

## 12. Cose ancora aperte

- Completare il consenso Google (refresh token emesso per il client giusto) e fare una prenotazione di prova reale, poi cancellarla dal calendario.
- Inserire le quattro variabili su Vercel.
- Il bottone «Scrivimi» punta ancora a GitHub: serve un'email o un altro recapito.
- Decidere se convertire tutte le animazioni al modello "legato allo scroll, avanti e indietro" come l'interludio (proposta descritta in chat, non ancora costruita).
- Il badge «1 Issue» in sviluppo è un *hydration mismatch* causato da un'estensione del browser che aggiunge `data-hasqtip` al `<body>`: non riguarda il codice del sito e non appare in produzione.
