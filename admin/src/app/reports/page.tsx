'use client';

import { useEffect, useState } from 'react';
import { BarChart3, PieChart as PieIcon, TrendingUp, DollarSign, Package, Trophy, Palette } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { api } from '@/lib/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const STATUS_LABEL: Record<string, string> = {
  pending: '待審核',
  processing: '生產中',
  completed: '已完成',
  cancelled: '已取消'
};

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/reports/dashboard');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-12 text-center text-gray-500">載入數據中...</div>;
  if (!data) return <div className="p-12 text-center text-gray-500">暫無數據</div>;

  // 整理 Pie Chart 數據
  const pieData = data.statusDist.map((item: any) => ({
    name: STATUS_LABEL[item.status] || item.status,
    value: Number(item.count)
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <div className="p-2 bg-indigo-100 rounded-lg"><BarChart3 className="w-6 h-6 text-indigo-600" /></div>
          營運報表中心
        </h1>
        <p className="text-gray-500 text-sm mt-1">即時分析工廠營收與訂單分佈</p>
      </div>

      {/* 1. 核心指標 (KPI) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-full"><DollarSign className="w-5 h-5 text-green-600" /></div>
            <h3 className="text-gray-500 font-bold text-sm">總營業額 (Revenue)</h3>
          </div>
          <p className="text-4xl font-bold text-gray-900">${data.totalRevenue.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-full"><Package className="w-5 h-5 text-blue-600" /></div>
            <h3 className="text-gray-500 font-bold text-sm">總訂單數 (Orders)</h3>
          </div>
          <p className="text-4xl font-bold text-gray-900">{data.totalOrders}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-full"><TrendingUp className="w-5 h-5 text-purple-600" /></div>
            <h3 className="text-gray-500 font-bold text-sm">平均客單價</h3>
          </div>
          <p className="text-4xl font-bold text-gray-900">
            ${data.totalOrders > 0 ? Math.round(data.totalRevenue / data.totalOrders).toLocaleString() : 0}
          </p>
        </div>
      </div>

      {/* 2. 圖表區 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* 營收趨勢圖 (Bar Chart) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">近 6 個月營收趨勢</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '營收']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="total" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 訂單狀態分佈 (Pie Chart) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">訂單狀態分佈</h3>
          <div className="h-80 flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  // ✨ 防呆修正：(percent || 0)
                  label={({name, percent}) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ✨ 3. 熱銷排行榜 (Top 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 熱銷產品 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-bold text-gray-900">熱銷產品排行 (Top 5)</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">排名</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">產品名稱</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">銷售數量</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">總營收</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.productStats?.map((item: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500 font-bold">#{index + 1}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{item.name || '未知產品'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">{item.count}</td>
                  <td className="px-6 py-4 text-sm text-blue-600 font-bold text-right">${Number(item.revenue).toLocaleString()}</td>
                </tr>
              ))}
              {(!data.productStats || data.productStats.length === 0) && <tr><td colSpan={4} className="p-4 text-center text-gray-400 text-sm">暫無數據</td></tr>}
            </tbody>
          </table>
        </div>

        {/* 熱銷顏色 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-2">
            <Palette className="w-5 h-5 text-pink-500" />
            <h3 className="text-lg font-bold text-gray-900">熱銷顏色排行 (Top 5)</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">排名</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">顏色名稱</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">選擇次數</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.colorStats?.map((item: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500 font-bold">#{index + 1}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{item.name || '未選色'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">{item.count}</td>
                </tr>
              ))}
              {(!data.colorStats || data.colorStats.length === 0) && <tr><td colSpan={3} className="p-4 text-center text-gray-400 text-sm">暫無數據</td></tr>}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}