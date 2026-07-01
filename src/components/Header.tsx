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
    <header className="flex items-center justify-between px-6 py-3 shadow-md" style={{ background: '#7B2D6E' }}>
      <div className="flex items-center gap-3">
        <Image src="/logo.png" alt="Zé do Açaí" width={48} height={48} />
        <div>
          <p className="text-white font-bold text-lg leading-tight">Zé do Açaí</p>
          <p className="text-[#e8c98a] text-xs">
            {role === 'master' ? '👑 Administrador' : '👤 Colaborador'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[#F5DEB3] text-sm hidden sm:block">{email}</span>
        <button
          onClick={handleLogout}
          className="text-sm px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer"
          style={{ background: '#5a1f50', color: '#F5DEB3' }}
        >
          Sair
        </button>
      </div>
    </header>
  )
}
