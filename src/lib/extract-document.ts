import mammoth from 'mammoth'
import { extractXliffSegmentSources } from './xliff'
import { segmentTranslatableText } from './segmentation'

export type ExtractResult =
  | { ok: true; segments: string[] }
  | { ok: false; error: string }

function extOf(name: string): string {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i + 1).toLowerCase() : ''
}

export async function extractDocumentSegments(
  buffer: Buffer,
  fileName: string,
  srxXml: string | null,
): Promise<ExtractResult> {
  const ext = extOf(fileName)

  if (ext === 'xliff' || ext === 'xlf') {
    const xml = buffer.toString('utf8')
    const units = extractXliffSegmentSources(xml)
    if (!units.length) return { ok: false, error: 'No <trans-unit> / <unit> sources found in this XLIFF.' }
    return { ok: true, segments: units }
  }

  if (ext === 'txt') {
    const plain = buffer.toString('utf8')
    if (!plain.trim()) return { ok: false, error: 'File is empty.' }
    const segments = segmentTranslatableText(plain, srxXml)
    return { ok: true, segments }
  }

  if (ext === 'docx') {
    const { value, messages } = await mammoth.extractRawText({ buffer })
    if (!value?.trim()) {
      const hint = messages?.length ? ` (${messages.map(m => m.message).join('; ')})` : ''
      return { ok: false, error: `Could not read text from DOCX.${hint}` }
    }
    const segments = segmentTranslatableText(value, srxXml)
    return { ok: true, segments }
  }

  return { ok: false, error: 'Use .txt, .docx, .xliff, or .xlf' }
}
