import createMiddleware from 'next-intl/middleware';
import {locales, defaultLocale} from './i18n/config';
import {auth} from './auth';
import {NextResponse} from 'next/server';

const i18nMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

export default auth((req) => {
  const {nextUrl} = req;
  const isLoggedIn = !!req.auth;

  // 1. Handle i18n first to get the locale-prefixed path
  const response = i18nMiddleware(req);
  if (response.status !== 200) return response;

  // 2. Perform Auth logic
  // Extract pathname without locale
  const pathname = nextUrl.pathname;
  const pathnameWithoutLocale = pathname.replace(/^\/(en|fr|ar)/, '') || '/';

  const isProtectedRoute = ['/progress', '/badges', '/settings'].some((path) =>
    pathnameWithoutLocale.startsWith(path)
  );
  const isAuthRoute = pathnameWithoutLocale.startsWith('/auth');

  // Find current locale for redirects
  const locale = pathname.match(/^\/(en|fr|ar)/)?.[1] || defaultLocale;

  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL(`/${locale}/auth/signin`, nextUrl));
  }

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL(`/${locale}/plan`, nextUrl));
  }

  return response;
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(en|fr|ar)/:path*', '/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg).*)']
};
