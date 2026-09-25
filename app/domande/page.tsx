import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { faqJsonLd, faqs, graphJsonLd } from "@/lib/site";

export const metadata: Metadata = {
  title: "Domande",
  description:
    "Chi sono, che lavori ho online, come si inizia un progetto e cosa resta al cliente a fine lavoro.",
  alternates: { canonical: "/domande" },
  openGraph: {
    title: "Domande — Matteo Di Liberto",
    description:
      "Chi sono, che lavori ho online, come si inizia un progetto e cosa resta al cliente a fine lavoro.",
    url: "/domande",
  },
};

export default function FaqPage() {
  return (
    <article className="page">
      <JsonLd data={graphJsonLd([faqJsonLd()])} />
      <Link className="back press" href="/">
        Torna alla home
      </Link>
      <h1>Domande</h1>
      <p className="detail">
        Le cose che mi vengono chieste prima di iniziare. Se ne manca una, scrivimi.
      </p>
      <dl className="faq-list">
        {faqs.map((item) => (
          <div className="faq-item" key={item.question}>
            <dt>{item.question}</dt>
            <dd>{item.answer}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
