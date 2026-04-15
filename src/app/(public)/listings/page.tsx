import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils";
import { Building2, BedDouble, Bath, Layers, MapPin } from "lucide-react";

export const metadata = {
  title: "Available Rentals | House360",
  description: "Browse available rental units and apply online.",
};

export default async function ListingsPage() {
  const { data: units } = await supabaseAdmin
    .from("units")
    .select(
      "id, unit_number, floor, bedrooms, bathrooms, area_sqft, monthly_rent, description, property_id, properties(id, name, address, city, area, property_type, image_url)"
    )
    .eq("is_listed", true)
    .eq("status", "vacant")
    .order("monthly_rent", { ascending: true });

  // Group by property
  const propertyMap = new Map<
    string,
    {
      property: {
        id: string;
        name: string;
        address: string;
        city: string;
        area: string | null;
        property_type: string;
        image_url: string | null;
      };
      units: typeof units;
    }
  >();

  for (const unit of units || []) {
    const prop = unit.properties as unknown as {
      id: string;
      name: string;
      address: string;
      city: string;
      area: string | null;
      property_type: string;
      image_url: string | null;
    };
    if (!prop) continue;

    if (!propertyMap.has(prop.id)) {
      propertyMap.set(prop.id, { property: prop, units: [] });
    }
    propertyMap.get(prop.id)!.units!.push(unit);
  }

  const properties = Array.from(propertyMap.values());

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          Available Rentals
        </h1>
        <p className="mt-2 text-lg text-gray-500">
          Browse available units and apply online — no account needed
        </p>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-20">
          <Building2 className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">
            No units available right now. Check back later!
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {properties.map(({ property, units: propUnits }) => (
            <div key={property.id}>
              {/* Property header */}
              <div className="mb-4 flex items-start gap-3">
                <Building2 className="mt-1 h-6 w-6 text-blue-600 shrink-0" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {property.name}
                  </h2>
                  <p className="flex items-center gap-1 text-sm text-gray-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {property.address}, {property.city}
                    {property.area ? `, ${property.area}` : ""}
                  </p>
                  <span className="mt-1 inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 capitalize">
                    {property.property_type}
                  </span>
                </div>
              </div>

              {/* Unit cards grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {propUnits?.map((unit) => (
                  <Link
                    key={unit.id}
                    href={`/listings/${unit.id}`}
                    className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-gray-900">
                        Unit {unit.unit_number}
                      </span>
                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                        Available
                      </span>
                    </div>

                    <p className="text-2xl font-bold text-blue-600 mb-3">
                      {formatCurrency(Number(unit.monthly_rent))}
                      <span className="text-sm font-normal text-gray-400">
                        /month
                      </span>
                    </p>

                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <BedDouble className="h-4 w-4 text-gray-400" />
                        {unit.bedrooms} bed
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath className="h-4 w-4 text-gray-400" />
                        {unit.bathrooms} bath
                      </span>
                      {unit.floor && (
                        <span className="flex items-center gap-1">
                          <Layers className="h-4 w-4 text-gray-400" />
                          Floor {unit.floor}
                        </span>
                      )}
                      {unit.area_sqft && (
                        <span className="text-gray-500">
                          {unit.area_sqft} sqft
                        </span>
                      )}
                    </div>

                    <p className="mt-3 text-xs font-medium text-blue-600 group-hover:underline">
                      View Details & Apply →
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
