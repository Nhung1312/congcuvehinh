export type ToolCategory = 'ai' | 'statistics' | 'coordinates' | 'geometry' | 'spatial' | 'models';

export type ToolType = 
  // AI Tự động dựng hình
  | 'AI_GEOMETRY'
  // Thống kê - Biểu đồ
  | 'PIE_CHART'
  | 'BAR_CHART'
  | 'DOUBLE_BAR_CHART'
  | 'LINE_CHART'
  | 'PICTOGRAM'
  // Tọa độ - Đồ thị
  | 'COORDINATE_PLANE'
  | 'FUNCTION_GRAPH'
  // Hình phẳng
  | 'GEOMETRY_LINE_RAY'
  | 'GEOMETRY_ANGLE'
  | 'GEOMETRY_TRIANGLE'
  | 'GEOMETRY_QUADRILATERAL'
  | 'GEOMETRY_CIRCLE'
  | 'GEOMETRY_POLYGON'
  | 'GEOMETRY_SYMMETRY'
  // Hình không gian (Toán 7-8-9)
  | 'GEOMETRY_SPATIAL'
  // Mô hình toán
  | 'FRACTION_BAR'
  | 'NUMBER_LINE';

export type PatternType = 
  | 'solid'
  | 'hatch-right'       // Gạch chéo (Phải)
  | 'hatch-left'        // Gạch chéo (Trái)
  | 'hatch-horizontal'  // Sọc ngang
  | 'hatch-vertical'    // Sọc dọc
  | 'grid-square'       // Lưới vuông
  | 'grid-cross'        // Caro chéo
  | 'crosshatch'        // Caro chéo / gạch chéo
  | 'dots'              // Chấm bi
  | 'dots-dense'        // Chấm bi dày
  | 'waves'             // Sóng nước
  | 'brick';            // Gạch so le

export interface BaseChartSettings {
  title: string;
  subtitle?: string;
  showTitle?: boolean;
  fontFamily: string;
  titleFontSize?: number;
  labelFontSize?: number;
  fontSize?: number;
  strokeWidth: number;
  examMode: boolean; // Chế độ in đề / đen trắng chuẩn SGK
  width: number;
  height: number;
  showGrid?: boolean;
  showLegend: boolean;
  showValues?: boolean;
  legendPosition: 'bottom' | 'right' | 'top' | 'none';
  backgroundColor: string;
}

// 1. Biểu đồ hình quạt tròn (Pie Chart)
export interface PieSlice {
  id: string;
  name: string;
  value: number; // Giá trị thô hoặc %
  percentage?: number; // Tự động tính
  angle?: number; // Tự động tính
  color: string;
  pattern: PatternType;
  patternColor: string;
  patternBg: string;
  isLocked?: boolean; // Khóa tỉ lệ như trong video
  showLabelOnSlice?: boolean;
}

export interface PieChartData {
  slices: PieSlice[];
  unit: string;
  radius: number;
  donutRatio?: number; // 0 cho quạt tròn kín
  showPercentageOnSlice: boolean;
  showNameOnSlice: boolean;
  showValuesOnSlice: boolean;
  decimalPlaces: number;
  startAngle: number; // Góc bắt đầu (độ)
  explodeOffset?: number;
}

// 2. Biểu đồ cột (Bar Chart)
export interface BarItem {
  id: string;
  category: string;
  value: number;
  color: string;
  pattern: PatternType;
  patternColor?: string;
}

export interface BarChartData {
  orientation: 'vertical' | 'horizontal';
  items: BarItem[];
  xAxisTitle: string;
  yAxisTitle: string;
  unit: string;
  minValue?: number;
  maxValue?: number;
  stepSize?: number;
  barWidth: number;
  barGap: number;
  showValueOnBar: boolean;
  showAxisArrows: boolean;
  showGridLines: boolean;
}

// 3. Biểu đồ cột kép (Double Bar Chart)
export interface DoubleBarItem {
  id: string;
  category: string;
  value1: number;
  value2: number;
}

export interface DoubleBarChartData {
  items: DoubleBarItem[];
  group1Name: string;
  group2Name: string;
  group1Color: string;
  group1Pattern: PatternType;
  group2Color: string;
  group2Pattern: PatternType;
  xAxisTitle: string;
  yAxisTitle: string;
  unit: string;
  minValue?: number;
  maxValue?: number;
  stepSize?: number;
  barWidth: number;
  groupGap: number;
  showValueOnBar: boolean;
  showGridLines: boolean;
}

// 4. Biểu đồ đoạn thẳng (Line Chart)
export interface LinePoint {
  id: string;
  xLabel: string;
  xValue: number;
  yValue: number;
  pointName?: string;
}

export interface LineChartData {
  points: LinePoint[];
  xAxisTitle: string;
  yAxisTitle: string;
  unit: string;
  xStart?: number;
  xEnd?: number;
  xStep?: number;
  yStart?: number;
  yEnd?: number;
  yStep?: number;
  lineColor: string;
  lineWidth: number;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  pointRadius: number;
  pointStyle: 'circle' | 'square' | 'cross' | 'hollow-circle';
  showPoints: boolean;
  showValues: boolean;
  showDashedProjections: boolean;
  showGridLines: boolean;
}

// 5. Biểu đồ tranh (Pictogram)
export type PictogramIconType = 
  | 'book'
  | 'student'
  | 'star'
  | 'bus'
  | 'tree'
  | 'apple'
  | 'ball'
  | 'pencil'
  | 'flag'
  | 'bicycle'
  | 'circle';

export interface PictogramRow {
  id: string;
  category: string;
  count: number;
}

export interface PictogramData {
  rows: PictogramRow[];
  iconType: PictogramIconType;
  customIconLabel?: string;
  valuePerIcon: number; // Ví dụ: 1 biểu tượng = 10 học sinh
  allowHalfIcon: boolean;
  iconSize: number;
  iconColor: string;
  unit: string;
  legendText: string;
  rowGap: number;
}

// 6. Mặt phẳng tọa độ (Oxy)
export interface OxyPoint {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
  showCoordinates: boolean;
  showProjections: boolean; // Dóng nét đứt tới Ox, Oy
}

export interface OxyLineSegment {
  id: string;
  fromPointId: string;
  toPointId: string;
  style: 'solid' | 'dashed';
  color: string;
  width: number;
  isRay?: boolean;
  isLine?: boolean;
}

