CREATE TABLE public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID NOT NULL REFERENCES public.landlords(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    area TEXT,
    property_type property_type NOT NULL DEFAULT 'residential',
    total_units INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES public.landlords(id) ON DELETE CASCADE,
    unit_number TEXT NOT NULL,
    floor INTEGER,
    bedrooms INTEGER NOT NULL DEFAULT 1,
    bathrooms INTEGER NOT NULL DEFAULT 1,
    area_sqft NUMERIC,
    monthly_rent NUMERIC(12,2) NOT NULL,
    status unit_status NOT NULL DEFAULT 'vacant',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(property_id, unit_number)
);

CREATE INDEX idx_properties_landlord_id ON public.properties(landlord_id);
CREATE INDEX idx_units_property_id ON public.units(property_id);
CREATE INDEX idx_units_landlord_id ON public.units(landlord_id);
CREATE INDEX idx_units_status ON public.units(status);

CREATE TRIGGER properties_updated_at BEFORE UPDATE ON public.properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER units_updated_at BEFORE UPDATE ON public.units
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
