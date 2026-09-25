import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { PageLink } from "@/components/page-link";
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
      <PageLink className="back press" href="/" direction="back">
        Torna alla home
      </PageLink>
      <h1>Domande</h1>
      <p className="detail">
        Le cose che mi vengono chieste prima di iniziare. Se ne manca una, scrivimi.
      </p>
      <dl className="faq-list">
        {faqs.map((item) => {
          const consult = item.question === "Come si inizia un progetto?";
          return (
            <div className={consult ? "faq-item faq-item-consult" : "faq-item"} key={item.question}>
              <dt>
                {item.question}
                {consult ? (
                  <Link className="faq-consult press" href="/prenota">
                    Prenota una consulenza
                    <span className="faq-consult-arrow" aria-hidden="true">
                      →
                    </span>
                  </Link>
                ) : null}
              </dt>
              <dd>{item.answer}</dd>
            </div>
          );
        })}
      </dl>
    </article>
  );
}
