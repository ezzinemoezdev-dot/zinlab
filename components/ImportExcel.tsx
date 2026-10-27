'use client'

import { useState } from 'react'
import { importStudents } from '@/actions/importStudents'
import { useRouter } from 'next/navigation' // <-- NOUVEAU

export default function ImportExcel({ classId }: { classId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter() // <-- NOUVEAU

  async function handleFile(formData: FormData) {
    setLoading(true)
    const result = await importStudents(classId, formData)
    setLoading(false)
    
    if (result.error) {
      alert("Erreur: " + result.error)
    } else {
      alert(`${result.count} élèves importés avec succès !`)
      router.refresh() // <-- NOUVEAU : Met à jour la liste automatiquement
    }
  }

  return (
    <form action={handleFile} className="flex gap-2 mb-8">
      <input type="file" name="file" accept=".xlsx, .xls" required className="border p-2 rounded" />
      <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
        {loading ? 'Importation...' : 'Importer Excel'}
      </button>
    </form>
  )
}