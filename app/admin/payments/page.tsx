"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Clock3, Download, Filter, Loader2, Search, Upload } from "lucide-react"

interface PaymentRow {
  id: number
  user: { id: number; name: string; email: string }
  week_label: string
  due_date?: string | null
  method: string
  amount: number
  status: string
  created_at: string
  proof_url?: string | null
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api"

export default function AdminPayments() {
  const [pending, setPending] = useState<PaymentRow[]>([])
  const [recent, setRecent] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const token = useMemo(() => {
    if (typeof window === "undefined") return null
    return localStorage.getItem("authToken")
  }, [])

  useEffect(() => {
    void fetchPayments()
  }, [token])

  const fetchPayments = async () => {
    if (!token) return
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (search) params.append('q', search)
      const res = await fetch(`${API_BASE_URL}/payments?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.message || "Gagal memuat pembayaran")
      }
      const data = await res.json()
      const items: PaymentRow[] = data.data || []
      setPending(items.filter((p) => p.status === 'pending'))
      setRecent(items.filter((p) => p.status === 'approved'))
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: number, status: 'approved' | 'rejected' | 'pending') => {
    if (!token) return
    try {
      setError(null)
      const res = await fetch(`${API_BASE_URL}/payments/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.message || 'Gagal mengubah status')
      }
      await fetchPayments()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengubah status'
      setError(msg)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Bendahara • Verifikasi pembayaran</p>
          <h1 className="text-3xl font-bold">Setoran masuk</h1>
          <p className="text-muted-foreground mt-1">Cek bukti, setujui, atau tolak pembayaran kas mingguan.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Ekspor CSV
          </Button>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">Antrian bukti pembayaran</h3>
            <p className="text-sm text-muted-foreground">Setujui untuk menandai sebagai lunas.</p>
          </div>
          <Badge variant="secondary">{pending.length} menunggu</Badge>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Memuat data...
          </div>
        ) : pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tidak ada antrian.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {pending.map((item) => (
              <div key={item.id} className="rounded-lg border border-border/70 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{item.user?.name}</p>
                    <p className="text-xs text-muted-foreground">{item.week_label} • {item.method}</p>
                  </div>
                  <Badge variant="outline">Rp{item.amount.toLocaleString("id-ID")}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="gap-2 flex-1"
                    asChild={!!item.proof_url}
                    disabled={!item.proof_url}
                  >
                    {item.proof_url ? (
                      <a href={item.proof_url} target="_blank" rel="noreferrer">
                        <Upload className="w-4 h-4" />
                        Lihat bukti
                      </a>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Bukti belum ada
                      </span>
                    )}
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => void updateStatus(item.id, 'rejected')}>
                    Tolak
                  </Button>
                  <Button className="gap-2 flex-1" onClick={() => void updateStatus(item.id, 'approved')}>
                    Setujui
                    <CheckCircle2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Riwayat terbaru</h3>
              <p className="text-sm text-muted-foreground">Pembayaran yang sudah disetujui.</p>
            </div>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama / minggu"
                className="h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void fetchPayments() } }}
              />
              <Button size="sm" variant="outline" onClick={() => void fetchPayments()}>Cari</Button>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Memuat data...
            </div>
          ) : recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada riwayat.</p>
          ) : (
            <div className="divide-y divide-border/80">
              {recent.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-sm">{item.user?.name}</p>
                    <p className="text-xs text-muted-foreground">{item.week_label} • {item.method}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Rp{item.amount.toLocaleString("id-ID")}</p>
                    <Badge variant="outline" className="mt-1">Lunas</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Progres minggu ini</h3>
              <p className="text-sm text-muted-foreground">Pembayaran anggota terhadap target</p>
            </div>
            <Clock3 className="w-5 h-5 text-primary" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Anggota bayar</span>
              <span className="font-semibold">{pending.length + recent.length}</span>
            </div>
            <Progress value={recent.length > 0 || pending.length > 0 ? (recent.length / Math.max(1, pending.length + recent.length)) * 100 : 0} />
            <div className="flex items-center justify-between text-sm">
              <span>Nominal terkumpul</span>
              <span className="font-semibold">Rp{recent.reduce((sum, item) => sum + (item.amount || 0), 0).toLocaleString("id-ID")}</span>
            </div>
          </div>
          <div className="rounded-lg bg-muted/50 p-4 text-sm">
            <p className="font-semibold">Catatan bendahara</p>
            <p className="text-muted-foreground mt-1">Prioritaskan verifikasi QRIS & transfer, lalu konfirmasi tunai saat serah terima.</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
