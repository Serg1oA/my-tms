import { cookies } from 'next/headers'
import { adminAuth } from './admin'

export const SESSION_COOKIE = '__session'

export type SessionUser = { id: string; email: string | undefined }

export async function getUser(): Promise<SessionUser | null> {
  const session = (await cookies()).get(SESSION_COOKIE)?.value
  if (!session) return null
  try {
    const decoded = await adminAuth.verifySessionCookie(session, true)
    return { id: decoded.uid, email: decoded.email }
  } catch {
    return null
  }
}
