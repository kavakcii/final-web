"use client";

import { AuthComponent } from "@/components/ui/sign-up";
import { TrendingUp } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-black">
            <Navbar />
            <div className="flex items-center justify-center pt-20">
                <AuthComponent
                    logo={<div className="bg-blue-500 text-white rounded-md p-1.5"><TrendingUp className="w-4 h-4" /></div>}
                    brandName="FinAi"
                    className="w-full"
                    isTransparent={true}
                />
            </div>
        </div>
    );
}
