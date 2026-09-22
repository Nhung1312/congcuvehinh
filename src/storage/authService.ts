import { supabase } from '../supabaseClient';
import { ENABLE_TRIAL_LIMIT, TRIAL_DAYS_COUNT } from '../config/trialConfig';

export { ENABLE_TRIAL_LIMIT, TRIAL_DAYS_COUNT };

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  createdAt: number;
  trialStartDate: number;
  trialDays: number; // Số ngày dùng thử khi bật trial
  isVip: boolean;    // Đã kích hoạt bản quyền
  vipActivatedAt?: number;
  licenseKey?: string;
}

export interface TrialStatus {
  isVip: boolean;
  daysRemaining: number;
  isExpired: boolean;
  totalDays: number;
  statusText: string;
  trialStartDate: number;
}

const CURRENT_USER_KEY = 'toan_thcs_auth_user_v1';
const ALL_USERS_KEY = 'toan_thcs_registered_users_v1';
const DEVICE_FIRST_USE_KEY = 'toan_thcs_device_first_use_v1';

// Lấy thời điểm mở app lần đầu trên thiết bị
export function getDeviceFirstUseTimestamp(): number {
  try {
    const saved = localStorage.getItem(DEVICE_FIRST_USE_KEY);
    if (saved) {
      const ts = parseInt(saved, 10);
      if (!isNaN(ts)) return ts;
    }
    const now = Date.now();
    localStorage.setItem(DEVICE_FIRST_USE_KEY, now.toString());
    return now;
  } catch {
    return Date.now();
  }
}

export class AuthService {
  // Lấy người dùng đang đăng nhập
  getCurrentUser(): UserProfile | null {
    try {
      const data = localStorage.getItem(CURRENT_USER_KEY);
      if (!data) return null;
      return JSON.parse(data) as UserProfile;
    } catch {
      return null;
    }
  }

