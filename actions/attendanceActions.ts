'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveAttendance(sessionId: string, records: { student_id: string, status: string }[]) {
  const supabase = await createClient()
  
  // On prépare les données avec l'ID de la séance
  const dataToInsert = records.map(r => ({
    session_id: sessionId,
    student_id: r.student_id,
    status: r.status
  }))

  // On utilise upsert pour mettre à jour si l'appel a déjà été fait, ou insérer sinon
  const { error } = await supabase
    .from('attendance')
    .upsert(dataToInsert, { onConflict: 'session_id,student_id' })
  
  if (error) return { error: error.message }
  
  revalidatePath('/')
  return { success: true }
}