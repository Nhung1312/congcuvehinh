import { AI_GEOMETRY_PRESETS } from "../src/ai/aiPresets";
import { VietnameseGeometryParser } from "../src/ai/parser/vietnameseGeometryParser";
import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { GeometrySpecification } from "../src/ai/types";
import { GeometrySpecificationAdapter as Adapter } from "../src/ai/adapter/geometrySpecificationAdapter";
import {
  assertVerifiedGeometry,
  revalidateGeometryDocument,
} from "../src/ai/adapter/geometryVerificationState";
import { geometrySceneCoordinates } from "../src/utils/geometrySceneCoordinates";
import { resolveAuxiliaryPoints } from "../src/utils/resolveAuxiliaryPoints";
import { normalizeExplicitConstructions } from "../src/ai/parser/normalizeExplicitConstructions";
import { validateAndNormalizeSpec } from "../src/server/geminiGeometryService";
import {
  dist,
  constrainTrianglePointDrag,
  constrainQuadPointDrag,
} from "../src/utils/geometryMath";
import { angleDegrees } from "../src/ai/adapter/verifyGeometryScene";
import { CanvasArea } from "../src/components/CanvasArea";
import { generateTikzCode } from "../src/export/tikzExport";

const quad = (
  type: NonNullable<
    GeometrySpecification["quadrilateral"]
  >["type"] = "parallelogram",
  vertices: [string, string, string, string] = ["A", "B", "C", "D"],
): GeometrySpecification => ({
  title: "Fixture",
  shapeCategory: "quadrilateral",
  quadrilateral: { type, vertices },
  detectedEntities: [],
  explanation: "",
});
const triangle = (
  type: NonNullable<GeometrySpecification["triangle"]>["type"] = "general",
  vertices: [string, string, string] = ["A", "B", "C"],
): GeometrySpecification => ({
  title: "Fixture",
  shapeCategory: "triangle",
  triangle: { type, vertices },
  detectedEntities: [],
  explanation: "",
});
const verified = (s: GeometrySpecification) => {
  const d = Adapter.specToChartDocument(s);
  assert.equal(s.verification?.valid, true, JSON.stringify(s.verification));
  assert.equal(s.verification?.status, "verified");
  return d;
};
const check = (
  s: GeometrySpecification,
  d: ReturnType<typeof Adapter.specToChartDocument>,
) => Adapter.verifyGeometryScene(s, d);

test("Regression: right angle rejects the 108.434948° false positive", () => {
  const s = quad();
  s.quadrilateral.specialAngle = { vertex: "A", type: "right" };
  const d = Adapter.specToChartDocument(s);
  d.data.geometry.quadrilateral.points = [
    { x: 0, y: 0 },
    { x: 3, y: 0 },
    { x: 2, y: 3 },
    { x: -1, y: 3 },
  ];
  const v = check(s, d);
  assert.equal(v.valid, false);
  assert.match(v.errors.join(" "), /108.43/);
});
test("Regression: exact 60° rejects the 67.619865° false positive", () => {
  const s = quad();
  s.quadrilateral.specialAngle = { vertex: "A", type: "acute", degrees: 60 };
  const d = Adapter.specToChartDocument(s);
  d.data.geometry.quadrilateral.points = [
    { x: 0, y: 0 },
    { x: 240, y: 0 },
    { x: 310, y: 170 },
    { x: 70, y: 170 },
  ];
  assert.equal(check(s, d).valid, false);
  assert.match(check(s, d).errors.join(" "), /67.62/);
});
for (const vertices of [
  ["A", "B", "C", "D"],
  ["P", "Q", "R", "S"],
  ["A1", "B1", "C1", "D1"],
] as [string, string, string, string][]) {
  for (const degrees of [32, 60, 90, 118, 147])
    test(`Parametric quadrilateral: ${vertices.join(",")} ${degrees}° + sides + multistep feet`, () => {
      const s = quad("parallelogram", vertices),
        [a, b, c, d] = vertices;
      s.quadrilateral.specialAngle = {
        vertex: a,
        type: degrees < 90 ? "acute" : degrees > 90 ? "obtuse" : "right",
        degrees,
      };
      s.quadrilateral.sideComparisons = [{ shorter: a + d, longer: a + b }];
      s.auxPoints = [
        {
          name: "H",
          type: "projection",
          fromPoint: "K",
          targetLine: [a, d],
          mustBeInsideSegment: degrees <= 90,
        },
        { name: "K", type: "midpoint", segment: ["M", b] },
        { name: "M", type: "midpoint", segment: [a, b] },
      ];
      const doc = verified(s),
        p = geometrySceneCoordinates(doc.data.geometry).points;
      assert.ok(Math.abs(angleDegrees(p[a], p[b], p[d]) - degrees) < 0.001);
      assert.ok(dist(p[a], p[b]) > dist(p[a], p[d]));
      assert.ok(p.H && p.K && p.M);
    });
}
for (const type of [
  "rectangle",
  "square",
  "rhombus",
  "right-trapezoid",
  "isosceles-trapezoid",
  "trapezoid",
  "cyclic",
  "general",
] as const)
  test(`Shape invariant: ${type} accepted, distorted shape rejected`, () => {
    const s = quad(type);
    const d = verified(s);
    if (type === "general") {
      d.data.geometry.quadrilateral.points[2] = {
        ...d.data.geometry.quadrilateral.points[0],
      };
    } else d.data.geometry.quadrilateral.points[2].y += 70;
    assert.equal(check(s, d).valid, false);
  });
