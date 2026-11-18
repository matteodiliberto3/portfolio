import type { Metadata } from "next";
import { Booking } from "@/components/booking/booking";
import { BookingTopBar } from "@/components/booking/booking-topbar";
import { getDictionary } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const page = getDictionary(locale).metadata.pages.prenota;

  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: "/prenota" },
    openGraph: {
      title: `${page.title} — Matteo Di Liberto`,
      description: page.description,
      url: "/prenota",
    },
  };
}

export default async function BookingPage() {
  const locale = await getRequestLocale();
  const t = getDictionary(locale);

  return (
    <main className="bk-page">
      <BookingTopBar />

      <div className="bk-shell">
        <h1 className="sr-only">{t.booking.pageTitle}</h1>

        <div className="bk-enter">
          <Booking />
        </div>
      </div>
    </main>
  );
}
