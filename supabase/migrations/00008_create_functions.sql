-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role_value user_role;
    user_full_name TEXT;
    role_text TEXT;
BEGIN
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '');
    role_text := COALESCE(NEW.raw_user_meta_data->>'role', '');

    IF role_text = 'landlord' THEN
        user_role_value := 'landlord'::user_role;
    ELSE
        user_role_value := 'tenant'::user_role;
    END IF;

    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        user_full_name,
        user_role_value
    );

    IF user_role_value = 'landlord' THEN
        INSERT INTO public.landlords (user_id) VALUES (NEW.id);
    END IF;

    IF user_role_value = 'tenant' AND NEW.email IS NOT NULL THEN
        UPDATE public.tenants
        SET user_id = NEW.id
        WHERE email = NEW.email AND user_id IS NULL;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to generate monthly rent cycles (called by cron)
CREATE OR REPLACE FUNCTION generate_rent_cycles(target_month DATE)
RETURNS INTEGER AS $$
DECLARE
    cycles_created INTEGER := 0;
    lease RECORD;
    period_s DATE;
    period_e DATE;
    due DATE;
BEGIN
    period_s := date_trunc('month', target_month)::DATE;
    period_e := (period_s + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

    FOR lease IN
        SELECT l.*
        FROM public.leases l
        WHERE l.status = 'active'
          AND l.start_date <= period_e
          AND (l.end_date IS NULL OR l.end_date >= period_s)
    LOOP
        due := period_s + (lease.rent_due_day - 1);

        IF NOT EXISTS (
            SELECT 1 FROM public.rent_cycles
            WHERE lease_id = lease.id AND period_start = period_s
        ) THEN
            INSERT INTO public.rent_cycles
                (lease_id, tenant_id, landlord_id, unit_id, period_start, period_end, due_date, amount_due)
            VALUES
                (lease.id, lease.tenant_id, lease.landlord_id, lease.unit_id, period_s, period_e, due, lease.monthly_rent);
            cycles_created := cycles_created + 1;
        END IF;
    END LOOP;

    RETURN cycles_created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark overdue rent cycles
CREATE OR REPLACE FUNCTION mark_overdue_cycles()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.rent_cycles
    SET status = 'late', updated_at = now()
    WHERE status = 'due'
      AND due_date < CURRENT_DATE;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
