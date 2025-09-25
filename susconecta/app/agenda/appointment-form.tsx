"use client"

export default function AppointmentForm() {
  return (
    <form className="p-4 border rounded space-y-4">
      <div>
        <label className="block text-sm font-medium">Paciente</label>
        <input type="text" className="mt-1 w-full border p-2 rounded" />
      </div>
      <div>
        <label className="block text-sm font-medium">Data</label>
        <input type="date" className="mt-1 w-full border p-2 rounded" />
      </div>
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Salvar
      </button>
    </form>
  )
}
