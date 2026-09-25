import { JsonLd } from "@/components/json-ld";
import { getProject, projects } from "@/lib/projects";
import { absoluteUrl, siteName, siteUrl } from "@/lib/site";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return { title: "Lavoro" };

  const description = `${project.summary} ${project.answer}`;
  const path = `/lavori/${project.slug}`;

  return {
    title: project.title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${project.title} — ${siteName}`,
      description,
      url: path,
      type: "article",
      images: [{ url: project.still, alt: `Schermata di ${project.title}` }],
    },
  };
}

export default async function WorkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const path = `/lavori/${project.slug}`;

  return (
    <article className="page">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: project.title,
          url: absoluteUrl(path),
          description: project.summary,
          image: absoluteUrl(project.still),
          dateCreated: project.year,
          creator: { "@id": `${siteUrl}/#person` },
          about: project.detail,
        }}
      />
      <Link className="back press" href="/#lavori">
        Torna ai lavori
      </Link>
      <h1>{project.title}</h1>
      <ul className="facts">
        <li>{project.index}</li>
        <li>{project.kind}</li>
        <li>{project.year}</li>
        <li>{project.status === "live" ? "Online" : "Schermata di avvio"}</li>
      </ul>
      <p className="detail">{project.detail}</p>
      <h2>Il problema</h2>
      <p className="detail">{project.problem}</p>
      <h2>La risposta</h2>
      <p className="detail">{project.answer}</p>
      <div className="case-still">
        <Image
          src={project.still}
          alt={`Schermata di ${project.title}`}
          fill
          sizes="(max-width: 920px) 100vw, 860px"
          priority
        />
      </div>
      <div className="actions">
        <a className="ink-link press" href={project.href} target="_blank" rel="noreferrer">
          Apri il sito
        </a>
        <a className="back press" href="https://github.com/matteodiliberto3">
          Scrivimi
        </a>
      </div>
    </article>
  );
}
