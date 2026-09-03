import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Lock,
  Phone,
  Sparkles,
  Cloud,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Crown,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { authService, UserProfile, TrialStatus } from '../storage/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  trialStatus: TrialStatus;
  onAuthSuccess: (user: UserProfile) => void;
  onLogout: () => void;
  onOpenSubscriptionModal: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  trialStatus,
  onAuthSuccess,
  onLogout,
  onOpenSubscriptionModal,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const user = await authService.login(email, password);
      setSuccessMsg(`Đăng nhập thành công! Chào mừng ${user.fullName}.`);
      setTimeout(() => {
        onAuthSuccess(user);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Đăng nhập thất bại, vui lòng kiểm tra lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const user = await authService.register(email, password, fullName, phone);
      setSuccessMsg(`Tạo tài khoản thành công! Thầy/Cô được tặng 15 ngày trải nghiệm đầy đủ.`);
      setTimeout(() => {
        onAuthSuccess(user);
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Đăng ký thất bại, vui lòng kiểm tra lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-150">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Khi đã đăng nhập: Hiển thị Profile */}
        {currentUser ? (
          <div className="p-6 space-y-5">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto text-2xl font-bold shadow-md ring-4 ring-blue-50 mb-3">
                {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'GV'}
              </div>
              <h3 className="text-lg font-bold text-slate-800">{currentUser.fullName}</h3>
              <p className="text-xs text-slate-500">{currentUser.email}</p>
            </div>

            {/* Thẻ trạng thái Bản quyền / Dùng thử */}
            <div
              className={`p-4 rounded-xl border ${
                trialStatus.isVip
                  ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-900'
                  : trialStatus.isExpired
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {trialStatus.isVip ? (
                    <Crown className="w-5 h-5 text-amber-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-blue-600" />
                  )}
                  <span className="font-bold text-sm">
                    {trialStatus.isVip ? 'Tài Khoản VIP Trọn Đời' : 'Gói Trải Nghiệm Dùng Thử'}
                  </span>
                </div>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    trialStatus.isVip
                      ? 'bg-amber-200/80 text-amber-900'
                      : trialStatus.isExpired
                      ? 'bg-rose-200 text-rose-800'
                      : 'bg-blue-200 text-blue-800'
                  }`}
                >
                  {trialStatus.statusText}
                </span>
              </div>

              {!trialStatus.isVip && (
                <div className="mt-3 pt-3 border-t border-blue-200/60 text-xs flex items-center justify-between">
                  <span>Thời hạn dùng thử: 15 ngày</span>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSubscriptionModal();
                    }}
                    className="font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 underline"
                  >
                    <span>Nâng cấp VIP</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Tính năng đám mây */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <Cloud className="w-4 h-4 text-indigo-600" />
                <span>Trạng thái Đồng bộ Đám mây (Cloud Storage)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Tất cả hình vẽ lưu trên Đám mây sẽ tự động đồng bộ khi thầy cô đăng nhập trên máy tính trường, máy tính nhà hoặc laptop cá nhân.
              </p>
            </div>

            {/* Nút hành động */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenSubscriptionModal();
                }}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition"
              >
                <Crown className="w-4 h-4 text-amber-300" />
                <span>Nâng cấp / Nhập mã VIP</span>
              </button>

              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        ) : (
          /* Khi chưa đăng nhập: Form Đăng nhập / Đăng ký 15 ngày */
          <div>
            {/* Header Dialog */}
            <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-6 text-white text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center mx-auto mb-2 text-blue-300">
                <Cloud className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Đăng Nhập & Lưu Trữ Đám Mây</h3>
              <p className="text-xs text-blue-200/80 mt-1">
                Lưu trữ hình vẽ Toán THCS an toàn và truy cập trên mọi thiết bị
              </p>

              {/* Tabs */}
              <div className="flex bg-white/10 rounded-lg p-1 mt-4 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`flex-1 py-1.5 rounded-md transition ${
                    tab === 'login' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-blue-200 hover:text-white'
                  }`}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('register');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`flex-1 py-1.5 rounded-md transition flex items-center justify-center gap-1 ${
                    tab === 'register' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-blue-200 hover:text-white'
                  }`}
                >
                  <span>Đăng ký mới</span>
                  <span className="bg-amber-400 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
                    15 ngày
                  </span>
                </button>
              </div>
            </div>

            {/* Form Body */}
            <div className="p-6">
              {tab === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email đăng nhập:</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="thayco.toanthcs@gmail.com"
                        className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">Mật khẩu:</label>
                      <button
                        type="button"
                        onClick={() => alert('Thầy/Cô vui lòng liên hệ Zalo 0775172026 để được cấp lại mật khẩu.')}
                        className="text-[11px] text-blue-600 hover:underline"
                      >
                        Quên mật khẩu?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center justify-center gap-2"
                  >
                    {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
                  </button>

                  <div className="text-center pt-2">
                    <span className="text-xs text-slate-500">Chưa có tài khoản? </span>
                    <button
                      type="button"
                      onClick={() => setTab('register')}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      Đăng ký nhận 15 ngày dùng thử ngay
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-3.5">
                  {/* Banner ưu đãi */}
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2.5 text-xs text-amber-900">
                    <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="font-bold">Tặng 15 ngày trải nghiệm đầy đủ!</p>
                      <p className="text-[11px] text-amber-800">
                        Sử dụng toàn bộ công cụ hình học, AI dựng hình, xuất Word siêu nét và lưu trữ đám mây.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên Thầy/Cô:</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Cô Nguyễn Thị Nhung"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email:</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nguyennhung.toan@gmail.com"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại / Zalo:</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0987xxxxxx"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu (tối thiểu 6 ký tự):</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center justify-center gap-2 mt-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-300" />
                    <span>{loading ? 'Đang khởi tạo...' : 'Đăng Ký & Nhận 15 Ngày Dùng Thử'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
