"use client"

import { useAuth } from "@/lib/auth-context"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Activity, ShieldCheck, Wallet2, Building2 } from "lucide-react"
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from "recharts"
import { useEffect, useState } from "react"

export default function SuperAdminDashboard() {
  const { user } = useAuth()

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api"

  const [metrics, setMetrics] = useState<any>({})
  const [orgTrend, setOrgTrend] = useState<any[]>([])
  const [riskData, setRiskData] = useState<any[]>([])
  const [activeAdmins, setActiveAdmins] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem("authToken")
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`${API_BASE_URL}/dashboard/super-admin`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.message || "Gagal memuat dashboard")
        }

        const json = await res.json()
        const data = json?.data || {}
        setMetrics(data.metrics || {})
        setOrgTrend(data.org_trend || [])
        setRiskData(data.risk_data || [])
        setActiveAdmins(data.active_admins || [])
        setAuditLogs(data.audit_logs || [])
      } catch (err: any) {
        console.error(err)
        setError(err?.message || "Tidak dapat memuat data")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  if (loading) return <p className="text-muted-foreground">Memuat dashboard...</p>
  if (error) return <p className="text-red-500">{error}</p>

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
              <p className="text-2xl font-bold">{metrics?.communities ?? 0}</p>
            </div>
            <Building2 className="w-10 h-10 text-primary/20" />
          </div>
          <p className="text-xs text-green-600 mt-2">Data sinkron</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Admin aktif</p>
              <p className="text-2xl font-bold">{metrics?.admins ?? 0}</p>
            </div>
            <Activity className="w-10 h-10 text-primary/20" />
          </div>
          <p className="text-xs text-green-600 mt-2">Peran admin terdaftar</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total kas tersinkron</p>
              <p className="text-2xl font-bold">Rp{(metrics?.total_kas ?? 0).toLocaleString("id-ID")}</p>
            </div>
            <Wallet2 className="w-10 h-10 text-primary/20" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Periode berjalan</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Isu prioritas</p>
              <p className="text-2xl font-bold">{metrics?.issues ?? 0}</p>
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
              <XAxis dataKey="name" />
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
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="total" fill="#0ea5e9" stroke="#0ea5e9" name="Kas" />
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
            {activeAdmins.length === 0 && <p className="text-sm text-muted-foreground">Belum ada admin tercatat.</p>}
            {activeAdmins.map((admin, index) => (
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
            {auditLogs.length === 0 && <p className="text-sm text-muted-foreground">Belum ada log terbaru.</p>}
            {auditLogs.map((audit, index) => (
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
