import type { ChartDocument, CustomAuxPoint, Point2D } from "../../types";
import type {
  GeometrySpecification,
  GeometryVerification,
  GeometryAngleCondition,
} from "../types";
import { geometrySceneCoordinates } from "../../utils/geometrySceneCoordinates";
import {
  geometryEndpoints,
  resolveAuxiliaryPoints,
} from "../../utils/resolveAuxiliaryPoints";
import {
  dist,
  midpoint,
  projectPointToLine,
  angleBisectorPoint,
  getTriangleCircumcircle,
  computeReflectedPoints,
  perpendicularBisectorSegment,
  getParallelLineThroughPoint,
  getPerpendicularLineThroughPoint,
} from "../../utils/geometryMath";

const finite = (p: Point2D | undefined) =>
  p && Number.isFinite(p.x) && Number.isFinite(p.y);
const cross = (a: Point2D, b: Point2D, c: Point2D) =>
  (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
export function angleDegrees(v: Point2D, a: Point2D, b: Point2D) {
  const d = dist(v, a) * dist(v, b);
  return d > 1e-12
    ? (Math.acos(
        Math.max(
          -1,
          Math.min(
            1,
            ((a.x - v.x) * (b.x - v.x) + (a.y - v.y) * (b.y - v.y)) / d,
          ),
        ),
      ) *
        180) /
        Math.PI
    : NaN;
}

/** Pure assessment, also supplying dimensionless residuals to the bounded coordinate solver. */
export function assessGeometryScene(
  spec: GeometrySpecification,
  doc: ChartDocument,
) {
  const errors: string[] = [],
    missingData: string[] = [],
    unsupportedConditions: string[] = [],
    contradictions: string[] = [],
    checkedConditions: string[] = [];
  missingData.push(...(spec.inputIssues || []));
  unsupportedConditions.push(...(spec.unhandledConditions || []));
  const residuals: number[] = [];
  const scene = geometrySceneCoordinates(doc.data.geometry);
  const { points, base, names, shape } = scene;
  const scale = Math.max(
    1,
    ...base.flatMap((a, i) =>
      base
        .slice(i + 1)
        .filter(finite)
        .map((b) => (finite(a) ? dist(a, b) : 1)),
    ),
  );
  const check = (label: string, residual: number, tolerance = 1e-6) => {
    if (!Number.isFinite(residual)) {
      missingData.push(`${label}: tọa độ suy biến hoặc thiếu.`);
      residuals.push(1);
      return;
    }
    residuals.push(Math.max(0, Math.abs(residual) - tolerance));
    checkedConditions.push(label);
    if (Math.abs(residual) > tolerance) errors.push(label);
  };
  const need = (name: string, label: string): Point2D | undefined => {
    const p = points[name];
    if (!finite(p)) {
      missingData.push(`${label}: chưa xác định điểm ${name}.`);
      residuals.push(1);
      return;
    }
    return p;
  };
  const segment = (
    s: string | string[],
    label: string,
  ): [Point2D, Point2D] | null => {
    const result = geometryEndpoints(s, points);
    if (!result || !result.every(finite)) {
      missingData.push(`${label}: thiếu hai đầu mút ${s}.`);
      residuals.push(1);
      return null;
    }
    if (dist(...result) < scale * 1e-9) {
      check(`${label}: đoạn ${s} suy biến`, 1);
      return null;
    }
    return result;
  };
  const equal = (a: string | string[], b: string | string[], label: string) => {
    const u = segment(a, label),
      v = segment(b, label);
    if (u && v) check(label, (dist(...u) - dist(...v)) / scale);
  };
  const parallel = (
    a: string | string[],
    b: string | string[],
    label: string,
  ) => {
    const u = segment(a, label),
      v = segment(b, label);
    if (u && v)
      check(
        label,
        ((u[1].x - u[0].x) * (v[1].y - v[0].y) -
          (u[1].y - u[0].y) * (v[1].x - v[0].x)) /
          (dist(...u) * dist(...v)),
      );
  };
  const angle = (condition: GeometryAngleCondition) => {
    const i = names.indexOf(condition.vertex);
    const ray1 =
        condition.ray1 ||
        (i >= 0 ? names[(i + names.length - 1) % names.length] : ""),
      ray2 = condition.ray2 || (i >= 0 ? names[(i + 1) % names.length] : "");
    const label = `Góc ${ray1}${condition.vertex}${ray2}`;
    const v = need(condition.vertex, label),
      a = need(ray1, label),
      b = need(ray2, label);
    if (!v || !a || !b) return;
    const deg = angleDegrees(v, a, b);
    if (condition.type === "acute")
      check(
        `${label} phải nhọn (thực tế ${deg.toFixed(2)}°)`,
        Math.max(0, (deg - 89.999) / 180),
        1e-8,
      );
    else if (condition.type === "obtuse")
      check(
        `${label} phải tù (thực tế ${deg.toFixed(2)}°)`,
        Math.max(0, (90.001 - deg) / 180),
        1e-8,
      );
    else if (condition.type === "right")
      check(
        `${label} phải vuông (thực tế ${deg.toFixed(2)}°)`,
        (deg - 90) / 180,
      );
    else if (condition.type)
      unsupportedConditions.push(
        `${label}: loại góc ${condition.type} chưa hỗ trợ.`,
      );
    if (condition.degrees !== undefined) {
      if (
        !Number.isFinite(condition.degrees) ||
        condition.degrees <= 0 ||
        condition.degrees >= 180
      )
        contradictions.push(`${label}: số đo phải nằm giữa 0° và 180°.`);
      else {
        check(
          `${label} phải bằng ${condition.degrees}° (thực tế ${deg.toFixed(2)}°)`,
          (deg - condition.degrees) / 180,
        );
        if (
          (condition.type === "right" && condition.degrees !== 90) ||
          (condition.type === "acute" && condition.degrees >= 90) ||
          (condition.type === "obtuse" && condition.degrees <= 90)
        )
          contradictions.push(`${label}: loại góc mâu thuẫn số đo.`);
      }
    }
    if (!condition.type && condition.degrees === undefined)
      missingData.push(`${label}: chưa cho loại hoặc số đo.`);
  };
  const position = (
    point: string,
    target: string | string[],
    kind: "line" | "ray" | "segment",
  ) => {
    const label = `Điểm ${point} thuộc ${kind === "segment" ? "đoạn" : kind === "ray" ? "tia" : "đường thẳng"} ${target}`;
    const p = need(point, label),
      s = segment(target, label);
    if (!p || !s) return;
    const proj = projectPointToLine(p, ...s);
    check(label, dist(p, proj.point) / scale);
    if (kind === "segment")
      check(
        `${label}: không được nằm ngoài đoạn`,
        Math.max(0, -proj.t, proj.t - 1),
      );
    if (kind === "ray")
      check(`${label}: phải đúng hướng tia`, Math.max(0, -proj.t));
  };
  const required =
    spec.shapeCategory === "triangle"
      ? 3
      : spec.shapeCategory === "quadrilateral"
        ? 4
        : 1;
  const definition =
    spec.shapeCategory === "line-ray"
      ? spec.lineRay
      : (spec as any)[spec.shapeCategory];
  if (!definition)
    missingData.push(`Thiếu dữ liệu hình chính ${spec.shapeCategory}.`);
  if (doc.data.geometry?.subType !== spec.shapeCategory)
    missingData.push("Nhóm hình của tài liệu khác giả thiết.");
  if (
    definition?.vertices &&
    JSON.stringify(definition.vertices) !== JSON.stringify(names)
  )
    missingData.push("Tên hoặc thứ tự các đỉnh khác giả thiết.");
  if (
    spec.shapeCategory === "triangle" &&
    ![
      "general",
      "right",
      "isosceles",
      "equilateral",
      "right-isosceles",
      "obtuse",
    ].includes(spec.triangle?.type)
  )
    unsupportedConditions.push("Loại tam giác chưa được hỗ trợ.");
  if (
    spec.shapeCategory === "quadrilateral" &&
    ![
      "general",
      "trapezoid",
      "right-trapezoid",
      "isosceles-trapezoid",
      "parallelogram",
      "rectangle",
      "rhombus",
      "square",
      "cyclic",
    ].includes(spec.quadrilateral?.type)
  )
    unsupportedConditions.push("Loại tứ giác chưa được hỗ trợ.");

  if (!shape || base.length < required || base.some((p) => !finite(p)))
    missingData.push("Thiếu tọa độ hữu hạn của hình chính.");
  if (names.length && new Set(names).size !== names.length)
    contradictions.push("Tên đỉnh hình chính bị trùng.");
  if (missingData.length) return finish();
  check("Hình chính có tọa độ hữu hạn", 0);
  if (
    spec.shapeCategory === "triangle" ||
    spec.shapeCategory === "quadrilateral" ||
    spec.shapeCategory === "polygon"
  ) {
    for (let i = 0; i < base.length; i++)
      check(
        `Cạnh ${i + 1} không suy biến`,
        Math.max(0, 1e-4 - dist(base[i], base[(i + 1) % base.length]) / scale),
        1e-8,
      );
    if (base.length >= 3) {
      const turns = base.map(
        (p, i) =>
          cross(p, base[(i + 1) % base.length], base[(i + 2) % base.length]) /
          scale ** 2,
      );
      const sign = turns.reduce((a, b) => a + b, 0) >= 0 ? 1 : -1;
      check(
        "Hình chính không suy biến, không tự cắt và lồi",
        Math.max(...turns.map((t) => Math.max(0, 1e-5 - sign * t))),
        1e-8,
      );
    }
  }
  if (spec.triangle && spec.shapeCategory === "triangle") {
    const t = spec.triangle,
      n = t.vertices,
      apex = t.specialVertex || n[0],
      others = n.filter((v) => v !== apex);
    if (t.circumscribedCircle && !shape.circumscribedCircle?.enabled)
      missingData.push("Thiếu đường tròn ngoại tiếp đã yêu cầu.");
    if (t.inscribedCircle && !shape.inscribedCircle?.enabled)
      missingData.push("Thiếu đường tròn nội tiếp đã yêu cầu.");

    if (!n.includes(apex))
      missingData.push(`Đỉnh đặc biệt ${apex} không thuộc tam giác.`);
    if (t.type === "right" || t.type === "right-isosceles")
      angle({ vertex: apex, type: "right" });
    if (["isosceles", "right-isosceles", "equilateral"].includes(t.type))
      equal(
        [apex, others[0]],
        [apex, others[1]],
        `Hai cạnh tại ${apex} phải bằng nhau`,
      );
    if (t.type === "equilateral")
      equal([n[0], n[1]], [n[1], n[2]], "Ba cạnh tam giác đều phải bằng nhau");
    if (t.type === "obtuse") angle({ vertex: apex, type: "obtuse" });
    if (t.equalSides)
      equal(
        t.equalSides[0],
        t.equalSides[1],
        "Cặp cạnh bằng nhau trong giả thiết",
      );
    for (const [vertex, degrees] of Object.entries(t.angles || {}))
      angle({ vertex, degrees });
    const angleValues = Object.values(t.angles || {});
    if (
      angleValues.length === 3 &&
      Math.abs(angleValues.reduce((a, b) => a + b, 0) - 180) > 1e-6
    )
      contradictions.push("Tổng ba góc tam giác khác 180°.");
    if (angleValues.length < 3 && angleValues.reduce((a, b) => a + b, 0) >= 180)
      contradictions.push("Các góc đã cho không thể thuộc một tam giác.");
    const numeric = Object.entries(t.sideLengths || {}).map(([s, v]) => ({
      s:
        (
          { a: n[1] + n[2], b: n[0] + n[2], c: n[0] + n[1] } as Record<
            string,
            string
          >
        )[s] || s,
      v: (() => {
        const m = String(v)
          .trim()
          .replace(",", ".")
          .match(/^(\d+(?:\.\d+)?)\s*(mm|cm|dm|m)?$/i);
        return m
          ? Number(m[1]) *
              ({ mm: 1, cm: 10, dm: 100, m: 1000 }[m[2]?.toLowerCase()] || 1)
          : NaN;
      })(),
    }));
    let unit: number | undefined;
    for (const { s, v } of numeric) {
      if (!Number.isFinite(v)) {
        unsupportedConditions.push(`Độ dài ${s} chứa biểu thức chưa hỗ trợ.`);
        continue;
      }
      if (v <= 0) {
        contradictions.push(`Độ dài ${s} phải dương.`);
        continue;
      }
      const seg = segment(s, `Độ dài ${s}`);
      if (!seg) continue;
      unit ??= dist(...seg) / v;
      check(`Tỉ lệ độ dài ${s} = ${v}`, (dist(...seg) - v * unit) / scale);
    }
    if (
      numeric.length === 3 &&
      numeric.every((p) => p.v > 0) &&
      numeric.some((p) => 2 * p.v >= numeric.reduce((a, b) => a + b.v, 0))
    )
      contradictions.push("Ba độ dài vi phạm bất đẳng thức tam giác.");
  }
  if (spec.quadrilateral && spec.shapeCategory === "quadrilateral") {
    const q = spec.quadrilateral,
      n = q.vertices,
      side = (i: number) => [n[i], n[(i + 1) % 4]];
    if (["parallelogram", "rectangle", "rhombus", "square"].includes(q.type)) {
      parallel(side(0), side(2), "Hai cạnh đối thứ nhất phải song song");
      parallel(side(1), side(3), "Hai cạnh đối thứ hai phải song song");
    }
    if (
      ["trapezoid", "right-trapezoid", "isosceles-trapezoid"].includes(q.type)
    )
      parallel(side(0), side(2), "Hai đáy hình thang phải song song");
    if (q.parallelSides)
      parallel(
        q.parallelSides[0],
        q.parallelSides[1],
        "Cặp cạnh song song trong giả thiết",
      );
    if (["rectangle", "square"].includes(q.type))
      for (const vertex of n) angle({ vertex, type: "right" });
    if (q.type === "right-trapezoid")
      for (const vertex of [n[0], n[3]]) angle({ vertex, type: "right" });
    if (["rhombus", "square"].includes(q.type))
      for (let i = 1; i < 4; i++)
        equal(side(0), side(i), "Các cạnh hình thoi/vuông phải bằng nhau");
    if (q.type === "isosceles-trapezoid")
      equal(side(1), side(3), "Hai cạnh bên hình thang cân phải bằng nhau");
    if (q.type === "cyclic" || q.showCircumcircle) {
      const c = getTriangleCircumcircle(base[0], base[1], base[2]);
      check(
        "Bốn đỉnh phải cùng thuộc đường tròn",
        (dist(c.center, base[3]) - c.radius) / scale,
      );
    }
    if (q.specialAngle) angle(q.specialAngle);
  }
  const comparisons =
    spec.shapeCategory === "triangle"
      ? spec.triangle?.sideComparisons || []
      : spec.shapeCategory === "quadrilateral"
        ? spec.quadrilateral?.sideComparisons || []
        : [];
  // Detect strict-order cycles (including reverse endpoint notation) independently of coordinates.
  const canonical = (s: string) => {
    if (names.length) {
      for (const a of names)
        for (const b of names)
          if (a !== b && a + b === s) return [a, b].sort().join(":");
    }
    return s.split("").sort().join(":");
  };
  const parent = new Map<string, string>();
  const find = (s: string): string => {
    const p = parent.get(s);
    if (!p) return s;
    const root = find(p);
    parent.set(s, root);
    return root;
  };
  const unite = (a: string, b: string) => {
    const x = find(canonical(a)),
      y = find(canonical(b));
    if (x !== y) parent.set(x, y);
  };
  const n = names;
  if (spec.shapeCategory === "quadrilateral" && n.length === 4) {
    const type = spec.quadrilateral.type;
    if (["parallelogram", "rectangle", "rhombus", "square"].includes(type)) {
      unite(n[0] + n[1], n[2] + n[3]);
      unite(n[1] + n[2], n[3] + n[0]);
    }
    if (["rhombus", "square"].includes(type)) unite(n[0] + n[1], n[1] + n[2]);
    if (type === "isosceles-trapezoid") unite(n[1] + n[2], n[3] + n[0]);
  }
  if (spec.shapeCategory === "triangle" && n.length === 3) {
    const t = spec.triangle,
      apex = t.specialVertex || n[0],
      others = n.filter((v) => v !== apex);
    if (["isosceles", "equilateral", "right-isosceles"].includes(t.type))
      unite(apex + others[0], apex + others[1]);
    if (t.type === "equilateral") unite(n[0] + n[1], n[1] + n[2]);
  }
  for (const g of spec.equalSegments || [])
    for (const s of g.segments.slice(1))
      unite(
        Array.isArray(g.segments[0]) ? g.segments[0].join("") : g.segments[0],
        Array.isArray(s) ? s.join("") : s,
      );
  const graph = new Map<string, string[]>();
  for (const c of comparisons) {
    const a = find(canonical(c.shorter)),
      b = find(canonical(c.longer));
    graph.set(a, [...(graph.get(a) || []), b]);
    const u = segment(c.shorter, "So sánh cạnh"),
      v = segment(c.longer, "So sánh cạnh");
    if (u && v)
      check(
        `${c.shorter} phải ngắn hơn ${c.longer}`,
        Math.max(0, (dist(...u) - dist(...v)) / scale + 1e-4),
        1e-8,
      );
  }
  const visiting = new Set<string>(),
    done = new Set<string>();
  const cycle = (a: string): boolean => {
    if (visiting.has(a)) return true;
    if (done.has(a)) return false;
    visiting.add(a);
    const found = (graph.get(a) || []).some(cycle);
    visiting.delete(a);
    done.add(a);
    return found;
  };
  if ([...graph.keys()].some(cycle))
    contradictions.push(
      "Các bất đẳng thức cạnh tạo thành chu trình mâu thuẫn.",
    );
  const allAngles: GeometryAngleCondition[] = [
    ...(spec.angleConstraints || []),
    ...(spec.quadrilateral?.specialAngle &&
    spec.shapeCategory === "quadrilateral"
      ? [spec.quadrilateral.specialAngle]
      : []),
    ...Object.entries(
      spec.shapeCategory === "triangle" ? spec.triangle?.angles || {} : {},
    ).map(([vertex, degrees]) => ({ vertex, degrees })),
  ];
  for (let i = 0; i < allAngles.length; i++)
    for (let j = i + 1; j < allAngles.length; j++) {
      const a = allAngles[i],
        b = allAngles[j];
      const interior = (c: GeometryAngleCondition) =>
        !c.ray1 ||
        [
          names[(names.indexOf(c.vertex) + names.length - 1) % names.length],
          names[(names.indexOf(c.vertex) + 1) % names.length],
        ]
          .sort()
          .join(":") === [c.ray1, c.ray2].sort().join(":");
      if (a.vertex !== b.vertex || !interior(a) || !interior(b)) continue;
      if (
        (a.degrees !== undefined &&
          b.degrees !== undefined &&
          Math.abs(a.degrees - b.degrees) > 1e-6) ||
        (a.type && b.type && a.type !== b.type) ||
        (a.type === "right" && b.degrees !== undefined && b.degrees !== 90) ||
        (b.type === "right" && a.degrees !== undefined && a.degrees !== 90)
      )
        contradictions.push(`Góc ${a.vertex} có các điều kiện mâu thuẫn.`);
    }
  if (
    spec.shapeCategory === "quadrilateral" &&
    ["rectangle", "square"].includes(spec.quadrilateral.type)
  )
    for (const a of allAngles)
      if (
        (a.type && a.type !== "right") ||
        (a.degrees !== undefined && a.degrees !== 90)
      )
        contradictions.push("Điều kiện góc mâu thuẫn với hình chữ nhật/vuông.");
  if (spec.shapeCategory === "triangle") {
    const values = new Map(
      allAngles
        .filter((a) => a.degrees !== undefined)
        .map((a) => [a.vertex, a.degrees!]),
    );
    if (
      values.size === 3 &&
      Math.abs([...values.values()].reduce((a, b) => a + b, 0) - 180) > 1e-6
    )
      contradictions.push("Tổng ba góc tam giác khác 180°.");
  }
  for (const a of spec.angleConstraints || []) angle(a);
  for (const a of spec.rightAngles || []) angle({ ...a, type: "right" });
  for (const p of spec.parallels || [])
    parallel(p.line1, p.line2, `${p.line1} phải song song ${p.line2}`);
  for (const group of spec.equalSegments || []) {
    if (group.segments.length < 2)
      missingData.push("Nhóm cạnh bằng nhau thiếu đoạn thẳng.");
    for (const s of group.segments.slice(1))
      equal(group.segments[0], s, `${group.segments[0]} phải bằng ${s}`);
  }
  for (const group of spec.equalAngles || []) {
    const values = group.angles.map((a) => {
      const v = need(a.vertex, "Góc bằng nhau"),
        u = need(a.ray1, "Góc bằng nhau"),
        w = need(a.ray2, "Góc bằng nhau");
      return v && u && w ? angleDegrees(v, u, w) : NaN;
    });
    if (values.length < 2) missingData.push("Nhóm góc bằng nhau thiếu góc.");
    for (const v of values.slice(1))
      check("Các góc được đánh dấu phải bằng nhau", (v - values[0]) / 180);
  }
  for (const c of spec.pointConstraints || [])
    position(c.point, c.target, c.kind);
  const auxTypes = [
    "midpoint",
    "ratio",
    "projection",
    "free",
    "intersection",
    "on-circle",
    "on-ray",
    "tangent",
    "orthocenter",
    "centroid",
    "incenter",
    "circumcenter",
  ];
  const definitions = (spec.auxPoints || []).map(
    (p, i) =>
      ({
        ...p,
        id: `verify-${i}`,
        triangleVertices: p.triangleVertices || spec.triangle?.vertices,
      }) as CustomAuxPoint,
  );
  const auxNames = definitions.map((p) => p.name);
  if (new Set(auxNames).size !== auxNames.length)
    contradictions.push("Một điểm phụ có nhiều định nghĩa.");
  if (auxNames.some((n) => names.includes(n)))
    contradictions.push("Điểm phụ trùng tên đỉnh gốc.");
  const expected = resolveAuxiliaryPoints(
    scene.anchors,
    definitions,
    scene.circles[0]?.radius,
  );
  // A dependent definition must not silently move an intrinsic point that SVG also draws.
  for (const name of auxNames) {
    const intrinsic = scene.anchors[name],
      derived = expected[name];
    if (finite(intrinsic) && finite(derived)) {
      check(
        `Điểm ${name}: định nghĩa phụ phải khớp điểm đã dựng`,
        dist(intrinsic, derived) / scale,
      );
    }
  }
  for (const p of definitions) {
    if (!auxTypes.includes(p.type)) {
      unsupportedConditions.push(
        `Phép dựng ${p.type} của điểm ${p.name} chưa hỗ trợ.`,
      );
      continue;
    }
    const actual = need(p.name, `Phép dựng điểm ${p.name}`),
      want = expected[p.name];
    if (!finite(want)) {
      missingData.push(
        `Không giải được điểm ${p.name}: thiếu tham chiếu, vòng phụ thuộc hoặc phép dựng không có nghiệm.`,
      );
      residuals.push(1);
      continue;
    }
    if (actual)
      check(
        `Điểm ${p.name} phải đúng phép dựng ${p.type}`,
        dist(actual, want) / scale,
      );
    if (p.type === "projection" && actual && p.fromPoint && p.targetLine) {
      position(p.name, p.targetLine, "line");
      const from = need(p.fromPoint, "Hình chiếu"),
        s = segment(p.targetLine, "Hình chiếu");
      if (from && s)
        check(
          `Hình chiếu ${p.name}: đường chiếu phải vuông góc`,
          ((from.x - actual.x) * (s[1].x - s[0].x) +
            (from.y - actual.y) * (s[1].y - s[0].y)) /
            scale ** 2,
        );
    }
    if (p.type === "on-ray" && p.segment) position(p.name, p.segment, "ray");
    if (p.type === "on-circle" || p.type === "tangent") {
      const circle = scene.circles.find(
        (c) => c.name === (p.centerPoint || "O"),
      );
      const at =
        p.type === "tangent" && p.fromPoint
          ? need(p.fromPoint, "Tiếp điểm")
          : actual;
      if (circle && at)
        check(
          `${p.type === "tangent" ? "Tiếp điểm" : "Điểm"} ${p.type === "tangent" ? p.fromPoint : p.name} phải thuộc đường tròn`,
          (dist(at, circle.center) - circle.radius) / scale,
        );
    }
    if (p.mustBeInsideSegment) {
      const target = p.type === "projection" ? p.targetLine : p.segment;
      if (target) position(p.name, target, "segment");
      else missingData.push(`Điểm ${p.name}: thiếu đoạn bắt buộc chứa điểm.`);
    }
  }
  for (const a of spec.altitudes || []) {
    position(a.foot, a.toLine, "line");
    const v = need(a.foot, "Đường cao"),
      from = need(a.from, "Đường cao"),
      s = segment(a.toLine, "Đường cao");
    if (v && from && s)
      check(
        `Đường cao ${a.from}${a.foot} phải vuông góc ${a.toLine}`,
        ((from.x - v.x) * (s[1].x - s[0].x) +
          (from.y - v.y) * (s[1].y - s[0].y)) /
          scale ** 2,
      );
  }
  for (const m of spec.medians || []) {
    const p = need(m.midpoint, "Trung điểm"),
      s = segment(m.toSegment, "Trung điểm");
    if (p && s)
      check(
        `${m.midpoint} phải là trung điểm ${m.toSegment}`,
        dist(p, midpoint(...s)) / scale,
      );
  }
  for (const b of spec.bisectors || []) {
    const p = need(b.foot, "Phân giác"),
      v = need(b.from, "Phân giác"),
      s = segment(b.toSegment, "Phân giác");
    if (p && v && s)
      check(
        `${b.from}${b.foot} phải là phân giác`,
        dist(p, angleBisectorPoint(v, ...s)) / scale,
      );
  }
  for (const p of spec.perpBisectors || []) {
    const s = segment(p.segment, "Trung trực");
    if (!s) continue;
    if (spec.shapeCategory !== "triangle") {
      unsupportedConditions.push(
        `Trung trực ${p.segment}: engine chưa biểu diễn đường này ở nhóm hình hiện tại.`,
      );
      continue;
    }
    const raw = Array.isArray(p.segment) ? p.segment : p.segment.split("");
    const roles = raw
      .map((n) => ["A", "B", "C"][names.indexOf(n)])
      .sort()
      .join("");
    if (
      raw.length !== 2 ||
      !shape.perpBisectors?.some((q: any) => q.enabled && q.side === roles)
    ) {
      missingData.push(`Chưa dựng trung trực ${p.segment}.`);
      continue;
    }
    const line = perpendicularBisectorSegment(...s, 70),
      mid = midpoint(...s);
    check(
      `Trung trực ${p.segment} phải qua trung điểm`,
      dist(mid, line.mid) / scale,
    );
    check(
      `Trung trực ${p.segment} phải vuông góc`,
      ((line.end.x - line.start.x) * (s[1].x - s[0].x) +
        (line.end.y - line.start.y) * (s[1].y - s[0].y)) /
        scale ** 2,
    );
  }
  for (const l of spec.auxLines || []) {
    need(l.from, "Đường phụ");
    need(l.to, "Đường phụ");
  }
  if (spec.shapeCategory === "circle" && spec.circle) {
    const c = spec.circle,
      o = scene.circles[0];
    if (!o || !Number.isFinite(o.radius) || o.radius <= 0)
      missingData.push("Đường tròn thiếu tâm hoặc bán kính dương.");
    else {
      const on = (name: string) => {
        const p = need(name, "Điểm trên đường tròn");
        if (p)
          check(
            `${name} phải thuộc đường tròn ${o.name}`,
            (dist(p, o.center) - o.radius) / scale,
          );
      };
      if (c.radiusPoint || shape.showRadius) on(c.radiusPoint || "A");
      if (c.diameterPoints) {
        c.diameterPoints.forEach(on);
        const a = need(c.diameterPoints[0], "Đường kính"),
          b = need(c.diameterPoints[1], "Đường kính");
        if (a && b)
          check(
            "Đường kính phải đi qua tâm",
            dist(midpoint(a, b), o.center) / scale,
          );
      }
      if (c.chordPoints || shape.showChord)
        (c.chordPoints || ["C", "D"]).forEach(on);
      if (c.presetType === "two-tangents") {
        const p = need(c.externalPoint || "P", "Hai tiếp tuyến");
        if (p)
          check(
            "Điểm ngoài phải nằm ngoài đường tròn",
            Math.max(0, (o.radius + 1 - dist(p, o.center)) / scale),
          );
        const [a, b] = c.twoTangentPoints || ["A", "B"];
        [a, b].forEach(on);
        for (const v of [a, b])
          angle({
            vertex: v,
            ray1: c.center,
            ray2: c.externalPoint || "P",
            type: "right",
          });
        equal(
          [c.externalPoint || "P", a],
          [c.externalPoint || "P", b],
          "Hai đoạn tiếp tuyến phải bằng nhau",
        );
      } else if (shape.showTangent) on(c.tangentPoint || "A");
      if (shape.showSecant) {
        (c.secantPoints || ["C", "D"]).forEach(on);
        const p = need(c.externalPoint || "P", "Cát tuyến từ điểm ngoài");
        if (p)
          check(
            "Gốc cát tuyến phải nằm ngoài đường tròn",
            Math.max(0, (o.radius + 1 - dist(p, o.center)) / scale),
          );
      }
      if (shape.showInscribedAngle) ["A", "B", "P"].forEach(on);
    }
    if (
      ![
        "basic",
        "diameter-chord",
        "tangent-point",
        "two-tangents",
        "secant",
        "inscribed-angle",
      ].includes(c.presetType)
    )
      unsupportedConditions.push(
        `Chưa kiểm định đầy đủ cấu hình đường tròn ${c.presetType}.`,
      );
    if (
      c.radiusValue !== undefined &&
      (!Number.isFinite(Number(c.radiusValue)) || Number(c.radiusValue) <= 0)
    )
      unsupportedConditions.push(
        "Bán kính dạng biểu thức/đơn vị chưa được xử lý đầy đủ.",
      );
    if (c.twoCirclesRelativePos || shape.showSecondCircle)
      unsupportedConditions.push(
        "Chưa kiểm định đầy đủ vị trí tương đối và tiếp tuyến chung của hai đường tròn.",
      );
  }
  if (spec.shapeCategory === "angle" && spec.angle) {
    if (spec.angle.hasBisector && !shape.showBisector)
      missingData.push("Thiếu tia phân giác đã yêu cầu.");

    if (spec.angle.degrees !== undefined)
      angle({
        vertex: spec.angle.vertex,
        ray1: spec.angle.ray1,
        ray2: spec.angle.ray2,
        degrees: spec.angle.degrees,
      });
    if (spec.angle.type === "supplementary")
      unsupportedConditions.push(
        "Chưa kiểm định đầy đủ cách biểu diễn hai góc kề bù của engine hiện tại.",
      );
    if (spec.angle.type === "supplementary" && base.length >= 4) {
      check(
        "Hai tia ngoài của hai góc kề bù phải đối nhau",
        (angleDegrees(base[0], base[1], base[2]) - 180) / 180,
      );
    }
    if (spec.angle.type === "vertical-angles" && base.length >= 5) {
      check(
        "Cặp tia thứ nhất của hai góc đối đỉnh phải đối nhau",
        (angleDegrees(base[0], base[1], base[2]) - 180) / 180,
      );
      check(
        "Cặp tia thứ hai của hai góc đối đỉnh phải đối nhau",
        (angleDegrees(base[0], base[3], base[4]) - 180) / 180,
      );
    }
    if (
      spec.angle.type === "parallel-transversal" ||
      spec.angle.parallelCutConfig
    )
      unsupportedConditions.push(
        "Chưa kiểm định đầy đủ cấu hình góc của hai đường song song và cát tuyến.",
      );
  }
  if (spec.shapeCategory === "line-ray" && spec.lineRay) {
    const l = spec.lineRay;
    if (base.length < 2 || dist(base[0], base[1]) < 1e-8)
      missingData.push("Đường thẳng/tia cần hai điểm phân biệt.");
    if (
      (l.isParallel && shape.type !== "parallel") ||
      (l.isPerpendicular && shape.type !== "perpendicular")
    )
      missingData.push(
        "Loại hình chưa biểu diễn quan hệ song song/vuông góc yêu cầu.",
      );
    if (l.type === "parallel" || l.type === "perpendicular") {
      if (base.length < 3)
        missingData.push("Thiếu điểm thuộc đường thẳng thứ hai.");
      else {
        const line =
          l.type === "parallel"
            ? getParallelLineThroughPoint(base[0], base[1], base[2], 300)
            : getPerpendicularLineThroughPoint(base[0], base[1], base[2], 200);
        const u = { x: base[1].x - base[0].x, y: base[1].y - base[0].y },
          v = { x: line.end.x - line.start.x, y: line.end.y - line.start.y };
        check(
          `Hai đường phải ${l.type === "parallel" ? "song song" : "vuông góc"}`,
          l.type === "parallel"
            ? (u.x * v.y - u.y * v.x) / scale ** 2
            : (u.x * v.x + u.y * v.y) / scale ** 2,
        );
      }
    }
  }
  if (spec.shapeCategory === "polygon" && spec.polygon) {
    if (base.length !== spec.polygon.sidesCount)
      missingData.push("Số đỉnh đa giác khác số cạnh yêu cầu.");
    // The established polygon drag engine rounds to whole SVG pixels; allow at most two pixels.
    for (let i = 1; i < base.length; i++)
      check(
        "Đa giác đều phải có các cạnh bằng nhau",
        (dist(base[i], base[(i + 1) % base.length]) - dist(base[0], base[1])) /
          scale,
        2 / scale,
      );
    for (let i = 0; i < base.length; i++)
      check(
        "Đa giác đều phải có các góc bằng nhau",
        (angleDegrees(
          base[i],
          base[(i + base.length - 1) % base.length],
          base[(i + 1) % base.length],
        ) -
          ((base.length - 2) * 180) / base.length) /
          180,
        0.006,
      );
    if (spec.polygon.showCircumcircle)
      for (const p of base)
        check(
          "Các đỉnh đa giác phải thuộc đường tròn ngoại tiếp",
          (dist(p, shape.center) - shape.radius) / scale,
          1 / scale,
        );
  }
  if (spec.shapeCategory === "symmetry" && spec.symmetry) {
    if (
      spec.symmetry.type === "axial" &&
      (!shape.axisPoints ||
        dist(...(shape.axisPoints as [Point2D, Point2D])) < 1e-8)
    )
      missingData.push("Trục đối xứng suy biến.");
    const reflected = computeReflectedPoints(
      spec.symmetry.type,
      base,
      shape.axisPoints,
      shape.centerPoint,
    );
    for (let i = 0; i < reflected.length; i++) {
      const p = points[shape.reflectedNames?.[i]];
      if (p)
        check("Ảnh đối xứng phải đúng trục/tâm", dist(p, reflected[i]) / scale);
      else missingData.push("Thiếu điểm ảnh đối xứng.");
    }
  }
  return finish();
  function finish() {
    const unique = (a: string[]) => [...new Set(a)];
    const status: NonNullable<GeometryVerification["status"]> =
      contradictions.length || missingData.length
        ? "incomplete"
        : errors.length
          ? "invalid"
          : unsupportedConditions.length
            ? "unsupported"
            : "verified";
    const verification: GeometryVerification = {
      valid: status === "verified" && checkedConditions.length > 0,
      status,
      errors: unique(errors),
      warnings: unique(unsupportedConditions),
      checkedConditions: unique(checkedConditions),
      unsupportedConditions: unique(unsupportedConditions),
      contradictions: unique(contradictions),
      missingData: unique(missingData),
    };
    return {
      verification,
      score: residuals.reduce((a, r) => a + r * r, 0),
      residuals,
    };
  }
}

export const verifyGeometryScene = (
  spec: GeometrySpecification,
  doc: ChartDocument,
) => assessGeometryScene(spec, doc).verification;
