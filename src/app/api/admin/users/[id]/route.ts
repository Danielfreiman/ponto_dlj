import { NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/requireMaster'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const master = await requireMaster()
  if (!master) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY não configurada no servidor.' },
      { status: 500 }
    )
  }

  const { id } = await params

  try {
    const admin = createAdminClient()
    const { error } = await admin.auth.admin.deleteUser(id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao excluir colaborador.' },
      { status: 500 }
    )
  }
}
