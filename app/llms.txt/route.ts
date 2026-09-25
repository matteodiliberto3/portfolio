import { projects } from "@/lib/projects";
import { faqs, githubUrl, siteDescription, siteName, siteUrl } from "@/lib/site";

export function GET() {
  const works = projects
    .map(
      (project) =>
        `- [${project.title}](${siteUrl}/lavori/${project.slug}): ${project.summary} ${project.problem} ${project.answer} Sito: ${project.href}`,
    )
    .join("\n");

  const answers = faqs.map((item) => `### ${item.question}\n\n${item.answer}`).join("\n\n");

  const body = `# ${siteName}

> ${siteDescription}

Matteo Di Liberto è un informatico che lavora come design engineer: si occupa dell’interfaccia, dell’esperienza d’uso e del codice che le regge, dalla bozza al sito online. Lavora a Varese, per clienti in tutta Italia. La prima conversazione dura trenta minuti, su Google Meet, e si prenota su ${siteUrl}/prenota.

- Sito: ${siteUrl}
- GitHub: ${githubUrl}
- Lingua: italiano

## Pagine

- [Home](${siteUrl}/): presentazione, lavori, metodo, contatto
- [Domande](${siteUrl}/domande): le domande che arrivano prima di iniziare
- [Prenota una chiamata](${siteUrl}/prenota): trenta minuti su Google Meet, orari letti dal calendario

## Lavori

${works}

## Domande

${answers}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
