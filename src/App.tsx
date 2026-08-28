import React, { useState, useEffect } from 'react';
import { ChartDocument, ToolType, BaseChartSettings, Point2D } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CanvasArea } from './components/CanvasArea';
import { DataTableModal } from './components/DataTableModal';
import { TemplatesModal } from './components/TemplatesModal';
import { SavedProjectsModal } from './components/SavedProjectsModal';
import { HelpModal } from './components/HelpModal';
import { storage, TEXTBOOK_TEMPLATES } from './storage/storageService';
import {
  copyImageToClipboard,
  copySvgCodeToClipboard,
  downloadPngFile,
  downloadSvgFile,
  downloadJsonConfig,
  readJsonConfig,
} from './export/exportService';
import { copyTikzToClipboard } from './export/tikzExport';

// Editor components
import { PieChartEditor } from './components/EditorPanels/PieChartEditor';
import { BarChartEditor } from './components/EditorPanels/BarChartEditor';
import { DoubleBarChartEditor } from './components/EditorPanels/DoubleBarChartEditor';
import { LineChartEditor } from './components/EditorPanels/LineChartEditor';
import { PictogramEditor } from './components/EditorPanels/PictogramEditor';
import { CoordinatePlaneEditor } from './components/EditorPanels/CoordinatePlaneEditor';
import { FunctionGraphEditor } from './components/EditorPanels/FunctionGraphEditor';
import { GeometryEditor } from './components/EditorPanels/GeometryEditor';
import { FractionBarEditor } from './components/EditorPanels/FractionBarEditor';
import { NumberLineEditor } from './components/EditorPanels/NumberLineEditor';

