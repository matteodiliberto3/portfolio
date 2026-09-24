/**
 * Scroll-driven interlude between Works and Process.
 * A 300vh track with a sticky 100vh panel. Each word is written by scroll
 * position (CSS scroll-driven animations), so scrolling back erases it.
 * Without support, the text is simply visible.
 *
 * The question exists before its words: a giant "?" is pressed into the
 * paper from the moment the panel enters, takes ink while "Ma quindi…" is
 * written, and settles away once "lavoro?" gives it a voice.
 */
const LINE_1 = ["Ma", "quindi"];
const LINE_2 = ["come", "lavoro?"];

export function Interlude() {
  return (
    <section className="interlude" aria-label="Ma quindi, come lavoro?">
      <div className="interlude-track">
        <div className="interlude-panel">
          <span className="interlude-mark" aria-hidden>
            ?
          </span>
          <p className="interlude-text">
            <span className="interlude-line">
              {LINE_1.map((w, i) => (
                <span key={w} className="il-word" style={{ ["--k" as string]: i }}>
                  {w}
                </span>
              ))}
              <span className="il-dots" aria-hidden>
                <span className="il-dot" style={{ ["--k" as string]: 2 }}>
                  .
                </span>
                <span className="il-dot" style={{ ["--k" as string]: 3 }}>
                  .
                </span>
                <span className="il-dot" style={{ ["--k" as string]: 4 }}>
                  .
                </span>
              </span>
            </span>
            <span className="interlude-line interlude-line-2">
              {LINE_2.map((w, i) => (
                <span key={w} className="il-word il-word-2" style={{ ["--k" as string]: i }}>
                  {w}
                </span>
              ))}
            </span>
          </p>
          <span className="interlude-hint eyebrow" aria-hidden>
            Continua a scorrere
          </span>
        </div>
      </div>
    </section>
  );
}
