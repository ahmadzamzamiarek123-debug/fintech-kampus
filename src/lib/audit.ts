import { prisma } from './prisma'
import type { Role } from '@/types'

type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'TOPUP_REQUESTED'
  | 'TOPUP_APPROVED'
  | 'TOPUP_REJECTED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'TRANSFER_SENT'
  | 'TRANSFER_RECEIVED'
  | 'TAGIHAN_CREATED'
  | 'TAGIHAN_UPDATED'
  | 'TAGIHAN_DELETED'
  | 'TAGIHAN_STATUS_CHANGED'
  | 'OPERATOR_CREATED'
  | 'OPERATOR_STATUS_CHANGED'
  | 'USER_STATUS_CHANGED'
  | 'USER_PRODI_CHANGED'
  | 'USER_PASSWORD_RESET'
  | 'PENGELUARAN_CREATED'
  | 'PROFILE_UPDATED'
  | 'PASSWORD_CHANGED'
  | 'PIN_CHANGED'

interface AuditDetail {
  targetUserId?: string
  targetUserName?: string
  amount?: number
  tagihanId?: string
  tagihanTitle?: string
  ipAddress?: string
  description?: string
  [key: string]: unknown
}

export async function createAuditLog(
  actorId: string,
  action: AuditAction,
  detail: AuditDetail = {}
) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        action,
        detail: JSON.stringify(detail),
        ipAddress: detail.ipAddress || null,
      },
    })
  } catch (error) {
    // Log error but don't fail the main operation
    console.error('Failed to create audit log:', error)
  }
}

// Utility to format audit log for display
export function formatAuditAction(action: string): string {
  const actionMap: Record<string, string> = {
    LOGIN: 'Login ke sistem',
    LOGOUT: 'Logout dari sistem',
    TOPUP_REQUESTED: 'Mengajukan top-up saldo',
    TOPUP_APPROVED: 'Top-up disetujui',
    TOPUP_REJECTED: 'Top-up ditolak',
    PAYMENT_SUCCESS: 'Pembayaran berhasil',
    PAYMENT_FAILED: 'Pembayaran gagal',
    TRANSFER_SENT: 'Transfer terkirim',
    TRANSFER_RECEIVED: 'Transfer diterima',
    TAGIHAN_CREATED: 'Tagihan dibuat',
    TAGIHAN_UPDATED: 'Tagihan diperbarui',
    OPERATOR_CREATED: 'Operator baru ditambahkan',
    PROFILE_UPDATED: 'Profil diperbarui',
    PASSWORD_CHANGED: 'Password diubah',
    PIN_CHANGED: 'PIN diubah',
  }
  return actionMap[action] || action
}
