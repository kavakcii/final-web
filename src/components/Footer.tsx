import Link from "next/link";
import Image from "next/image";
import { Instagram } from "lucide-react";
import { FinAiLogo } from "@/components/ui/logo";
export default function Footer() {
    return (
        <footer className="bg-white border-t border-slate-100 mt-auto text-[#00008B]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center">
                            <FinAiLogo className="h-12 w-auto" />
                        </div>
                        <p className="text-sm text-[#00008B] font-medium leading-relaxed">
                            BIST ve TEFAS portföyünüzü AI destekli analizlerle
                            tek bir panoda yönetin.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-bold mb-4 text-[#00008B]">Ürün</h3>
                        <ul className="space-y-2 text-sm text-[#00008B] font-medium">
                            <li><Link href="#features" className="hover:underline transition-colors opacity-90 hover:opacity-100">Özellikler</Link></li>
                            <li><Link href="/login" className="hover:underline transition-colors opacity-90 hover:opacity-100">Giriş Yap</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold mb-4 text-[#00008B]">Şirket</h3>
                        <ul className="space-y-2 text-sm text-[#00008B] font-medium">
                            <li><Link href="#hero" className="hover:underline transition-colors opacity-90 hover:opacity-100">Hakkımızda</Link></li>
                            <li><Link href="#" className="hover:underline transition-colors opacity-90 hover:opacity-100">Kullanım Şartları</Link></li>
                            <li><Link href="#" className="hover:underline transition-colors opacity-90 hover:opacity-100">KVKK Aydınlatma Metni</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold mb-4 text-[#00008B]">Takip Et</h3>
                        <div className="flex space-x-4">
                            <Link 
                                href="https://www.instagram.com/finai.net.tr/" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="transition-all hover:scale-110"
                            >
                                <div className="p-2 rounded-xl bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white shadow-md shadow-[#ee2a7b]/20">
                                    <Instagram className="w-5 h-5" />
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100 text-center text-xs text-[#00008B] font-bold uppercase tracking-widest opacity-40">
                    © {new Date().getFullYear()} FinAi. Tüm hakları saklıdır.
                </div>
            </div>
        </footer>
    );
}
