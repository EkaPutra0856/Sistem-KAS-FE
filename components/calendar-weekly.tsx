"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/lib/auth-context"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api"

type WeekItem = {
  saturday: string // YYYY-MM-DD
  label: string
  status?: string | null
  due_date?: string | null
  paymentId?: number | null
  amount?: number | null
  inSchedule?: boolean
}

export default function CalendarWeekly({ weeks = 12, onSelectWeek }: { weeks?: number; onSelectWeek?: (label: string, dueDate?: string | null) => void }) {
  const [items, setItems] = useState<WeekItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSaturday, setSelectedSaturday] = useState<string | null>(null)
  const { user } = useAuth()

  const token = useMemo(() => {
    if (typeof window === "undefined") return null
    return localStorage.getItem("authToken")
  }, [])

  useEffect(() => {
    const build = async () => {
      setLoading(true)

      // compute current week's saturday (Saturday as day 6 if Sunday=0)
      const today = new Date()
      const day = today.getDay()
      // distance to Saturday
      const diffToSaturday = (6 - day + 7) % 7
      const thisSaturday = new Date(today)
      thisSaturday.setHours(0, 0, 0, 0)
      thisSaturday.setDate(thisSaturday.getDate() + diffToSaturday)

      // generate week satudays centered at current week
      const half = Math.floor(weeks / 2)
      const satDates: Date[] = []
      for (let i = -half; i < weeks - half; i++) {
        const d = new Date(thisSaturday)
        d.setDate(d.getDate() + i * 7)
        satDates.push(d)
      }

      // fetch user's payments and map by due_date (YYYY-MM-DD)
      let paymentsByDate: Record<string, any> = {}
      try {
        if (token) {
          const res = await fetch(`${API_BASE_URL}/payments`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (res.ok) {
            const data = await res.json().catch(() => null)
            const arr = data?.data ?? []
            arr.forEach((p: any) => {
              if (p.due_date) paymentsByDate[p.due_date] = p
            })
          }
        }
      } catch (err) {
        // ignore and continue with empty payments
      }

      // fetch active schedules (admin-defined start dates)
      let schedules: Array<{ start_date: string; end_date?: string | null }> = []
      try {
        if (token) {
          const r2 = await fetch(`${API_BASE_URL}/schedules`, { headers: { Authorization: `Bearer ${token}` } })
          if (r2.ok) {
            const d2 = await r2.json().catch(() => null)
            schedules = (d2?.data || []).map((s: any) => ({ start_date: s.start_date, end_date: s.end_date ?? null }))
          }
        }
      } catch (err) {
        // ignore
      }

      const list: WeekItem[] = satDates.map((d, idx) => {
        const ymd = d.toISOString().slice(0, 10)
        const label = `Minggu ${getWeekNumberFromIndex(idx, half)}`
        const p = paymentsByDate[ymd]
        // determine if this saturday falls within any schedule window
        const inSchedule = (() => {
          if (!schedules || schedules.length === 0) return false
          for (let i = 0; i < schedules.length; i++) {
            const start = new Date(schedules[i].start_date)
            const endRaw = schedules[i].end_date ?? null
            const end = endRaw ? new Date(endRaw) : null
            if (end) {
              if (d >= start && d <= end) return true
            } else {
              // fallback: treat as active until next schedule start
              const next = schedules[i + 1] ? new Date(schedules[i + 1].start_date) : null
              if (d >= start && (!next || d < next)) return true
            }
          }
          return false
        })()
        return {
          saturday: ymd,
          label,
          status: p?.status ?? null,
          due_date: p?.due_date ?? ymd,
          paymentId: p?.id ?? null,
          amount: p?.amount ?? null,
          inSchedule,
        }
      })

      setItems(list)

      // auto-select current week (if inside schedule)
      const thisYmd = thisSaturday.toISOString().slice(0, 10)
      const found = list.find((it) => it.saturday === thisYmd)
      if (found && found.inSchedule) {
        setSelectedSaturday(found.saturday)
        onSelectWeek?.(found.label, found.due_date)
      }

      setLoading(false)
    }

    void build()
  }, [token, weeks, user])

  function getWeekNumberFromIndex(index: number, half: number) {
    // simple sequential label: current week is 0 -> Minggu 0; we prefer friendly numbering
    const rel = index - half
    if (rel === 0) return "ini"
    if (rel > 0) return `+${rel}`
    return `${rel}`
  }

  // determine color per rules described by user
  function getColor(item: WeekItem) {
    const today = new Date()
    const sat = new Date(item.saturday)
    const isThisWeek = isSameWeek(sat, today)
    const isFuture = sat.getTime() > today.setHours(23, 59, 59, 999)
    const paid = item.status === 'approved' || item.status === 'Lunas' || item.status === 'lunas'
    const pending = item.status === 'pending'
    // if this saturday is not inside any admin-defined schedule, show neutral
    if (item.inSchedule === false || item.inSchedule === undefined) return 'neutral'

    if (paid) return 'green'
    if (isThisWeek) return 'blue'
    if (isFuture) return 'red'
    // past and not paid
    return 'red'
  }

  function isSameWeek(d1: Date, d2: Date) {
    // consider week as Mon-Sun; but our Saturday anchor: check ISO week number roughly
    const startOfWeek = (d: Date) => {
      const copy = new Date(d)
      const day = copy.getDay()
      const diff = (day + 6) % 7 // shift so Monday=0
      copy.setDate(copy.getDate() - diff)
      copy.setHours(0, 0, 0, 0)
      return copy
    }
    const a = startOfWeek(d1).toDateString()
    const b = startOfWeek(d2).toDateString()
    return a === b
  }

  if (loading) return <div className="text-sm text-muted-foreground">Memuat kalender...</div>

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Kalender Mingguan</h3>
        <p className="text-xs text-muted-foreground">Klik Sabtu untuk pilih minggu bayar</p>
      </div>
      <div className="flex gap-3 overflow-x-auto py-2">
        {items.map((it) => {
          const color = getColor(it)
          const circleClass =
            color === 'green'
              ? 'bg-green-600 text-white'
              : color === 'blue'
              ? 'bg-blue-600 text-white'
              : color === 'red'
              ? 'bg-red-600 text-white'
              : 'bg-slate-600 text-white'
          const isSelected = selectedSaturday === it.saturday
          const disabled = it.inSchedule === false || it.inSchedule === undefined

          return (
            <button
              key={it.saturday}
              onClick={() => {
                if (disabled) return
                setSelectedSaturday(it.saturday)
                onSelectWeek?.(it.label, it.due_date)
              }}
              aria-pressed={isSelected}
              aria-disabled={disabled}
              className={`shrink-0 w-28 p-3 rounded-lg border transition-transform duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary/60 ${
                disabled
                  ? 'border-border/60 bg-muted/30 opacity-60 cursor-not-allowed'
                  : isSelected
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border/60 hover:shadow-sm hover:-translate-y-0.5 hover:border-primary/50'
              }`}
              title={disabled ? 'Minggu ini belum dijadwalkan oleh admin' : `Sabtu ${it.saturday} — ${it.status ?? 'Belum ada bukti'}`}>
              <div className="flex items-center justify-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${circleClass}`}>{new Date(it.saturday).getDate()}</div>
              </div>
              <div className="mt-2 text-center text-sm">
                <div className="font-medium">{it.label}</div>
                <div className="text-xs text-muted-foreground">{it.due_date}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
