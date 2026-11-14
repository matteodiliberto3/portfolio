import type { Metadata } from "next";
import { BackHome } from "@/components/back-home";
import { Booking } from "@/components/booking/booking";

export const metadata: Metadata = {
  title: "Prenota un primo confronto",
  description:
    "Trenta minuti su Google Meet con Matteo Di Liberto per valutare la situazione della tua azienda, i rischi concreti e i primi passi di verifica.",
  alternates: { canonical: "/prenota" },
  openGraph: {
    title: "Prenota un primo confronto — Matteo Di Liberto",
    description:
      "Trenta minuti su Google Meet con Matteo Di Liberto per valutare la situazione della tua azienda, i rischi concreti e i primi passi di verifica.",
    url: "/prenota",
  },
};

export default function BookingPage() {
  return (
    <main className="bk-page">
      <header className="bk-top">
        <BackHome className="bk-back press">← TORNA AL SITO</BackHome>
        <span className="bk-top-meta">GOOGLE MEET · 30 MIN · SOLO SU APPUNTAMENTO</span>
      </header>

      <div className="bk-shell">
        <div className="bk-intro">
          <h1 className="bk-title">
            <span className="line-mask">
              <span className="line intro-line" style={{ ["--i" as string]: 1 }}>
                PRENOTA UN PRIMO CONFRONTO.
              </span>
            </span>
          </h1>
          <p className="bk-lede intro-line" style={{ ["--i" as string]: 2 }}>
            Raccontami in breve come lavora la tua azienda o quale sistema vuoi verificare. Valutiamo insieme se ha senso approfondire e da dove partire. Su Google Meet, nel massimo riserbo.
          </p>
        </div>

        <div className="bk-enter">
          <Booking />
        </div>
      </div>
    </main>
  );
}
