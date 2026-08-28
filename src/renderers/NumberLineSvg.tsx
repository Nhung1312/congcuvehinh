import React from 'react';
import { BaseChartSettings, NumberLineData } from '../types';
import { SvgPatternDefs } from './patterns/SvgPatterns';
import { SGK_STYLE, getMathFontFamily } from '../constants/style';
import { calculateOptimalSubDivisions, parseMathExpression } from '../utils/numberLineMath';

interface NumberLineSvgProps {
  data: NumberLineData;
  settings: BaseChartSettings;
}

export const NumberLineSvg: React.FC<NumberLineSvgProps> = ({ data, settings }) => {
  const {
    min = -3,
    max = 5,
    step = 1,
    subDivision,
    autoSubDivision = true,
    showOrigin = true,
    showArrows = true,
    markers = [],
    illustration,
  } = data;

  const width = settings.width || 640;
  const height = settings.height || (illustration?.enabled ? 320 : 250);
  const title = settings.title;
  const showTitle = settings.showTitle !== false && Boolean(title);
  const examMode = settings.examMode;
  const fontFamily = getMathFontFamily(settings.fontFamily);

  const marginX = 55;
  // Nếu bật minh họa hình học, đẩy trục số thấp xuống một chút để có không gian dựng tam giác
  const lineY = illustration?.enabled ? height * 0.68 : height / 2 + 10;
  const axisLength = width - marginX * 2;

  const toScreenX = (val: number) => marginX + ((val - min) / (max - min)) * axisLength;

  const strokeColor = '#000000';
  const strokeWidth = settings.strokeWidth || SGK_STYLE.strokeWidth.axis;

  // Tính toán số phần chia nhỏ đơn vị (Sub-division)
  const optimalSubDiv = autoSubDivision
    ? calculateOptimalSubDivisions(markers, subDivision)
    : Math.max(1, subDivision || 1);

  // Danh sách các vạch chia chính (số nguyên hoặc theo step)
  const mainTicks: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max; v += step) {
    mainTicks.push(Math.round(v * 1000) / 1000);
  }

  // Danh sách các vạch chia phụ (Sub-ticks)
  const subTicks: number[] = [];
  if (optimalSubDiv > 1) {
    const subStep = step / optimalSubDiv;
    const startVal = Math.floor(min);
    const endVal = Math.ceil(max);
    for (let cur = startVal; cur <= endVal; cur += step) {
      for (let i = 1; i < optimalSubDiv; i++) {
        const subVal = Math.round((cur + i * subStep) * 10000) / 10000;
        if (subVal >= min && subVal <= max) {
          subTicks.push(subVal);
        }
      }
    }
  }

  // Render nhãn giá trị toán học (Phân số, Căn thức, Số tuần hoàn)
  const renderMathValueLabel = (
    expr: string,
    numericVal: number,
    x: number,
    y: number,
    color: string = '#000000',
    fontSize: number = 13
  ) => {
    const parsed = parseMathExpression(expr || numericVal);

    // 1. Dạng phân số có gạch ngang toán học đẹp
    if (parsed.type === 'fraction' && parsed.fraction) {
      const { numerator, denominator } = parsed.fraction;
      const isNeg = numerator < 0;
      const absNum = Math.abs(numerator);
      const fracWidth = Math.max(16, Math.max(String(absNum).length, String(denominator).length) * 8 + 6);

      return (
        <g transform={`translate(${x}, ${y})`}>
          {isNeg && (
            <text
              x={-fracWidth / 2 - 4}
              y={2}
              textAnchor="middle"
              fontSize={fontSize}
              fill={color}
              fontWeight="normal"
            >
              -
            </text>
          )}
          {/* Tử số */}
          <text
            x={0}
            y={-5}
            textAnchor="middle"
            fontSize={fontSize - 1}
            fill={color}
            fontWeight="bold"
          >
            {absNum}
          </text>
          {/* Gạch phân số */}
          <line
            x1={-fracWidth / 2}
            y1={0}
            x2={fracWidth / 2}
            y2={0}
            stroke={color}
            strokeWidth={1.2}
          />
          {/* Mẫu số */}
          <text
            x={0}
            y={12}
            textAnchor="middle"
            fontSize={fontSize - 1}
            fill={color}
            fontWeight="bold"
          >
            {denominator}
          </text>
        </g>
      );
    }

    // 2. Dạng số thập phân vô hạn tuần hoàn: 0,(3) hoặc 0.\bar{3}
    if (parsed.type === 'repeating') {
      const displayStr = expr.includes('(') ? expr : `${parsed.expression}`;
      return (
        <text
          x={x}
          y={y + 5}
          textAnchor="middle"
          fontSize={fontSize}
          fill={color}
          fontWeight="bold"
        >
          {displayStr}
        </text>
      );
    }

    // 3. Dạng căn thức vô tỉ: √2, √3, √5, π
    if (parsed.type === 'irrational') {
      return (
        <text
          x={x}
          y={y + 5}
          textAnchor="middle"
          fontSize={fontSize + 1}
          fill={color}
          fontWeight="bold"
        >
          {expr || parsed.expression}
        </text>
      );
    }

    // 4. Số nguyên hoặc số thập phân thông thường
    return (
      <text
        x={x}
        y={y + 5}
        textAnchor="middle"
        fontSize={fontSize}
        fill={color}
        fontWeight="bold"
      >
        {expr || String(numericVal)}
      </text>
    );
  };

  // Chiều dài 1 đơn vị theo pixel
  const unitPx = toScreenX(1) - toScreenX(0);

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

      {/* Nền canvas */}
      <rect width={width} height={height} fill={settings.backgroundColor || '#ffffff'} />

      {/* Tiêu đề biểu đồ */}
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

      {/* ======================================================== */}
      {/* PHẦN MINH HỌA HÌNH HỌC CHO SỐ VÔ TỈ (√2, √3, √5...) */}
      {/* ======================================================== */}
      {illustration?.enabled && min <= 0 && max >= 2 && (
        <g id="irrational-illustration" className="illustration-layer">
          {(() => {
            const targetType = illustration.targetType || 'sqrt2';
            const illColor = examMode ? '#000000' : illustration.color || '#2563eb';
            const xO = toScreenX(0);
            const yO = lineY;

            if (targetType === 'sqrt2') {
              const xA = toScreenX(1);
              const yA = lineY;
              const xB = xA;
              const yB = yA - unitPx; // Dựng đoạn AB = 1 hướng lên trên
              const xTarget = toScreenX(Math.SQRT2); // Điểm √2 trên trục

              // Bán kính R = OB = unitPx * √2
              const radius = unitPx * Math.SQRT2;

              return (
                <g>
                  {/* Tam giác vuông OAB */}
                  {illustration.showTriangle && (
                    <>
                      {/* Miền tam giác tô mờ */}
                      {!examMode && (
                        <polygon
                          points={`${xO},${yO} ${xA},${yA} ${xB},${yB}`}
                          fill={illColor}
                          fillOpacity={0.08}
                        />
                      )}

                      {/* Cạnh đáy OA = 1 (trên trục) */}
                      <line
                        x1={xO}
                        y1={yO}
                        x2={xA}
                        y2={yA}
                        stroke={illColor}
                        strokeWidth={2}
                      />

                      {/* Cạnh đứng AB = 1 */}
                      <line
                        x1={xA}
                        y1={yA}
                        x2={xB}
                        y2={yB}
                        stroke={illColor}
                        strokeWidth={1.8}
                      />

                      {/* Cạnh huyền OB = √2 */}
                      <line
                        x1={xO}
                        y1={yO}
                        x2={xB}
                        y2={yB}
                        stroke={illColor}
                        strokeWidth={2}
                      />

                      {/* Ký hiệu góc vuông tại A */}
                      {illustration.showRightAngleMarker && (
                        <path
                          d={`M ${xA - 8} ${yA} L ${xA - 8} ${yA - 8} L ${xA} ${yA - 8}`}
                          fill="none"
                          stroke={illColor}
                          strokeWidth={1.2}
                        />
                      )}

                      {/* Điểm đỉnh B */}
                      <circle cx={xB} cy={yB} r={3.5} fill={illColor} />
                      <text
                        x={xB + 6}
                        y={yB - 4}
                        fontSize={13}
                        fontWeight="bold"
                        fontStyle="italic"
                        fill={illColor}
                      >
                        B
                      </text>

                      {/* Nhãn điểm O và A phía trên */}
                      <text
                        x={xO - 10}
                        y={yO - 6}
                        fontSize={13}
                        fontWeight="bold"
                        fontStyle="italic"
                        fill={illColor}
                      >
                        O
                      </text>
                      <text
                        x={xA - 10}
                        y={yA - 6}
                        fontSize={13}
                        fontWeight="bold"
                        fontStyle="italic"
                        fill={illColor}
                      >
                        A
                      </text>
                    </>
                  )}

                  {/* Cung tròn bán kính OB tâm O cắt trục số tại √2 */}
                  {illustration.showArc && (
                    <>
                      {/* Cung tròn từ B(xA, yB) tới điểm (xTarget, yO) */}
                      <path
                        d={`M ${xB} ${yB} A ${radius} ${radius} 0 0 1 ${xTarget} ${yO}`}
                        fill="none"
                        stroke={illColor}
                        strokeWidth={1.5}
                        strokeDasharray={examMode ? '4 3' : '3 2'}
                      />

                      {/* Nét dóng giọt nước từ B xuống */}
                      <line
                        x1={xB}
                        y1={yB}
                        x2={xB}
                        y2={yA}
                        stroke={illColor}
                        strokeWidth={1}
                        strokeDasharray="2 2"
                      />
                    </>
                  )}

                  {/* Nhãn độ dài các cạnh (OA=1, AB=1, OB=√2) */}
                  {illustration.showSideLengths && (
                    <>
                      {/* Nhãn AB = 1 */}
                      <text
                        x={xA + 8}
                        y={(yA + yB) / 2 + 4}
                        fontSize={12}
                        fontWeight="bold"
                        fill={illColor}
                      >
                        1
                      </text>

                      {/* Nhãn OA = 1 */}
                      <text
                        x={(xO + xA) / 2}
                        y={yO - 6}
                        textAnchor="middle"
                        fontSize={12}
                        fontWeight="bold"
                        fill={illColor}
                      >
                        1
                      </text>

                      {/* Nhãn OB = √2 (nghiêng hoặc song song cạnh huyền) */}
                      <text
                        x={(xO + xB) / 2 - 12}
                        y={(yO + yB) / 2 - 6}
                        fontSize={13}
                        fontWeight="bold"
                        fill={illColor}
                      >
                        √2
                      </text>
                    </>
                  )}

                  {/* Khung giải thích định lý Pitago (Chế độ lớp 8) */}
                  {illustration.mode === 'pythagoras_grade8' && illustration.showFormulas && (
                    <g transform={`translate(${Math.min(xTarget + 30, width - 180)}, ${yB - 10})`}>
                      <rect
                        x={0}
                        y={0}
                        width={160}
                        height={66}
                        rx={6}
                        fill={examMode ? '#f8fafc' : '#eff6ff'}
                        stroke={illColor}
                        strokeWidth={1}
                      />
                      <text x={10} y={18} fontSize={11} fontWeight="bold" fill={illColor}>
                        Định lý Pitago:
                      </text>
                      <text x={10} y={36} fontSize={11} fill="#000000">
                        OB² = OA² + AB² = 1² + 1² = 2
                      </text>
                      <text x={10} y={54} fontSize={12} fontWeight="bold" fill={illColor}>
                        ⇒ OB = √2
                      </text>
                    </g>
                  )}
                </g>
              );
            }

            // Minh họa mở rộng cho √5 (Đáy 2, cao 1, huyền √5)
            if (targetType === 'sqrt5' && max >= 3) {
              const xA = toScreenX(2);
              const yA = lineY;
              const xB = xA;
              const yB = yA - unitPx;
              const xTarget = toScreenX(Math.sqrt(5));
              const radius = unitPx * Math.sqrt(5);

              return (
                <g>
                  {illustration.showTriangle && (
                    <>
                      <polygon
                        points={`${xO},${yO} ${xA},${yA} ${xB},${yB}`}
                        fill={illColor}
                        fillOpacity={0.08}
                      />
                      <line x1={xO} y1={yO} x2={xA} y2={yA} stroke={illColor} strokeWidth={2} />
                      <line x1={xA} y1={yA} x2={xB} y2={yB} stroke={illColor} strokeWidth={1.8} />
                      <line x1={xO} y1={yO} x2={xB} y2={yB} stroke={illColor} strokeWidth={2} />
                      {illustration.showRightAngleMarker && (
                        <path
                          d={`M ${xA - 8} ${yA} L ${xA - 8} ${yA - 8} L ${xA} ${yA - 8}`}
                          fill="none"
                          stroke={illColor}
                          strokeWidth={1.2}
                        />
                      )}
                      <circle cx={xB} cy={yB} r={3.5} fill={illColor} />
                      <text x={xB + 6} y={yB - 4} fontSize={13} fontWeight="bold" fontStyle="italic" fill={illColor}>B</text>
                      <text x={(xO + xA) / 2} y={yO - 6} textAnchor="middle" fontSize={12} fontWeight="bold" fill={illColor}>2</text>
                      <text x={xA + 8} y={(yA + yB) / 2 + 4} fontSize={12} fontWeight="bold" fill={illColor}>1</text>
                      <text x={(xO + xB) / 2 - 12} y={(yO + yB) / 2 - 6} fontSize={13} fontWeight="bold" fill={illColor}>√5</text>
                    </>
                  )}
                  {illustration.showArc && (
                    <path
                      d={`M ${xB} ${yB} A ${radius} ${radius} 0 0 1 ${xTarget} ${yO}`}
                      fill="none"
                      stroke={illColor}
                      strokeWidth={1.5}
                      strokeDasharray="3 2"
                    />
                  )}
                  {illustration.mode === 'pythagoras_grade8' && illustration.showFormulas && (
                    <g transform={`translate(${Math.min(xTarget + 20, width - 180)}, ${yB - 10})`}>
                      <rect x={0} y={0} width={160} height={66} rx={6} fill={examMode ? '#f8fafc' : '#eff6ff'} stroke={illColor} strokeWidth={1} />
                      <text x={10} y={18} fontSize={11} fontWeight="bold" fill={illColor}>Định lý Pitago:</text>
                      <text x={10} y={36} fontSize={11} fill="#000000">OB² = OA² + AB² = 2² + 1² = 5</text>
                      <text x={10} y={54} fontSize={12} fontWeight="bold" fill={illColor}>⇒ OB = √5</text>
                    </g>
                  )}
                </g>
              );
            }

            return null;
          })()}
        </g>
      )}

      {/* ======================================================== */}
      {/* THÂN TRỤC SỐ (TRỤC NẰM NGANG VÀ MŨI TÊN CHIỀU DƯƠNG) */}
      {/* ======================================================== */}
      <g id="number-line-axis">
        {/* Đường thẳng trục số chính */}
        <line
          x1={marginX - 18}
          y1={lineY}
          x2={marginX + axisLength + 22}
          y2={lineY}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />

        {/* Mũi tên chiều dương (bên phải) */}
        {showArrows && (
          <polygon
            points={`${marginX + axisLength + 24},${lineY} ${marginX + axisLength + 14},${lineY - 4.5} ${marginX + axisLength + 14},${lineY + 4.5}`}
            fill={strokeColor}
          />
        )}

        {/* Ký hiệu x hoặc chiều dương */}
        <text
          x={marginX + axisLength + 26}
          y={lineY + 4}
          fontSize={13}
          fontStyle="italic"
          fontWeight="bold"
          fill={strokeColor}
        >
          x
        </text>
      </g>

      {/* ======================================================== */}
      {/* CÁC VẠCH CHIA PHỤ (SUB-TICKS) - CHỈ VẼ VẠCH, KHÔNG GHI SỐ */}
      {/* ======================================================== */}
      {subTicks.map((subVal, idx) => {
        const sx = toScreenX(subVal);
        return (
          <line
            key={`sub-tick-${idx}-${subVal}`}
            x1={sx}
            y1={lineY - 3.5}
            x2={sx}
            y2={lineY + 3.5}
            stroke="#475569"
            strokeWidth={0.85}
          />
        );
      })}

      {/* ======================================================== */}
      {/* CÁC VẠCH CHIA CHÍNH (SỐ NGUYÊN) VÀ NHÃN CĂN CHÍNH GIỮA */}
      {/* ======================================================== */}
      {mainTicks.map((tVal) => {
        const sx = toScreenX(tVal);
        if (sx < marginX - 5 || sx > marginX + axisLength + 5) return null;

        // Vạch chính cao hơn (14px)
        return (
          <g key={`main-tick-${tVal}`}>
            <line
              x1={sx}
              y1={lineY - 7}
              x2={sx}
              y2={lineY + 7}
              stroke={strokeColor}
              strokeWidth={SGK_STYLE.strokeWidth.tick}
            />

            {/* Số nguyên hiển thị tại chân vạch, text-anchor="middle" căn thẳng tâm */}
            <text
              x={sx}
              y={lineY + 22}
              textAnchor="middle"
              fontSize={SGK_STYLE.fontSize.tick}
              fill="#000000"
              style={{
                paintOrder: 'stroke fill',
                stroke: '#ffffff',
                strokeWidth: 2.5,
                strokeLinejoin: 'round',
              }}
            >
              {tVal}
            </text>
          </g>
        );
      })}

      {/* ======================================================== */}
      {/* CÁC ĐIỂM BIỂU DIỄN (MARKERS) TRÊN TRỤC SỐ */}
      {/* ======================================================== */}
      {markers.map((m) => {
        const numericVal = typeof m.numericValue === 'number' ? m.numericValue : (m.value ?? 0);
        const expr = m.expression || String(m.label || m.value || numericVal);
        const sx = toScreenX(numericVal);

        if (sx < marginX - 15 || sx > marginX + axisLength + 15) return null;

        const markerColor = examMode ? '#000000' : m.color || '#dc2626';
        const offsetX = m.labelOffset?.x || 0;
        const offsetY = m.labelOffset?.y || 0;

        // Kiểm tra xem vị trí này có trùng đúng một vạch số nguyên chính không
        const isExactMainInteger = Number.isInteger(numericVal) && mainTicks.includes(numericVal);

        return (
          <g key={m.id} className="number-line-marker-group">
            {/* Chấm tròn biểu diễn điểm */}
            <circle
              cx={sx}
              cy={lineY}
              r={4.5}
              fill={markerColor}
              stroke="#000000"
              strokeWidth={1}
            />

            {/* Tên điểm biểu diễn (VD: A, B, C, O, M) ở phía trên */}
            {m.pointName && (
              <text
                x={sx + offsetX}
                y={lineY - 14 + offsetY}
                textAnchor="middle"
                fontSize={SGK_STYLE.fontSize.label}
                fontWeight="bold"
                fontStyle="italic"
                fill={examMode ? '#000000' : markerColor}
                style={{
                  paintOrder: 'stroke fill',
                  stroke: '#ffffff',
                  strokeWidth: 3,
                  strokeLinejoin: 'round',
                }}
              >
                {m.pointName}
              </text>
            )}

            {/* Nhãn giá trị của điểm bên dưới (Phân số, Căn thức, Vô hạn tuần hoàn, v.v.) */}
            {/* Nếu không phải số nguyên trùng vạch chính (hoặc nếu là phân số/căn thức), hiển thị rõ */}
            {(!isExactMainInteger || expr.includes('/') || expr.includes('√') || expr.includes('(')) && (
              <g
                transform={`translate(${offsetX}, ${offsetY})`}
                style={{
                  paintOrder: 'stroke fill',
                }}
              >
                {renderMathValueLabel(
                  expr,
                  numericVal,
                  sx,
                  lineY + 28,
                  examMode ? '#000000' : markerColor,
                  13
                )}
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
};
