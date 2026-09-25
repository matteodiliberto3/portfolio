import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Note",
  robots: { index: false, follow: false },
};

export default function NotesPage() {
  return (
    <article className="page">
      <Link className="back press" href="/">
        Torna alla home
      </Link>
      <h1>Note</h1>
      <p className="empty">
        Qui pubblicherò solo incarichi di cui posso scrivere l’ambito e l’esito.
        Per ora l’indice è vuoto.
      </p>
    </article>
  );
}
