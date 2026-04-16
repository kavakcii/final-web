import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  initialTab?: 'terms' | 'kvkk';
}

export const LegalModal = ({ isOpen, onClose, onApprove, onReject, initialTab = 'terms' }: LegalModalProps) => {
  const [activeTab, setActiveTab] = React.useState<'terms' | 'kvkk'>(initialTab);

  // Modal her açıldığında gelen initialTab'e göre güncelle
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

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
            {/* Header with Tabs */}
            <div className="border-b border-slate-100 bg-slate-50/50">
              <div className="p-6 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#00008B] flex items-center justify-center shadow-lg">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-900 tracking-tight text-lg">Yasal Bilgilendirme</h2>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-all"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="flex px-6 gap-6">
                <button 
                  onClick={() => setActiveTab('terms')}
                  className={`py-4 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'terms' ? 'border-[#00008B] text-[#00008B]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  Kullanım Koşulları
                </button>
                <button 
                  onClick={() => setActiveTab('kvkk')}
                  className={`py-4 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'kvkk' ? 'border-[#00008B] text-[#00008B]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  KVKK Metni
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <AnimatePresence mode="wait">
                {activeTab === 'terms' ? (
                  <motion.div 
                    key="terms"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-6 text-slate-600 text-[13px] leading-relaxed"
                  >
                    <div className="space-y-4">
                      <h3 className="text-base font-black text-slate-900">Kullanım Koşulları</h3>
                      <h4 className="font-bold text-slate-900">1. Hizmet Kapsamı</h4>
                      <p>FinAi, yatırım kararlarınıza destek amaçlı bilgi sunan bir yapay zeka platformudur.</p>
                      <div className="bg-red-50 p-4 rounded-xl border border-red-100 font-bold text-red-800 text-[11px]">
                        ⚠️ YASAL UYARI: Platformdaki hiçbir içerik yatırım danışmanlığı kapsamında değildir.
                      </div>
                      <h4 className="font-bold text-slate-900">2. Sorumluluk Reddi</h4>
                      <p>Piyasa verilerindeki gecikmeler veya yanlışlıklardan FinAi sorumlu tutulamaz.</p>
                      <h4 className="font-bold text-slate-900">3. Fikri Mülkiyet</h4>
                      <p>Sunulan analiz algoritmaları ve tasarım FinAi'nin fikri mülkiyetidir.</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="kvkk"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-6 text-slate-600 text-[13px] leading-relaxed"
                  >
                    <div className="space-y-4">
                      <h3 className="text-base font-black text-slate-900">KVKK Aydınlatma Metni</h3>
                      <p>FinAi olarak kişisel verilerinizi 6698 sayılı KVKK uyarınca işliyoruz.</p>
                      <h4 className="font-bold text-slate-900">İşlenen Veriler:</h4>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>Kimlik ve İletişim bilgileri</li>
                        <li>Portföy içerikleri</li>
                      </ul>
                      <h4 className="font-bold text-slate-900">Veri İşleme Amacı:</h4>
                      <p>Portföy analizi yapmak ve yasal yükümlülüklerimizi yerine getirmek. Verileriniz yüksek güvenlik standartlarıyla korunmaktadır.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 flex gap-4 items-center justify-end bg-slate-50/30">
              <button 
                onClick={onReject || onClose}
                className="px-6 py-3 rounded-xl text-slate-500 font-bold text-sm hover:text-slate-900 transition-all active:scale-95"
              >
                Vazgeç
              </button>
              <button 
                onClick={onApprove}
                className="px-10 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
              >
                Onaylıyorum
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
