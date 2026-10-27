'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteStudent, updateStudent } from '@/actions/studentActions'
import { Pencil, Trash2, Check, X } from 'lucide-react'

type Student = { id: string; first_name: string; last_name: string; group: string; class_id: string };

export default function StudentTable({ initialStudents }: { initialStudents: Student[] }) {
  const [filter, setFilter] = useState('Tous')
  const [editingId, setEditingId] = useState<string | null>(null)
  const router = useRouter()

  const filteredStudents = filter === 'Tous' 
    ? initialStudents 
    : initialStudents.filter(s => s.group === filter)

  async function handleDelete(id: string) {
    if (confirm('Voulez-vous vraiment supprimer cet élève ?')) {
      await deleteStudent(id)
      router.refresh()
    }
  }

  async function handleUpdate(id: string, formData: FormData) {
    await updateStudent(id, formData)
    setEditingId(null)
    router.refresh()
  }

  return (
    <div>
      {/* BARRE DE FILTRES */}
      <div className="filter-bar">
        <span>Filtrer :</span>
        {['Tous', 'A', 'B', 'C', 'D'].map(g => (
          <button
            key={g}
            onClick={() => setFilter(g)}
            className={`filter-btn ${filter === g ? 'active' : ''}`}
          >
            {g === 'Tous' ? 'Tous' : `Groupe ${g}`}
          </button>
        ))}
      </div>

      {/* TABLEAU */}
      <div className="students-table-container">
        <table className="students-table">
          <thead>
            <tr>
              <th>Nom & Prénom</th>
              <th>Groupe</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <tr key={student.id}>
                  {editingId === student.id ? (
                    <td colSpan={3} style={{ padding: '10px 16px', background: '#f8faff' }}>
                      <form action={(fd) => handleUpdate(student.id, fd)} className="inline-form">
                        <input name="first_name" defaultValue={student.first_name} className="form-input" placeholder="Prénom" required/>
                        <input name="last_name" defaultValue={student.last_name} className="form-input" placeholder="Nom" required/>
                        <select name="group" defaultValue={student.group || ''} className="form-select">
                          <option value="">Aucun</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                        <button type="submit" className="action-btn edit" title="Enregistrer"><Check size={18}/></button>
                        <button type="button" onClick={() => setEditingId(null)} className="action-btn delete" title="Annuler"><X size={18}/></button>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td>
                        <b>{student.last_name}</b> {student.first_name}
                      </td>
                      <td>
                        {student.group ? (
                          <span className={`group-badge group-${student.group}`}>
                            Groupe {student.group}
                          </span>
                        ) : (
                          <span className="group-badge group-none">Non assigné</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button onClick={() => setEditingId(student.id)} className="action-btn edit" title="Modifier">
                          <Pencil size={18}/>
                        </button>
                        <button onClick={() => handleDelete(student.id)} className="action-btn delete" title="Supprimer">
                          <Trash2 size={18}/>
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  Aucun élève trouvé pour ce filtre.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}