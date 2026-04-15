import { Card, CardContent } from "@/components/ui/card";
import { UnitForm } from "@/components/units/unit-form";
import { createUnit } from "../actions";

export default async function NewUnitPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const boundAction = createUnit.bind(null, propertyId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Unit</h1>
        <p className="text-sm text-gray-500">Add a new unit to this property</p>
      </div>
      <Card>
        <CardContent className="py-6">
          <UnitForm propertyId={propertyId} action={boundAction} />
        </CardContent>
      </Card>
    </div>
  );
}
