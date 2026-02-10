'use client';

import React from 'react';
import {
    Activity,
    LineChart,
    PieChart,
    TrendingUp,
    Shield,
    Wallet,
    Home,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Dock, DockIcon, DockItem, DockLabel } from '@/components/ui/dock';

const data = [
    {
        title: 'Ana Sayfa',
        icon: (
            <Home className='h-full w-full text-slate-300 group-hover:text-blue-400' />
        ),
        href: '/',
    },
    {
        title: 'Piyasalar',
        icon: (
            <LineChart className='h-full w-full text-slate-300 group-hover:text-blue-400' />
        ),
        href: '#features',
    },
    {
        title: 'Portföy',
        icon: (
            <PieChart className='h-full w-full text-slate-300 group-hover:text-blue-400' />
        ),
        href: '/dashboard',
    },
    {
        title: 'Stratejiler',
        icon: (
            <Activity className='h-full w-full text-slate-300 group-hover:text-blue-400' />
        ),
        href: '/dashboard/strategies',
    },
    {
        title: 'Risk Analizi',
        icon: (
            <Shield className='h-full w-full text-slate-300 group-hover:text-blue-400' />
        ),
        href: '/dashboard/risk',
    },
    {
        title: 'Varlıklarım',
        icon: (
            <Wallet className='h-full w-full text-slate-300 group-hover:text-blue-400' />
        ),
        href: '/dashboard/portfolio',
    },
    {
        title: 'Yükselenler',
        icon: (
            <TrendingUp className='h-full w-full text-slate-300 group-hover:text-blue-400' />
        ),
        href: '#stats',
    },
];

export function NavbarDock() {
    const router = useRouter();

    return (
        <div className='fixed top-2 left-1/2 -translate-x-1/2 z-[100] group p-4'>
            <Dock className='items-center pb-2 pt-2 rounded-full bg-[#0a192f]/10 group-hover:bg-[#0a192f]/95 border border-blue-900/10 group-hover:border-blue-900/50 shadow-none group-hover:shadow-2xl backdrop-blur-[2px] group-hover:backdrop-blur-md overflow-visible transition-all duration-300 ease-out'>
                {data.map((item, idx) => (
                    <DockItem
                        key={idx}
                        className='aspect-square rounded-full bg-slate-800/10 group-hover:bg-slate-800/40 hover:!bg-slate-700/80 border border-blue-900/10 group-hover:border-blue-900/30'
                    >
                        <DockIcon>
                            <div onClick={() => router.push(item.href)} className="w-full h-full p-1 cursor-pointer group flex items-center justify-center">
                                {item.icon}
                            </div>
                        </DockIcon>
                    </DockItem>
                ))}
            </Dock>
        </div>
    );
}
