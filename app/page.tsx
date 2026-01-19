import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, CreditCard, Wallet2, ShieldCheck, Clock3, Zap } from "lucide-react"

export const metadata = {
  title: "KasMingguan | Bayar Uang Kas Lebih Ringkas",
  description: "Atur, setor, dan pantau uang kas mingguan komunitas atau kelas dengan mudah.",
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-muted/40">
      {/* Navigation */}
      <nav className="border-b border-border/50 sticky top-0 z-40 bg-background/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold tracking-tight">Kas<span className="text-primary">Mingguan</span></div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Masuk</Button>
            </Link>
            <Link href="/register">
              <Button className="gap-2">
                Mulai Bayar <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-[1.2fr_0.8fr] gap-10 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
            Bayar kas mingguan lebih tertib
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-balance">
            Kelola uang kas komunitas <span className="text-primary">tanpa repot</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Lihat tagihan mingguan, setor via QRIS/transfer, dan pantau riwayat setoran dalam satu dasbor yang rapi.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/login">
              <Button size="lg" className="gap-2">
                Masuk & Bayar <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline">
                Daftar anggota
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm text-muted-foreground">
            {["Jadwal mingguan", "Notifikasi jatuh tempo", "Pembayaran realtime", "Riwayat transparan"].map((item) => (
              <div key={item} className="flex items-center gap-2 bg-card/60 border border-border/60 rounded-lg px-3 py-2">
                <span className="text-primary">●</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tagihan minggu ini</p>
              <p className="text-3xl font-bold mt-1">Rp75.000</p>
            </div>
            <div className="rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-semibold">Jatuh tempo 3 hari</div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <CreditCard className="w-4 h-4 text-primary" />
              <div>
                <p className="font-medium">Metode cepat</p>
                <p className="text-muted-foreground">QRIS • Transfer bank • Tunai tercatat</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock3 className="w-4 h-4 text-primary" />
              <div>
                <p className="font-medium">Pengingat otomatis</p>
                <p className="text-muted-foreground">Notifikasi setiap Sabtu pagi</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <div>
                <p className="font-medium">Bukti tercatat</p>
                <p className="text-muted-foreground">Riwayat setoran tersimpan & dapat diunduh</p>
              </div>
            </div>
          </div>
          <Button className="w-full gap-2" size="lg">
            Bayar sekarang
            <ArrowRight className="w-4 h-4" />
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Cocok untuk kas kelas, organisasi, RT, tim olahraga, dan komunitas hobi.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
        <div className="text-center space-y-3">
          <p className="text-sm font-semibold text-primary">Fitur utama</p>
          <h2 className="text-3xl font-bold">Semua yang dibutuhkan bendahara & anggota</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Transparansi aliran kas dengan tampilan sederhana. Anggota tahu apa yang harus dibayar, bendahara mudah
            menagih, semua riwayat tercatat.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[{
            title: "Tagihan mingguan rapi",
            desc: "Setoran terstruktur per minggu dengan status lunas/tunggakan yang jelas.",
            icon: Wallet2,
          },
          {
            title: "Pembayaran multi-metode",
            desc: "QRIS, transfer bank, atau tunai tetap tercatat dengan bukti unggahan.",
            icon: CreditCard,
          },
          {
            title: "Notifikasi & jadwal",
            desc: "Pengingat otomatis sebelum jatuh tempo dan rekap bulanan yang siap unduh.",
            icon: Zap,
          }].map(({ title, desc, icon: Icon }) => (
            <div key={title} className="border border-border rounded-xl p-6 bg-card shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-[0.6fr_1.4fr] gap-10 items-start">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-primary">Alur anggota</p>
            <h3 className="text-3xl font-bold">Bayar kas dalam 3 langkah</h3>
            <p className="text-muted-foreground">
              Setelah login, anggota langsung melihat tagihan aktif, pilih metode bayar, dan dapat bukti otomatis.
            </p>
            <Link href="/login">
              <Button className="mt-2">Masuk sebagai anggota</Button>
            </Link>
          </div>

          <div className="space-y-4">
            {["Cek tagihan minggu ini", "Pilih metode (QRIS/transfer/tunai)", "Unggah bukti & tandai lunas"].map(
              (step, idx) => (
                <div key={step} className="flex gap-4 p-4 border border-border rounded-xl bg-card">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{step}</p>
                    <p className="text-sm text-muted-foreground">
                      {idx === 0 && "Tagihan ditata per minggu dengan estimasi jatuh tempo."}
                      {idx === 1 && "Metode fleksibel, tetap tercatat dan terverifikasi."}
                      {idx === 2 && "Riwayat otomatis tersimpan dan dapat diunduh kapan saja."}
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="bg-primary text-primary-foreground rounded-2xl px-6 sm:px-12 py-12 space-y-4 shadow-lg">
          <h2 className="text-3xl font-bold">Mulai rapikan kas minggu ini</h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto">
            Ajak seluruh anggota bergabung, tetapkan nominal kas, dan biarkan pengingat otomatis bekerja.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="text-primary">
                Daftarkan komunitas
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                Bayar sebagai anggota
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
