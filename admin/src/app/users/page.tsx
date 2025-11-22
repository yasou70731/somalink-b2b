'use client';

import { useEffect, useState, useMemo } from 'react';
import { Users, Search, Wallet, AlertCircle, ChevronDown, ArrowUpCircle, Filter } from 'lucide-react';
import { api } from '@/lib/api';
import clsx from 'clsx';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(''); // ✨ 搜尋關鍵字
  
  // 狀態控制
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [modalMode, setModalMode] = useState<'deposit' | 'level'>('deposit'); 
  const [depositAmount, setDepositAmount] = useState('');
  const [newLevel, setNewLevel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 載入會員列表
  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ✨ 前端搜尋過濾邏輯
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const term = searchTerm.toLowerCase();
      const profile = user.dealerProfile;
      
      // 搜尋範圍：公司名、統編、聯絡人、Email
      return (
        (profile?.companyName || '').toLowerCase().includes(term) ||
        (profile?.taxId || '').includes(term) ||
        (profile?.contactPerson || '').toLowerCase().includes(term) ||
        (user.email || '').toLowerCase().includes(term)
      );
    });
  }, [users, searchTerm]);

  // 執行儲值
  const handleDeposit = async () => {
    if (!depositAmount || Number(depositAmount) <= 0) return alert('請輸入有效金額');
    
    setIsSubmitting(true);
    try {
      await api.post(`/users/${selectedUser.id}/deposit`, {
        amount: Number(depositAmount)
      });
      alert('🎉 儲值成功！');
      closeModal();
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || '儲值失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 執行升級
  const handleLevelChange = async () => {
    if (!newLevel) return;
    setIsSubmitting(true);
    try {
       await api.patch(`/users/${selectedUser.id}/level`, { level: newLevel });
       alert('等級修改成功！');
       closeModal();
       fetchUsers();
    } catch (err: any) {
      alert('修改失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = (user: any, mode: 'deposit' | 'level') => {
    setSelectedUser(user);
    setModalMode(mode);
    setDepositAmount('');
    setNewLevel(user.dealerProfile?.level || 'C');
  };

  const closeModal = () => {
    setSelectedUser(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            會員管理
          </h1>
          <p className="text-gray-500 text-sm mt-1">管理經銷商等級、查看與調整錢包餘額</p>
        </div>
      </div>

      {/* 列表卡片 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* ✨ 搜尋工具列 */}
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="搜尋公司名、統編、聯絡人..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
            />
          </div>
          <div className="text-sm text-gray-500">
            共 {filteredUsers.length} 位會員
          </div>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">公司名稱 / 統編</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">聯絡人</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">等級</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">錢包餘額</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-500">載入中...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-500">查無符合條件的會員</td></tr>
            ) : (
              filteredUsers.map((user) => {
                const profile = user.dealerProfile;
                return (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{profile?.companyName}</div>
                      <div className="text-xs text-gray-500 font-mono">{profile?.taxId}</div>
                      <div className="text-[10px] text-gray-400 mt-1">{profile?.tradeType}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{profile?.contactPerson}</div>
                      <div className="text-xs text-gray-400">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={clsx(
                          "px-2 py-1 rounded text-xs font-bold border",
                          profile?.level === 'A' ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                          profile?.level === 'B' ? "bg-blue-100 text-blue-800 border-blue-200" :
                          "bg-gray-100 text-gray-600 border-gray-200"
                        )}>
                          {profile?.level} 級夥伴
                        </span>
                        <button onClick={() => openModal(user, 'level')} className="text-gray-400 hover:text-blue-600 transition-colors" title="修改等級">
                          <ArrowUpCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-gray-400" />
                        <span className="font-mono font-bold text-gray-900">${Number(profile?.walletBalance).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {profile?.level !== 'C' ? (
                        <button 
                          onClick={() => openModal(user, 'deposit')}
                          className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-blue-100"
                        >
                          儲值 / 調整
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">不可儲值</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal (保持不變，程式碼略長，但已包含在上方複製區塊內) */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            
            {modalMode === 'deposit' && (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-1">錢包儲值</h3>
                <p className="text-sm text-gray-500 mb-6">
                  正在為 <span className="font-bold text-blue-600">{selectedUser.dealerProfile.companyName}</span> 儲值
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">儲值金額 (NT$)</label>
                    <input 
                      type="number" 
                      autoFocus
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg font-mono"
                      placeholder="例如：100000"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      單筆上限：{selectedUser.dealerProfile.level === 'A' ? '20萬' : '10萬'}
                    </p>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button onClick={closeModal} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">取消</button>
                    <button onClick={handleDeposit} disabled={isSubmitting} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold disabled:opacity-70">
                      {isSubmitting ? '處理中...' : '確認儲值'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {modalMode === 'level' && (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-1">修改會員等級</h3>
                <p className="text-sm text-gray-500 mb-6">
                  調整 <span className="font-bold text-blue-600">{selectedUser.dealerProfile.companyName}</span> 的權限
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">選擇新等級</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['A', 'B', 'C'].map(lvl => (
                        <button
                          key={lvl}
                          onClick={() => setNewLevel(lvl)}
                          className={clsx(
                            "py-3 border-2 rounded-xl font-bold text-lg transition-all",
                            newLevel === lvl 
                              ? "border-blue-600 bg-blue-50 text-blue-700" 
                              : "border-gray-200 hover:border-gray-300 text-gray-600"
                          )}
                        >
                          {lvl} 級
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 p-3 bg-gray-50 rounded text-xs text-gray-500 space-y-1">
                      <p>• A 級：儲值上限 20 萬，最優折扣</p>
                      <p>• B 級：儲值上限 10 萬，經銷折扣</p>
                      <p>• C 級：現金交易，不可儲值</p>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button onClick={closeModal} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">取消</button>
                    <button onClick={handleLevelChange} disabled={isSubmitting} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold disabled:opacity-70">
                      {isSubmitting ? '儲存中...' : '確認修改'}
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}