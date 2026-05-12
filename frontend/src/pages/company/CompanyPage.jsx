import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import CompanyForm from './CompanyForm';
import DepartmentForm from './DepartmentForm';
import WorkPolicyForm from './WorkPolicyForm';
import LeavePolicyForm from './LeavePolicyForm';

export default function CompanyPage() {
    const toast = useToast();
    const confirm = useConfirm();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState('info');
    const [companyModal, setCompanyModal] = useState(false);
    const [deptModal, setDeptModal] = useState(false);
    const [workPolicyModal, setWorkPolicyModal] = useState(false);
    const [leavePolicyModal, setLeavePolicyModal] = useState(false);

    const { data: company, isLoading } = useQuery({
        queryKey: ['company-me'],
        queryFn: async () => {
            const res = await api.get('/company/me');
            return res.data;
        },
    });

    const { data: workPolicies = [] } = useQuery({
        queryKey: ['work-policies', company?.id],
        queryFn: async () => {
            const res = await api.get(`/company/${company.id}/work-policies`);
            return res.data;
        },
        enabled: !!company?.id,
    });

    const { data: leavePolicies = [] } = useQuery({
        queryKey: ['leave-policies', company?.id],
        queryFn: async () => {
            const res = await api.get(`/company/${company.id}/leave-policies`);
            return res.data;
        },
        enabled: !!company?.id,
    });

    const deleteDeptMutation = useMutation({
        mutationFn: (id) => api.delete(`/company/departments/${id}`),
        onSuccess: () => {
            toast('Divisi berhasil dihapus', 'success');
            queryClient.invalidateQueries(['company-me']);
        },
        onError: (err) => {
            toast(err.response?.data?.message || 'Gagal menghapus divisi', 'error');
        },
    });

    const handleDeleteDept = async (dept) => {
        const ok = await confirm({
            title: 'Hapus Divisi?',
            message: `Divisi "${dept.name}" akan dihapus. Pastikan tidak ada karyawan di divisi ini.`,
            confirmText: 'Ya, Hapus',
            type: 'danger',
        });
        if (ok) deleteDeptMutation.mutate(dept.id);
    };

    const tabs = [
        { key: 'info', label: 'Info Perusahaan' },
        { key: 'departments', label: 'Divisi' },
        { key: 'work-policy', label: 'Kebijakan Kerja' },
        { key: 'leave-policy', label: 'Kebijakan Cuti' },
    ];

    if (isLoading) return <LoadingSpinner center />;

    // Belum setup company
    if (!company) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">Perusahaan</h1>
                <EmptyState
                    title="Belum ada data perusahaan"
                    description="Setup profil perusahaan Anda terlebih dahulu"
                    action={
                        <button onClick={() => setCompanyModal(true)} className="btn-primary">
                            Setup Perusahaan
                        </button>
                    }
                />
                <Modal isOpen={companyModal} onClose={() => setCompanyModal(false)} title="Setup Perusahaan">
                    <CompanyForm
                        company={null}
                        onSuccess={() => {
                            setCompanyModal(false);
                            queryClient.invalidateQueries(['company-me']);
                        }}
                        onCancel={() => setCompanyModal(false)}
                    />
                </Modal>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {company.industry} · {company._count?.employees} karyawan
                    </p>
                </div>
                <button onClick={() => setCompanyModal(true)} className="flex items-center gap-2 btn-secondary">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Profil
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${activeTab === tab.key
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab: Info */}
            {activeTab === 'info' && (
                <div className="space-y-4 card">
                    {[
                        { label: 'Nama Perusahaan', value: company.name },
                        { label: 'Industri', value: company.industry || '-' },
                        { label: 'Alamat', value: company.address || '-' },
                        { label: 'Zona Waktu', value: company.timezone },
                        { label: 'Total Karyawan', value: company._count?.employees + ' orang' },
                    ].map((item) => (
                        <div key={item.label} className="flex justify-between py-2 text-sm border-b border-gray-50">
                            <span className="text-gray-500">{item.label}</span>
                            <span className="font-medium text-gray-900">{item.value}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Tab: Departments */}
            {activeTab === 'departments' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button onClick={() => setDeptModal(true)} className="flex items-center gap-2 btn-primary">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Tambah Divisi
                        </button>
                    </div>

                    {company.departments?.length === 0 ? (
                        <EmptyState
                            title="Belum ada divisi"
                            description="Tambahkan divisi/departemen perusahaan"
                            action={
                                <button onClick={() => setDeptModal(true)} className="btn-primary">
                                    Tambah Divisi
                                </button>
                            }
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {company.departments.map((dept) => (
                                <div key={dept.id} className="flex items-center justify-between card">
                                    <div>
                                        <p className="font-medium text-gray-900">{dept.name}</p>
                                        <p className="text-sm text-gray-400 mt-0.5">
                                            {dept._count?.employees || 0} karyawan
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteDept(dept)}
                                        className="text-gray-400 transition-colors hover:text-red-500"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Tab: Work Policy */}
            {activeTab === 'work-policy' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button onClick={() => setWorkPolicyModal(true)} className="flex items-center gap-2 btn-primary">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Tambah Shift
                        </button>
                    </div>

                    {workPolicies.length === 0 ? (
                        <EmptyState
                            title="Belum ada kebijakan kerja"
                            description="Tambahkan shift dan jam kerja"
                            action={
                                <button onClick={() => setWorkPolicyModal(true)} className="btn-primary">
                                    Tambah Shift
                                </button>
                            }
                        />
                    ) : (
                        <div className="space-y-3">
                            {workPolicies.map((policy) => (
                                <div key={policy.id} className="card">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold text-gray-900">{policy.shiftName}</p>
                                        <span className="text-sm text-gray-500">
                                            {policy.startTime} — {policy.endTime}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 mt-3 text-sm text-gray-500">
                                        <div>
                                            <span className="text-xs text-gray-400">Toleransi Terlambat</span>
                                            <p className="font-medium text-gray-700">{policy.lateToleranceMinutes} menit</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-400">Hari Kerja</span>
                                            <p className="font-medium text-gray-700">{policy.workDays}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-400">Radius GPS</span>
                                            <p className="font-medium text-gray-700">{policy.gpsRadius} meter</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Tab: Leave Policy */}
            {activeTab === 'leave-policy' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button onClick={() => setLeavePolicyModal(true)} className="flex items-center gap-2 btn-primary">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Tambah Kebijakan Cuti
                        </button>
                    </div>

                    {leavePolicies.length === 0 ? (
                        <EmptyState
                            title="Belum ada kebijakan cuti"
                            description="Tambahkan jenis dan kuota cuti"
                            action={
                                <button onClick={() => setLeavePolicyModal(true)} className="btn-primary">
                                    Tambah Kebijakan Cuti
                                </button>
                            }
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {leavePolicies.map((policy) => (
                                <div key={policy.id} className="card">
                                    <p className="font-semibold text-gray-900">{policy.leaveType}</p>
                                    <div className="flex items-center justify-between mt-3">
                                        <span className="text-sm text-gray-500">Kuota per tahun</span>
                                        <span className="text-lg font-bold text-primary-600">{policy.quota} hari</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-sm text-gray-500">Carry over</span>
                                        <span className={`text-sm font-medium ${policy.carryOver ? 'text-green-600' : 'text-gray-400'}`}>
                                            {policy.carryOver ? 'Ya' : 'Tidak'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            <Modal isOpen={companyModal} onClose={() => setCompanyModal(false)} title="Edit Perusahaan">
                <CompanyForm
                    company={company}
                    onSuccess={() => {
                        setCompanyModal(false);
                        queryClient.invalidateQueries(['company-me']);
                    }}
                    onCancel={() => setCompanyModal(false)}
                />
            </Modal>

            <Modal isOpen={deptModal} onClose={() => setDeptModal(false)} title="Tambah Divisi">
                <DepartmentForm
                    onSuccess={() => {
                        setDeptModal(false);
                        queryClient.invalidateQueries(['company-me']);
                    }}
                    onCancel={() => setDeptModal(false)}
                />
            </Modal>

            <Modal isOpen={workPolicyModal} onClose={() => setWorkPolicyModal(false)} title="Tambah Kebijakan Kerja">
                <WorkPolicyForm
                    onSuccess={() => {
                        setWorkPolicyModal(false);
                        queryClient.invalidateQueries(['work-policies', company?.id]);
                    }}
                    onCancel={() => setWorkPolicyModal(false)}
                />
            </Modal>

            <Modal isOpen={leavePolicyModal} onClose={() => setLeavePolicyModal(false)} title="Tambah Kebijakan Cuti">
                <LeavePolicyForm
                    onSuccess={() => {
                        setLeavePolicyModal(false);
                        queryClient.invalidateQueries(['leave-policies', company?.id]);
                    }}
                    onCancel={() => setLeavePolicyModal(false)}
                />
            </Modal>
        </div>
    );
}