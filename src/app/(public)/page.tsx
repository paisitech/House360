import Link from "next/link";
import { Building2, Shield, CreditCard, BarChart3, Users, Clock } from "lucide-react";

const features = [
  {
    icon: Building2,
    title: "Property Management",
    description: "Manage multiple properties and units from a single dashboard.",
  },
  {
    icon: Users,
    title: "Tenant Management",
    description: "Track tenants, leases, and contact information effortlessly.",
  },
  {
    icon: CreditCard,
    title: "Online Payments",
    description: "Accept rent payments via bKash, Nagad, Rocket, cards, and bank transfer.",
  },
  {
    icon: Clock,
    title: "Automatic Rent Tracking",
    description: "Auto-generate monthly rent cycles and track payment status.",
  },
  {
    icon: Shield,
    title: "Secure & Isolated",
    description: "Enterprise-grade security with complete data isolation per landlord.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    description: "Track occupancy, collection rates, and payment trends.",
  },
];

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Manage Your Properties
              <br />
              <span className="text-blue-200">With Confidence</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-blue-100">
              House360 helps landlords manage properties, track tenants, collect
              rent online, and grow their rental business — all from one
              platform.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/signup"
                className="rounded-lg bg-white px-8 py-3 text-sm font-semibold text-blue-600 shadow-lg hover:bg-blue-50 transition-colors"
              >
                Get Started Free
              </Link>
              <Link
                href="/pricing"
                className="rounded-lg border border-blue-300 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Everything you need to manage rentals
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Built specifically for Bangladeshi landlords
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <feature.icon className="h-10 w-10 text-blue-600" />
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Ready to simplify your rental management?
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Start managing your properties in minutes. No credit card required.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-lg bg-blue-600 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Start Free Trial
          </Link>
        </div>
      </section>
    </div>
  );
}
