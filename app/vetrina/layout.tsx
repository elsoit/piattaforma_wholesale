import { Header } from '@/components/vetrina/header'

export default function clientsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <Header userName={'User'} />
      <main>{children}</main>
    </div>
  )
} 