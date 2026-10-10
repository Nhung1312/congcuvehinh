import React, { useState, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Copy,
  Printer,
  Grid,
  Square,
  Sparkles,
  AlignCenter,
  Maximize,
  Plus,
  Minus,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Monitor,
} from 'lucide-react';
import { ChartDocument, Point2D, BaseChartSettings } from '../types';
import { PieChartSvg } from '../renderers/PieChartSvg';
import { BarChartSvg } from '../renderers/BarChartSvg';
import { DoubleBarChartSvg } from '../renderers/DoubleBarChartSvg';
import { LineChartSvg } from '../renderers/LineChartSvg';
import { PictogramSvg } from '../renderers/PictogramSvg';
import { CoordinatePlaneSvg } from '../renderers/CoordinatePlaneSvg';
import { FunctionGraphSvg } from '../renderers/FunctionGraphSvg';
import { GeometrySvg } from '../renderers/GeometrySvg';
import { SpatialGeometrySvg } from '../renderers/SpatialGeometrySvg';
import { FractionBarSvg } from '../renderers/FractionBarSvg';
import { NumberLineSvg } from '../renderers/NumberLineSvg';
import {
  centerGeometryPoints,
  fitGeometryPoints,
  scaleGeometryPoints,
  translateGeometryPoints,
} from '../utils/geometryMath';

interface CanvasAreaProps {
  currentDoc: ChartDocument;
  onCopyImage: () => void;
  onChangeSettings?: (settings: BaseChartSettings) => void;
  onUpdateTrianglePoints?: (points: [Point2D, Point2D, Point2D]) => void;
  onUpdateQuadPoints?: (points: [Point2D, Point2D, Point2D, Point2D]) => void;
  onUpdateLineRayPoints?: (points: Point2D[]) => void;
  onUpdateAnglePoints?: (points: Point2D[]) => void;
  onUpdateCirclePoints?: (points: Point2D[], radius?: number) => void;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  currentDoc,
  onCopyImage,
  onChangeSettings,
  onUpdateTrianglePoints,
  onUpdateQuadPoints,
  onUpdateLineRayPoints,
  onUpdateAnglePoints,
  onUpdateCirclePoints,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [bgPattern, setBgPattern] = useState<'plain' | 'grid' | 'dots'>('plain');
  const containerRef = useRef<HTMLDivElement>(null);

  const isGeometry = currentDoc.type.startsWith('GEOMETRY_');
  const width = currentDoc.settings.width || 600;
  const height = currentDoc.settings.height || 450;

