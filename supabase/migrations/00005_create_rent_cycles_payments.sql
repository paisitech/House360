-- One row per tenant per month
CREATE TABLE public.rent_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id UUID NOT NULL REFERENCES public.leases(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES public.landlords(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    due_date DATE NOT NULL,
    amount_due NUMERIC(12,2) NOT NULL,
    amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
    status rent_cycle_status NOT NULL DEFAULT 'due',
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(lease_id, period_start)
);

-- Individual payment transactions (SSLCommerz or manual)
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rent_cycle_id UUID NOT NULL REFERENCES public.rent_cycles(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES public.landlords(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    payment_method payment_method NOT NULL,
    status payment_status NOT NULL DEFAULT 'initiated',
    tran_id TEXT UNIQUE,
    val_id TEXT,
    bank_tran_id TEXT,
    card_type TEXT,
    card_brand TEXT,
    gateway_response JSONB,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rent_cycles_lease_id ON public.rent_cycles(lease_id);
CREATE INDEX idx_rent_cycles_tenant_id ON public.rent_cycles(tenant_id);
CREATE INDEX idx_rent_cycles_landlord_id ON public.rent_cycles(landlord_id);
CREATE INDEX idx_rent_cycles_status ON public.rent_cycles(status);
CREATE INDEX idx_rent_cycles_due_date ON public.rent_cycles(due_date);
CREATE INDEX idx_payments_rent_cycle_id ON public.payments(rent_cycle_id);
CREATE INDEX idx_payments_tenant_id ON public.payments(tenant_id);
CREATE INDEX idx_payments_landlord_id ON public.payments(landlord_id);
CREATE INDEX idx_payments_tran_id ON public.payments(tran_id);
CREATE INDEX idx_payments_status ON public.payments(status);

CREATE TRIGGER rent_cycles_updated_at BEFORE UPDATE ON public.rent_cycles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
