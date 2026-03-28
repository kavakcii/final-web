"use client";

import { AuthComponent } from "@/components/ui/sign-up";
import { Suspense } from "react";
import { Loader } from "lucide-react";

export default function LoginPage() {
    return (
        <main className="flex min-h-screen w-full bg-white dark:bg-[#020817]">
            <Suspense fallback={
                <div className="flex w-full min-h-screen items-center justify-center bg-white dark:bg-[#020817]">
                    <Loader className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            }>
                <AuthComponent
                    brandName="FinAi"
                    className="w-full"
                />
            </Suspense>
        </main>
    );
}
