import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, projects } from "@/lib/projects";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  return { title: project ? `${project.title} — Matteo Di Liberto` : "Lavoro" };
}

export default async function WorkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  return (
    <article className="page">
      <Link className="back press" href="/#lavori">
        Torna ai lavori
      </Link>
      <h1>{project.title}</h1>
      <ul className="facts">
        <li>{project.index}</li>
        <li>{project.kind}</li>
        <li>{project.status === "live" ? "Online" : "Schermata di avvio"}</li>
      </ul>
      <p className="detail">{project.detail}</p>
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
