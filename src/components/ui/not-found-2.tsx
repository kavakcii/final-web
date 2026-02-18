"use client";

import { Button } from "@/components/ui/button";
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyTitle,
} from "@/components/ui/empty";
import { HomeIcon, CompassIcon } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/components/providers/UserProvider";
import { useState, useEffect } from "react";

export function NotFound() {
    const user = useUser();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        if (user) {
            setIsAuthenticated(user.isAuthenticated ?? false);
        }
    }, [user]);

    return (
        <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-black">
            <Empty>
                <EmptyHeader>
                    <EmptyTitle className="font-extrabold text-9xl bg-clip-text text-transparent bg-gradient-to-b from-white to-white/20">
                        404
                    </EmptyTitle>
                </EmptyHeader>
                <EmptyContent>
                    <div className="flex gap-2">
                        <Button asChild className="bg-blue-600 hover:bg-blue-500 transition-all active:scale-95">
                            <Link href="/">
                                <HomeIcon
                                    className="size-4 mr-2" data-icon="inline-start" />
                                Ana Sayfa
                            </Link>
                        </Button>

                        <Button asChild variant="outline" className="border-white/10 text-white hover:bg-white/5 transition-all active:scale-95">
                            <Link href={isAuthenticated ? "/dashboard" : "/login"}>
                                <CompassIcon
                                    className="size-4 mr-2"
                                    data-icon="inline-start" />{" "}
                                {isAuthenticated ? "Dashboard" : "Giriş Yap"}
                            </Link>
                        </Button>
                    </div>
                </EmptyContent>
            </Empty>
        </div>
    );
}
