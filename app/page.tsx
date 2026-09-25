import { About } from "@/components/about";
import { Contact } from "@/components/contact";
import { Faq } from "@/components/faq";
import { JsonLd } from "@/components/json-ld";
import { Interlude } from "@/components/interlude";
import { Opening } from "@/components/opening";
import { Process } from "@/components/process";
import { SiteNav } from "@/components/site-nav";
import { Works } from "@/components/works";
import { projects } from "@/lib/projects";
import { faqJsonLd, graphJsonLd, worksJsonLd } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <main id="top" className="story">
      <JsonLd data={graphJsonLd([worksJsonLd(), faqJsonLd()])} />
      <SiteNav />
      <Opening />
      <About />
      <Works projects={projects} />
      <Interlude />
      <Process />
      <Faq />
      <Contact />
    </main>
  );
}
