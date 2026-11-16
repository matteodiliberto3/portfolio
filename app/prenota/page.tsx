import type { Metadata } from "next";
import { BackHome } from "@/components/back-home";
import { Booking } from "@/components/booking/booking";
import { ArrowIcon } from "@/components/cyber/arrow-icon";

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
        <BackHome className="bk-back press">
          <ArrowIcon direction="left" />
          TORNA AL SITO
        </BackHome>
        <span className="bk-top-meta">GOOGLE MEET · 30 MIN · SOLO SU APPUNTAMENTO</span>
      </header>

      <div className="bk-shell">
        <h1 className="sr-only">Prenota un primo confronto</h1>

        <div className="bk-enter">
          <Booking />
        </div>
      </div>
    </main>
  );
}
