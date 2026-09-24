import { About } from "@/components/about";
import { Contact } from "@/components/contact";
import { Interlude } from "@/components/interlude";
import { Opening } from "@/components/opening";
import { Process } from "@/components/process";
import { SiteNav } from "@/components/site-nav";
import { Works } from "@/components/works";
import { projects } from "@/lib/projects";

export default function HomePage() {
  return (
    <main id="top" className="story">
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
