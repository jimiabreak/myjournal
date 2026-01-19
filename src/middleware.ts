import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/journal/new(.*)',
  '/profile(.*)',
  '/friends(.*)',
  '/feed(.*)',
]);

const isPublicApiRoute = createRouteMatcher([
  '/api/webhooks(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Skip protection for public API routes
  if (isPublicApiRoute(req)) {
    return;
  }

  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
