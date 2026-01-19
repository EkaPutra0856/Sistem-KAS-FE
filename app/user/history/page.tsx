"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowDownLeft, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

const history = [
  { id: "KM-2026-002", week: "Minggu 2", date: "16 Jan 2026", amount: 50000, method: "QRIS", status: "Lunas" },
  { id: "KM-2026-001", week: "Minggu 1", date: "09 Jan 2026", amount: 50000, method: "Transfer", status: "Lunas" },
  { id: "KM-2025-052", week: "Minggu 52", date: "26 Des 2025", amount: 50000, method: "Tunai", status: "Lunas" },
]

export default function UserHistory() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Riwayat setoran kas</p>
          <h1 className="text-3xl font-bold">Transaksi kamu</h1>
          <p className="text-muted-foreground mt-2">Lihat bukti, nominal, dan metode pembayaran.</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Unduh CSV
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="grid grid-cols-12 bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground px-4 py-3">
          <span className="col-span-3">Tagihan</span>
          <span className="col-span-2">Tanggal</span>
          <span className="col-span-2">Nominal</span>
          <span className="col-span-2">Metode</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-1 text-right">Aksi</span>
        </div>
        <div className="divide-y divide-border/80">
          {history.map((item) => (
            <div key={item.id} className="grid grid-cols-12 items-center px-4 py-3 text-sm">
              <div className="col-span-3">
                <p className="font-semibold">{item.week}</p>
                <p className="text-xs text-muted-foreground">ID {item.id}</p>
              </div>
              <div className="col-span-2">{item.date}</div>
              <div className="col-span-2 font-semibold">Rp{item.amount.toLocaleString("id-ID")}</div>
              <div className="col-span-2 flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-primary" />
                {item.method}
              </div>
              <div className="col-span-2">
                <Badge variant="outline">{item.status}</Badge>
              </div>
              <div className="col-span-1 text-right">
                <Button variant="ghost" size="sm" className="text-xs">Bukti</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
