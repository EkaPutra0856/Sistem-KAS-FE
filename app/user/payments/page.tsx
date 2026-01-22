"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import CalendarWeekly from "@/components/calendar-weekly"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CreditCard, QrCode, Banknote, Upload, ArrowUpRight, ShieldCheck, CalendarClock, Loader2 } from "lucide-react"

interface PaymentRow {
  id: number
  week_label: string
  due_date?: string | null
  amount: number
  method: string
  status: string
  created_at: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api"

export default function UserPayments() {
  const [amount, setAmount] = useState("50000")
  const [weekLabel, setWeekLabel] = useState("Kas Minggu ke-3")
  const [dueDate, setDueDate] = useState("")
  const [selectedMethod, setSelectedMethod] = useState("QRIS")
  const [file, setFile] = useState<File | null>(null)
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      const res = await fetch(`${API_BASE_URL}/payments`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.message || "Gagal memuat pembayaran")
      }
      const data = await res.json()
      setPayments(data.data || [])
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const submitPayment = async () => {
    if (!token) {
      setError("Token tidak ditemukan. Silakan login ulang.")
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      const form = new FormData()
      form.append('amount', amount)
      form.append('method', selectedMethod)
      form.append('week_label', weekLabel)
      if (dueDate) form.append('due_date', dueDate)
      if (file) form.append('proof', file)

      const res = await fetch(`${API_BASE_URL}/payments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.message || 'Gagal mengirim pembayaran')
      }

      await fetchPayments()
      setFile(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengirim pembayaran'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const methods = [
    {
      title: "QRIS",
      description: "Scan dan bayar instan. Verifikasi otomatis dalam hitungan menit.",
      icon: QrCode,
      badge: "Paling cepat",
    },
    {
      title: "Transfer Bank",
      description: "Kirim ke rekening bendahara. Unggah bukti transfer untuk verifikasi.",
      icon: Banknote,
      badge: "Manual cek",
    },
    {
      title: "Tunai Tercatat",
      description: "Serah tunai ke bendahara, tandai lunas setelah dikonfirmasi.",
      icon: CreditCard,
      badge: "Butuh konfirmasi",
    },
  ]

  return (
    <div className="space-y-6">
      <CalendarWeekly onSelectWeek={(label, due) => {
        if (label) setWeekLabel(label)
        if (due) setDueDate(due)
        // scroll to form
        setTimeout(() => {
          const el = document.querySelector('form')
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 120)
      }} />
      <div>
        <p className="text-sm text-muted-foreground">Menu bayar kas mingguan</p>
        <h1 className="text-3xl font-bold">Bayar tagihan kamu</h1>
        <p className="text-muted-foreground mt-2">Pilih metode, isi nominal, unggah bukti bila perlu, lalu tandai lunas.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tagihan aktif</p>
              <h3 className="text-xl font-semibold">{weekLabel || 'Kas Minggu ini'}</h3>
              <p className="text-sm text-muted-foreground">Nominal Rp{Number(amount || 0).toLocaleString('id-ID')}</p>
            </div>
            <Badge variant="secondary" className="gap-2">
              <CalendarClock className="w-4 h-4" />
              Jadwalkan
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nominal setoran</label>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Judul / minggu</label>
              <Input value={weekLabel} onChange={(e) => setWeekLabel(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Jatuh tempo</label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Pilih metode</p>
            <div className="grid gap-3 md:grid-cols-3">
              {methods.map(({ title, description, icon: Icon, badge }) => (
                <div
                  key={title}
                  className={`border rounded-xl p-4 bg-card hover:border-primary/50 transition ${selectedMethod === title ? 'border-primary shadow-sm' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge variant="outline">{badge}</Badge>
                  </div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{description}</p>
                  <Button variant="ghost" className="mt-3 gap-2 w-full justify-start" onClick={() => setSelectedMethod(title)}>
                    Pilih {title}
                    <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Unggah bukti (opsional untuk QRIS/transfer)</p>
            <div className="border border-dashed rounded-lg p-4 flex flex-col gap-3 items-start bg-muted/40">
              <p className="text-sm text-muted-foreground">Seret file atau pilih untuk unggah.</p>
              <Input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              {file && <p className="text-xs text-muted-foreground">File: {file.name}</p>}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-wrap gap-3">
            <Button className="gap-2" onClick={() => void submitPayment()} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Tandai lunas
            </Button>
            <Button variant="outline" onClick={() => setFile(null)} disabled={submitting}>Reset</Button>
          </div>
        </Card>

        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Status pembayaran</p>
              <h3 className="text-xl font-semibold">Riwayatmu</h3>
            </div>
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Memuat data...
            </div>
          ) : payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada pembayaran.</p>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => (
                <div key={p.id} className="flex items-start justify-between rounded-lg border border-border/60 p-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{p.week_label}</p>
                    <p className="font-semibold">Rp{p.amount.toLocaleString("id-ID")}</p>
                    <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()} • {p.method}</p>
                    {p.due_date && <p className="text-xs text-muted-foreground">Jatuh tempo {p.due_date}</p>}
                  </div>
                  <Badge variant="outline">{p.status === 'approved' ? 'Lunas' : p.status}</Badge>
                </div>
              ))}
            </div>
          )}

          {!loading && payments.some((p) => p.status !== 'approved') && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              Ada pembayaran yang masih pending/belum lunas. Selesaikan sebelum jatuh tempo agar tidak kena pengingat.
            </div>
          )}

          <div className="rounded-lg bg-muted/60 p-4 border border-border/60 text-sm space-y-2">
            <p className="font-semibold">Tips tertib kas</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Setor sebelum hari bayar yang ditetapkan admin agar tidak kena pengingat.</li>
              <li>Gunakan QRIS agar verifikasi lebih cepat.</li>
              <li>Pastikan nominal sesuai agar status langsung lunas.</li>
            </ul>
          </div>
        </Card>
       </div>
     </div>
   )
 }
