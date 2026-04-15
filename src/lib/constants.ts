export const APP_NAME = "House360";
export const APP_DESCRIPTION = "Property Management SaaS for Landlords";

export const PAYMENT_STATUSES = {
  due: { label: "Due", color: "bg-yellow-100 text-yellow-800" },
  paid: { label: "Paid", color: "bg-green-100 text-green-800" },
  late: { label: "Late", color: "bg-red-100 text-red-800" },
  pending_verification: {
    label: "Pending Verification",
    color: "bg-blue-100 text-blue-800",
  },
  failed: { label: "Failed", color: "bg-gray-100 text-gray-800" },
  partial: { label: "Partial", color: "bg-orange-100 text-orange-800" },
} as const;

export const PAYMENT_METHODS = {
  bkash: { label: "bKash", color: "bg-pink-100 text-pink-800" },
  nagad: { label: "Nagad", color: "bg-orange-100 text-orange-800" },
  rocket: { label: "Rocket", color: "bg-purple-100 text-purple-800" },
  card: { label: "Card", color: "bg-blue-100 text-blue-800" },
  bank_transfer: {
    label: "Bank Transfer",
    color: "bg-cyan-100 text-cyan-800",
  },
  manual: { label: "Manual", color: "bg-gray-100 text-gray-800" },
} as const;

export const UNIT_STATUSES = {
  vacant: { label: "Vacant", color: "bg-green-100 text-green-800" },
  occupied: { label: "Occupied", color: "bg-blue-100 text-blue-800" },
  maintenance: {
    label: "Maintenance",
    color: "bg-yellow-100 text-yellow-800",
  },
} as const;

export const LEASE_STATUSES = {
  active: { label: "Active", color: "bg-green-100 text-green-800" },
  expired: { label: "Expired", color: "bg-gray-100 text-gray-800" },
  terminated: { label: "Terminated", color: "bg-red-100 text-red-800" },
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
} as const;

export const APPLICATION_STATUSES = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Approved", color: "bg-green-100 text-green-800" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800" },
} as const;

export const MAX_SCREENSHOT_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