export interface CoordinatePlaneData {
  xMin: number;
  xMax: number;
  xStep?: number;
  yMin: number;
  yMax: number;
  yStep?: number;
  step?: number;
  points: OxyPoint[];
  segments: OxyLineSegment[];
  showGrid?: boolean;
  showSubGrid?: boolean;
  showAxisNumbers?: boolean;
  originLabel?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

// 7. Đồ thị hàm số (Function Graph)
export interface SecondaryFunctionConfig {
  enabled: boolean;
  functionType: 'linear' | 'quadratic' | 'inverse';
  a: number;
  b: number;
  lineColor?: string;
  name?: string; // e.g. "d'", "d2", "P"
}

export interface FunctionGraphData {
  functionType: 'linear' | 'quadratic' | 'inverse'; // y = ax + b | y = ax^2 | y = a/x
  a: number;
  b: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  xStep?: number;
  yStep?: number;
  showTable?: boolean;
  tablePoints?: number[]; // Các giá trị x lập bảng
  showEquation?: boolean;
  showGrid?: boolean;
  lineColor?: string;
  lineWidth?: number;
  dashedProjections?: boolean;
  curveColor?: string;
  curveWidth?: number;
  showSpecialPoints?: boolean; // Đỉnh parabol, giao Ox Oy

  // Đồ thị thứ 2 & Tìm giao điểm đại số
  secondFunction?: SecondaryFunctionConfig;
  showIntersections?: boolean; // Tự động đánh dấu giao điểm A, B
  showIntersectionProjections?: boolean; // Dóng nét đứt từ giao điểm xuống Ox, Oy
  intersectionPointNames?: [string, string]; // e.g. ['A', 'B']
}

// 8. Hình phẳng (Geometry 2D)
export type TriangleType = 'general' | 'right' | 'isosceles' | 'equilateral' | 'right-isosceles' | 'obtuse';
export type QuadType =
  | 'general'
  | 'trapezoid'
  | 'right-trapezoid'
  | 'isosceles-trapezoid'
  | 'parallelogram'
  | 'rectangle'
  | 'rhombus'
  | 'square'
  | 'cyclic'; // Tứ giác nội tiếp đường tròn
export type StrokeDashType = 'solid' | 'dashed' | 'dotted';

export interface Point2D {
  x: number;
  y: number;
}

// Hệ thống Style dùng chung cho toàn bộ các hình học 2D
export interface GeometrySegmentStyle {
  strokeColor?: string; // e.g. '#000000', '#ef4444'
  strokeWidth?: number; // e.g. 1.5, 2, 3
  strokeStyle?: StrokeDashType; // 'solid' | 'dashed' | 'dotted'
}

export interface GeometryFillStyle {
  enabled: boolean;
  color: string; // Hex color e.g. '#3b82f6'
  opacity: number; // 0 to 1, e.g. 0.2
}

export interface GeometryPointStyle {
  show?: boolean;
  color?: string;
  size?: number; // radius, default 3
}

export interface GeometryTextStyle {
  show?: boolean;
  color?: string;
  fontSize?: number;
  fontStyle?: 'normal' | 'italic';
  fontWeight?: 'normal' | 'bold' | 'semibold';
}

export interface AltitudeConfig {
  fromVertex: 'A' | 'B' | 'C';
  enabled: boolean;
  label?: string; // 'H', 'K', 'L'
  style?: StrokeDashType;
  color?: string;
  strokeWidth?: number;
  showRightAngle?: boolean;
}

export interface MedianConfig {
  fromVertex: 'A' | 'B' | 'C';
  enabled: boolean;
  label?: string; // 'M', 'N', 'P'
  style?: StrokeDashType;
  color?: string;
  strokeWidth?: number;
  showTickMarks?: boolean;
}

export interface BisectorConfig {
  fromVertex: 'A' | 'B' | 'C';
  enabled: boolean;
  label?: string; // 'D', 'E', 'F'
  style?: StrokeDashType;
  color?: string;
  strokeWidth?: number;
  showAngleMarks?: boolean;
}

export interface PerpBisectorConfig {
  side: 'BC' | 'AC' | 'AB';
  enabled: boolean;
  label?: string; // 'd', 'Δ'
  style?: StrokeDashType;
  color?: string;
  strokeWidth?: number;
  showRightAngle?: boolean;
  showTickMarks?: boolean;
}

// ==========================================
// THIẾT LẬP ĐƯỜNG PHỤ & KÝ HIỆU HÌNH HỌC MỞ RỘNG (GIAI ĐOẠN 3.2)
// ==========================================

export type ArrowStyleType = 'none' | 'end' | 'start' | 'both';
export type EqualTickMarkType = 1 | 2 | 3 | 'o' | 'x';
export type EqualAngleMarkType = 1 | 2 | 3 | 'arc-tick' | 'arc-dot' | 'double-arc';

export interface CustomAuxLine {
  id: string;
  from: string; // Tên điểm bắt đầu, ví dụ 'A', 'B', 'C', 'D', 'M', 'N', 'P', 'H', 'K', 'O'
  to: string;   // Tên điểm kết thúc, ví dụ 'M', 'N', 'D', 'C', 'H', 'K'
  label?: string; // Nhãn đoạn thẳng, ví dụ 'MN', 'd'
  showLabel?: boolean;
  style?: StrokeDashType; // 'solid' | 'dashed' | 'dotted'
  color?: string; // Mã màu hex
  strokeWidth?: number; // Độ dày nét
  arrows?: ArrowStyleType; // Mũi tên một đầu, hai đầu
  showRightAngleWith?: string; // Hiển thị góc vuông với đoạn thẳng khác
  showMidpoint?: boolean;
  midpointLabel?: string;
  enabled: boolean;
}

export interface CustomAuxPoint {
  id: string;
  name: string; // Tên điểm, ví dụ 'M', 'N', 'I', 'K', 'P', 'H', 'O'
  type: 'midpoint' | 'ratio' | 'projection' | 'free' | 'intersection' | 'on-circle' | 'tangent' | 'orthocenter';
  segment?: string | [string, string] | string[]; // Đoạn thẳng chứa trung điểm hoặc tỉ lệ, ví dụ 'AB', ['B', 'C']
  ratio?: number; // Tỉ lệ chia (0 đến 1, ví dụ 0.5 = trung điểm, 0.33 = 1/3)
  fromPoint?: string; // Đỉnh hạ hình chiếu (cho type 'projection')
  targetLine?: string | [string, string] | string[]; // Cạnh nhận hình chiếu
  line1?: string | [string, string] | string[]; // Đường 1 (cho type 'intersection')
  line2?: string | [string, string] | string[]; // Đường 2 (cho type 'intersection')
  freeX?: number; // Tọa độ tự do
  freeY?: number;
  angle?: number; // Góc (độ) cho điểm trên đường tròn
  centerPoint?: string;
  radius?: number;
  showPoint?: boolean;
  showLabel?: boolean;
  color?: string;
}

export interface CustomRightAngleMarker {
  id: string;
  vertex: string; // Đỉnh góc vuông, ví dụ 'A', 'H', 'O', 'M'
  ray1: string;   // Điểm hướng 1, ví dụ 'B'
  ray2: string;   // Điểm hướng 2, ví dụ 'C'
  size?: number;  // Kích thước ô vuông (mặc định 10)
  color?: string;
  strokeWidth?: number;
  enabled: boolean;
}

export interface CustomParallelMarker {
  id: string;
  segment1: string | [string, string] | string[]; // Ví dụ 'AB' hoặc ['A', 'B']
  segment2: string | [string, string] | string[]; // Ví dụ 'CD' hoặc ['C', 'D']
  arrowCount?: 1 | 2 | 3; // Số lượng mũi tên (1, 2, 3)
  color?: string;
  enabled: boolean;
}

export interface CustomEqualSidesMarker {
  id: string;
  segments: (string | [string, string] | string[])[]; // Ví dụ ['AB', 'AC'] hoặc [['A', 'B'], ['A', 'C']]
  tickType?: EqualTickMarkType; // 1 | 2 | 3 | 'o' | 'x'
  color?: string;
  enabled: boolean;
}

export interface CustomEqualAnglesMarker {
  id: string;
  angles: { vertex: string; ray1: string; ray2: string }[]; // Ví dụ góc ∠BAD và ∠CAD
  arcType?: EqualAngleMarkType;
  color?: string;
  enabled: boolean;
}

export interface TriangleData {
  type: TriangleType;
  vertexNames: string[]; // [A, B, C]
  points?: [Point2D, Point2D, Point2D]; // Coordinates of [A, B, C]
  showVertices?: boolean;
  showLabels?: boolean;

