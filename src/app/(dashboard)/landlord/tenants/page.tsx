import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Phone, Mail } from "lucide-react";

export default async function TenantsPage() {
  const supabase = await createClient();

  const { data: tenants } = await supabase
    .from("tenants")
    .select("*, leases(id, status, units(unit_number, properties(name)))")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-sm text-gray-500">Manage your tenants</p>
        </div>
        <Link href="/landlord/tenants/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Tenant
          </Button>
        </Link>
      </div>

      {tenants && tenants.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tenants.map((tenant) => {
            const activeLease = (tenant.leases as any[])?.find(
              (l: any) => l.status === "active"
            );
            return (
              <Link key={tenant.id} href={`/landlord/tenants/${tenant.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                          <Users className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {tenant.full_name}
                          </h3>
                        </div>
                      </div>
                      <Badge variant={tenant.is_active ? "success" : "default"}>
                        {tenant.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{tenant.phone}</span>
                      </div>
                      {tenant.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" />
                          <span>{tenant.email}</span>
                        </div>
                      )}
                    </div>
                    {activeLease && (
                      <p className="text-xs text-blue-600 bg-blue-50 rounded px-2 py-1">
                        Unit {activeLease.units?.unit_number} at{" "}
                        {activeLease.units?.properties?.name}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No tenants yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Add your first tenant to get started.
            </p>
            <Link href="/landlord/tenants/new" className="mt-4">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Tenant
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
