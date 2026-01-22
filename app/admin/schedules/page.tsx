"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Plus, Save, Trash2 } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api"

export default function AdminSchedulesPage() {
  const [schedules, setSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({ label: "", start_date: "", end_date: "", active: true, pay_day_of_week: 5 })
  const token = useMemo(() => (typeof window === "undefined" ? null : localStorage.getItem("authToken")), [])

  const payDayLabel = (value?: number | null) => {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
    if (value === undefined || value === null) return "-"
    return days[value] ?? "-"
  }

  useEffect(() => {
    void fetchSchedules()
  }, [token])

  const fetchSchedules = async () => {
    if (!token) return
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE_URL}/schedules`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setSchedules(data.data || [])
    } catch (err) {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => { setEditing(null); setForm({ label: "", start_date: "", end_date: "", active: true, pay_day_of_week: 5 }); setModalOpen(true) }
  const openEdit = (s: any) => { setEditing(s); setForm({ label: s.label || "", start_date: s.start_date?.slice(0,10) || "", end_date: s.end_date?.slice(0,10) || "", active: !!s.active, pay_day_of_week: typeof s.pay_day_of_week === 'number' ? s.pay_day_of_week : 5 }); setModalOpen(true) }

  const save = async (e?: any) => {
    e?.preventDefault()
    if (!token) return
    try {
      setSaving(true)
      const payload = { label: form.label || null, start_date: form.start_date, end_date: form.end_date || null, active: form.active, pay_day_of_week: form.pay_day_of_week }
      const url = editing ? `${API_BASE_URL}/schedules/${editing.id}` : `${API_BASE_URL}/schedules`
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error('Failed')
      await fetchSchedules()
      setModalOpen(false)
    } catch (err) {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: number) => {
    if (!token) return
    try {
      const res = await fetch(`${API_BASE_URL}/schedules/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Failed')
      await fetchSchedules()
    } catch (err) {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Jadwal Mulai Bayar Kas</CardTitle>
            </div>
            <div>
              <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Tambah</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Memuat...</div>
          ) : schedules.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada jadwal. Tambah titik mulai bayar.</p>
          ) : (
            <div className="space-y-2">
              {schedules.map((s) => (
                <div key={s.id} className="flex items-center justify-between border rounded p-3">
                  <div>
                    <div className="font-medium">{s.label || `Mulai ${s.start_date?.slice(0,10)}`}</div>
                    <div className="text-xs text-muted-foreground">{s.start_date?.slice(0,10)}{s.end_date ? ` — ${s.end_date?.slice(0,10)}` : ''}</div>
                    <div className="text-xs text-muted-foreground">Hari bayar: {payDayLabel(s.pay_day_of_week)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(s)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => remove(s.id)}>Hapus</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editing ? 'Edit Jadwal' : 'Tambah Jadwal'}</h3>
              <Button variant="ghost" size="icon-sm" onClick={() => setModalOpen(false)}>✕</Button>
            </div>
            <form className="space-y-3" onSubmit={save}>
              <div className="space-y-2">
                <label className="text-sm font-medium">Label (opsional)</label>
                <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tanggal mulai jadwal</label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Hari bayar mingguan</label>
                <select
                  className="border rounded-md px-3 py-2 text-sm w-full bg-background"
                  value={form.pay_day_of_week}
                  onChange={(e) => setForm({ ...form, pay_day_of_week: Number(e.target.value) })}
                >
                  {["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((label, idx) => (
                    <option key={label} value={idx}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tanggal akhir (opsional)</label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Batal</Button>
                <Button type="submit" disabled={saving} className="gap-2">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
