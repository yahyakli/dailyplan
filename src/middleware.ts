import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { nextUrl } = req

  const isProtectedRoute = ['/progress', '/badges', '/settings'].some((path) =>
    nextUrl.pathname.startsWith(path)
  )
  const isAuthRoute = nextUrl.pathname.startsWith('/auth')

  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/auth/signin', nextUrl))
  }

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/plan', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg).*)'],
}