export const App: React.FC = () => {
  // Quản lý Lịch sử (Undo/Redo) với giới hạn 50 bước
  const [historyState, setHistoryState] = useState({
    past: [] as ChartDocument[],
    present: TEXTBOOK_TEMPLATES[0] as ChartDocument,
    future: [] as ChartDocument[]
  });
  
  const currentDoc = historyState.present;

  // Hàm cập nhật trạng thái (ghi đè setCurrentDoc cũ)
  const setCurrentDoc = (value: React.SetStateAction<ChartDocument>) => {
    setHistoryState((prev) => {
      const nextDoc = typeof value === 'function' ? value(prev.present) : value;
      if (nextDoc === prev.present) return prev; // Không đổi thì bỏ qua

      const newPast = [...prev.past, prev.present];
      if (newPast.length > 50) newPast.shift(); // Giới hạn 50 bước để tránh nặng RAM

      return {
        past: newPast,
        present: nextDoc,
        future: [] // Xóa tương lai khi có hành động mới
      };
    });
  };

  const handleUndo = () => {
    setHistoryState((prev) => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, prev.past.length - 1);
      return { past: newPast, present: previous, future: [prev.present, ...prev.future] };
    });
  };

  const handleRedo = () => {
    setHistoryState((prev) => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      return { past: [...prev.past, prev.present], present: next, future: newFuture };
    });
  };

  // Trạng thái modal
  const [showDataTableModal, setShowDataTableModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Toast feedback khi copy
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Hiển thị toast thông báo
  const showToast = (message: string) => {
    setCopyFeedback(message);
    setTimeout(() => {
      setCopyFeedback(null);
    }, 3500);
  };

  // Chọn loại công cụ mới từ Sidebar
  const handleSelectTool = (type: ToolType) => {
    const baseSettings: BaseChartSettings = {
      title: getInitialTitle(type),
      fontFamily: 'Times New Roman',
      titleFontSize: 18,
      labelFontSize: 14,
      strokeWidth: 1.3,
      examMode: currentDoc.settings.examMode,
      width: 640,
      height: 480,
      showLegend: true,
      legendPosition: 'bottom',
      backgroundColor: '#ffffff',
    };

    const newDoc: ChartDocument = {
      id: 'doc_' + Date.now(),
      type,
      title: baseSettings.title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      settings: baseSettings,
      data: getInitialDataForType(type),
    };

    setCurrentDoc(newDoc);
  };

  // Trả về tiêu đề mặc định theo loại hình
  const getInitialTitle = (type: ToolType): string => {
    switch (type) {
      case 'PIE_CHART': return 'TỈ LỆ CÁC THÀNH PHẦN (%)';
      case 'BAR_CHART': return 'BIỂU ĐỒ CỘT THỐNG KÊ';
      case 'DOUBLE_BAR_CHART': return 'BIỂU ĐỒ CỘT KÉP SO SÁNH';
      case 'LINE_CHART': return 'BIỂU ĐỒ ĐOẠN THẲNG';
      case 'PICTOGRAM': return 'BIỂU ĐỒ TRANH';
      case 'COORDINATE_PLANE': return 'MẶT PHẲNG TỌA ĐỘ Oxy';
      case 'FUNCTION_GRAPH': return 'ĐỒ THỊ HÀM SỐ';
      case 'GEOMETRY_LINE_RAY': return 'ĐOẠN THẲNG, TIA & ĐƯỜNG THẲNG';
      case 'GEOMETRY_ANGLE': return 'GÓC VÀ TIA PHÂN GIÁC';
      case 'GEOMETRY_TRIANGLE': return 'HÌNH TAM GIÁC';
      case 'GEOMETRY_QUADRILATERAL': return 'HÌNH TỨ GIÁC';
      case 'GEOMETRY_CIRCLE': return 'ĐƯỜNG TRÒN (O)';
      case 'FRACTION_BAR': return 'MÔ HÌNH THANH PHÂN SỐ';
      case 'NUMBER_LINE': return 'TRỤC SỐ';
      default: return 'HÌNH VẼ TOÁN THCS';
    }
  };

  // Trả về dữ liệu mẫu khởi tạo cho từng loại hình
  const getInitialDataForType = (type: ToolType) => {
    switch (type) {
      case 'PIE_CHART':
        return {
          pie: {
            unit: '%', radius: 150, showPercentageOnSlice: true, showNameOnSlice: false,
            showValuesOnSlice: false, decimalPlaces: 0, startAngle: 0,
            slices: [
              { id: 'p1', name: 'Nhóm A', value: 40, color: '#3b82f6', pattern: 'solid' as const, patternColor: '#000000', patternBg: '#ffffff', isLocked: true },
              { id: 'p2', name: 'Nhóm B', value: 35, color: '#10b981', pattern: 'solid' as const, patternColor: '#000000', patternBg: '#ffffff', isLocked: false },
              { id: 'p3', name: 'Nhóm C', value: 25, color: '#ffffff', pattern: 'hatch-right' as const, patternColor: '#000000', patternBg: '#ffffff', isLocked: false },
            ],
          },
        };
      case 'BAR_CHART':
        return {
          bar: {
            orientation: 'vertical' as const, xAxisTitle: 'Danh mục', yAxisTitle: 'Số lượng', unit: 'học sinh',
            barWidth: 40, barGap: 24, showValueOnBar: true, showAxisArrows: true, showGridLines: true,
            items: [
              { id: 'b1', category: 'Lớp 6A', value: 15, color: '#3b82f6', pattern: 'solid' as const },
              { id: 'b2', category: 'Lớp 6B', value: 22, color: '#10b981', pattern: 'solid' as const },
              { id: 'b3', category: 'Lớp 6C', value: 18, color: '#f59e0b', pattern: 'solid' as const },
              { id: 'b4', category: 'Lớp 6D', value: 25, color: '#8b5cf6', pattern: 'solid' as const },
            ],
          },
        };
      case 'DOUBLE_BAR_CHART':
        return {
          doubleBar: {
            group1Name: 'Học kỳ I', group2Name: 'Học kỳ II', group1Color: '#3b82f6', group1Pattern: 'solid' as const,
            group2Color: '#f59e0b', group2Pattern: 'hatch-right' as const, xAxisTitle: 'Mức xếp loại',
            yAxisTitle: 'Số lượng', unit: 'em', barWidth: 28, groupGap: 24, showValueOnBar: true, showGridLines: true,
            items: [
              { id: 'db1', category: 'Tốt', value1: 12, value2: 18 },
              { id: 'db2', category: 'Khá', value1: 20, value2: 15 },
              { id: 'db3', category: 'Đạt', value1: 8, value2: 6 },
            ],
          },
        };
      case 'LINE_CHART':
        return {
          line: {
            xAxisTitle: 'Thời gian', yAxisTitle: 'Nhiệt độ', unit: '°C', lineColor: '#000000', lineWidth: 1.8,
            lineStyle: 'solid' as const, pointRadius: 4, pointStyle: 'circle' as const, showPoints: true, showValues: true,
            showDashedProjections: true, showGridLines: true,
            points: [
              { id: 'p1', xLabel: '7h', xValue: 7, yValue: 18 },
              { id: 'p2', xLabel: '10h', xValue: 10, yValue: 25 },
              { id: 'p3', xLabel: '13h', xValue: 13, yValue: 32 },
              { id: 'p4', xLabel: '16h', xValue: 16, yValue: 28 },
              { id: 'p5', xLabel: '19h', xValue: 19, yValue: 22 },
            ],
          },
        };
      case 'PICTOGRAM':
        return {
          pictogram: {
            iconType: 'star' as const, valuePerIcon: 10, allowHalfIcon: true, iconSize: 26, iconColor: '#f59e0b',
            unit: 'ngôi sao', legendText: 'Mỗi ⭐ tương ứng với 10 bông hoa điểm 10', rowGap: 16,
            rows: [
              { id: 'r1', category: 'Tổ 1', count: 35 },
              { id: 'r2', category: 'Tổ 2', count: 40 },
              { id: 'r3', category: 'Tổ 3', count: 20 },
              { id: 'r4', category: 'Tổ 4', count: 50 },
            ],
          },
        };
      case 'COORDINATE_PLANE':
        return {
          coordinatePlane: {
            xMin: -5, xMax: 5, yMin: -4, yMax: 4, step: 1, showGrid: true, showAxisNumbers: true,
            points: [
              { id: 'pt1', name: 'A', x: 2, y: 3, color: '#dc2626', showCoordinates: true, showProjections: true },
              { id: 'pt2', name: 'B', x: -3, y: 2, color: '#dc2626', showCoordinates: true, showProjections: true },
              { id: 'pt3', name: 'C', x: -2, y: -2, color: '#dc2626', showCoordinates: true, showProjections: true },
              { id: 'pt4', name: 'D', x: 4, y: -1, color: '#dc2626', showCoordinates: true, showProjections: true },
            ],
            segments: [],
          },
        };
      case 'FUNCTION_GRAPH':
        return {
          functionGraph: {
            functionType: 'linear' as const, a: 2, b: 1, xMin: -4, xMax: 4, yMin: -4, yMax: 5, showEquation: true, showGrid: true,
          },
        };
      case 'GEOMETRY_TRIANGLE':
        return {
          geometry: {
            subType: 'triangle' as const,
            triangle: {
              type: 'general' as const, vertexNames: ['A', 'B', 'C'],
              points: [{ x: 260, y: 110 }, { x: 130, y: 340 }, { x: 430, y: 340 }] as [Point2D, Point2D, Point2D],
              showVertices: true, showLabels: true,
              altitudes: [{ fromVertex: 'A' as const, enabled: true, label: 'H', style: 'dashed' as const, showRightAngle: true }],
              medians: [], bisectors: [], perpBisectors: [], showRightAngleMarker: true, showEqualSidesMarker: true,
              showSideLengths: false, sideLengthLabels: ['', '', ''],
            },
          },
        };
      case 'GEOMETRY_QUADRILATERAL':
        return {
          geometry: {
            subType: 'quadrilateral' as const,
            quadrilateral: {
              type: 'rectangle' as const, vertexNames: ['A', 'B', 'C', 'D'], width: 240, height: 150,
              showDiagonals: true, showRightAngleMarkers: true, showSideMarks: false,
            },
          },
        };
      case 'GEOMETRY_LINE_RAY':
        return {
          geometry: {
            subType: 'line-ray' as const,
            lineRay: {
              type: 'segment' as const, pointNames: ['A', 'B', 'C', 'D'], points: [{ x: 120, y: 220 }, { x: 440, y: 220 }],
              showPoints: true, showLabels: true, showMidpoint: true, midpointName: 'M', showEqualSegmentMarks: true,
              showLength: false, lengthValue: '6 cm', showArrows: true, showParallelMarkers: true, parallelLineLabel1: 'a',
              parallelLineLabel2: 'b', showRightAngleMarker: true, perpLineLabel1: 'd', perpLineLabel2: "d'",
              intersectionName: 'O', showIntersectionPoint: true,
              line1Style: { color: '#000000', strokeWidth: 1.8, style: 'solid' as const },
              line2Style: { color: '#000000', strokeWidth: 1.8, style: 'solid' as const },
            },
          },
        };
      case 'GEOMETRY_ANGLE':
        return {
          geometry: {
            subType: 'angle' as const,
            angle: {
              type: 'single' as const, vertexName: 'O', ray1Name: 'x', ray2Name: 'y', degrees: 60, autoCalculateDegrees: true,
              showDegreeValue: true, arcRadius: 34, showArc: true, showBisector: true, bisectorName: 'z',
              showEqualAngleMarks: true, fill: { enabled: false, color: '#fef08a', opacity: 0.35 },
              points: [{ x: 180, y: 290 }, { x: 420, y: 290 }, { x: 340, y: 130 }],
              parallelCutConfig: { line1Name: 'a', line2Name: 'b', transversalName: 'c', vertex1Name: 'A', vertex2Name: 'B', highlightType: 'alternate-interior' as const, showParallelMarkers: true, showAngleNumbers: true },
              ray1Style: { color: '#000000', strokeWidth: 1.8, style: 'solid' as const },
              ray2Style: { color: '#000000', strokeWidth: 1.8, style: 'solid' as const },
            },
          },
        };
      case 'GEOMETRY_CIRCLE':
        return {
          geometry: {
            subType: 'circle' as const,
            circle: {
              presetType: 'basic' as const, centerName: 'O', radius: 110, showCenterPoint: true, showCenterLabel: true,
              showRadius: true, radiusPointName: 'A', radiusLabel: 'R', showRadiusLabel: true, showDiameter: false,
              diameterPoints: ['A', 'B'], showChord: false, chordPoints: ['C', 'D'], showChordDistance: true,
              chordDistanceLabel: 'H', showChordMidpoint: true, showChordRightAngle: true, showArc: false, arcType: 'minor' as const,
              arcPoints: ['A', 'B'], arcName: 'AB', showArcName: true, showTangent: false, tangentType: 'at-point' as const,
              tangentPointName: 'A', tangentLineName: 'Ax', externalPointName: 'P', tangentPointsNames: ['A', 'B'],
              showTangentRightAngle: true, showTangentEqualMarks: true, showCenterConnector: true, showChordAB: false,
              showSecant: false, secantPointsNames: ['C', 'D'], showInscribedAngle: false, inscribedVertexName: 'P',
              showCentralAngle: false, showSecondCircle: false, center2Name: "O'", radius2: 80, showIntersections: true,
              intersectionNames: ['A', 'B'], fill: { enabled: false, color: '#3b82f6', opacity: 0.25 }, fillType: 'full' as const,
              points: [{ x: 280, y: 220 }, { x: 390, y: 220 }],
              circleStyle: { strokeColor: '#000000', strokeWidth: 1.8, strokeStyle: 'solid' as const },
              radiusStyle: { strokeColor: '#000000', strokeWidth: 1.5, strokeStyle: 'solid' as const },
              diameterStyle: { strokeColor: '#000000', strokeWidth: 1.6, strokeStyle: 'solid' as const },
              chordStyle: { strokeColor: '#000000', strokeWidth: 1.6, strokeStyle: 'solid' as const },
              arcStyle: { strokeColor: '#ec4899', strokeWidth: 2.8, strokeStyle: 'solid' as const },
              tangentStyle: { strokeColor: '#000000', strokeWidth: 1.6, strokeStyle: 'solid' as const },
            },
          },
        };
      case 'FRACTION_BAR':
        return {
          fractionBar: {
            barHeight: 36, barSpacing: 20, showFractionsText: true,
            bars: [
              { id: 'fb1', numerator: 3, denominator: 4, label: '3/4', color: '#3b82f6', pattern: 'solid' as const },
              { id: 'fb2', numerator: 2, denominator: 3, label: '2/3', color: '#10b981', pattern: 'hatch-right' as const },
              { id: 'fb3', numerator: 5, denominator: 6, label: '5/6', color: '#f59e0b', pattern: 'dots' as const },
            ],
          },
        };
      case 'NUMBER_LINE':
        return {
          numberLine: {
            min: -3, max: 5, step: 1, subDivision: 3, autoSubDivision: true, showOrigin: true, showArrows: true,
            illustration: {
              enabled: false, targetType: 'sqrt2' as const, mode: 'visual' as const, showArc: true, showTriangle: true,
              showRightAngleMarker: true, showSideLengths: true, showFormulas: true, color: '#2563eb',
            },
            markers: [
              { id: 'm1', expression: '1/3', numericValue: 1 / 3, value: 1 / 3, label: '1/3', pointName: 'A', color: '#dc2626' },
              { id: 'm2', expression: '2', numericValue: 2, value: 2, label: '2', pointName: 'B', color: '#2563eb' },
              { id: 'm3', expression: '-1', numericValue: -1, value: -1, label: '-1', pointName: 'C', color: '#16a34a' },
            ],
          },
        };
      default: return {};
    }
  };

  // Hàm dịch chuyển hình phục vụ phím tắt
  const handleTranslateShape = (dx: number, dy: number) => {
    setCurrentDoc(prev => {
      if(!prev.data.geometry) return prev;
      
      const newData = JSON.parse(JSON.stringify(prev.data)); // Clone data
      const geo = newData.geometry;
      
      if(geo.triangle?.points) geo.triangle.points = geo.triangle.points.map((p:any) => ({x: p.x + dx, y: p.y + dy}));
      if(geo.quadrilateral?.points) geo.quadrilateral.points = geo.quadrilateral.points.map((p:any) => ({x: p.x + dx, y: p.y + dy}));
      if(geo.lineRay?.points) geo.lineRay.points = geo.lineRay.points.map((p:any) => ({x: p.x + dx, y: p.y + dy}));
      if(geo.angle?.points) geo.angle.points = geo.angle.points.map((p:any) => ({x: p.x + dx, y: p.y + dy}));
      if(geo.circle?.points) geo.circle.points = geo.circle.points.map((p:any) => ({x: p.x + dx, y: p.y + dy}));
      
      return {...prev, data: newData};
    });
  };

  // Bắt sự kiện phím tắt toàn cục (Shortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bỏ qua nếu đang gõ text trong thẻ input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      // Ctrl + Z (Undo) & Ctrl + Shift + Z (Redo)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }

      // Ctrl + Y (Redo)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }

      // Ctrl + C: Copy hình
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopyImage();
      }

      // Các phím mũi tên: Dịch chuyển hình học
      if (currentDoc.type.startsWith('GEOMETRY_')) {
        const step = e.shiftKey ? 20 : 5; // Giữ Shift để đi nhanh hơn
        if (e.key === 'ArrowUp') { handleTranslateShape(0, -step); e.preventDefault(); }
        else if (e.key === 'ArrowDown') { handleTranslateShape(0, step); e.preventDefault(); }
        else if (e.key === 'ArrowLeft') { handleTranslateShape(-step, 0); e.preventDefault(); }
        else if (e.key === 'ArrowRight') { handleTranslateShape(step, 0); e.preventDefault(); }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentDoc]);

  // Toggle Chế độ in đề thi đen trắng
  const handleToggleExamMode = () => {
    setCurrentDoc((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        examMode: !prev.settings.examMode,
      },
    }));
  };

  // Lưu tài liệu vào LocalStorage
  const handleSaveDoc = async () => {
    await storage.save(currentDoc);
    showToast('Đã lưu hình vẽ vào bộ nhớ máy thành công!');
  };

  // Lấy thẻ SVG đang hiển thị trên màn hình
  const getSvgElement = (): SVGSVGElement | null => {
    return document.getElementById('svg-math-canvas') as unknown as SVGSVGElement | null;
  };

  // Sao chép hình trực tiếp vào Clipboard (cho Word)
  const handleCopyImage = async () => {
    const svgEl = getSvgElement();
    if (!svgEl) {
      showToast('Không tìm thấy hình SVG để sao chép.');
      return;
    }
    const res = await copyImageToClipboard(svgEl, 2.5);
    showToast(res.message);
  };

  // Sao chép mã SVG
  const handleCopySvg = async () => {
    const svgEl = getSvgElement();
    if (!svgEl) return;
    const res = await copySvgCodeToClipboard(svgEl);
    showToast(res.message);
  };

  // Sao chép mã TikZ / LaTeX
  const handleCopyTikz = async () => {
    const res = await copyTikzToClipboard(currentDoc);
    showToast(res.message);
  };

  // Tải ảnh PNG 600 DPI (siêu nét)
  const handleDownloadPng = async () => {
    const svgEl = getSvgElement();
    if (!svgEl) return;
    await downloadPngFile(svgEl, currentDoc.title || 'toan_thcs_hinh_ve', 6);
    showToast('Đang tải tệp ảnh PNG siêu nét (600 DPI)...');
  };

  // Tải file SVG
  const handleDownloadSvg = () => {
    const svgEl = getSvgElement();
    if (!svgEl) return;
    downloadSvgFile(svgEl, currentDoc.title || 'toan_thcs_vector');
    showToast('Đang tải tệp SVG Vector...');
  };

  // Tải cấu hình JSON
  const handleDownloadJson = () => {
    downloadJsonConfig(currentDoc, currentDoc.title || 'cau_hinh_hinh_toan');
    showToast('Đã tải tệp cấu hình JSON.');
  };

  // Nhập cấu hình JSON
  const handleUploadJson = async (file: File) => {
    try {
      const parsedDoc = await readJsonConfig(file);
      setCurrentDoc(parsedDoc);
      showToast('Đã tải thành công cấu hình hình vẽ từ tệp!');
    } catch (e: any) {
      showToast('Lỗi đọc file JSON: ' + e.message);
    }
  };

  // Render Editor Panel tương ứng bên trái
  const renderEditorPanel = () => {
    const { type, data, settings } = currentDoc;

    switch (type) {
      case 'PIE_CHART':
        return (
          <PieChartEditor
            data={data.pie || { unit: '%', radius: 150, showPercentageOnSlice: true, showNameOnSlice: false, showValuesOnSlice: false, decimalPlaces: 0, startAngle: 0, slices: [] }}
            settings={settings}
            onChangeData={(pie) => setCurrentDoc((prev) => ({ ...prev, data: { ...prev.data, pie } }))}
            onChangeSettings={(st) => setCurrentDoc((prev) => ({ ...prev, settings: st }))}
          />
        );
      case 'BAR_CHART':
        return (
          <BarChartEditor
            data={data.bar || { orientation: 'vertical', unit: '', barWidth: 40, barGap: 24, showValueOnBar: true, showAxisArrows: true, showGridLines: true, items: [] }}
            settings={settings}
            onChangeData={(bar) => setCurrentDoc((prev) => ({ ...prev, data: { ...prev.data, bar } }))}
            onChangeSettings={(st) => setCurrentDoc((prev) => ({ ...prev, settings: st }))}
          />
        );
      case 'DOUBLE_BAR_CHART':
        return (
          <DoubleBarChartEditor
            data={data.doubleBar || { group1Name: 'Nhóm 1', group2Name: 'Nhóm 2', group1Color: '#3b82f6', group2Color: '#f59e0b', unit: '', barWidth: 28, groupGap: 24, showValueOnBar: true, showGridLines: true, items: [] }}
            settings={settings}
            onChangeData={(doubleBar) => setCurrentDoc((prev) => ({ ...prev, data: { ...prev.data, doubleBar } }))}
            onChangeSettings={(st) => setCurrentDoc((prev) => ({ ...prev, settings: st }))}
          />
        );
      case 'LINE_CHART':
        return (
          <LineChartEditor
            data={data.line || { unit: '', lineColor: '#000000', lineWidth: 1.8, lineStyle: 'solid', pointRadius: 4, pointStyle: 'circle', showPoints: true, showValues: true, showDashedProjections: true, showGridLines: true, points: [] }}
            settings={settings}
            onChangeData={(line) => setCurrentDoc((prev) => ({ ...prev, data: { ...prev.data, line } }))}
            onChangeSettings={(st) => setCurrentDoc((prev) => ({ ...prev, settings: st }))}
          />
        );
      case 'PICTOGRAM':
        return (
          <PictogramEditor
            data={data.pictogram || { iconType: 'star', valuePerIcon: 10, allowHalfIcon: true, iconSize: 26, iconColor: '#f59e0b', unit: '', rowGap: 16, rows: [] }}
            settings={settings}
            onChangeData={(pictogram) => setCurrentDoc((prev) => ({ ...prev, data: { ...prev.data, pictogram } }))}
            onChangeSettings={(st) => setCurrentDoc((prev) => ({ ...prev, settings: st }))}
          />
        );
      case 'COORDINATE_PLANE':
        return (
          <CoordinatePlaneEditor
            data={data.coordinatePlane || { xMin: -5, xMax: 5, yMin: -4, yMax: 4, step: 1, showGrid: true, showAxisNumbers: true, points: [], segments: [] }}
            settings={settings}
            onChangeData={(coordinatePlane) => setCurrentDoc((prev) => ({ ...prev, data: { ...prev.data, coordinatePlane } }))}
            onChangeSettings={(st) => setCurrentDoc((prev) => ({ ...prev, settings: st }))}
          />
        );
      case 'FUNCTION_GRAPH':
        return (
          <FunctionGraphEditor
            data={data.functionGraph || { functionType: 'linear', a: 2, b: 1, xMin: -4, xMax: 4, yMin: -4, yMax: 5, showEquation: true, showGrid: true }}
            settings={settings}
            onChangeData={(functionGraph) => setCurrentDoc((prev) => ({ ...prev, data: { ...prev.data, functionGraph } }))}
            onChangeSettings={(st) => setCurrentDoc((prev) => ({ ...prev, settings: st }))}
          />
        );
      case 'GEOMETRY_LINE_RAY':
      case 'GEOMETRY_ANGLE':
      case 'GEOMETRY_TRIANGLE':
      case 'GEOMETRY_QUADRILATERAL':
      case 'GEOMETRY_CIRCLE':
        return (
          <GeometryEditor
            data={data.geometry || { subType: type === 'GEOMETRY_LINE_RAY' ? 'line-ray' : type === 'GEOMETRY_ANGLE' ? 'angle' : type === 'GEOMETRY_TRIANGLE' ? 'triangle' : type === 'GEOMETRY_QUADRILATERAL' ? 'quadrilateral' : 'circle' }}
            settings={settings}
            onChangeData={(geometry) => setCurrentDoc((prev) => ({ ...prev, data: { ...prev.data, geometry } }))}
            onChangeSettings={(st) => setCurrentDoc((prev) => ({ ...prev, settings: st }))}
          />
        );
      case 'FRACTION_BAR':
        return (
          <FractionBarEditor
            data={data.fractionBar || { barHeight: 36, barSpacing: 20, showFractionsText: true, bars: [] }}
            settings={settings}
            onChangeData={(fractionBar) => setCurrentDoc((prev) => ({ ...prev, data: { ...prev.data, fractionBar } }))}
            onChangeSettings={(st) => setCurrentDoc((prev) => ({ ...prev, settings: st }))}
          />
        );
      case 'NUMBER_LINE':
        return (
          <NumberLineEditor
            data={data.numberLine || { min: -5, max: 5, step: 1, subStepFraction: 1, showOrigin: true, showArrows: true, markers: [] }}
            settings={settings}
            onChangeData={(numberLine) => setCurrentDoc((prev) => ({ ...prev, data: { ...prev.data, numberLine } }))}
            onChangeSettings={(st) => setCurrentDoc((prev) => ({ ...prev, settings: st }))}
          />
        );
      default:
        return <div>Chưa có bảng nhập liệu cho loại hình này.</div>;
    }
  };

  const handleUpdateTrianglePoints = (points: [Point2D, Point2D, Point2D]) => {
    setCurrentDoc((prev) => {
      if (!prev.data.geometry) return prev;
      return {
        ...prev,
        data: {
          ...prev.data,
          geometry: {
            ...prev.data.geometry,
            triangle: {
              ...(prev.data.geometry.triangle || { type: 'general', vertexNames: ['A', 'B', 'C'] }),
              points,
            },
          },
        },
      };
    });
  };

  const handleUpdateQuadPoints = (points: [Point2D, Point2D, Point2D, Point2D]) => {
    setCurrentDoc((prev) => {
      if (!prev.data.geometry) return prev;
      return {
        ...prev,
        data: {
          ...prev.data,
          geometry: {
            ...prev.data.geometry,
            quadrilateral: {
              ...(prev.data.geometry.quadrilateral || { type: 'rectangle', vertexNames: ['A', 'B', 'C', 'D'] }),
              points,
            },
          },
        },
      };
    });
  };

  const handleUpdateLineRayPoints = (points: Point2D[]) => {
    setCurrentDoc((prev) => {
      if (!prev.data.geometry) return prev;
      return {
        ...prev,
        data: {
          ...prev.data,
          geometry: {
            ...prev.data.geometry,
            lineRay: {
              ...(prev.data.geometry.lineRay || { type: 'segment', pointNames: ['A', 'B', 'C', 'D'] }),
              points,
            },
          },
        },
      };
    });
  };

  const handleUpdateAnglePoints = (points: Point2D[]) => {
    setCurrentDoc((prev) => {
      if (!prev.data.geometry) return prev;
      return {
        ...prev,
        data: {
          ...prev.data,
          geometry: {
            ...prev.data.geometry,
            angle: {
              ...(prev.data.geometry.angle || { type: 'single', vertexName: 'O', ray1Name: 'x', ray2Name: 'y' }),
              points,
            },
          },
        },
      };
    });
  };

  const handleUpdateCirclePoints = (points: Point2D[], radius?: number) => {
    setCurrentDoc((prev) => {
      if (!prev.data.geometry) return prev;
      return {
        ...prev,
        data: {
          ...prev.data,
          geometry: {
            ...prev.data.geometry,
            circle: {
              ...(prev.data.geometry.circle || { presetType: 'basic', centerName: 'O', radius: 110 }),
              points,
              ...(radius ? { radius } : {}),
            },
          },
        },
      };
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 text-slate-900 font-sans">
      {/* 1. Header trên cùng */}
      <Header
        currentDoc={currentDoc}
        onNewDoc={() => handleSelectTool('PIE_CHART')}
        onSaveDoc={handleSaveDoc}
        onOpenSaved={() => setShowSavedModal(true)}
        onOpenTemplates={() => setShowTemplatesModal(true)}
        onOpenDataTable={() => setShowDataTableModal(true)}
        onOpenHelp={() => setShowHelpModal(true)}
        onCopyImage={handleCopyImage}
        onCopySvg={handleCopySvg}
        onCopyTikz={handleCopyTikz}
        onDownloadPng={handleDownloadPng}
        onDownloadSvg={handleDownloadSvg}
        onDownloadJson={handleDownloadJson}
        onUploadJson={handleUploadJson}
        onToggleExamMode={handleToggleExamMode}
        examMode={currentDoc.settings.examMode}
        copyFeedback={copyFeedback}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyState.past.length > 0}
        canRedo={historyState.future.length > 0}
      />

      {/* 2. Thân chính: Sidebar Danh mục + Panel Nhập liệu + Canvas Hiển thị SVG */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Chọn loại công cụ */}
        <Sidebar
          currentType={currentDoc.type}
          onSelectTool={handleSelectTool}
        />

        {/* Panel Nhập liệu & Tùy chỉnh chi tiết */}
        <section className="w-80 lg:w-96 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto p-4 select-none h-full">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Tùy chỉnh & Số liệu
            </h2>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
              {currentDoc.type.replace('_', ' ')}
            </span>
          </div>

          {/* Form chỉnh sửa */}
          <div className="flex-1 space-y-4">
            {renderEditorPanel()}
          </div>
        </section>

        {/* Khung Canvas Trực quan & Xem trước hình ảnh SVG */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          <CanvasArea
            currentDoc={currentDoc}
            onCopyImage={handleCopyImage}
            onChangeSettings={(newSettings) => setCurrentDoc((prev) => ({ ...prev, settings: newSettings }))}
            onUpdateTrianglePoints={handleUpdateTrianglePoints}
            onUpdateQuadPoints={handleUpdateQuadPoints}
            onUpdateLineRayPoints={handleUpdateLineRayPoints}
            onUpdateAnglePoints={handleUpdateAnglePoints}
            onUpdateCirclePoints={handleUpdateCirclePoints}
          />
        </main>
      </div>

      {/* 3. Các Dialog Modals */}
      <DataTableModal
        isOpen={showDataTableModal}
        onClose={() => setShowDataTableModal(false)}
        onApplyData={(doc) => setCurrentDoc(doc)}
      />

      <TemplatesModal
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        onSelectTemplate={(tpl) => setCurrentDoc(tpl)}
      />

      <SavedProjectsModal
        isOpen={showSavedModal}
        onClose={() => setShowSavedModal(false)}
        onSelectDoc={(doc) => setCurrentDoc(doc)}
      />

      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </div>
  );
};

export default App;