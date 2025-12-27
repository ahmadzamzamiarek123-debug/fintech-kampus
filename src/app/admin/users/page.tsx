"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { formatRupiah } from "@/lib/utils";

interface User {
  id: string;
  identifier: string;
  name: string;
  prodi: string | null;
  angkatan: string | null;
  isActive: boolean;
  createdAt: string;
  balance: { balance: number } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [prodiList, setProdiList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<
    "toggle" | "reset" | "prodi" | null
  >(null);
  const [newProdi, setNewProdi] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Create User Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    identifier: "",
    name: "",
    prodi: "",
    angkatan: "",
    password: "",
  });

  // Filters
  const [filterProdi, setFilterProdi] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Available scopes from existing operators
  const [availableScopes, setAvailableScopes] = useState<{
    prodiList: string[];
    angkatanByProdi: Record<string, string[]>;
  }>({ prodiList: [], angkatanByProdi: {} });

  useEffect(() => {
    fetchUsers();
  }, [filterProdi, filterStatus, page]);

  // Fetch available scopes when modal opens
  useEffect(() => {
    if (showCreateModal) {
      fetchAvailableScopes();
    }
  }, [showCreateModal]);

  async function fetchAvailableScopes() {
    try {
      const res = await fetch("/api/admin/available-scopes");
      const data = await res.json();
      if (data.success) {
        setAvailableScopes(data.data);
      }
    } catch (error) {
      console.error("Error fetching available scopes:", error);
    }
  }

  async function fetchUsers() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      if (filterProdi) params.append("prodi", filterProdi);
      if (filterStatus) params.append("status", filterStatus);

      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.data || []);
      setTotalPages(data.totalPages || 1);
      setProdiList(data.prodiList || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAction() {
    if (!selectedUser || !actionType) return;
    setIsSubmitting(true);
    setResult(null);

    try {
      const body: { action: string; prodi?: string } = { action: "" };
      if (actionType === "toggle") body.action = "toggle-active";
      if (actionType === "reset") body.action = "reset-password";
      if (actionType === "prodi") {
        body.action = "change-prodi";
        body.prodi = newProdi;
      }

      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        setResult({ success: true, message: data.message });
        setSelectedUser(null);
        setActionType(null);
        setNewProdi("");
        fetchUsers();
      } else {
        setResult({ success: false, message: data.error });
      }
    } catch {
      setResult({ success: false, message: "Terjadi kesalahan" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      const data = await res.json();

      if (data.success) {
        setResult({ success: true, message: data.message });
        setShowCreateModal(false);
        setNewUser({
          identifier: "",
          name: "",
          prodi: "",
          angkatan: "",
          password: "",
        });
        fetchUsers();
      } else {
        setResult({ success: false, message: data.error });
      }
    } catch {
      setResult({ success: false, message: "Terjadi kesalahan" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
            Kelola Users
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            Manage semua mahasiswa dalam sistem
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
          Tambah User
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6 bg-white border-gray-100">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-end gap-3 sm:gap-4">
            <div className="w-full sm:w-48">
              <Select
                label="Prodi"
                value={filterProdi}
                onChange={(e) => {
                  setFilterProdi(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: "", label: "Semua Prodi" },
                  ...prodiList.map((p) => ({ value: p, label: p })),
                ]}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                label="Status"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: "", label: "Semua Status" },
                  { value: "active", label: "Aktif" },
                  { value: "inactive", label: "Nonaktif" },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Result Message */}
      {result && (
        <div
          className={`mb-6 p-3 sm:p-4 rounded-xl text-sm ${
            result.success
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {result.message}
        </div>
      )}

      {/* Users Table */}
      <Card className="bg-white border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  NIM
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nama
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Prodi
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Saldo
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    Tidak ada user.{" "}
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="text-indigo-600 hover:underline"
                    >
                      Buat user baru
                    </button>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4 text-sm font-mono text-gray-900">
                      {u.identifier}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900">
                      {u.name}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-600">
                      {u.prodi || "-"}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900">
                      {formatRupiah(u.balance?.balance || 0)}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <Badge variant={u.isActive ? "success" : "danger"}>
                        {u.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant={u.isActive ? "danger" : "primary"}
                          onClick={() => {
                            setSelectedUser(u);
                            setActionType("toggle");
                          }}
                        >
                          {u.isActive ? "Disable" : "Enable"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(u);
                            setActionType("reset");
                          }}
                        >
                          Reset PW
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex items-center justify-between">
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

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Tambah User Baru"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="NIM (8 digit)"
            value={newUser.identifier}
            onChange={(e) =>
              setNewUser({
                ...newUser,
                identifier: e.target.value.replace(/\D/g, "").slice(0, 8),
              })
            }
            placeholder="Contoh: 20230001"
            maxLength={8}
            required
          />

          <Input
            label="Nama Lengkap"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            placeholder="Nama mahasiswa"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Prodi"
              value={newUser.prodi}
              onChange={(e) => {
                setNewUser({ ...newUser, prodi: e.target.value, angkatan: "" });
              }}
              options={[
                { value: "", label: "Pilih Prodi" },
                ...availableScopes.prodiList.map((p) => ({
                  value: p,
                  label: p,
                })),
              ]}
              required
            />

            <Select
              label="Angkatan"
              value={newUser.angkatan}
              onChange={(e) =>
                setNewUser({ ...newUser, angkatan: e.target.value })
              }
              options={[
                {
                  value: "",
                  label: newUser.prodi ? "Pilih Angkatan" : "Pilih prodi dulu",
                },
                ...(newUser.prodi &&
                availableScopes.angkatanByProdi[newUser.prodi]
                  ? availableScopes.angkatanByProdi[newUser.prodi].map((a) => ({
                      value: a,
                      label: `Angkatan ${a}`,
                    }))
                  : []),
              ]}
              disabled={!newUser.prodi}
              required
            />
          </div>

          {availableScopes.prodiList.length === 0 && (
            <div className="p-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
              ⚠️ Belum ada Operator aktif. Buat Operator terlebih dahulu sebelum
              menambah User.
            </div>
          )}

          <Input
            label="Password"
            type="password"
            value={newUser.password}
            onChange={(e) =>
              setNewUser({ ...newUser, password: e.target.value })
            }
            placeholder="Minimal 6 karakter"
            required
          />

          <p className="text-xs text-gray-500">
            PIN default: <span className="font-mono">123456</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
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
              Buat User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Action Confirmation Modal */}
      <Modal
        isOpen={!!selectedUser && !!actionType}
        onClose={() => {
          setSelectedUser(null);
          setActionType(null);
          setNewProdi("");
        }}
        title={
          actionType === "toggle"
            ? selectedUser?.isActive
              ? "Nonaktifkan User"
              : "Aktifkan User"
            : actionType === "reset"
            ? "Reset Password"
            : "Ubah Prodi"
        }
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600">
                <span className="font-medium">{selectedUser.name}</span>
                <br />
                <span className="text-gray-500">{selectedUser.identifier}</span>
              </p>
            </div>

            {actionType === "toggle" && (
              <p className="text-sm text-gray-600">
                User ini akan{" "}
                {selectedUser.isActive ? "dinonaktifkan" : "diaktifkan"}.
                {selectedUser.isActive && " User tidak akan bisa login."}
              </p>
            )}

            {actionType === "reset" && (
              <p className="text-sm text-gray-600">
                Password akan direset ke{" "}
                <span className="font-mono font-medium">password123</span>
              </p>
            )}

            {actionType === "prodi" && (
              <Input
                label="Prodi Baru"
                value={newProdi}
                onChange={(e) => setNewProdi(e.target.value.toUpperCase())}
                placeholder="Contoh: TI, SI, MI"
              />
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedUser(null);
                  setActionType(null);
                }}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                variant={
                  actionType === "toggle" && selectedUser.isActive
                    ? "danger"
                    : "primary"
                }
                onClick={handleAction}
                isLoading={isSubmitting}
                className="flex-1"
              >
                Konfirmasi
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
