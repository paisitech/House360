-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landlords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rent_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- ==================== HELPER FUNCTION ====================
CREATE OR REPLACE FUNCTION get_landlord_id()
RETURNS UUID AS $$
    SELECT id FROM public.landlords WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ==================== USERS ====================
CREATE POLICY "users_select_own" ON public.users
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- ==================== LANDLORDS ====================
CREATE POLICY "landlords_select_own" ON public.landlords
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "landlords_update_own" ON public.landlords
    FOR UPDATE USING (user_id = auth.uid());

-- ==================== PROPERTIES ====================
CREATE POLICY "properties_landlord_all" ON public.properties
    FOR ALL USING (landlord_id = get_landlord_id());

-- ==================== UNITS ====================
CREATE POLICY "units_landlord_all" ON public.units
    FOR ALL USING (landlord_id = get_landlord_id());

CREATE POLICY "units_tenant_select" ON public.units
    FOR SELECT USING (
        id IN (
            SELECT l.unit_id FROM public.leases l
            JOIN public.tenants t ON t.id = l.tenant_id
            WHERE t.user_id = auth.uid() AND l.status = 'active'
        )
    );

-- ==================== TENANTS ====================
CREATE POLICY "tenants_landlord_all" ON public.tenants
    FOR ALL USING (landlord_id = get_landlord_id());

CREATE POLICY "tenants_self_select" ON public.tenants
    FOR SELECT USING (user_id = auth.uid());

-- ==================== LEASES ====================
CREATE POLICY "leases_landlord_all" ON public.leases
    FOR ALL USING (landlord_id = get_landlord_id());

CREATE POLICY "leases_tenant_select" ON public.leases
    FOR SELECT USING (
        tenant_id IN (
            SELECT id FROM public.tenants WHERE user_id = auth.uid()
        )
    );

-- ==================== RENT CYCLES ====================
CREATE POLICY "rent_cycles_landlord_all" ON public.rent_cycles
    FOR ALL USING (landlord_id = get_landlord_id());

CREATE POLICY "rent_cycles_tenant_select" ON public.rent_cycles
    FOR SELECT USING (
        tenant_id IN (
            SELECT id FROM public.tenants WHERE user_id = auth.uid()
        )
    );

-- ==================== PAYMENTS ====================
CREATE POLICY "payments_landlord_all" ON public.payments
    FOR ALL USING (landlord_id = get_landlord_id());

CREATE POLICY "payments_tenant_select" ON public.payments
    FOR SELECT USING (
        tenant_id IN (
            SELECT id FROM public.tenants WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "payments_tenant_insert" ON public.payments
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT id FROM public.tenants WHERE user_id = auth.uid()
        )
    );

-- ==================== MANUAL PAYMENTS ====================
CREATE POLICY "manual_payments_landlord_all" ON public.manual_payments
    FOR ALL USING (
        payment_id IN (
            SELECT id FROM public.payments WHERE landlord_id = get_landlord_id()
        )
    );

CREATE POLICY "manual_payments_tenant_insert" ON public.manual_payments
    FOR INSERT WITH CHECK (
        payment_id IN (
            SELECT id FROM public.payments
            WHERE tenant_id IN (
                SELECT id FROM public.tenants WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "manual_payments_tenant_select" ON public.manual_payments
    FOR SELECT USING (
        payment_id IN (
            SELECT id FROM public.payments
            WHERE tenant_id IN (
                SELECT id FROM public.tenants WHERE user_id = auth.uid()
            )
        )
    );

-- ==================== REMINDERS ====================
CREATE POLICY "reminders_landlord_all" ON public.reminders
    FOR ALL USING (landlord_id = get_landlord_id());

CREATE POLICY "reminders_tenant_select" ON public.reminders
    FOR SELECT USING (
        tenant_id IN (
            SELECT id FROM public.tenants WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "reminders_tenant_update" ON public.reminders
    FOR UPDATE USING (
        tenant_id IN (
            SELECT id FROM public.tenants WHERE user_id = auth.uid()
        )
    );
