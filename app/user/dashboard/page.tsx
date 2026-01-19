"use client"

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
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"

export default function UserDashboard() {
  const { user } = useAuth()

  const weeklyPayments = [
    { name: "W1", paid: 50, due: 50 },
    { name: "W2", paid: 50, due: 50 },
    { name: "W3", paid: 50, due: 50 },
    { name: "W4", paid: 50, due: 50 },
    { name: "W5", paid: 50, due: 50 },
    { name: "W6", paid: 50, due: 50 },
    { name: "W7", paid: 50, due: 50 },
    { name: "W8", paid: 25, due: 50 },
  ]

  const monthlyTrend = [
    { name: "Sep", total: 180 },
    { name: "Oct", total: 200 },
    { name: "Nov", total: 220 },
    { name: "Dec", total: 250 },
    { name: "Jan", total: 275 },
  ]

  const activeBills = [
    { id: "KM-2026-01", label: "Kas Minggu 3", due: "23 Jan 2026", amount: 50000, status: "Belum dibayar" },
    { id: "KM-2026-00", label: "Kas Minggu 2", due: "16 Jan 2026", amount: 50000, status: "Lunas" },
  ]

  const recentActivities = [
    { title: "Setoran Minggu 2", amount: 50000, time: "16 Jan 2026, 09:12", type: "in" },
    { title: "Pengingat jatuh tempo", amount: 0, time: "15 Jan 2026, 07:30", type: "note" },
    { title: "Setoran Minggu 1", amount: 50000, time: "09 Jan 2026, 08:55", type: "in" },
  ]

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
              <p className="text-2xl font-bold">Rp50.000</p>
              <p className="text-xs text-muted-foreground mt-1">Jatuh tempo 23 Jan 2026</p>
            </div>
            <CalendarClock className="w-10 h-10 text-primary/20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total lunas bulan ini</p>
              <p className="text-2xl font-bold">Rp150.000</p>
              <p className="text-xs text-green-600 mt-1">3 minggu berhasil dibayar</p>
            </div>
            <CheckCircle2 className="w-10 h-10 text-primary/20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Dana kas terkumpul</p>
              <p className="text-2xl font-bold">Rp1.250.000</p>
              <p className="text-xs text-muted-foreground mt-1">Periode Jan 2026</p>
            </div>
            <HandCoins className="w-10 h-10 text-primary/20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Auto-pengingat</p>
              <p className="text-2xl font-bold">Aktif</p>
              <p className="text-xs text-muted-foreground mt-1">Setiap Jumat, 07.00</p>
            </div>
            <Clock3 className="w-10 h-10 text-primary/20" />
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
              <span className="font-semibold">3 / 4</span>
            </div>
            <Progress value={75} />
            <p className="text-xs text-muted-foreground">Target terpenuhi jika pembayaran minggu ini selesai.</p>
          </div>
          <div className="rounded-lg border border-border/60 p-3 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Perkiraan total Jan 2026</p>
              <p className="text-lg font-semibold">Rp200.000</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Sudah disetor</p>
              <p className="text-sm font-semibold text-primary">Rp150.000</p>
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

    </>
  )
}
