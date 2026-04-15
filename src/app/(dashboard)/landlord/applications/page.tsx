import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import { APPLICATION_STATUSES } from "@/lib/constants";
import { ApplicationReview } from "@/components/applications/application-review";
import { FileText } from "lucide-react";

export default async function ApplicationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: landlord } = await supabase
    .from("landlords")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!landlord) redirect("/login");

  const { data: applications } = await supabase
    .from("rental_applications")
    .select(
      "*, units(id, unit_number, monthly_rent, floor, property_id, properties(name))"
    )
    .eq("landlord_id", landlord.id)
    .order("created_at", { ascending: false });

  const pending = applications?.filter((a) => a.status === "pending") || [];
  const reviewed = applications?.filter((a) => a.status !== "pending") || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <p className="text-sm text-gray-500">
          Review rental applications from prospective tenants
        </p>
      </div>

      {/* Pending applications */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Pending ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((app) => {
              const unit = app.units as unknown as {
                id: string;
                unit_number: string;
                monthly_rent: number;
                floor: number | null;
                property_id: string;
                properties: { name: string };
              };
              return (
                <div
                  key={app.id}
                  className="rounded-xl border border-yellow-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {app.full_name}
                        </h3>
                        <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                          Pending
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {app.email} · {app.phone}
                      </p>
                      <p className="text-sm text-gray-600">
                        Applied for{" "}
                        <span className="font-medium">
                          Unit {unit.unit_number}
                        </span>{" "}
                        at{" "}
                        <span className="font-medium">
                          {unit.properties.name}
                        </span>{" "}
                        · {formatCurrency(Number(unit.monthly_rent))}/mo
                      </p>
                      {app.message && (
                        <p className="text-sm text-gray-500 mt-1 italic">
                          &quot;{app.message}&quot;
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        Applied {formatDate(app.created_at)}
                      </p>
                    </div>

                    <ApplicationReview
                      applicationId={app.id}
                      unitMonthlyRent={Number(unit.monthly_rent)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reviewed applications */}
      {reviewed.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Reviewed ({reviewed.length})
          </h2>
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Applicant
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Unit
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reviewed.map((app) => {
                  const unit = app.units as unknown as {
                    unit_number: string;
                    properties: { name: string };
                  };
                  const statusStyle =
                    APPLICATION_STATUSES[
                      app.status as keyof typeof APPLICATION_STATUSES
                    ];
                  return (
                    <tr key={app.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          {app.full_name}
                        </p>
                        <p className="text-xs text-gray-500">{app.email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        Unit {unit.unit_number} · {unit.properties.name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle.color}`}
                        >
                          {statusStyle.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {formatDate(app.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {applications?.length === 0 && (
        <div className="text-center py-20">
          <FileText className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">No applications yet</p>
          <p className="text-sm text-gray-400">
            List some units publicly to start receiving applications
          </p>
        </div>
      )}
    </div>
  );
}