  // Hệ thống Màu & Tô miền độc lập
  fill?: GeometryFillStyle;
  edgeStyles?: {
    AB?: GeometrySegmentStyle;
    BC?: GeometrySegmentStyle;
    CA?: GeometrySegmentStyle;
  };
  vertexStyles?: {
    A?: GeometryPointStyle;
    B?: GeometryPointStyle;
    C?: GeometryPointStyle;
  };
  labelStyles?: {
    A?: GeometryTextStyle;
    B?: GeometryTextStyle;
    C?: GeometryTextStyle;
  };
  
  // Chi tiết các đường phụ
  altitudes?: AltitudeConfig[];
  medians?: MedianConfig[];
  bisectors?: BisectorConfig[];
  perpBisectors?: PerpBisectorConfig[];
  auxLines?: CustomAuxLine[];
  auxPoints?: CustomAuxPoint[];
  rightAngleMarkers?: CustomRightAngleMarker[];
  parallelMarkers?: CustomParallelMarker[];
  equalSidesMarkers?: CustomEqualSidesMarker[];
  equalAnglesMarkers?: CustomEqualAnglesMarker[];

  // Đường tròn đặc biệt gắn với Tam giác
  inscribedCircle?: {
    enabled: boolean;
    showCenter?: boolean;
    centerName?: string; // 'I'
    showRadii?: boolean;
    color?: string;
    style?: StrokeDashType;
  };
  circumscribedCircle?: {
    enabled: boolean;
    showCenter?: boolean;
    centerName?: string; // 'O'
    showRadii?: boolean;
    color?: string;
    style?: StrokeDashType;
  };
  exscribedCircle?: {
    enabled: boolean;
    vertex?: 'A' | 'B' | 'C'; // Đường tròn bàng tiếp góc A, B hoặc C
    showCenter?: boolean;
    centerName?: string; // 'Ia'
    color?: string;
    style?: StrokeDashType;
  };
  diameterCircle?: {
    enabled: boolean;
    segment?: 'AB' | 'BC' | 'CA'; // Đường tròn đường kính AB, BC hoặc CA
    showCenter?: boolean;
    color?: string;
    style?: StrokeDashType;
  };

  // Định lý Ta-lét: Đường thẳng song song cắt hai cạnh tam giác (MN // BC)
  thales?: {
    enabled: boolean;
    pointMName?: string; // 'M'
    pointNName?: string; // 'N'
    ratio?: number; // Tỉ lệ AM/AB (mặc định 0.4, giá trị từ 0.05 đến 0.95)
    cutSide?: 'AB-AC' | 'BA-BC' | 'CA-CB'; // Cặp cạnh bị cắt
    showParallelMarkers?: boolean; // Ký hiệu mũi tên song song
    parallelMarkerType?: 1 | 2; // 1: '>', 2: '>>'
    showRatiosText?: boolean; // Hiển thị tỉ lệ "AM/AB = AN/AC = MN/BC"
    showDashedExtensions?: boolean; // Kéo dài đường thẳng MN nét đứt
    showFillTriangle?: boolean; // Highlight tam giác đồng dạng AMN
    fillColor?: string;
    fillOpacity?: number;
    lineStyle?: GeometrySegmentStyle;
    showPoints?: boolean;
    showLabels?: boolean;
    segmentLengthLabels?: {
      AM?: string;
      MB?: string;
      AN?: string;
      NC?: string;
      MN?: string;
      BC?: string;
    };
  };

  // Tùy chọn ký hiệu & thông số
  showRightAngleMarker?: boolean;
  showEqualSidesMarker?: boolean;
  showEqualAnglesMarker?: boolean;
  showSideLengths?: boolean;
  sideLengthLabels?: string[]; // [BC, AC, AB] labels e.g. "a", "b", "c"

  // Backward compatibility
  a?: number; // BC
  b?: number; // AC
  c?: number; // AB
  showAltitudes?: boolean; // Đường cao AH
  showMedians?: boolean;   // Trung tuyến AM
  showBisectors?: boolean; // Phân giác AD
}

// Tùy chọn đường chéo tứ giác
export interface QuadDiagonalConfig {
  enabled: boolean;
  style?: StrokeDashType;
  color?: string;
  strokeWidth?: number;
}

// Tùy chọn đường cao tứ giác (ví dụ từ A hoặc B xuống đáy CD)
export interface QuadAltitudeConfig {
  fromVertex: 'A' | 'B';
  enabled: boolean;
  label?: string; // 'H', 'K'
  style?: StrokeDashType;
  color?: string;
  strokeWidth?: number;
  showRightAngle?: boolean;
}

export interface QuadData {
  type: QuadType;
  vertexNames: string[]; // [A, B, C, D]
  points?: [Point2D, Point2D, Point2D, Point2D]; // [A, B, C, D] coordinates
  showVertices?: boolean;
  showLabels?: boolean;

