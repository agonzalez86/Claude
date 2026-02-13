"use client";

import { Menu, Search } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { translations } from "@/lib/translations/es";

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(
        `/dashboard/containers?search=${encodeURIComponent(searchQuery.trim())}`
      );
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="flex items-center gap-4 px-4 py-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <form onSubmit={handleSearch} className="flex-1 max-w-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={translations.filters.globalSearchPlaceholder}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </form>
      </div>
    </header>
  );
}
