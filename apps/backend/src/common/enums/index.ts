/**
 * User roles for Role-Based Access Control (RBAC)
 */
export enum UserRole {
  ADMIN = 'admin',
  FINANCE = 'finance',
  TECHNICIAN = 'technician',
  CLIENT = 'client',
}

/**
 * Billboard status types
 */
export enum BillboardStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  IN_DEBT = 'in_debt',
  INACTIVE = 'inactive',
}

/**
 * Billboard types
 */
export enum BillboardType {
  OUTDOOR = 'outdoor',
  BILLBOARD = 'billboard',
  TOTEM = 'totem',
  DIGITAL = 'digital',
  ILLUMINATED = 'illuminated',
  OTHER = 'other',
}

/**
 * Billboard sizes
 */
export enum BillboardSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  EXTRA_LARGE = 'extra_large',
}

/**
 * Payment status
 */
export enum PaymentStatus {
  PENDING = 'pending',
  VALIDATED = 'validated',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

/**
 * Payment methods
 */
export enum PaymentMethod {
  MPESA = 'mpesa',
  EMOLA = 'emola',
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
  CARD = 'card',
}

/**
 * Notification types
 */
export enum NotificationType {
  PAYMENT = 'payment',
  DUE_DATE = 'due_date',
  APPROVAL = 'approval',
  REJECTION = 'rejection',
  ALERT = 'alert',
  SYSTEM = 'system',
  RECEIPT_ISSUED = 'receipt_issued',
  PROFORMA_INVOICE = 'proforma_invoice',
  BILLBOARD_EXPIRED = 'billboard_expired',
}

/**
 * Invoice types
 */
export enum InvoiceType {
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  PROFORMA = 'proforma',
  FINAL_INVOICE = 'final_invoice',
}

/**
 * Invoice status
 */
export enum InvoiceStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}
