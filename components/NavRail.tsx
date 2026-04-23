"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Plan", icon: "◈" },
  { href: "/plantings", label: "Plants", icon: "❧" },
  { href: "/journal", label: "Journal", icon: "▤" },
  { href: "/photos", label: "Photos", icon: "⬡" },
  { href: "/conversations", label: "Chat", icon: "◎" },
  { href: "/settings", label: "Settings", icon: "⊙" },
];

export function NavRail() {
  const pathname = usePathname();

  return (
    <nav className="nav-rail" aria-label="Main navigation">
      <div className="nav-rail-logo" aria-hidden="true">⊛</div>
      <ul className="nav-rail-list">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`nav-rail-link${active ? " active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <span className="nav-rail-icon" aria-hidden="true">{icon}</span>
                <span className="nav-rail-label">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
