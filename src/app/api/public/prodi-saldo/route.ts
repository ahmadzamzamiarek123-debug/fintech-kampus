import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/public/prodi-saldo - Public endpoint for prodi saldo transparency
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const prodi = searchParams.get('prodi')

    if (!prodi) {
      return NextResponse.json(
        { success: false, error: 'Parameter prodi diperlukan' },
        { status: 400 }
      )
    }

    // Get or calculate prodi saldo
    let prodiSaldo = await prisma.prodiSaldo.findUnique({
      where: { prodi },
    })

    // Get total from successful payments
    const successfulPayments = await prisma.pembayaran.findMany({
      where: {
        status: 'SUCCESS',
        tagihan: { prodiTarget: prodi },
      },
      include: { tagihan: { select: { nominal: true } } },
    })

    const totalIncome = successfulPayments.reduce((sum, p) => sum + (p.tagihan?.nominal || 0), 0)

    // Get total expenses
    const expenses = await prisma.prodiPengeluaran.aggregate({
      where: { prodi },
      _sum: { amount: true },
    })

    const totalExpense = expenses._sum.amount || 0

    // Get recent expenses for transparency
    const recentExpenses = await prisma.prodiPengeluaran.findMany({
      where: { prodi },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        amount: true,
        description: true,
        createdAt: true,
      },
    })

    // Get this month's data
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const monthlyPayments = await prisma.pembayaran.findMany({
      where: {
        status: 'SUCCESS',
        paidAt: { gte: startOfMonth },
        tagihan: { prodiTarget: prodi },
      },
      include: { tagihan: { select: { nominal: true } } },
    })

    const monthlyIncome = monthlyPayments.reduce((sum, p) => sum + (p.tagihan?.nominal || 0), 0)

    const monthlyExpenses = await prisma.prodiPengeluaran.aggregate({
      where: {
        prodi,
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    })

    const monthlyExpense = monthlyExpenses._sum.amount || 0

    return NextResponse.json({
      success: true,
      data: {
        prodi,
        totalIncome,
        totalExpense,
        currentBalance: prodiSaldo?.totalBalance || (totalIncome - totalExpense),
        monthlyIncome,
        monthlyExpense,
        recentExpenses,
      },
    })
  } catch (error) {
    console.error('Error fetching prodi saldo:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
