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

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

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
    return `${h}h ${m}min`
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
    <div className="min-h-screen flex flex-col" style={{ background: '#F5DEB3' }}>
      <Header email={user.email!} role="master" />

      <main className="flex-1 p-4 max-w-4xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6 mb-4">
          <h1 className="text-2xl font-bold" style={{ color: '#7B2D6E' }}>
            📊 Relatórios de Ponto
          </h1>
          <div className="flex items-center gap-3">
            <input
              type="month"
              value={mes}
              onChange={e => setMes(e.target.value)}
              className="border-2 rounded-lg px-3 py-2 text-sm font-medium outline-none"
              style={{ borderColor: '#7B2D6E', color: '#5a1f50' }}
            />
            <button
              onClick={exportarCSV}
              className="px-4 py-2 rounded-lg text-sm font-bold text-white cursor-pointer"
              style={{ background: '#7B2D6E' }}
            >
              ⬇ CSV
            </button>
          </div>
        </div>

        {/* Abas */}
        <div className="flex gap-2 mb-4">
          {(['resumo', 'detalhado'] as const).map(a => (
            <button
              key={a}
              onClick={() => setAba(a)}
              className="px-5 py-2 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
              style={{
                background: aba === a ? '#7B2D6E' : '#fff',
                color: aba === a ? '#fff' : '#7B2D6E',
                border: '2px solid #7B2D6E',
              }}
            >
              {a === 'resumo' ? '📋 Resumo Mensal' : '🔍 Detalhado'}
            </button>
          ))}
        </div>

        {aba === 'resumo' && (
          <div className="grid gap-4 sm:grid-cols-2">
            {resumos.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-gray-400">
                Nenhuma marcação no período.
              </div>
            ) : resumos.map(r => (
              <div key={r.email} className="rounded-2xl shadow-lg p-6" style={{ background: '#fff' }}>
                <p className="font-bold text-sm mb-3 truncate" style={{ color: '#7B2D6E' }}>{r.email}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl p-3 text-center" style={{ background: '#F5DEB3' }}>
                    <p className="text-2xl font-bold" style={{ color: '#7B2D6E' }}>{formatarHoras(r.totalMinutos)}</p>
                    <p className="text-xs text-gray-500 mt-1">Horas trabalhadas</p>
                  </div>
                  <div className="rounded-xl p-3 text-center" style={{ background: '#F5DEB3' }}>
                    <p className="text-2xl font-bold" style={{ color: '#7B2D6E' }}>{r.totalDias}</p>
                    <p className="text-xs text-gray-500 mt-1">Dias com ponto</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === 'detalhado' && (
          <div className="rounded-2xl shadow-lg overflow-hidden" style={{ background: '#fff' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#7B2D6E', color: '#fff' }}>
                    <th className="px-4 py-3 text-left">Colaborador</th>
                    <th className="px-4 py-3 text-left">Tipo</th>
                    <th className="px-4 py-3 text-left">Data</th>
                    <th className="px-4 py-3 text-left">Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {marcacoes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-gray-400">
                        Nenhuma marcação no período.
                      </td>
                    </tr>
                  ) : marcacoes.map((m, i) => (
                    <tr
                      key={m.id}
                      style={{ background: i % 2 === 0 ? '#faf5f9' : '#fff' }}
                    >
                      <td className="px-4 py-2 truncate max-w-[180px]" style={{ color: '#5a1f50' }}>{m.email}</td>
                      <td className="px-4 py-2">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-bold"
                          style={{
                            background: m.tipo === 'entrada' ? '#dcfce7' : '#fee2e2',
                            color: m.tipo === 'entrada' ? '#166534' : '#991b1b',
                          }}
                        >
                          {m.tipo === 'entrada' ? '🟢 Entrada' : '🔴 Saída'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-600">
                        {format(new Date(m.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </td>
                      <td className="px-4 py-2 text-gray-600">
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
