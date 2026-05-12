import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import ExportButton from '../../components/ui/ExportButton';
import EmployeeForm from './EmployeeForm';
import { usePagination } from '../../hooks/usePagination';
import { useExport } from '../../hooks/useExport';

const statusVariant = {
    ACTIVE: 'success',
    INACTIVE: 'warning',
    RESIGNED: 'gray',
    TERMINATED: 'danger',
};

const statusLabel = {
    ACTIVE: 'Aktif',
    INACTIVE: 'Tidak Aktif',
    RESIGNED: 'Resign',
    TERMINATED: 'Diberhentikan',
};

export default function EmployeesPage() {
    const toast = useToast();
    const confirm = useConfirm();
    const queryClient = useQueryClient();
    const { exportCSV, exportPrint } = useExport();

    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const { data: employees = [], isLoading } = useQuery({
        queryKey: ['employees', search],
        queryFn: async () => {
            const res = await api.get('/employees', { params: { search } });
            return res.data;
        },
    });

    const { page, totalPages, paginated, goToPage, nextPage, prevPage, reset } = usePagination(employees, 10);

    const archiveMutation = useMutation({
        mutationFn: (id) => api.delete(`/employees/${id}`),
        onSuccess: () => {
            toast('Karyawan berhasil diarsipkan', 'success');
            queryClient.invalidateQueries(['employees']);
        },
        onError: (err) => {
            toast(err.response?.data?.message || 'Gagal mengarsipkan karyawan', 'error');
        },
    });

    const handleAdd = () => {
        setSelectedEmployee(null);
        setModalOpen(true);
    };

    const handleEdit = (employee) => {
        setSelectedEmployee(employee);
        setModalOpen(true);
    };

    const handleArchive = async (employee) => {
        const ok = await confirm({
            title: 'Arsipkan Karyawan?',
            message: `${employee.fullName} akan dinonaktifkan. Data histori tetap tersimpan.`,
            confirmText: 'Ya, Arsipkan',
            type: 'warning',
        });
        if (ok) archiveMutation.mutate(employee.id);
    };

    const handleModalClose = () => {
        setModalOpen(false);
        setSelectedEmployee(null);
    };

    const handleSuccess = () => {
        handleModalClose();
        queryClient.invalidateQueries(['employees']);
    };

    const handleExportCSV = () => {
        const data = employees.map((e) => ({
            Nama: e.fullName,
            Email: e.user?.email || '',
            Jabatan: e.position || '',
            Divisi: e.department?.name || '',
            Status: statusLabel[e.status],
            'Tanggal Bergabung': e.joinDate ? new Date(e.joinDate).toLocaleDateString('id-ID') : '',
            'Gaji Pokok': Number(e.baseSalary).toLocaleString('id-ID'),
        }));
        exportCSV(data, 'karyawan');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Karyawan</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {employees.length} karyawan terdaftar
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <ExportButton
                        onCSV={handleExportCSV}
                        onPrint={() => exportPrint('employees-table')}
                    />
                    <button onClick={handleAdd} className="flex items-center gap-2 btn-primary">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah Karyawan
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <svg className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    placeholder="Cari nama, jabatan, kode karyawan..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); reset(); }}
                    className="pl-10 input-field"
                    aria-label="Cari karyawan"
                />
            </div>

            {/* Table */}
            <div className="p-0 overflow-hidden card">
                {isLoading ? (
                    <LoadingSpinner center />
                ) : employees.length === 0 ? (
                    <EmptyState
                        title="Belum ada karyawan"
                        description="Tambahkan karyawan pertama Anda"
                        action={<button onClick={handleAdd} className="btn-primary">Tambah Karyawan</button>}
                    />
                ) : (
                    <div id="employees-table">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm" role="table" aria-label="Daftar karyawan">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                                        <th className="px-6 py-3 font-medium text-left text-gray-500 dark:text-gray-400">Karyawan</th>
                                        <th className="px-6 py-3 font-medium text-left text-gray-500 dark:text-gray-400">Jabatan</th>
                                        <th className="px-6 py-3 font-medium text-left text-gray-500 dark:text-gray-400">Divisi</th>
                                        <th className="px-6 py-3 font-medium text-left text-gray-500 dark:text-gray-400">Status</th>
                                        <th className="px-6 py-3 font-medium text-left text-gray-500 dark:text-gray-400">Bergabung</th>
                                        <th className="px-6 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                    {paginated.map((emp) => (
                                        <tr key={emp.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center justify-center flex-shrink-0 rounded-full w-9 h-9 bg-primary-100 dark:bg-primary-900">
                                                        <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                                                            {emp.fullName.charAt(0)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">{emp.fullName}</p>
                                                        <p className="text-xs text-gray-400">{emp.user?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{emp.position || '-'}</td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{emp.department?.name || '-'}</td>
                                            <td className="px-6 py-4">
                                                <Badge variant={statusVariant[emp.status]}>{statusLabel[emp.status]}</Badge>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                                {emp.joinDate ? new Date(emp.joinDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(emp)}
                                                        className="text-gray-400 transition-colors hover:text-primary-600"
                                                        title="Edit"
                                                        aria-label={`Edit ${emp.fullName}`}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    {emp.status === 'ACTIVE' && (
                                                        <button
                                                            onClick={() => handleArchive(emp)}
                                                            className="text-gray-400 transition-colors hover:text-red-500"
                                                            title="Arsipkan"
                                                            aria-label={`Arsipkan ${emp.fullName}`}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700">
                            <Pagination
                                page={page}
                                totalPages={totalPages}
                                onPage={goToPage}
                                onPrev={prevPage}
                                onNext={nextPage}
                            />
                        </div>
                    </div>
                )}
            </div>

            <Modal
                isOpen={modalOpen}
                onClose={handleModalClose}
                title={selectedEmployee ? 'Edit Karyawan' : 'Tambah Karyawan'}
                size="lg"
            >
                <EmployeeForm
                    employee={selectedEmployee}
                    onSuccess={handleSuccess}
                    onCancel={handleModalClose}
                />
            </Modal>
        </div>
    );
}