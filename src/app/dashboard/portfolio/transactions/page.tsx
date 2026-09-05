"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { 
    ArrowLeft, 
    TrendingUp, 
    TrendingDown, 
    Coins, 
    Calendar, 
    Filter, 
    RefreshCw, 
    Search,
    FileSpreadsheet
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionRow {
    id: string;
    transaction_type: "BUY" | "SELL" | "OPENING_BALANCE" | "CASH_DEPOSIT" | "CASH_WITHDRAW" | "REVERSAL";
    symbol: string;
    asset_type: string;
    quantity: number;
    unit_price: number;
    gross_amount: number;
    commission_fee: number;
    tax_fee: number;
    net_amount: number;
    cost_basis: number | null;
    realized_pnl: number | null;
    transaction_date: string;
    created_at: string;
}

export default function PortfolioTransactionsPage() {
    const [transactions, setTransactions] = useState<TransactionRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from("portfolio_transactions")
                .select("*")
                .eq("user_id", user.id)
                .order("transaction_date", { ascending: false });

            if (error) {
                console.error("Error fetching portfolio_transactions:", error);
                return;
            }

            if (data) {
                setTransactions(data.map(tx => ({
                    ...tx,
                    quantity: Number(tx.quantity),
                    unit_price: Number(tx.unit_price),
                    gross_amount: Number(tx.gross_amount),
                    commission_fee: Number(tx.commission_fee),
                    tax_fee: Number(tx.tax_fee),
                    net_amount: Number(tx.net_amount),
                    cost_basis: tx.cost_basis !== null ? Number(tx.cost_basis) : null,
                    realized_pnl: tx.realized_pnl !== null ? Number(tx.realized_pnl) : null,
                })));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const formatCurrency = (val: number | null | undefined) => {
        if (val === null || val === undefined || isNaN(val)) return "-";
        return val.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₺";
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    };

    const filteredTransactions = transactions.filter(tx => {
        // Type filter
        if (filterType === "BUY" && tx.transaction_type !== "BUY") return false;
        if (filterType === "SELL" && tx.transaction_type !== "SELL") return false;
        if (filterType === "CASH" && tx.transaction_type !== "CASH_DEPOSIT" && tx.transaction_type !== "CASH_WITHDRAW") return false;
        if (filterType === "OPENING" && tx.transaction_type !== "OPENING_BALANCE") return false;

        // Search query
        if (searchQuery.trim()) {
            const q = searchQuery.toUpperCase();
            if (!tx.symbol.toUpperCase().includes(q) && !tx.transaction_type.toUpperCase().includes(q)) return false;
        }

        // Date range
        if (startDate) {
            const txDate = new Date(tx.transaction_date).getTime();
            const start = new Date(startDate).getTime();
            if (txDate < start) return false;
        }
        if (endDate) {
            const txDate = new Date(tx.transaction_date).getTime();
            const end = new Date(endDate).getTime() + 86400000;
            if (txDate > end) return false;
        }

        return true;
    });

    const getTypeBadge = (type: TransactionRow["transaction_type"]) => {
        switch (type) {
            case "BUY":
                return <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-extrabold text-xs border border-emerald-200/60 inline-flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> AL (BUY)</span>;
            case "SELL":
                return <span className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 font-extrabold text-xs border border-rose-200/60 inline-flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5" /> SAT (SELL)</span>;
            case "CASH_DEPOSIT":
                return <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 font-extrabold text-xs border border-blue-200/60 inline-flex items-center gap-1"><Coins className="w-3.5 h-3.5 text-blue-600" /> Nakit Yatırma</span>;
            case "CASH_WITHDRAW":
                return <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 font-extrabold text-xs border border-amber-200/60 inline-flex items-center gap-1"><Coins className="w-3.5 h-3.5 text-amber-600" /> Nakit Çekme</span>;
            case "OPENING_BALANCE":
                return <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-extrabold text-xs border border-slate-200 inline-flex items-center gap-1">Varlık Tanımlama</span>;
            default:
                return <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">{type}</span>;
        }
    };

    return (
        <div className="p-4 md:p-10 space-y-6 min-h-screen bg-slate-50/50 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div>
                    <Link href="/dashboard/portfolio" className="inline-flex items-center gap-2 text-xs font-bold text-[#00008B] hover:underline mb-2">
                        <ArrowLeft className="w-4 h-4" /> Portföyüme Geri Dön
                    </Link>
                    <h1 className="text-2xl md:text-3xl font-black text-[#00008B] tracking-tight flex items-center gap-3">
                        <FileSpreadsheet className="w-7 h-7 text-blue-600" />
                        Finansal İşlem Geçmişi
                    </h1>
                    <p className="text-xs font-medium text-slate-400 mt-1">
                        Portföyünüzde gerçekleşen tüm AL, SAT, Nakit ve Varlık Tanımlama işlemlerinin resmi kaydı.
                    </p>
                </div>
                <button
                    onClick={fetchTransactions}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#00008B] font-bold rounded-2xl text-xs transition-all active:scale-95 border border-slate-200 shadow-sm"
                >
                    <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    Yenile
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                    {/* Type Filter Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-[#00008B] uppercase tracking-wider mr-2 flex items-center gap-1">
                            <Filter className="w-3.5 h-3.5" /> Filtre:
                        </span>
                        {[
                            { id: "ALL", label: "Tümü" },
                            { id: "BUY", label: "AL (Alımlar)" },
                            { id: "SELL", label: "SAT (Satışlar)" },
                            { id: "CASH", label: "Nakit İşlemleri" },
                            { id: "OPENING", label: "Varlık Tanımlama" }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setFilterType(tab.id)}
                                className={cn(
                                    "px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all border",
                                    filterType === tab.id
                                        ? "bg-[#00008B] text-white border-[#00008B] shadow-sm"
                                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-64">
                        <input
                            type="text"
                            placeholder="Sembol veya tür ara..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-[#00008B] font-bold placeholder:text-slate-400 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#00008B]/20"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                </div>

                {/* Date Filter */}
                <div className="flex items-center gap-3 pt-2 border-t border-slate-100 text-xs font-bold text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1 text-[#00008B]">
                        <Calendar className="w-3.5 h-3.5" /> Tarih Aralığı:
                    </span>
                    <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-[#00008B] focus:outline-none"
                    />
                    <span>-</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-[#00008B] focus:outline-none"
                    />
                    {(startDate || endDate) && (
                        <button
                            onClick={() => { setStartDate(""); setEndDate(""); }}
                            className="text-xs font-bold text-rose-600 hover:underline ml-2"
                        >
                            Tarihleri Temizle
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-extrabold text-[#00008B]/70 uppercase tracking-wider">
                                <th className="py-4 px-6">Tarih</th>
                                <th className="py-4 px-4">İşlem Türü</th>
                                <th className="py-4 px-4">Varlık</th>
                                <th className="py-4 px-4">Miktar</th>
                                <th className="py-4 px-4">Birim Fiyat</th>
                                <th className="py-4 px-4">Net Tutar</th>
                                <th className="py-4 px-4">Komisyon</th>
                                <th className="py-4 px-6 text-right">Gerçekleşen K/Z</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="py-16 text-center text-slate-400 font-bold">
                                        İşlem geçmişi yükleniyor...
                                    </td>
                                </tr>
                            ) : filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-16 text-center text-slate-400 font-bold">
                                        Seçilen filtrelerde herhangi bir finansal işlem kaydı bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="py-4 px-6 font-semibold text-slate-500 text-xs">
                                            {formatDate(tx.transaction_date)}
                                        </td>
                                        <td className="py-4 px-4">
                                            {getTypeBadge(tx.transaction_type)}
                                        </td>
                                        <td className="py-4 px-4 font-black text-[#00008B]">
                                            {tx.symbol}
                                        </td>
                                        <td className="py-4 px-4 font-bold text-slate-700">
                                            {tx.quantity > 0 ? tx.quantity.toLocaleString("tr-TR") : "-"}
                                        </td>
                                        <td className="py-4 px-4 font-semibold text-slate-600">
                                            {tx.unit_price > 0 ? formatCurrency(tx.unit_price) : "-"}
                                        </td>
                                        <td className="py-4 px-4 font-black text-[#00008B]">
                                            {formatCurrency(tx.net_amount)}
                                        </td>
                                        <td className="py-4 px-4 font-semibold text-slate-500">
                                            {tx.commission_fee > 0 ? formatCurrency(tx.commission_fee) : "0,00 ₺"}
                                        </td>
                                        <td className="py-4 px-6 text-right font-black">
                                            {tx.realized_pnl !== null ? (
                                                <span className={cn(tx.realized_pnl >= 0 ? "text-emerald-700" : "text-rose-600")}>
                                                    {tx.realized_pnl >= 0 ? "+" : ""}{formatCurrency(tx.realized_pnl)}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 font-normal">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
