import { Link } from '../lib/router'

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <p>© {new Date().getFullYear()} Rotina Inteligente</p>
        <nav aria-label="Rodapé" className="footer-links">
          <Link to="/privacidade" className="nav-link">
            Privacidade
          </Link>
          <a href="mailto:contato@rotinainteligente.app" className="nav-link">
            Contato
          </a>
        </nav>
      </div>
    </footer>
  )
}
