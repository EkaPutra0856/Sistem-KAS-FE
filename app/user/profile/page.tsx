"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, Save, Eye, EyeOff } from "lucide-react"
import SuccessToast from "@/components/success-toast"

export default function UserProfile() {
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
    phone: user?.phone || "",
    password: "",
    newPassword: "",
  })

  const handleSave = () => {
    // Mock save
    console.log("Saving profile:", formData)
    setIsEditing(false)
  }

  return (
    <>
      <SuccessToast open={showSuccess} onClose={() => setShowSuccess(false)} message="Foto profil berhasil diperbarui" />
      {/* Profile Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Avatar Section */}
        <Card className="p-6 lg:col-span-1">
          <h3 className="font-semibold mb-4">Avatar</h3>
          <div className="space-y-4">
              <img
                src={preview || user?.avatar || "/placeholder.svg"}
                alt={user?.name}
                className="w-full aspect-square rounded-lg object-cover"
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
                  id="avatar-upload"
                />
                <label htmlFor="avatar-upload" className="flex-1">
                  <Button asChild variant="outline" size="sm" className="w-full gap-2 bg-transparent">
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
                          // If backend returned an avatar URL, use it; otherwise keep optimistic preview
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
          </div>
        </Card>

        {/* Profile Form */}
        <Card className="p-6 lg:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold">Personal Information</h3>
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

            {/* WhatsApp */}
            <div>
              <label className="text-sm font-medium mb-2 block">WhatsApp</label>
              {isEditing ? (
                <Input
                  value={formData.phone}
                  placeholder="e.g. 62812xxxx"
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              ) : (
                <p className="text-sm text-muted-foreground">{formData.phone || "Belum diisi"}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Nomor ini dipakai untuk verifikasi dan pengingat WA.</p>
            </div>

            {isEditing && (
              <>
                {/* Current Password */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Current Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter current password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

                {/* New Password */}
                <div>
                  <label className="text-sm font-medium mb-2 block">New Password</label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password (optional)"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  />
                </div>
              </>
            )}

            {isEditing && (
              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Account Info */}
      <Card className="mt-6 p-6">
        <h3 className="font-semibold mb-4">Account Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Role</p>
            <p className="font-medium capitalize">{user?.role.replace("-", " ")}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Member Since</p>
            <p className="font-medium">January 2024</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Account ID</p>
            <p className="font-medium font-mono">{user?.id}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Last Updated</p>
            <p className="font-medium">Today at 2:30 PM</p>
          </div>
        </div>
      </Card>
    </>
  )
}
