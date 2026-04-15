import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
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
import { PAYMENT_METHODS } from "@/lib/constants";
import { Clock } from "lucide-react";

export default async function PaymentHistoryPage() {
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
        <p className="text-gray-500">Account not linked yet.</p>
      </div>
    );
  }

  const { data: payments } = await supabase
    .from("payments")
    .select("*, rent_cycles(period_start, period_end)")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  const statusBadge = (status: string) => {
    const map: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
      success: "success",
      initiated: "info",
      failed: "danger",
      cancelled: "warning",
      refunded: "default",
    };
    return map[status] || "default";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
        <p className="text-sm text-gray-500">Your past rent payments</p>
      </div>

      <Card>
        {payments && payments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => {
                const methodInfo =
                  PAYMENT_METHODS[
                    payment.payment_method as keyof typeof PAYMENT_METHODS
                  ];
                const cycle = payment.rent_cycles as any;
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="text-sm">
                      {cycle
                        ? `${formatDate(cycle.period_start)} - ${formatDate(
                            cycle.period_end
                          )}`
                        : "-"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(Number(payment.amount))}
                    </TableCell>
                    <TableCell>
                      <Badge className={methodInfo?.color}>
                        {methodInfo?.label || payment.payment_method}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadge(payment.status)}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {payment.paid_at
                        ? formatDate(payment.paid_at)
                        : formatDate(payment.created_at)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center py-12">
            <Clock className="h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No payment history
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Your payments will appear here.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
