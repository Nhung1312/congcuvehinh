import type { ChartDocument } from "../../types";
import type { GeometrySpecification, GeometryVerification } from "../types";
import { verifyGeometryScene } from "./verifyGeometryScene";

export function geometryVerificationMessage(v: GeometryVerification) {
  const detail = [
    ...(v.contradictions || []),
    ...(v.errors || []),
    ...(v.missingData || []),
    ...(v.unsupportedConditions || []),
  ][0];
  return v.valid
    ? "Đã kiểm định các điều kiện hình học."
    : `${v.status === "unsupported" ? "Chưa hỗ trợ kiểm định đầy đủ" : v.status === "incomplete" ? "Thiếu dữ liệu hoặc điều kiện mâu thuẫn" : "Hình chưa thỏa giả thiết"}${detail ? ": " + detail : ""}`;
}
/** Called before either UI path applies a generated document. Never trust provider verification. */
export function assertVerifiedGeometry(
  spec: GeometrySpecification,
  doc: ChartDocument,
) {
  const v = verifyGeometryScene(spec, doc);
  spec.verification = v;
  if (!v.valid) throw new Error(geometryVerificationMessage(v));
  doc.metadata = { ...doc.metadata, aiVerification: v };
}
/** All document edits, including dragging and editing auxiliary definitions, pass through here. */
export function revalidateGeometryDocument(doc: ChartDocument): ChartDocument {
  const spec = doc.metadata?.aiGeometrySpec;
  if (!spec) return doc;
  return {
    ...doc,
    metadata: {
      ...doc.metadata,
      aiVerification: verifyGeometryScene(spec, doc),
    },
  };
}
