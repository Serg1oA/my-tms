function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

/** Strip inline XLIFF tags (bpt, ept, ph, g, x, bx, ex, …) leaving text nodes. */
function stripInlineTags(fragment: string): string {
  const noTags = fragment.replace(/<[^>]+>/g, '')
  return decodeXmlEntities(noTags).replace(/\s+/g, ' ').trim()
}

/**
 * One segment per XLIFF 1.2 `<trans-unit>` / XLIFF 2 `<unit>` source.
 */
export function extractXliffSegmentSources(xml: string): string[] {
  const out: string[] = []

  const tuBlocks = xml.match(/<trans-unit\b[^>]*>[\s\S]*?<\/trans-unit>/gi) ?? []
  for (const block of tuBlocks) {
    const src = block.match(/<source\b[^>]*>([\s\S]*?)<\/source>/i)
    if (!src) continue
    const text = stripInlineTags(src[1])
    if (text) out.push(text)
  }

  if (out.length) return out

  const unitBlocks = xml.match(/<unit\b[^>]*>[\s\S]*?<\/unit>/gi) ?? []
  for (const block of unitBlocks) {
    const src = block.match(/<source\b[^>]*>([\s\S]*?)<\/source>/i)
    if (!src) continue
    const text = stripInlineTags(src[1])
    if (text) out.push(text)
  }

  return out
}
