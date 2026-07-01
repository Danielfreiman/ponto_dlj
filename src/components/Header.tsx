'use client'

import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  email: string
  role: 'master' | 'colaborador'
}

export default function Header({ email, role }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b" style={{ background: '#18181b', borderColor: '#27272a' }}>
      <div className="flex items-center gap-3">
        <Image src="/logo.png" alt="Zé do Açaí" width={40} height={40} />
        <div>
          <p className="text-white font-semibold text-base leading-tight">Zé do Açaí</p>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: '#7B2D6E', color: '#F5DEB3' }}
          >
            {role === 'master' ? 'Administrador' : 'Colaborador'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-zinc-400 text-sm hidden sm:block">{email}</span>
        <button
          onClick={handleLogout}
          className="text-sm px-4 py-1.5 rounded-lg font-medium border transition-colors cursor-pointer hover:bg-zinc-800"
          style={{ borderColor: '#3f3f46', color: '#a1a1aa' }}
        >
          Sair
        </button>
      </div>
    </header>
  )
}
