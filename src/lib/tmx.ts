function normLang(code: string): string {
  return code.trim().toLowerCase().replace(/_/g, '-').split(/[-@]/)[0] ?? ''
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, '')
}

export interface TmxUnit {
  source_text: string
  target_text: string
}

/**
 * Parse TMX 1.x `<tu>` / `<tuv>` / `<seg>` pairs by language attributes.
 */
export function parseTmxUnits(xml: string, sourceLang: string, targetLang: string): TmxUnit[] {
  const wantSrc = normLang(sourceLang)
  const wantTgt = normLang(targetLang)
  const tuBlocks = xml.match(/<tu\b[^>]*>[\s\S]*?<\/tu>/gi) ?? []
  const rows: TmxUnit[] = []
  const dedupe = new Set<string>()

  for (const block of tuBlocks) {
    const tuvBlocks = block.match(/<tuv\b[^>]*>[\s\S]*?<\/tuv>/gi) ?? []
    let src = ''
    let tgt = ''
    for (const t of tuvBlocks) {
      const langM = t.match(/(?:xml:)?lang=["']([^"']+)["']/i)
      const lang = normLang(langM?.[1] ?? '')
      const segM = t.match(/<seg\b[^>]*>([\s\S]*?)<\/seg>/i)
      const raw = segM ? segM[1] : ''
      const text = decodeXmlEntities(stripTags(raw)).replace(/\s+/g, ' ').trim()
      if (!text) continue
      if (lang === wantSrc) src = text
      else if (lang === wantTgt) tgt = text
    }
    if (src && tgt) {
      const key = `${src}\u0000${tgt}`
      if (!dedupe.has(key)) {
        dedupe.add(key)
        rows.push({ source_text: src, target_text: tgt })
      }
    }
  }

  return rows
}
