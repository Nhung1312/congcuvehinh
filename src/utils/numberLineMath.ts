/**
 * Bộ tiện ích toán học & Parser chuẩn cho Trục số (THCS)
 * Hỗ trợ: Số nguyên, Số thập phân hữu hạn, Phân số, Số vô hạn tuần hoàn, Số vô tỉ (căn thức, pi)
 */

export interface ParsedNumberResult {
  numericValue: number;
  expression: string;
  latex?: string;
  type: 'integer' | 'decimal' | 'fraction' | 'repeating' | 'irrational' | 'unknown';
  fraction?: {
    numerator: number;
    denominator: number;
  };
  isValid: boolean;
}

/**
 * Tìm ước chung lớn nhất (GCD)
 */
export const gcd = (a: number, b: number): number => {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
};

/**
 * Tìm bội chung nhỏ nhất (LCM)
 */
export const lcm = (a: number, b: number): number => {
  if (a === 0 || b === 0) return 0;
  return Math.abs(Math.round(a * b)) / gcd(a, b);
};

/**
 * Rút gọn phân số
 */
export const simplifyFraction = (num: number, den: number): { num: number; den: number } => {
  if (den === 0) return { num, den: 1 };
  if (den < 0) {
    num = -num;
    den = -den;
  }
  const common = gcd(num, den);
  return {
    num: Math.round(num / common),
    den: Math.round(den / common),
  };
};

/**
 * Parse số thập phân vô hạn tuần hoàn sang phân số
 * Hỗ trợ các định dạng:
 * - 0,(3) -> 1/3
 * - 1,(6) -> 5/3
 * - 2,(45) -> 27/11
 * - -0,(12) -> -4/33
 * - 0.1(6) -> 1/6
 * - 0.\bar{3} hoặc 0.\overline{3} -> 1/3
 */
export const parseRepeatingDecimal = (input: string): { numerator: number; denominator: number; value: number } | null => {
  const str = input.trim().replace(/\s+/g, '').replace(/,/g, '.');

  // Chuẩn hóa dạng LaTeX \bar{...} hoặc \overline{...} về dạng (...)
  const normalized = str
    .replace(/\\overline\{([^}]+)\}/g, '($1)')
    .replace(/\\bar\{([^}]+)\}/g, '($1)');

  const match = normalized.match(/^([+-]?\d*)\.?(\d*)\((\d+)\)$/);
  if (!match) return null;

  const sign = normalized.startsWith('-') ? -1 : 1;
  const intPartStr = match[1].replace(/^[+-]/, '');
  const nonRepStr = match[2] || '';
  const repStr = match[3];

  const intPart = intPartStr ? parseInt(intPartStr, 10) : 0;
  const nonRepDigits = nonRepStr.length;
  const repDigits = repStr.length;

  if (repDigits === 0) return null;

  // Công thức chuyển đổi số thập phân vô hạn tuần hoàn:
  // Ví dụ 0.1(6) -> nonRep = 1, rep = 6
  // Phần thập phân = (nonRep * (10^rep - 1) + rep) / ((10^rep - 1) * 10^nonRep)
  const repNines = Math.pow(10, repDigits) - 1; // 99...9
  const shift = Math.pow(10, nonRepDigits); // 10^m

  const nonRepVal = nonRepStr ? parseInt(nonRepStr, 10) : 0;
  const repVal = parseInt(repStr, 10);

  const decNumerator = nonRepVal * repNines + repVal;
  const decDenominator = repNines * shift;

  // Tổng hợp cùng phần nguyên:
  const totalNum = intPart * decDenominator + decNumerator;
  const totalDen = decDenominator;

  const simplified = simplifyFraction(totalNum, totalDen);
  const finalNum = sign * simplified.num;
  const finalDen = simplified.den;

  return {
    numerator: finalNum,
    denominator: finalDen,
    value: finalNum / finalDen,
  };
};

/**
 * Parse biểu thức toán học trên trục số
 */
