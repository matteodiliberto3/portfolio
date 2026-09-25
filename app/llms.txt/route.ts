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

Matteo Di Liberto lavora a Palermo. Disegna la pagina e scrive il codice, dalla bozza al sito online. La prima conversazione dura trenta minuti, su Google Meet, e si prenota su ${siteUrl}/prenota.

- Sito: ${siteUrl}
- GitHub: ${githubUrl}
- Lingua: italiano

## Pagine

- [Home](${siteUrl}/): presentazione, lavori, metodo, domande, contatto
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
