export default function PayrollDetailModal({ payroll }) {
    if (!payroll) return null;

    const rows = [
        { label: 'Gaji Pokok', value: Number(payroll.baseSalary), type: 'neutral' },
        { label: 'Tunjangan', value: Number(payroll.allowances), type: 'plus' },
        { label: 'Potongan', value: Number(payroll.deductions), type: 'minus' },
        { label: 'BPJS Kesehatan', value: Number(payroll.bpjsDeduction), type: 'minus' },
    ];

    return (
        <div className="space-y-4">
            {/* Info karyawan */}
            <div className="p-4 space-y-2 text-sm bg-gray-50 rounded-xl">
                <div className="flex justify-between">
                    <span className="text-gray-500">Karyawan</span>
                    <span className="font-medium">{payroll.employee?.fullName}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Jabatan</span>
                    <span className="font-medium">{payroll.employee?.position || '-'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Divisi</span>
                    <span className="font-medium">{payroll.employee?.department?.name || '-'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Periode</span>
                    <span className="font-medium">{payroll.period}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Hari Kerja</span>
                    <span className="font-medium">{payroll.presentDays} / {payroll.workingDays} hari</span>
                </div>
                {payroll.lateDays > 0 && (
                    <div className="flex justify-between">
                        <span className="text-gray-500">Keterlambatan</span>
                        <span className="font-medium text-yellow-600">{payroll.lateDays} kali</span>
                    </div>
                )}
            </div>

            {/* Rincian gaji */}
            <div className="space-y-2">
                <h3 className="text-sm font-semibold tracking-wide text-gray-700 uppercase">
                    Rincian Gaji
                </h3>
                {rows.map((row) => (
                    <div key={row.label} className="flex justify-between py-2 text-sm border-b border-gray-50">
                        <span className="text-gray-600">{row.label}</span>
                        <span className={`font-medium
              ${row.type === 'plus' ? 'text-green-600' : ''}
              ${row.type === 'minus' ? 'text-red-500' : ''}
              ${row.type === 'neutral' ? 'text-gray-900' : ''}
            `}>
                            {row.type === 'plus' ? '+' : row.type === 'minus' ? '-' : ''}
                            Rp {row.value.toLocaleString('id-ID')}
                        </span>
                    </div>
                ))}

                {/* Total */}
                <div className="flex justify-between px-4 py-3 mt-2 bg-primary-50 rounded-xl">
                    <span className="font-semibold text-primary-900">Total Gaji Bersih</span>
                    <span className="text-lg font-bold text-primary-700">
                        Rp {Number(payroll.totalSalary).toLocaleString('id-ID')}
                    </span>
                </div>
            </div>

            {/* Bank info */}
            {payroll.employee?.bankName && (
                <div className="p-4 space-y-2 text-sm bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-700">Info Transfer</h3>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Bank</span>
                        <span className="font-medium">{payroll.employee.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">No. Rekening</span>
                        <span className="font-medium">{payroll.employee.bankAccount}</span>
                    </div>
                </div>
            )}
        </div>
    );
}