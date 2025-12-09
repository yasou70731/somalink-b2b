'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation'; // ✨ 新增 usePathname
import { useState, useEffect } from 'react';
// 引入圖示
import { ShoppingCart, Search, User, LogOut, History, Wallet, UserCog, Package, Menu, X, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import Modal from '@/components/Modal';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname(); // ✨ 取得當前路徑
  const { cartCount, clearCart } = useCart();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // ✨ 抽取出檢查邏輯，並確保每次路徑改變時都執行
    const checkAuth = () => {
      const storedUser = localStorage.getItem('somalink_user') || sessionStorage.getItem('somalink_user');
      if (storedUser) {
        try { 
          setUser(JSON.parse(storedUser)); 
        } catch (e) {
          setUser(null);
        }
      } else {
        setUser(null); // 確保登出後狀態即時清空
      }
    };

    checkAuth();
  }, [pathname]); // ✨ 關鍵修正：將 pathname 加入依賴，切換頁面時自動更新狀態

  const handleLogout = () => {
    localStorage.removeItem('somalink_token');
    localStorage.removeItem('somalink_user');
    sessionStorage.removeItem('somalink_token');
    sessionStorage.removeItem('somalink_user');
    
    clearCart();

    setUser(null);
    setShowLogoutModal(false);
    router.push('/login'); 
  };

  // 受保護的導航處理 (增加審核狀態檢查)
  const handleProtectedNav = (path: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    // 如果帳號尚未開通 (isActive 為 false)，阻止進入並顯示提示
    if (user.isActive === false) {
      setShowPendingModal(true);
      return;
    }

    router.push(path);
  };

  if (!mounted) return <div className="h-16 bg-white border-b border-gray-200"></div>;

  return (
    <>
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full gap-4">
            
            {/* 1. 左側 LOGO */}
            <Link href={user ? "/portal" : "/"} className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity">
              <div className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-blue-200 shadow-md">
                S
              </div>
              <span className="font-bold text-xl tracking-tight text-gray-900 hidden sm:block">松成有限公司</span>
            </Link>

            {/* 2. 中間 搜尋框 */}
            <div className="flex-1 max-w-md hidden md:block relative">
              <input 
                type="text" 
                placeholder="搜尋產品型號..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-full text-sm shadow-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none placeholder:text-gray-400 text-gray-800" 
              />
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
            </div>

            {/* 3. 右側 功能選單 (電腦版) */}
            <div className="hidden md:flex items-center gap-3 sm:gap-5">
              
              {/* 歷史訂單 */}
              <button 
                onClick={() => handleProtectedNav('/orders')}
                className="flex flex-col items-center text-gray-500 hover:text-blue-600 transition-colors group"
              >
                <History className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-medium">歷史訂單</span>
              </button>

              {/* 購物車 */}
              <button 
                onClick={() => handleProtectedNav('/cart')}
                className="relative flex flex-col items-center text-gray-500 hover:text-blue-600 transition-colors group"
              >
                <div className="relative">
                  <ShoppingCart className="w-5 h-5" />
                  {user && cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white animate-in zoom-in duration-300">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium mt-0.5">購物車</span>
              </button>

              <div className="h-8 w-px bg-gray-200 mx-1"></div>

              {/* 會員區域 */}
              {user ? (
                <div className="flex items-center gap-2">
                  
                  {/* 錢包餘額 (僅 A/B 級顯示) */}
                  {(user.dealerProfile?.level === 'A' || user.dealerProfile?.level === 'B') && (
                    <div className="flex flex-col items-end mr-2 px-3 py-1 bg-blue-50 rounded-lg border border-blue-100">
                      <span className="text-[10px] text-gray-500 flex items-center gap-1 font-medium">
                        <Wallet className="w-3 h-3 text-blue-500" /> 錢包餘額
                      </span>
                      <span className="text-sm font-bold text-blue-700 font-mono">
                        ${Number(user.dealerProfile?.walletBalance || 0).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* 公司名稱 + Email */}
                  <div className="text-right mr-2">
                    <div className="flex items-center justify-end gap-1">
                      <p className="text-xs font-bold text-gray-900 truncate max-w-[150px]">
                        {user.dealerProfile?.companyName || '未設定公司名稱'}
                      </p>
                      {/* 若未開通，顯示標籤 */}
                      {user.isActive === false && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded font-bold border border-yellow-200 flex items-center gap-0.5">
                          <AlertTriangle className="w-3 h-3" /> 審核中
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500 truncate max-w-[150px]">
                      {user.email}
                    </p>
                  </div>

                  <Link href="/profile" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="會員資料設定">
                    <UserCog className="w-5 h-5" />
                  </Link>

                  <button onClick={() => setShowLogoutModal(true)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="登出">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-bold text-sm px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <User className="w-4 h-4" />
                    登入
                  </Link>
                  <Link href="/register" className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black transition-colors shadow-md">
                    註冊經銷
                  </Link>
                </div>
              )}
            </div>

            {/* 手機版漢堡選單按鈕 */}
            <div className="flex items-center md:hidden">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                  {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>
          </div>
        </div>

        {/* 手機版下拉選單 */}
        {isMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-100 p-4 space-y-4 shadow-lg absolute w-full z-50">
              <Link href="/portal" className="block text-gray-600 font-medium py-2 px-2 hover:bg-gray-50 rounded-lg">
                產品系列
              </Link>
              {user ? (
                <>
                  <button onClick={() => handleProtectedNav('/orders')} className="w-full flex items-center gap-2 text-gray-600 font-medium py-2 px-2 hover:bg-gray-50 rounded-lg text-left">
                    <History className="w-4 h-4" /> 歷史訂單
                  </button>
                  <button onClick={() => handleProtectedNav('/cart')} className="w-full flex items-center gap-2 text-gray-600 font-medium py-2 px-2 hover:bg-gray-50 rounded-lg text-left">
                    <ShoppingCart className="w-4 h-4" /> 購物車 ({cartCount})
                  </button>
                  <Link href="/profile" className="flex items-center gap-2 text-gray-600 font-medium py-2 px-2 hover:bg-gray-50 rounded-lg">
                    <UserCog className="w-4 h-4" /> 會員資料
                  </Link>
                  
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 mb-4 px-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                        {user.name?.[0] || 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-gray-900">{user.dealerProfile?.companyName || user.name}</p>
                          {user.isActive === false && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded border border-yellow-200">
                              待審核
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowLogoutModal(true)} 
                      className="w-full text-left flex items-center gap-2 text-red-500 text-sm font-bold py-2 px-2 hover:bg-red-50 rounded-lg"
                    >
                      <LogOut className="w-4 h-4" /> 登出系統
                    </button>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Link href="/login" className="text-center py-2.5 border border-gray-300 rounded-xl font-bold text-gray-700">
                    登入
                  </Link>
                  <Link href="/register" className="text-center py-2.5 bg-blue-600 text-white rounded-xl font-bold">
                    註冊
                  </Link>
                </div>
              )}
            </div>
        )}
      </nav>

      {/* 登出確認彈窗 */}
      <Modal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)}
        type="confirm"
        title="確定要登出嗎？"
        message="登出後系統將自動清空您的購物車。"
        confirmText="確認登出"
        onConfirm={handleLogout}
      />

      {/* 帳號審核中提示彈窗 */}
      <Modal 
        isOpen={showPendingModal}
        onClose={() => setShowPendingModal(false)}
        type="warning"
        title="帳號審核中"
        message={
          <div className="text-center">
            <p className="mb-2">您的經銷商資格目前正在審核中。</p>
            <p className="text-gray-500 text-xs">開通後您將會收到 Email 通知，屆時即可使用購物車與訂單功能。</p>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 text-left">
              <p className="font-bold mb-1">聯絡客服加速審核：</p>
              <p>電話：(02) 2345-6789</p>
              <p>Line ID：@somalink</p>
            </div>
          </div>
        }
        confirmText="了解"
      />
    </>
  );
}