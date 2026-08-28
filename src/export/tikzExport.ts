import { ChartDocument, Point2D } from '../types';

export const generateTikzCode = (doc: ChartDocument): string => {
  if (!doc.type.startsWith('GEOMETRY_')) {
    return '% Tính năng xuất TikZ hiện tại tối ưu nhất cho phần Hình Học Phẳng.\n% Vui lòng chọn một hình học để xuất code.';
  }

  // Tối ưu hệ số scale và tỷ lệ thu nhỏ pixel sang cm để hiển thị vừa vặn trên Overleaf
  const scale = 0.05; 
  let code = '\\begin{tikzpicture}[scale=1, auto, thick]\n';
  // Dùng chấm trắng viền đen với khoảng đệm inner sep để đường vẽ không bị đè vào tâm điểm
  code += '  \\tikzset{point/.style={circle, inner sep=1.2pt, fill=white, draw=black, thick}}\n\n';

  const geo = doc.data.geometry;
  if (!geo) return '';

  let points: Point2D[] = [];
  let labels: string[] = [];

  if (doc.type === 'GEOMETRY_TRIANGLE' && geo.triangle) {
    points = geo.triangle.points;
    labels = geo.triangle.vertexNames;
    code += `  % Vẽ tam giác ${labels.join('')}\n`;
    code += `  \\draw (${(points[0].x * scale).toFixed(2)}, ${(-points[0].y * scale).toFixed(2)}) -- ` +
            `(${ (points[1].x * scale).toFixed(2)}, ${(-points[1].y * scale).toFixed(2)}) -- ` +
            `(${ (points[2].x * scale).toFixed(2)}, ${(-points[2].y * scale).toFixed(2)}) -- cycle;\n\n`;
  } 

  code += `  % Gắn nhãn và các điểm tự động phân bố vị trí\n`;
  points.forEach((p, i) => {
    if(labels[i]) {
      const x = (p.x * scale).toFixed(2);
      const y = (-p.y * scale).toFixed(2);
      
      // Tự động thông minh hóa vị trí nhãn (Đỉnh A trên để above, B trái để below left, C phải để below right)
      let pos = 'above';
      if (i === 1) pos = 'below left';
      else if (i === 2) pos = 'below right';

      code += `  \\node[point, label=${pos}:${labels[i]}] (${labels[i]}) at (${x}, ${y}) {};\n`;
    }
  });

  code += '\\end{tikzpicture}';
  return code;
};

export const copyTikzToClipboard = async (doc: ChartDocument) => {
  const code = generateTikzCode(doc);
  try {
    await navigator.clipboard.writeText(code);
    return { success: true, message: 'Đã sao chép mã TikZ thông minh và chống đè nét!' };
  } catch (err) {
    return { success: false, message: 'Lỗi khi sao chép mã TikZ.' };
  }
};