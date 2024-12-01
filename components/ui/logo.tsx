interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={className}>
      {/* Sostituisci con il tuo logo */}
      <span className="text-2xl font-bold text-blue-600">
        LOGO
      </span>
    </div>
  )
} 