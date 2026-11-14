import { faqs, githubUrl, siteDescription, siteName, siteUrl } from "@/lib/site";

export function GET() {
  const answers = faqs.map((item) => `### ${item.question}\n\n${item.answer}`).join("\n\n");

  const body = `# ${siteName}

> ${siteDescription}

La prima conversazione tecnica dura trenta minuti, su Google Meet, e si prenota su ${siteUrl}/prenota.

- Sito: ${siteUrl}
- GitHub: ${githubUrl}
- Lingua: italiano

## Pagine

- [Home](${siteUrl}/): cybersecurity, verifiche di sicurezza, metodo e approfondimenti per PMI, startup e grandi organizzazioni
- [Prenota una chiamata](${siteUrl}/prenota): trenta minuti su Google Meet, orari letti dal calendario

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
