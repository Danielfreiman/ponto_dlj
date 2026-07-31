'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, differenceInMinutes } from 'date-fns'
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
  const [marcacoesMes, setMarcacoesMes] = useState<Marcacao[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [agora, setAgora] = useState(new Date())
  const supabase = createClient()

  const carregarMarcacoes = useCallback(async () => {
    const inicio = startOfDay(new Date())
    const fim = endOfDay(new Date())
    const { data } = await supabase
      .from('marcacoes')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', inicio.toISOString())
      .lte('created_at', fim.toISOString())
      .order('created_at', { ascending: true })
    setMarcacoes((data as Marcacao[]) || [])
  }, [supabase, user.id])

  const carregarMarcacoesMes = useCallback(async () => {
    const inicioMes = startOfMonth(new Date())
    const fimMes = endOfMonth(new Date())
    const { data } = await supabase
      .from('marcacoes')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', inicioMes.toISOString())
      .lte('created_at', fimMes.toISOString())
      .order('created_at', { ascending: true })
    setMarcacoesMes((data as Marcacao[]) || [])
  }, [supabase, user.id])

  useEffect(() => {
    carregarMarcacoes()
    carregarMarcacoesMes()
    const tick = setInterval(() => setAgora(new Date()), 1000)
    return () => clearInterval(tick)
  }, [carregarMarcacoes, carregarMarcacoesMes])

  async function baterPonto() {
    setLoading(true)
    setMsg('')
    const ultimaMarcacao = marcacoes[marcacoes.length - 1]
    const tipo = !ultimaMarcacao || ultimaMarcacao.tipo === 'saida' ? 'entrada' : 'saida'
    const { error } = await supabase.from('marcacoes').insert({ user_id: user.id, email: user.email, tipo })
    if (error) {
      setMsg('Erro ao registrar ponto. Tente novamente.')
    } else {
      setMsg(tipo === 'entrada' ? 'Entrada registrada com sucesso.' : 'Saída registrada com sucesso.')
      await carregarMarcacoes()
      await carregarMarcacoesMes()
    }
    setLoading(false)
    setTimeout(() => setMsg(''), 3000)
  }

  const ultimaMarcacao = marcacoes[marcacoes.length - 1]
  const proximoTipo = !ultimaMarcacao || ultimaMarcacao.tipo === 'saida' ? 'entrada' : 'saida'

  function calcularHorasMes() {
    let totalMinutos = 0
    let totalDias = 0
    const porDia: Record<string, Marcacao[]> = {}
    for (const m of marcacoesMes) {
      const dia = format(new Date(m.created_at), 'yyyy-MM-dd')
      if (!porDia[dia]) porDia[dia] = []
      porDia[dia].push(m)
    }
    totalDias = Object.keys(porDia).length
    for (const diaLista of Object.values(porDia)) {
      for (let i = 0; i < diaLista.length - 1; i++) {
        if (diaLista[i].tipo === 'entrada' && diaLista[i + 1].tipo === 'saida') {
          totalMinutos += differenceInMinutes(
            new Date(diaLista[i + 1].created_at),
            new Date(diaLista[i].created_at)
          )
          i++
        }
      }
    }
    return { totalMinutos, totalDias }
  }

  function formatarHoras(min: number) {
    const h = Math.floor(min / 60)
    const m = min % 60
    return `${h}h ${String(m).padStart(2, '0')}min`
  }

  const { totalMinutos, totalDias } = calcularHorasMes()

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f4f4f5' }}>
      <Header email={user.email!} role="colaborador" />

      <main className="flex-1 p-4 max-w-md mx-auto w-full mt-6 flex flex-col gap-4">

        {/* Relógio */}
        <div className="rounded-2xl border p-6 text-center" style={{ background: '#ffffff', borderColor: '#e4e4e7' }}>
          <p className="text-sm text-zinc-500 capitalize mb-1">
            {format(agora, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
          <p className="text-5xl font-bold tracking-tight text-zinc-800 mb-6">
            {format(agora, 'HH:mm:ss')}
          </p>

          <button
            onClick={baterPonto}
            disabled={loading}
            className="w-full py-4 rounded-xl text-base font-semibold text-white transition-opacity disabled:opacity-60 cursor-pointer active:scale-95"
            style={{ background: '#7B2D6E' }}
          >
            {loading
              ? 'Registrando...'
              : proximoTipo === 'entrada'
                ? 'Registrar Entrada'
                : 'Registrar Saída'}
          </button>

          {msg && (
            <p className="mt-3 text-sm text-zinc-500">{msg}</p>
          )}
        </div>

        {/* Status atual */}
        <div
          className="rounded-xl border px-5 py-3 flex items-center gap-3"
          style={{ background: '#ffffff', borderColor: '#e4e4e7' }}
        >
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: proximoTipo === 'saida' ? '#22c55e' : '#d4d4d8' }}
          />
          <span className="text-sm text-zinc-600">
            {proximoTipo === 'saida' ? 'Você está no trabalho' : 'Você está fora'}
          </span>
          {ultimaMarcacao && (
            <span className="ml-auto text-xs text-zinc-400">
              última: {format(new Date(ultimaMarcacao.created_at), 'HH:mm')}
            </span>
          )}
        </div>

        {/* Horas trabalhadas no mês */}
        <div className="rounded-2xl border p-5" style={{ background: '#ffffff', borderColor: '#e4e4e7' }}>
          <h2 className="font-semibold text-zinc-800 text-sm mb-3">
            Horas trabalhadas — {format(agora, "MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold" style={{ color: '#7B2D6E' }}>
              {formatarHoras(totalMinutos)}
            </span>
            <span className="text-sm text-zinc-400">
              em {totalDias} {totalDias === 1 ? 'dia' : 'dias'}
            </span>
          </div>
        </div>

        {/* Marcações do dia */}
        <div className="rounded-2xl border" style={{ background: '#ffffff', borderColor: '#e4e4e7' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: '#e4e4e7' }}>
            <h2 className="font-semibold text-zinc-800 text-sm">Marcações de hoje</h2>
          </div>

          {marcacoes.length === 0 ? (
            <p className="text-center text-zinc-400 text-sm py-8">Nenhuma marcação hoje.</p>
          ) : (
            <ul className="divide-y" style={{ borderColor: '#e4e4e7' }}>
              {marcacoes.map((m) => (
                <li key={m.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={
                        m.tipo === 'entrada'
                          ? { background: '#f0fdf4', color: '#15803d' }
                          : { background: '#fef2f2', color: '#b91c1c' }
                      }
                    >
                      {m.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                    </span>
                  </div>
                  <span className="text-sm text-zinc-500">
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
