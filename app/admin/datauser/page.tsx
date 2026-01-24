"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Plus, Save, Trash2, CreditCard, CheckCircle2 } from "lucide-react"

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        callbacks?: {
          onSuccess?: (result?: unknown) => void
          onPending?: (result?: unknown) => void
          onError?: (error?: unknown) => void
          onClose?: () => void
        }
      ) => void
    }
  }
}

interface ManagedUser {
  id: number
  name: string
  email: string
  role: "user" | "admin" | "super-admin"
  created_at: string
  last_payment_status?: string | null
  last_payment_week?: string | null
  last_payment_amount?: number | null
  last_payment_method?: string | null
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api"
const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ""
const MIDTRANS_IS_PRODUCTION = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"

export default function AdminDataUserPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [paymentStatus, setPaymentStatus] = useState<Record<number, string>>({})
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedUserForPayment, setSelectedUserForPayment] = useState<ManagedUser | null>(null)
  const [paymentForm, setPaymentForm] = useState({ amount: 50000, method: "Transfer/Qris", week: "Minggu 3" })
  const [schedules, setSchedules] = useState<any[]>([])
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [quickModalOpen, setQuickModalOpen] = useState(false)
  const [quickForm, setQuickForm] = useState({ name: "", email: "", password: "" })
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({ id: 0, name: "", email: "", password: "" })
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [meta, setMeta] = useState<{ total: number; per_page: number; current_page: number; last_page: number } | null>(null)
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user" as ManagedUser["role"],
  })

  const token = useMemo(() => {
    if (typeof window === "undefined") return null
    return localStorage.getItem("authToken")
  }, [])

  useEffect(() => {
    if (!MIDTRANS_CLIENT_KEY || typeof window === "undefined") return
    if (document.getElementById("midtrans-snap-script")) return

    const script = document.createElement("script")
    script.id = "midtrans-snap-script"
    script.src = MIDTRANS_IS_PRODUCTION
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js"
    script.setAttribute("data-client-key", MIDTRANS_CLIENT_KEY)
    document.body.appendChild(script)

    return () => {
      script.remove()
    }
  }, [])

  useEffect(() => {
    fetchUsers()
    void fetchSchedules()
  }, [token])

  const fetchSchedules = async () => {
    if (!token) return
    try {
      const res = await fetch(`${API_BASE_URL}/schedules`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return
      const d = await res.json().catch(() => null)
      setSchedules(d?.data || [])
    } catch (err) {
      // ignore
    }
  }

  async function fetchUsers() {
    if (!token) return
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('page', String(page))
      params.append('per_page', String(perPage))
      if (search) params.append('q', search)
      const res = await fetch(`${API_BASE_URL}/datausers?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          const msg = body?.message || `Gagal memuat data user (status ${res.status})`
          throw new Error(msg)
      }

      const data = await res.json()
      const onlyUsers = (data.data || []).filter((u: ManagedUser) => u.role === 'user')
      setUsers(onlyUsers)
      const mapping: Record<number, string> = {}
      ;(onlyUsers || []).forEach((u: ManagedUser) => {
        if (u.last_payment_status) {
          mapping[u.id] = u.last_payment_status === 'approved' ? 'Lunas' : u.last_payment_status
        }
      })
      setPaymentStatus(mapping)
      setMeta(data.meta ?? null)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setForm({ name: "", email: "", password: "", role: "user" })
    setEditingId(null)
  }

  const handleQuickCreate = async (override?: { name: string; email: string; password: string }) => {
    if (!token) {
      setError("Token tidak ditemukan. Silakan login ulang.")
      return
    }

    try {
      setSaving(true)
      setError(null)

      const unique = Date.now()
      const payload = {
        name: override?.name?.trim() || `User ${unique}`,
        email: override?.email?.trim() || `user${unique}@example.com`,
        role: "user",
        password: override?.password || "password123",
      }

      const res = await fetch(`${API_BASE_URL}/datausers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const msg = body?.message || "Gagal membuat user"
        throw new Error(msg)
      }

      const body = await res.json().catch(() => null)
      const newUser: ManagedUser | null = body?.data ?? null

      // reload list from server to ensure authoritative state (and filter out non-user roles)
      await fetchUsers()

      if (override) {
        setQuickModalOpen(false)
        setQuickForm({ name: "", email: "", password: "" })
      }
      // reload server list
      await fetchUsers()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal membuat user"
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      setError("Token tidak ditemukan. Silakan login ulang.")
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

      if (form.password) {
        payload.password = form.password
      }

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
          "Gagal menyimpan data"
        throw new Error(msg)
      }

      const body = await res.json().catch(() => null)
      const updatedUser: ManagedUser | null = body?.data ?? null

      // refresh list from server to avoid transient/optimistic mismatches
      await fetchUsers()

      resetForm()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan data"
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (u: ManagedUser) => {
    setEditingId(u.id)
    setEditForm({ id: u.id, name: u.name, email: u.email, password: "" })
    setEditModalOpen(true)
  }

  const openPaymentModal = (u: ManagedUser) => {
    setSelectedUserForPayment(u)
    setPaymentForm({ amount: 50000, method: "Transfer/Qris", week: "Minggu 3" })
    setSelectedScheduleId(null)
    setPaymentModalOpen(true)
  }

  const payWithSnap = (snapToken: string) => {
    if (!snapToken) return
    if (!MIDTRANS_CLIENT_KEY) {
      setError("MIDTRANS client key belum diset di FE. Tambahkan NEXT_PUBLIC_MIDTRANS_CLIENT_KEY.")
      return
    }
    if (!window.snap) {
      setError("Snap belum siap. Muat ulang halaman dan coba lagi.")
      return
    }

    window.snap.pay(snapToken, {
      onSuccess: () => { void fetchUsers() },
      onPending: () => { void fetchUsers() },
      onError: () => {
        setError("Pembayaran gagal. Silakan coba lagi atau gunakan metode lain.")
        void fetchUsers()
      },
      onClose: () => {
        setError("Pembayaran dibatalkan sebelum selesai.")
      },
    })
  }

  const submitPayment = async () => {
    if (!selectedUserForPayment) return
    if (!token) {
      setError("Token tidak ditemukan. Silakan login ulang.")
      return
    }

    try {
      setSaving(true)
      setError(null)

      const methodForBackend = paymentForm.method === 'Tunai' ? 'Tunai' : 'Transfer/Qris'

      const formData = new FormData()
      formData.append('amount', String(paymentForm.amount))
      formData.append('method', methodForBackend)
      formData.append('week_label', paymentForm.week)
      formData.append('user_id', String(selectedUserForPayment.id))
      if (selectedScheduleId) formData.append('schedule_id', String(selectedScheduleId))

      const res = await fetch(`${API_BASE_URL}/payments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(body?.message || 'Gagal mencatat pembayaran')
      }

      const paymentStatusFromApi = body?.data?.status as string | undefined
      if (paymentStatusFromApi) {
        setPaymentStatus((prev) => ({ ...prev, [selectedUserForPayment.id]: paymentStatusFromApi === 'approved' ? 'Lunas' : paymentStatusFromApi }))
      }

      const snapToken = body?.data?.snap_token
      if (snapToken) {
        payWithSnap(snapToken)
      } else {
        await fetchUsers()
      }

      setPaymentModalOpen(false)
      setSelectedUserForPayment(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mencatat pembayaran'
      setError(message)
    } finally {
      setSaving(false)
    }
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
        throw new Error(body?.message || "Gagal menghapus user")
      }

      // reload authoritative list after delete
      await fetchUsers()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menghapus user"
      setError(message)
    } finally {
      setDeletingId(null)
    }
  }

  const saveEdit = async () => {
    if (!token) {
      setError("Token tidak ditemukan. Silakan login ulang.")
      return
    }

    if (!editForm.name || !editForm.email) {
      setError("Nama dan email harus diisi")
      return
    }

    try {
      setSaving(true)
      setError(null)
      const payload: Record<string, unknown> = { name: editForm.name, email: editForm.email }
      if (editForm.password) payload.password = editForm.password

      const res = await fetch(`${API_BASE_URL}/datausers/${editForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.message || 'Gagal menyimpan perubahan')
      }

      setEditModalOpen(false)
      setEditForm({ id: 0, name: '', email: '', password: '' })
      await fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan perubahan')
    } finally {
      setSaving(false)
    }
  }

  const title = editingId ? "Edit User" : "Tambah User"

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>Kelola data anggota kas. Tambah/edit/hapus akun anggota.</CardDescription>
            </div>

          </div>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
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
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password {editingId ? "(kosongkan jika tidak diubah)" : ""}</label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <select
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as ManagedUser["role"] })}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="super-admin">Super Admin</option>
              </select>
            </div>

            <div className="md:col-span-2 flex gap-2 justify-end">
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
                  Reset
                </Button>
              )}
              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingId ? "Simpan Perubahan" : "Tambah"}
              </Button>
            </div>
          </form>

          {error && (
            <p className="mt-4 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar User</CardTitle>
          <CardDescription>User yang terdaftar pada sistem.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or email"
                className="flex-1"
              />
              <Button type="button" onClick={() => { setPage(1); void fetchUsers() }} className="gap-2">Cari</Button>
            </div>

            <div className="flex justify-end ml-4">
              <Button type="button" onClick={() => setQuickModalOpen(true)} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Tambah anggota cepat
              </Button>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Memuat data...
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada user.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-4">Nama</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Status Bayar</th>
                    <th className="py-2 pr-4">Role</th>
                    <th className="py-2 pr-4">Dibuat</th>
                    <th className="py-2 pr-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{u.name}</td>
                      <td className="py-2 pr-4">{u.email}</td>
                      <td className="py-2 pr-4">
                        <span className={`text-xs px-2 py-1 rounded ${paymentStatus[u.id] === "Lunas" ? "bg-green-500/10 text-green-700" : "bg-amber-500/10 text-amber-700"}`}>
                          {paymentStatus[u.id] || "Belum bayar"}
                        </span>
                      </td>
                      <td className="py-2 pr-4 capitalize">{u.role.replace("-", " ")}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{new Date(u.created_at).toLocaleString()}</td>
                      <td className="py-2 pr-4 text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openPaymentModal(u)}>
                          Bayar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(u)}>
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(u.id)}
                          disabled={deletingId === u.id || user?.id === String(u.id)}
                          className="gap-2"
                        >
                          {deletingId === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          Hapus
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination controls */}
          {meta && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <div>Menampilkan halaman {meta.current_page} dari {meta.last_page} — total {meta.total}</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { setPage((p) => Math.max(1, p - 1)); void fetchUsers() }}>
                  Prev
                </Button>
                <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => { setPage((p) => p + 1); void fetchUsers() }}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {quickModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Create User Biasa</h3>
              <Button variant="ghost" size="icon-sm" onClick={() => setQuickModalOpen(false)}>
                ✕
              </Button>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama</label>
                <Input
                  value={quickForm.name}
                  onChange={(e) => setQuickForm({ ...quickForm, name: e.target.value })}
                  placeholder="Nama lengkap"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={quickForm.email}
                  onChange={(e) => setQuickForm({ ...quickForm, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  value={quickForm.password}
                  onChange={(e) => setQuickForm({ ...quickForm, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                />
              </div>
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setQuickModalOpen(false)} disabled={saving}>
                Batal
              </Button>
              <Button
                onClick={() => {
                  if (!quickForm.email || !quickForm.password || !quickForm.name) {
                    setError("Nama, email, dan password harus diisi")
                    return
                  }
                  void handleQuickCreate({
                    name: quickForm.name,
                    email: quickForm.email,
                    password: quickForm.password,
                  })
                }}
                disabled={saving}
                className="gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}

      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Edit User</h3>
              <Button variant="ghost" size="icon-sm" onClick={() => setEditModalOpen(false)}>
                ✕
              </Button>
            </div>
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void saveEdit() }}>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama</label>
                <Input required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" required value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password (isi untuk mengganti)</label>
                <Input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setEditModalOpen(false)} disabled={saving}>Batal</Button>
                <Button type="submit" disabled={saving} className="gap-2">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {paymentModalOpen && selectedUserForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Bayar Kas - {selectedUserForPayment.name}</h3>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setPaymentModalOpen(false)
                  setSelectedUserForPayment(null)
                }}
              >
                ✕
              </Button>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Jumlah</label>
                <Input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Metode</label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground"
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                >
                  <option value="Transfer/Qris">QRIS / Transfer Bank</option>
                  <option value="Tunai">Tunai</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Minggu</label>
                <Input value={paymentForm.week} onChange={(e) => setPaymentForm({ ...paymentForm, week: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Jadwal (opsional)</label>
                <select className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground" value={selectedScheduleId ?? ""} onChange={(e) => setSelectedScheduleId(e.target.value ? Number(e.target.value) : null)}>
                  <option value="">-- Tidak ada --</option>
                  {schedules.map((s) => (
                    <option key={s.id} value={s.id}>{s.label || `${s.start_date}${s.end_date ? ` — ${s.end_date}` : ''}`}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setPaymentModalOpen(false)
                  setSelectedUserForPayment(null)
                }}
              >
                Batal
              </Button>
              <Button onClick={() => submitPayment()} className="gap-2">
                <CreditCard className="w-4 h-4" /> Bayar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
