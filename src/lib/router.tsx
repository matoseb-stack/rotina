import { useEffect, useState, type AnchorHTMLAttributes, type MouseEvent } from 'react'

// Roteador mínimo baseado na History API (sem dependências).
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

function currentPath(): string {
  const path = window.location.pathname.slice(BASE.length) || '/'
  return path.replace(/\/$/, '') || '/'
}

export function navigate(to: string) {
  const [path, hash] = to.split('#')
  if (path) window.history.pushState(null, '', BASE + path + (hash ? `#${hash}` : ''))
  window.dispatchEvent(new PopStateEvent('popstate'))
  // Espera a nova página renderizar antes de rolar até a âncora.
  window.setTimeout(() => {
    if (hash) document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' })
    else window.scrollTo(0, 0)
  }, 30)
}

export function usePath(): string {
  const [path, setPath] = useState(currentPath)
  useEffect(() => {
    const onChange = () => setPath(currentPath())
    window.addEventListener('popstate', onChange)
    return () => window.removeEventListener('popstate', onChange)
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
  return <a href={BASE + to} onClick={handle} {...rest} />
}
