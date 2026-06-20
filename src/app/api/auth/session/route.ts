import { cookies } from 'next/headers'
import { adminAuth } from '@/lib/firebase/admin'
import { SESSION_COOKIE } from '@/lib/firebase/auth'

const MAX_AGE_MS = 60 * 60 * 24 * 5 * 1000 // 5 days

export async function POST(req: Request) {
  const { idToken } = await req.json()
  if (!idToken) return Response.json({ error: 'Missing token' }, { status: 400 })

  const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: MAX_AGE_MS })
  const jar = await cookies()
  jar.set(SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE_MS / 1000,
    path: '/',
    sameSite: 'lax',
  })
  return Response.json({ ok: true })
}

export async function DELETE() {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
  return Response.json({ ok: true })
}
