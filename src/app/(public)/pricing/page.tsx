import Link from "next/link";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "0",
    description: "Perfect for getting started",
    features: [
      "Up to 3 properties",
      "Up to 10 units",
      "Basic payment tracking",
      "Manual payment verification",
      "Email support",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "999",
    description: "For growing landlords",
    features: [
      "Unlimited properties",
      "Unlimited units",
      "Online payment collection",
      "Automatic rent reminders",
      "Analytics dashboard",
      "Priority support",
    ],
    cta: "Start Pro Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "2999",
    description: "For large portfolios",
    features: [
      "Everything in Pro",
      "Custom branding",
      "API access",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            Choose the plan that fits your needs. All prices in BDT/month.
          </p>
        </div>
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border-2 p-8 ${
                plan.popular
                  ? "border-blue-600 shadow-lg relative"
                  : "border-gray-200"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-xs font-semibold text-white">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
              <div className="mt-6">
                <span className="text-4xl font-bold text-gray-900">
                  ৳{plan.price}
                </span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-600 shrink-0" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`mt-8 block w-full rounded-lg py-3 text-center text-sm font-semibold transition-colors ${
                  plan.popular
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
