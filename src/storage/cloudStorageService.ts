import { ChartDocument } from '../types';
import { supabase } from '../supabaseClient';
import { authService } from './authService';

export interface CloudDocumentMeta {
  id: string;
  userId: string;
  title: string;
  type: string;
  createdAt: number;
  updatedAt: number;
  doc: ChartDocument;
  syncStatus?: 'synced' | 'local_only' | 'cloud_only';
}

const CLOUD_STORAGE_PREFIX = 'toan_thcs_cloud_storage_';

export class CloudStorageService {
  // Lấy toàn bộ tài liệu trên Đám mây của người dùng
  async getCloudDocs(userId?: string): Promise<ChartDocument[]> {
    const user = authService.getCurrentUser();
    const effectiveUserId = userId || user?.id;
    if (!effectiveUserId) return [];

    // Thử truy vấn từ Supabase
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('updated_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((item: any) => item.content as ChartDocument);
      }
    } catch {
      // Offline fallback
    }

    // Đọc từ Cloud Storage phân vùng của User
    try {
      const key = CLOUD_STORAGE_PREFIX + effectiveUserId;
      const raw = localStorage.getItem(key);
      if (raw) {
        return JSON.parse(raw) as ChartDocument[];
      }
    } catch {
      // Ignored
    }

    return [];
  }

  // Lưu tài liệu lên đám mây
  async saveToCloud(doc: ChartDocument, userId?: string): Promise<void> {
    const user = authService.getCurrentUser();
    const effectiveUserId = userId || user?.id;
    if (!effectiveUserId) {
      throw new Error('Vui lòng đăng nhập để lưu trữ lên đám mây!');
    }

    const updatedDoc: ChartDocument = {
      ...doc,
      updatedAt: Date.now(),
    };

    // 1. Cập nhật phân vùng Cloud Storage của User
    const key = CLOUD_STORAGE_PREFIX + effectiveUserId;
    let list: ChartDocument[] = [];
    try {
      const raw = localStorage.getItem(key);
      if (raw) list = JSON.parse(raw);
    } catch {
      list = [];
    }

    const idx = list.findIndex((item) => item.id === updatedDoc.id);
    if (idx >= 0) {
      list[idx] = updatedDoc;
    } else {
      list.unshift(updatedDoc);
    }
    localStorage.setItem(key, JSON.stringify(list));

    // 2. Đồng bộ lên Supabase nếu có
    try {
      await supabase.from('documents').upsert({
        id: updatedDoc.id,
        user_id: effectiveUserId,
        title: updatedDoc.title,
        doc_type: updatedDoc.type,
        content: updatedDoc,
        updated_at: new Date(updatedDoc.updatedAt).toISOString(),
      });
    } catch {
      // Supabase offline/mock
    }
  }

  // Xóa tài liệu khỏi đám mây
  async deleteFromCloud(docId: string, userId?: string): Promise<void> {
    const user = authService.getCurrentUser();
    const effectiveUserId = userId || user?.id;
    if (!effectiveUserId) return;

    // 1. Xóa khỏi phân vùng User
    const key = CLOUD_STORAGE_PREFIX + effectiveUserId;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const list: ChartDocument[] = JSON.parse(raw);
        const filtered = list.filter((item) => item.id !== docId);
        localStorage.setItem(key, JSON.stringify(filtered));
      }
    } catch {
      // Ignored
    }

    // 2. Xóa khỏi Supabase
    try {
      await supabase
        .from('documents')
        .delete()
        .eq('id', docId)
        .eq('user_id', effectiveUserId);
    } catch {
      // Ignored
    }
  }

  // Đồng bộ tất cả tài liệu local lên cloud
  async syncAllLocalToCloud(localDocs: ChartDocument[], userId?: string): Promise<number> {
    const user = authService.getCurrentUser();
    const effectiveUserId = userId || user?.id;
    if (!effectiveUserId) return 0;

    let count = 0;
    for (const doc of localDocs) {
      await this.saveToCloud(doc, effectiveUserId);
      count++;
    }
    return count;
  }
}

export const cloudStorage = new CloudStorageService();
