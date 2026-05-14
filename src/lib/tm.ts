// Levenshtein-based similarity score between 0 and 1
export function similarity(a: string, b: string): number {
  const al = a.toLowerCase()
  const bl = b.toLowerCase()
  const m = al.length, n = bl.length
  if (m === 0 || n === 0) return 0

  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = al[i - 1] === bl[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }

  return 1 - dp[m][n] / Math.max(m, n)
}

export function scoreLabel(score: number): string {
  if (score >= 1) return 'Exact'
  if (score >= 0.85) return 'High'
  if (score >= 0.6) return 'Fuzzy'
  return 'Low'
}

export function scoreBadgeClass(score: number): string {
  if (score >= 1) return 'bg-emerald-100/95 text-emerald-900 border-emerald-200/60'
  if (score >= 0.85) return 'bg-sky-100/95 text-sky-900 border-sky-200/60'
  if (score >= 0.6) return 'bg-amber-100/95 text-amber-900 border-amber-200/60'
  return 'bg-slate-200/90 text-slate-700 border-slate-300/50'
}