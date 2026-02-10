"use client";

import { useEffect } from "react";
import { NotFound } from "@/components/ui/not-found-2";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
            <NotFound />
            <div className="mt-4 flex flex-col items-center gap-4">
                <p className="text-sm text-slate-400 max-w-md text-center">
                    Beklenmedik bir hata oluştu. Lütfen tekrar deneyiniz.
                </p>
                <Button
                    onClick={() => reset()}
                    variant="outline"
                    className="border-blue-500/20 text-blue-400 hover:bg-blue-500/10 active:scale-95 transition-all"
                >
                    Tekrar Dene
                </Button>
            </div>
        </div>
    );
}
