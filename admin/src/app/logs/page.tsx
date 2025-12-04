'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, UserCheck, Activity, Search, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { api } from '@/lib/api';

export default function LogsPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'audit'>('login');
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        // 根據 Tab 切換 API
        const endpoint = activeTab === 'login' ? '/logs/login' : '/logs/audit';
        const res = await api.get(endpoint);
        if (Array.isArray(res)) setLogs(res);
        else setLogs([]);
      } catch (err) {
        console.error(err);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <div className="p-2 bg-gray-200 rounded-lg"><ClipboardList className="w-6 h-6 text-gray-700" /></div>
          系統日誌中心
        </h1>
        <p className="text-gray-500 text-sm mt-1">監控使用者登入與關鍵操作紀錄</p>
      </div>

      {/* 頁籤切換 */}
      <div className="flex space-x-1 rounded-xl bg-gray-200 p-1 mb-6 w-fit">
        <button
          onClick={() => setActiveTab('login')}
          className={clsx(
            'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium leading-5 transition-all',
            activeTab === 'login'
              ? 'bg-white text-blue-700 shadow'
              : 'text-gray-600 hover:bg-white/12 hover:text-blue-600' // ✨ Fix: [0.12] -> 12
          )}
        >
          <UserCheck className="w-4 h-4" />
          登入紀錄
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={clsx(
            'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium leading-5 transition-all',
            activeTab === 'audit'
              ? 'bg-white text-purple-700 shadow'
              : 'text-gray-600 hover:bg-white/12 hover:text-purple-600' // ✨ Fix: [0.12] -> 12
          )}
        >
          <Activity className="w-4 h-4" />
          操作紀錄
        </button>
      </div>

      {/* 列表內容 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex justify-center items-center text-gray-500">
            <Loader2 className="animate-spin mr-2" /> 載入中...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">尚無紀錄</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">時間</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">使用者 / 公司</th>
                {activeTab === 'login' ? (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">來源 IP</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">裝置資訊 (User Agent)</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">動作類型</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">目標對象</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">詳細內容</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {new Date(activeTab === 'login' ? log.loginAt : log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{log.user?.dealerProfile?.companyName || log.user?.name || '未知用戶'}</div>
                    <div className="text-xs text-gray-500">{log.user?.email}</div>
                  </td>
                  
                  {activeTab === 'login' ? (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">{log.ip}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={log.userAgent}>
                        {log.userAgent}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {log.targetEntity} #{log.targetId?.substring(0, 8)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {JSON.stringify(log.details)}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}