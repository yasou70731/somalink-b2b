'use client';

import { useEffect, useState, useMemo } from 'react';
import { Users, Search, Wallet, AlertCircle, ChevronDown, ArrowUpCircle, Filter, CheckCircle, XCircle, Power, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import clsx from 'clsx';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [modalMode, setModalMode] = useState<'deposit' | 'level'>('deposit'); 
  const [depositAmount, setDepositAmount] = useState('');
  const [newLevel, setNewLevel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      // ✨ Fix: 直接使用 res，並確保它是陣列
      if (Array.isArray(res)) {
        setUsers(res);
      } else {
        console.warn('API 回傳格式異常 (非陣列):', res);
        setUsers([]);
      }
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 開通/停權
  const handleToggleActive = async (user: any) => {
    const action = user.isActive ? '停權' : '開通';
    if (!confirm(`確定要${action} ${user.dealerProfile.companyName} 嗎？`)) return;

    try {
      await api.patch(`/users/${user.id}/status`, { isActive: !user.isActive });
      alert(`${action}成功！`);
      fetchUsers();
    } catch (err) {
      alert('操作失敗，請檢查後端連線');
    }
  };

  // 刪除會員
  const handleDeleteUser = async (user: any) => {
    if (!confirm(`⚠️ 警告：確定要刪除會員【${user.dealerProfile.companyName}】嗎？\n\n此操作將永久刪除該帳號及其所有資料，且無法復原！`)) return;
    
    try {
      await api.delete(`/users/${user.id}`);
      alert('刪除成功！');
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('刪除失敗');
    }
  };

  const filteredUsers = useMemo(() => {
    return (users || []).filter(user => {
      if (!user) return false;
      const term = searchTerm.toLowerCase();
      const profile = user.dealerProfile;
      return (
        (profile?.companyName || '').toLowerCase().includes(term) ||
        (profile?.taxId || '').includes(term) ||
        (profile?.contactPerson || '').toLowerCase().includes(term) ||
        (user.email || '').toLowerCase().includes(term)
      );
    });
  }, [users, searchTerm]);

  const handleDeposit = async () => {
    if (!depositAmount || Number(depositAmount) <= 0) return alert('請輸入有效金額');
    setIsSubmitting(true);
    try {
      await api.post(`/users/${selectedUser.id}/deposit`, { amount: Number(depositAmount) });
      alert('🎉 儲值成功！');
      closeModal();
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || '儲值失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <p className="text-gray-500 text-sm mt-1">管理經銷商等級、審核開通與錢包儲值</p>
        </div>
      </div>

      {/* 列表卡片 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="搜尋公司名、統編、聯絡人..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
          </div>
          <div className="text-sm text-gray-500">共 {filteredUsers.length} 位會員</div>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">狀態</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">公司名稱 / 統編</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">聯絡人</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">等級</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">錢包餘額</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? <tr><td colSpan={6} className="text-center py-12 text-gray-500">載入中...</td></tr> : 
              filteredUsers.map((user) => {
                const profile = user.dealerProfile;
                return (
                  <tr key={user.id} className={clsx("transition-colors", user.isActive ? "hover:bg-gray-50" : "bg-red-50 hover:bg-red-100")}>
                    
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleToggleActive(user)}
                        className={clsx(
                          "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border transition-all",
                          user.isActive 
                            ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200" 
                            : "bg-red-100 text-red-700 border-red-200 hover:bg-red-200"
                        )}
                        title="點擊切換狀態"
                      >
                        {user.isActive ? <CheckCircle className="w-3 h-3" /> : <Power className="w-3 h-3" />}
                        {user.isActive ? '已開通' : '待審核'}
                      </button>
                    </td>

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
                        <span className={clsx("px-2 py-1 rounded text-xs font-bold border", profile?.level === 'A' ? "bg-yellow-100 text-yellow-800 border-yellow-200" : profile?.level === 'B' ? "bg-blue-100 text-blue-800 border-blue-200" : "bg-gray-100 text-gray-600 border-gray-200")}>
                          {profile?.level} 級夥伴
                        </span>
                        <button onClick={() => openModal(user, 'level')} className="text-gray-400 hover:text-blue-600 transition-colors" title="修改等級"><ArrowUpCircle className="w-4 h-4" /></button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-gray-400" />
                        <span className="font-mono font-bold text-gray-900">${Number(profile?.walletBalance).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {profile?.level !== 'C' ? (
                          <button onClick={() => openModal(user, 'deposit')} className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-blue-100">儲值</button>
                        ) : <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">不可儲值</span>}
                        
                        <button 
                          onClick={() => handleDeleteUser(user)} 
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                          title="刪除會員"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            
            {modalMode === 'deposit' && (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-1">錢包儲值</h3>
                <p className="text-sm text-gray-500 mb-6">正在為 <span className="font-bold text-blue-600">{selectedUser.dealerProfile.companyName}</span> 儲值</p>
                <div className="space-y-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">儲值金額 (NT$)</label><input type="number" autoFocus className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg font-mono" placeholder="例如：100000" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} /><p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> 單筆上限：{selectedUser.dealerProfile.level === 'A' ? '20萬' : '10萬'}</p></div>
                  <div className="flex gap-3 mt-6"><button onClick={closeModal} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">取消</button><button onClick={handleDeposit} disabled={isSubmitting} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold disabled:opacity-70">{isSubmitting ? '處理中...' : '確認儲值'}</button></div>
                </div>
              </>
            )}

            {modalMode === 'level' && (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-1">修改會員等級</h3>
                <p className="text-sm text-gray-500 mb-6">調整 <span className="font-bold text-blue-600">{selectedUser.dealerProfile.companyName}</span> 的權限</p>
                <div className="space-y-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">選擇新等級</label><div className="grid grid-cols-3 gap-3">{['A', 'B', 'C'].map(lvl => (<button key={lvl} onClick={() => setNewLevel(lvl)} className={clsx("py-3 border-2 rounded-xl font-bold text-lg transition-all", newLevel === lvl ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-gray-300 text-gray-600")}>{lvl} 級</button>))}</div></div>
                  <div className="flex gap-3 mt-6"><button onClick={closeModal} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">取消</button><button onClick={handleLevelChange} disabled={isSubmitting} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold disabled:opacity-70">{isSubmitting ? '儲存中...' : '確認修改'}</button></div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}