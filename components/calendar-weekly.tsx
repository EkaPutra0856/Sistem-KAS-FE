"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api"

type WeekItem = {
  payDate: string // YYYY-MM-DD
  label: string
  dayName: string
  status?: string | null
  due_date?: string | null
  paymentId?: number | null
  amount?: number | null
  inSchedule?: boolean
}

type Schedule = {
  start_date: string
  end_date?: string | null
  pay_day_of_week?: number | null
}

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]

export default function CalendarWeekly({ weeks = 12, onSelectWeek }: { weeks?: number; onSelectWeek?: (label: string, dueDate?: string | null) => void }) {
  const [items, setItems] = useState<WeekItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const { user } = useAuth()
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const pageSize = 12

  const token = useMemo(() => {
    if (typeof window === "undefined") return null
    return localStorage.getItem("authToken")
  }, [])

  useEffect(() => {
    const build = async () => {
      setLoading(true)

      const today = new Date()
      today.setHours(0, 0, 0, 0)

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
      let schedules: Schedule[] = []
      try {
        if (token) {
          const r2 = await fetch(`${API_BASE_URL}/schedules`, { headers: { Authorization: `Bearer ${token}` } })
          if (r2.ok) {
            const d2 = await r2.json().catch(() => null)
            schedules = (d2?.data || []).map((s: any) => ({
              start_date: s.start_date,
              end_date: s.end_date ?? null,
              pay_day_of_week: typeof s.pay_day_of_week === 'number' ? s.pay_day_of_week : 5,
            }))
          }
        }
      } catch (err) {
        // ignore
      }

      const resolveScheduleForDate = (target: Date): Schedule | null => {
        if (!schedules || schedules.length === 0) return null
        for (let i = 0; i < schedules.length; i++) {
          const start = new Date(schedules[i].start_date)
          const endRaw = schedules[i].end_date ?? null
          const end = endRaw ? new Date(endRaw) : null
          if (end) {
            if (target >= start && target <= end) return schedules[i]
          } else {
            const next = schedules[i + 1] ? new Date(schedules[i + 1].start_date) : null
            if (target >= start && (!next || target < next)) return schedules[i]
          }
        }
        return null
      }

      const alignToDayOfWeek = (base: Date, dow: number) => {
        const d = new Date(base)
        const diff = dow - d.getDay()
        d.setDate(d.getDate() + diff)
        return d
      }

      const defaultPayDay = schedules[0]?.pay_day_of_week ?? 5
      const activeSchedule = resolveScheduleForDate(today)
      const activePayDay = activeSchedule?.pay_day_of_week ?? defaultPayDay

      const day = today.getDay()
      const diffToPayDay = (activePayDay - day + 7) % 7
      const thisPayDate = new Date(today)
      thisPayDate.setDate(thisPayDate.getDate() + diffToPayDay)

      const half = Math.floor(weeks / 2)
      const payDates: Date[] = []
      for (let i = -half; i < weeks - half; i++) {
        const base = new Date(thisPayDate)
        base.setDate(base.getDate() + i * 7)
        const scheduleForBase = resolveScheduleForDate(base) ?? activeSchedule
        const dow = scheduleForBase?.pay_day_of_week ?? defaultPayDay
        const aligned = alignToDayOfWeek(base, dow)
        payDates.push(aligned)
      }

      const list: WeekItem[] = payDates.map((d, idx) => {
        const ymd = d.toISOString().slice(0, 10)
        const label = `Minggu ${getWeekNumberFromIndex(idx, half)}`
        const p = paymentsByDate[ymd]
        const schedule = resolveScheduleForDate(d)
        const payDay = schedule?.pay_day_of_week ?? defaultPayDay
        const dayName = DAY_NAMES[payDay] ?? DAY_NAMES[defaultPayDay]
        const inSchedule = Boolean(schedule)
        return {
          payDate: ymd,
          label,
          status: p?.status ?? null,
          due_date: p?.due_date ?? ymd,
          paymentId: p?.id ?? null,
          amount: p?.amount ?? null,
          dayName,
          inSchedule,
        }
      })

      setItems(list)

      // auto-select current week (if inside schedule)
      const thisYmd = thisPayDate.toISOString().slice(0, 10)
      const found = list.find((it) => it.payDate === thisYmd)
      if (found && found.inSchedule) {
        const foundIdx = list.findIndex((it) => it.payDate === found.payDate)
        if (foundIdx >= 0) {
          const targetIdx = Math.max(0, foundIdx - 2) // tampilkan mulai 2 minggu sebelum
          setPage(Math.floor(targetIdx / pageSize))
        }
        setSelectedDate(found.payDate)
        onSelectWeek?.(found.label, found.due_date)
      } else {
        setPage(0)
      }

      setLoading(false)
    }

    void build()
  }, [token, weeks, user])

  // keep page within bounds when data changes
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
    if (page > totalPages - 1) {
      setPage(Math.max(0, totalPages - 1))
    }
  }, [items.length, page, pageSize])

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
    const sat = new Date(item.payDate)
    const isThisWeek = isSameWeek(sat, today)
    const isFuture = sat.getTime() > today.setHours(23, 59, 59, 999)
    const paid = item.status === 'approved' || item.status === 'Lunas' || item.status === 'lunas'
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

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const start = page * pageSize
  const currentItems = items.slice(start, start + pageSize)

  const goPage = (next: number) => {
    const clamped = Math.max(0, Math.min(totalPages - 1, next))
    setPage(clamped)
    // reset scroll to start for the current page for consistent UX
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ left: 0, behavior: "smooth" })
    })
  }

  return (
    <div className="space-y-3 w-full max-w-full">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Kalender Mingguan</h3>
          <p className="text-xs text-muted-foreground">Klik hari bayar untuk pilih minggu</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goPage(page - 1)}
            className="rounded border px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
            aria-label="Geser ke kiri"
            disabled={page === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-muted-foreground">Hal {page + 1} / {totalPages}</span>
          <button
            type="button"
            onClick={() => goPage(page + 1)}
            className="rounded border px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
            aria-label="Geser ke kanan"
            disabled={page >= totalPages - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="grid w-full max-w-full grid-flow-col auto-cols-[minmax(90px,1fr)] sm:auto-cols-[minmax(100px,1fr)] md:auto-cols-[minmax(110px,1fr)] lg:auto-cols-[minmax(120px,1fr)] gap-2 overflow-x-auto py-2 snap-x snap-mandatory"
      >
        {currentItems.map((it) => {
          const color = getColor(it)
          const circleClass =
            color === 'green'
              ? 'bg-green-600 text-white'
              : color === 'blue'
              ? 'bg-blue-600 text-white'
              : color === 'red'
              ? 'bg-red-600 text-white'
              : 'bg-slate-600 text-white'
          const isSelected = selectedDate === it.payDate
          const disabled = it.inSchedule === false || it.inSchedule === undefined

          return (
            <button
              key={it.payDate}
              onClick={() => {
                if (disabled) return
                const globalIdx = items.findIndex((x) => x.payDate === it.payDate)
                if (globalIdx >= 0) goPage(Math.floor(globalIdx / pageSize))
                setSelectedDate(it.payDate)
                onSelectWeek?.(it.label, it.due_date)
              }}
              aria-pressed={isSelected}
              aria-disabled={disabled}
              className={`shrink-0 w-24 md:w-24 p-2.5 sm:p-3 rounded-lg border transition-transform duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary/60 snap-start ${
                disabled
                  ? 'border-border/60 bg-muted/30 opacity-60 cursor-not-allowed'
                  : isSelected
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border/60 hover:shadow-sm hover:-translate-y-0.5 hover:border-primary/50'
              }`}
              title={disabled ? 'Minggu ini belum dijadwalkan oleh admin' : `${it.dayName} ${it.payDate} — ${it.status ?? 'Belum ada bukti'}`}>
              <div className="flex items-center justify-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${circleClass}`}>{new Date(it.payDate).getDate()}</div>
              </div>
              <div className="mt-2 text-center text-sm">
                <div className="font-medium">{it.label}</div>
                <div className="text-xs text-muted-foreground">{it.dayName} • {it.due_date}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
