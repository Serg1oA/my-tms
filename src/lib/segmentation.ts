import { parseSrxBreakYesRegexes } from './srx'

/** Normalize line breaks to \n */
export function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

/**
 * Split on blank lines, then split each block after sentence-ending punctuation
 * (. ! ? : ;) before whitespace or end of string.
 */
export function segmentPlainTextByPunctuation(text: string): string[] {
  const normalized = normalizeNewlines(text)
  const chunks: string[] = []
  for (const para of normalized.split(/\n+/)) {
    const p = para.trim()
    if (!p) continue
    const sub = p.split(/(?<=[.!?;:])(?=\s|$)/)
    for (const s of sub) {
      const t = s.trim()
      if (t) chunks.push(t)
    }
  }
  return chunks
}

/** Split `text` after each match end for any of the regexes (SRX afterbreak semantics). */
export function splitAfterRegexMatches(text: string, regexes: RegExp[]): string[] {
  if (!regexes.length) return [text]
  const end = text.length
  const points = new Set<number>([0, end])
  const maxSteps = Math.max(end * 4, 500_000)
  let steps = 0

  for (const re of regexes) {
    const flags = re.flags.includes('g') ? re.flags : `${re.flags}g`
    const r = new RegExp(re.source, flags)
    let m: RegExpExecArray | null
    while ((m = r.exec(text)) !== null) {
      if (++steps > maxSteps) break
      const pos = m.index + m[0].length
      if (pos >= 0 && pos <= end) points.add(pos)
      if (m[0].length === 0) {
        r.lastIndex += 1
        if (r.lastIndex > end) break
      }
    }
  }

  const sorted = [...points].sort((a, b) => a - b)
  const parts: string[] = []
  for (let i = 0; i < sorted.length - 1; i++) {
    const slice = text.slice(sorted[i], sorted[i + 1]).trim()
    if (slice) parts.push(slice)
  }
  return parts.length ? parts : [text.trim()].filter(Boolean)
}

/**
 * Default punctuation / newline segmentation, optionally refined by SRX `break="yes"` rules.
 */
export function segmentTranslatableText(plain: string, srxXml?: string | null): string[] {
  const base = segmentPlainTextByPunctuation(plain)
  if (!srxXml?.trim()) return base

  const patterns = parseSrxBreakYesRegexes(srxXml)
  if (!patterns.length) return base

  const refined: string[] = []
  for (const seg of base) {
    const sub = splitAfterRegexMatches(seg, patterns)
    if (sub.length <= 1) refined.push(seg)
    else refined.push(...sub.map(s => s.trim()).filter(Boolean))
  }
  return refined.map(s => s.trim()).filter(Boolean)
}
