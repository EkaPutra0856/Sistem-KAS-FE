"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, User, LogOut, Settings, Users, Shield, Wallet2, History, ClipboardList, CalendarClock } from "lucide-react"
import { useState } from "react"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  if (!user) return null

  // Menu items based on role
  const getMenuItems = () => {
    if (user.role === "admin") {
      return [
        { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/payments", label: "Setoran Masuk", icon: Wallet2 },
        { href: "/admin/schedules", label: "Jadwal Bayar", icon: CalendarClock },
        { href: "/admin/datauser", label: "Anggota", icon: Users },
        { href: "/admin/profile", label: "Profil", icon: User },
      ]
    }

    if (user.role === "super-admin") {
      return [
        { href: "/super-admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/super-admin/admin-management", label: "Kelola Admin", icon: Shield },
        { href: "/super-admin/datauser", label: "Anggota", icon: Users },
        { href: "/super-admin/payments", label: "Laporan Setoran", icon: Wallet2 },
        { href: "/super-admin/profile", label: "Profil", icon: User },
      ]
    }

    // default: user
    return [
      { href: "/user/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/user/payments", label: "Pembayaran", icon: Wallet2 },
      { href: "/user/schedules", label: "Jadwal Bayar", icon: CalendarClock },
      { href: "/user/history", label: "Riwayat", icon: History },
      { href: "/user/profile", label: "Profile", icon: User },
    ]
  }

  const menuItems = getMenuItems()

  const isActive = (href: string) => pathname.startsWith(href)

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border w-64 transform transition-transform duration-300 z-40 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-6 flex flex-col h-full">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-sidebar-primary">Kas<span className="text-primary">Mingguan</span></h1>
          </div>

          {/* User Info */}
          <div className="mb-6 p-4 bg-sidebar-accent/10 rounded-lg border border-sidebar-border">
            <img
              src={user.avatar || "/placeholder.svg"}
              alt={user.name}
              className="w-10 h-10 rounded-full mb-2 object-cover"
            />
            <p className="text-sm font-semibold text-sidebar-foreground">{user.name}</p>
            <p className="text-xs text-sidebar-accent-foreground/70 capitalize mt-1">{user.role.replace("-", " ")}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }`}
                  onClick={() => onClose()}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => {
              logout()
              window.location.href = "/"
            }}
          >
            <LogOut className="w-5 h-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={onClose} />}
    </>
  )
}
