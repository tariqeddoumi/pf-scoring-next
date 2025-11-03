// lib/scoring.ts
export type GradeBucket = { min: number; max: number; grade: string; pd: number };

export function computeTotal(
  domains: Array<{
    id: number;
    code: string;
    weight: number;
    criteria: Array<{
      id: number;
      weight: number;
      input_type: string;
      s: number | null;
    }>;
  }>
) {
  const domainScores: Record<string, number> = {};
  let total = 0;

  for (const d of domains) {
    let sumCrit = 0;
    for (const c of d.criteria) {
      const s = typeof c.s === 'number' ? c.s : 0;
      sumCrit += c.weight * s;
    }
    const dScore = d.weight * sumCrit;
    domainScores[d.code] = round4(dScore);
    total += dScore;
  }
  return { total: clamp01(total), domainScores };
}

export function resolveGrade(total: number, buckets: GradeBucket[]) {
  const t = clamp01(total);
  const found =
    buckets.find(b => t >= b.min && t < b.max) ||
    buckets.find(b => t === b.max) ||
    buckets[buckets.length - 1];
  return found || { grade: 'N/A', pd: 0.05, min: 0, max: 1 };
}

export function round4(n: number) {
  return Math.round(n * 10000) / 10000;
}
export function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}
