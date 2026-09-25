import { About } from "@/components/about";
import { Contact } from "@/components/contact";
import { JsonLd } from "@/components/json-ld";
import { Interlude } from "@/components/interlude";
import { Opening } from "@/components/opening";
import { Process } from "@/components/process";
import { SiteNav } from "@/components/site-nav";
import { Works } from "@/components/works";
import { projects } from "@/lib/projects";
import { graphJsonLd, worksJsonLd } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <main id="top" className="story">
      <JsonLd data={graphJsonLd([worksJsonLd()])} />
      <SiteNav />
      <Opening />
      <About />
      <Works projects={projects} />
      <Interlude />
      <Process />
      <Contact />
    </main>
  );
}
