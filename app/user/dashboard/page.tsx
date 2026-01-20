"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  CreditCard,
  HandCoins,
  Wallet2,
  ArrowUpRight,
  ArrowDownLeft,
  AlertCircle,
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { useEffect, useMemo, useState } from "react"

export default function UserDashboard() {
  const { user } = useAuth()

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api"

  const [weeklyPayments, setWeeklyPayments] = useState<any[]>([])
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([])
  const [activeBills, setActiveBills] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [summary, setSummary] = useState<any | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [reminderModalOpen, setReminderModalOpen] = useState(false)
  const [channelEmail, setChannelEmail] = useState(false)
  const [channelWhatsapp, setChannelWhatsapp] = useState(false)
  const [channelError, setChannelError] = useState<string | null>(null)
  const [savingChannels, setSavingChannels] = useState(false)

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem("authToken")
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`${API_BASE_URL}/dashboard/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.message || "Gagal memuat dashboard")
        }

        const json = await res.json()
        const data = json?.data || {}
        setWeeklyPayments(data.weekly_payments || [])
        setMonthlyTrend(data.monthly_trend || [])
        setActiveBills(data.active_bills || [])
        setRecentActivities(data.recent_activities || [])
        setSummary(data.summary || null)
      } catch (err: any) {
        console.error(err)
        setError(err?.message || "Tidak dapat memuat data")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  useEffect(() => {
    if (!summary) return
    setChannelEmail(!!summary.reminder_email_enabled)
    setChannelWhatsapp(!!summary.reminder_whatsapp_enabled)
  }, [summary])

  const progressPercent = useMemo(() => {
    if (!summary) return 0
    if (!summary.month_target) return 0
    return Math.min(100, Math.round((summary.total_paid_this_month / summary.month_target) * 100))
  }, [summary])

  const currentBill = summary?.current_bill_amount ?? 0
  const currentDueDate = summary?.current_bill_due

  const openReminderModal = () => {
    setChannelError(null)
    setReminderModalOpen(true)
  }

  const saveReminderChannels = async () => {
    if (!summary) return
    const token = localStorage.getItem("authToken")
    if (!token) return
    try {
      setSavingChannels(true)
      setChannelError(null)
      const res = await fetch(`${API_BASE_URL}/auth/reminder-channels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reminder_email_enabled: channelEmail,
          reminder_whatsapp_enabled: channelWhatsapp,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body?.message || "Gagal menyimpan pengingat")
      }

      const nextSummary = {
        ...summary,
        auto_reminder_enabled: body.auto_reminder_enabled,
        reminder_email_enabled: body.reminder_email_enabled,
        reminder_whatsapp_enabled: body.reminder_whatsapp_enabled,
        email_verified: body.email_verified ?? summary.email_verified,
        whatsapp_verified: body.whatsapp_verified ?? summary.whatsapp_verified,
      }
      setSummary(nextSummary)
      setReminderModalOpen(false)
    } catch (err: any) {
      setChannelError(err?.message || "Gagal menyimpan pengingat")
    } finally {
      setSavingChannels(false)
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Memuat dashboard...</p>
  }

  if (error) {
    return <p className="text-red-500">{error}</p>
  }

  return (
    <>
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Uang kas komunitas • Anggota</p>
            <h1 className="text-3xl font-bold">Halo, {user?.name}</h1>
          </div>
          <Badge variant="outline" className="text-sm">Role: {user?.role}</Badge>
        </div>
        <p className="text-muted-foreground mt-2">Pantau tagihan kas mingguan, riwayat setoran, dan progres bulan ini.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tagihan minggu ini</p>
              <p className="text-2xl font-bold">Rp{currentBill.toLocaleString("id-ID")}</p>
              <p className="text-xs text-muted-foreground mt-1">{currentDueDate ? `Jatuh tempo ${currentDueDate}` : "Jatuh tempo belum tercatat"}</p>
            </div>
            <CalendarClock className="w-10 h-10 text-primary/20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total lunas bulan ini</p>
              <p className="text-2xl font-bold">Rp{(summary?.total_paid_this_month ?? 0).toLocaleString("id-ID")}</p>
              <p className="text-xs text-green-600 mt-1">{summary?.paid_weeks_this_month ?? 0} minggu berhasil dibayar</p>
            </div>
            <CheckCircle2 className="w-10 h-10 text-primary/20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Dana kas terkumpul</p>
              <p className="text-2xl font-bold">Rp{(summary?.collected_total ?? 0).toLocaleString("id-ID")}</p>
              <p className="text-xs text-muted-foreground mt-1">Periode berjalan</p>
            </div>
            <HandCoins className="w-10 h-10 text-primary/20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Auto-pengingat</p>
              <p className="text-2xl font-bold">{summary?.auto_reminder_enabled ? "Aktif" : "Nonaktif"}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {summary?.reminder_text || "Pengingat terjadwal"}
              </p>
            </div>
            <Clock3 className="w-10 h-10 text-primary/20" />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Pengingat via email/WA jika kontak sudah terverifikasi.
            </div>
            <Button
              size="sm"
              variant={summary?.auto_reminder_enabled ? "default" : "outline"}
              onClick={openReminderModal}
            >
              Atur
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Setoran 8 minggu terakhir</h3>
              <p className="text-sm text-muted-foreground">Nilai kas per minggu (dibayar vs tagihan)</p>
            </div>
            <Badge variant="secondary">Nominal per minggu: Rp50.000</Badge>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={weeklyPayments}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="paid" stackId="a" fill="#0ea5e9" radius={[8, 8, 0, 0]} name="Dibayar" />
              <Bar dataKey="due" stackId="a" fill="#e2e8f0" radius={[8, 8, 0, 0]} name="Tagihan" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">Progres bulan ini</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Minggu terbayar</span>
              <span className="font-semibold">{summary?.paid_weeks_this_month ?? 0} / 4</span>
            </div>
            <Progress value={progressPercent} />
            <p className="text-xs text-muted-foreground">Target terpenuhi jika pembayaran minggu ini selesai.</p>
          </div>
          <div className="rounded-lg border border-border/60 p-3 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Perkiraan total Jan 2026</p>
              <p className="text-lg font-semibold">Rp{(summary?.month_target ?? 0).toLocaleString("id-ID")}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Sudah disetor</p>
              <p className="text-sm font-semibold text-primary">Rp{(summary?.total_paid_this_month ?? 0).toLocaleString("id-ID")}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CreditCard className="w-4 h-4 text-primary" />
              <span>QRIS & transfer bank tersedia</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Wallet2 className="w-4 h-4 text-primary" />
              <span>Saldo kas tersimpan aman</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6 mt-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Tagihan aktif</h3>
              <p className="text-sm text-muted-foreground">Fokus pada minggu berjalan</p>
            </div>
            <Button size="sm" className="gap-2">
              Bayar sekarang
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-3">
            {activeBills.map((bill) => (
              <div key={bill.id} className="flex items-center justify-between rounded-lg border border-border/60 p-4">
                <div>
                  <p className="text-sm text-muted-foreground">{bill.label}</p>
                  <p className="text-lg font-semibold">Rp{bill.amount.toLocaleString("id-ID")}</p>
                  <p className="text-xs text-muted-foreground">Jatuh tempo {bill.due}</p>
                </div>
                <Badge variant={bill.status === "Lunas" ? "outline" : "secondary"}>{bill.status}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Riwayat cepat</h3>
              <p className="text-sm text-muted-foreground">Setoran terakhir dan pengingat</p>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              Lihat semua
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-3">
            {recentActivities.map((activity, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    activity.type === "in" ? "bg-primary/10 text-primary" : "bg-secondary text-foreground"
                  }`}>
                    {activity.type === "in" ? <ArrowDownLeft className="w-4 h-4" /> : <Clock3 className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {activity.amount === 0 ? "Pengingat" : `+Rp${activity.amount.toLocaleString("id-ID")}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Trend bulanan</h3>
            <p className="text-sm text-muted-foreground">Total setoran kas per bulan</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="total" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {reminderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-lg border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Atur pengingat</h3>
              <Button variant="ghost" size="icon" onClick={() => setReminderModalOpen(false)}>✕</Button>
            </div>
            <p className="text-sm text-muted-foreground">Pilih kanal pengingat yang ingin digunakan. Aktifkan email atau WhatsApp setelah kontak terverifikasi.</p>

            {channelError && (
              <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive">
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{channelError}</span>
                </div>
                <Link href="/user/profile" className="text-sm font-semibold underline underline-offset-4">Ke profil</Link>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <p className="font-medium text-sm">Email</p>
                  <p className="text-xs text-muted-foreground">{summary?.email_verified ? "Email terverifikasi" : "Belum verifikasi email"}</p>
                </div>
                <Button
                  variant={channelEmail ? "default" : "outline"}
                  onClick={() => setChannelEmail(!channelEmail)}
                  disabled={!summary?.has_email}
                  className={!summary?.has_email ? "opacity-60" : ""}
                >
                  {channelEmail ? "ON" : "OFF"}
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <p className="font-medium text-sm">WhatsApp</p>
                  <p className="text-xs text-muted-foreground">{summary?.whatsapp_verified ? "WA terverifikasi" : "Isi & verifikasi nomor WA"}</p>
                </div>
                <Button
                  variant={channelWhatsapp ? "default" : "outline"}
                  onClick={() => setChannelWhatsapp(!channelWhatsapp)}
                  disabled={!summary?.has_phone}
                  className={!summary?.has_phone ? "opacity-60" : ""}
                >
                  {channelWhatsapp ? "ON" : "OFF"}
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setReminderModalOpen(false)}>Batal</Button>
              <Button onClick={saveReminderChannels} disabled={savingChannels} className="gap-2">
                {savingChannels ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </>
  )
}
