"use client";

import PortfolioContent from "@/components/PortfolioContent";
import { Suspense } from "react";

export default function Page() {
    return (
        <div className="w-full bg-transparent">
            <Suspense fallback={
                <div className="flex items-center justify-center p-12 text-[#00008B] font-bold text-sm">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00008B] mr-3"></div>
                    Portföy yükleniyor...
                </div>
            }>
                <PortfolioContent />
            </Suspense>
        </div>
    );
}
