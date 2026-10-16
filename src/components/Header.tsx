import { Link, usePath } from '../lib/router'
import { Logo } from './Logo'

export function Header() {
  const path = usePath()
  const inApp = path !== '/' && path !== '/privacidade'

  return (
    <header className={`header${inApp ? ' header-app' : ''}`}>
      <div className="container header-inner">
        <Link to="/" className="header-brand" aria-label="Rotina Inteligente, página inicial">
          <Logo />
        </Link>
        <nav className="header-nav" aria-label="Principal">
          {inApp ? (
            <>
              <Link to="/rotina" className="nav-link" aria-current={path === '/rotina' ? 'page' : undefined}>
                Minha rotina
              </Link>
              <Link to="/progresso" className="nav-link" aria-current={path === '/progresso' ? 'page' : undefined}>
                Progresso
              </Link>
            </>
          ) : (
            <>
              <Link to="/#como-funciona" className="nav-link nav-hide-sm">
                Como funciona
              </Link>
              <Link to="/rotina" className="nav-link nav-hide-xs">
                Entrar
              </Link>
              <Link to="/rotina" className="btn btn-primary">
                Começar grátis
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
