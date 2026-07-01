'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-mail ou senha inválidos.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#F5DEB3' }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo.png" alt="Zé do Açaí" width={160} height={160} priority />
          <h1 className="text-2xl font-bold mt-4" style={{ color: '#7B2D6E' }}>
            Sistema de Ponto
          </h1>
        </div>

        <form onSubmit={handleLogin} className="rounded-2xl shadow-lg p-8 flex flex-col gap-4" style={{ background: '#fff' }}>
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: '#7B2D6E' }}>
              E-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border-2 rounded-lg px-3 py-2 outline-none focus:border-[#7B2D6E] transition-colors"
              style={{ borderColor: '#e8c98a', color: '#5a1f50' }}
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: '#7B2D6E' }}>
              Senha
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border-2 rounded-lg px-3 py-2 outline-none focus:border-[#7B2D6E] transition-colors"
              style={{ borderColor: '#e8c98a', color: '#5a1f50' }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 py-3 rounded-xl font-bold text-white transition-opacity disabled:opacity-60 cursor-pointer"
            style={{ background: '#7B2D6E' }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
