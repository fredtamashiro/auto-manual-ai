"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown, CircleUserRound, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AuthUser } from "@/services/api";

type SiteHeaderProps = {
  adminUser: AuthUser | null;
  isCheckingSession: boolean;
  isLoggingOut: boolean;
  onLoginClick: () => void;
  onLogout: () => void;
};

const navItems = [
  { label: "Inicio", href: "#home" },
  { label: "Fluxo", href: "#fluxo" },
  { label: "Documentos", href: "#documentos" },
  { label: "Deploy", href: "#deploy" },
];

export function SiteHeader({
  adminUser,
  isCheckingSession,
  isLoggingOut,
  onLoginClick,
  onLogout,
}: SiteHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    if (!isMenuOpen) {
      return;
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [isMenuOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-[#d9dde3] bg-white">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <a href="#home" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center overflow-hidden">
            <Image
              src="/logo-header.png"
              alt="SmartDocs AI"
              width={44}
              height={44}
              className="h-full w-full object-contain"
              unoptimized
            />
          </span>
          <span className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">
            FredTamashiro
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-semibold text-[#1A1A1A] transition hover:text-[#7abf29]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {adminUser ? (
          <div className="relative" ref={menuRef}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsMenuOpen((current) => !current)}
              className="h-12 rounded-md border-[#d9dde3] bg-white px-4"
            >
              <CircleUserRound className="h-4 w-4" />
              <span className="hidden max-w-36 truncate text-sm md:block">
                {adminUser.name || adminUser.email}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-3 w-52 rounded-xl border border-[#d9dde3] bg-white p-2">
                <div className="border-b border-[#eceff2] px-3 py-2">
                  <p className="text-sm font-medium text-[#1A1A1A]">
                    {adminUser.name || "Admin"}
                  </p>
                  <p className="truncate text-xs text-[#666666]">
                    {adminUser.email}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onLogout();
                  }}
                  disabled={isLoggingOut}
                  className="mt-2 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[#1A1A1A] transition hover:bg-[#F0F2F5] disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4" />
                  {isLoggingOut ? "Saindo..." : "Sair"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <Button
            type="button"
            onClick={onLoginClick}
            disabled={isCheckingSession}
            className="h-12 rounded-md bg-[#99FF33] px-6 text-[#1A1A1A] hover:brightness-95"
          >
            {isCheckingSession ? "Verificando..." : "Login"}
          </Button>
        )}
      </div>
    </header>
  );
}
