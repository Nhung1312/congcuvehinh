import React from 'react';
import { X, HelpCircle, Copy, Printer, CheckCircle2, FileText } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Hướng dẫn sử dụng & Mẹo chèn Word / Đề thi
              </h3>
              <p className="text-xs text-slate-500">
                Tối ưu quy trình soạn giáo án và đề thi Toán THCS
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
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs text-slate-700 leading-relaxed">
          {/* Mẹo 1: Copy thẳng vào Word */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-start gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-md shrink-0">
              <Copy className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-emerald-900 text-xs mb-1">
                Cách 1: Sao chép 1-Click dán thẳng vào Word (Nhanh nhất)
              </h4>
              <p className="text-emerald-800">
                Nhấn nút xanh lá <strong>"Sao chép Hình (Word)"</strong> ở thanh trên cùng. Sau đó mở Word hoặc PowerPoint và chỉ cần nhấn <strong>Ctrl + V</strong>. Hình sẽ dán vào với độ phân giải siêu nét (300 DPI), không bị mờ nhòe.
              </p>
            </div>
          </div>

          {/* Mẹo 2: Chế độ In đề đen trắng */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
            <div className="p-2 bg-slate-200 text-slate-700 rounded-md shrink-0">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs mb-1">
                Cách 2: Sử dụng "Chế độ In Đề" cho máy in đen trắng
              </h4>
              <p className="text-slate-600">
                Bật nút <strong>"Chế độ In Đề"</strong> trên thanh công cụ để chuyển toàn bộ màu sắc thành các họa tiết hoa văn sọc xiên, chấm bi, lưới caro chuẩn SGK. Khi in trên máy in đen trắng (photocopy), học sinh vẫn nhìn rõ từng miền số liệu.
              </p>
            </div>
          </div>

          {/* Mẹo 3: Khóa tỉ lệ % */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-md shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-blue-900 text-xs mb-1">
                Khóa tỉ lệ quạt tròn tự động cân bằng 100%
              </h4>
              <p className="text-blue-800">
                Khi chỉnh sửa biểu đồ quạt tròn, bạn có thể nhấn biểu tượng chiếc khóa ở nhóm đã cố định số liệu (ví dụ: nhóm A = 40%). Các nhóm còn lại sẽ tự động bù trừ chia đều để tổng luôn bằng đúng 100%.
              </p>
            </div>
          </div>

          {/* Mẹo 4: Xuất Vector SVG */}
          <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-lg flex items-start gap-3">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-md shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-purple-900 text-xs mb-1">
                Chèn trực tiếp file SVG vào Word
              </h4>
              <p className="text-purple-800">
                Từ Microsoft Word 2016 / 2019 / Office 365, bạn có thể tải file SVG và kéo thả trực tiếp vào Word. Bạn có thể phóng to thu nhỏ bao nhiêu tùy thích mà đường nét vẫn sắc lẹm tuyệt đối.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-md"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
};
