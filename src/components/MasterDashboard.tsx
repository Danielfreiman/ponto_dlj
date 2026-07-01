'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, startOfMonth, endOfMonth, differenceInMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { User } from '@supabase/supabase-js'
import Header from './Header'

interface Marcacao {
  id: string
  user_id: string
  email: string
  tipo: 'entrada' | 'saida'
  created_at: string
}

interface ColaboradorResumo {
  email: string
  totalMinutos: number
  totalDias: number
  marcacoes: Marcacao[]
}

export default function MasterDashboard({ user }: { user: User }) {
  const [mes, setMes] = useState(format(new Date(), 'yyyy-MM'))
  const [marcacoes, setMarcacoes] = useState<Marcacao[]>([])
  const [aba, setAba] = useState<'resumo' | 'detalhado'>('resumo')
  const supabase = createClient()

  const carregarDados = useCallback(async () => {
    const inicio = startOfMonth(new Date(mes + '-01'))
    const fim = endOfMonth(inicio)
    const { data } = await supabase
      .from('marcacoes')
      .select('*')
      .gte('created_at', inicio.toISOString())
      .lte('created_at', fim.toISOString())
      .order('created_at', { ascending: true })
    setMarcacoes((data as Marcacao[]) || [])
  }, [supabase, mes])

  useEffect(() => { carregarDados() }, [carregarDados])

  function calcularResumos(): ColaboradorResumo[] {
    const porEmail: Record<string, Marcacao[]> = {}
    for (const m of marcacoes) {
      if (!porEmail[m.email]) porEmail[m.email] = []
      porEmail[m.email].push(m)
    }
    return Object.entries(porEmail).map(([email, lista]) => {
      let totalMinutos = 0
      const dias = new Set<string>()
      const porDia: Record<string, Marcacao[]> = {}
      for (const m of lista) {
        const dia = format(new Date(m.created_at), 'yyyy-MM-dd')
        if (!porDia[dia]) porDia[dia] = []
        porDia[dia].push(m)
        dias.add(dia)
      }
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
      return { email, totalMinutos, totalDias: dias.size, marcacoes: lista }
    })
  }

  const resumos = calcularResumos()

  function formatarHoras(min: number) {
    const h = Math.floor(min / 60)
    const m = min % 60
    return `${h}h ${String(m).padStart(2, '0')}min`
  }

  async function exportarCSV() {
    const linhas = ['Email,Tipo,Data,Hora']
    for (const m of marcacoes) {
      const dt = new Date(m.created_at)
      linhas.push(`${m.email},${m.tipo},${format(dt, 'dd/MM/yyyy')},${format(dt, 'HH:mm:ss')}`)
    }
    const blob = new Blob([linhas.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ponto_${mes}.csv`
    a.click()
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f4f4f5' }}>
      <Header email={user.email!} role="master" />

      <main className="flex-1 p-4 max-w-5xl mx-auto w-full mt-6">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-lg font-semibold text-zinc-800">Relatórios de Ponto</h1>
            <p className="text-sm text-zinc-500">
              {format(new Date(mes + '-01'), "MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={mes}
              onChange={e => setMes(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm text-zinc-700 outline-none"
              style={{ borderColor: '#e4e4e7', background: '#ffffff' }}
            />
            <button
              onClick={exportarCSV}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white cursor-pointer"
              style={{ background: '#7B2D6E' }}
            >
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Abas */}
        <div className="flex gap-1 mb-4 border-b" style={{ borderColor: '#e4e4e7' }}>
          {(['resumo', 'detalhado'] as const).map(a => (
            <button
              key={a}
              onClick={() => setAba(a)}
              className="px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer"
              style={{
                color: aba === a ? '#7B2D6E' : '#71717a',
                borderBottom: aba === a ? '2px solid #7B2D6E' : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              {a === 'resumo' ? 'Resumo Mensal' : 'Detalhado'}
            </button>
          ))}
        </div>

        {/* Resumo */}
        {aba === 'resumo' && (
          resumos.length === 0 ? (
            <div className="text-center py-16 text-zinc-400 text-sm">Nenhuma marcação no período.</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {resumos.map(r => (
                <div key={r.email} className="rounded-2xl border p-5" style={{ background: '#ffffff', borderColor: '#e4e4e7' }}>
                  <p className="text-xs text-zinc-400 truncate mb-4">{r.email}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl p-3" style={{ background: '#f4f4f5' }}>
                      <p className="text-xl font-bold text-zinc-800">{formatarHoras(r.totalMinutos)}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">Horas trabalhadas</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: '#f4f4f5' }}>
                      <p className="text-xl font-bold text-zinc-800">{r.totalDias}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">Dias com ponto</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t flex items-center gap-1.5" style={{ borderColor: '#e4e4e7' }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: '#7B2D6E' }} />
                    <span className="text-xs text-zinc-500">{r.marcacoes.length} marcações no mês</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Detalhado */}
        {aba === 'detalhado' && (
          <div className="rounded-2xl border overflow-hidden" style={{ background: '#ffffff', borderColor: '#e4e4e7' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#fafafa', borderBottom: '1px solid #e4e4e7' }}>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Colaborador</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Data</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: '#f4f4f5' }}>
                  {marcacoes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-zinc-400 text-sm">
                        Nenhuma marcação no período.
                      </td>
                    </tr>
                  ) : marcacoes.map((m) => (
                    <tr key={m.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-5 py-3 text-zinc-700 truncate max-w-[200px]">{m.email}</td>
                      <td className="px-5 py-3">
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
                      </td>
                      <td className="px-5 py-3 text-zinc-500">
                        {format(new Date(m.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </td>
                      <td className="px-5 py-3 text-zinc-500 font-mono text-xs">
                        {format(new Date(m.created_at), 'HH:mm:ss')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
