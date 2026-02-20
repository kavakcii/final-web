import Link from "next/link";
import Image from "next/image";
import { Twitter, Linkedin, Instagram } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-[#0a192f] border-t border-blue-900 mt-auto text-slate-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Image src="/logo.png" alt="FinAi" width={32} height={32} className="rounded" />
                            <span className="text-xl font-bold text-white">FinAi</span>
                        </div>
                        <p className="text-sm text-slate-400">
                            Yapay zeka destekli yatırım asistanınız ile finansal geleceğinizi
                            güvence altına alın.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4 text-white">Ürün</h3>
                        <ul className="space-y-2 text-sm text-slate-400">
                            <li><Link href="#features" className="hover:text-blue-400 transition-colors">Özellikler</Link></li>
                            <li><Link href="#pricing" className="hover:text-blue-400 transition-colors">Fiyatlandırma</Link></li>
                            <li><Link href="/dashboard" className="hover:text-blue-400 transition-colors">Giriş Yap</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4 text-white">Şirket</h3>
                        <ul className="space-y-2 text-sm text-slate-400">
                            <li><Link href="#" className="hover:text-blue-400 transition-colors">Hakkımızda</Link></li>
                            <li><Link href="#" className="hover:text-blue-400 transition-colors">İletişim</Link></li>
                            <li><Link href="#" className="hover:text-blue-400 transition-colors">Gizlilik Politikası</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4 text-white">Takip Et</h3>
                        <div className="flex space-x-4">
                            <Link href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                                <Twitter className="w-5 h-5" />
                            </Link>
                            <Link href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                                <Linkedin className="w-5 h-5" />
                            </Link>
                            <Link href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                                <Instagram className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-blue-900/50 text-center text-sm text-slate-500">
                    © {new Date().getFullYear()} FinAi. Tüm hakları saklıdır.
                </div>
            </div>
        </footer>
    );
}
