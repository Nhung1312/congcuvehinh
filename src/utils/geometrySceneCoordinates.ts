/** Tọa độ thực tế của các cấu trúc engine đang vẽ; không suy ra điểm từ tên H/M/N. */
import type { GeometryData, Point2D, CustomAuxPoint } from "../types";
import {
  midpoint,
  projectPointToLine,
  angleBisectorPoint,
  getTriangleCircumcircle,
  getTriangleIncircle,
  lineIntersection,
  getTwoTangentContactPoints,
  getLineCircleIntersections,
  computeReflectedPoints,
  getThalesPoints,
} from "./geometryMath";
import { resolveAuxiliaryPoints } from "./resolveAuxiliaryPoints";

export function geometrySceneCoordinates(data: GeometryData | undefined) {
  const anchors: Record<string, Point2D> = {};
  const circles: { center: Point2D; radius: number; name: string }[] = [];
  let shape: any;
  let base: Point2D[] = [];
  let names: string[] = [];
  const add = (name: string | undefined, p: Point2D | null | undefined) => {
    if (name && p) anchors[name] = p;
  };
  if (data?.subType === "triangle" && data.triangle) {
    const t = (shape = data.triangle);
    base = t.points || [];
    names = t.vertexNames;
    names.forEach((n, i) => add(n, base[i]));
    if (base.length === 3) {
      const [a, b, c] = base;
      if (t.circumscribedCircle?.enabled) {
        const circle = getTriangleCircumcircle(a, b, c);
        add(t.circumscribedCircle.centerName || "O", circle.center);
        circles.push({
          ...circle,
          name: t.circumscribedCircle.centerName || "O",
        });
      }
      if (t.inscribedCircle?.enabled) {
        const circle = getTriangleIncircle(a, b, c);
        add(t.inscribedCircle.centerName || "I", circle.center);
        circles.push({ ...circle, name: t.inscribedCircle.centerName || "I" });
      }
      const opposite = (role: string) => {
        const i = ["A", "B", "C"].indexOf(role);
        return [
          base[Math.max(0, i)],
          ...base.filter((_, j) => j !== Math.max(0, i)),
        ];
      };
      for (const item of t.altitudes || [])
        if (item.enabled) {
          const [p, u, v] = opposite(item.fromVertex);
          add(item.label || "H", projectPointToLine(p, u, v).point);
        }
      for (const item of t.medians || [])
        if (item.enabled) {
          const [, u, v] = opposite(item.fromVertex);
          add(item.label || "M", midpoint(u, v));
        }
      for (const item of t.bisectors || [])
        if (item.enabled) {
          const [p, u, v] = opposite(item.fromVertex);
          add(item.label || "D", angleBisectorPoint(p, u, v));
        }
      if (t.thales?.enabled) {
        const th = getThalesPoints(
          base as [Point2D, Point2D, Point2D],
          t.thales.ratio,
          t.thales.cutSide,
          names,
        );
        add(t.thales.pointMName || "M", th.M);
        add(t.thales.pointNName || "N", th.N);
      }
    }
  } else if (data?.subType === "quadrilateral" && data.quadrilateral) {
    const q = (shape = data.quadrilateral);
    base = q.points || [];
    names = q.vertexNames;
    names.forEach((n, i) => add(n, base[i]));
    if (base.length === 4) {
      if (q.diagonals?.showIntersection)
        add(
          q.diagonals.intersectionLabel || "O",
          lineIntersection(base[0], base[2], base[1], base[3]),
        );
      if (q.showCircumcircle) {
        const circle = getTriangleCircumcircle(base[0], base[1], base[2]);
        add(q.circumcircleCenterName || "O", circle.center);
        circles.push({ ...circle, name: q.circumcircleCenterName || "O" });
      }
    }
  } else if (data?.subType === "circle" && data.circle) {
    const c = (shape = data.circle);
    base = c.points || [];
    const o = base[0],
      a = base[1],
      r = c.radius;
    if (o && a) {
      add(c.centerName || "O", o);
      circles.push({ center: o, radius: r, name: c.centerName || "O" });
      if (c.showTangent && c.tangentType === "two-tangents") {
        const tangents = getTwoTangentContactPoints(o, r, a);
        add(c.externalPointName || "P", a);
        if (tangents.isValid) {
          add(c.tangentPointsNames?.[0] || "A", tangents.p1);
          add(c.tangentPointsNames?.[1] || "B", tangents.p2);
        }
      } else {
        add(c.radiusPointName || "A", a);
        if (c.showTangent) add(c.tangentPointName || "A", a);
      }
      if (c.showDiameter) {
        const len = Math.hypot(a.x - o.x, a.y - o.y);
        add(c.diameterPoints?.[0] || "A", a);
        if (len > 0)
          add(c.diameterPoints?.[1] || "B", {
            x: o.x - ((a.x - o.x) * r) / len,
            y: o.y - ((a.y - o.y) * r) / len,
          });
      }
      if (c.showChord) {
        const u = base[2] || {
          x: o.x + r * Math.cos((5 * Math.PI) / 6),
          y: o.y + r / 2,
        };
        const v = base[3] || {
          x: o.x + r * Math.cos(Math.PI / 6),
          y: o.y + r / 2,
        };
        add(c.chordPoints?.[0] || "C", u);
        add(c.chordPoints?.[1] || "D", v);
        if (c.showChordDistance)
          add(c.chordDistanceLabel || "H", midpoint(u, v));
      }
      if (c.showSecant && base[2]) {
        add(c.externalPointName || "P", a);
        const hits = getLineCircleIntersections(o, r, a, base[2]);
        add(c.secantPointsNames?.[0] || "C", hits[0]);
        add(c.secantPointsNames?.[1] || "D", hits[1]);
      }
      if (c.showInscribedAngle && base[2] && base[3]) {
        add("A", a);
        add("B", base[2]);
        add("P", base[3]);
      }
    }
  } else if (data?.subType === "line-ray" && data.lineRay) {
    const l = (shape = data.lineRay);
    base = l.points || [];
    names = l.pointNames;
    names.forEach((n, i) => add(n, base[i]));
    if (l.showMidpoint && base.length >= 2)
      add(l.midpointName || "M", midpoint(base[0], base[1]));
    if (l.type === "intersection" && base.length >= 4)
      add(
        l.intersectionName || "O",
        lineIntersection(base[0], base[1], base[2], base[3]),
      );
  } else if (data?.subType === "angle" && data.angle) {
    const a = (shape = data.angle);
    base = a.points || [];
    add(a.vertexName, base[0]);
    add(a.ray1Name, base[1]);
    add(a.ray2Name, base[2]);
    // Renderer draws the bisector from these actual two rays, not a third free point.
    if (a.showBisector && base.length >= 3) {
      const [o, u, v] = base,
        du = Math.hypot(u.x - o.x, u.y - o.y),
        dv = Math.hypot(v.x - o.x, v.y - o.y);
      if (du && dv)
        add(a.bisectorName?.replace(a.vertexName, "") || "z", {
          x: o.x + (u.x - o.x) / du + (v.x - o.x) / dv,
          y: o.y + (u.y - o.y) / du + (v.y - o.y) / dv,
        });
    }
  } else if (data?.subType === "polygon" && data.polygon) {
    const p = (shape = data.polygon);
    base = p.points || [];
    names = p.vertexNames || [];
    names.forEach((n, i) => add(n, base[i]));
    add(p.centerName || "O", p.center);
    if (p.showCircumcircle)
      circles.push({
        center: p.center,
        radius: p.radius,
        name: p.centerName || "O",
      });
  } else if (data?.subType === "symmetry" && data.symmetry) {
    const s = (shape = data.symmetry);
    base = s.originalPoints || [];
    names = s.originalNames || [];
    names.forEach((n, i) => add(n, base[i]));
    const reflected = computeReflectedPoints(
      s.type,
      base,
      s.axisPoints,
      s.centerPoint,
    );
    (s.reflectedNames || []).forEach((n, i) => add(n, reflected[i]));
    if (s.type === "central") add(s.centerName || "I", s.centerPoint);
  }
  const aux: CustomAuxPoint[] = [
    ...(shape?.auxPoints || []),
    ...(data?.auxPoints || []),
  ];
  return {
    anchors,
    points: resolveAuxiliaryPoints(anchors, aux, circles[0]?.radius),
    base,
    names,
    circles,
    aux,
    shape,
  };
}
