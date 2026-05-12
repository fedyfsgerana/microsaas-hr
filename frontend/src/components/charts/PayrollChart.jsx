import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

const formatRupiah = (value) =>
    `Rp ${Number(value).toLocaleString('id-ID')}`;

export default function PayrollChart({ data = [] }) {
    const chartData = data.map((d) => ({
        bulan: MONTHS[d.month - 1],
        totalGaji: Number(d.totalSalary),
    }));

    return (
        <div className="card">
            <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Tren Penggajian</h3>
            <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => formatRupiah(v)} />
                    <Line
                        type="monotone"
                        dataKey="totalGaji"
                        name="Total Gaji"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}