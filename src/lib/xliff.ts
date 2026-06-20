export type XliffUnit = { source: string; target: string }

export type ExtractResult =
  | { ok: true; units: XliffUnit[] }
  | { ok: false; error: string }

/** Demo file: segment 1 pre-translated so segment 2 shows a fuzzy TM match. */
export const DEMO_XLIFF = `<?xml version="1.0" encoding="UTF-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file source-language="en" target-language="es" datatype="plaintext">
    <body>
      <trans-unit id="1">
        <source>Welcome to our product.</source>
        <target>Bienvenido a nuestro producto.</target>
      </trans-unit>
      <trans-unit id="2">
        <source>Welcome to our website.</source>
        <target></target>
      </trans-unit>
      <trans-unit id="3">
        <source>Click here to get started.</source>
        <target></target>
      </trans-unit>
      <trans-unit id="4">
        <source>Settings</source>
        <target>Configuración</target>
      </trans-unit>
      <trans-unit id="5">
        <source>Your changes have been saved.</source>
        <target></target>
      </trans-unit>
    </body>
  </file>
</xliff>`

function extOf(name: string): string {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i + 1).toLowerCase() : ''
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function stripInlineTags(fragment: string): string {
  const noTags = fragment.replace(/<[^>]+>/g, '')
  return decodeXmlEntities(noTags).replace(/\s+/g, ' ').trim()
}

function parseUnitBlock(block: string): XliffUnit | null {
  const src = block.match(/<source\b[^>]*>([\s\S]*?)<\/source>/i)
  if (!src) return null
  const source = stripInlineTags(src[1])
  if (!source) return null
  const tgt = block.match(/<target\b[^>]*>([\s\S]*?)<\/target>/i)
  const target = tgt ? stripInlineTags(tgt[1]) : ''
  return { source, target }
}

function extractUnits(xml: string): XliffUnit[] {
  const out: XliffUnit[] = []

  const tuBlocks = xml.match(/<trans-unit\b[^>]*>[\s\S]*?<\/trans-unit>/gi) ?? []
  for (const block of tuBlocks) {
    const unit = parseUnitBlock(block)
    if (unit) out.push(unit)
  }
  if (out.length) return out

  const unitBlocks = xml.match(/<unit\b[^>]*>[\s\S]*?<\/unit>/gi) ?? []
  for (const block of unitBlocks) {
    const unit = parseUnitBlock(block)
    if (unit) out.push(unit)
  }
  return out
}

function patchTarget(block: string, text: string): string {
  const escaped = escapeXml(text)
  if (/<target\b/i.test(block)) {
    return block.replace(/<target\b[^>]*>[\s\S]*?<\/target>/i, `<target>${escaped}</target>`)
  }
  if (/<\/trans-unit>/i.test(block)) {
    return block.replace(/<\/trans-unit>/i, `<target>${escaped}</target></trans-unit>`)
  }
  return block.replace(/<\/unit>/i, `<target>${escaped}</target></unit>`)
}

export function extractXliff(buffer: Buffer, fileName: string): ExtractResult {
  const ext = extOf(fileName)
  if (ext !== 'xliff' && ext !== 'xlf') {
    return { ok: false, error: 'Only .xliff or .xlf files are supported.' }
  }

  const units = extractUnits(buffer.toString('utf8'))
  if (!units.length) return { ok: false, error: 'No <trans-unit> / <unit> sources found in this XLIFF.' }
  return { ok: true, units }
}

/** Write segment targets back into stored XLIFF, by trans-unit / unit order. */
export function applyTargetsToXliff(xml: string, targets: string[]): string {
  let i = 0
  const withTu = xml.replace(/<trans-unit\b[^>]*>[\s\S]*?<\/trans-unit>/gi, (block) => {
    if (i >= targets.length) return block
    return patchTarget(block, targets[i++])
  })
  if (i > 0) return withTu

  i = 0
  return xml.replace(/<unit\b[^>]*>[\s\S]*?<\/unit>/gi, (block) => {
    if (i >= targets.length) return block
    return patchTarget(block, targets[i++])
  })
}

/** Fallback when original XML was not stored (legacy uploads). */
export function buildXliffFromSegments(
  sources: string[],
  targets: string[],
  sourceLocale: string,
  targetLocale: string,
): string {
  const units = sources.map((src, i) => {
    const tgt = targets[i] ?? ''
    return `      <trans-unit id="${i + 1}">
        <source>${escapeXml(src)}</source>
        <target>${escapeXml(tgt)}</target>
      </trans-unit>`
  }).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file source-language="${escapeXml(sourceLocale)}" target-language="${escapeXml(targetLocale)}" datatype="plaintext">
    <body>
${units}
    </body>
  </file>
</xliff>`
}