for (const vertex of ["A", "B", "C", "D"])
  for (const degrees of [60, 90, 120])
    test(`Angle at each quadrilateral vertex: ${vertex} ${degrees}`, () => {
      const s = quad();
      s.quadrilateral.specialAngle = {
        vertex,
        type: degrees === 90 ? "right" : degrees < 90 ? "acute" : "obtuse",
        degrees,
      };
      verified(s);
    });
test("Multistep projection outside segment is checked using actual K, not skipped", () => {
  const s = quad();
  s.auxPoints = [
    {
      name: "H",
      type: "projection",
      fromPoint: "K",
      targetLine: "AD",
      mustBeInsideSegment: true,
    },
    { name: "K", type: "ratio", segment: "AM", ratio: 3 },
    { name: "M", type: "midpoint", segment: "AB" },
  ];
  const d = Adapter.specToChartDocument(s);
  d.data.geometry.quadrilateral.points = [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 3, y: 1 },
    { x: -1, y: 1 },
  ];
  const v = check(s, d);
  assert.equal(v.valid, false);
  assert.match(v.errors.join(" "), /H.*ngoài đoạn/);
  assert.ok(v.checkedConditions.some((c) => c.includes("K")));
});
test("Solver simultaneously respects two angles, inequality and dependent projection", () => {
  const s = quad("trapezoid");
  s.angleConstraints = [
    { vertex: "A", degrees: 60 },
    { vertex: "B", degrees: 70 },
  ];
  s.quadrilateral.sideComparisons = [{ shorter: "CD", longer: "AB" }];
  s.auxPoints = [
    { name: "M", type: "midpoint", segment: "CD" },
    {
      name: "H",
      type: "projection",
      fromPoint: "M",
      targetLine: "AB",
      mustBeInsideSegment: true,
    },
  ];
  verified(s);
});
for (const type of [
  "general",
  "right",
  "isosceles",
  "equilateral",
  "right-isosceles",
  "obtuse",
] as const)
  test(`Triangle invariant and changed coordinates: ${type}`, () => {
    const s = triangle(type);
    const d = verified(s);
    d.data.geometry.triangle.points[0] = {
      ...d.data.geometry.triangle.points[1],
    };
    assert.equal(check(s, d).valid, false);
  });
for (const vertex of ["P", "Q", "R"])
  test(`Renamed triangle: right apex ${vertex}, centroid, orthocenter, circumcenter, incenter`, () => {
    const s = triangle("right", ["P", "Q", "R"]);
    s.triangle.specialVertex = vertex;
    s.auxPoints = ["centroid", "orthocenter", "circumcenter", "incenter"].map(
      (type, i) => ({ name: ["G", "H", "O", "I"][i], type: type as any }),
    );
    const d = verified(s),
      p = geometrySceneCoordinates(d.data.geometry).points;
    for (const n of ["G", "H", "O", "I"]) assert.ok(p[n]);
    const j = ["P", "Q", "R"].indexOf(vertex);
    const dragged = constrainTrianglePointDrag(
      "right",
      d.data.geometry.triangle.points,
      j,
      { x: 110, y: 130 },
      vertex,
      ["P", "Q", "R"],
    );
    const others = dragged.filter((_, i) => i !== j);
    assert.ok(
      Math.abs(angleDegrees(dragged[j], ...(others as [any, any])) - 90) <
        0.001,
    );
  });
