"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, X, Building2, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface SearchResultItem {
  symbol: string;
  shortname: string;
  longname?: string;
  sector?: string;
  exchange?: string;
  quoteType?: string;
  typeDisp?: string;
  url?: string;
}

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
  onSelect?: () => void;
}

export function GlobalSearch({
  className = "",
  placeholder = "Hisse kodu, şirket veya sektör ara...",
  onSelect
}: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced Search
  useEffect(() => {
    if (!query || query.trim().length === 0) {
      setResults([]);
      setLoading(false);
      setIsOpen(false);
      return;
    }

    const trimmed = query.trim();
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setIsOpen(true);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error("Global search error:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Click Outside to Close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: SearchResultItem) => {
    const cleanSym = item.symbol.toUpperCase().replace(/\.IS$/, '');
    setIsOpen(false);
    setQuery("");
    if (onSelect) onSelect();
    router.push(`/varlik/${cleanSym}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex]);
      } else if (results.length > 0) {
        handleSelect(results[0]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00008B]/50 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Varlık ve Şirket Arama"
          className="w-full bg-slate-50/90 border border-slate-200/80 rounded-2xl py-2 pl-10 pr-10 text-xs font-bold text-[#00008B] placeholder:text-[#00008B]/40 focus:outline-none focus:ring-2 focus:ring-[#00008B]/20 focus:bg-white transition-all shadow-xs"
        />
        {loading ? (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 animate-spin" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            aria-label="Aramayı Temizle"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#00008B] p-0.5 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {/* DROPDOWN RESULTS */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 max-h-[380px] overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-4 text-center">
              <Building2 className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-700">Sonuç bulunamadı</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Farklı bir hisse kodu veya şirket adı deneyin.</p>
            </div>
          ) : (
            <div className="p-1.5 space-y-1">
              <div className="px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                <span>Eşleşen Varlıklar</span>
                <span>{results.length} Sonuç</span>
              </div>
              {results.map((item, idx) => {
                const isSelected = selectedIndex === idx;
                const cleanSym = item.symbol.toUpperCase().replace(/\.IS$/, '');
                return (
                  <button
                    key={`${cleanSym}-${idx}`}
                    type="button"
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between group",
                      isSelected
                        ? "bg-[#00008B] text-white shadow-sm"
                        : "hover:bg-blue-50/70 text-slate-800"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 transition-colors",
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-blue-100/70 text-[#00008B]"
                        )}
                      >
                        {cleanSym.substring(0, 3)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "font-black text-xs tracking-tight",
                              isSelected ? "text-white" : "text-[#00008B]"
                            )}
                          >
                            {cleanSym}
                          </span>
                          {item.sector && (
                            <span
                              className={cn(
                                "text-[9px] font-bold px-1.5 py-0.5 rounded-md",
                                isSelected
                                  ? "bg-white/20 text-white"
                                  : "bg-slate-100 text-slate-500"
                              )}
                            >
                              {item.sector}
                            </span>
                          )}
                        </div>
                        <p
                          className={cn(
                            "text-[11px] font-medium truncate mt-0.5",
                            isSelected ? "text-white/80" : "text-slate-500"
                          )}
                        >
                          {item.shortname || item.longname || cleanSym}
                        </p>
                      </div>
                    </div>

                    <ChevronRight
                      className={cn(
                        "w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5",
                        isSelected ? "text-white" : "text-slate-300"
                      )}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
