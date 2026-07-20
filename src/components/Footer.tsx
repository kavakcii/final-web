import Link from "next/link";
import Image from "next/image";
import { Instagram } from "lucide-react";
import { FinAiLogo } from "@/components/ui/logo";

export default function Footer() {
    return (
        <footer className="bg-[#00008B] mt-auto text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center">
                            <FinAiLogo className="h-12 w-auto [&_span]:text-white" />
                        </div>
                        <p className="text-sm text-white/80 font-medium leading-relaxed">
                            BIST ve TEFAS portföyünüzü AI destekli analizlerle
                            tek bir panoda yönetin.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-bold mb-4 text-white">Ürün</h3>
                        <ul className="space-y-2 text-sm text-white/80 font-medium">
                            <li><Link href="#features" className="hover:underline transition-colors text-white/80 hover:text-white">Özellikler</Link></li>
                            <li><Link href="/login" className="hover:underline transition-colors text-white/80 hover:text-white">Giriş Yap</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold mb-4 text-white">Şirket</h3>
                        <ul className="space-y-2 text-sm text-white/80 font-medium">
                            <li><Link href="#hero" className="hover:underline transition-colors text-white/80 hover:text-white">Hakkımızda</Link></li>
                            <li><Link href="#" className="hover:underline transition-colors text-white/80 hover:text-white">Kullanım Şartları</Link></li>
                            <li><Link href="#" className="hover:underline transition-colors text-white/80 hover:text-white">KVKK Aydınlatma Metni</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold mb-4 text-white">Takip Et</h3>
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
            </div>

            {/* Alt Telif Yazısı (İnce Çizgisiz, Bütünleşik Mavi Arka Plan) */}
            <div className="py-6 px-4 text-center text-xs text-white/60 font-bold uppercase tracking-widest bg-[#00008B]">
                © {new Date().getFullYear()} FinAi. Tüm hakları saklıdır.
            </div>
        </footer>
    );
}
