"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Plus, Save, Trash2 } from "lucide-react"

interface ManagedAdmin {
  id: number
  name: string
  email: string
  role: "admin" | "super-admin" | "user"
  created_at: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api"

export default function AdminManagementPage() {
  const { user } = useAuth()
  const [admins, setAdmins] = useState<ManagedAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [meta, setMeta] = useState<{ total: number; per_page: number; current_page: number; last_page: number } | null>(null)
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin" as ManagedAdmin["role"],
  })

  const token = useMemo(() => {
    if (typeof window === "undefined") return null
    return localStorage.getItem("authToken")
  }, [])

  useEffect(() => {
    fetchAdmins()
  }, [token, page])

  // Extracted so we can re-use it after create/update/delete to ensure server-authoritative state
  async function fetchAdmins() {
    if (!token) return
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('role', 'admin')
      params.append('page', String(page))
      params.append('per_page', String(perPage))
      if (search) params.append('q', search)
      const res = await fetch(`${API_BASE_URL}/datausers?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.message || "Gagal memuat data admin")
      }
      const data = await res.json()
      setAdmins(data.data || [])
      setMeta(data.meta ?? null)
      setError(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setForm({ name: "", email: "", password: "", role: "admin" })
    setEditingId(null)
  }

  const upsertAdmin = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!token) {
      setError("Token tidak ditemukan. Silakan login ulang.")
      return
    }

    if (!form.name || !form.email || (!editingId && !form.password)) {
      setError("Nama, email, dan password harus diisi")
      return
    }

    try {
      setSaving(true)
      setError(null)

      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        role: form.role,
      }
      if (form.password) payload.password = form.password

      const url = editingId ? `${API_BASE_URL}/datausers/${editingId}` : `${API_BASE_URL}/datausers`
      const method = editingId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const msg =
          body?.message ||
          (body?.errors ? Object.values(body.errors as Record<string, string[]>)[0]?.[0] : null) ||
          "Gagal menyimpan data admin"
        throw new Error(msg)
      }

      const body = await res.json().catch(() => null)
      const saved: ManagedAdmin | null = body?.data ?? null

      if (saved) {
        // After save, reload the authoritative list from server (ensures only role=admin shown)
        await fetchAdmins()
      }

      setModalOpen(false)
      resetForm()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan data admin"
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (admin: ManagedAdmin) => {
    setEditingId(admin.id)
    setForm({ name: admin.name, email: admin.email, password: "", role: admin.role })
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!token) {
      setError("Token tidak ditemukan. Silakan login ulang.")
      return
    }

    try {
      setDeletingId(id)
      const res = await fetch(`${API_BASE_URL}/datausers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.message || "Gagal menghapus admin")
      }

      // reload list from server to avoid stale/optimistic state
      await fetchAdmins()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus admin"
      setError(msg)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <CardTitle>Kelola Admin IT</CardTitle>
              <CardDescription>Super Admin dapat membuat, mengubah, dan menghapus Admin IT.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="mb-4 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-between mb-4">
            <div className="flex items-center gap-2 flex-1">
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email" className="flex-1" />
              <Button type="button" onClick={() => { setPage(1); void fetchAdmins() }} className="gap-2">Cari</Button>
            </div>

            <div className="flex justify-end ml-4">
              <Button type="button" onClick={() => setModalOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" /> Tambah Admin IT
              </Button>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Memuat data...
            </div>
          ) : admins.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada Admin IT.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-4">Nama</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Role</th>
                    <th className="py-2 pr-4">Dibuat</th>
                    <th className="py-2 pr-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((a) => (
                    <tr key={a.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{a.name}</td>
                      <td className="py-2 pr-4">{a.email}</td>
                      <td className="py-2 pr-4 capitalize">{a.role.replace("-", " ")}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{new Date(a.created_at).toLocaleString()}</td>
                      <td className="py-2 pr-4 text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(a)}>
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(a.id)}
                          disabled={deletingId === a.id || user?.id === String(a.id)}
                          className="gap-2"
                        >
                          {deletingId === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          Hapus
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {meta && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <div>Menampilkan halaman {meta.current_page} dari {meta.last_page} — total {meta.total}</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { setPage((p) => Math.max(1, p - 1)); void fetchAdmins() }}>
                  Prev
                </Button>
                <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => { setPage((p) => p + 1); void fetchAdmins() }}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editingId ? "Edit Admin IT" : "Tambah Admin IT"}</h3>
              <Button variant="ghost" size="icon-sm" onClick={() => setModalOpen(false)}>
                ✕
              </Button>
            </div>
            <form className="space-y-3" onSubmit={upsertAdmin}>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama</label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nama lengkap"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="admin@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password {editingId ? "(isi jika ingin ganti)" : ""}</label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as ManagedAdmin["role"] })}
                >
                  <option value="admin">Admin IT</option>
                  <option value="super-admin">Super Admin</option>
                </select>
              </div>

              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setModalOpen(false)} disabled={saving}>
                  Batal
                </Button>
                <Button type="submit" disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingId ? "Simpan Perubahan" : "Simpan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
