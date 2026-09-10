import { UserRole } from '../types/user';

/**
 * Sanitizes redirect destination to prevent redirect loops or unauthorized routing.
 */
export const getSafeRedirectDestination = (
  rawRedirect: string | null,
  userRole: UserRole | null | undefined,
): string => {
  const isAdmin = userRole === UserRole.ADMIN;
  const defaultDest = isAdmin ? '/admin/dashboard' : '/books';

  if (!rawRedirect) return defaultDest;

  let decoded = rawRedirect;
  try {
    decoded = decodeURIComponent(rawRedirect);
  } catch {
    decoded = rawRedirect;
  }

  // Prevent redirect loops back to login/register or forbidden pages
  if (
    !decoded ||
    decoded === '/' ||
    decoded.startsWith('/login') ||
    decoded.startsWith('/register') ||
    decoded.startsWith('/forbidden')
  ) {
    return defaultDest;
  }

  // Prevent non-admin users from being routed to /admin
  if (!isAdmin && decoded.startsWith('/admin')) {
    return '/books';
  }

  // Prevent admin users from being routed to patron-specific routes
  if (isAdmin && (decoded.startsWith('/my-') || decoded.startsWith('/loans'))) {
    return '/admin/dashboard';
  }

  return decoded;
};
