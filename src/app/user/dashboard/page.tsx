'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { formatRupiah } from '@/lib/utils'
import Link from 'next/link'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface FinanceData {
  chartData: Array<{
    date: string
    topup: number
    payment: number
    transfer_out: number
    transfer_in: number
  }>
  totals: {
    topup: number
    payment: number
    transfer_out: number
    transfer_in: number
  }
}

interface ProdiSaldo {
  currentBalance: number
  monthlyIncome: number
  monthlyExpense: number
}

export default function UserDashboard() {
  const { data: session } = useSession()
  const [balance, setBalance] = useState(0)
  const [financeData, setFinanceData] = useState<FinanceData | null>(null)
  const [prodiSaldo, setProdiSaldo] = useState<ProdiSaldo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [balanceRes, financeRes, prodiRes] = await Promise.all([
          fetch('/api/user/balance'),
          fetch('/api/user/finance-summary?period=month'),
          session?.user?.prodi 
            ? fetch(`/api/public/prodi-saldo?prodi=${session.user.prodi}`)
            : Promise.resolve(null),
        ])

        const balanceData = await balanceRes.json()
        const financeRaw = await financeRes.json()

        setBalance(balanceData.data?.balance || 0)
        if (financeRaw.success) setFinanceData(financeRaw.data)

        if (prodiRes) {
          const prodiData = await prodiRes.json()
          if (prodiData.success) setProdiSaldo(prodiData.data)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user) fetchData()
  }, [session])

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <div className="h-8 bg-[var(--bg-tertiary)] rounded w-1/3 animate-pulse"></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-[var(--bg-tertiary)] rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
          Selamat datang, {session?.user?.name?.split(' ')[0]}
        </h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">
          {session?.user?.prodi} • Dashboard Mahasiswa
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {/* Saldo */}
        <div className="stats-card col-span-2 sm:col-span-1">
          <p className="text-sm text-[var(--text-muted)]">Saldo Anda</p>
          <p className="stats-card-value text-[var(--usg-accent)]">
            {formatRupiah(balance)}
          </p>
        </div>

        {/* Top-up */}
        <div className="stats-card">
          <p className="text-sm text-[var(--text-muted)]">Total Top-up</p>
          <p className="stats-card-value text-[var(--color-success)]">
            {formatRupiah(financeData?.totals.topup || 0)}
          </p>
        </div>

        {/* Pembayaran */}
        <div className="stats-card">
          <p className="text-sm text-[var(--text-muted)]">Total Bayar</p>
          <p className="stats-card-value text-[var(--color-danger)]">
            {formatRupiah(financeData?.totals.payment || 0)}
          </p>
        </div>

        {/* Saldo Prodi */}
        {prodiSaldo && (
          <div className="stats-card">
            <p className="text-sm text-[var(--text-muted)]">Saldo Prodi</p>
            <p className="stats-card-value">
              {formatRupiah(prodiSaldo.currentBalance)}
            </p>
          </div>
        )}
      </div>

      {/* Chart */}
      {financeData && financeData.chartData.length > 0 && (
        <div className="chart-container mb-6">
          <h3 className="chart-title">Statistik Keuangan 30 Hari Terakhir</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={financeData.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  stroke="var(--border-secondary)"
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  stroke="var(--border-secondary)"
                  tickFormatter={(v) => `${(v/1000)}k`}
                />
                <Tooltip 
                  contentStyle={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                  }}
                  formatter={(value: number) => formatRupiah(value)}
                />
                <Line 
                  type="monotone" 
                  dataKey="topup" 
                  stroke="var(--color-success)" 
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-success)', r: 3 }}
                  name="Top-up"
                />
                <Line 
                  type="monotone" 
                  dataKey="payment" 
                  stroke="var(--color-danger)" 
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-danger)', r: 3 }}
                  name="Bayar"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
        Aksi Cepat
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Link href="/user/bayar">
          <div className="card hover:border-[var(--usg-primary)] transition-colors cursor-pointer">
            <div className="card-body flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--usg-primary)] bg-opacity-10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--usg-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)]">Bayar Tagihan</p>
                <p className="text-xs text-[var(--text-muted)]">Lihat & bayar tagihan</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/user/transfer">
          <div className="card hover:border-[var(--usg-primary)] transition-colors cursor-pointer">
            <div className="card-body flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-info)] bg-opacity-10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--color-info)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)]">Transfer</p>
                <p className="text-xs text-[var(--text-muted)]">Kirim saldo ke teman</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/user/saldo-prodi">
          <div className="card hover:border-[var(--usg-primary)] transition-colors cursor-pointer">
            <div className="card-body flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--usg-accent)] bg-opacity-10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--usg-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)]">Transparansi Prodi</p>
                <p className="text-xs text-[var(--text-muted)]">Lihat saldo prodi</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </DashboardLayout>
  )
}
