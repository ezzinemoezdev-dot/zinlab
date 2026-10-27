'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createEvaluation(formData: FormData) {
  const supabase = await createClient()
  const newEval = {
    class_id: formData.get('class_id') as string,
    title: formData.get('title') as string,
    date_eval: formData.get('date_eval') as string,
  }
  const { error } = await supabase.from('evaluations').insert(newEval)
  if (error) return { error: error.message }
  revalidatePath('/')
  return { success: true }
}

export async function saveGrades(evaluationId: string, records: { student_id: string, score: number | null }[]) {
  const supabase = await createClient()
  
  const dataToUpsert = records.map(r => ({
    evaluation_id: evaluationId,
    student_id: r.student_id,
    score: r.score
  }))

  const { error } = await supabase
    .from('grades')
    .upsert(dataToUpsert, { onConflict: 'evaluation_id,student_id' })
  
  if (error) return { error: error.message }
  revalidatePath('/')
  return { success: true }
}