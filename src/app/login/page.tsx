"use client";

import { AuthComponent } from "@/components/ui/sign-up";

export default function LoginPage() {
    return (
        <main className="flex min-h-screen w-full bg-white dark:bg-[#020817]">
            <AuthComponent
                brandName="FinAi"
                className="w-full"
            />
        </main>
    );
}
