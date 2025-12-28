import { Link, useLocation } from "@tanstack/react-router";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";
import { cn } from "@/lib/utils";

export default function Header() {
  const location = useLocation();

  // Navigation links
  const links = [{ to: "/", label: "Home" }] as const;

  return (
    <div>
      <div className="flex flex-row items-center justify-between px-2 py-1">
        <nav className="flex gap-4 text-lg">
          {links.map(({ to, label }) => {
            const isActive =
              location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "transition-colors hover:text-foreground",
                  isActive ? "text-foreground font-medium" : "text-muted-foreground",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
      <hr />
    </div>
  );
}
