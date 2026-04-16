import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role as string | undefined
    const { pathname } = req.nextUrl

    // Admins always have full access (preview mode + sandbox)
    if (role === 'ADMIN') {
      return NextResponse.next()
    }

    if (role === 'INTERVIEWER') {
      // Interviewers can only access their hub, scorecard submission, and APIs
      const allowed =
        pathname.startsWith('/interviewer') ||
        pathname.startsWith('/api') ||
        /^\/applications\/[^/]+\/scorecard/.test(pathname)

      if (!allowed) {
        return NextResponse.redirect(new URL('/interviewer', req.url))
      }
    }

    if (role === 'HIRING_MANAGER') {
      // Hiring managers can't access user management or system settings
      const blocked =
        pathname.startsWith('/settings/users') ||
        pathname.startsWith('/interviewers') ||
        pathname.startsWith('/messages') ||
        pathname.startsWith('/settings/integrations') ||
        pathname.startsWith('/settings/automations')

      if (blocked) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        // Public pages don't require auth
        if (
          pathname.startsWith('/auth') ||
          pathname.startsWith('/apply') ||
          pathname.startsWith('/offers') ||
          pathname.startsWith('/api/auth') ||
          pathname.startsWith('/api/apply') ||
          pathname.startsWith('/api/offers')
        ) return true
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.svg|logos|icons).*)'],
}
