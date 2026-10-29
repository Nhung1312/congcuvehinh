import type { ChartDocument, Point2D } from "../../types";
import type { GeometrySpecification } from "../types";
import { assessGeometryScene } from "./verifyGeometryScene";
import { getConstrainedQuadPoints } from "../../utils/geometryMath";
import { minimizeGeometryConstraints } from "../../utils/minimizeGeometryConstraints";

/** Refine only new AI documents. Dragging never calls this solver or resets user coordinates. */
export function solveGeometryCoordinates(
  spec: GeometrySpecification,
  doc: ChartDocument,
) {
  const initial = assessGeometryScene(spec, doc);
  if (initial.verification.valid || initial.verification.contradictions?.length)
    return;
  const q = doc.data.geometry?.quadrilateral;
  if (spec.shapeCategory === "quadrilateral" && q && spec.quadrilateral) {
    q.points = getConstrainedQuadPoints(q.type, {
      vertices: spec.quadrilateral.vertices,
      specialAngle: spec.quadrilateral.specialAngle,
      sideComparisons: spec.quadrilateral.sideComparisons,
      score: (points) =>
        assessGeometryScene(spec, {
          ...doc,
          data: {
            ...doc.data,
            geometry: { ...doc.data.geometry, quadrilateral: { ...q, points } },
          },
        }).score,
    });
  }
  const t = doc.data.geometry?.triangle;
  if (
    spec.shapeCategory !== "triangle" ||
    !spec.triangle ||
    !t ||
    initial.verification.unsupportedConditions?.length
  )
    return;
  const apex = Math.max(
    0,
    t.vertexNames.indexOf(spec.triangle.specialVertex || t.vertexNames[0]),
  );
  const others = [0, 1, 2].filter((i) => i !== apex);
  let seed: number[],
    bounds: [number, number][],
    construct: (p: number[]) => Point2D[];
  if (t.type === "equilateral" || t.type === "right-isosceles") return;
  if (t.type === "right") {
    seed = [0.7];
    bounds = [[0.08, 10]];
    construct = (p) => {
      const pts: Point2D[] = [];
      pts[apex] = { x: 0, y: 0 };
      pts[others[0]] = { x: 1, y: 0 };
      pts[others[1]] = { x: 0, y: p[0] };
      return pts;
    };
  } else if (t.type === "isosceles") {
    seed = [0.9];
    bounds = [[0.06, 8]];
    construct = (p) => {
      const pts: Point2D[] = [];
      pts[apex] = { x: 0.5, y: p[0] };
      pts[others[0]] = { x: 0, y: 0 };
      pts[others[1]] = { x: 1, y: 0 };
      return pts;
    };
  } else {
    seed = [0.35, 0.8];
    bounds = [
      [-6, 7],
      [0.04, 8],
    ];
    construct = (p) => [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: p[0], y: p[1] },
    ];
  }
  const fit = (p: Point2D[]) => {
    const minX = Math.min(...p.map((p) => p.x)),
      maxX = Math.max(...p.map((p) => p.x)),
      minY = Math.min(...p.map((p) => p.y)),
      maxY = Math.max(...p.map((p) => p.y));
    const k = Math.min(320 / (maxX - minX), 230 / (maxY - minY));
    return p.map((p) => ({
      x: 280 + (p.x - (minX + maxX) / 2) * k,
      y: 225 + (p.y - (minY + maxY) / 2) * k,
    })) as [Point2D, Point2D, Point2D];
  };
  const evaluate = (points: [Point2D, Point2D, Point2D]) =>
    assessGeometryScene(spec, {
      ...doc,
      data: {
        ...doc.data,
        geometry: { ...doc.data.geometry, triangle: { ...t, points } },
      },
    }).score;
  const seeds = [
    seed,
    ...[0.25, 0.6, 1.4, 3].map((r, i) =>
      seed.length === 1 ? [r] : [[-0.5, 0.2, 0.6, 1.4][i], r],
    ),
  ];
  const candidate = fit(
    construct(
      minimizeGeometryConstraints(
        seeds,
        bounds,
        (p) => evaluate(fit(construct(p))),
        350,
      ),
    ),
  );
  if (evaluate(candidate) < initial.score) t.points = candidate;
}
