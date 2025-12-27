import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/rbac";

// GET /api/operator/mahasiswa - Get users in operator's prodi+angkatan scope
export async function GET() {
  const { error, user: operator } = await withAuth("OPERATOR");

  if (error) return error;

  try {
    if (!operator?.prodi || !operator?.angkatan) {
      return NextResponse.json(
        {
          success: false,
          error: "Operator tidak memiliki scope prodi/angkatan",
        },
        { status: 400 }
      );
    }

    // Get start of current week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    // Get users in operator's scope
    const users = await prisma.user.findMany({
      where: {
        role: "USER",
        prodi: operator.prodi,
        angkatan: operator.angkatan,
        deletedAt: null,
      },
      include: {
        balance: true,
        pembayaran: {
          where: {
            createdAt: { gte: startOfWeek },
            status: "SUCCESS",
          },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    });

    const result = users.map((u) => ({
      id: u.id,
      identifier: u.identifier,
      name: u.name,
      prodi: u.prodi,
      angkatan: u.angkatan,
      isActive: u.isActive,
      balance: u.balance,
      hasPaidThisWeek: u.pembayaran.length > 0,
    }));

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching mahasiswa:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
