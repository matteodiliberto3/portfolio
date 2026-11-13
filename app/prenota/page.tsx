import { BackHome } from "@/components/back-home";
import { Booking } from "@/components/booking/booking";

export const metadata = {
  title: "Prenota una sessione tecnica",
  description:
    "Trenta minuti su Google Meet con Matteo Di Liberto per definire il perimetro del tuo security assessment o audit di sicurezza.",
  alternates: { canonical: "/prenota" },
  openGraph: {
    title: "Prenota una sessione tecnica — Matteo Di Liberto",
    description:
      "Trenta minuti su Google Meet con Matteo Di Liberto per definire il perimetro del tuo security assessment o audit di sicurezza.",
    url: "/prenota",
  },
};

export default function BookingPage() {
  return (
    <main className="bk-page">
      <header className="bk-top">
        <BackHome className="back press">← Torna al sito</BackHome>
        <span className="eyebrow">Matteo Di Liberto · Cybersecurity</span>
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
              perimetro e difesa.
            </span>
          </span>
        </h1>
        <p className="bk-lede intro-line" style={{ ["--i" as string]: 3 }}>
          Mi racconti la tua infrastruttura e i flussi critici da proteggere, individuiamo insieme
          le priorità d’attacco e la strategia di testing ideale. Su Google Meet, nel massimo riserbo.
          Gli orari sono sincronizzati in tempo reale con la mia disponibilità.
        </p>
      </div>

      <div className="bk-enter">
        <Booking />
      </div>
    </main>
  );
}
