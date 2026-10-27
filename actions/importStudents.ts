'use server'

import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server'

export async function importStudents(classId: string, formData: FormData) {
  const file = formData.get('file') as File
  if (!file) return { error: 'Aucun fichier sélectionné' }

  // 1. Lire le fichier Excel
  const bytes = await file.arrayBuffer()
  const workbook = XLSX.read(bytes)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json(sheet) as any[]

  // 2. Préparer les élèves pour Supabase
  const studentsToInsert = data.map((row) => {
    // On récupère le nom complet
    const fullName = row.Nom_complet || row.nom_complet || 'Inconnu';
    
    // On sépare le nom complet : le premier mot est le prénom, le reste est le nom
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    return {
      class_id: classId,
      first_name: firstName,
      last_name: lastName,
      group: row.Groupe || row.groupe || row.group || null
    }
  })

  // 3. Insérer dans Supabase
  const supabase = await createClient()
  const { error } = await supabase.from('students').insert(studentsToInsert)

  if (error) return { error: error.message }
  return { success: true, count: studentsToInsert.length }
}