for (const lengths of [
  { AB: 3, AC: 4, BC: 5 },
  { AB: 5, AC: 5, BC: 6 },
  { AB: "30 mm", AC: "4 cm", BC: "0.5 dm" },
])
  test(`Numeric sides use actual length ratios: ${JSON.stringify(lengths)}`, () => {
    const s = triangle();
    s.triangle.sideLengths = lengths;
    verified(s);
  });
test("Triangle numeric angles solved together", () => {
  const s = triangle();
  s.triangle.angles = { A: 30, B: 60, C: 90 };
  verified(s);
});
test("Triangle numeric angles: right type plus 30 degree B", () => {
  const s = triangle("right");
  s.triangle.angles = { B: 30 };
  verified(s);
});
for (const text of ["góc BAD bằng 60 độ", "góc DAB = 60°", "góc A bằng 60"])
  test(`Equivalent numeric-angle normalization: ${text}`, () => {
    const s = normalizeExplicitConstructions(
      quad(),
      `Cho hình bình hành ABCD, AB lớn hơn AD và ${text}.`,
    );
    assert.equal(s.angleConstraints[0].degrees, 60);
    verified(s);
  });
for (const text of ["AB > AD", "AD < AB", "AB dài hơn AD", "AD ngắn hơn AB"])
  test(`Equivalent side wording: ${text}`, () => {
    const s = normalizeExplicitConstructions(
      quad(),
      `Cho hình bình hành ABCD có ${text}, góc BAD nhọn.`,
    );
    verified(s);
  });
test("Normalizer preserves both explicit angles and membership of the correct target", () => {
  const s = normalizeExplicitConstructions(
    quad(),
    "Cho hình bình hành ABCD có góc A bằng 60 độ, góc B bằng 120 độ. M là trung điểm AB. H là hình chiếu của M trên AD. H thuộc đoạn BC.",
  );
  assert.equal(s.angleConstraints.length, 2);
  assert.equal(s.pointConstraints[0].target, "BC");
  assert.ok(!s.auxPoints.find((p) => p.name === "H").mustBeInsideSegment);
  assert.equal(
    Adapter.specToChartDocument(s).metadata.aiVerification.valid,
    false,
  );
});
test("Contradictory strict-order cycle cannot be overwritten by normalization", () => {
  const s = normalizeExplicitConstructions(
    quad(),
    "Cho hình bình hành ABCD có AB > AD và AD > AB.",
  );
  assert.equal(s.quadrilateral.sideComparisons.length, 2);
  const d = Adapter.specToChartDocument(s);
  assert.equal(s.verification.status, "incomplete");
  assert.ok(s.verification.contradictions.length);
  assert.throws(() => assertVerifiedGeometry(s, d));
});
for (const setup of [
  (s: GeometrySpecification) => {
    s.triangle.angles = { A: 90, B: 60, C: 60 };
  },
  (s: GeometrySpecification) => {
    s.triangle.sideLengths = { AB: 1, AC: 2, BC: 4 };
  },
])
  test("Provably contradictory triangle data gets incomplete/contradiction status", () => {
    const s = triangle();
    setup(s);
    Adapter.specToChartDocument(s);
    assert.equal(s.verification.valid, false);
    assert.equal(s.verification.status, "incomplete");
    assert.ok(s.verification.contradictions.length);
  });
