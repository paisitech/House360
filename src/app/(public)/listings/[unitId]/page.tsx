import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils";
import { ApplicationForm } from "@/components/listings/application-form";
import {
  Building2,
  MapPin,
  BedDouble,
  Bath,
  Layers,
  Ruler,
  CreditCard,
} from "lucide-react";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;

  const { data: unit } = await supabaseAdmin
    .from("units")
    .select(
      "*, properties(id, name, address, city, area, property_type, description, image_url)"
    )
    .eq("id", unitId)
    .eq("is_listed", true)
    .eq("status", "vacant")
    .single();

  if (!unit) notFound();

  const property = unit.properties as unknown as {
    id: string;
    name: string;
    address: string;
    city: string;
    area: string | null;
    property_type: string;
    description: string | null;
    image_url: string | null;
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Property info */}
      <div className="mb-8">
        <div className="flex items-start gap-3 mb-2">
          <Building2 className="mt-1 h-6 w-6 text-blue-600 shrink-0" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Unit {unit.unit_number} — {property.name}
            </h1>
            <p className="flex items-center gap-1 text-sm text-gray-500 mt-1">
              <MapPin className="h-3.5 w-3.5" />
              {property.address}, {property.city}
              {property.area ? `, ${property.area}` : ""}
            </p>
          </div>
        </div>
        <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
          Available
        </span>
      </div>

      <div className="grid gap-8 md:grid-cols-5">
        {/* Unit details */}
        <div className="md:col-span-3 space-y-6">
          {/* Price */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <p className="text-3xl font-bold text-blue-600">
              {formatCurrency(Number(unit.monthly_rent))}
              <span className="text-base font-normal text-gray-400">
                /month
              </span>
            </p>
          </div>

          {/* Specs */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Unit Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <BedDouble className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Bedrooms</p>
                  <p className="font-semibold text-gray-900">
                    {unit.bedrooms}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Bath className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Bathrooms</p>
                  <p className="font-semibold text-gray-900">
                    {unit.bathrooms}
                  </p>
                </div>
              </div>
              {unit.floor && (
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Floor</p>
                    <p className="font-semibold text-gray-900">{unit.floor}</p>
                  </div>
                </div>
              )}
              {unit.area_sqft && (
                <div className="flex items-center gap-2">
                  <Ruler className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Area</p>
                    <p className="font-semibold text-gray-900">
                      {unit.area_sqft} sqft
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Property Type</p>
                  <p className="font-semibold text-gray-900 capitalize">
                    {property.property_type}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {(unit.description || property.description) && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Description
              </h2>
              {unit.description && (
                <p className="text-gray-700">{unit.description}</p>
              )}
              {property.description && (
                <p className="text-gray-600 text-sm mt-2">
                  {property.description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Application form */}
        <div className="md:col-span-2">
          <div className="sticky top-8 rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Apply for this unit
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              No account needed — fill out the form and the landlord will
              review your application.
            </p>
            <ApplicationForm unitId={unit.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
