import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, FileText, Scale } from 'lucide-react';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans selection:bg-blue-100">
      {/* Background decoration */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-50 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-50 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <Link 
          href="/login?tab=register" 
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mb-8 group"
        >
          <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center bg-white group-hover:border-slate-900 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Kayıt Sayfasına Dön
        </Link>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden mb-12">
          <div className="p-8 sm:p-12 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Yasal Metinler</h1>
                <p className="text-slate-500 font-medium tracking-wide text-sm mt-1 uppercase">FinAi Kullanıcı Bilgilendirme Merkezi</p>
              </div>
            </div>

            <nav className="flex gap-4">
              <Link 
                href="/legal/terms" 
                className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:border-slate-900 transition-all shadow-sm"
              >
                Kullanım Koşulları
              </Link>
              <Link 
                href="/legal/kvkk" 
                className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:border-slate-900 transition-all shadow-sm"
              >
                KVKK Aydınlatma Metni
              </Link>
            </nav>
          </div>

          <div className="p-8 sm:p-12 prose prose-slate max-w-none prose-headings:font-black prose-headings:tracking-tight prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600 prose-strong:text-slate-900">
            {children}
          </div>
        </div>

        <footer className="text-center text-slate-400 text-sm font-medium">
          <p>© {new Date().getFullYear()} FinAi. Tüm hakları saklıdır.</p>
        </footer>
      </div>
    </div>
  );
}
