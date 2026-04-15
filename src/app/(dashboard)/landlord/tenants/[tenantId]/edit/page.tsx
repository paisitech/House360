import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { TenantForm } from "@/components/tenants/tenant-form";
import { updateTenant } from "../../actions";

export default async function EditTenantPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const supabase = await createClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", tenantId)
    .single();

  if (!tenant) notFound();

  const boundAction = updateTenant.bind(null, tenantId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Tenant</h1>
        <p className="text-sm text-gray-500">Update tenant information</p>
      </div>
      <Card>
        <CardContent className="py-6">
          <TenantForm tenant={tenant} action={boundAction} />
        </CardContent>
      </Card>
    </div>
  );
}
