/**
 * Turns an axios error into a message a person can act on.
 * Understands the backend's error shapes:
 *   { message }                      -> ConflictException, IllegalState, NotFound...
 *   { details: { field: "reason" } } -> bean validation failures
 */
export const getErrorMessage = (err, fallback = 'Something went wrong. Please try again.') => {
  if (!err) return fallback;

  const res = err.response;
  if (!res) {
    return err.code === 'ERR_NETWORK' || err.message === 'Network Error'
      ? 'Cannot reach the server. Check that the backend is running.'
      : fallback;
  }

  const data = res.data;
  if (typeof data === 'string' && data.trim()) return data;

  if (data?.details && typeof data.details === 'object') {
    const parts = Object.entries(data.details).map(([field, msg]) => `${field}: ${msg}`);
    if (parts.length) return parts.join('; ');
  }
  if (data?.message) return data.message;

  switch (res.status) {
    case 400:
      return 'The server rejected the request. Check the values you entered.';
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return 'You do not have permission to do that.';
    case 404:
      return 'That item no longer exists.';
    default:
      return fallback;
  }
};
