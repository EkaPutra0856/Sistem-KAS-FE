"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"

export type UserRole = "user" | "admin" | "super-admin"

interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<User>
  updateProfilePhoto: (file: File, previewUrl?: string) => Promise<User>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api"

  // Restore user from localStorage on mount
  useEffect(() => {
    const restore = async () => {
      const storedToken = localStorage.getItem("authToken")
      const storedUser = localStorage.getItem("authUser")

      if (storedToken) {
        try {
          const res = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          })

          if (res.ok) {
            const data = await res.json().catch(() => null)
            if (data?.user) {
              const remoteUser: User = {
                id: data.user.id,
                email: data.user.email,
                name: data.user.name,
                role: data.user.role as UserRole,
                avatar: data.user.profile_photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.email}`,
              }
              setUser(remoteUser)
              localStorage.setItem('authUser', JSON.stringify(remoteUser))
              setIsLoading(false)
              return
            }
          }
        } catch (err) {
          console.error('Failed to fetch /auth/me', err)
        }
      }

      // Fallback to stored user if any
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser))
        } catch (error) {
          console.error("Failed to parse stored user:", error)
        }
      }

      setIsLoading(false)
    }

    restore()
  }, [])

  const login = async (email: string, password: string): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      const message = errorBody?.message || "Login failed"
      throw new Error(message)
    }

    const data = await response.json()

    const authenticatedUser: User = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      role: data.user.role as UserRole,
      avatar: data.user.profile_photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.email}`,
    }

    setUser(authenticatedUser)
    localStorage.setItem("authUser", JSON.stringify(authenticatedUser))
    localStorage.setItem("authToken", data.token)

    return authenticatedUser
  }

  const register = async (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string,
  ): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password, password_confirmation: passwordConfirmation }),
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      const message = errorBody?.message || Object.values(errorBody?.errors || {})?.[0]?.[0] || "Register failed"
      throw new Error(message)
    }

    const data = await response.json()

    const newUser: User = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      role: data.user.role as UserRole,
      avatar: data.user.profile_photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.email}`,
    }

    setUser(newUser)
    localStorage.setItem("authUser", JSON.stringify(newUser))
    localStorage.setItem("authToken", data.token)

    return newUser
  }

  const updateProfilePhoto = async (file: File, previewUrl?: string): Promise<User> => {
    const storedToken = localStorage.getItem("authToken")
    if (!storedToken) throw new Error("Not authenticated")

    // Optimistic update: set preview avatar immediately if provided
    if (previewUrl && user) {
      const optimistic: User = { ...user, avatar: previewUrl }
      setUser(optimistic)
      localStorage.setItem('authUser', JSON.stringify(optimistic))
    }

    const form = new FormData()
    form.append('photo', file)

    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${storedToken}`,
      },
      body: form,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.message || 'Failed to upload photo')
    }

    const data = await res.json()

    // If backend returned a stored photo URL, use it. Otherwise keep optimistic avatar (if any) or fallback.
    const returnedUrl: string | null = data?.user?.profile_photo_url ?? null
    const finalAvatar = returnedUrl || (user ? user.avatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.email}`)

    const updated: User = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      role: data.user.role as UserRole,
      avatar: finalAvatar,
    }

    setUser(updated)
    localStorage.setItem('authUser', JSON.stringify(updated))
    return updated
  }

  const logout = async (): Promise<void> => {
    const storedToken = localStorage.getItem("authToken")

    if (storedToken) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      }).catch(() => undefined)
    }

    setUser(null)
    localStorage.removeItem("authUser")
    localStorage.removeItem("authToken")
  }

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    updateProfilePhoto,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
