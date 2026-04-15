import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { PropertyForm } from "@/components/properties/property-form";
import { updateProperty } from "../../actions";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const supabase = await createClient();

  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .single();

  if (!property) notFound();

  const boundAction = updateProperty.bind(null, propertyId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Property</h1>
        <p className="text-sm text-gray-500">Update property details</p>
      </div>
      <Card>
        <CardContent className="py-6">
          <PropertyForm property={property} action={boundAction} />
        </CardContent>
      </Card>
    </div>
  );
}
