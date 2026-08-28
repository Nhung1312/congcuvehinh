import React, { useEffect, useState } from 'react';
import { X, FolderOpen, Trash2, Copy, Calendar, ArrowRight } from 'lucide-react';
import { ChartDocument } from '../types';
import { storage } from '../storage/storageService';

interface SavedProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDoc: (doc: ChartDocument) => void;
}

export const SavedProjectsModal: React.FC<SavedProjectsModalProps> = ({
  isOpen,
  onClose,
  onSelectDoc,
}) => {
  const [documents, setDocuments] = useState<ChartDocument[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDocs = async () => {
    setLoading(true);
    const docs = await storage.getAll();
    setDocuments(docs);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadDocs();
    }
  }, [isOpen]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Bạn có chắc muốn xóa hình vẽ đã lưu này không?')) {
      await storage.delete(id);
      loadDocs();
    }
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await storage.duplicate(id);
    loadDocs();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-100 text-purple-800 rounded-lg">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Hình vẽ đã lưu trên máy
              </h3>
              <p className="text-xs text-slate-500">
                Lưu trữ cục bộ an toàn, không sợ mất dữ liệu khi mất kết nối mạng
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

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {documents.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Chưa có hình vẽ nào được lưu. Bạn hãy nhấn nút "Lưu" ở góc trên để lưu lại hình đang vẽ nhé!
            </div>
          ) : (
            documents.map((doc) => (
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
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700">
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
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => handleDuplicate(doc.id, e)}
                    className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                    title="Nhân bản"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => handleDelete(doc.id, e)}
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
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
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
