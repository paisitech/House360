import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PAYMENT_STATUSES, PAYMENT_METHODS } from "@/lib/constants";
import { PaymentVerificationButton } from "@/components/payments/payment-verification-button";
import { GenerateCyclesButton } from "@/components/payments/generate-cycles-button";

export default async function PaymentsPage() {
  const supabase = await createClient();

  const { data: rentCycles } = await supabase
    .from("rent_cycles")
    .select(
      "*, tenants(full_name), units(unit_number, properties(name)), payments(*, manual_payments(*))"
    )
    .order("due_date", { ascending: false })
    .limit(50);

  const pendingVerifications =
    rentCycles?.filter((c) => c.status === "pending_verification") || [];
  const allCycles = rentCycles || [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500">
            Track and manage rent payments
          </p>
        </div>
        <GenerateCyclesButton />
      </div>

      {/* Pending Verifications */}
      {pendingVerifications.length > 0 && (
        <Card className="border-yellow-200">
          <div className="px-6 py-4 border-b border-yellow-100 bg-yellow-50">
            <h2 className="text-lg font-semibold text-yellow-800">
              Pending Verifications ({pendingVerifications.length})
            </h2>
          </div>
          <CardContent>
            <div className="space-y-3">
              {pendingVerifications.map((cycle) => {
                const payment = (cycle.payments as any[])?.[0];
                const manualPayment = payment?.manual_payments?.[0];
                return (
                  <div
                    key={cycle.id}
                    className="flex items-center justify-between rounded-lg border border-yellow-100 p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {(cycle.tenants as any)?.full_name} - Unit{" "}
                        {(cycle.units as any)?.unit_number}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(cycle.period_start)} -{" "}
                        {formatDate(cycle.period_end)} &bull;{" "}
                        {formatCurrency(Number(cycle.amount_due))}
                      </p>
                      {manualPayment?.transaction_reference && (
                        <p className="text-xs text-gray-500 mt-1">
                          Ref: {manualPayment.transaction_reference}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {manualPayment?.screenshot_url && (
                        <a
                          href={manualPayment.screenshot_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View Screenshot
                        </a>
                      )}
                      {payment && (
                        <PaymentVerificationButton paymentId={payment.id} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Rent Cycles */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            All Rent Cycles
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allCycles.map((cycle) => {
              const statusInfo =
                PAYMENT_STATUSES[
                  cycle.status as keyof typeof PAYMENT_STATUSES
                ];
              const payment = (cycle.payments as any[])?.[0];
              const methodInfo = payment
                ? PAYMENT_METHODS[
                    payment.payment_method as keyof typeof PAYMENT_METHODS
                  ]
                : null;

              return (
                <TableRow key={cycle.id}>
                  <TableCell className="font-medium">
                    {(cycle.tenants as any)?.full_name}
                  </TableCell>
                  <TableCell>
                    {(cycle.units as any)?.unit_number}
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatDate(cycle.period_start)} -{" "}
                    {formatDate(cycle.period_end)}
                  </TableCell>
                  <TableCell>{formatDate(cycle.due_date)}</TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">
                        {formatCurrency(Number(cycle.amount_paid))}
                      </span>
                      <span className="text-gray-400">
                        {" "}
                        / {formatCurrency(Number(cycle.amount_due))}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusInfo?.color}>
                      {statusInfo?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {methodInfo ? (
                      <Badge className={methodInfo.color}>
                        {methodInfo.label}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
