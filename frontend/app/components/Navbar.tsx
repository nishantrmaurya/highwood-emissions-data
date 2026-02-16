"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaPlus } from "react-icons/fa";

function navLinkClass(isActive: boolean) {
  return [
    "text-lg font-semibold transition-colors",
    isActive
      ? "text-white underline decoration-2 underline-offset-8"
      : "text-white hover:text-blue-300",
  ].join(" ");
}

export default function Navbar() {
  const pathname = usePathname();

  const dashboardActive = pathname === "/" || pathname === "/dashboard";
  const createSiteActive = pathname === "/sites/create";

  return (
    <nav className="w-full flex items-center justify-between bg-gray-900 px-6 py-4 shadow-sm">
      <div className="flex items-center gap-8">
        <Link href="/" className={navLinkClass(dashboardActive)}>
          Dashboard
        </Link>
        <Link
          href="/sites/create"
          className={`${navLinkClass(createSiteActive)} flex items-center gap-1`}
        >
          <FaPlus className="text-base" />
          <span>Create Site</span>
        </Link>
      </div>
    </nav>
  );
}
