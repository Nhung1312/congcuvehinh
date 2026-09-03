import React, { useEffect, useState } from 'react';
import {
  X,
  FolderOpen,
  Trash2,
  Copy,
  Calendar,
  ArrowRight,
  Cloud,
  HardDrive,
  RefreshCw,
  UploadCloud,
  Lock,
  User,
  Check,
} from 'lucide-react';
import { ChartDocument } from '../types';
import { storage } from '../storage/storageService';
import { cloudStorage } from '../storage/cloudStorageService';
import { authService, UserProfile } from '../storage/authService';

interface SavedProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDoc: (doc: ChartDocument) => void;
  currentUser: UserProfile | null;
  onOpenAuthModal: () => void;
  onShowToast?: (msg: string) => void;
}

export const SavedProjectsModal: React.FC<SavedProjectsModalProps> = ({
  isOpen,
  onClose,
  onSelectDoc,
  currentUser,
  onOpenAuthModal,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'local' | 'cloud'>('local');
  const [localDocs, setLocalDocs] = useState<ChartDocument[]>([]);
  const [cloudDocs, setCloudDocs] = useState<ChartDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadAllDocs = async () => {
    setLoading(true);
    try {
      const locals = await storage.getAll();
      setLocalDocs(locals);

      if (currentUser) {
        const clouds = await cloudStorage.getCloudDocs(currentUser.id);
        setCloudDocs(clouds);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAllDocs();
    }
  }, [isOpen, currentUser]);

  const handleDelete = async (id: string, isCloud: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Bạn có chắc muốn xóa hình vẽ này khỏi ${isCloud ? 'Đám mây' : 'máy'} không?`)) {
      if (isCloud) {
        await cloudStorage.deleteFromCloud(id);
      } else {
        await storage.delete(id);
      }
      loadAllDocs();
    }
  };

  const handleDuplicate = async (id: string, isCloud: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCloud) {
      const doc = cloudDocs.find((d) => d.id === id);
      if (doc) {
        const copyDoc: ChartDocument = {
          ...doc,
          id: 'doc_cloud_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          title: `${doc.title} (Bản sao Cloud)`,
          updatedAt: Date.now(),
        };
        await cloudStorage.saveToCloud(copyDoc);
      }
    } else {
      await storage.duplicate(id);
    }
    loadAllDocs();
  };

  // Đồng bộ toàn bộ tài liệu từ máy lên đám mây
  const handleSyncToCloud = async () => {
    if (!currentUser) {
      onOpenAuthModal();
      return;
    }
    setSyncing(true);
    try {
      const count = await cloudStorage.syncAllLocalToCloud(localDocs, currentUser.id);
      await loadAllDocs();
      if (onShowToast) {
        onShowToast(`Đã đồng bộ thành công ${count} hình vẽ lên Đám mây!`);
      }
    } finally {
      setSyncing(false);
    }
  };

  // Lưu 1 tài liệu local lên đám mây
  const handleUploadSingleToCloud = async (doc: ChartDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      onOpenAuthModal();
      return;
    }
    await cloudStorage.saveToCloud(doc, currentUser.id);
    await loadAllDocs();
    if (onShowToast) {
      onShowToast(`Đã tải hình "${doc.title}" lên Đám mây!`);
    }
  };

  if (!isOpen) return null;

  const currentList = activeTab === 'local' ? localDocs : cloudDocs;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-100 text-purple-800 rounded-lg">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Kho Hình Vẽ Của Thầy/Cô
              </h3>
              <p className="text-xs text-slate-500">
                Quản lý hình vẽ lưu cục bộ trên máy và đồng bộ đám mây đa thiết bị
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 pb-2 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('local')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'local'
                  ? 'bg-white text-slate-800 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <HardDrive className="w-4 h-4 text-purple-600" />
              <span>Trên máy này ({localDocs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('cloud')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'cloud'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Cloud className="w-4 h-4 text-blue-600" />
              <span>Lưu trữ Đám mây {currentUser ? `(${cloudDocs.length})` : ''}</span>
              {!currentUser && (
                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-normal">
                  Cần đăng nhập
                </span>
              )}
            </button>
          </div>

          {/* Nút Đồng bộ lên Cloud */}
          {activeTab === 'local' && localDocs.length > 0 && (
            <button
              onClick={handleSyncToCloud}
              disabled={syncing}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md border border-indigo-200 transition"
              title="Đồng bộ tất cả hình vẽ trên máy này lên tài khoản đám mây"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{syncing ? 'Đang tải...' : 'Đồng bộ lên Cloud'}</span>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {activeTab === 'cloud' && !currentUser ? (
            <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <Cloud className="w-12 h-12 text-blue-400 mx-auto mb-2 opacity-80" />
              <h4 className="text-sm font-bold text-slate-800 mb-1">
                Lưu Trữ Đám Mây Chưa Được Kích Hoạt
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Đăng nhập hoặc đăng ký (tặng 15 ngày dùng thử) để lưu trữ hình vẽ trên Đám mây và mở lại dễ dàng trên mọi thiết bị.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenAuthModal();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition"
              >
                Đăng Nhập / Đăng Ký Ngay
              </button>
            </div>
          ) : currentList.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              {activeTab === 'cloud'
                ? 'Chưa có hình vẽ nào trên Đám mây. Thầy/Cô có thể nhấn "Đồng bộ lên Cloud" từ tab máy này hoặc bấm nút Lưu khi vẽ!'
                : 'Chưa có hình vẽ nào được lưu trên máy. Bạn hãy nhấn nút "Lưu" ở góc trên để lưu lại hình đang vẽ nhé!'}
            </div>
          ) : (
            currentList.map((doc) => (
              <div
                key={doc.id}
                onClick={() => {
                  onSelectDoc(doc);
                  onClose();
                }}
                className="p-3.5 rounded-lg border border-slate-200 hover:border-purple-500 hover:shadow-xs transition cursor-pointer bg-white flex items-center justify-between gap-4 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        activeTab === 'cloud'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-purple-50 text-purple-700'
                      }`}
                    >
                      {doc.type}
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-purple-700">
                      {doc.title || 'Hình không tiêu đề'}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {doc.updatedAt
                        ? new Date(doc.updatedAt).toLocaleString('vi-VN')
                        : 'Không rõ'}
                    </span>
                    {activeTab === 'cloud' && (
                      <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded font-medium flex items-center gap-0.5">
                        <Cloud className="w-2.5 h-2.5" />
                        Đám mây
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {activeTab === 'local' && currentUser && (
                    <button
                      onClick={(e) => handleUploadSingleToCloud(doc, e)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                      title="Tải riêng hình này lên Cloud"
                    >
                      <UploadCloud className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={(e) => handleDuplicate(doc.id, activeTab === 'cloud', e)}
                    className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                    title="Nhân bản"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => handleDelete(doc.id, activeTab === 'cloud', e)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button className="p-1.5 text-slate-400 group-hover:text-purple-600">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            {currentUser ? (
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Đang dùng tài khoản: <b>{currentUser.fullName}</b>
              </span>
            ) : (
              <span>Chưa đăng nhập tài khoản đám mây</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
