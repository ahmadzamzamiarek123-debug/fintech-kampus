import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/rbac";
import { createOperatorSchema } from "@/lib/validations";
import { generateOperatorCode } from "@/lib/utils";
import { createAuditLog } from "@/lib/audit";
import bcrypt from "bcryptjs";

// GET /api/admin/operators - Get all operators
export async function GET() {
  const { error, user } = await withAuth("ADMIN");

  if (error) return error;

  try {
    const operators = await prisma.user.findMany({
      where: { role: "OPERATOR", deletedAt: null },
      select: {
        id: true,
        identifier: true,
        name: true,
        prodi: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: operators,
    });
  } catch (error) {
    console.error("Error fetching operators:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// POST /api/admin/operators - Create new operator
export async function POST(request: NextRequest) {
  const { error, user } = await withAuth("ADMIN");

  if (error) return error;

  try {
    const body = await request.json();
    const { name, prodi, angkatan, password } = body;

    // Validate required fields
    if (!name || !prodi || !angkatan || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Semua field wajib diisi (nama, prodi, angkatan, password)",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    // Check if prodi+angkatan already has an operator
    const existingOperator = await prisma.user.findFirst({
      where: {
        role: "OPERATOR",
        prodi: prodi.toUpperCase(),
        angkatan: angkatan,
        deletedAt: null,
      },
    });

    if (existingOperator) {
      return NextResponse.json(
        {
          success: false,
          error: `Operator untuk ${prodi} angkatan ${angkatan} sudah ada`,
        },
        { status: 400 }
      );
    }

    // Generate operator code
    const identifier = generateOperatorCode(prodi);

    // Check if identifier already exists (retry with new code if needed)
    const existingId = await prisma.user.findUnique({
      where: { identifier },
    });

    if (existingId) {
      return NextResponse.json(
        { success: false, error: "Kode operator sudah ada, coba lagi" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create operator with angkatan
    const operator = await prisma.user.create({
      data: {
        identifier,
        name,
        role: "OPERATOR",
        prodi: prodi.toUpperCase(),
        angkatan,
        passwordHash,
        mustChangePassword: true,
      },
    });

    // Audit log
    await createAuditLog(user!.id, "OPERATOR_CREATED", {
      targetUserId: operator.id,
      targetUserIdentifier: identifier,
      prodi: prodi.toUpperCase(),
      angkatan,
    });

    return NextResponse.json({
      success: true,
      message: `Operator ${prodi} ${angkatan} berhasil dibuat`,
      data: {
        id: operator.id,
        identifier: operator.identifier,
        name: operator.name,
        prodi: operator.prodi,
        angkatan: operator.angkatan,
      },
    });
  } catch (error) {
    console.error("Error creating operator:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
