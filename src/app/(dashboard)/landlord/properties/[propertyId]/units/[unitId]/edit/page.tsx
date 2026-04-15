import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { UnitForm } from "@/components/units/unit-form";
import { updateUnit } from "../../actions";

export default async function EditUnitPage({
  params,
}: {
  params: Promise<{ propertyId: string; unitId: string }>;
}) {
  const { propertyId, unitId } = await params;
  const supabase = await createClient();

  const { data: unit } = await supabase
    .from("units")
    .select("*")
    .eq("id", unitId)
    .single();

  if (!unit) notFound();

  const boundAction = updateUnit.bind(null, propertyId, unitId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Unit</h1>
        <p className="text-sm text-gray-500">Update unit details</p>
      </div>
      <Card>
        <CardContent className="py-6">
          <UnitForm unit={unit} propertyId={propertyId} action={boundAction} />
        </CardContent>
      </Card>
    </div>
  );
}
