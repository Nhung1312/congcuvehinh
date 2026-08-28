import React from 'react';
import { BaseChartSettings, SpatialGeometryData } from '../types';
import { calculateSpatialGeometry } from '../utils/spatialMath';
import { SvgPatternDefs } from './patterns/SvgPatterns';
import { SGK_STYLE, getMathFontFamily } from '../constants/style';

interface SpatialGeometrySvgProps {
  data: SpatialGeometryData;
  settings: BaseChartSettings;
}

export const SpatialGeometrySvg: React.FC<SpatialGeometrySvgProps> = ({ data, settings }) => {
  const width = settings.width || 600;
  const height = settings.height || 460;
  const title = settings.title;
  const showTitle = settings.showTitle !== false && Boolean(title);
  const examMode = settings.examMode;
  const fontFamily = getMathFontFamily(settings.fontFamily);

  const strokeColor = '#000000';
  const strokeWidth = settings.strokeWidth || SGK_STYLE.strokeWidth.main;
  const fontSize = settings.fontSize || SGK_STYLE.fontSize.label;
  const showVertices = data.showVertices !== false;
  const showLabels = data.showLabels !== false;

  const result = calculateSpatialGeometry(data, width, height);
  const { vertexList, edges, faces, altitudeRightAngle, dimensionLines, curvedArcs } = result;

  // Quyết định vị trí thông minh cho tên đỉnh
  const getVertexLabelAnchor = (name: string, pt: { x: number; y: number }) => {
    const cx = width / 2;
    const cy = height / 2;
    const dx = pt.x - cx;
    const dy = pt.y - cy;

    let textAnchor: 'start' | 'middle' | 'end' = 'middle';
    let offsetX = 0;
    let offsetY = -8;

    if (name === 'S') {
      offsetY = -10;
    } else if (name === 'O' || name === 'H') {
      offsetY = 12;
    } else if (dx > 30) {
      textAnchor = 'start';
      offsetX = 8;
      offsetY = dy < -30 ? -6 : 6;
    } else if (dx < -30) {
      textAnchor = 'end';
      offsetX = -8;
      offsetY = dy < -30 ? -6 : 6;
    } else {
      offsetY = dy > 0 ? 14 : -10;
    }

    return { textAnchor, offsetX, offsetY };
  };

  return (
    <svg
      id="svg-math-canvas"
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      style={{
        fontFamily,
        backgroundColor: settings.backgroundColor || '#ffffff',
      }}
      className="select-none mx-auto block max-w-full h-auto"
    >
      <SvgPatternDefs />

      <defs>
        {/* Mũi tên cho đường kích thước */}
        <marker
          id="dimension-arrow-start"
          viewBox="0 0 6 6"
          refX="0"
          refY="3"
          markerWidth="4.5"
          markerHeight="4.5"
          orient="auto-start-reverse"
        >
          <path d="M 6 0 L 0 3 L 6 6 z" fill="#475569" />
        </marker>
        <marker
          id="dimension-arrow-end"
          viewBox="0 0 6 6"
          refX="6"
          refY="3"
          markerWidth="4.5"
          markerHeight="4.5"
          orient="auto"
        >
          <path d="M 0 0 L 6 3 L 0 6 z" fill="#475569" />
        </marker>
      </defs>

      <rect width={width} height={height} fill={settings.backgroundColor || '#ffffff'} />

      {showTitle && (
        <text
          x={width / 2}
          y={SGK_STYLE.margin.titleY}
          textAnchor="middle"
          fontSize={settings.fontSize ? settings.fontSize + 2 : SGK_STYLE.fontSize.title}
          fontWeight="bold"
          fill="#000000"
        >
          {title}
        </text>
      )}

      {/* 1. Đổ bóng các mặt phẳng (Face shading) */}
      {!examMode && data.showFaceShading && (
        <g id="spatial-faces">
          {faces.map((f, idx) => {
            const pointsStr = f.points.map((p) => `${p.x},${p.y}`).join(' ');
            return (
              <polygon
                key={'face_' + idx}
                points={pointsStr}
                fill={data.shadingColor || '#3b82f6'}
                fillOpacity={data.shadingOpacity || (idx === 0 ? 0.08 : 0.12)}
                stroke="none"
              />
            );
          })}
        </g>
      )}

      {/* 2. Vẽ hình elip cho Hình trụ / Hình nón (Nửa sau nét đứt, nửa trước nét liền) */}
      {curvedArcs && (
        <g id="spatial-curves">
          {curvedArcs.topEllipse && (
            <ellipse
              cx={curvedArcs.topEllipse.cx}
              cy={curvedArcs.topEllipse.cy}
              rx={curvedArcs.topEllipse.rx}
              ry={curvedArcs.topEllipse.ry}
              fill={examMode || !data.showFaceShading ? 'none' : '#3b82f6'}
              fillOpacity={0.06}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          )}

          {curvedArcs.bottomEllipse && (
            <>
              {/* Nửa sau: Nét đứt (y < cy) */}
              <path
                d={`M ${curvedArcs.bottomEllipse.cx - curvedArcs.bottomEllipse.rx} ${curvedArcs.bottomEllipse.cy} 
                    A ${curvedArcs.bottomEllipse.rx} ${curvedArcs.bottomEllipse.ry} 0 0 1 
                    ${curvedArcs.bottomEllipse.cx + curvedArcs.bottomEllipse.rx} ${curvedArcs.bottomEllipse.cy}`}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray="5,4"
              />
              {/* Nửa trước: Nét liền (y > cy) */}
              <path
                d={`M ${curvedArcs.bottomEllipse.cx - curvedArcs.bottomEllipse.rx} ${curvedArcs.bottomEllipse.cy} 
                    A ${curvedArcs.bottomEllipse.rx} ${curvedArcs.bottomEllipse.ry} 0 0 0 
                    ${curvedArcs.bottomEllipse.cx + curvedArcs.bottomEllipse.rx} ${curvedArcs.bottomEllipse.cy}`}
                fill={examMode || !data.showFaceShading ? 'none' : '#3b82f6'}
                fillOpacity={0.06}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
            </>
          )}
        </g>
      )}

      {/* 3. Vẽ các cạnh khuất (Nét đứt - Dashed) TRƯỚC */}
      <g id="hidden-edges">
        {edges
          .filter((e) => e.isHidden)
          .map((e, idx) => (
            <line
              key={'hidden_edge_' + idx}
              x1={e.fromPt.x}
              y1={e.fromPt.y}
              x2={e.toPt.x}
              y2={e.toPt.y}
              stroke={e.color || strokeColor}
              strokeWidth={e.isAltitude ? strokeWidth * 1.1 : strokeWidth}
              strokeDasharray="5,4"
            />
          ))}
      </g>

      {/* 4. Vẽ ký hiệu góc vuông 3D tại chân đường cao */}
      {altitudeRightAngle && data.showRightAngleMarkers && (
        <path
          d={`M ${altitudeRightAngle.arm1.x} ${altitudeRightAngle.arm1.y} 
              L ${altitudeRightAngle.arm1.x + (altitudeRightAngle.arm2.x - altitudeRightAngle.vertex.x)} 
                ${altitudeRightAngle.arm1.y + (altitudeRightAngle.arm2.y - altitudeRightAngle.vertex.y)} 
              L ${altitudeRightAngle.arm2.x} ${altitudeRightAngle.arm2.y}`}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth * 0.8}
        />
      )}

      {/* 5. Vẽ các cạnh thấy (Nét liền - Solid) SAU */}
      <g id="visible-edges">
        {edges
          .filter((e) => !e.isHidden)
          .map((e, idx) => (
            <line
              key={'visible_edge_' + idx}
              x1={e.fromPt.x}
              y1={e.fromPt.y}
              x2={e.toPt.x}
              y2={e.toPt.y}
              stroke={e.color || strokeColor}
              strokeWidth={strokeWidth}
            />
          ))}
      </g>

      {/* 6. Đường đo kích thước (Dimensions) */}
      {dimensionLines.map((d, idx) => (
        <g key={'dim_' + idx} className="text-slate-600">
          <line
            x1={d.from.x}
            y1={d.from.y}
            x2={d.to.x}
            y2={d.to.y}
            stroke="#64748b"
            strokeWidth={1}
            markerStart="url(#dimension-arrow-start)"
            markerEnd="url(#dimension-arrow-end)"
          />
          <text
            x={(d.from.x + d.to.x) / 2}
            y={(d.from.y + d.to.y) / 2 - 4}
            textAnchor="middle"
            fontSize={fontSize - 2}
            fontWeight="bold"
            fill="#334155"
            style={{
              paintOrder: 'stroke fill',
              stroke: '#ffffff',
              strokeWidth: 3,
            }}
          >
            {d.label}
          </text>
        </g>
      ))}

      {/* 7. Các điểm đỉnh (Vertices Dots) */}
      {showVertices && (
        <g id="vertices-dots">
          {vertexList.map((v) => (
            <circle
              key={'dot_' + v.name}
              cx={v.x}
              cy={v.y}
              r={2.5}
              fill="#000000"
              stroke="#ffffff"
              strokeWidth={1}
            />
          ))}
        </g>
      )}

      {/* 8. Tên các đỉnh (Vertex Labels) với Halo bảo vệ chữ */}
      {showLabels && (
        <g id="vertices-labels">
          {vertexList.map((v) => {
            const { textAnchor, offsetX, offsetY } = getVertexLabelAnchor(v.name, v);
            return (
              <text
                key={'label_' + v.name}
                x={v.x + offsetX}
                y={v.y + offsetY}
                textAnchor={textAnchor}
                fontSize={fontSize}
                fontWeight="bold"
                fill="#000000"
                style={{
                  paintOrder: 'stroke fill',
                  stroke: '#ffffff',
                  strokeWidth: 3.5,
                  strokeLinejoin: 'round',
                }}
              >
                {v.name}
              </text>
            );
          })}
        </g>
      )}
    </svg>
  );
};
