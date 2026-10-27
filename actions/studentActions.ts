'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addStudent(classId: string, formData: FormData) {
  const supabase = await createClient()
  const newStudent = {
    class_id: classId,
    first_name: formData.get('first_name') as string,
    last_name: formData.get('last_name') as string,
    group: formData.get('group') as string || null,
  }
  const { error } = await supabase.from('students').insert(newStudent)
  if (error) return { error: error.message }
  revalidatePath('/')
  return { success: true }
}

export async function deleteStudent(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('students').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/')
  return { success: true }
}

export async function updateStudent(id: string, formData: FormData) {
  const supabase = await createClient()
  const updatedData = {
    first_name: formData.get('first_name') as string,
    last_name: formData.get('last_name') as string,
    group: formData.get('group') as string || null,
  }
  const { error } = await supabase.from('students').update(updatedData).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/')
  return { success: true }
}