test("Rectangle 60 degree hypothesis is explicitly contradictory", () => {
  const s = quad("rectangle");
  s.angleConstraints = [{ vertex: "A", degrees: 60 }];
  Adapter.specToChartDocument(s);
  assert.ok(s.verification.contradictions.length);
});
test("Conflicting two measurements of the same angle are retained", () => {
  const s = quad();
  s.angleConstraints = [
    { vertex: "A", degrees: 60 },
    { vertex: "A", degrees: 75 },
  ];
  Adapter.specToChartDocument(s);
  assert.ok(s.verification.contradictions.length);
});
for (const input of [
  {
    title: "Missing shape",
    shapeCategory: "triangle",
    detectedEntities: [],
    explanation: "",
  },
  {
    title: "Missing point",
    shapeCategory: "triangle",
    triangle: { type: "general", vertices: ["A", "B", "C"] },
    auxPoints: [
      { name: "H", type: "projection", fromPoint: "Z", targetLine: "BC" },
    ],
    detectedEntities: [],
    explanation: "",
  },
])
  test(`Missing-data fixture: ${input.title}`, () => {
    const s = structuredClone(input) as GeometrySpecification;
    const d = Adapter.specToChartDocument(s);
    assert.equal(s.verification.status, "incomplete");
    assert.equal(s.verification.valid, false);
    assert.throws(() => assertVerifiedGeometry(s, d));
  });
test("Missing Gemini vertices cannot become verified by server display defaults", () => {
  const s = {
    title: "bad JSON",
    shapeCategory: "triangle",
    triangle: { type: "general" },
    detectedEntities: [],
    explanation: "",
  } as GeometrySpecification;
  validateAndNormalizeSpec(s, "Vẽ hình.");
  Adapter.specToChartDocument(s);
  assert.equal(s.verification.valid, false);
  assert.ok(s.verification.missingData.length);
});
test("Unknown construction cannot pass simply because errors is empty", () => {
  const s = triangle();
  s.auxPoints = [{ name: "X", type: "unsupported-locus" as any }];
  Adapter.specToChartDocument(s);
  assert.equal(s.verification.valid, false);
  assert.ok(s.verification.unsupportedConditions.length);
});
test("Unhandled textual conditions get unsupported status and block application", () => {
  const s = triangle();
  s.unhandledConditions = ["Điều kiện quỹ tích chưa biểu diễn."];
  const d = Adapter.specToChartDocument(s);
  assert.equal(s.verification.status, "unsupported");
  assert.equal(s.verification.errors.length, 0);
  assert.throws(() => assertVerifiedGeometry(s, d), /Chưa hỗ trợ/);
});
test("Cyclic auxiliary dependencies cannot use stale default coordinates", () => {
  const p = resolveAuxiliaryPoints(
    { A: { x: 0, y: 0 }, B: { x: 2, y: 0 }, M: { x: 1, y: 0 } },
    [
      { id: "m", name: "M", type: "midpoint", segment: "AN" },
      { id: "n", name: "N", type: "midpoint", segment: "BM" },
    ],
  );
  assert.ok(!p.M && !p.N);
});
test("Degenerate projection target is unresolved, never a fake valid foot", () => {
  const p = resolveAuxiliaryPoints(
    { A: { x: 0, y: 0 }, B: { x: 0, y: 0 }, C: { x: 1, y: 2 } },
    [
      {
        id: "h",
        name: "H",
        type: "projection",
        fromPoint: "C",
        targetLine: "AB",
      },
    ],
  );
  assert.equal(p.H, undefined);
});
for (const kind of ["segment", "ray", "line"] as const)
  test(`Membership distinguishes ${kind}`, () => {
    const s = triangle();
    s.auxPoints = [{ name: "X", type: "ratio", segment: "AB", ratio: -0.5 }];
    s.pointConstraints = [{ point: "X", target: "AB", kind }];
    const d = Adapter.specToChartDocument(s);
    assert.equal(check(s, d).valid, kind === "line");
  });
