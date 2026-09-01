/**
 * vietnameseGeometryParser.ts
 * Bộ phân tích ngôn ngữ tự nhiên tiếng Việt và cấu trúc hình học SGK Toán THCS (Lớp 6, 7, 8, 9)
 */
import { GeometrySpecification, ShapeCategory } from '../types';
import { TriangleType, QuadType, CirclePresetType, LineRayType, AngleType } from '../../types';

export class VietnameseGeometryParser {
  /**
   * Chuẩn hóa chuỗi văn bản tiếng Việt
   */
  private static normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[–—]/g, '-')
      .replace(/[““”]/g, '"')
      .replace(/[’‘]/g, "'")
      .trim();
  }

  /**
   * Phân tích văn bản đề bài thành GeometrySpecification
   */
  public static parse(prompt: string): GeometrySpecification {
    const raw = prompt.trim();
    const text = this.normalizeText(raw);

    // Phát hiện danh mục hình chính
    const category = this.detectCategory(text);

    switch (category) {
      case 'symmetry':
        return this.parseSymmetryProblem(raw, text);
      case 'polygon':
        return this.parsePolygonProblem(raw, text);
      case 'circle':
        return this.parseCircleProblem(raw, text);
      case 'quadrilateral':
        return this.parseQuadProblem(raw, text);
      case 'angle':
        return this.parseAngleProblem(raw, text);
      case 'line-ray':
        return this.parseLineRayProblem(raw, text);
      case 'triangle':
      default:
        return this.parseTriangleProblem(raw, text);
    }
  }

  /**
   * Nhận diện danh mục hình học
   */
  private static detectCategory(text: string): ShapeCategory {
    // 0. Nhận diện Phép đối xứng (trục hoặc tâm)
    if (
      text.includes('đối xứng') ||
      text.includes('đx trục') ||
      text.includes('đx tâm') ||
      text.includes('tâm đối xứng') ||
      text.includes('trục đối xứng')
    ) {
      return 'symmetry';
    }

    // 0.5 Nhận diện Đa giác đều
    if (
      text.includes('đa giác đều') ||
      text.includes('ngũ giác') ||
      text.includes('lục giác') ||
      text.includes('bát giác') ||
      text.includes('tam giác đều nội tiếp')
    ) {
      return 'polygon';
    }

    // 1. Ưu tiên nhận diện Tứ giác nội tiếp hoặc Tứ giác
    if (text.includes('tứ giác nội tiếp')) {
      return 'quadrilateral';
    }

    // 2. Nhận diện Tam Giác (kèm đường tròn ngoại tiếp / nội tiếp tam giác)
    if (text.includes('tam giác') || text.includes('∆')) {
      return 'triangle';
    }

    // 3. Nhận diện Tứ Giác
    if (
      text.includes('tứ giác') ||
      text.includes('hình thang') ||
      text.includes('hình bình hành') ||
      text.includes('hình chữ nhật') ||
      text.includes('hình thoi') ||
      text.includes('hình vuông')
    ) {
      return 'quadrilateral';
    }

    // 4. Nhận diện Đường Tròn (bao gồm góc tiếp tuyến dây cung, góc đỉnh trong/ngoài, 2 đường tròn)
    if (
      text.includes('đường tròn') ||
      text.includes('(o)') ||
      text.includes('(o;') ||
      text.includes('tâm o') ||
      text.includes('tiếp tuyến') ||
      text.includes('dây cung') ||
      text.includes('cát tuyến') ||
      text.includes('cung tròn') ||
      text.includes('bán kính') ||
      text.includes('tiếp xúc ngoài') ||
      text.includes('tiếp xúc trong') ||
      text.includes('hai đường tròn') ||
      text.includes('2 đường tròn')
    ) {
      return 'circle';
    }

    // 4. Nhận diện Cát tuyến song song / Góc
    if (
      text.includes('so le trong') ||
      text.includes('đồng vị') ||
      text.includes('trong cùng phía') ||
      text.includes('cát tuyến') ||
      text.includes('xoy') ||
      text.includes('yoz') ||
      text.includes('đối đỉnh') ||
      text.includes('kề bù') ||
      (text.includes('góc') && !text.includes('đoạn thẳng'))
    ) {
      return 'angle';
    }

    // 5. Đoạn thẳng, tia, đường thẳng
    if (
      text.includes('đoạn thẳng') ||
      text.includes('trục số') ||
      text.includes('trung điểm') ||
      text.includes('tia')
    ) {
      return 'line-ray';
    }

    return 'triangle';
  }

  /**
   * Phân tích đề bài Tam Giác
   */
  private static parseTriangleProblem(raw: string, text: string): GeometrySpecification {
    const detectedEntities: string[] = [];

    // Tìm tên đỉnh tam giác (mặc định A, B, C)
    let vertices: [string, string, string] = ['A', 'B', 'C'];
    const triMatch = raw.match(/tam\s+giác\s+([A-Z])([A-Z])([A-Z])/i) ||
                     raw.match(/∆\s*([A-Z])([A-Z])([A-Z])/i);
    if (triMatch) {
      vertices = [triMatch[1].toUpperCase(), triMatch[2].toUpperCase(), triMatch[3].toUpperCase()];
      detectedEntities.push(`Tam giác ${vertices.join('')}`);
    } else {
      detectedEntities.push('Tam giác ABC');
    }

    // Loại tam giác: vuông, cân, đều, vuông cân, thường
    let triType: TriangleType = 'general';
    let specialVertex: string | undefined = undefined;

    // 1. Nhận diện vuông cân
    if (text.includes('vuông cân') || text.includes('cân vuông')) {
      triType = 'right-isosceles';
      const vertexMatch = text.match(/vuông\s+cân\s+tại\s+([a-z])/i);
      specialVertex = vertexMatch ? vertexMatch[1].toUpperCase() : vertices[0];
      detectedEntities.push(`Loại tam giác: Vuông cân tại ${specialVertex}`);
    } else if (text.includes('đều')) {
      triType = 'equilateral';
      detectedEntities.push('Loại tam giác: Tam giác đều');
    } else if (
      text.includes('cân') ||
      /([A-Z]{2})\s*=\s*([A-Z]{2})/i.test(raw) ||
      /([A-Z]{2})\s+bằng\s+([A-Z]{2})/i.test(raw)
    ) {
      triType = 'isosceles';
      const vertexMatch = text.match(/cân\s+tại\s+([a-z])/i);
      specialVertex = vertexMatch ? vertexMatch[1].toUpperCase() : vertices[0];
      detectedEntities.push(`Loại tam giác: Cân tại ${specialVertex}`);
    } else if (text.includes('vuông')) {
      triType = 'right';
      const vertexMatch = text.match(/vuông\s+tại\s+([a-z])/i);
      specialVertex = vertexMatch ? vertexMatch[1].toUpperCase() : vertices[0];
      detectedEntities.push(`Loại tam giác: Vuông tại ${specialVertex}`);
    } else if (text.includes('nhọn')) {
      triType = 'general';
      detectedEntities.push('Loại tam giác: Tam giác nhọn');
    } else if (text.includes('tù')) {
      triType = 'general';
      detectedEntities.push('Loại tam giác: Tam giác tù');
    }

    const [vA, vB, vC] = vertices;

    // Phân tích đường cao (Altitudes)
    const altitudes: GeometrySpecification['altitudes'] = [];
    const altRegex = /(?:đường\s+cao|hạ\s+đường\s+cao|kẻ\s+đường\s+cao|hạ)\s+([A-Z])([A-Z])\b|(?:\b([A-Z])([A-Z])\b\s*(?:vuông\s+góc|⊥))|chân\s+đường\s+cao\s+(?:từ\s+([A-Z]))?\s*(?:xuống\s+([A-Z]{2}))?/g;
    let matchAlt;
    while ((matchAlt = altRegex.exec(raw)) !== null) {
      const from = (matchAlt[1] || matchAlt[3] || matchAlt[5] || vA).toUpperCase();
      const foot = (matchAlt[2] || matchAlt[4] || 'H').toUpperCase();
      const toLine = (matchAlt[6] || `${vB}${vC}`).toUpperCase();
      if (from !== foot && (from === vA || from === vB || from === vC)) {
        altitudes.push({
          from,
          toLine,
          foot,
          showRightAngle: true,
          style: 'dashed',
        });
        detectedEntities.push(`Đường cao ${from}${foot} vuông góc ${toLine} tại ${foot}`);
      }
    }

    // Kiểm tra mẫu "Gọi H là chân đường cao từ A xuống BC"
    const footMatch = raw.match(/(?:gọi\s+)?([A-Z])\s+là\s+chân\s+đường\s+cao\s+(?:từ\s+([A-Z]))?(?:\s+xuống\s+([A-Z]{2}))?/i);
    if (footMatch && altitudes.length === 0) {
      const foot = footMatch[1].toUpperCase();
      const from = (footMatch[2] || vA).toUpperCase();
      const toLine = (footMatch[3] || `${vB}${vC}`).toUpperCase();
      altitudes.push({
        from,
        toLine,
        foot,
        showRightAngle: true,
        style: 'dashed',
      });
      detectedEntities.push(`Đường cao ${from}${foot} vuông góc ${toLine} tại ${foot}`);
    }

    if (altitudes.length === 0 && (text.includes('đường cao ah') || text.includes('hạ ah') || text.includes('kẻ ah') || text.includes('đường cao'))) {
      altitudes.push({
        from: vA,
        toLine: `${vB}${vC}`,
        foot: 'H',
        showRightAngle: true,
        style: 'dashed',
      });
      detectedEntities.push(`Đường cao ${vA}H vuông góc ${vB}${vC} tại H`);
    }

    // Phân tích trung tuyến (Medians)
    const medians: GeometrySpecification['medians'] = [];
    const medRegex = /(?:trung\s+tuyến|kẻ\s+trung\s+tuyến)\s+([A-Z])([A-Z])(?!\w)|(?:trung\s+điểm\s+([A-Z])(?:\s+của\s+([A-Z]{2}))?)/gi;
    let matchMed;
    while ((matchMed = medRegex.exec(raw)) !== null) {
      if (matchMed[1] && matchMed[2]) {
        const from = matchMed[1].toUpperCase();
        const mid = matchMed[2].toUpperCase();
        if (from !== mid && (from === vA || from === vB || from === vC) && mid !== vA && mid !== vB && mid !== vC) {
          const targetSeg = `${vB}${vC}`;
          if (!medians.some(m => m.midpoint === mid && m.from === from)) {
            medians.push({
              from,
              toSegment: targetSeg,
              midpoint: mid,
              showTicks: true,
              style: 'dashed',
            });
            detectedEntities.push(`Trung tuyến ${from}${mid} (${mid} là trung điểm ${targetSeg})`);
          }
        }
      } else if (matchMed[3]) {
        const mid = matchMed[3].toUpperCase();
        const seg = (matchMed[4] || `${vB}${vC}`).toUpperCase();
        if (mid !== vA && mid !== vB && mid !== vC) {
          if (!medians.some(m => m.midpoint === mid)) {
            medians.push({
              from: vA,
              toSegment: seg,
              midpoint: mid,
              showTicks: true,
              style: 'dashed',
            });
            detectedEntities.push(`Trung tuyến ${vA}${mid} (${mid} là trung điểm ${seg})`);
          }
        }
      }
    }

    // Kiểm tra mẫu "Gọi M là trung điểm của BC... Kẻ AM"
    const midMatch = raw.match(/(?:gọi\s+)?([A-Z])\s+là\s+trung\s+điểm\s+(?:của\s+([A-Z]{2}))?/i);
    if (midMatch && medians.length === 0) {
      const mid = midMatch[1].toUpperCase();
      const seg = (midMatch[2] || `${vB}${vC}`).toUpperCase();
      if (mid !== vA && mid !== vB && mid !== vC) {
        medians.push({
          from: vA,
          toSegment: seg,
          midpoint: mid,
          showTicks: true,
          style: 'dashed',
        });
        detectedEntities.push(`Trung tuyến ${vA}${mid} (${mid} là trung điểm ${seg})`);
      }
    }

    if (medians.length === 0 && (text.includes('trung tuyến am') || (text.includes('trung điểm m') && text.includes('bc')) || (text.includes('kẻ am') && text.includes('trung điểm')))) {
      medians.push({
        from: vA,
        toSegment: `${vB}${vC}`,
        midpoint: 'M',
        showTicks: true,
        style: 'dashed',
      });
      detectedEntities.push(`Trung tuyến ${vA}M (M là trung điểm ${vB}${vC})`);
    }

    // Phân tích phân giác (Bisectors)
    const bisectors: GeometrySpecification['bisectors'] = [];
    const bisRegex = /(?:phân\s+giác|tia\s+phân\s+giác)\s+([A-Z])([A-Z])\b(?:\s+của\s+góc\s+([A-Z]))?/g;
    let matchBis;
    while ((matchBis = bisRegex.exec(raw)) !== null) {
      const from = (matchBis[3] || matchBis[1] || vA).toUpperCase();
      const foot = (matchBis[2] || 'D').toUpperCase();
      if (from !== foot && (from === vA || from === vB || from === vC)) {
        bisectors.push({
          from,
          toSegment: `${vB}${vC}`,
          foot,
          showEqualAngleArcs: true,
          style: 'solid',
        });
        detectedEntities.push(`Đường phân giác ${from}${foot} của góc ${from}`);
      }
    }

    if (bisectors.length === 0 && (text.includes('phân giác ad') || text.includes('tia phân giác của góc a') || (text.includes('phân giác') && text.includes('ad')))) {
      bisectors.push({
        from: vA,
        toSegment: `${vB}${vC}`,
        foot: 'D',
        showEqualAngleArcs: true,
        style: 'solid',
      });
      detectedEntities.push(`Đường phân giác ${vA}D của góc ${vA}`);
    }

    // Phân tích trung trực (Perpendicular bisectors)
    const perpBisectors: GeometrySpecification['perpBisectors'] = [];
    if (text.includes('trung trực')) {
      perpBisectors.push({
        segment: `${vB}${vC}`,
        label: 'd',
        showRightAngle: true,
        showTicks: true,
      });
      detectedEntities.push(`Đường trung trực của đoạn ${vB}${vC}`);
    }

    // Phân tích độ dài các cạnh & góc nếu có
    const sideLengths: { [key: string]: string } = {};
    const lengthMatches = raw.matchAll(/([A-Z]{2})\s*=\s*([0-9.,]+)\s*(cm|mm|dm|m)?/gi);
    for (const lm of lengthMatches) {
      const seg = lm[1].toUpperCase();
      const val = `${lm[2]} ${lm[3] || 'cm'}`.trim();
      sideLengths[seg] = val;
      detectedEntities.push(`Độ dài ${seg} = ${val}`);
    }

    // Phân tích góc nếu có
    const angleMatches = raw.matchAll(/(?:góc\s+([A-Z])|∠\s*([A-Z]))\s*=\s*([0-9]+)°?/gi);
    const angles: { [key: string]: number } = {};
    for (const am of angleMatches) {
      const v = (am[1] || am[2]).toUpperCase();
      const deg = parseInt(am[3], 10);
      angles[v] = deg;
      detectedEntities.push(`Góc ∠${v} = ${deg}°`);
    }

    // Phân tích Định lý Ta-lét / Đường thẳng song song cắt 2 cạnh
    const parallels: GeometrySpecification['parallels'] = [];
    if (
      text.includes('ta-lét') ||
      text.includes('thales') ||
      text.includes('song song với bc') ||
      text.includes('song song bc') ||
      text.includes('mn // bc') ||
      text.includes('mn song song')
    ) {
      parallels.push({
        line1: 'MN',
        line2: 'BC',
        label1: 'MN',
        label2: 'BC',
        arrowCount: 1,
      });
      detectedEntities.push(`Định lý Ta-lét: Đoạn thẳng MN song song ${vB}${vC} (M ∈ ${vA}${vB}, N ∈ ${vA}${vC})`);
    }

    return {
      title: (text.includes('ta-lét') || text.includes('thales'))
        ? `Định lý Ta-lét trong tam giác ${vertices.join('')}`
        : `Tam giác ${vertices.join('')}` + (triType !== 'general' ? ` (${triType})` : ''),
      shapeCategory: 'triangle',
      triangle: {
        type: triType,
        vertices,
        specialVertex,
        equalSides: triType === 'isosceles' || triType === 'right-isosceles' ? [`${vA}${vB}`, `${vA}${vC}`] : undefined,
        sideLengths: Object.keys(sideLengths).length > 0 ? sideLengths : undefined,
        angles: Object.keys(angles).length > 0 ? angles : undefined,
      },
      altitudes,
      medians,
      bisectors,
      perpBisectors,
      parallels: parallels.length > 0 ? parallels : undefined,
      detectedEntities,
      explanation: parallels.length > 0
        ? `Đã dựng tam giác ${vertices.join('')} kèm đường thẳng MN song song với đáy BC theo mô hình Định lý Ta-lét.`
        : `Đã dựng tam giác ${vertices.join('')} với đầy đủ các đường đặc biệt và quan hệ hình học chuẩn SGK.`,
    };
  }

  /**
   * Phân tích đề bài Tứ Giác & Các dạng Hình Thang, Hình Bình Hành, Chữ Nhật, Thoi, Vuông
   */
  private static parseQuadProblem(raw: string, text: string): GeometrySpecification {
    const detectedEntities: string[] = [];
    let vertices: [string, string, string, string] = ['A', 'B', 'C', 'D'];

    // Tìm tên 4 đỉnh tứ giác (Tránh bắt nhầm các chữ cái trong từ tiếng Việt như 'thang' -> 'hang')
    const quadMatch = raw.match(/(?:tứ\s+giác|hình\s+[\p{L}\s]+?)\s+([A-Z])([A-Z])([A-Z])([A-Z])\b/u) ||
                      raw.match(/\b([A-Z])([A-Z])([A-Z])([A-Z])\b/);
    if (quadMatch) {
      vertices = [
        quadMatch[1].toUpperCase(),
        quadMatch[2].toUpperCase(),
        quadMatch[3].toUpperCase(),
        quadMatch[4].toUpperCase(),
      ];
    }

    let quadType: QuadType = 'rectangle';

    if (text.includes('hình vuông')) {
      quadType = 'square';
      detectedEntities.push(`Hình vuông ${vertices.join('')}`);
    } else if (text.includes('hình thoi')) {
      quadType = 'rhombus';
      detectedEntities.push(`Hình thoi ${vertices.join('')}`);
    } else if (text.includes('hình chữ nhật')) {
      quadType = 'rectangle';
      detectedEntities.push(`Hình chữ nhật ${vertices.join('')}`);
    } else if (text.includes('hình bình hành')) {
      quadType = 'parallelogram';
      detectedEntities.push(`Hình bình hành ${vertices.join('')}`);
    } else if (text.includes('hình thang vuông')) {
      quadType = 'right-trapezoid';
      detectedEntities.push(`Hình thang vuông ${vertices.join('')}`);
    } else if (text.includes('hình thang cân')) {
      quadType = 'isosceles-trapezoid';
      detectedEntities.push(`Hình thang cân ${vertices.join('')}`);
    } else if (text.includes('hình thang')) {
      quadType = 'trapezoid';
      detectedEntities.push(`Hình thang ${vertices.join('')} (đáy ${vertices[0]}${vertices[1]} // ${vertices[2]}${vertices[3]})`);
    } else {
      quadType = 'trapezoid';
      detectedEntities.push(`Tứ giác lồi ${vertices.join('')}`);
    }

    const showDiagonals = text.includes('đường chéo') || text.includes('giao điểm') || text.includes('cắt nhau') || (text.includes('ac') && text.includes('bd')) || (text.includes('mp') && text.includes('nq'));
    let diagonalIntersection: string | undefined = undefined;
    if (showDiagonals) {
      const interMatch = raw.match(/(?:cắt\s+nhau|giao\s+nhau|giao\s+điểm)\s+tại\s+([A-Z])/i);
      diagonalIntersection = interMatch ? interMatch[1].toUpperCase() : 'O';
      detectedEntities.push(`Hai đường chéo ${vertices[0]}${vertices[2]} và ${vertices[1]}${vertices[3]} cắt nhau tại ${diagonalIntersection}`);
    }

    return {
      title: `${quadType === 'trapezoid' ? 'Hình thang' : quadType === 'rectangle' ? 'Hình chữ nhật' : quadType === 'square' ? 'Hình vuông' : quadType === 'parallelogram' ? 'Hình bình hành' : 'Tứ giác'} ${vertices.join('')}`,
      shapeCategory: 'quadrilateral',
      quadrilateral: {
        type: quadType,
        vertices,
        parallelSides: quadType.includes('trapezoid') ? [`${vertices[0]}${vertices[1]}`, `${vertices[2]}${vertices[3]}`] : undefined,
        showDiagonals,
        diagonalIntersection,
      },
      detectedEntities,
      explanation: `Đã dựng ${quadType} ${vertices.join('')} chính xác các quan hệ cạnh song song, góc vuông và đường chéo.`,
    };
  }

  /**
   * Phân tích đề bài Đường Tròn (Toán 9)
   */
  private static parseCircleProblem(raw: string, text: string): GeometrySpecification {
    const detectedEntities: string[] = [];
    const center = 'O';
    let presetType: CirclePresetType = 'basic';
    let radiusPoint = 'A';
    let tangentPoint: string | undefined = undefined;
    let tangentLineName: string | undefined = undefined;
    let externalPoint: string | undefined = undefined;
    let twoTangentPoints: [string, string] | undefined = undefined;
    let chordPoints: [string, string] | undefined = undefined;
    let chordFoot: string | undefined = undefined;
    let diameterPoints: [string, string] | undefined = undefined;

    if (text.includes('hai tiếp tuyến') || text.includes('2 tiếp tuyến') || (text.includes('tiếp tuyến') && (text.includes('ab') && text.includes('ac') || text.includes('pa') && text.includes('pb')))) {
      presetType = 'two-tangents';
      
      // 1. Nhận diện điểm ngoài đường tròn (ví dụ "từ điểm A", "điểm A nằm ngoài đường tròn", "điểm P ngoài")
      const extPointMatch = raw.match(/(?:từ\s+(?:điểm\s+)?([A-Z])\b|(?:và\s+)?điểm\s+([A-Z])\s+nằm\s+ngoài\b)/i);
      if (extPointMatch) {
        externalPoint = (extPointMatch[1] || extPointMatch[2]).toUpperCase();
      }

      // 2. Nhận diện tên 2 tiếp tuyến (ví dụ "tiếp tuyến AB, AC" hoặc "tiếp tuyến AB và AC")
      const tangentsMatch = raw.match(/tiếp\s+tuyến\s+([A-Z]{2})(?:\s+và\s+|\s*,\s*)([A-Z]{2})/i);
      if (tangentsMatch) {
        const seg1 = tangentsMatch[1].toUpperCase();
        const seg2 = tangentsMatch[2].toUpperCase();
        if (!externalPoint) {
          // Tìm điểm chung của 2 đoạn
          externalPoint = seg1[0] === seg2[0] || seg1[0] === seg2[1] ? seg1[0] : seg1[1];
        }
        const pt1 = seg1[0] === externalPoint ? seg1[1] : seg1[0];
        const pt2 = seg2[0] === externalPoint ? seg2[1] : seg2[0];
        twoTangentPoints = [pt1, pt2];
      } else {
        if (!externalPoint) externalPoint = 'P';
        twoTangentPoints = ['A', 'B'];
      }

      detectedEntities.push(`Đường tròn (O) và 2 tiếp tuyến ${externalPoint}${twoTangentPoints[0]}, ${externalPoint}${twoTangentPoints[1]} cắt nhau tại ${externalPoint}`);
    } else if (text.includes('tiếp tuyến')) {
      presetType = 'tangent-point';
      tangentPoint = 'A';
      tangentLineName = 'Ax';
      detectedEntities.push(`Đường tròn (O), tiếp tuyến Ax tại tiếp điểm A (Ax ⊥ OA)`);
    } else if (text.includes('dây cung') || text.includes('dây cd') || text.includes('dây ab') || text.includes('khoảng cách từ tâm')) {
      presetType = 'diameter-chord';
      chordPoints = ['C', 'D'];
      chordFoot = 'H';
      detectedEntities.push(`Đường tròn (O) với dây cung CD và đường vuông góc OH ⊥ CD tại H`);
    } else if (text.includes('đường kính')) {
      presetType = 'diameter-chord';
      diameterPoints = ['A', 'B'];
      detectedEntities.push(`Đường tròn (O) đường kính AB`);
    } else if (text.includes('cung') || text.includes('cung tròn')) {
      presetType = 'arc';
      detectedEntities.push(`Cung tròn AB trên đường tròn (O)`);
    } else if (text.includes('cát tuyến')) {
      presetType = 'secant';
      externalPoint = 'P';
      detectedEntities.push(`Cát tuyến PCD từ điểm P ngoài đường tròn (O)`);
    } else if (text.includes('góc nội tiếp')) {
      presetType = 'inscribed-angle';
      detectedEntities.push(`Góc nội tiếp ∠APB chắn cung AB của (O)`);
    } else {
      presetType = 'basic';
      detectedEntities.push(`Đường tròn tâm (O) bán kính OA`);
    }

    return {
      title: `Đường tròn (O) - ${presetType}`,
      shapeCategory: 'circle',
      circle: {
        presetType,
        center,
        radiusPoint,
        diameterPoints,
        chordPoints,
        chordFoot,
        tangentPoint,
        tangentLineName,
        externalPoint,
        twoTangentPoints,
      },
      detectedEntities,
      explanation: `Đã dựng đường tròn (${center}) với cấu hình ${presetType} và các ký hiệu hình học chính xác.`,
    };
  }

  /**
   * Phân tích đề bài Đoạn thẳng, Tia, Hai đường song song / vuông góc
   */
  private static parseLineRayProblem(raw: string, text: string): GeometrySpecification {
    const detectedEntities: string[] = [];
    let type: LineRayType = 'segment';
    let pointNames = ['A', 'B'];
    let hasMidpoint = false;
    let midpointName: string | undefined = undefined;

    if (text.includes('song song')) {
      type = 'parallel';
      pointNames = ['a', 'b'];
      detectedEntities.push(`Hai đường thẳng song song a // b`);
    } else if (text.includes('vuông góc')) {
      type = 'perpendicular';
      pointNames = ['d', "d'"];
      detectedEntities.push(`Hai đường thẳng vuông góc d ⊥ d'`);
    } else if (text.includes('cắt nhau')) {
      type = 'intersection';
      pointNames = ['A', 'B', 'C', 'D'];
      detectedEntities.push(`Hai đường thẳng cắt nhau tại O`);
    } else if (text.includes('tia')) {
      type = 'ray';
      pointNames = ['A', 'x'];
      detectedEntities.push(`Tia Ax`);
    } else if (text.includes('đường thẳng')) {
      type = 'line';
      pointNames = ['x', 'y'];
      detectedEntities.push(`Đường thẳng xy`);
    } else {
      type = 'segment';
      pointNames = ['A', 'B'];
      if (text.includes('trung điểm') || text.includes('m là trung điểm')) {
        hasMidpoint = true;
        midpointName = 'M';
        detectedEntities.push(`Đoạn thẳng AB có trung điểm M (MA = MB)`);
      } else {
        detectedEntities.push(`Đoạn thẳng AB`);
      }
    }

    return {
      title: `Đoạn thẳng / Đường thẳng (${type})`,
      shapeCategory: 'line-ray',
      lineRay: {
        type,
        pointNames,
        hasMidpoint,
        midpointName,
      },
      detectedEntities,
      explanation: `Đã dựng hình đối tượng ${type} với nhãn điểm và ký hiệu tương ứng.`,
    };
  }

  /**
   * Phân tích đề bài Góc, Phân giác, Cát tuyến song song
   */
  private static parseAngleProblem(raw: string, text: string): GeometrySpecification {
    const detectedEntities: string[] = [];
    let type: AngleType = 'single';
    let vertex = 'O';
    let ray1 = 'x';
    let ray2 = 'y';
    let degrees = 60;
    let hasBisector = false;
    let bisectorName: string | undefined = undefined;

    // Tìm số đo độ nếu có (ví dụ 60 độ, 90 độ, 120°)
    const degMatch = text.match(/([0-9]+)\s*(?:độ|°)/i);
    if (degMatch) {
      degrees = parseInt(degMatch[1], 10);
    }

    if (text.includes('so le trong') || text.includes('đồng vị') || text.includes('trong cùng phía') || (text.includes('song song') && text.includes('cắt bởi'))) {
      type = 'parallel-transversal';
      const hlType = text.includes('đồng vị') ? 'corresponding' : text.includes('trong cùng phía') ? 'consecutive-interior' : 'alternate-interior';
      detectedEntities.push(`Hai đường thẳng song song a // b bị cắt bởi cát tuyến c (Đánh dấu góc ${hlType === 'alternate-interior' ? 'So le trong' : hlType === 'corresponding' ? 'Đồng vị' : 'Trong cùng phía'})`);

      return {
        title: `Cát tuyến cắt hai đường thẳng song song`,
        shapeCategory: 'angle',
        angle: {
          type,
          vertex: 'A',
          ray1: 'a',
          ray2: 'b',
          parallelCutConfig: {
            line1: 'a',
            line2: 'b',
            transversal: 'c',
            vertex1: 'A',
            vertex2: 'B',
            highlightType: hlType,
          },
        },
        detectedEntities,
        explanation: `Đã dựng hai đường thẳng song song và cát tuyến với các góc đánh dấu chính xác theo SGK Toán 7.`,
      };
    }

    if (text.includes('đối đỉnh')) {
      type = 'vertical-angles';
      detectedEntities.push(`Hai góc đối đỉnh`);
    } else if (text.includes('kề bù')) {
      type = 'supplementary';
      detectedEntities.push(`Hai góc kề bù (tổng bằng 180°)`);
    } else if (text.includes('phân giác')) {
      type = 'bisector';
      hasBisector = true;
      bisectorName = 'Oz';
      detectedEntities.push(`Góc ${vertex}${ray1}${ray2} có tia phân giác ${bisectorName}`);
    } else {
      detectedEntities.push(`Góc ∠${ray1}${vertex}${ray2} = ${degrees}°`);
    }

    return {
      title: `Góc ∠${ray1}${vertex}${ray2}`,
      shapeCategory: 'angle',
      angle: {
        type,
        vertex,
        ray1,
        ray2,
        degrees,
        hasBisector,
        bisectorName,
      },
      detectedEntities,
      explanation: `Đã dựng góc ${type} kèm các cung đo và ký hiệu góc tương ứng.`,
    };
  }

  /**
   * Phân tích đề bài Đa giác đều
   */
  private static parsePolygonProblem(raw: string, text: string): GeometrySpecification {
    const detectedEntities: string[] = [];
    let type: 'equilateral-triangle' | 'square' | 'pentagon' | 'hexagon' | 'octagon' | 'custom' = 'pentagon';
    let sidesCount = 5;

    if (text.includes('lục giác') || text.includes('6 cạnh')) {
      type = 'hexagon';
      sidesCount = 6;
      detectedEntities.push('Lục giác đều (6 cạnh)');
    } else if (text.includes('bát giác') || text.includes('8 cạnh')) {
      type = 'octagon';
      sidesCount = 8;
      detectedEntities.push('Bát giác đều (8 cạnh)');
    } else if (text.includes('hình vuông') || text.includes('tứ giác đều')) {
      type = 'square';
      sidesCount = 4;
      detectedEntities.push('Hình vuông (Tứ giác đều 4 cạnh)');
    } else if (text.includes('tam giác đều')) {
      type = 'equilateral-triangle';
      sidesCount = 3;
      detectedEntities.push('Tam giác đều (3 cạnh)');
    } else {
      type = 'pentagon';
      sidesCount = 5;
      detectedEntities.push('Ngũ giác đều (5 cạnh)');
    }

    const showCircumcircle = text.includes('ngoại tiếp') || text.includes('đường tròn');
    const showIncircle = text.includes('nội tiếp');
    const showApothem = text.includes('trung đoạn') || text.includes('khoảng cách từ tâm');
    const showRadii = text.includes('nối từ tâm') || text.includes('bán kính');

    return {
      title: `Đa giác đều: ${type === 'hexagon' ? 'Lục giác đều' : type === 'pentagon' ? 'Ngũ giác đều' : type === 'octagon' ? 'Bát giác đều' : type === 'square' ? 'Hình vuông' : 'Tam giác đều'}`,
      shapeCategory: 'polygon',
      polygon: {
        type,
        sidesCount,
        centerName: 'O',
        showCircumcircle,
        showIncircle,
        showApothem,
        showRadii,
      },
      detectedEntities,
      explanation: `Đã dựng đa giác đều ${sidesCount} đỉnh nội/ngoại tiếp đường tròn tâm O với các ký hiệu cạnh và góc bằng nhau.`,
    };
  }

  /**
   * Phân tích đề bài Đối xứng (trục / tâm)
   */
  private static parseSymmetryProblem(raw: string, text: string): GeometrySpecification {
    const detectedEntities: string[] = [];
    let type: 'axial' | 'central' = 'axial';
    if (text.includes('tâm') || text.includes('qua điểm') || text.includes('tâm đối xứng')) {
      type = 'central';
      detectedEntities.push('Phép đối xứng tâm');
    } else {
      type = 'axial';
      detectedEntities.push('Phép đối xứng trục');
    }

    let targetShape: 'point' | 'segment' | 'triangle' | 'quadrilateral' | 'circle' = 'triangle';
    if (text.includes('đoạn thẳng') || text.includes('đoạn ab')) {
      targetShape = 'segment';
      detectedEntities.push('Hình gốc: Đoạn thẳng');
    } else if (text.includes('điểm') && !text.includes('tam giác') && !text.includes('đoạn thẳng')) {
      targetShape = 'point';
      detectedEntities.push('Hình gốc: Điểm');
    } else if (text.includes('đường tròn')) {
      targetShape = 'circle';
      detectedEntities.push('Hình gốc: Đường tròn');
    } else if (text.includes('tứ giác')) {
      targetShape = 'quadrilateral';
      detectedEntities.push('Hình gốc: Tứ giác');
    } else {
      targetShape = 'triangle';
      detectedEntities.push('Hình gốc: Tam giác');
    }

    return {
      title: `Phép đối xứng ${type === 'axial' ? 'trục (d)' : 'tâm (I)'}`,
      shapeCategory: 'symmetry',
      symmetry: {
        type,
        targetShape,
        axisLabel: 'd',
        centerName: 'I',
        showConnectingDashedLines: true,
        showRightAngleMarkers: true,
        showEqualDistanceMarkers: true,
      },
      detectedEntities,
      explanation: `Đã dựng hình đối xứng qua ${type === 'axial' ? 'trục d' : 'tâm I'} kèm các đoạn dóng nét đứt, ký hiệu vuông góc và khoảng cách bằng nhau.`,
    };
  }
}
