import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MasterDashboard from '@/components/MasterDashboard'
import ColaboradorDashboard from '@/components/ColaboradorDashboard'

const MASTER_EMAIL = 'danifreiman44@gmail.com'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const isMaster = user.email === MASTER_EMAIL

  return isMaster
    ? <MasterDashboard user={user} />
    : <ColaboradorDashboard user={user} />
}
