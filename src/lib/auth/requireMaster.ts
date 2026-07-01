import { createClient } from '@/lib/supabase/server'

export const MASTER_EMAIL = 'danifreiman44@gmail.com'

export async function requireMaster() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== MASTER_EMAIL) {
    return null
  }
  return user
}