  // Hệ thống Màu & Tô miền độc lập (Tái sử dụng kiến trúc Giai đoạn 2.1)
  fill?: GeometryFillStyle;
  edgeStyles?: {
    AB?: GeometrySegmentStyle;
    BC?: GeometrySegmentStyle;
    CD?: GeometrySegmentStyle;
    DA?: GeometrySegmentStyle;
  };
  vertexStyles?: {
    A?: GeometryPointStyle;
    B?: GeometryPointStyle;
    C?: GeometryPointStyle;
    D?: GeometryPointStyle;
  };
  labelStyles?: {
    A?: GeometryTextStyle;
    B?: GeometryTextStyle;
    C?: GeometryTextStyle;
    D?: GeometryTextStyle;
  };

  // Đường chéo & Đường phụ
  diagonals?: {
    AC?: QuadDiagonalConfig;
    BD?: QuadDiagonalConfig;
    showIntersection?: boolean;
    intersectionLabel?: string; // 'O'
  };
  altitudes?: QuadAltitudeConfig[];
  auxLines?: CustomAuxLine[];
  auxPoints?: CustomAuxPoint[];
  rightAngleMarkers?: CustomRightAngleMarker[];
  parallelMarkers?: CustomParallelMarker[];
  equalSidesMarkers?: CustomEqualSidesMarker[];
  equalAnglesMarkers?: CustomEqualAnglesMarker[];

  // Ký hiệu hình học
  showRightAngleMarkers?: boolean;
  showEqualSidesMarkers?: boolean;
  showParallelMarkers?: boolean; // Ký hiệu mũi tên song song
  showSideLengths?: boolean;
  sideLengthLabels?: string[]; // [AB, BC, CD, DA] labels

  // Tứ giác nội tiếp đường tròn (Tool 1)
  showCircumcircle?: boolean;
  circumcircleCenterName?: string; // 'O'
  circumcircleStyle?: StrokeDashType;
  circumcircleColor?: string;
  circumcircleStrokeWidth?: number;
  showCircumcircleCenter?: boolean;
  showCircumcircleRadii?: boolean;

  // Backward compatibility fields
  width?: number;
  height?: number;
  topWidth?: number;
  slantOffset?: number;
  showDiagonals?: boolean;
  showSideMarks?: boolean;
}

// ==========================================
// THIẾT LẬP ĐƯỜNG THẲNG, TIA, ĐOẠN THẲNG & GÓC (GIAI ĐOẠN 2.3)
// ==========================================

export type LineRayType = 
  | 'segment'        // Đoạn thẳng AB kèm trung điểm, độ dài
  | 'ray'            // Tia Ax hoặc AB
  | 'line'           // Đường thẳng xy hoặc đường thẳng qua A, B
  | 'parallel'       // Hai đường thẳng song song
  | 'perpendicular'  // Hai đường thẳng vuông góc
  | 'intersection';  // Hai đường thẳng cắt nhau

export interface LineRayData {
  type: LineRayType;
  points?: Point2D[]; // [P1, P2, P3...] tọa độ các điểm kéo thả trực tiếp
  pointNames?: string[]; // ['A', 'B', 'C', 'D'...] hoặc ['x', 'y', 'd', 'd\'']

  // Hiển thị điểm & nhãn
  showPoints?: boolean;
  showLabels?: boolean;

  // Đoạn thẳng & Trung điểm
  showMidpoint?: boolean;
  midpointName?: string; // 'M'
  showEqualSegmentMarks?: boolean; // Ký hiệu MA = MB
  showLength?: boolean;
  lengthValue?: string; // e.g. "5 cm", "a"

  // Tia / Đường thẳng
  showArrows?: boolean;
  rayLength?: number;

  // Song song
  showParallelMarkers?: boolean; // Ký hiệu mũi tên song song (>, >>)
  parallelLineLabel1?: string; // 'a'
  parallelLineLabel2?: string; // 'b'
  parallelDistance?: number;

  // Vuông góc
  showRightAngleMarker?: boolean; // Ký hiệu vuông góc
  perpLineLabel1?: string; // 'd'
  perpLineLabel2?: string; // 'd\''

  // Giao điểm (Tool 5)
  intersectionName?: string; // 'O'
  showIntersectionPoint?: boolean;
  intersectionElem1Type?: 'line' | 'ray' | 'segment';
  intersectionElem2Type?: 'line' | 'ray' | 'segment';
  showDashedExtensions?: boolean; // Hiển thị đường kéo dài nét đứt tới giao điểm

  // Đường phụ & Ký hiệu
  auxLines?: CustomAuxLine[];
  auxPoints?: CustomAuxPoint[];
  rightAngleMarkers?: CustomRightAngleMarker[];
  parallelMarkers?: CustomParallelMarker[];
  equalSidesMarkers?: CustomEqualSidesMarker[];
  equalAnglesMarkers?: CustomEqualAnglesMarker[];

  // Hệ thống Style màu sắc & kiểu nét
  line1Style?: GeometrySegmentStyle;
  line2Style?: GeometrySegmentStyle;
  pointStyles?: { [pointKey: string]: GeometryPointStyle };
  labelStyles?: { [labelKey: string]: GeometryTextStyle };

  // Backward compatibility
  point1Name?: string;
  point2Name?: string;
}

export type AngleType = 
  | 'single'               // Góc đơn ∠ABC hoặc ∠xOy
  | 'bisector'             // Góc có tia phân giác
  | 'vertical-angles'      // Hai đường thẳng cắt nhau: Góc đối đỉnh (O1, O2, O3, O4)
  | 'supplementary'        // Hai góc kề bù (xOy + yOz = 180°)
  | 'parallel-transversal'; // Cát tuyến cắt 2 đường song song (So le trong, Đồng vị, Trong cùng phía)

export interface AngleData {
  type: AngleType;

  // Tọa độ các điểm điều khiển [Đỉnh O / B, Điểm A, Điểm C, ...]
  points?: Point2D[];
  vertexName?: string; // 'O' hoặc 'B'
  ray1Name?: string;   // 'x' hoặc 'A'
  ray2Name?: string;   // 'y' hoặc 'C'

  // Số đo góc
  degrees?: number;
  autoCalculateDegrees?: boolean; // Tự động tính theo tọa độ các điểm
  showDegreeValue?: boolean;
  degreeLabelFormat?: string; // "60°"
  
  // Cung góc & Ký hiệu
  arcRadius?: number;
  showArc?: boolean;
  isRightAngle?: boolean;
  showEqualAngleMarks?: boolean;
  equalMarkType?: 1 | 2 | 'o' | 'double-arc';

  // Tia phân giác
  showBisector?: boolean;
  bisectorName?: string; // 'Oz' hoặc 'BD'
  bisectorStyle?: GeometrySegmentStyle;

  // Tô miền góc (Angle sector fill)
  fill?: GeometryFillStyle;

