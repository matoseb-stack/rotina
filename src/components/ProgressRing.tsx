interface ProgressRingProps {
  done: number
  total: number
  size?: number
}

export function ProgressRing({ done, total, size = 76 }: ProgressRingProps) {
  const stroke = 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const ratio = total === 0 ? 0 : done / total
  const label = `${done} de ${total} tarefas concluídas`

  return (
    <div className="ring" role="img" aria-label={label} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--broto)" strokeWidth={stroke} />
        <circle
          className="ring-value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--folha)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="ring-text" aria-hidden="true">
        <span>
          <strong>{done}</strong>/{total}
        </span>
      </span>
    </div>
  )
}
