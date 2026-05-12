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
  if (score >= 1) return 'bg-green-950 text-green-400'
  if (score >= 0.85) return 'bg-blue-950 text-blue-400'
  if (score >= 0.6) return 'bg-yellow-950 text-yellow-400'
  return 'bg-gray-800 text-gray-400'
}