  // Đối với Góc đối đỉnh (vertical-angles)
  verticalPairHighlight?: 'pair-1-3' | 'pair-2-4' | 'all' | 'none';

  // Đối với Cát tuyến cắt 2 đường song song (parallel-transversal)
  parallelCutConfig?: {
    line1Name?: string; // 'a'
    line2Name?: string; // 'b'
    transversalName?: string; // 'c'
    vertex1Name?: string; // 'A'
    vertex2Name?: string; // 'B'
    highlightType?: 'alternate-interior' | 'corresponding' | 'consecutive-interior' | 'all' | 'none'; // So le trong, Đồng vị, Trong cùng phía
    showParallelMarkers?: boolean;
    showAngleNumbers?: boolean; // A1..A4, B1..B4
  };

  // Hệ thống Style
  ray1Style?: GeometrySegmentStyle;
  ray2Style?: GeometrySegmentStyle;
  vertexStyle?: GeometryPointStyle;
  labelStyles?: { [name: string]: GeometryTextStyle };

  // Hiển thị chung
  showPoints?: boolean;
  showLabels?: boolean;

  // Đường phụ & Ký hiệu
  auxLines?: CustomAuxLine[];
  auxPoints?: CustomAuxPoint[];
  rightAngleMarkers?: CustomRightAngleMarker[];
  parallelMarkers?: CustomParallelMarker[];
  equalSidesMarkers?: CustomEqualSidesMarker[];
  equalAnglesMarkers?: CustomEqualAnglesMarker[];
}

// ==========================================
// THIẾT LẬP ĐƯỜNG TRÒN (GIAI ĐOẠN 2.4)
// ==========================================

export type CirclePresetType =
  | 'basic'               // Đường tròn cơ bản: Tâm O, bán kính OA/R
  | 'diameter-chord'      // Đường kính AB & Dây cung CD, hạ OH ⊥ CD
  | 'arc'                 // Cung tròn AB (Cung nhỏ / lớn, tên cung)
  | 'sector'              // Hình quạt tròn AOB (Bán kính OA, OB, cung AB, góc ở tâm AOB)
  | 'segment'             // Hình viên phân (Dây cung AB và cung tròn AB)
  | 'tangent-point'       // Tiếp tuyến tại điểm A trên đường tròn (Ax ⊥ OA)
  | 'two-tangents'        // Hai tiếp tuyến PA, PB cắt nhau từ điểm P ngoài đường tròn
  | 'secant'              // Cát tuyến PCD từ điểm P ngoài đường tròn
  | 'two-circles'         // Hai đường tròn (O1, R1) và (O2, R2) - Vị trí tương đối & tiếp tuyến chung
  | 'inscribed-angle'     // Góc nội tiếp ∠APB & Góc ở tâm ∠AOB
  | 'tangent-chord-angle' // Góc tạo bởi tiếp tuyến và dây cung ∠BAx
  | 'interior-angle'      // Góc có đỉnh bên trong đường tròn (giao 2 dây cung AB, CD tại E)
  | 'exterior-angle';     // Góc có đỉnh bên ngoài đường tròn (2 cát tuyến PAB, PCD từ P)

export interface CircleData {
  presetType?: CirclePresetType;

  // Tọa độ các điểm điều khiển kéo thả [Tâm O, Điểm A trên đường tròn, Điểm C, Điểm D, Điểm P ngoài...]
  points?: Point2D[];
  radius?: number; // bán kính (px)

  // Tâm O
  centerName?: string; // 'O'
  showCenterPoint?: boolean;
  showCenterLabel?: boolean;

  // 1. Bán kính OA
  showRadius?: boolean;
  radiusPointName?: string; // 'A' hoặc 'R'
  radiusLabel?: string;     // 'R' hoặc '3 cm'
  showRadiusLabel?: boolean;
  radiusStyle?: GeometrySegmentStyle;

  // 2. Đường kính AB
  showDiameter?: boolean;
  diameterPoints?: string[]; // ['A', 'B']
  showDiameterLabel?: boolean;
  diameterLabel?: string;    // 'd'
  diameterStyle?: GeometrySegmentStyle;

  // 3. Dây cung CD
  showChord?: boolean;
  chordPoints?: string[];    // ['C', 'D']
  chordStyle?: GeometrySegmentStyle;
  showChordDistance?: boolean; // Hạ OH vuông góc với CD
  chordDistanceLabel?: string; // 'H'
  showChordMidpoint?: boolean; // Ký hiệu trung điểm H (HC = HD)
  showChordRightAngle?: boolean; // Ký hiệu vuông góc OH ⊥ CD
  chordDistanceStyle?: GeometrySegmentStyle;

  // 4. Cung tròn AB
  showArc?: boolean;
  arcType?: 'minor' | 'major'; // Cung nhỏ hoặc Cung lớn
  arcPoints?: string[];        // ['A', 'B']
  arcName?: string;            // 'AB' hoặc 'AmB'
  showArcName?: boolean;
  arcStyle?: GeometrySegmentStyle;

  // 4b. Hình quạt tròn (Sector) & Hình viên phân (Segment)
  sectorAngleDeg?: number;          // Số đo góc ở tâm (độ, ví dụ 60, 90, 120)
  showSectorRadii?: boolean;        // Vẽ 2 bán kính OA, OB
  showSectorChord?: boolean;        // Vẽ dây cung AB cho hình viên phân
  showCentralAngleMarker?: boolean; // Ký hiệu góc ở tâm ∠AOB
  showCentralAngleDegree?: boolean; // Nhãn số đo góc (ví dụ "60°", "α")
  centralAngleLabel?: string;       // Nhãn tùy chỉnh góc
  showArcLengthLabel?: boolean;     // Hiển thị nhãn độ dài cung l
  arcLengthLabel?: string;          // ví dụ "l = 4π cm"
  showSectorAreaLabel?: boolean;    // Hiển thị nhãn diện tích quạt S
  sectorAreaLabel?: string;         // ví dụ "S = 6π cm²"
  showSegmentAreaLabel?: boolean;   // Hiển thị nhãn diện tích hình viên phân
  segmentAreaLabel?: string;
  arcPointNames?: [string, string]; // ['A', 'B']
  arcMidpointName?: string;         // 'm' (tạo cung AmB)
  radiiStyle?: GeometrySegmentStyle;
  chordSegmentStyle?: GeometrySegmentStyle;

