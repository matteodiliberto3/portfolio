import type { Metadata } from "next";
import { ConsultLink } from "@/components/consult-link";
import { JsonLd } from "@/components/json-ld";
import { PageLink } from "@/components/page-link";
import { faqJsonLd, faqs, graphJsonLd } from "@/lib/site";

export const metadata: Metadata = {
  title: "Domande frequenti",
  description:
    "Chi sono, metodologia di penetration testing, report di sicurezza e modalità di ingaggio.",
  alternates: { canonical: "/domande" },
  openGraph: {
    title: "Domande frequenti — Matteo Di Liberto",
    description:
      "Chi sono, metodologia di penetration testing, report di sicurezza e modalità di ingaggio.",
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
        I chiarimenti essenziali prima di avviare un security assessment. Se hai una richiesta specifica, contattami.
      </p>
      <dl className="faq-list">
        {faqs.map((item) => {
          const consult = item.question === "Come si avvia una collaborazione?";
          return (
            <div className={consult ? "faq-item faq-item-consult" : "faq-item"} key={item.question}>
              <dt>
                {item.question}
                {consult ? <ConsultLink /> : null}
              </dt>
              <dd>{item.answer}</dd>
            </div>
          );
        })}
      </dl>
    </article>
  );
}
