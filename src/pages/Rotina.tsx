import { TodayCard } from '../components/TodayCard'

export function Rotina() {
  return (
    <div className="container page">
      <TodayCard editable headingLevel="h1" />
      <p className="hint">Suas tarefas se repetem todos os dias. O que você marcar como feito recomeça amanhã.</p>
    </div>
  )
}
