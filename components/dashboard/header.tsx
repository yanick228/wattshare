"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Plus, Zap, Building2, Receipt, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./sidebar";

interface HeaderProps {
  userEmail?: string;
  userName?: string;
}

export function Header({ userEmail, userName }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Déterminer le titre contextuel
  const getPageInfo = () => {
    if (pathname.startsWith("/properties")) {
      return {
        title: "Propriétés & Locataires",
        icon: Building2,
        subtitle: "Gestion de vos maisons et sous-compteurs",
      };
    }
    if (pathname.startsWith("/bills/new")) {
      return {
        title: "Nouvelle Facture",
        icon: Plus,
        subtitle: "Saisie des index et calcul de répartition",
      };
    }
    if (pathname.startsWith("/bills")) {
      return {
        title: "Factures & Répartitions",
        icon: Receipt,
        subtitle: "Historique et suivi des paiements",
      };
    }
    return {
      title: "Tableau de bord",
      icon: Home,
      subtitle: "Vue d'ensemble de vos consommations",
    };
  };

  const pageInfo = getPageInfo();
  const PageIcon = pageInfo.icon;

  return (
    <>
      <header className="h-16 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 transition-colors">
        <div className="flex items-center gap-3.5">
          {/* Mobile hamburger button */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Breadcrumb / Current page indicator */}
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60 hidden sm:flex">
              <PageIcon className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                {pageInfo.title}
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline-block">
                {pageInfo.subtitle}
              </span>
            </div>
          </div>
        </div>

        {/* Right Action Area */}
        <div className="flex items-center gap-3">
          {/* Online system badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-600 text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Système Actif</span>
          </div>

          <Button
            asChild
            size="sm"
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold shadow-md shadow-emerald-500/15 text-xs sm:text-sm h-9 px-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
          >
            <Link href="/bills/new" className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              <span>Saisir une facture</span>
            </Link>
          </Button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex flex-col w-72 max-w-[85vw] bg-white h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar
              userEmail={userEmail}
              userName={userName}
              onItemClick={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
