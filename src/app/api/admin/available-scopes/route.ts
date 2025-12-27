import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/rbac";

// GET /api/admin/available-scopes - Get prodi+angkatan combinations from existing operators
export async function GET() {
  const { error } = await withAuth("ADMIN");

  if (error) return error;

  try {
    // Get all active operators with their prodi and angkatan
    const operators = await prisma.user.findMany({
      where: {
        role: "OPERATOR",
        deletedAt: null,
        isActive: true,
        prodi: { not: null },
        angkatan: { not: null },
      },
      select: {
        prodi: true,
        angkatan: true,
      },
      orderBy: [{ prodi: "asc" }, { angkatan: "desc" }],
    });

    // Get unique prodi list
    const prodiSet = new Set<string>();
    const scopes: { prodi: string; angkatan: string }[] = [];

    operators.forEach((op) => {
      if (op.prodi && op.angkatan) {
        prodiSet.add(op.prodi);
        scopes.push({
          prodi: op.prodi,
          angkatan: op.angkatan,
        });
      }
    });

    // Get unique prodi list for dropdown
    const prodiList = Array.from(prodiSet).sort();

    // Group angkatan by prodi
    const angkatanByProdi: Record<string, string[]> = {};
    scopes.forEach((scope) => {
      if (!angkatanByProdi[scope.prodi]) {
        angkatanByProdi[scope.prodi] = [];
      }
      if (!angkatanByProdi[scope.prodi].includes(scope.angkatan)) {
        angkatanByProdi[scope.prodi].push(scope.angkatan);
      }
    });

    // Sort angkatan descending
    Object.keys(angkatanByProdi).forEach((prodi) => {
      angkatanByProdi[prodi].sort((a, b) => parseInt(b) - parseInt(a));
    });

    return NextResponse.json({
      success: true,
      data: {
        prodiList,
        angkatanByProdi,
        scopes, // Full list of prodi+angkatan combinations
      },
    });
  } catch (error) {
    console.error("Error fetching available scopes:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
