"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { formatDateTime } from "@/lib/utils";
import { ChartColors } from "@/lib/colors";
import { PRODI_OPTIONS, ANGKATAN_OPTIONS } from "@/lib/constants";

interface Operator {
  id: string;
  identifier: string;
  name: string;
  prodi: string | null;
  angkatan: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function AdminOperatorsPage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [prodi, setProdi] = useState("");
  const [angkatan, setAngkatan] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    fetchOperators();
  }, []);

  async function fetchOperators() {
    try {
      const res = await fetch("/api/admin/operators");
      const data = await res.json();
      setOperators(data.data || []);
    } catch (error) {
      console.error("Error fetching operators:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm() {
    setName("");
    setProdi("");
    setAngkatan("");
    setPassword("");
  }

  async function handleCreateOperator(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/operators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, prodi, angkatan, password }),
      });

      const data = await res.json();

      if (data.success) {
        setResult({
          success: true,
          message: `Operator berhasil dibuat: ${data.data.identifier}`,
        });
        resetForm();
        setShowCreateModal(false);
        fetchOperators();
      } else {
        setResult({ success: false, message: data.error });
      }
    } catch {
      setResult({ success: false, message: "Terjadi kesalahan" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(operatorId: string) {
    setTogglingId(operatorId);
    setResult(null);

    try {
      const res = await fetch(
        `/api/admin/operators/${operatorId}/toggle-active`,
        {
          method: "PATCH",
        }
      );

      const data = await res.json();

      if (data.success) {
        setResult({ success: true, message: data.message });
        fetchOperators();
      } else {
        setResult({ success: false, message: data.error });
      }
    } catch {
      setResult({ success: false, message: "Terjadi kesalahan" });
    } finally {
      setTogglingId(null);
    }
  }

  const prodiColors: Record<string, string> = {
    TI: "bg-blue-100 text-blue-700",
    SI: "bg-green-100 text-green-700",
    MI: "bg-purple-100 text-purple-700",
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-8">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
            Kelola Operator
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            Tambah dan kelola operator
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Tambah Operator
        </Button>
      </div>

      {/* Result Message */}
      {result && (
        <div
          className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg sm:rounded-xl text-sm ${
            result.success
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {result.message}
        </div>
      )}

      {/* Operators Grid - Responsive */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 sm:h-48 bg-gray-200 rounded-xl sm:rounded-2xl animate-pulse"
            ></div>
          ))}
        </div>
      ) : operators.length === 0 ? (
        <Card>
          <CardContent className="py-8 sm:py-12 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg
                className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <p className="text-gray-500 text-sm sm:text-base">
              Belum ada operator
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="mt-3 sm:mt-4"
            >
              Tambah Operator
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {operators.map((op) => (
            <Card key={op.id} className="hover:shadow-xl transition-all">
              <CardContent className="p-4 sm:py-5">
                <div className="flex items-start gap-3 mb-3 sm:mb-4">
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg flex-shrink-0"
                    style={{
                      background: op.isActive
                        ? "linear-gradient(to bottom right, #10B981, #14B8A6)"
                        : "linear-gradient(to bottom right, #6B7280, #9CA3AF)",
                    }}
                  >
                    {op.name[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                      {op.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 font-mono truncate">
                      {op.identifier}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2 sm:mb-3 flex-wrap gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      prodiColors[op.prodi || ""] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {op.prodi || "N/A"}
                  </span>

                  {/* Status Badge */}
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: op.isActive
                        ? `${ChartColors.active}20`
                        : `${ChartColors.inactive}20`,
                      color: op.isActive
                        ? ChartColors.active
                        : ChartColors.inactive,
                    }}
                  >
                    {op.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </div>

                <p className="text-xs text-gray-400 mb-3 sm:mb-4">
                  {formatDateTime(op.createdAt)}
                </p>

                {/* Toggle Button */}
                <Button
                  variant={op.isActive ? "danger" : "primary"}
                  size="sm"
                  className="w-full text-xs sm:text-sm"
                  onClick={() => handleToggleActive(op.id)}
                  isLoading={togglingId === op.id}
                >
                  {op.isActive ? "Nonaktifkan" : "Aktifkan"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Tambah Operator"
      >
        <form
          onSubmit={handleCreateOperator}
          className="space-y-3 sm:space-y-4"
        >
          <Input
            label="Nama Operator"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Operator TI 2024"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Prodi"
              value={prodi}
              onChange={(e) => setProdi(e.target.value)}
              options={[{ value: "", label: "Pilih Prodi" }, ...PRODI_OPTIONS]}
              required
            />

            <Select
              label="Angkatan"
              value={angkatan}
              onChange={(e) => setAngkatan(e.target.value)}
              options={[
                { value: "", label: "Pilih Tahun" },
                ...ANGKATAN_OPTIONS,
              ]}
              required
            />
          </div>

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 6 karakter"
            required
          />

          <p className="text-xs text-gray-500">Format kode: OP-[PRODI]-XXXX</p>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
              className="w-full sm:flex-1 order-2 sm:order-1"
            >
              Batal
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="w-full sm:flex-1 order-1 sm:order-2"
            >
              Buat Operator
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
