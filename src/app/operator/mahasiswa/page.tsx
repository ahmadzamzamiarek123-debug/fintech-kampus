"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { formatRupiah } from "@/lib/utils";

interface User {
  id: string;
  identifier: string;
  name: string;
  prodi: string | null;
  angkatan: string | null;
  isActive: boolean;
  balance: { balance: number } | null;
}

export default function OperatorMahasiswaPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Real-time polling: fetch every 3 seconds for live updates
  useEffect(() => {
    async function fetchUsersData() {
      try {
        const res = await fetch("/api/operator/mahasiswa");
        const data = await res.json();
        setUsers(data.data || []);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUsersData();

    // Set up polling interval for real-time student data updates
    const pollInterval = setInterval(fetchUsersData, 3000); // 3 seconds

    return () => clearInterval(pollInterval);
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.identifier.includes(searchTerm)
  );

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
          Data Mahasiswa
        </h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">
          {session?.user?.prodi} - Angkatan {session?.user?.angkatan}
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Cari nama atau NIM..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input max-w-sm"
        />
      </div>

      {/* Stats - Only Total and Active */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="stats-card">
          <p className="text-sm text-[var(--text-muted)]">Total Mahasiswa</p>
          <p className="stats-card-value">{users.length}</p>
        </div>
        <div className="stats-card">
          <p className="text-sm text-[var(--text-muted)]">Aktif</p>
          <p className="stats-card-value text-[var(--color-success)]">
            {users.filter((u) => u.isActive).length}
          </p>
        </div>
      </div>

      {/* Table - No payment status column */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">
                  NIM
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">
                  Nama
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">
                  Saldo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-[var(--text-muted)]"
                  >
                    Memuat data...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-[var(--text-muted)]"
                  >
                    {searchTerm
                      ? "Tidak ada hasil pencarian"
                      : "Belum ada mahasiswa"}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[var(--bg-hover)]">
                    <td className="px-4 py-3 font-mono text-sm text-[var(--text-primary)]">
                      {user.identifier}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--text-primary)]">
                        {user.name}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[var(--usg-accent)]">
                      {formatRupiah(user.balance?.balance || 0)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${
                          user.isActive ? "badge-success" : "badge-danger"
                        }`}
                      >
                        {user.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
