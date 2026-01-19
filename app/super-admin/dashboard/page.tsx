"use client"

import { useAuth } from "@/lib/auth-context"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, TrendingUp, AlertTriangle, Activity, ShieldCheck, Wallet2, Building2 } from "lucide-react"
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from "recharts"

export default function SuperAdminDashboard() {
  const { user } = useAuth()

  const orgTrend = [
    { month: "Sep", communities: 8, admins: 12, totalKas: 8.2 },
    { month: "Oct", communities: 9, admins: 14, totalKas: 9.1 },
    { month: "Nov", communities: 10, admins: 15, totalKas: 9.8 },
    { month: "Dec", communities: 11, admins: 17, totalKas: 10.4 },
    { month: "Jan", communities: 12, admins: 18, totalKas: 11.2 },
  ]

  const riskData = [
    { name: "Telat >7 hari", count: 4 },
    { name: "Belum verifikasi", count: 7 },
    { name: "Saldo minimum", count: 2 },
  ]

  return (
    <>
      <div className="mb-8 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground">Super Admin • Oversight kas</p>
          <h1 className="text-3xl font-bold">Gambaran organisasi</h1>
          <p className="text-muted-foreground mt-1">Pantau komunitas, admin, dan kesehatan kas lintas tim.</p>
        </div>
        <Badge variant="secondary" className="gap-2">
          <ShieldCheck className="w-4 h-4" />
          Akses penuh
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total komunitas</p>
              <p className="text-2xl font-bold">12</p>
            </div>
            <Building2 className="w-10 h-10 text-primary/20" />
          </div>
          <p className="text-xs text-green-600 mt-2">+1 bulan ini</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Admin aktif</p>
              <p className="text-2xl font-bold">18</p>
            </div>
            <Activity className="w-10 h-10 text-primary/20" />
          </div>
          <p className="text-xs text-green-600 mt-2">Seluruh admin online</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total kas tersinkron</p>
              <p className="text-2xl font-bold">Rp11.200.000</p>
            </div>
            <Wallet2 className="w-10 h-10 text-primary/20" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Periode Jan 2026</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Isu prioritas</p>
              <p className="text-2xl font-bold">3</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-primary/20" />
          </div>
          <p className="text-xs text-yellow-600 mt-2">Butuh follow-up</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-6">Pertumbuhan komunitas & admin</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={orgTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="communities" stroke="#0ea5e9" name="Komunitas" />
              <Line yAxisId="right" type="monotone" dataKey="admins" stroke="#8b5cf6" name="Admin" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-6">Total kas tersinkron</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={orgTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="totalKas" fill="#0ea5e9" stroke="#0ea5e9" name="Kas (juta)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-6 mb-6">
        <h3 className="font-semibold mb-6">Risiko & pengecualian</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={riskData}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Admin aktif</h3>
          <div className="space-y-3">
            {[
              { name: "Dina", role: "Bendahara A", status: "Active" },
              { name: "Raka", role: "Bendahara B", status: "Active" },
              { name: "Luna", role: "Super Admin", status: "Active" },
            ].map((admin, index) => (
              <div key={index} className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">{admin.name}</p>
                  <span className="text-xs px-2 py-1 bg-green-500/10 text-green-700 rounded">{admin.status}</span>
                </div>
                <p className="text-xs text-muted-foreground">{admin.role}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Log audit terbaru</h3>
          <div className="space-y-3">
            {[
              { event: "Admin ditambah", user: "Luna", time: "1 jam lalu" },
              { event: "Atur nominal kas", user: "Dina", time: "3 jam lalu" },
              { event: "Update hak akses", user: "Super Admin", time: "1 hari lalu" },
              { event: "Backup selesai", user: "System", time: "2 hari lalu" },
            ].map((audit, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium">{audit.event}</p>
                  <p className="text-xs text-muted-foreground">oleh {audit.user}</p>
                </div>
                <span className="text-xs text-muted-foreground">{audit.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
