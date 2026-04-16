import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, FileText, Scale } from 'lucide-react';
import { cn } from "@/lib/utils";

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (tab: 'terms' | 'kvkk') => void;
  onReject?: () => void;
  initialTab?: 'terms' | 'kvkk';
}

export const LegalModal = ({ isOpen, onClose, onApprove, onReject, initialTab = 'terms' }: LegalModalProps) => {
  const [activeTab, setActiveTab] = React.useState<'terms' | 'kvkk'>(initialTab);

  // Sync internal state when initialTab changes from external flow
  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  const termsContent = (
    <div className="space-y-6 text-slate-600 text-[13px] leading-relaxed">
      <h3 className="text-lg font-black text-slate-900 border-b-2 border-slate-100 pb-2">1. Hizmet Kapsamı</h3>
      <p>FinAi, yatırım kararlarınıza destek amaçlı bilgi sunan bir yapay zeka platformudur.</p>
      
      <div className="bg-red-50 p-4 rounded-xl border border-red-100 font-bold text-red-800 text-[11px]">
        ⚠️ YASAL UYARI: Platformdaki hiçbir içerik yatırım danışmanlığı kapsamında değildir.
      </div>

      <h3 className="text-lg font-black text-slate-900 border-b-2 border-slate-100 pb-2">2. Sorumluluk Reddi</h3>
      <p>Piyasa verilerindeki (BIST/TEFAS) gecikmeler veya yanlışlıklardan FinAi sorumlu tutulamaz. Yatırım kararlarınız tamamen kendi sorumluluğunuzdadır.</p>
      
      <h3 className="text-lg font-black text-slate-900 border-b-2 border-slate-100 pb-2">3. Fikri Mülkiyet</h3>
      <p>Sunulan analiz algoritmaları, yazılım kodları ve tasarım FinAi'nin fikri mülkiyetidir.</p>
    </div>
  );

  const kvkkContent = (
    <div className="space-y-6 text-slate-600 text-[13px] leading-relaxed">
      <h3 className="text-lg font-black text-slate-900 border-b-2 border-slate-100 pb-2">KVKK Aydınlatma Metni</h3>
      <p>FinAi olarak kişisel verilerinizi 6698 sayılı KVKK uyarınca işliyoruz.</p>
      
      <h4 className="font-bold text-slate-900">İşlenen Veriler:</h4>
      <ul className="list-disc pl-5 space-y-2">
        <li>Kimlik bilgileri (Ad, Soyad)</li>
        <li>İletişim bilgileri (E-posta, Telefon)</li>
        <li>Hisse ve Fon portföy içerikleri</li>
      </ul>

      <h4 className="font-bold text-slate-900">Veri İşleme Amacı:</h4>
      <p>Portföy analizi yapmak, performans raporları sunmak ve yasal yükümlülüklerimizi yerine getirmek. Verileriniz güvenle saklanmaktadır.</p>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-white/40"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00008B] flex items-center justify-center shadow-lg">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-black text-slate-900 tracking-tight">Yasal Bilgilendirme</h2>
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-0.5">FinAi Bilgi Merkezi</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex p-2 bg-slate-100/50 gap-1 border-b border-slate-100">
              <button 
                onClick={() => setActiveTab('terms')}
                className={cn(
                  "flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                  activeTab === 'terms' ? "bg-white text-[#00008B] shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <FileText className="w-4 h-4" />
                Kullanım Koşulları
              </button>
              <button 
                onClick={() => setActiveTab('kvkk')}
                className={cn(
                  "flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                  activeTab === 'kvkk' ? "bg-white text-[#00008B] shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <Scale className="w-4 h-4" />
                KVKK Aydınlatma
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {activeTab === 'terms' ? termsContent : kvkkContent}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 flex gap-4 items-center justify-end">
              <button 
                onClick={onReject || onClose}
                className="px-6 py-3 rounded-xl text-slate-500 font-bold text-sm hover:text-slate-900 transition-all active:scale-95"
              >
                Reddet
              </button>
              <button 
                onClick={() => onApprove?.(activeTab)}
                className="px-10 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
              >
                Okudum, Onaylıyorum
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