test("Both application paths reject forged Gemini success and keep current settings untouched", () => {
  const settings = Adapter.specToChartDocument(quad()).settings,
    original = structuredClone(settings);
  const s = quad();
  s.unhandledConditions = ["unhandled"];
  s.verification = { valid: true };
  const d = Adapter.specToChartDocument(s, settings);
  s.verification = { valid: true };
  assert.throws(() => assertVerifiedGeometry(s, d));
  assert.deepEqual(settings, original);
});
test("Drag invalidates stored verification and recomputes multistep feet without re-solving roots", () => {
  const s = quad();
  s.quadrilateral.specialAngle = { vertex: "A", type: "acute", degrees: 60 };
  s.auxPoints = [
    {
      name: "H",
      type: "projection",
      fromPoint: "K",
      targetLine: "AD",
      mustBeInsideSegment: true,
    },
    { name: "K", type: "midpoint", segment: "AM" },
    { name: "M", type: "midpoint", segment: "AB" },
  ];
  const d = verified(s),
    before = geometrySceneCoordinates(d.data.geometry).points;
  const moved = structuredClone(d);
  moved.data.geometry.quadrilateral.points = constrainQuadPointDrag(
    "parallelogram",
    moved.data.geometry.quadrilateral.points,
    3,
    { x: 100, y: 340 },
  );
  const updated = revalidateGeometryDocument(moved),
    after = geometrySceneCoordinates(updated.data.geometry).points;
  assert.equal(updated.metadata.aiVerification.valid, false);
  assert.notDeepEqual(after.H, before.H);
  assert.deepEqual(updated.data.geometry, moved.data.geometry);
  const saved = JSON.parse(JSON.stringify(updated));
  assert.equal(
    revalidateGeometryDocument(saved).metadata.aiVerification.valid,
    false,
  );
});
test("Revalidation recovers after undoing an invalid drag", () => {
  const s = quad("rectangle");
  s.quadrilateral.sideComparisons = [{ shorter: "AD", longer: "AB" }];
  const d = verified(s),
    bad = structuredClone(d);
  bad.data.geometry.quadrilateral.points[1].y += 70;
  assert.equal(
    revalidateGeometryDocument(bad).metadata.aiVerification.valid,
    false,
  );
  assert.equal(
    revalidateGeometryDocument(d).metadata.aiVerification.valid,
    true,
  );
});
for (const presetType of [
  "basic",
  "diameter-chord",
  "tangent-point",
  "two-tangents",
  "secant",
  "inscribed-angle",
] as const)
  test(`Circle invariant and renamed entities: ${presetType}`, () => {
    const s: GeometrySpecification = {
      title: "Circle",
      shapeCategory: "circle",
      circle: {
        presetType,
        center: "K",
        radiusPoint: ["two-tangents", "secant"].includes(presetType)
          ? undefined
          : "U",
        externalPoint: "T",
        twoTangentPoints: ["V", "W"],
        chordPoints: presetType === "diameter-chord" ? ["L", "N"] : undefined,
      },
      detectedEntities: [],
      explanation: "",
    };
    const d = verified(s);
    d.data.geometry.circle.radius = 1000;
    assert.equal(check(s, d).valid, false);
  });
test("New AI SVG and TikZ use the resolved multistep coordinates", () => {
  const s = quad();
  s.auxPoints = [
    { name: "M", type: "midpoint", segment: "AB" },
    { name: "N", type: "midpoint", segment: "MD" },
    { name: "H", type: "projection", fromPoint: "N", targetLine: "AD" },
  ];
  s.auxLines = [{ from: "N", to: "H" }];
  const d = verified(s),
    p = geometrySceneCoordinates(d.data.geometry).points;
  const svg = renderToStaticMarkup(
    React.createElement(CanvasArea, { currentDoc: d, onCopyImage: () => {} }),
  );
  assert.ok(svg.includes(`cx="${p.H.x}"`));
  assert.ok(!/NaN|Infinity/.test(svg));
  const code = generateTikzCode(d);
  assert.ok(code.includes(String(Number((p.H.x * 0.035).toFixed(5)))));
  assert.ok(code.includes("{$H$}"));
});
for (const sidesCount of [3, 4, 5, 6, 8])
  test(`Regular polygon ${sidesCount}: equilateral alone is insufficient`, () => {
    const s: GeometrySpecification = {
      title: "Polygon",
      shapeCategory: "polygon",
      polygon: { type: "custom", sidesCount },
      detectedEntities: [],
      explanation: "",
    };
    const d = verified(s);
    d.data.geometry.polygon.points[1].x += 25;
    assert.equal(check(s, d).valid, false);
  });
