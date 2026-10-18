import { PrintSheet } from '../components/PrintSheet'
import { TodayCard } from '../components/TodayCard'

export function Rotina() {
  return (
    <>
      <div className="container page">
        <TodayCard editable headingLevel="h1" />
        <div className="rotina-footer">
          <p className="hint">Suas tarefas se repetem todos os dias. O que você marcar como feito recomeça amanhã.</p>
          <button type="button" className="btn btn-outline print-btn" onClick={() => window.print()}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 9V3h10v6" />
              <rect x="3" y="9" width="18" height="8" rx="2" />
              <path d="M7 14h10v7H7z" />
            </svg>
            Imprimir rotina
          </button>
        </div>
      </div>
      <PrintSheet />
    </>
  )
}
