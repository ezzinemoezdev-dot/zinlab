import ImportExcel from '@/components/ImportExcel'
import StudentTable from '@/components/StudentTable'
import { createClient } from '@/lib/supabase/server'
import { addStudent } from '@/actions/studentActions'

export default async function StudentsPage() {
  const classId = "0b79f3e1-6c60-4bd9-91b4-242c16740a88" // Ton ID de test
  const supabase = await createClient()

  // 1. Récupération des élèves
  const { data: students, error } = await supabase
    .from('students')
    .select('*')
    .eq('class_id', classId)
    .order('last_name', { ascending: true })

  if (error) return <div className="p-8 text-red-500">Erreur : {error.message}</div>

  // 2. Fonction pour ajouter un élève (Server Action)
  async function handleAdd(formData: FormData) {
    'use server'
    await addStudent(classId, formData)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Gestion des Élèves</h1>
      
      {/* BLOC IMPORT EXCEL (Ton composant existant) */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold mb-2">Importer une liste</h2>
        <p className="text-sm text-gray-500 mb-4">
          Le fichier Excel doit contenir : <b>Nom_complet</b> et <b>Groupe</b> (A, B, C ou D).
        </p>
        <ImportExcel classId={classId} />
      </div>

      {/* BLOC AJOUT MANUEL */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">Ajouter un élève manuellement</h2>
        <form action={handleAdd} className="flex gap-4 items-end flex-wrap">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Prénom</label>
            <input name="first_name" required className="border p-2 rounded w-40" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nom</label>
            <input name="last_name" required className="border p-2 rounded w-40" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Groupe</label>
            <select name="group" className="border p-2 rounded w-24">
              <option value="">-</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            + Ajouter
          </button>
        </form>
      </div>

      {/* LE TABLEAU INTERACTIF */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Liste des élèves</h2>
        <StudentTable initialStudents={students || []} />
      </div>
    </div>
  )
}