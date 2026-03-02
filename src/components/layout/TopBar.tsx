interface TopBarProps {
  title: string
  actions?: React.ReactNode
}

export function TopBar({ title, actions }: TopBarProps) {
  return (
    <header
      className="h-20 border-b bg-[#0a0a0a]/95 backdrop-blur-sm flex items-center px-10 gap-4 relative"
      style={{ borderBottomColor: 'rgba(150,119,5,0.15)' }}
    >
      <h1 className="text-xl font-semibold text-white flex-1">{title}</h1>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
      <div
        className="absolute bottom-0 inset-x-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(150,119,5,0.3) 40%, rgba(150,119,5,0.3) 60%, transparent)' }}
      />
    </header>
  )
}
