import { Card, CardContent } from "@/components/ui/card";
import { TenantForm } from "@/components/tenants/tenant-form";
import { createTenant } from "../actions";

export default function NewTenantPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Tenant</h1>
        <p className="text-sm text-gray-500">Add a new tenant</p>
      </div>
      <Card>
        <CardContent className="py-6">
          <TenantForm action={createTenant} />
        </CardContent>
      </Card>
    </div>
  );
}