  // 5. Tiếp tuyến
  showTangent?: boolean;
  tangentType?: 'at-point' | 'two-tangents'; // Tại điểm A hoặc 2 tiếp tuyến từ P
  tangentPointName?: string;   // 'A' (tiếp điểm)
  tangentLineName?: string;    // 'd' hoặc 'Ax'
  externalPointName?: string;  // 'P' (điểm ngoài)
  tangentPointsNames?: string[]; // ['A', 'B'] cho 2 tiếp tuyến PA, PB
  showTangentRightAngle?: boolean; // Ký hiệu vuông góc OA ⊥ Ax hoặc OA ⊥ PA, OB ⊥ PB
  showTangentEqualMarks?: boolean; // Ký hiệu PA = PB
  showCenterConnector?: boolean;   // Nối OP
  showChordAB?: boolean;           // Nối dây AB giữa 2 tiếp điểm
  tangentStyle?: GeometrySegmentStyle;
  tangentLine2Style?: GeometrySegmentStyle;

  // 6. Cát tuyến
  showSecant?: boolean;
  secantPointsNames?: string[]; // ['C', 'D']
  secantStyle?: GeometrySegmentStyle;

  // 7. Góc nội tiếp & Góc ở tâm
  showInscribedAngle?: boolean;
  inscribedVertexName?: string; // 'P' hoặc 'M'
  showCentralAngle?: boolean;
  angleStyle?: GeometrySegmentStyle;

  // 8. Góc tạo bởi tiếp tuyến và dây cung (Tool 3.1)
  showTangentChordAngle?: boolean;
  tangentChordPointName?: string; // 'A' (tiếp điểm)
  chordTargetPointName?: string;  // 'B' (điểm mút dây cung trên đường tròn)
  tangentRayName?: string;        // 'x' (tia Ax)
  showInscribedCompareAngle?: boolean; // Góc nội tiếp chắn cùng cung ACB để so sánh bằng nhau
  compareVertexName?: string;     // 'C'
  tangentChordAngleStyle?: GeometrySegmentStyle;

  // 9. Góc có đỉnh bên trong đường tròn (Tool 3.2)
  showInteriorAngle?: boolean;
  interiorIntersectionName?: string; // 'E'
  interiorChord1Points?: [string, string]; // ['A', 'B']
  interiorChord2Points?: [string, string]; // ['C', 'D']
  showInteriorAngleArc?: boolean;
  showSubtendedArcsHighlight?: boolean;

  // 10. Góc có đỉnh bên ngoài đường tròn (Tool 3.3)
  showExteriorAngle?: boolean;
  exteriorVertexName?: string; // 'P' hoặc 'E'
  exteriorSecant1Points?: [string, string]; // ['A', 'B']
  exteriorSecant2Points?: [string, string]; // ['C', 'D']
  exteriorType?: 'two-secants' | 'secant-tangent' | 'two-tangents';
  showExteriorAngleArc?: boolean;

  // 11. Vị trí tương đối của hai đường tròn & Tiếp tuyến chung (Tool 4)
  showSecondCircle?: boolean;
  center2Name?: string; // "O'"
  radius2?: number;
  circle2Style?: GeometrySegmentStyle;
  twoCirclesRelation?: 'intersecting' | 'tangent-external' | 'tangent-internal' | 'external' | 'inside' | 'concentric';
  showCommonTangents?: boolean;
  commonTangentsType?: 'external' | 'internal' | 'both';
  commonTangentsStyle?: GeometrySegmentStyle;
  showLineOfCenters?: boolean; // Đoạn thẳng nối tâm O1O2
  showCommonChord?: boolean;   // Dây chung AB (khi cắt nhau)
  showIntersections?: boolean;
  intersectionNames?: string[]; // ['A', 'B']

  // 12. Tô miền
  fill?: GeometryFillStyle;
  fillType?: 'full' | 'sector' | 'segment'; // Toàn bộ / Hình quạt / Hình viên phân

  // Hệ thống Style cho đường tròn chính
  circleStyle?: GeometrySegmentStyle;
  pointStyles?: { [pointKey: string]: GeometryPointStyle };
  labelStyles?: { [labelKey: string]: GeometryTextStyle };

  // Đường phụ & Ký hiệu
  auxLines?: CustomAuxLine[];
  auxPoints?: CustomAuxPoint[];
  rightAngleMarkers?: CustomRightAngleMarker[];
  parallelMarkers?: CustomParallelMarker[];
  equalSidesMarkers?: CustomEqualSidesMarker[];
  equalAnglesMarkers?: CustomEqualAnglesMarker[];

  // Backward compatibility
  tangentPoint?: string;
}

// ==========================================
// THIẾT LẬP ĐA GIÁC ĐỀU (NHÓM 2 - CÔNG CỤ 3)
// ==========================================

export type RegularPolygonType =
  | 'triangle'   // Tam giác đều (n = 3)
  | 'equilateral-triangle'
  | 'square'     // Hình vuông (n = 4)
  | 'pentagon'   // Ngũ giác đều (n = 5)
  | 'hexagon'    // Lục giác đều (n = 6)
  | 'heptagon'   // Thất giác đều (n = 7)
  | 'octagon'    // Bát giác đều (n = 8)
  | 'nonagon'    // Cửu giác đều (n = 9)
  | 'decagon'    // Thập giác đều (n = 10)
  | 'dodecagon'  // Thập nhị giác đều (n = 12)
  | 'custom';    // Tùy chỉnh số cạnh n (3..16)

export type PolygonType = RegularPolygonType;

export interface PolygonData {
  type: RegularPolygonType;
  sidesCount: number; // Số cạnh n (mặc định 5 hoặc theo type)
  center: Point2D;    // Tâm O của đa giác đều
  radius: number;     // Bán kính đường tròn ngoại tiếp R (px)
  rotationAngle?: number; // Góc xoay ban đầu (độ)
  points?: Point2D[]; // Toạ độ n đỉnh thực tế [A1, A2, ..., An]

  // Đỉnh & Tên đỉnh
  vertexNames: string[]; // ['A', 'B', 'C', 'D', 'E'...] hoặc ['A1', 'A2'...]
  showVertices?: boolean;
  showLabels?: boolean;

  // Tâm & Bán kính
  showCenter?: boolean;
  centerName?: string; // 'O'
  showRadii?: boolean; // Vẽ các bán kính OA, OB, OC...
  radiiStyle?: GeometrySegmentStyle;

  // Đường tròn ngoại tiếp (Circumscribed Circle)
  showCircumcircle?: boolean;
  circumcircleStyle?: StrokeDashType;
  circumcircleColor?: string;

  // Đường tròn nội tiếp (Inscribed Circle)
  showIncircle?: boolean;
  incircleStyle?: StrokeDashType;
  incircleColor?: string;

  // Trung đoạn (Apothem - OH vuông góc với cạnh)
  showApothem?: boolean;
  apothemName?: string; // 'H'
  apothemStyle?: GeometrySegmentStyle;
  showApothemRightAngle?: boolean;

