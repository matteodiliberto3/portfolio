export function SiteNav() {
  return (
    <nav className="nav" aria-label="Sezioni">
      <a className="nav-name" href="#top">
        M. Di Liberto
      </a>
      <ul className="nav-links">
        <li>
          <a href="#chi-sono">Chi sono</a>
        </li>
        <li>
          <a href="#lavori">Lavori</a>
        </li>
        <li>
          <a href="#metodo">Metodo</a>
        </li>
        <li>
          <a className="nav-cta" href="#contatto">
            Scrivimi
          </a>
        </li>
      </ul>
    </nav>
  );
}
