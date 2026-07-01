'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Usuario {
  id: string
  email: string
  created_at: string
}

interface Props {
  onChange?: () => void
}

export default function UsersManager({ onChange }: Props) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [criando, setCriando] = useState(false)
  const [erro, setErro] = useState('')
  const [erroLista, setErroLista] = useState('')
  const [excluindo, setExcluindo] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    setErroLista('')
    const res = await fetch('/api/admin/users')
    const data = await res.json()
    if (!res.ok) {
      setErroLista(data.error || 'Erro ao carregar colaboradores.')
      setUsuarios([])
    } else {
      setUsuarios(data.usuarios || [])
    }
    setLoading(false)
    onChange?.()
  }, [onChange])

  useEffect(() => { carregar() }, [carregar])

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    setCriando(true)
    setErro('')

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()

    if (!res.ok) {
      setErro(data.error || 'Erro ao criar colaborador.')
      setCriando(false)
      return
    }

    setEmail('')
    setPassword('')
    setCriando(false)
    await carregar()
  }

  async function handleExcluir(id: string, userEmail: string) {
    if (!confirm(`Excluir o colaborador ${userEmail}? Esta ação não pode ser desfeita.`)) return
    setExcluindo(id)
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    setExcluindo(null)
    await carregar()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Formulário de novo colaborador */}
      <div className="rounded-2xl border p-5" style={{ background: '#ffffff', borderColor: '#e4e4e7' }}>
        <h2 className="font-semibold text-zinc-800 text-sm mb-4">Novo colaborador</h2>
        <form onSubmit={handleCriar} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            required
            placeholder="E-mail do colaborador"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="flex-1 border rounded-lg px-3 py-2.5 text-sm outline-none text-zinc-800 placeholder-zinc-400"
            style={{ borderColor: '#e4e4e7', background: '#fafafa' }}
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Senha (mín. 6 caracteres)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="flex-1 border rounded-lg px-3 py-2.5 text-sm outline-none text-zinc-800 placeholder-zinc-400"
            style={{ borderColor: '#e4e4e7', background: '#fafafa' }}
          />
          <button
            type="submit"
            disabled={criando}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60 cursor-pointer whitespace-nowrap"
            style={{ background: '#7B2D6E' }}
          >
            {criando ? 'Criando...' : 'Adicionar'}
          </button>
        </form>
        {erro && <p className="text-sm text-red-500 mt-2">{erro}</p>}
      </div>

      {/* Lista de colaboradores */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: '#ffffff', borderColor: '#e4e4e7' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: '#e4e4e7' }}>
          <h2 className="font-semibold text-zinc-800 text-sm">Colaboradores cadastrados</h2>
        </div>

        {loading ? (
          <p className="text-center text-zinc-400 text-sm py-8">Carregando...</p>
        ) : erroLista ? (
          <p className="text-center text-red-500 text-sm py-8">{erroLista}</p>
        ) : usuarios.length === 0 ? (
          <p className="text-center text-zinc-400 text-sm py-8">Nenhum colaborador cadastrado.</p>
        ) : (
          <ul className="divide-y" style={{ borderColor: '#f4f4f5' }}>
            {usuarios.map(u => (
              <li key={u.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm text-zinc-700">{u.email}</p>
                  <p className="text-xs text-zinc-400">
                    Cadastrado em {format(new Date(u.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <button
                  onClick={() => handleExcluir(u.id, u.email)}
                  disabled={excluindo === u.id}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors cursor-pointer disabled:opacity-60"
                  style={{ borderColor: '#fecaca', color: '#b91c1c' }}
                >
                  {excluindo === u.id ? 'Excluindo...' : 'Excluir'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
