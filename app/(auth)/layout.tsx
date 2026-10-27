import React from "react";
import Link from "next/link";
import { Zap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 p-4 sm:p-8">
      {/* Glow effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="relative mb-8 flex items-center gap-2.5">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
          <Zap className="h-6 w-6 fill-current" />
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            WattShare
          </span>
          <span className="text-xs text-slate-400 font-medium">
            Partage équitable d'électricité
          </span>
        </div>
      </div>

      {/* Auth Card Container */}
      <div className="relative w-full max-w-md">
        {children}
      </div>

      <div className="relative mt-8 text-center text-xs text-slate-400">
        © 2026 WattShare · Conçu pour les propriétaires & locataires
      </div>
    </div>
  );
}
