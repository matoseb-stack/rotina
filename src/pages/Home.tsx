import type { ReactNode } from 'react'
import { TodayCard } from '../components/TodayCard'
import { Link } from '../lib/router'

const STEPS: { title: string; text: string; icon: ReactNode }[] = [
  {
    title: 'Monte',
    text: 'Liste o que faz parte do seu dia, com horário. O período se ajusta sozinho.',
    icon: (
      <>
        <path d="M5 7h9M5 12h9M5 17h6" />
        <path d="M18 14v6M15 17h6" />
      </>
    ),
  },
  {
    title: 'Marque',
    text: 'Toque para concluir. Amanhã a lista recomeça limpa, sem bagunça.',
    icon: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M8.5 12.2l2.4 2.4 4.6-5" />
      </>
    ),
  },
  {
    title: 'Acompanhe',
    text: 'Veja como foi a semana e mantenha sua sequência de dias completos.',
    icon: (
      <>
        <path d="M4 20h16" />
        <path d="M7 16v-4M12 16V7M17 16v-7" />
      </>
    ),
  },
]

export function Home() {
  return (
    <>
      <section className="hero container">
        <div className="hero-text">
          <span className="badge">Organize o dia sem esforço</span>
          <h1 className="hero-title">Sua rotina, mais leve e no ritmo certo.</h1>
          <p className="hero-sub">
            Monte suas tarefas do dia em poucos toques, marque o que já fez e acompanhe sua semana. Simples, calmo e
            sem distrações.
          </p>
          <div className="hero-actions">
            <Link to="/rotina" className="btn btn-primary btn-lg">
              Criar minha rotina
            </Link>
            <Link to="/#como-funciona" className="btn btn-outline btn-lg">
              Ver como funciona
            </Link>
          </div>
        </div>
        <div className="hero-card">
          <TodayCard />
        </div>
      </section>

      <section id="como-funciona" className="steps container" aria-labelledby="steps-title">
        <h2 id="steps-title" className="section-title">
          Três passos, um dia mais tranquilo
        </h2>
        <ol className="steps-grid">
          {STEPS.map((step, i) => (
            <li key={step.title} className="card step">
              <span className="step-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  {step.icon}
                </svg>
              </span>
              <h3>
                <span className="visually-hidden">Passo {i + 1}: </span>
                {step.title}
              </h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}
