'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addSession(formData: FormData) {
  const supabase = await createClient()
  
  const newSession = {
    class_id: formData.get('class_id') as string,
    title: formData.get('title') as string,
    session_date: formData.get('session_date') as string,
    start_time: formData.get('start_time') as string || null,
    end_time: formData.get('end_time') as string || null,
  }

  if (!newSession.class_id || !newSession.title || !newSession.session_date) {
    return { error: "Veuillez remplir les champs obligatoires." }
  }

  const { error } = await supabase.from('sessions').insert(newSession)
  
  if (error) return { error: error.message }
  
  revalidatePath('/')
  return { success: true }
}

export async function deleteSession(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('sessions').delete().eq('id', id)
  
  if (error) return { error: error.message }
  
  revalidatePath('/')
  return { success: true }
}