for (const type of ["central", "axial"] as const)
  test(`Symmetry ${type}: changed transformation cannot retain verification`, () => {
    const s: GeometrySpecification = {
      title: "Symmetry",
      shapeCategory: "symmetry",
      symmetry: { type, targetShape: "triangle" },
      detectedEntities: [],
      explanation: "",
    };
    const d = verified(s);
    d.data.geometry.symmetry.type = type === "central" ? "axial" : "central";
    assert.equal(check(s, d).valid, false);
  });
test("Equilateral triangle cannot satisfy a strict side inequality", () => {
  const s = triangle("equilateral");
  s.triangle.sideComparisons = [{ shorter: "AB", longer: "AC" }];
  Adapter.specToChartDocument(s);
  assert.equal(s.verification.status, "incomplete");
  assert.ok(s.verification.contradictions.length);
});
test("Declared equality plus strict inequality is provably contradictory", () => {
  const s = quad("general");
  s.equalSegments = [{ segments: ["AB", "AD"] }];
  s.quadrilateral.sideComparisons = [{ shorter: "AB", longer: "AD" }];
  Adapter.specToChartDocument(s);
  assert.equal(s.verification.status, "incomplete");
  assert.ok(s.verification.contradictions.length);
});
test("Distorted on-circle auxiliary point cannot retain verification after editing its construction", () => {
  const s: GeometrySpecification = {
    title: "Circle",
    shapeCategory: "circle",
    circle: { presetType: "basic", center: "O" },
    auxPoints: [{ name: "M", type: "on-circle", centerPoint: "O", angle: 40 }],
    detectedEntities: [],
    explanation: "",
  };
  const d = verified(s);
  d.data.geometry.circle.auxPoints[0].radius = 160;
  assert.equal(check(s, d).valid, false);
});
test("Numeric root-angle normalization does not interpret BAC as a length AC", () => {
  const s = normalizeExplicitConstructions(
    triangle(),
    "Cho tam giác ABC có góc BAC = 60 độ.",
  );
  assert.equal(Object.keys(s.triangle.sideLengths || {}).length, 0);
  verified(s);
});

for (const preset of AI_GEOMETRY_PRESETS)
  test(`Existing AI preset remains honest: ${preset.id}`, () => {
    const s = VietnameseGeometryParser.parse(preset.prompt);
    Adapter.specToChartDocument(s);
    if (preset.id === "preset-10") {
      assert.equal(s.verification.status, "unsupported");
      assert.equal(s.verification.valid, false);
    } else
      assert.equal(s.verification.valid, true, JSON.stringify(s.verification));
  });
for (const factor of [0.15, 1, 7])
  for (const rotation of [0, 0.7, 2.4])
    test(`Coordinate invariance under similarity: scale ${factor}, rotation ${rotation}`, () => {
      const s = quad();
      s.quadrilateral.specialAngle = {
        vertex: "B",
        type: "obtuse",
        degrees: 120,
      };
      s.auxPoints = [
        { name: "M", type: "midpoint", segment: "AB" },
        { name: "N", type: "midpoint", segment: "MC" },
        { name: "H", type: "projection", fromPoint: "N", targetLine: "AD" },
      ];
      const d = verified(s);
      d.data.geometry.quadrilateral.points =
        d.data.geometry.quadrilateral.points.map((p) => ({
          x:
            987 +
            factor * (p.x * Math.cos(rotation) - p.y * Math.sin(rotation)),
          y:
            -123 +
            factor * (p.x * Math.sin(rotation) + p.y * Math.cos(rotation)),
        })) as any;
      assert.equal(check(s, d).valid, true, JSON.stringify(check(s, d)));
    });
test("Renaming by permuting A/B/C preserves actual altitude roles in SVG", () => {
  const s = triangle("general", ["B", "A", "C"]);
  s.altitudes = [{ from: "B", toLine: "AC", foot: "H" }];
  const d = verified(s);
  const p = geometrySceneCoordinates(d.data.geometry).points;
  const svg = renderToStaticMarkup(
    React.createElement(CanvasArea, { currentDoc: d, onCopyImage: () => {} }),
  );
  assert.ok(svg.includes(`cx="${p.H.x}"`));
  assert.ok(svg.includes(`cy="${p.H.y}"`));
});
