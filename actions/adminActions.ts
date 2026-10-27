'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function createTeacher(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const lastName = formData.get('last_name') as string
  const firstName = formData.get('first_name') as string

  if (!email || !password || !lastName || !firstName) {
    return { error: "Veuillez remplir tous les champs." }
  }

  // 1. Créer le compte d'authentification
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: { 
      first_name: firstName, 
      last_name: lastName,
      full_name: lastName 
    }
  })

  if (authError) return { error: authError.message }

  // 2. Le Trigger "on_auth_user_created" a déjà créé le profil.
  // On utilise "upsert" pour simplement s'assurer que le rôle est bien "teacher"
  // et qu'il n'y a pas de conflit.
  if (authData.user) {
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authData.user.id,
        first_name: firstName,
        full_name: lastName,
        role: 'teacher' 
      }, { 
        onConflict: 'id' 
      })

    if (profileError) return { error: profileError.message }
  }

  revalidatePath('/')
  return { success: true }
}

export async function getTeachers() {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, first_name, full_name, role, created_at')
    .eq('role', 'teacher')
    .order('created_at', { ascending: false })
  
  if (error) return { error: error.message, data: [] }
  return { success: true, data }
}