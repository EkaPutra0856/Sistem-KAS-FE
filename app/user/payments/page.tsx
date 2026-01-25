"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import CalendarWeekly from "@/components/calendar-weekly"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CreditCard, QrCode, Banknote, Upload, ArrowUpRight, ShieldCheck, CalendarClock, Loader2, HandCoins } from "lucide-react"

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
const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ""
const MIDTRANS_IS_PRODUCTION = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"

type FeeInfo = {
  title?: string | null
  description?: string | null
  amount_per_week?: number | null
  badge_1?: string | null
  badge_2?: string | null
  badge_3?: string | null
}

export default function UserPayments() {
  const [amount, setAmount] = useState("50000")
  const [weekLabel, setWeekLabel] = useState("Kas Minggu ke-3")
  const [dueDate, setDueDate] = useState("")
  const [selectedMethod, setSelectedMethod] = useState("Transfer/Qris")
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feeInfo, setFeeInfo] = useState<FeeInfo | null>(null)
  const [feeInfoLoading, setFeeInfoLoading] = useState(false)

  const token = useMemo(() => {
    if (typeof window === "undefined") return null
    return localStorage.getItem("authToken")
  }, [])

  useEffect(() => {
    // if (!MIDTRANS_CLIENT_KEY || typeof window === "undefined") return
    if (document.getElementById("midtrans-snap-script")) return

    const script = document.createElement("script")
    script.id = "midtrans-snap-script"
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js"
    script.setAttribute("data-client-key", MIDTRANS_CLIENT_KEY)
    document.body.appendChild(script)

    return () => {
      // script.remove()
    }
  }, [])

  useEffect(() => {
    void fetchPayments()
    void fetchFeeInfo()
  }, [token])

  const fetchFeeInfo = async () => {
    if (!token) return
    try {
      setFeeInfoLoading(true)
      const res = await fetch(`${API_BASE_URL}/fee-info`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Gagal memuat info iuran')
      const data = await res.json().catch(() => ({}))
      setFeeInfo(data.data || null)
      if (data?.data?.amount_per_week) {
        setAmount(String(data.data.amount_per_week))
      }
    } catch (err) {
      // keep silent, fallback to defaults
    } finally {
      setFeeInfoLoading(false)
    }
  }

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
      onSuccess: () => {
        void fetchPayments()
      },
      onPending: () => {
        void fetchPayments()
      },
      onError: () => {
        setError("Pembayaran gagal. Silakan coba lagi atau gunakan metode lain.")
        void fetchPayments()
      },
      onClose: () => {
        setError("Pembayaran dibatalkan sebelum selesai.")
      },
    })
  }

  const submitPayment = async () => {
    if (!token) {
      setError("Token tidak ditemukan. Silakan login ulang.")
      return
    }

    // 1. PASTIKAN METHOD SESUAI BACKEND
    // Jika Tunai -> "Tunai", Jika tidak -> "Transfer/Qris"
    const methodForBackend = selectedMethod === "Tunai Tercatat" ? "Tunai" : "Transfer/Qris"

    try {
      setSubmitting(true)
      setError(null)

      // 2. BERSIHKAN DATA SEBELUM KIRIM
      // Hapus karakter non-angka dari amount, lalu ubah jadi Integer (PENTING!)
      const cleanAmount = parseInt(amount.toString().replace(/\D/g, ''));

      const payload = {
        amount: cleanAmount, // Kirim angka murni (50000), bukan string "50000"
        method: methodForBackend,
        week_label: weekLabel,
        // Kirim due_date hanya jika ada isinya
        ...(dueDate && { due_date: dueDate }),
      }

      console.log("Mengirim Payload:", payload); // Debugging 1

      const res = await fetch(`${API_BASE_URL}/payments`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const body = await res.json().catch(() => ({}))
      console.log("Respon Backend:", body); // Debugging 2

      if (!res.ok) {
        throw new Error(body?.message || 'Gagal mengirim pembayaran')
      }

      const snapToken = body?.data?.snap_token
      
      // 3. LOGIKA POPUP
      if (snapToken) {
        console.log("Token ditemukan, membuka Snap...");
        payWithSnap(snapToken)
      } else {
        // Jika method Qris tapi token kosong, berarti ada masalah di Backend
        if (methodForBackend === "Transfer/Qris") {
            console.error("Token kosong padahal method Qris!");
            alert("Sistem gagal membuat Token pembayaran. Cek Backend.");
        }
        await fetchPayments()
      }
    } catch (err) {
      console.error("Error Submit:", err);
      const msg = err instanceof Error ? err.message : 'Gagal mengirim pembayaran'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const methods = [
    {
      title: "Transfer/Qris",
      description: "Scan QRIS atau transfer ke rekening yang disediakan, verifikasi otomatis.",
      icon: Banknote,
      badge: "Verifikasi otomatis",
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

      <Card className="p-4 border-dashed bg-muted/40 space-y-2">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-primary/10 text-primary p-2">
            <HandCoins className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-sm">{feeInfo?.title || "Iuran ini dipakai untuk apa?"}</p>
            <p className="text-sm text-muted-foreground">
              {feeInfo?.description || "Dana kas mingguan Rp50.000 dipakai untuk kebersihan lingkungan, listrik sekretariat, kas darurat, dan bantuan sosial komunitas."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {(feeInfo?.amount_per_week || feeInfoLoading) && (
            <Badge variant="secondary">Nominal: Rp{(feeInfo?.amount_per_week || 50000).toLocaleString("id-ID")}/minggu</Badge>
          )}
          {feeInfo?.badge_1 && <Badge variant="outline">{feeInfo.badge_1}</Badge>}
          {feeInfo?.badge_2 && <Badge variant="outline">{feeInfo.badge_2}</Badge>}
          {feeInfo?.badge_3 && <Badge variant="outline">{feeInfo.badge_3}</Badge>}
          {!feeInfo && !feeInfoLoading && (
            <>
              <Badge variant="secondary">Nominal tetap: Rp50.000/minggu</Badge>
              <Badge variant="outline">Jatuh tempo sesuai jadwal admin</Badge>
              <Badge variant="outline">Gunakan QRIS/transfer untuk verifikasi cepat</Badge>
            </>
          )}
        </div>
      </Card>

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

          <div className="flex flex-wrap gap-3">
            <Button className="gap-2" onClick={() => void submitPayment()} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {selectedMethod === "Tunai Tercatat" ? "Konfirmasi Tunai" : "Bayar Sekarang"}
            </Button>
            <Button 
                variant="outline" 
                onClick={() => {
                    setAmount("50000")
                    setWeekLabel("Kas Minggu ke-...") 
                    setDueDate("")
                }} 
                disabled={submitting}
            >
                Reset
            </Button>
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
