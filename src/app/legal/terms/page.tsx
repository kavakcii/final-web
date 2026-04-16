import React from 'react';

export default function TermsOfUse() {
  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-2xl font-black text-slate-900 border-b-4 border-slate-100 pb-2 mb-6">1. Hizmet Kapsamı ve Kabul</h2>
        <p>
          İşbu Kullanım Koşulları ("Koşullar"), FinAi ("Platform") tarafından sunulan tüm hizmetlerin kullanımını düzenler. Platforma erişim sağlayarak veya kayıt olarak, bu koşulları bütünüyle kabul etmiş sayılırsınız. 
        </p>
      </section>

      <section className="bg-red-50 p-6 rounded-2xl border border-red-100">
        <h2 className="text-xl font-bold text-red-900 mb-4 flex items-center gap-2">⚠️ ÖNEMLİ YASAL UYARI</h2>
        <p className="text-red-800 text-sm font-semibold leading-relaxed m-0">
          Platformumuzda yer alan bilgiler, tahminler, analizler ve yapay zeka tarafından sunulan raporlar <strong>kesinlikle yatırım danışmanlığı kapsamında değildir.</strong> FinAi, 6362 sayılı Sermaye Piyasası Kanunu ve ilgili mevzuat uyarınca yatırım danışmanlığı faaliyeti yürütmemektedir. Sunulan veriler kullanıcıları bilgilendirme amaçlı olup, yatırım kararları tamamen kullanıcının sorumluluğundadır.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-black text-slate-900 border-b-4 border-slate-100 pb-2 mb-6">2. Kullanıcı Sorumlulukları</h2>
        <ul className="list-disc pl-6 space-y-4">
          <li>Kullanıcı, platformda oluşturduğu hesabın güvenliğinden kendisi sorumludur.</li>
          <li>Platform üzerinden erişilen verilerin (BIST, TEFAS vb.) doğruluğu için azami gayret gösterilse de, veri sağlayıcılardan kaynaklanan gecikmelerden FinAi sorumlu tutulamaz.</li>
          <li>Kullanıcılar, platformu yalnızca yasal amaçlar doğrultusunda kullanmayı taahhüt eder.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-black text-slate-900 border-b-4 border-slate-100 pb-2 mb-6">3. Fikri Mülkiyet Hakları</h2>
        <p>
          Logo, tasarım, yazılım kodları ve Platform tarafından üretilen özel analiz algoritmaları FinAi'nin fikri mülkiyetidir. İzinsiz kopyalanması, çoğaltılması veya ticari amaçla kullanılması yasaktır.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-black text-slate-900 border-b-4 border-slate-100 pb-2 mb-6">4. Değişiklikler</h2>
        <p>
          FinAi, işbu kullanım koşullarını dilediği zaman güncelleme hakkını saklı tutar. Güncellemeler Platform üzerinden yayınlandığı andan itibaren geçerlilik kazanır.
        </p>
      </section>

      <div className="text-slate-400 text-xs italic mt-12 border-t pt-8">
        Son güncelleme tarihi: 16 Nisan 2026
      </div>
    </div>
  );
}
