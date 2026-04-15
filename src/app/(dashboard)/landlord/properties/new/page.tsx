import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PropertyForm } from "@/components/properties/property-form";
import { createProperty } from "../actions";

export default function NewPropertyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Property</h1>
        <p className="text-sm text-gray-500">
          Add a new building or property to your portfolio
        </p>
      </div>
      <Card>
        <CardContent className="py-6">
          <PropertyForm action={createProperty} />
        </CardContent>
      </Card>
    </div>
  );
}
