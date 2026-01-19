"use client"

import { useAuth } from "@/lib/auth-context"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Users, CheckCircle2, Wallet2, AlertTriangle, CalendarClock, ArrowUpRight, Upload, Bell } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { useEffect, useState } from "react"
import SuccessToast from "@/components/success-toast"

export default function AdminDashboard() {
  const { user } = useAuth()
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api"

  const [payments, setPayments] = useState<any[]>([])
  const [usersList, setUsersList] = useState<any[]>([])
  const [schedules, setSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState("")

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      const token = localStorage.getItem("authToken")
      try {
        const [pRes, uRes, sRes] = await Promise.all([
          fetch(`${API_BASE_URL}/payments?per_page=1000`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/datausers?per_page=1000`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/schedules`, { headers: { Authorization: `Bearer ${token}` } }),
        ])

        if (pRes.ok) {
          const pJson = await pRes.json()
          setPayments(pJson.data || [])
        }

        if (uRes.ok) {
          const uJson = await uRes.json()
          setUsersList(uJson.data || [])
        }

        if (sRes.ok) {
          const sJson = await sRes.json()
          setSchedules(sJson.data || [])
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err)
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [])

  // Derived metrics
  const now = new Date()
  const totalCollectedThisMonth = payments
    .filter((p) => p.status === "approved" && new Date(p.created_at).getMonth() === now.getMonth())
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

  const currentSchedule = schedules.length ? schedules[schedules.length - 1] : null
  const setoranWeekCount = payments.filter((p) => p.status === "approved" && (currentSchedule ? p.schedule?.id === currentSchedule.id : true)).length

  const pendingApprovals = payments.filter((p) => p.status === "pending")

  const tunggakanCount = usersList.filter((u) => u.last_payment_status !== "approved").length

  // build weeklyCollections from payments grouped by week_label
  const weekMap: Record<string, { paid: number; target: number }> = {}
  payments.forEach((p) => {
    const label = p.week_label || 'Lain'
    if (!weekMap[label]) weekMap[label] = { paid: 0, target: usersList.length || 0 }
    if (p.status === 'approved') weekMap[label].paid += 1
  })
  const weeklyCollections = Object.keys(weekMap).map((k) => ({ name: k, paid: weekMap[k].paid, target: weekMap[k].target }))

  // monthly trend aggregated from payments
  const monthMap: Record<string, { total: number }> = {}
  payments.forEach((p) => {
    const d = new Date(p.created_at)
    const key = d.toLocaleString('default', { month: 'short' })
    if (!monthMap[key]) monthMap[key] = { total: 0 }
    if (p.status === 'approved') monthMap[key].total += Number(p.amount) || 0
  })
  const monthlyTrend = Object.keys(monthMap).map((k) => ({ name: k, total: monthMap[k].total }))

  const monthlyTarget = usersList.length ? usersList.length * 50000 * 4 : 1200000
  const progressPercent = Math.min(100, Math.round((totalCollectedThisMonth / monthlyTarget) * 100))

  const approvePayment = async (id: number) => {
    const token = localStorage.getItem("authToken")
    try {
      const res = await fetch(`${API_BASE_URL}/payments/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "approved" }),
      })

      if (!res.ok) throw new Error("Failed to approve")

      const pRes = await fetch(`${API_BASE_URL}/payments?per_page=1000`, { headers: { Authorization: `Bearer ${token}` } })
      if (pRes.ok) {
        const pJson = await pRes.json()
        setPayments(pJson.data || [])
      }
      setToastMessage("Pembayaran disetujui")
      setToastOpen(true)
    } catch (err) {
      console.error(err)
      setToastMessage("Gagal menyetujui pembayaran")
      setToastOpen(true)
    }
  }

  const rejectPayment = async (id: number) => {
    const token = localStorage.getItem("authToken")
    try {
      const res = await fetch(`${API_BASE_URL}/payments/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "rejected" }),
      })

      if (!res.ok) throw new Error("Failed to reject")

      const pRes = await fetch(`${API_BASE_URL}/payments?per_page=1000`, { headers: { Authorization: `Bearer ${token}` } })
      if (pRes.ok) {
        const pJson = await pRes.json()
        setPayments(pJson.data || [])
      }
      setToastMessage("Pembayaran ditolak")
      setToastOpen(true)
    } catch (err) {
      console.error(err)
      setToastMessage("Gagal menolak pembayaran")
      setToastOpen(true)
    }
  }

  const sendReminder = async () => {
    const token = localStorage.getItem("authToken")
    try {
      const res = await fetch(`${API_BASE_URL}/payments?status=pending&per_page=1000`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error("Failed to fetch pending")
      const json = await res.json()
      const count = (json.data || []).length
      setToastMessage(`Pengingat terkirim ke ${count} anggota`)
      setToastOpen(true)
    } catch (err) {
      console.error(err)
      setToastMessage("Gagal mengirim pengingat")
      setToastOpen(true)
    }
  }

  return (
    <>
      <div className="mb-8 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground">Bendahara • Kas mingguan</p>
          <h1 className="text-3xl font-bold">Halo, {user?.name}</h1>
          <p className="text-muted-foreground mt-1">Pantau setoran masuk, tunggakan, dan antrian verifikasi.</p>
        </div>
        <Button className="gap-2" onClick={sendReminder}>
          Kirim pengingat
          <Bell className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Kas terkumpul bulan ini</p>
              <p className="text-2xl font-bold">Rp{totalCollectedThisMonth.toLocaleString("id-ID")}</p>
              <p className="text-xs text-muted-foreground mt-1">Target Rp{monthlyTarget.toLocaleString("id-ID")}</p>
            </div>
            <Wallet2 className="w-10 h-10 text-primary/20" />
          </div>
          <Progress value={progressPercent} className="mt-3" />
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Setoran minggu berjalan</p>
              <p className="text-2xl font-bold">{setoranWeekCount}/{usersList.length || 0} anggota</p>
              <p className="text-xs text-green-600 mt-1">{usersList.length ? Math.round((setoranWeekCount / usersList.length) * 100) : 0}% sudah bayar</p>
            </div>
            <CheckCircle2 className="w-10 h-10 text-primary/20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Antrian verifikasi</p>
              <p className="text-2xl font-bold">{pendingApprovals.length} bukti</p>
              <p className="text-xs text-muted-foreground mt-1">Perlu cek & setujui</p>
            </div>
            <Upload className="w-10 h-10 text-primary/20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tunggakan aktif</p>
              <p className="text-2xl font-bold">{tunggakanCount} anggota</p>
              <p className="text-xs text-yellow-600 mt-1">Fokus penagihan</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-primary/20" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <Card className="xl:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Setoran mingguan</h3>
              <p className="text-sm text-muted-foreground">Dibayar vs target (juta rupiah)</p>
            </div>
            <Badge variant="secondary">Target per minggu Rp50.000</Badge>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={weeklyCollections}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="paid" stackId="a" fill="#0ea5e9" radius={[8, 8, 0, 0]} name="Dibayar" />
              <Bar dataKey="target" stackId="a" fill="#e2e8f0" radius={[8, 8, 0, 0]} name="Target" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">Reminder minggu ini</h3>
          <div className="space-y-3">
            {["Kirim broadcast WA", "Update kanal grup", "Posting bukti rekap"].map((task) => (
              <div key={task} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                <span className="text-sm">{task}</span>
                <Badge variant="outline">Prioritas</Badge>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-border/60 p-4">
            <p className="text-sm font-medium">Estimasi jatuh tempo</p>
            <p className="text-2xl font-bold mt-1">3 hari lagi</p>
            <p className="text-xs text-muted-foreground">Sabtu, 23 Jan 2026</p>
            <Button variant="outline" size="sm" className="mt-3 gap-2">
              Kirim pengingat
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6 mb-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Antrian verifikasi bukti</h3>
              <p className="text-sm text-muted-foreground">Cek dan setujui pembayaran</p>
            </div>
            <Badge variant="secondary">{pendingApprovals.length} bukti</Badge>
          </div>
          <div className="space-y-3">
            {pendingApprovals.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-border/70 p-4">
                <div>
                  <p className="text-sm font-medium">{p.user?.name ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">{p.week_label ?? p.week} • {p.method}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">Rp{(Number(p.amount) || 0).toLocaleString("id-ID")}</p>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" onClick={() => rejectPayment(p.id)}>Tolak</Button>
                    <Button size="sm" className="gap-2" onClick={() => approvePayment(p.id)}>
                      Setujui
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Trend bulanan</h3>
              <p className="text-sm text-muted-foreground">Total kas per bulan (ribu)</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-between text-sm">
            <span>Total bulan ini</span>
            <span className="font-semibold">Rp{totalCollectedThisMonth.toLocaleString('id-ID')}</span>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Anggota yang belum setor</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {usersList.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-3">
              <div>
                <p className="font-medium text-sm">{u.name}</p>
                <p className="text-xs text-muted-foreground">{u.last_payment_week ?? '—'} • Rp{(u.last_payment_amount || 0).toLocaleString('id-ID')}</p>
              </div>
              <Badge variant="outline">{u.last_payment_status === 'approved' ? 'Sudah bayar' : 'Belum bayar'}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}
