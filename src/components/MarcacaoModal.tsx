'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'

interface Usuario {
  id: string
  email: string
}

interface MarcacaoEdicao {
  id: string
  user_id: string
  email: string
  tipo: 'entrada' | 'saida'
  created_at: string
}

interface Props {
  usuarios: Usuario[]
  marcacao: MarcacaoEdicao | null
  onClose: () => void
  onSalvar: (dados: {
    id?: string
    user_id: string
    email: string
    tipo: 'entrada' | 'saida'
    created_at: string
  }) => Promise<void>
}

export default function MarcacaoModal({ usuarios, marcacao, onClose, onSalvar }: Props) {
  const [userId, setUserId] = useState(marcacao?.user_id || usuarios[0]?.id || '')
  const [tipo, setTipo] = useState<'entrada' | 'saida'>(marcacao?.tipo || 'entrada')
  const [dataHora, setDataHora] = useState(
    marcacao
      ? format(new Date(marcacao.created_at), "yyyy-MM-dd'T'HH:mm")
      : format(new Date(), "yyyy-MM-dd'T'HH:mm")
  )
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    const usuario = usuarios.find(u => u.id === userId)
    if (!usuario) {
      setErro('Selecione um colaborador.')
      return
    }

    setSalvando(true)
    try {
      await onSalvar({
        id: marcacao?.id,
        user_id: usuario.id,
        email: usuario.email,
        tipo,
        created_at: new Date(dataHora).toISOString(),
      })
    } catch {
      setErro('Erro ao salvar marcação.')
    }
    setSalvando(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#ffffff' }}>
        <h2 className="font-semibold text-zinc-800 text-base mb-4">
          {marcacao ? 'Editar marcação' : 'Nova marcação'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Colaborador</label>
            <select
              value={userId}
              onChange={e => setUserId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none text-zinc-800"
              style={{ borderColor: '#e4e4e7', background: '#fafafa' }}
            >
              {usuarios.length === 0 && <option value="">Nenhum colaborador cadastrado</option>}
              {usuarios.map(u => (
                <option key={u.id} value={u.id}>{u.email}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Tipo</label>
            <div className="flex gap-2">
              {(['entrada', 'saida'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className="flex-1 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer"
                  style={
                    tipo === t
                      ? { background: '#7B2D6E', borderColor: '#7B2D6E', color: '#fff' }
                      : { borderColor: '#e4e4e7', color: '#71717a' }
                  }
                >
                  {t === 'entrada' ? 'Entrada' : 'Saída'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Data e hora</label>
            <input
              type="datetime-local"
              required
              value={dataHora}
              onChange={e => setDataHora(e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none text-zinc-800"
              style={{ borderColor: '#e4e4e7', background: '#fafafa' }}
            />
          </div>

          {erro && <p className="text-sm text-red-500">{erro}</p>}

          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium border cursor-pointer"
              style={{ borderColor: '#e4e4e7', color: '#52525b' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando || usuarios.length === 0}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60 cursor-pointer"
              style={{ background: '#7B2D6E' }}
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
