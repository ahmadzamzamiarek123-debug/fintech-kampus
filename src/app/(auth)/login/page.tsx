'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export default function LoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Initialize theme on mount
  useEffect(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (!stored) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.classList.toggle('dark', prefersDark)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        identifier,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('NIM/ID atau password salah')
      } else {
        router.push('/user/dashboard')
        router.refresh()
      }
    } catch {
      setError('Terjadi kesalahan. Coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex">
      {/* Theme Toggle - Top Right */}
      <div className="fixed top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Left Side - Mascot (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-8 bg-[var(--bg-primary)]">
        <div className="max-w-md text-center">
          <Image 
            src="/maskot-usg.png" 
            alt="Maskot USG" 
            width={320} 
            height={320}
            className="mx-auto mb-6 object-contain"
            priority
          />
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            Selamat Datang
          </h2>
          <p className="text-[var(--text-secondary)]">
            Sistem Keuangan Kampus Universitas Sunan Gresik
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-sm">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Image 
                src="/logo-usg.png" 
                alt="USG Logo" 
                width={80} 
                height={80}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
              Fintech USG
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Masuk ke akun Anda
            </p>
          </div>

          {/* Login Card */}
          <div className="card">
            <div className="card-body">
              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 text-sm text-center rounded-md bg-[var(--color-danger-light)] text-[var(--color-danger)]">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="identifier" className="input-label">
                    NIM / ID Operator
                  </label>
                  <input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Contoh: 20230001"
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="input-label">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="input"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-full mt-6"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Memproses...
                    </span>
                  ) : 'Masuk'}
                </button>
              </form>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-[var(--text-muted)] mt-6">
            © {new Date().getFullYear()} Universitas Sunan Gresik
          </p>
        </div>
      </div>
    </div>
  )
}
