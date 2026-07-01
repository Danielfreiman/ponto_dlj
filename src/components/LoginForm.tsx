'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
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
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#f4f4f5' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-sm mb-4" style={{ background: '#18181b' }}>
            <Image src="/logo.png" alt="Zé do Açaí" width={56} height={56} priority />
          </div>
          <h1 className="text-xl font-bold text-zinc-800">Sistema de Ponto</h1>
          <p className="text-sm text-zinc-500 mt-1">Zé do Açaí</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border shadow-sm p-8 flex flex-col gap-5" style={{ background: '#ffffff', borderColor: '#e4e4e7' }}>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition-colors text-zinc-800 placeholder-zinc-400"
                style={{ borderColor: '#e4e4e7', background: '#fafafa' }}
                onFocus={e => e.target.style.borderColor = '#7B2D6E'}
                onBlur={e => e.target.style.borderColor = '#e4e4e7'}
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition-colors text-zinc-800 placeholder-zinc-400"
                style={{ borderColor: '#e4e4e7', background: '#fafafa' }}
                onFocus={e => e.target.style.borderColor = '#7B2D6E'}
                onBlur={e => e.target.style.borderColor = '#e4e4e7'}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 py-2.5 rounded-lg font-semibold text-sm text-white transition-opacity disabled:opacity-60 cursor-pointer"
              style={{ background: '#7B2D6E' }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