  // Đăng ký tài khoản mới (được tặng 15 ngày dùng thử)
  async register(email: string, password: string, fullName: string, phone?: string): Promise<UserProfile> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) throw new Error('Vui lòng nhập email hợp lệ');
    if (!password || password.length < 6) throw new Error('Mật khẩu phải từ 6 ký tự trở lên');

    // Kiểm tra danh sách người dùng cục bộ
    const users = this.getAllLocalUsers();
    if (users.find(u => u.email === normalizedEmail)) {
      throw new Error('Email này đã được đăng ký. Vui lòng đăng nhập!');
    }

    const firstUse = getDeviceFirstUseTimestamp();
    const newUser: UserProfile = {
      id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      email: normalizedEmail,
      fullName: fullName.trim() || 'Thầy/Cô ' + normalizedEmail.split('@')[0],
      phone: phone?.trim(),
      createdAt: Date.now(),
      trialStartDate: firstUse, // Bắt đầu tính ngày dùng thử khi bật trial
      trialDays: TRIAL_DAYS_COUNT,
      isVip: false,
    };

    // Lưu vào database local
    users.push({ ...newUser, passwordHash: password });
    localStorage.setItem(ALL_USERS_KEY, JSON.stringify(users));
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));

    // Đồng bộ lên Supabase nếu có kết nối
    try {
      await supabase.from('profiles').insert([
        {
          id: newUser.id,
          email: newUser.email,
          full_name: newUser.fullName,
          phone: newUser.phone,
          trial_start_date: new Date(newUser.trialStartDate).toISOString(),
          is_vip: false,
        }
      ]);
    } catch {
      // Supabase offline/mock fallback
    }

    return newUser;
  }

  // Đăng nhập
  async login(email: string, password: string): Promise<UserProfile> {
    const normalizedEmail = email.trim().toLowerCase();
    const users = this.getAllLocalUsers();
    const found = users.find(u => u.email === normalizedEmail);

    if (found) {
      if (found.passwordHash && found.passwordHash !== password) {
        throw new Error('Mật khẩu không chính xác!');
      }
      const userProfile: UserProfile = {
        id: found.id,
        email: found.email,
        fullName: found.fullName,
        phone: found.phone,
        createdAt: found.createdAt,
        trialStartDate: found.trialStartDate || getDeviceFirstUseTimestamp(),
        trialDays: found.trialDays || 15,
        isVip: found.isVip || false,
        vipActivatedAt: found.vipActivatedAt,
        licenseKey: found.licenseKey,
      };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userProfile));
      return userProfile;
    }

    // Nếu người dùng chưa có trên máy, thử đăng nhập / kiểm tra Supabase
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', normalizedEmail)
        .single();

      if (!error && data) {
        const cloudUser: UserProfile = {
          id: data.id,
          email: data.email,
          fullName: data.full_name || data.email,
          phone: data.phone,
          createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
          trialStartDate: data.trial_start_date ? new Date(data.trial_start_date).getTime() : getDeviceFirstUseTimestamp(),
          trialDays: 15,
          isVip: data.is_vip || false,
        };
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(cloudUser));
        return cloudUser;
      }
    } catch {
      // Ignored
    }

    // Nếu là email mới hoàn toàn và nhập mật khẩu hợp lệ -> Tạo tài khoản nhanh
    return this.register(normalizedEmail, password, 'Thầy/Cô ' + normalizedEmail.split('@')[0]);
  }

  // Đăng xuất
  logout(): void {
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  // Kiểm tra thời hạn dùng thử & VIP
  getTrialStatus(user: UserProfile | null): TrialStatus {
    const totalDays = TRIAL_DAYS_COUNT;
    
    // Kiểm tra xem máy này đã kích hoạt VIP bằng email chưa
    const savedEmail = localStorage.getItem('user_licensed_email');
    const isLocalLicensed = Boolean(savedEmail && (!user || user.email === savedEmail));

    // [CÔNG TẮC] Khi tạm thời TẮT giới hạn dùng thử (ENABLE_TRIAL_LIMIT = false):
    // Cho phép tất cả người dùng sử dụng ứng dụng MIỄN PHÍ HOÀN TOÀN, không giới hạn thời gian và không bao giờ bị khóa.
    if (!ENABLE_TRIAL_LIMIT) {
      const isVip = Boolean(user?.isVip || isLocalLicensed);
      return {
        isVip,
        daysRemaining: 9999, // Không giới hạn
        isExpired: false,    // Không bao giờ hết hạn
        totalDays,
        statusText: isVip ? 'Bản quyền VIP Trọn đời' : 'Miễn phí hoàn toàn',
        trialStartDate: user?.trialStartDate || getDeviceFirstUseTimestamp(),
      };
    }

    // [CƠ CHẾ DÙNG THỬ CŨ] Khi bật lại giới hạn (ENABLE_TRIAL_LIMIT = true):
    if (user?.isVip || isLocalLicensed) {
      return {
        isVip: true,
        daysRemaining: 9999,
        isExpired: false,
        totalDays,
        statusText: 'Bản quyền VIP Trọn đời',
        trialStartDate: user?.trialStartDate || getDeviceFirstUseTimestamp(),
      };
    }

    const startDate = user?.trialStartDate || getDeviceFirstUseTimestamp();
    const elapsedMs = Date.now() - startDate;
    const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, totalDays - elapsedDays);
    const isExpired = daysRemaining <= 0;

    let statusText = '';
    if (isExpired) {
      statusText = `Hết hạn dùng thử ${totalDays} ngày`;
    } else {
      statusText = `Dùng thử: Còn ${daysRemaining} ngày`;
    }

    return {
      isVip: false,
      daysRemaining,
      isExpired,
      totalDays,
      statusText,
      trialStartDate: startDate,
    };
  }

  // Kích hoạt bản quyền qua mã License Key
  async activateLicense(key: string, email: string): Promise<{ success: boolean; message: string }> {
    const cleanKey = key.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanKey) {
      throw new Error('Vui lòng nhập mã bản quyền!');
    }

    // Danh sách mã bản quyền đặc quyền / VIP được cấp sẵn
    const MASTER_KEYS = [
      'VIP-THCS-2025',
      'TOAN-THCS-PRO',
      'AGRIBANK-3522215050349',
      'NGUYEN-THI-NHUNG-VIP',
      'VIP-365K-PRO',
      'VIP-299K-PRO',
    ];

    let isValid = MASTER_KEYS.includes(cleanKey);

    // Nếu không khớp master key, thử tra cứu bảng licenses của Supabase
    if (!isValid) {
      try {
        const { data, error } = await supabase
          .from('licenses')
          .select('*')
          .eq('license_key', cleanKey)
          .single();

        if (!error && data && !data.is_activated) {
          isValid = true;
          // Cập nhật trạng thái đã dùng
          await supabase
            .from('licenses')
            .update({ is_activated: true, owner_email: cleanEmail })
            .eq('license_key', cleanKey);
        }
      } catch {
        // Offline check
      }
    }

    // Kiểm tra định dạng mã chuẩn tự sinh (VD: THCS-XXXX-XXXX)
    if (!isValid && cleanKey.startsWith('THCS-') && cleanKey.length >= 10) {
      isValid = true;
    }

    if (!isValid) {
      throw new Error('Mã bản quyền không đúng hoặc đã được sử dụng. Vui lòng kiểm tra lại!');
    }

    // Cập nhật người dùng hiện tại
    const current = this.getCurrentUser();
    if (current) {
      current.isVip = true;
      current.vipActivatedAt = Date.now();
      current.licenseKey = cleanKey;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(current));
    }

    // Lưu cờ kích hoạt vào localStorage máy tính
    localStorage.setItem('user_licensed_email', cleanEmail || current?.email || 'licensed_user');
    localStorage.setItem('user_licensed_key', cleanKey);

    return {
      success: true,
      message: 'Kích hoạt bản quyền VIP thành công! Mọi tính năng và lưu trữ đám mây đã được mở khóa trọn đời.',
    };
  }

  // Tự động kích hoạt khi người dùng xác nhận chuyển khoản
  markAsPendingTransfer(transferInfo: { name: string; email: string; phone: string; note: string }): void {
    const PENDING_KEY = 'toan_thcs_pending_transfers';
    try {
      const list = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
      list.unshift({ ...transferInfo, timestamp: Date.now() });
      localStorage.setItem(PENDING_KEY, JSON.stringify(list));
    } catch {
      // Ignored
    }
  }

  private getAllLocalUsers(): any[] {
    try {
      const data = localStorage.getItem(ALL_USERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
}

export const authService = new AuthService();
