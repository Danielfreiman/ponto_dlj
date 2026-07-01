import { NextResponse } from 'next/server'
import { requireMaster } from '@/lib/auth/requireMaster'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const master = await requireMaster()
  if (!master) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { id } = await params
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
