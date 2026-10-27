"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Receipt,
  PlusCircle,
  Zap,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface SidebarProps {
  userEmail?: string;
  userName?: string;
  onItemClick?: () => void;
}

const navItems = [
  {
    title: "Tableau de bord",
    href: "/dashboard",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    title: "Propriétés & Locataires",
    href: "/properties",
    icon: Building2,
    badge: null,
  },
  {
    title: "Factures & Répartition",
    href: "/bills",
    icon: Receipt,
    badge: null,
  },
];

export function Sidebar({ userEmail, userName, onItemClick }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col h-full w-64 bg-white border-r border-slate-200/80 select-none relative z-20">
      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400" />

      {/* Brand Header */}
      <div className="h-[72px] flex items-center px-5 border-b border-slate-100 gap-3 relative">
        <div className="relative group cursor-pointer">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/25 transition-transform duration-200 group-hover:scale-105">
            <Zap className="h-5 w-5 fill-emerald-100 text-white" />
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-[17px] tracking-tight text-slate-900">
              Watt<span className="text-emerald-600">Share</span>
            </span>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase flex items-center gap-1">
            <span className="inline-block w-1 h-1 rounded-full bg-emerald-500" />
            Énergie & Répartition
          </span>
        </div>
      </div>

      {/* Quick Action Button */}
      <div className="px-3.5 pt-5 pb-2">
        <Link
          href="/bills/new"
          onClick={onItemClick}
          className="group relative flex items-center justify-center gap-2 w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-[13px] tracking-wide shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
        >
          <PlusCircle className="h-4 w-4 transition-transform group-hover:rotate-90 duration-300" />
          <span>Nouvelle Facture</span>
          <Sparkles className="h-3 w-3 ml-auto opacity-60 group-hover:opacity-100 transition-opacity" />
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        <div className="px-3 pb-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Gestion Principale
        </div>

        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href) && item.href !== "/bills/new");

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group relative",
                isActive
                  ? "bg-emerald-50 text-emerald-700 font-semibold shadow-sm border border-emerald-200/60"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              )}
            >
              <div
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200",
                  isActive
                    ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/25"
                    : "bg-slate-100 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600"
                )}
              >
                <Icon className="h-[16px] w-[16px] shrink-0" />
              </div>

              <span className="flex-1 truncate">{item.title}</span>

              {isActive && (
                <ChevronRight className="h-3.5 w-3.5 text-emerald-500 animate-in fade-in slide-in-from-left-1 duration-200" />
              )}
            </Link>
          );
        })}
      </div>

      {/* User Info & Logout Footer */}
      <div className="p-3.5 border-t border-slate-100">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 mb-2.5 flex items-center gap-3">
          <div className="relative">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white font-black flex items-center justify-center text-sm shadow-sm">
              {userName ? userName.charAt(0).toUpperCase() : userEmail ? userEmail.charAt(0).toUpperCase() : "P"}
            </div>
            {/* Live Indicator Dot */}
            <span className="absolute bottom-0 right-0 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-white" />
            </span>
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-800 truncate">
                {userName || "Propriétaire"}
              </span>
              <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" />
            </div>
            <span className="text-[11px] text-slate-400 truncate">
              {userEmail || "Connecté"}
            </span>
          </div>
        </div>

        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-150"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Déconnexion</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
