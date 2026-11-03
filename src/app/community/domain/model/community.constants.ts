/**
 * Domain constants for the Community & Reputation context.
 */
export const REVIEW_MIN_RATING = 1;
export const REVIEW_MAX_RATING = 5;

/** Number of reviews displayed per page in the community view. */
export const COMMUNITY_PAGE_SIZE = 5;

/** Error codes raised by the application layer during review creation. */
export const COMMUNITY_ERROR_CODES = {
  INVALID_RATING: 'INVALID_RATING',
  INVALID_TARGET: 'INVALID_TARGET',
  UNRESOLVED_TARGET: 'UNRESOLVED_TARGET',
  SELF_REVIEW_NOT_ALLOWED: 'SELF_REVIEW_NOT_ALLOWED',
} as const;
