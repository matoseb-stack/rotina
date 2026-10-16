import { useEffect } from 'react'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { ReminderEngine, ReminderToast } from './components/ReminderEngine'
import { usePath } from './lib/router'
import { RoutineProvider } from './lib/store'
import { Avisos } from './pages/Avisos'
import { Home } from './pages/Home'
import { Privacidade } from './pages/Privacidade'
import { Progresso } from './pages/Progresso'
import { Rotina } from './pages/Rotina'

const ROUTES: Record<string, { title: string; Page: () => React.JSX.Element }> = {
  '/': { title: 'Rotina Inteligente', Page: Home },
  '/rotina': { title: 'Minha rotina · Rotina Inteligente', Page: Rotina },
  '/progresso': { title: 'Progresso · Rotina Inteligente', Page: Progresso },
  '/avisos': { title: 'Avisos · Rotina Inteligente', Page: Avisos },
  '/privacidade': { title: 'Privacidade · Rotina Inteligente', Page: Privacidade },
}

export default function App() {
  const path = usePath()
  const route = ROUTES[path] ?? ROUTES['/']

  useEffect(() => {
    document.title = route.title
  }, [route])

  return (
    <RoutineProvider>
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>
      <Header />
      <main id="conteudo">
        <route.Page />
      </main>
      <Footer />
      <ReminderEngine />
      <ReminderToast />
    </RoutineProvider>
  )
}
