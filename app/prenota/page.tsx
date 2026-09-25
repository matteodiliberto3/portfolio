import { BackHome } from "@/components/back-home";
import { Booking } from "@/components/booking/booking";

export const metadata = {
  title: "Prenota una chiamata",
  description:
    "Trenta minuti su Google Meet con Matteo Di Liberto. Scegli un giorno e un orario libero dal calendario.",
  alternates: { canonical: "/prenota" },
  openGraph: {
    title: "Prenota una chiamata — Matteo Di Liberto",
    description:
      "Trenta minuti su Google Meet con Matteo Di Liberto. Scegli un giorno e un orario libero dal calendario.",
    url: "/prenota",
  },
};

export default function BookingPage() {
  return (
    <main className="bk-page">
      <header className="bk-top">
        <BackHome className="back press">← Torna al sito</BackHome>
        <span className="eyebrow">Matteo Di Liberto</span>
      </header>

      <div className="bk-intro">
        <h1 className="bk-title">
          <span className="line-mask">
            <span className="line intro-line" style={{ ["--i" as string]: 1 }}>
              Trenta minuti,
            </span>
          </span>
          <span className="line-mask">
            <span className="line intro-line" style={{ ["--i" as string]: 2 }}>
              quando vuoi tu.
            </span>
          </span>
        </h1>
        <p className="bk-lede intro-line" style={{ ["--i" as string]: 3 }}>
          Mi racconti di cosa hai bisogno, io ti dico come lo realizzerei. Su Google Meet, senza impegno.
          Gli orari sono letti dal mio calendario: se lo vedi, è libero.
        </p>
      </div>

      <div className="bk-enter">
        <Booking />
      </div>
    </main>
  );
}
