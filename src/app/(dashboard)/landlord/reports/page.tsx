import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { BarChart3 } from "lucide-react";

export default async function ReportsPage() {
  const supabase = await createClient();

  // Get last 12 months of data
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const { data: cycles } = await supabase
    .from("rent_cycles")
    .select("period_start, amount_due, amount_paid, status")
    .gte("period_start", twelveMonthsAgo.toISOString())
    .order("period_start");

  // Aggregate by month
  const monthlyData: Record<
    string,
    { due: number; collected: number; count: number; paidCount: number }
  > = {};

  cycles?.forEach((cycle) => {
    const month = cycle.period_start.substring(0, 7); // YYYY-MM
    if (!monthlyData[month]) {
      monthlyData[month] = { due: 0, collected: 0, count: 0, paidCount: 0 };
    }
    monthlyData[month].due += Number(cycle.amount_due);
    monthlyData[month].collected += Number(cycle.amount_paid);
    monthlyData[month].count++;
    if (cycle.status === "paid") monthlyData[month].paidCount++;
  });

  const months = Object.keys(monthlyData).sort();

  // Payment method breakdown
  const { data: payments } = await supabase
    .from("payments")
    .select("payment_method, amount")
    .eq("status", "success")
    .gte("created_at", twelveMonthsAgo.toISOString());

  const methodTotals: Record<string, number> = {};
  payments?.forEach((p) => {
    methodTotals[p.payment_method] =
      (methodTotals[p.payment_method] || 0) + Number(p.amount);
  });

  // Property-wise breakdown
  const { data: propertyCycles } = await supabase
    .from("rent_cycles")
    .select("amount_due, amount_paid, units(properties(name))")
    .gte("period_start", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

  const propertyTotals: Record<string, { due: number; collected: number }> = {};
  propertyCycles?.forEach((c) => {
    const propName = (c.units as any)?.properties?.name || "Unknown";
    if (!propertyTotals[propName]) {
      propertyTotals[propName] = { due: 0, collected: 0 };
    }
    propertyTotals[propName].due += Number(c.amount_due);
    propertyTotals[propName].collected += Number(c.amount_paid);
  });

  const totalCollectedAllTime =
    payments?.reduce((s, p) => s + Number(p.amount), 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500">
          Analytics and insights for your portfolio
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent>
            <p className="text-sm text-gray-500">Total Collected (12mo)</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(totalCollectedAllTime)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-gray-500">Active Months</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {months.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-gray-500">Payment Methods Used</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {Object.keys(methodTotals).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Collection Trend */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Monthly Collection Trend
          </h2>
        </div>
        <CardContent>
          {months.length > 0 ? (
            <div className="space-y-3">
              {months.map((month) => {
                const data = monthlyData[month];
                const pct =
                  data.due > 0
                    ? Math.round((data.collected / data.due) * 100)
                    : 0;
                return (
                  <div key={month} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">
                        {month}
                      </span>
                      <span className="text-gray-500">
                        {formatCurrency(data.collected)} /{" "}
                        {formatCurrency(data.due)} ({pct}%)
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          pct >= 80
                            ? "bg-green-500"
                            : pct >= 50
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">
                No data available yet
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Payment Method Distribution */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Payment Methods
            </h2>
          </div>
          <CardContent>
            {Object.keys(methodTotals).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(methodTotals)
                  .sort((a, b) => b[1] - a[1])
                  .map(([method, total]) => (
                    <div
                      key={method}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm capitalize text-gray-700">
                        {method.replace("_", " ")}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No payment data
              </p>
            )}
          </CardContent>
        </Card>

        {/* Property-wise Breakdown */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              This Month by Property
            </h2>
          </div>
          <CardContent>
            {Object.keys(propertyTotals).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(propertyTotals).map(([name, totals]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-gray-700">{name}</span>
                    <span className="text-sm text-gray-900">
                      <span className="font-medium">
                        {formatCurrency(totals.collected)}
                      </span>
                      <span className="text-gray-400">
                        {" "}
                        / {formatCurrency(totals.due)}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No data this month
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
