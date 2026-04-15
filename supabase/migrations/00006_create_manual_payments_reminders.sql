CREATE TABLE public.manual_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL UNIQUE REFERENCES public.payments(id) ON DELETE CASCADE,
    screenshot_url TEXT NOT NULL,
    transaction_reference TEXT,
    sender_number TEXT,
    verification_status verification_status NOT NULL DEFAULT 'pending',
    verified_by UUID REFERENCES public.users(id),
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rent_cycle_id UUID NOT NULL REFERENCES public.rent_cycles(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES public.landlords(id) ON DELETE CASCADE,
    reminder_type reminder_type NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMPTZ,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_manual_payments_payment_id ON public.manual_payments(payment_id);
CREATE INDEX idx_manual_payments_verification_status ON public.manual_payments(verification_status);
CREATE INDEX idx_reminders_tenant_id ON public.reminders(tenant_id);
CREATE INDEX idx_reminders_landlord_id ON public.reminders(landlord_id);
CREATE INDEX idx_reminders_rent_cycle_id ON public.reminders(rent_cycle_id);

CREATE TRIGGER manual_payments_updated_at BEFORE UPDATE ON public.manual_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
