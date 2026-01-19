"use client"

import { useAuth } from "@/lib/auth-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, Save, Badge } from "lucide-react"
import { useState } from "react"
import { Upload } from "lucide-react"
import SuccessToast from "@/components/success-toast"

export default function AdminProfile() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { updateProfilePhoto } = useAuth()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    department: "IT Operations",
    currentPassword: "",
    newPassword: "",
  })

  const handleSave = () => {
    console.log("Saving admin profile:", formData)
    setIsEditing(false)
  }

  return (
    <>
      <SuccessToast open={showSuccess} onClose={() => setShowSuccess(false)} message="Foto profil berhasil diperbarui" />
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Profil Bendahara</h1>
        <p className="text-muted-foreground">Kelola akun bendahara dan preferensi penagihan kas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Avatar */}
        <Card className="p-6 lg:col-span-1">
          <h3 className="font-semibold mb-4">Profile Picture</h3>
          <img
            src={preview || user?.avatar || "/placeholder.svg"}
            alt={user?.name}
            className="w-full aspect-square rounded-lg object-cover mb-4"
          />
          <div className="flex gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0] || null
                setSelectedFile(f)
                setPreview(f ? URL.createObjectURL(f) : null)
              }}
              className="hidden"
              id="admin-avatar-upload"
            />
            <label htmlFor="admin-avatar-upload" className="flex-1">
              <Button asChild variant="outline" size="sm" className="w-full bg-transparent">
                <span>
                  <Upload className="w-4 h-4" />
                  Choose
                </span>
              </Button>
            </label>
            <Button
              onClick={async () => {
                if (!selectedFile) return
                try {
                  const updated = await updateProfilePhoto(selectedFile, preview || undefined)
                  setSelectedFile(null)
                  if (updated?.avatar) {
                    setPreview(updated.avatar)
                  }
                  setShowSuccess(true)
                } catch (err) {
                  console.error(err)
                }
              }}
              disabled={!selectedFile}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload
            </Button>
          </div>
        </Card>

        {/* Profile Info */}
        <Card className="p-6 lg:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold">Informasi personal</h3>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? "Cancel" : "Edit"}
            </Button>
          </div>

          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="text-sm font-medium mb-2 block">Full Name</label>
              {isEditing ? (
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              ) : (
                <p className="text-sm text-muted-foreground">{formData.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              {isEditing ? (
                <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              ) : (
                <p className="text-sm text-muted-foreground">{formData.email}</p>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="text-sm font-medium mb-2 block">Divisi</label>
              {isEditing ? (
                <Input value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
              ) : (
                <p className="text-sm text-muted-foreground">{formData.department}</p>
              )}
            </div>

            {isEditing && (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">Current Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter current password"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">New Password</label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  />
                </div>

                <Button onClick={handleSave} className="gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Role & Permissions */}
      <Card className="mt-6 p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Badge className="w-5 h-5" />
          Role & Permissions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Role</p>
            <p className="font-medium text-lg">Admin IT</p>
            <p className="text-xs text-muted-foreground mt-2">System administration and monitoring</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Permissions</p>
            <ul className="text-sm space-y-1">
              <li className="flex gap-2">
                <span className="text-green-600">✓</span> View System Logs
              </li>
              <li className="flex gap-2">
                <span className="text-green-600">✓</span> Manage Users
              </li>
              <li className="flex gap-2">
                <span className="text-green-600">✓</span> Monitor Systems
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Account Information */}
      <Card className="mt-6 p-6">
        <h3 className="font-semibold mb-4">Informasi akun</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Admin ID</p>
            <p className="font-mono">{user?.id}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Member Since</p>
            <p className="font-medium">January 2023</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Last Login</p>
            <p className="font-medium">Today at 2:30 PM</p>
          </div>
        </div>
      </Card>
    </>
  )
}