  // Đường chéo
  showDiagonals?: boolean;
  diagonalsType?: 'main' | 'all'; // Chỉ đường chéo chính qua tâm hoặc tất cả
  diagonalsStyle?: GeometrySegmentStyle;

  // Ký hiệu hình học
  showEqualSidesMarkers?: boolean;
  equalSidesTickType?: EqualTickMarkType;
  showEqualAnglesMarkers?: boolean;
  showSideLengths?: boolean;
  sideLengthLabel?: string; // e.g. "a", "5 cm"

  // Tô miền & Đường viền
  fill?: GeometryFillStyle;
  strokeColor?: string;
  strokeWidth?: number;
  strokeStyle?: StrokeDashType;
  vertexStyles?: { [index: number]: GeometryPointStyle };
  labelStyles?: { [name: string]: GeometryTextStyle };

  // Đường phụ
  auxLines?: CustomAuxLine[];
  auxPoints?: CustomAuxPoint[];
  rightAngleMarkers?: CustomRightAngleMarker[];
  parallelMarkers?: CustomParallelMarker[];
  equalSidesMarkers?: CustomEqualSidesMarker[];
  equalAnglesMarkers?: CustomEqualAnglesMarker[];
}

// ==========================================
// THIẾT LẬP ĐỐI XỨNG TRỤC & ĐỐI XỨNG TÂM (NHÓM 2 - CÔNG CỤ 2)
// ==========================================

export type SymmetryType = 'axial' | 'central'; // Đối xứng trục | Đối xứng tâm
export type SymmetryTargetShape = 'point' | 'segment' | 'triangle' | 'quadrilateral' | 'circle';

export interface SymmetryData {
  type: SymmetryType; // 'axial' (Trục) hoặc 'central' (Tâm)
  targetShape: SymmetryTargetShape; // Đối tượng: 'point' | 'segment' | 'triangle' | 'quadrilateral' | 'circle'

  // Trục đối xứng d (Dành cho Đối xứng trục): xác định bởi 2 điểm điều khiển [P1, P2]
  axisPoints?: [Point2D, Point2D];
  axisLabel?: string; // 'd' hoặc 'xy'
  axisStyle?: GeometrySegmentStyle;
  showAxisExtension?: boolean; // Kéo dài trục về 2 phía

  // Tâm đối xứng I (Dành cho Đối xứng tâm)
  centerPoint?: Point2D;
  centerName?: string; // 'I' hoặc 'O'
  centerStyle?: GeometryPointStyle;

  // Toạ độ các điểm của hình gốc:
  // - 'point': [A]
  // - 'segment': [A, B]
  // - 'triangle': [A, B, C]
  // - 'quadrilateral': [A, B, C, D]
  // - 'circle': [Tâm O, Điểm bán kính A]
  originalPoints: Point2D[];
  originalNames: string[];  // ['A', 'B', 'C'...]
  reflectedNames: string[]; // ["A'", "B'", "C'"]

  // Bán kính đường tròn (nếu targetShape === 'circle')
  circleRadius?: number;

  // Hiển thị & Ký hiệu sư phạm
  showOriginalLabels?: boolean;
  showReflectedLabels?: boolean;
  showConnectingDashedLines?: boolean; // Đoạn AA', BB', CC' nối nét đứt
  connectingLineStyle?: StrokeDashType;
  showRightAngleMarkers?: boolean;     // Ký hiệu vuông góc AA' ⊥ d (đối xứng trục)
  showEqualDistanceMarkers?: boolean;  // Ký hiệu AH = A'H hoặc IA = IA'
  equalDistanceTickType?: EqualTickMarkType;

  // Kiểu vẽ & Tô màu hình gốc và hình đối xứng
  originalStyle?: GeometrySegmentStyle;
  reflectedStyle?: GeometrySegmentStyle;
  originalFill?: GeometryFillStyle;
  reflectedFill?: GeometryFillStyle;

  // Đường phụ & Ký hiệu
  auxLines?: CustomAuxLine[];
  auxPoints?: CustomAuxPoint[];
  rightAngleMarkers?: CustomRightAngleMarker[];
  parallelMarkers?: CustomParallelMarker[];
  equalSidesMarkers?: CustomEqualSidesMarker[];
  equalAnglesMarkers?: CustomEqualAnglesMarker[];
}

export interface GeometryData {
  subType: 'triangle' | 'quadrilateral' | 'circle' | 'angle' | 'line-ray' | 'polygon' | 'symmetry';
  
  // Tam giác (kèm Định lý Ta-lét MN // BC)
  triangle?: TriangleData;

  // Tứ giác
  quadrilateral?: QuadData;

  // Đường tròn
  circle?: CircleData;

  // Góc
  angle?: AngleData;

  // Đoạn thẳng / Tia / Đường thẳng / Song song / Vuông góc
  lineRay?: LineRayData;

  // Đa giác đều (Tam giác đều, Vuông, Ngũ giác, Lục giác, Bát giác, n-giác)
  polygon?: PolygonData;

  // Đối xứng trục & Đối xứng tâm
  symmetry?: SymmetryData;

  // Đường phụ & Ký hiệu dùng chung cấp Geometry
  auxLines?: CustomAuxLine[];
  auxPoints?: CustomAuxPoint[];
  rightAngleMarkers?: CustomRightAngleMarker[];
  parallelMarkers?: CustomParallelMarker[];
  equalSidesMarkers?: CustomEqualSidesMarker[];
  equalAnglesMarkers?: CustomEqualAnglesMarker[];

