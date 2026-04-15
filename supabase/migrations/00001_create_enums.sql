-- User roles
CREATE TYPE user_role AS ENUM ('landlord', 'tenant');

-- Property types
CREATE TYPE property_type AS ENUM ('residential', 'commercial', 'mixed');

-- Unit status
CREATE TYPE unit_status AS ENUM ('vacant', 'occupied', 'maintenance');

-- Lease status
CREATE TYPE lease_status AS ENUM ('active', 'expired', 'terminated', 'pending');

-- Rent cycle status
CREATE TYPE rent_cycle_status AS ENUM ('due', 'paid', 'late', 'pending_verification', 'failed', 'partial');

-- Payment method
CREATE TYPE payment_method AS ENUM ('bkash', 'nagad', 'rocket', 'card', 'bank_transfer', 'manual');

-- Payment status (tracks SSLCommerz transaction states)
CREATE TYPE payment_status AS ENUM ('initiated', 'success', 'failed', 'cancelled', 'refunded');

-- Manual payment verification status
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');

-- Reminder type
CREATE TYPE reminder_type AS ENUM ('upcoming_due', 'overdue', 'payment_received', 'verification_needed');
