import { useEffect, useState, type AnchorHTMLAttributes, type MouseEvent } from 'react'

// Roteador mínimo sem dependências.
// Padrão: History API (/rotina). Com VITE_ROUTER=hash usa âncoras (#rotina),
// para hospedagens que só servem um arquivo.
const HASH = import.meta.env.VITE_ROUTER === 'hash'
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')
const PAGES = ['/rotina', '/progresso', '/avisos', '/privacidade']

function currentPath(): string {
  if (HASH) {
    const path = '/' + window.location.hash.slice(1)
    return PAGES.includes(path) ? path : '/'
  }
  const path = window.location.pathname.slice(BASE.length) || '/'
  return path.replace(/\/$/, '') || '/'
}

function hrefFor(to: string): string {
  if (!HASH) return BASE + to
  const [path, anchor] = to.split('#')
  if (anchor) return `#${anchor}`
  return path === '/' ? '#inicio' : `#${path.slice(1)}`
}

export function navigate(to: string) {
  const [path, anchor] = to.split('#')
  if (HASH) {
    const url = anchor || path !== '/' ? hrefFor(to) : window.location.pathname + window.location.search
    window.history.pushState(null, '', url)
  } else if (path) {
    window.history.pushState(null, '', BASE + path + (anchor ? `#${anchor}` : ''))
  }
  window.dispatchEvent(new PopStateEvent('popstate'))
  // Espera a nova página renderizar antes de rolar até a âncora.
  window.setTimeout(() => {
    if (anchor) document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' })
    else window.scrollTo(0, 0)
  }, 30)
}

export function usePath(): string {
  const [path, setPath] = useState(currentPath)
  useEffect(() => {
    const onChange = () => setPath(currentPath())
    window.addEventListener('popstate', onChange)
    window.addEventListener('hashchange', onChange)
    return () => {
      window.removeEventListener('popstate', onChange)
      window.removeEventListener('hashchange', onChange)
    }
  }, [])
  return path
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }

export function Link({ to, onClick, ...rest }: LinkProps) {
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    navigate(to)
  }
  return <a href={hrefFor(to)} onClick={handle} {...rest} />
}
