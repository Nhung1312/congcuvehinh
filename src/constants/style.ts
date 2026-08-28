// SGK Math Style Standards for Vietnamese Lower Secondary Education (THCS)

export const DEFAULT_MATH_FONT = '"Times New Roman", "DejaVu Serif", "STIXGeneral", serif';

export const FONT_OPTIONS = [
  { label: 'Times New Roman (Chuẩn SGK Toán)', value: '"Times New Roman", "DejaVu Serif", "STIXGeneral", serif' },
  { label: 'Cambria Math', value: '"Cambria Math", "Cambria", serif' },
  { label: 'Arial (Hiện đại)', value: 'Arial, "Helvetica Neue", sans-serif' },
  { label: 'Computer Modern (LaTeX)', value: '"Computer Modern", "Latin Modern Math", serif' },
];

export const getMathFontFamily = (customFont?: string): string => {
  if (!customFont || customFont === 'Times New Roman' || customFont === 'Times New Roman, serif') {
    return DEFAULT_MATH_FONT;
  }
  return customFont;
};

export const SGK_STYLE = {
  strokeWidth: {
    main: 1.4,        // Đường nét chính (cạnh tam giác, hình học, thanh bar)
    axis: 1.4,        // Trục tọa độ, trục số
    curve: 1.8,       // Đồ thị hàm số, đường cong
    tick: 1.1,        // Vạch chia trục
    grid: 0.8,        // Lưới ô vuông
    projection: 1.1,  // Nét đứt gióng tọa độ / đường cao
    thin: 0.8,
  },
  fontSize: {
    title: 17,        // Tiêu đề biểu đồ
    axisTitle: 15,    // Tên trục x, y, O
    label: 14,        // Nhãn danh mục, tên điểm A, B, C
    dataLabel: 13,    // Số liệu trên cột/đoạn/hình
    tick: 13,         // Số trên trục tọa độ / trục số
    legend: 13,       // Chú giải
    small: 11,        // Ghi chú nhỏ
  },
  margin: {
    topWithTitle: 54,
    topNoTitle: 32,
    titleY: 30,
    bottom: 45,
    left: 55,
    right: 40,
  },
  grid: {
    color: '#e2e8f0',
    colorDarker: '#cbd5e1',
    dashArray: '2 2',
  },
  colors: {
    axis: '#000000',
    text: '#000000',
    background: '#ffffff',
    examFill: '#e2e8f0',
    examPatternStroke: '#000000',
  },
  palette: [
    '#2563eb', // Xanh dương
    '#dc2626', // Đỏ
    '#16a34a', // Xanh lá
    '#ea580c', // Cam
    '#9333ea', // Tím
    '#0891b2', // Lam ngọc
    '#ca8a04', // Vàng đậm
    '#e11d48', // Hồng thắm
  ],
};
