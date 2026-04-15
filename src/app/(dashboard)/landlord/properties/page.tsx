import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, MapPin, DoorOpen } from "lucide-react";

export default async function PropertiesPage() {
  const supabase = await createClient();

  const { data: properties } = await supabase
    .from("properties")
    .select("*, units(id, status)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-sm text-gray-500">
            Manage your buildings and properties
          </p>
        </div>
        <Link href="/landlord/properties/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        </Link>
      </div>

      {properties && properties.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => {
            const units = (property.units as { id: string; status: string }[]) || [];
            const occupied = units.filter((u) => u.status === "occupied").length;
            return (
              <Link key={property.id} href={`/landlord/properties/${property.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="rounded-lg bg-blue-50 p-2">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <Badge variant={property.is_active ? "success" : "default"}>
                        {property.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {property.name}
                      </h3>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        <p className="text-sm text-gray-500">
                          {property.area ? `${property.area}, ` : ""}
                          {property.city}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <DoorOpen className="h-4 w-4" />
                      <span>
                        {occupied}/{units.length} units occupied
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No properties yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding your first property.
            </p>
            <Link href="/landlord/properties/new" className="mt-4">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Property
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