  strokeWidth?: number;
  pointRadius?: number;
  fontSize?: number;
}

// 9. Mô hình Phân số (Fraction Bar)
export interface FractionBarItem {
  id: string;
  numerator: number;
  denominator: number;
  label: string;
  color: string;
  pattern: PatternType;
  patternColor?: string;
}

export interface FractionBarData {
  bars: FractionBarItem[];
  orientation?: 'horizontal' | 'vertical';
  showFractions?: boolean;
  showPercentages?: boolean;
  showDecimals?: boolean;
  showDivisionLines?: boolean;
  showFractionsText?: boolean;
  barHeight?: number;
  barSpacing?: number;
}

// 10. Trục số (Number Line)
export interface NumberLineMarker {
  id: string;
  expression: string; // Biểu thức gốc: "1/3", "√2", "0,(3)", "3/5", "-2", "1.25"
  numericValue: number; // Giá trị số thực chính xác để tính tọa độ x trên trục
  value?: number; // Giữ để tương thích ngược (= numericValue)
  label?: string; // Tùy chọn nhãn ghi chú
  pointName?: string; // Tên điểm: "A", "B", "O", "M"...
  color?: string; // Màu điểm & nhãn
  showFractionFormat?: boolean; // Hiển thị dạng phân số toán học (có gạch ngang)
  labelOffset?: { x: number; y: number }; // Cho phép chỉnh offset vị trí nhãn
}

export interface IrrationalIllustrationConfig {
  enabled: boolean;
  targetType: 'sqrt2' | 'sqrt3' | 'sqrt5' | 'custom';
  customExpr?: string; // "√2", "√3", "√5"
  markerId?: string;
  mode: 'visual' | 'pythagoras_grade8'; // Trực quan lớp 7 vs Giải thích Pitago lớp 8
  showArc: boolean; // Vẽ cung tròn bán kính OB tâm O
  showTriangle: boolean; // Vẽ tam giác vuông dựng từ trục số
  showRightAngleMarker: boolean; // Ký hiệu góc vuông
  showSideLengths: boolean; // Nhãn độ dài cạnh (OA=1, AB=1, OB=√2)
  showFormulas: boolean; // Hiển thị công thức Pitago bên góc
  color?: string; // Màu đường nét minh họa
}

export interface NumberLineData {
  min: number;
  max: number;
  step: number;
  subDivision?: number; // Số khoảng chia nhỏ trong 1 đơn vị (2, 3, 4, 5, 8...)
  subStepFraction?: number; // Tương thích ngược
  autoSubDivision?: boolean; // Tự động nhận diện mẫu số chung để chia nhỏ đơn vị
  showOrigin: boolean;
  showArrows: boolean;
  markers: NumberLineMarker[];
  illustration?: IrrationalIllustrationConfig;
  showInterval?: {
    from: number;
    to: number;
    includeFrom: boolean;
    includeTo: boolean;
  };
}

// 11. Hình học không gian (3D Spatial Geometry & Hình khai triển phẳng - Toán 7-8-9 CT GDPT mới)
export type SpatialShapeType =
  | 'box'                 // Hình hộp chữ nhật (ABCD.A'B'C'D')
  | 'cube'                // Hình lập phương (ABCD.A'B'C'D')
  | 'triangular-prism'    // Hình lăng trụ đứng tam giác (ABC.A'B'C')
  | 'quad-prism'          // Hình lăng trụ đứng tứ giác (ABCD.A'B'C'D')
  | 'triangular-pyramid'  // Hình chóp tam giác đều (S.ABC)
  | 'quad-pyramid'        // Hình chóp tứ giác đều (S.ABCD)
  | 'pyramid-altitude'    // Hình chóp có đường cao vuông góc đáy (S.ABCD, SA ⊥ đáy)
  | 'cylinder'            // Hình trụ (O, O')
  | 'cone'                // Hình nón (S, O)
  | 'net-box'             // Hình khai triển hình hộp chữ nhật (Unfolded Net)
  | 'net-cube'            // Hình khai triển hình lập phương
  | 'net-triangular-prism'// Hình khai triển hình lăng trụ đứng tam giác
  | 'net-cylinder'        // Hình khai triển hình trụ
  | 'net-cone';           // Hình khai triển hình nón

export interface SpatialDimensionConfig {
  showDimensions: boolean;
  length?: string; // e.g. "a", "6 cm"
  width?: string;  // e.g. "b", "4 cm"
  height?: string; // e.g. "h", "5 cm"
  slantHeight?: string; // e.g. "d" hoặc "l" (đường sinh hình nón, trung đoạn hình chóp)
  radius?: string; // e.g. "r", "3 cm"
  angle?: string;  // e.g. "α", "120°"
}

export interface SpatialNetConfig {
  showFoldLines?: boolean;    // Hiển thị đường gấp nét đứt (dashed fold lines)
  foldLineStyle?: StrokeDashType;
  showFaceLabels?: boolean;   // Hiển thị tên/nhãn các mặt (Đáy trên, Đáy dưới, Mặt bên...)
  showTabs?: boolean;         // Hiển thị mép dán (flaps/tabs) để gấp giấy
  showDimensions?: boolean;   // Hiển thị kích thước các cạnh trên hình phẳng
  faceColor?: string;         // Màu nền các mặt phẳng
  tabColor?: string;          // Màu mép dán
}

export interface SpatialGeometryData {
  shapeType: SpatialShapeType;

  // Chế độ xem phẳng / Khai triển
  isUnfoldedNet?: boolean;
  netConfig?: SpatialNetConfig;
  
  // Tên các đỉnh
  vertexNames?: string[]; // e.g. ['A', 'B', 'C', 'D', "A'", "B'", "C'", "D'"] hoặc ['S', 'A', 'B', 'C', 'D']
  showVertices?: boolean;
  showLabels?: boolean;

  // Kích thước & Góc phối cảnh (Oblique Projection)
  length?: number; // Chiều dài đáy (px)
  width?: number;  // Chiều rộng đáy (px)
  height?: number; // Chiều cao (px)
  slantAngle?: number; // Góc nghiêng phối cảnh (độ, mặc định 30° hoặc 45°)
  slantRatio?: number; // Tỉ lệ co trục sâu (mặc định 0.5 theo SGK)
  
  // Các đường đặc biệt
  showAltitude?: boolean; // Đường cao SO / SH / SA
  altitudeVertex?: string; // 'S'
  altitudeFoot?: string; // 'O' hoặc 'H'
  showBaseDiagonals?: boolean; // Đường chéo đáy AC, BD
  showBaseCenter?: boolean; // Tâm đáy O
  showSolidDiagonals?: boolean; // Đường chéo khối AC'
  showRightAngleMarkers?: boolean; // Ký hiệu góc vuông chân đường cao hoặc đáy
  
  // Tô mặt phẳng (Face shading)
  showFaceShading?: boolean;
  shadingOpacity?: number; // 0 đến 1, e.g. 0.08
  shadingColor?: string; // Hex color e.g. '#3b82f6'

  // Kích thước đo đạc
  dimensions?: SpatialDimensionConfig;

  // Tùy biến nét
  lineColor?: string;
  lineWidth?: number;
}

// Tổng hợp Cấu hình biểu đồ hoàn chỉnh (Full Document Config)
export interface ChartDocument {
  id: string;
  type: ToolType;
  title: string;
  createdAt: number;
  updatedAt: number;
  settings: BaseChartSettings;
  data: {
    pie?: PieChartData;
    bar?: BarChartData;
    doubleBar?: DoubleBarChartData;
    line?: LineChartData;
    pictogram?: PictogramData;
    coordinatePlane?: CoordinatePlaneData;
    functionGraph?: FunctionGraphData;
    geometry?: GeometryData;
    spatial?: SpatialGeometryData;
    fractionBar?: FractionBarData;
    numberLine?: NumberLineData;
  };
}
