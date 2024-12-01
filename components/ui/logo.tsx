import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("font-semibold text-lg", className)}>
      Logo
    </div>
  )
} 