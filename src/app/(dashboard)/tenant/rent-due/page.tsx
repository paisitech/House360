import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PAYMENT_STATUSES } from "@/lib/constants";
import { PayRentButton } from "@/components/payments/pay-rent-button";
import Link from "next/link";
import { CreditCard, Upload } from "lucide-react";

export default async function RentDuePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("user_id", user!.id)
    .single();

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Account not linked to a property yet.</p>
      </div>
    );
  }

  const { data: dueCycles } = await supabase
    .from("rent_cycles")
    .select("*, units(unit_number, properties(name))")
    .eq("tenant_id", tenant.id)
    .in("status", ["due", "late", "pending_verification"])
    .order("due_date");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rent Due</h1>
        <p className="text-sm text-gray-500">Your pending rent payments</p>
      </div>

      {dueCycles && dueCycles.length > 0 ? (
        <div className="space-y-4">
          {dueCycles.map((cycle) => {
            const statusInfo =
              PAYMENT_STATUSES[cycle.status as keyof typeof PAYMENT_STATUSES];
            const amountRemaining =
              Number(cycle.amount_due) - Number(cycle.amount_paid);
            const isPendingVerification =
              cycle.status === "pending_verification";

            return (
              <Card key={cycle.id}>
                <CardContent className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {(cycle.units as any)?.properties?.name} - Unit{" "}
                        {(cycle.units as any)?.unit_number}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(cycle.period_start)} -{" "}
                        {formatDate(cycle.period_end)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Due: {formatDate(cycle.due_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(amountRemaining)}
                      </p>
                      <Badge className={statusInfo?.color}>
                        {statusInfo?.label}
                      </Badge>
                    </div>
                  </div>

                  {!isPendingVerification && (
                    <div className="flex gap-3 border-t pt-4">
                      <PayRentButton
                        rentCycleId={cycle.id}
                        amount={amountRemaining}
                      />
                      <Link
                        href={`/tenant/upload-screenshot?cycle=${cycle.id}`}
                        className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Screenshot
                      </Link>
                    </div>
                  )}

                  {isPendingVerification && (
                    <div className="border-t pt-3">
                      <p className="text-sm text-blue-600">
                        Your payment screenshot is being reviewed by the
                        landlord.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <CreditCard className="h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              All caught up!
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              You have no pending rent payments.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