  // All geometry dragging is owned by GeometrySvg, which maps pointer positions
  // through its actual viewBox and preserves triangle/quad/circle constraints.
  // Do not place CSS-coordinate handles over SVG-coordinate geometry.

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 15, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 15, 50));
  const handleResetZoom = () => setZoomLevel(100);

  // Căn chỉnh hình học
  const handleCenterShape = () => {
    if (!isGeometry) return;
    if (currentDoc.type === 'GEOMETRY_TRIANGLE' && onUpdateTrianglePoints) {
      const pts = currentDoc.data.geometry?.triangle?.points || [{ x: 260, y: 110 }, { x: 130, y: 340 }, { x: 430, y: 340 }];
      const centered = centerGeometryPoints(pts, width, height);
      onUpdateTrianglePoints([centered[0], centered[1], centered[2]]);
    } else if (currentDoc.type === 'GEOMETRY_QUADRILATERAL' && onUpdateQuadPoints) {
      const pts = currentDoc.data.geometry?.quadrilateral?.points || [{ x: 160, y: 160 }, { x: 440, y: 160 }, { x: 440, y: 320 }, { x: 160, y: 320 }];
      const centered = centerGeometryPoints(pts, width, height);
      onUpdateQuadPoints([centered[0], centered[1], centered[2], centered[3]]);
    } else if (currentDoc.type === 'GEOMETRY_LINE_RAY' && onUpdateLineRayPoints) {
      const pts = currentDoc.data.geometry?.lineRay?.points || [{ x: 140, y: 225 }, { x: 460, y: 225 }];
      onUpdateLineRayPoints(centerGeometryPoints(pts, width, height));
    } else if (currentDoc.type === 'GEOMETRY_ANGLE' && onUpdateAnglePoints) {
      const pts = currentDoc.data.geometry?.angle?.points || [{ x: 180, y: 280 }, { x: 420, y: 280 }, { x: 300, y: 140 }];
      onUpdateAnglePoints(centerGeometryPoints(pts, width, height));
    } else if (currentDoc.type === 'GEOMETRY_CIRCLE' && onUpdateCirclePoints) {
      const center = { x: width / 2, y: height / 2 };
      const rad = currentDoc.data.geometry?.circle?.radius || 110;
      onUpdateCirclePoints([center, { x: center.x + rad, y: center.y }], rad);
    }
  };

  const handleFitShape = () => {
    if (!isGeometry) return;
    if (currentDoc.type === 'GEOMETRY_TRIANGLE' && onUpdateTrianglePoints) {
      const pts = currentDoc.data.geometry?.triangle?.points || [{ x: 260, y: 110 }, { x: 130, y: 340 }, { x: 430, y: 340 }];
      const fitted = fitGeometryPoints(pts, width, height, 45);
      onUpdateTrianglePoints([fitted[0], fitted[1], fitted[2]]);
    } else if (currentDoc.type === 'GEOMETRY_QUADRILATERAL' && onUpdateQuadPoints) {
      const pts = currentDoc.data.geometry?.quadrilateral?.points || [{ x: 160, y: 160 }, { x: 440, y: 160 }, { x: 440, y: 320 }, { x: 160, y: 320 }];
      const fitted = fitGeometryPoints(pts, width, height, 45);
      onUpdateQuadPoints([fitted[0], fitted[1], fitted[2], fitted[3]]);
    } else if (currentDoc.type === 'GEOMETRY_LINE_RAY' && onUpdateLineRayPoints) {
      const pts = currentDoc.data.geometry?.lineRay?.points || [{ x: 140, y: 225 }, { x: 460, y: 225 }];
      onUpdateLineRayPoints(fitGeometryPoints(pts, width, height, 50));
    } else if (currentDoc.type === 'GEOMETRY_ANGLE' && onUpdateAnglePoints) {
      const pts = currentDoc.data.geometry?.angle?.points || [{ x: 180, y: 280 }, { x: 420, y: 280 }, { x: 300, y: 140 }];
      onUpdateAnglePoints(fitGeometryPoints(pts, width, height, 45));
    }
  };

  const handleScaleShape = (factor: number) => {
    if (!isGeometry) return;
    if (currentDoc.type === 'GEOMETRY_TRIANGLE' && onUpdateTrianglePoints) {
      const pts = currentDoc.data.geometry?.triangle?.points || [];
      if (pts.length >= 3) onUpdateTrianglePoints(scaleGeometryPoints(pts, factor) as any);
    } else if (currentDoc.type === 'GEOMETRY_QUADRILATERAL' && onUpdateQuadPoints) {
      const pts = currentDoc.data.geometry?.quadrilateral?.points || [];
      if (pts.length >= 4) onUpdateQuadPoints(scaleGeometryPoints(pts, factor) as any);
    } else if (currentDoc.type === 'GEOMETRY_LINE_RAY' && onUpdateLineRayPoints) {
      const pts = currentDoc.data.geometry?.lineRay?.points || [];
      if (pts.length > 0) onUpdateLineRayPoints(scaleGeometryPoints(pts, factor));
    } else if (currentDoc.type === 'GEOMETRY_ANGLE' && onUpdateAnglePoints) {
      const pts = currentDoc.data.geometry?.angle?.points || [];
      if (pts.length > 0) onUpdateAnglePoints(scaleGeometryPoints(pts, factor));
    } else if (currentDoc.type === 'GEOMETRY_CIRCLE' && onUpdateCirclePoints) {
      const curRad = currentDoc.data.geometry?.circle?.radius || 110;
      const newRad = Math.max(30, Math.min(220, Math.round(curRad * factor)));
      const pts = currentDoc.data.geometry?.circle?.points || [{ x: width / 2, y: height / 2 }];
      onUpdateCirclePoints(pts, newRad);
    }
  };

  const handleTranslateShape = (dx: number, dy: number) => {
    if (!isGeometry) return;
    if (currentDoc.type === 'GEOMETRY_TRIANGLE' && onUpdateTrianglePoints) {
      const pts = currentDoc.data.geometry?.triangle?.points || [];
      if (pts.length >= 3) onUpdateTrianglePoints(translateGeometryPoints(pts, dx, dy) as any);
    } else if (currentDoc.type === 'GEOMETRY_QUADRILATERAL' && onUpdateQuadPoints) {
      const pts = currentDoc.data.geometry?.quadrilateral?.points || [];
      if (pts.length >= 4) onUpdateQuadPoints(translateGeometryPoints(pts, dx, dy) as any);
    } else if (currentDoc.type === 'GEOMETRY_LINE_RAY' && onUpdateLineRayPoints) {
      const pts = currentDoc.data.geometry?.lineRay?.points || [];
      if (pts.length > 0) onUpdateLineRayPoints(translateGeometryPoints(pts, dx, dy));
    } else if (currentDoc.type === 'GEOMETRY_ANGLE' && onUpdateAnglePoints) {
      const pts = currentDoc.data.geometry?.angle?.points || [];
      if (pts.length > 0) onUpdateAnglePoints(translateGeometryPoints(pts, dx, dy));
    } else if (currentDoc.type === 'GEOMETRY_CIRCLE' && onUpdateCirclePoints) {
      const pts = currentDoc.data.geometry?.circle?.points || [{ x: width / 2, y: height / 2 }];
      const rad = currentDoc.data.geometry?.circle?.radius || 110;
      onUpdateCirclePoints(translateGeometryPoints(pts, dx, dy), rad);
    }
  };

  const handleSetCanvasPreset = (presetW: number, presetH: number) => {
    if (onChangeSettings) {
      onChangeSettings({
        ...currentDoc.settings,
        width: presetW,
        height: presetH,
      });
    }
  };

  // Chọn đúng renderer dựa vào loại hình
  const renderSvgContent = () => {
    const { type, data, settings } = currentDoc;
    switch (type) {
      case 'PIE_CHART': return <PieChartSvg data={data.pie as any} settings={settings} />;
      case 'BAR_CHART': return <BarChartSvg data={data.bar as any} settings={settings} />;
      case 'DOUBLE_BAR_CHART': return <DoubleBarChartSvg data={data.doubleBar as any} settings={settings} />;
      case 'LINE_CHART': return <LineChartSvg data={data.line as any} settings={settings} />;
      case 'PICTOGRAM': return <PictogramSvg data={data.pictogram as any} settings={settings} />;
      case 'COORDINATE_PLANE': return <CoordinatePlaneSvg data={data.coordinatePlane as any} settings={settings} />;
      case 'FUNCTION_GRAPH': return <FunctionGraphSvg data={data.functionGraph as any} settings={settings} />;
      case 'GEOMETRY_LINE_RAY':
      case 'GEOMETRY_ANGLE':
      case 'GEOMETRY_TRIANGLE':
      case 'GEOMETRY_QUADRILATERAL':
      case 'GEOMETRY_CIRCLE':
      case 'AI_GEOMETRY':
        return (
          <GeometrySvg
            data={data.geometry as any}
            settings={settings}
            onUpdateTrianglePoints={onUpdateTrianglePoints}
            onUpdateQuadPoints={onUpdateQuadPoints}
            onUpdateLineRayPoints={onUpdateLineRayPoints}
            onUpdateAnglePoints={onUpdateAnglePoints}
            onUpdateCirclePoints={onUpdateCirclePoints}
          />
        );
      case 'GEOMETRY_SPATIAL':
        return <SpatialGeometrySvg data={data.spatialGeometry as any} settings={settings} />;
      case 'FRACTION_BAR': return <FractionBarSvg data={data.fractionBar as any} settings={settings} />;
      case 'NUMBER_LINE': return <NumberLineSvg data={data.numberLine as any} settings={settings} />;
      default: return <div className="text-sm text-slate-400">Chưa chọn loại hình vẽ</div>;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100/80 overflow-hidden relative select-none">
      {/* Top Floating Control Bar */}
      <div className="h-11 bg-white/95 backdrop-blur border-b border-slate-200 px-3 md:px-4 flex items-center justify-between shrink-0 z-10 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {currentDoc.settings.examMode ? (
            <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white shadow-xs">
              <Printer className="w-3 h-3" />
              <span>Chế độ In Đề (Đen trắng SGK)</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              <Sparkles className="w-3 h-3" />
              <span>Chế độ Màu sắc SGK</span>
            </span>
          )}

          <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200 text-[10px] font-medium text-slate-600">
            <Monitor className="w-3 h-3 text-slate-400 ml-1" />
            <button
              onClick={() => handleSetCanvasPreset(265, 265)}
              className={`px-1.5 py-0.5 rounded transition ${width === 265 && height === 265 ? 'bg-white font-bold text-blue-700 shadow-xs' : 'hover:text-slate-900'}`}
              title="Đề thi chia đôi cột (Kích thước thật ~7cm)"
            >
              Cột 7cm
            </button>
            <button
              onClick={() => handleSetCanvasPreset(300, 300)}
              className={`px-1.5 py-0.5 rounded transition ${width === 300 && height === 300 ? 'bg-white font-bold text-blue-700 shadow-xs' : 'hover:text-slate-900'}`}
              title="Hình nhỏ góc trang (Kích thước thật ~8cm)"
            >
              Góc 8cm
            </button>
            <button
              onClick={() => handleSetCanvasPreset(600, 450)}
              className={`px-1.5 py-0.5 rounded transition ${width === 600 && height === 450 ? 'bg-white font-bold text-blue-700 shadow-xs' : 'hover:text-slate-900'}`}
              title="Kéo dài toàn trang A4 (Kích thước thật ~16cm)"
            >
              Trang 16cm
            </button>
          </div>
        </div>

        {isGeometry && (
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200 text-xs">
            <button onClick={handleCenterShape} className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-white hover:text-blue-700 rounded transition shadow-2xs" title="Căn giữa toàn bộ hình học vào trang canvas">
              <AlignCenter className="w-3 h-3 text-blue-600" />
              <span className="hidden md:inline">Căn giữa</span>
            </button>
            <button onClick={handleFitShape} className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-white hover:text-blue-700 rounded transition shadow-2xs" title="Tự động căn chỉnh vừa vặn khung hình (Fit to Canvas)">
              <Maximize className="w-3 h-3 text-emerald-600" />
              <span className="hidden md:inline">Fit hình</span>
            </button>
            <div className="h-3 w-px bg-slate-300 mx-0.5"></div>
            <button onClick={() => handleScaleShape(1.12)} className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition" title="Phóng to hình học (+12%)"><Plus className="w-3 h-3" /></button>
            <button onClick={() => handleScaleShape(0.88)} className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition" title="Thu nhỏ hình học (-12%)"><Minus className="w-3 h-3" /></button>
            <div className="h-3 w-px bg-slate-300 mx-0.5"></div>
            <div className="flex items-center gap-0.5">
              <button onClick={() => handleTranslateShape(0, -20)} className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition"><ArrowUp className="w-3 h-3" /></button>
              <button onClick={() => handleTranslateShape(0, 20)} className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition"><ArrowDown className="w-3 h-3" /></button>
              <button onClick={() => handleTranslateShape(-20, 0)} className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition"><ArrowLeft className="w-3 h-3" /></button>
              <button onClick={() => handleTranslateShape(20, 0)} className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition"><ArrowRight className="w-3 h-3" /></button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1">
          <button onClick={handleZoomOut} className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"><ZoomOut className="w-3.5 h-3.5" /></button>
          <button onClick={handleResetZoom} className="px-1.5 py-0.5 text-xs font-mono font-semibold text-slate-700 hover:bg-slate-100 rounded transition">{zoomLevel}%</button>
          <button onClick={handleZoomIn} className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"><ZoomIn className="w-3.5 h-3.5" /></button>
          <div className="h-4 w-px bg-slate-200 mx-0.5"></div>
          <button onClick={() => setBgPattern((prev) => (prev === 'plain' ? 'grid' : prev === 'grid' ? 'dots' : 'plain'))} className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"><Grid className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Main Canvas Host Area */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-auto flex items-center justify-center p-6 transition-all ${
          bgPattern === 'grid'
            ? 'bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:20px_20px]'
            : bgPattern === 'dots'
            ? 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] bg-[size:16px_16px]'
            : 'bg-slate-200/50'
        }`}
      >
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease-out',
          }}
          className="bg-white rounded-md shadow-xl border border-slate-300/80 p-4 inline-block relative group"
        >
          {/* Single source of drag coordinates: SVG controls and its dynamic viewBox. */}
          <div style={{ width, height }}>
            {renderSvgContent()}
          </div>
        </div>
      </div>

      {/* Bottom Floating Quick Actions Banner */}
      <div className="absolute bottom-4 right-6 flex items-center gap-2 z-20">
        <button
          onClick={onCopyImage}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900/90 hover:bg-slate-900 text-white rounded-lg shadow-xl backdrop-blur-sm text-xs font-bold transition hover:scale-105 border border-slate-700"
          title="Sao chép ảnh vào Clipboard để dán Ctrl + V vào Word"
        >
          <Copy className="w-4 h-4 text-emerald-400" />
          <span>Sao chép hình sang Word</span>
        </button>
      </div>
    </div>
  );
};