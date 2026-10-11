// Shared values, so the same strings are not retyped in each file
// They match the API's utils/roles.js, utils/gigCategories.js and utils/statuses.js

export const ROLES = Object.freeze({
  CLIENT: 'client',
  FREELANCER: 'freelancer',
  ADMIN: 'admin',
})

// value is what the API stores, label is what the user sees
export const CATEGORIES = [
  { value: 'tech-digital', label: 'Tech & digital' },
  { value: 'creative-design', label: 'Creative & design' },
  { value: 'writing-marketing', label: 'Writing & marketing' },
  { value: 'on-site-services', label: 'On-site services' },
  { value: 'other', label: 'Other' },
]

export const BOOKING_STATUS_LABELS = {
  confirmed: 'Confirmed',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

// A completed transaction means the payment was released to the freelancer
export const PAYMENT_STATUS_LABELS = {
  pending: 'Pending',
  completed: 'Paid',
  refunded: 'Refunded',
}

// The page each role lands on after logging in
export const HOME_BY_ROLE = {
  [ROLES.CLIENT]: '/gigs',
  [ROLES.FREELANCER]: '/my-gigs',
  [ROLES.ADMIN]: '/admin/users',
}
