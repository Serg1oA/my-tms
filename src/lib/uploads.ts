/** Single-file upload cap (Supabase free tier / serverless-friendly). */
export const MAX_UPLOAD_FILE_BYTES = 1000 * 1024 // 1000 KB = 1 MB

/** Hard cap on segment rows per document insert. */
export const MAX_SEGMENTS_PER_DOCUMENT = 8000

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 102.4) / 10} KB`
  return `${Math.round(bytes / (102.4 * 102.4)) / 10} MB`
}

export function fileTooLargeMessage(label: string, size: number): string {
  return `${label} is too large (${formatSize(size)}). Maximum per file is ${formatSize(MAX_UPLOAD_FILE_BYTES)}.`
}
