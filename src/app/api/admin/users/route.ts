import { NextResponse } from 'next/server'
import { requireMaster, MASTER_EMAIL } from '@/lib/auth/requireMaster'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const master = await requireMaster()
  if (!master) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.listUsers()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const usuarios = data.users
    .filter(u => u.email !== MASTER_EMAIL)
    .map(u => ({ id: u.id, email: u.email, created_at: u.created_at }))

  return NextResponse.json({ usuarios })
}

export async function POST(request: Request) {
  const master = await requireMaster()
  if (!master) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { email, password, nome } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'E-mail e senha são obrigatórios.' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'A senha deve ter no mínimo 6 caracteres.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: nome ? { nome } : undefined,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ usuario: { id: data.user.id, email: data.user.email } })
}
