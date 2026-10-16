import { useEffect, useRef } from 'react'
import { TaskForm, type TaskData } from './TaskForm'

interface TaskSheetProps {
  initial?: TaskData
  onSave: (data: TaskData) => void
  onClose: () => void
}

/** Janela (folha inferior no celular) para criar ou editar uma tarefa. */
export function TaskSheet({ initial, onSave, onClose }: TaskSheetProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby="sheet-title"
      onClose={onClose}
      onClick={(e) => {
        // Clique no fundo escurecido fecha.
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="sheet-body">
        <div className="sheet-head">
          <h2 id="sheet-title">{initial ? 'Editar tarefa' : 'Nova tarefa'}</h2>
          <button type="button" className="icon-btn" aria-label="Fechar" onClick={onClose}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <TaskForm
          initial={initial}
          submitLabel={initial ? 'Salvar' : 'Adicionar à rotina'}
          onSubmit={(data) => {
            onSave(data)
            onClose()
          }}
          onCancel={onClose}
        />
      </div>
    </dialog>
  )
}
