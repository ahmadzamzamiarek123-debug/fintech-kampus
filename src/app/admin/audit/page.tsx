'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
// Badge not used currently
import { formatDateTime } from '@/lib/utils'
import { formatAuditAction } from '@/lib/audit'

interface AuditLog {
  id: string
  actorName: string
  actorRole: string
  actorIdentifier: string
  action: string
  detail: string
  createdAt: string
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [actionFilter, setActionFilter] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [page, actionFilter])

  async function fetchLogs() {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', '20')
      if (actionFilter) params.append('action', actionFilter)

      const res = await fetch(`/api/admin/audit?${params}`)
      const data = await res.json()
      setLogs(data.data || [])
      setTotalPages(data.totalPages || 1)
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const actionOptions = [
    { value: '', label: 'Semua Actions' },
    { value: 'LOGIN', label: 'Login' },
    { value: 'TOPUP_REQUESTED', label: 'Request Top-up' },
    { value: 'TOPUP_APPROVED', label: 'Top-up Approved' },
    { value: 'TOPUP_REJECTED', label: 'Top-up Rejected' },
    { value: 'PAYMENT_SUCCESS', label: 'Payment Success' },
    { value: 'TRANSFER_SENT', label: 'Transfer Sent' },
    { value: 'TAGIHAN_CREATED', label: 'Tagihan Created' },
  ]

  const roleColors: Record<string, string> = {
    USER: 'bg-blue-100 text-blue-700',
    OPERATOR: 'bg-green-100 text-green-700',
    ADMIN: 'bg-purple-100 text-purple-700',
  }

  interface DetailData {
    amount?: number
    targetUserName?: string
    tagihanTitle?: string
    description?: string
  }

  function parseDetail(detail: string): DetailData {
    try {
      return JSON.parse(detail) as DetailData
    } catch {
      return {}
    }
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-gray-500 mt-1">Riwayat semua aktivitas dalam sistem</p>
      </div>

      {/* Filter */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-end gap-4">
            <div className="w-64">
              <Select
                label="Filter Action"
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value)
                  setPage(1)
                }}
                options={actionOptions}
              />
            </div>
            <Button onClick={fetchLogs}>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Waktu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada log aktivitas
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const detail = parseDetail(log.detail)
                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{log.actorName}</p>
                          <p className="text-xs text-gray-500">{log.actorIdentifier}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${roleColors[log.actorRole]}`}>
                          {log.actorRole}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{formatAuditAction(log.action)}</p>
                        <p className="text-xs text-gray-500 font-mono">{log.action}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                        {detail.amount && <span>Rp {Number(detail.amount).toLocaleString('id-ID')}</span>}
                        {detail.targetUserName && <span className="ml-2">→ {String(detail.targetUserName)}</span>}
                        {detail.tagihanTitle && <span>{String(detail.tagihanTitle)}</span>}
                        {detail.description && <span className="text-gray-400"> ({String(detail.description)})</span>}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Halaman {page} dari {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                ← Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                Next →
              </Button>
            </div>
          </div>
        )}
      </Card>
    </DashboardLayout>
  )
}
