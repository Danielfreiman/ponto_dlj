'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { User } from '@supabase/supabase-js'
import Header from './Header'

interface Marcacao {
  id: string
  tipo: 'entrada' | 'saida'
  created_at: string
}

export default function ColaboradorDashboard({ user }: { user: User }) {
  const [marcacoes, setMarcacoes] = useState<Marcacao[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const supabase = createClient()

  const hoje = format(new Date(), 'yyyy-MM-dd')

  const carregarMarcacoes = useCallback(async () => {
    const { data } = await supabase
      .from('marcacoes')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', `${hoje}T00:00:00`)
      .lte('created_at', `${hoje}T23:59:59`)
      .order('created_at', { ascending: true })

    setMarcacoes((data as Marcacao[]) || [])
  }, [supabase, user.id, hoje])

  useEffect(() => {
    carregarMarcacoes()
  }, [carregarMarcacoes])

  async function baterPonto() {
    setLoading(true)
    setMsg('')

    const ultimaMarcacao = marcacoes[marcacoes.length - 1]
    const tipo = !ultimaMarcacao || ultimaMarcacao.tipo === 'saida' ? 'entrada' : 'saida'

    const { error } = await supabase.from('marcacoes').insert({
      user_id: user.id,
      email: user.email,
      tipo,
    })

    if (error) {
      setMsg('Erro ao registrar ponto. Tente novamente.')
    } else {
      setMsg(tipo === 'entrada' ? '✅ Entrada registrada!' : '✅ Saída registrada!')
      await carregarMarcacoes()
    }
    setLoading(false)
    setTimeout(() => setMsg(''), 3000)
  }

  const ultimaMarcacao = marcacoes[marcacoes.length - 1]
  const proximoTipo = !ultimaMarcacao || ultimaMarcacao.tipo === 'saida' ? 'entrada' : 'saida'

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5DEB3' }}>
      <Header email={user.email!} role="colaborador" />

      <main className="flex-1 p-4 max-w-lg mx-auto w-full">
        <div className="mt-6 rounded-2xl shadow-lg p-6 text-center" style={{ background: '#fff' }}>
          <p className="text-sm font-medium mb-1" style={{ color: '#9b4a8c' }}>
            {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
          <p className="text-4xl font-bold mb-6" style={{ color: '#7B2D6E' }}>
            {format(new Date(), 'HH:mm')}
          </p>

          <button
            onClick={baterPonto}
            disabled={loading}
            className="w-full py-5 rounded-2xl text-xl font-bold text-white shadow-md transition-opacity disabled:opacity-60 cursor-pointer active:scale-95"
            style={{ background: proximoTipo === 'entrada' ? '#7B2D6E' : '#5a1f50' }}
          >
            {loading ? 'Registrando...' : proximoTipo === 'entrada' ? '🟢 Registrar Entrada' : '🔴 Registrar Saída'}
          </button>

          {msg && (
            <p className="mt-3 text-sm font-semibold" style={{ color: '#7B2D6E' }}>{msg}</p>
          )}
        </div>

        <div className="mt-6 rounded-2xl shadow-lg p-6" style={{ background: '#fff' }}>
          <h2 className="font-bold text-lg mb-4" style={{ color: '#7B2D6E' }}>
            📋 Marcações de hoje
          </h2>

          {marcacoes.length === 0 ? (
            <p className="text-center text-gray-400 py-4">Nenhuma marcação hoje.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {marcacoes.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ background: m.tipo === 'entrada' ? '#f0fdf4' : '#fef2f2' }}
                >
                  <span className="font-semibold" style={{ color: m.tipo === 'entrada' ? '#166534' : '#991b1b' }}>
                    {m.tipo === 'entrada' ? '🟢 Entrada' : '🔴 Saída'}
                  </span>
                  <span className="text-sm text-gray-600">
                    {format(new Date(m.created_at), 'HH:mm:ss')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}
