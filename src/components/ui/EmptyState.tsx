export default function EmptyState({ icon, title, sub, action }: { icon: string; title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-14 px-5 col-span-full" style={{ color: 'var(--gray)' }}>
      <div className="text-4xl mb-3">{icon}</div>
      <div className="font-heading font-semibold text-sm mb-1.5" style={{ color: 'var(--charcoal)' }}>{title}</div>
      {sub && <div className="text-sm mb-3">{sub}</div>}
      {action}
    </div>
  )
}
