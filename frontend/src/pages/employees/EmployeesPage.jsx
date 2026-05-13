import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import ExportButton from '../../components/ui/ExportButton';
import EmployeeForm from './EmployeeForm';
import { usePagination } from '../../hooks/usePagination';
import { useExport } from '../../hooks/useExport';

const STATUS = {
    ACTIVE: { label: 'Aktif', cls: 'badge-success' },
    INACTIVE: { label: 'Tidak Aktif', cls: 'badge-warning' },
    RESIGNED: { label: 'Resign', cls: 'badge-gray' },
    TERMINATED: { label: 'Diberhentikan', cls: 'badge-danger' },
};

function EmployeeRow({ emp, onEdit, onArchive }) {
    return (
        <tr className="transition-colors group hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center flex-shrink-0 w-9 h-9 rounded-xl bg-primary-50">
                        <span className="text-xs font-bold text-primary">{emp.fullName.charAt(0)}</span>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{emp.fullName}</p>
                        <p className="text-xs text-gray-400">{emp.user?.email}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">{emp.position || '-'}</p>
            </td>
            <td className="px-6 py-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">{emp.department?.name || '-'}</p>
            </td>
            <td className="px-6 py-4">
                <span className={STATUS[emp.status]?.cls}>{STATUS[emp.status]?.label}</span>
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                {emp.joinDate ? new Date(emp.joinDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center justify-end gap-1 transition-opacity opacity-0 group-hover:opacity-100">
                    <button
                        onClick={() => onEdit(emp)}
                        className="p-2 text-gray-400 transition-colors rounded-xl hover:text-primary hover:bg-primary-50 dark:hover:bg-primary-900/20"
                        title="Edit"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    {emp.status === 'ACTIVE' && (
                        <button
                            onClick={() => onArchive(emp)}
                            className="p-2 text-gray-400 transition-colors rounded-xl hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Arsipkan"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
}

export default function EmployeesPage() {
    const toast = useToast();
    const confirm = useConfirm();
    const queryClient = useQueryClient();
    const { exportCSV, exportPrint } = useExport();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [viewMode, setViewMode] = useState('table'); // 'table' | 'card'
    const [modalOpen, setModalOpen] = useState(false);
    const [selected, setSelected] = useState(null);

    const { data: employees = [], isLoading } = useQuery({
        queryKey: ['employees', search],
        queryFn: async () => {
            const res = await api.get('/employees', { params: { search } });
            return res.data;
        },
    });

    const filtered = statusFilter ? employees.filter((e) => e.status === statusFilter) : employees;
    const { page, totalPages, paginated, goToPage, nextPage, prevPage, reset } = usePagination(filtered, 10);

    const archiveMutation = useMutation({
        mutationFn: (id) => api.delete(`/employees/${id}`),
        onSuccess: () => {
            toast('Karyawan berhasil diarsipkan', 'success');
            queryClient.invalidateQueries(['employees']);
        },
        onError: (err) => toast(err.response?.data?.message || 'Gagal', 'error'),
    });

    const handleArchive = async (emp) => {
        const ok = await confirm({
            title: 'Arsipkan Karyawan?',
            message: `${emp.fullName} akan dinonaktifkan. Data histori tetap tersimpan.`,
            confirmText: 'Arsipkan',
            type: 'warning',
        });
        if (ok) archiveMutation.mutate(emp.id);
    };

    const handleEdit = (emp) => { setSelected(emp); setModalOpen(true); };
    const handleAdd = () => { setSelected(null); setModalOpen(true); };
    const handleClose = () => { setModalOpen(false); setSelected(null); };
    const handleSuccess = () => { handleClose(); queryClient.invalidateQueries(['employees']); };

    const handleCSV = () => {
        exportCSV(employees.map((e) => ({
            Nama: e.fullName,
            Email: e.user?.email || '',
            Jabatan: e.position || '',
            Divisi: e.department?.name || '',
            Status: STATUS[e.status]?.label,
            'Tgl Bergabung': e.joinDate ? new Date(e.joinDate).toLocaleDateString('id-ID') : '',
            'Gaji Pokok': Number(e.baseSalary).toLocaleString('id-ID'),
        })), 'karyawan');
    };

    return (
        <div className="space-y-5 page-enter">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">Karyawan</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{filtered.length} karyawan</p>
                </div>
                <div className="flex items-center gap-2">
                    <ExportButton onCSV={handleCSV} onPrint={() => exportPrint('emp-table')} />
                    <button onClick={handleAdd} className="btn-primary">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-48">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Cari nama, jabatan..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); reset(); }}
                        className="pl-10 input-field"
                    />
                </div>

                {/* Status filter pills */}
                <div className="flex gap-1.5">
                    {[{ val: '', label: 'Semua' }, { val: 'ACTIVE', label: 'Aktif' }, { val: 'RESIGNED', label: 'Resign' }].map(({ val, label }) => (
                        <button
                            key={val}
                            onClick={() => { setStatusFilter(val); reset(); }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all
                ${statusFilter === val
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* View toggle */}
                <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                    <button
                        onClick={() => setViewMode('table')}
                        className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-400'}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 4v16" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setViewMode('card')}
                        className={`p-1.5 rounded-lg transition-all ${viewMode === 'card' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-400'}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    </button>
                </div>
            </div>

            {isLoading ? (
                <LoadingSpinner center />
            ) : filtered.length === 0 ? (
                <EmptyState
                    title="Tidak ada karyawan"
                    description="Tambahkan karyawan baru untuk mulai"
                    action={<button onClick={handleAdd} className="btn-primary">Tambah Karyawan</button>}
                />
            ) : viewMode === 'card' ? (
                /* Card view */
                <div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {paginated.map((emp) => (
                            <div key={emp.id} className="card-hover group">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-50">
                                        <span className="text-lg font-black text-primary">{emp.fullName.charAt(0)}</span>
                                    </div>
                                    <span className={STATUS[emp.status]?.cls}>{STATUS[emp.status]?.label}</span>
                                </div>
                                <p className="font-bold text-gray-900 dark:text-white">{emp.fullName}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{emp.position || 'Belum diset'}</p>
                                <p className="mt-1 text-xs text-gray-400">{emp.department?.name || 'Tanpa divisi'}</p>
                                <div className="flex gap-2 mt-4 transition-opacity opacity-0 group-hover:opacity-100">
                                    <button onClick={() => handleEdit(emp)} className="btn-secondary flex-1 text-xs py-1.5">Edit</button>
                                    {emp.status === 'ACTIVE' && (
                                        <button onClick={() => handleArchive(emp)} className="btn-ghost text-red-500 text-xs py-1.5 px-3">Arsip</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <Pagination page={page} totalPages={totalPages} onPage={goToPage} onPrev={prevPage} onNext={nextPage} />
                </div>
            ) : (
                /* Table view */
                <div className="p-0 overflow-hidden card" id="emp-table">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm" role="table">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-800">
                                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Karyawan</th>
                                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Jabatan</th>
                                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Divisi</th>
                                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
                                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Bergabung</th>
                                    <th className="px-6 py-3.5" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {paginated.map((emp) => (
                                    <EmployeeRow key={emp.id} emp={emp} onEdit={handleEdit} onArchive={handleArchive} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
                        <Pagination page={page} totalPages={totalPages} onPage={goToPage} onPrev={prevPage} onNext={nextPage} />
                    </div>
                </div>
            )}

            <Modal isOpen={modalOpen} onClose={handleClose} title={selected ? 'Edit Karyawan' : 'Tambah Karyawan'} size="lg">
                <EmployeeForm employee={selected} onSuccess={handleSuccess} onCancel={handleClose} />
            </Modal>
        </div>
    );
}