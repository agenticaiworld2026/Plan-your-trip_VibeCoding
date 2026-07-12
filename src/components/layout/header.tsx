"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Moon, Sun, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

interface HeaderProps {
  user?: { email: string } | null;
  onSignOut?: () => void;
}

export function Header({ user, onSignOut }: HeaderProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="no-print sticky top-0 z-40 border-b border-border bg-bg-base/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-10">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
            <Map className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-text-primary">Waypoint</span>
        </Link>

        <nav className="flex items-center gap-2">
          {user && (
            <Link
              href="/trips"
              className={cn(
                "hidden rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:block",
                pathname.startsWith("/trips")
                  ? "text-accent"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              My Trips
            </Link>
          )}

          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-text-secondary md:block">{user.email}</span>
              {onSignOut && (
                <Button variant="ghost" size="icon" onClick={onSignOut} aria-label="Sign out">
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            <Link href="/trips/new">
              <Button size="sm">Plan a trip</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
