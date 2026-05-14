import { XMLParser } from 'fast-xml-parser'

function extractTextNode(v: unknown): string {
  if (v === undefined || v === null) return ''
  if (typeof v === 'string' || typeof v === 'number') return String(v)
  if (Array.isArray(v)) return v.map(extractTextNode).join('')
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>
    if (typeof o['#text'] === 'string' || typeof o['#text'] === 'number')
      return String(o['#text'])
    return Object.values(o).map(extractTextNode).join('')
  }
  return ''
}

function isBreakYes(o: Record<string, unknown>): boolean {
  const b = o['@_break'] ?? o['@_Break']
  return String(b ?? '').toLowerCase() === 'yes'
}

function walk(node: unknown, visit: (o: Record<string, unknown>) => void): void {
  if (node === null || node === undefined) return
  if (Array.isArray(node)) {
    for (const x of node) walk(x, visit)
    return
  }
  if (typeof node !== 'object') return
  const o = node as Record<string, unknown>
  visit(o)
  for (const v of Object.values(o)) walk(v, visit)
}

/**
 * Reads SRX (Segmentation Rules eXchange) and compiles `break="yes"` / `<afterbreak>` patterns.
 * Supports common SRX 1.x / 2.x shapes produced by CAT tools.
 */
export function parseSrxBreakYesRegexes(xml: string): RegExp[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: true,
    processEntities: true,
    trimValues: false,
  })
  let doc: unknown
  try {
    doc = parser.parse(xml)
  } catch {
    return []
  }

  const patternStrings: string[] = []
  walk(doc, (o) => {
    if (!isBreakYes(o)) return
    const ab = o.afterbreak ?? o.afterBreak
    const raw = extractTextNode(ab).trim()
    if (raw) patternStrings.push(raw)
  })

  const out: RegExp[] = []
  for (const p of patternStrings) {
    try {
      out.push(new RegExp(p, 'gu'))
    } catch {
      try {
        out.push(new RegExp(p, 'g'))
      } catch {
        /* skip invalid SRX fragment */
      }
    }
  }
  return out
}
