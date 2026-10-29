/** Deterministic, bounded Nelder–Mead; no randomness, network calls or claims of unsatisfiability. */
export function minimizeGeometryConstraints(
  seeds: number[][],
  bounds: [number, number][],
  score: (parameters: number[]) => number,
  iterations = 240,
) {
  const clamp = (p: number[]) =>
    p.map((x, i) => Math.max(bounds[i][0], Math.min(bounds[i][1], x)));
  const evaluate = (p: number[]) => {
    const x = clamp(p),
      v = score(x);
    return { x, v: Number.isFinite(v) ? v : 1e10 };
  };
  let best = evaluate(seeds[0]);
  if (best.v < 1e-16 || !bounds.length) return best.x;
  for (const seed of seeds) {
    const n = bounds.length;
    let simplex = [
      evaluate(seed),
      ...seed.map((_, i) =>
        evaluate(
          seed.map((x, j) =>
            j === i ? x + (bounds[i][1] - bounds[i][0]) * 0.08 : x,
          ),
        ),
      ),
    ];
    for (let step = 0; step < iterations; step++) {
      simplex.sort((a, b) => a.v - b.v);
      if (simplex[0].v < best.v) best = simplex[0];
      if (best.v < 1e-16) return best.x;
      const c = Array.from(
        { length: n },
        (_, i) => simplex.slice(0, n).reduce((sum, p) => sum + p.x[i], 0) / n,
      );
      const worst = simplex[n];
      const reflect = evaluate(c.map((x, i) => 2 * x - worst.x[i]));
      if (reflect.v < simplex[0].v) {
        const expand = evaluate(c.map((x, i) => x + 2 * (reflect.x[i] - x)));
        simplex[n] = expand.v < reflect.v ? expand : reflect;
      } else if (reflect.v < simplex[n - 1].v) simplex[n] = reflect;
      else {
        const outside = reflect.v < worst.v;
        const contract = evaluate(
          c.map((x, i) => x + 0.5 * ((outside ? reflect : worst).x[i] - x)),
        );
        if (contract.v < (outside ? reflect.v : worst.v)) simplex[n] = contract;
        else
          simplex = simplex.map((p, i) =>
            i ? evaluate(p.x.map((x, j) => (x + simplex[0].x[j]) / 2)) : p,
          );
      }
    }
  }
  return best.x;
}