export const parseMathExpression = (input: string | number): ParsedNumberResult => {
  if (typeof input === 'number') {
    return {
      numericValue: input,
      expression: String(input),
      type: Number.isInteger(input) ? 'integer' : 'decimal',
      isValid: !isNaN(input),
    };
  }

  const raw = String(input).trim();
  if (!raw) {
    return { numericValue: 0, expression: '0', type: 'integer', isValid: false };
  }

  // 1. Kiểm tra Số vô hạn tuần hoàn: 0,(3) / 1,(6) / 2,(45) / 0.\bar{3}
  const repResult = parseRepeatingDecimal(raw);
  if (repResult) {
    return {
      numericValue: repResult.value,
      expression: raw,
      type: 'repeating',
      fraction: {
        numerator: repResult.numerator,
        denominator: repResult.denominator,
      },
      isValid: true,
    };
  }

  // Chuẩn hóa dấu phẩy tiếng Việt thành dấu chấm
  let s = raw.replace(/,/g, '.').replace(/\s+/g, '');

  // 2. Kiểm tra Số vô tỉ: căn bậc hai (√2, -√3, sqrt(5), etc.)
  const sqrtMatch = s.match(/^([+-]?)(?:√|sqrt\()(\d+(?:\.\d+)?)\)?$/i);
  if (sqrtMatch) {
    const sign = sqrtMatch[1] === '-' ? -1 : 1;
    const innerVal = parseFloat(sqrtMatch[2]);
    if (!isNaN(innerVal) && innerVal >= 0) {
      const val = sign * Math.sqrt(innerVal);
      const cleanExpr = (sign === -1 ? '-' : '') + '√' + sqrtMatch[2];
      return {
        numericValue: val,
        expression: cleanExpr,
        type: 'irrational',
        isValid: true,
      };
    }
  }

  // 3. Kiểm tra Hằng số Pi: π, -π, 2π, pi, -pi
  if (/^([+-]?)(\d*(?:\.\d+)?)?(?:π|pi)$/i.test(s)) {
    const piMatch = s.match(/^([+-]?)(\d*(?:\.\d+)?)?(?:π|pi)$/i);
    if (piMatch) {
      const sign = piMatch[1] === '-' ? -1 : 1;
      const coeff = piMatch[2] ? parseFloat(piMatch[2]) : 1;
      const val = sign * coeff * Math.PI;
      return {
        numericValue: val,
        expression: (sign === -1 ? '-' : '') + (coeff !== 1 ? coeff : '') + 'π',
        type: 'irrational',
        isValid: true,
      };
    }
  }

  // 4. Kiểm tra Phân số: a/b, -a/b, +a/b
  const fracMatch = s.match(/^([+-]?\d+)\/([+-]?\d+)$/);
  if (fracMatch) {
    const num = parseInt(fracMatch[1], 10);
    const den = parseInt(fracMatch[2], 10);
    if (den !== 0) {
      const simplified = simplifyFraction(num, den);
      return {
        numericValue: num / den,
        expression: raw,
        type: 'fraction',
        fraction: {
          numerator: simplified.num,
          denominator: simplified.den,
        },
        isValid: true,
      };
    }
  }

  // 5. Kiểm tra Số thập phân hữu hạn hoặc Số nguyên
  const numVal = parseFloat(s);
  if (!isNaN(numVal)) {
    const isInt = Number.isInteger(numVal) && !raw.includes('.') && !raw.includes(',');
    return {
      numericValue: numVal,
      expression: raw,
      type: isInt ? 'integer' : 'decimal',
      isValid: true,
    };
  }

  // Thử đánh giá an toàn biểu thức đơn giản (ví dụ 1+1/2, 2*3, etc.)
  try {
    // Chỉ cho phép các ký tự an toàn
    if (/^[0-9+\-*/().]+$/.test(s)) {
      // eslint-disable-next-line no-eval
      const evalVal = Function(`"use strict"; return (${s})`)();
      if (typeof evalVal === 'number' && !isNaN(evalVal)) {
        return {
          numericValue: evalVal,
          expression: raw,
          type: Number.isInteger(evalVal) ? 'integer' : 'decimal',
          isValid: true,
        };
      }
    }
  } catch {
    // Không eval được
  }

  return {
    numericValue: 0,
    expression: raw,
    type: 'unknown',
    isValid: false,
  };
};

/**
 * Tìm mẫu số chung tối ưu để chia vạch phụ trên trục số dựa trên danh sách các điểm biểu diễn
 */
export const calculateOptimalSubDivisions = (
  markers: Array<{ expression?: string; value?: number; numericValue?: number }>,
  userSubStep?: number
): number => {
  if (userSubStep && userSubStep > 1) {
    return Math.min(24, Math.round(userSubStep));
  }

  const denominators: number[] = [];

  markers.forEach((m) => {
    const expr = m.expression || String(m.value ?? m.numericValue ?? '');
    const parsed = parseMathExpression(expr);

    if (parsed.type === 'fraction' && parsed.fraction) {
      if (parsed.fraction.denominator > 1 && parsed.fraction.denominator <= 16) {
        denominators.push(parsed.fraction.denominator);
      }
    } else if (parsed.type === 'repeating' && parsed.fraction) {
      if (parsed.fraction.denominator > 1 && parsed.fraction.denominator <= 16) {
        denominators.push(parsed.fraction.denominator);
      }
    } else if (parsed.type === 'decimal') {
      // Thử nhận diện số thập phân đơn giản như 0.5 (1/2), 0.25 (1/4), 0.75 (3/4), 0.2 (1/5)
      const val = parsed.numericValue;
      const fracPart = Math.abs(val - Math.floor(val));
      if (Math.abs(fracPart - 0.5) < 0.001) denominators.push(2);
      else if (Math.abs(fracPart - 0.25) < 0.001 || Math.abs(fracPart - 0.75) < 0.001) denominators.push(4);
      else if (Math.abs(fracPart - 0.2) < 0.001 || Math.abs(fracPart - 0.4) < 0.001 || Math.abs(fracPart - 0.6) < 0.001 || Math.abs(fracPart - 0.8) < 0.001) denominators.push(5);
      else if (Math.abs(fracPart - 0.125) < 0.001 || Math.abs(fracPart - 0.375) < 0.001 || Math.abs(fracPart - 0.625) < 0.001 || Math.abs(fracPart - 0.875) < 0.001) denominators.push(8);
    }
  });

  if (denominators.length === 0) return 1;

  // Tính LCM của các mẫu số
  let common = denominators[0];
  for (let i = 1; i < denominators.length; i++) {
    common = lcm(common, denominators[i]);
    if (common > 20) break; // Giới hạn để vạch chia không bị quá dày
  }

  return common <= 20 ? common : Math.min(...denominators);
};
