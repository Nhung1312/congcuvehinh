import React, { useState } from 'react';
import {
  X,
  QrCode,
  Copy,
  Check,
  Crown,
  Sparkles,
  ShieldCheck,
  CreditCard,
  PhoneCall,
  MessageCircle,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { authService, UserProfile, TrialStatus, ENABLE_TRIAL_LIMIT } from '../storage/authService';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  trialStatus: TrialStatus;
  onActivateSuccess: () => void;
  forcedExpired?: boolean; // Nếu hết hạn 15 ngày
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  trialStatus,
  onActivateSuccess,
  forcedExpired = false,
}) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [emailInput, setEmailInput] = useState(currentUser?.email || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);
  const [senderName, setSenderName] = useState(currentUser?.fullName || '');
  const [senderPhone, setSenderPhone] = useState(currentUser?.phone || '');

  if (!isOpen) return null;

  // Thông tin tài khoản ngân hàng của tác giả (từ ảnh VietQR)
  const BANK_INFO = {
    bankName: 'AGRIBANK',
    bankFullName: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam',
    accountName: 'NGUYEN THI NHUNG',
    accountNumber: '3522215050349',
    amount: '365.000',
    amountNum: 365000,
    note: `TOAN THCS ${currentUser?.phone || currentUser?.email?.split('@')[0] || 'GIAOVIEN'}`,
  };

  // URL ảnh VietQR Napas chuẩn
  const qrUrl = `https://img.vietqr.io/image/agribank-${BANK_INFO.accountNumber}-compact2.png?amount=${BANK_INFO.amountNum}&addInfo=${encodeURIComponent(
    BANK_INFO.note
  )}&accountName=${encodeURIComponent(BANK_INFO.accountName)}`;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Xử lý kích hoạt qua mã bản quyền
  const handleActivateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const email = emailInput.trim() || currentUser?.email || 'user@toanthcs.vn';
      const res = await authService.activateLicense(licenseKey, email);
      setSuccessMsg(res.message);
      setTimeout(() => {
        onActivateSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Có lỗi xảy ra khi kích hoạt mã!');
    }
  };

  // Xác nhận đã chuyển khoản
  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    authService.markAsPendingTransfer({
      name: senderName || 'Thầy/Cô',
      email: emailInput || currentUser?.email || '',
      phone: senderPhone || '',
      note: BANK_INFO.note,
    });

    // Kích hoạt ngay chế độ đặc quyền dùng tiếp cho giáo viên đã chuyển khoản
    authService.activateLicense('THCS-AGRIBANK-AUTO', emailInput || currentUser?.email || '');
    setSuccessMsg('Đã ghi nhận thông tin chuyển khoản! Hệ thống đã tự động mở khóa quyền VIP cho Thầy/Cô.');
    setTimeout(() => {
      onActivateSuccess();
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-auto flex flex-col relative animate-in fade-in zoom-in-95 duration-150">
        {/* Nút đóng (chỉ cho phép đóng nếu chưa bị khóa cứng hoặc người dùng muốn đóng để xem lại) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Modal */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white text-center sm:text-left sm:flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <span className="p-1 bg-amber-400 text-slate-900 rounded-md font-bold text-xs flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 fill-current" />
                <span>BẢN QUYỀN VIP</span>
              </span>
              <span className="text-xs text-blue-200">Sử dụng vĩnh viễn không thời hạn</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white">
              {ENABLE_TRIAL_LIMIT && (forcedExpired || trialStatus.isExpired)
                ? `HẾT HẠN DÙNG THỬ ${trialStatus.totalDays} NGÀY`
                : 'NÂNG CẤP BẢN QUYỀN TRỌN ĐỜI'}
            </h2>
            <p className="text-xs text-blue-200/90 mt-1 max-w-md">
              {ENABLE_TRIAL_LIMIT && (forcedExpired || trialStatus.isExpired)
                ? `Thời gian ${trialStatus.totalDays} ngày trải nghiệm miễn phí đã kết thúc. Thầy/Cô vui lòng chuyển khoản để mở khóa vĩnh viễn mọi tính năng vẽ hình & lưu trữ đám mây.`
                : 'Mở khóa không giới hạn: AI Dựng Hình thông minh, Xuất ảnh Word 600 DPI, Lưu trữ Đám mây và Cập nhật trọn đời.'}
            </p>
          </div>

          <div className="hidden sm:block text-right shrink-0 bg-white/10 p-3 rounded-xl border border-white/10">
            <span className="text-[11px] text-blue-200 block uppercase font-medium">Giá trọn đời</span>
            <span className="text-2xl font-black text-amber-300">365.000 đ</span>
            <span className="text-[10px] text-emerald-300 block font-medium">Thanh toán 1 lần duy nhất</span>
          </div>
        </div>

        {/* Thân Modal */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* CỘT TRÁI: Mã VietQR Quét Nhanh */}
          <div className="md:col-span-6 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-blue-600" />
                Quét mã VietQR (Mọi Ngân Hàng)
              </span>
            </div>

            {/* Khung ảnh QR */}
            <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm relative group mb-3">
              <img
                src={qrUrl}
                alt="Mã QR Agribank NGUYEN THI NHUNG"
                className="w-52 h-52 object-contain mx-auto rounded-lg"
                onError={(e) => {
                  // Fallback ảnh QR nếu API ảnh chậm
                  e.currentTarget.src = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=00020101021238540010A00000072701240006970405011435222150503490208QRIBFTTA5303704540636500005802VN62250821TOAN%20THCS%20GIAOVIEN6304';
                }}
              />
              <div className="absolute inset-x-2 bottom-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] py-1 rounded font-medium opacity-0 group-hover:opacity-100 transition">
                Mở app Ngân hàng / MoMo quét mã
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              Tự động điền đúng STK, Tên người nhận và Số tiền 365.000đ
            </p>
          </div>

          {/* CỘT PHẢI: Thông tin chuyển khoản chi tiết & Form nhập mã */}
          <div className="md:col-span-6 flex flex-col justify-between space-y-4">
            {/* Hộp thông tin chuyển khoản Agribank */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-xs space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-blue-200/70">
                <span className="text-slate-500 font-medium">Ngân hàng:</span>
                <span className="font-bold text-blue-900 flex items-center gap-1">
                  <span>AGRIBANK</span>
                  <span className="text-[10px] text-slate-500 font-normal">(Nông Nghiệp)</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Chủ tài khoản:</span>
                <span className="font-bold text-slate-800 uppercase">{BANK_INFO.accountName}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Số tài khoản:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-blue-700 text-sm">
                    {BANK_INFO.accountNumber}
                  </span>
                  <button
                    onClick={() => copyToClipboard(BANK_INFO.accountNumber, 'stk')}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded transition"
                    title="Sao chép số tài khoản"
                  >
                    {copiedField === 'stk' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Số tiền:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-amber-700 text-sm">{BANK_INFO.amount} đ</span>
                  <button
                    onClick={() => copyToClipboard(BANK_INFO.amountNum.toString(), 'amount')}
                    className="p-1 text-slate-500 hover:bg-blue-100 rounded transition"
                    title="Sao chép số tiền"
                  >
                    {copiedField === 'amount' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-blue-200/70">
                <span className="text-slate-500 font-medium">Nội dung CK:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-slate-700 text-[11px] bg-white px-2 py-0.5 rounded border border-blue-200">
                    {BANK_INFO.note}
                  </span>
                  <button
                    onClick={() => copyToClipboard(BANK_INFO.note, 'note')}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded transition"
                    title="Sao chép nội dung"
                  >
                    {copiedField === 'note' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs / Switcher giữa Nhập Mã Kích Hoạt vs Xác Nhận Đã Chuyển Khoản */}
            {!showTransferConfirm ? (
              <form onSubmit={handleActivateKey} className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Đã có Mã Bản Quyền (License Key)?
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowTransferConfirm(true)}
                      className="text-[11px] text-blue-600 hover:underline font-medium"
                    >
                      Tôi vừa chuyển khoản xong →
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={licenseKey}
                      onChange={(e) => setLicenseKey(e.target.value)}
                      placeholder="Nhập mã (VD: VIP-THCS-2025...)"
                      className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition shadow-xs"
                    >
                      Kích Hoạt
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] rounded-lg flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] rounded-lg flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 flex items-center justify-between">
                  <span>Hỗ trợ cấp mã kích hoạt nhanh qua Zalo:</span>
                  <a
                    href="https://zalo.me/0775172026"
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>0775172026</span>
                  </a>
                </div>
              </form>
            ) : (
              <form onSubmit={handleConfirmTransfer} className="space-y-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Xác nhận vừa chuyển khoản
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowTransferConfirm(false)}
                    className="text-[11px] text-slate-500 hover:underline"
                  >
                    Quay lại nhập mã
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Tên người gửi:</label>
                    <input
                      type="text"
                      required
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Cô Nhung"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Số điện thoại / Zalo:</label>
                    <input
                      type="tel"
                      required
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      placeholder="0987xxxxxx"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Tôi Đã Chuyển Khoản 365.000đ - Mở Khóa VIP</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer Quyền lợi & Cam kết */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Bản quyền vĩnh viễn trọn đời
            </span>
            <span className="flex items-center gap-1 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Đồng bộ đám mây đa thiết bị
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            Tác giả: Nguyễn Thị Nhung • Hỗ trợ Zalo: 0775172026
          </div>
        </div>
      </div>
    </div>
  );
};
