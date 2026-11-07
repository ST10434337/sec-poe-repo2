// Shared values, so the same strings are not retyped in each file
// They match the API's utils/roles.js, utils/gigCategories.js and utils/statuses.js

export const ROLES = Object.freeze({
  CLIENT: 'client',
  FREELANCER: 'freelancer',
  ADMIN: 'admin',
})

export const ROLE_LABELS = {
  [ROLES.CLIENT]: 'Client',
  [ROLES.FREELANCER]: 'Freelancer',
  [ROLES.ADMIN]: 'Admin',
}

// value is what the API stores, label is what the user sees
export const CATEGORIES = [
  { value: 'tech-digital', label: 'Tech & digital' },
  { value: 'creative-design', label: 'Creative & design' },
  { value: 'writing-marketing', label: 'Writing & marketing' },
  { value: 'on-site-services', label: 'On-site services' },
  { value: 'other', label: 'Other' },
]

// "tech-digital" -> "Tech & digital"; an unknown value is shown as it is
export const categoryLabel = (value) => CATEGORIES.find((c) => c.value === value)?.label ?? value

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
  [ROLES.FREELANCER]: '/dashboard',
  [ROLES.ADMIN]: '/admin/users',
}
