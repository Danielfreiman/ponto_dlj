import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ponto — Zé do Açaí',
  description: 'Sistema de controle de ponto',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  )
}
