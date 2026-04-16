import React from 'react';

export default function KVKKPage() {
  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-3xl font-black text-slate-900 border-b-4 border-slate-100 pb-2 mb-6 tracking-tight">KVKK Aydınlatma Metni</h1>
        <p>
          FinAi ("Şirket") olarak, kullanıcılarımızın kişisel verilerinin korunmasına ve gizliliğine büyük önem veriyoruz. 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, veri sorumlusu sıfatıyla sizi bilgilendirmek isteriz.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-black text-slate-900 border-b-2 border-slate-100 pb-2 mb-6">1. İşlenen Kişisel Verileriniz</h2>
        <ul className="list-disc pl-6 space-y-4">
          <li><strong>Kimlik Verileri:</strong> Ad, soyad.</li>
          <li><strong>İletişim Verileri:</strong> E-posta adresi, telefon numarası.</li>
          <li><strong>Finansal Veriler:</strong> Portföy verileri (BIST hisseleri, TEFAS fonları), yatırım tutarları (analiz amaçlı kullanıcı girişiyle).</li>
          <li><strong>İşlem Güvenliği Verileri:</strong> Giriş zamanları, IP adresi.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-black text-slate-900 border-b-2 border-slate-100 pb-2 mb-6">2. Veri İşleme Amaçları</h2>
        <p>Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
        <ul className="list-disc pl-6 space-y-4">
          <li>Platform hizmetlerinin sunulması ve üyelik süreçlerinin yönetilmesi.</li>
          <li>Yapay zeka asistanı aracılığıyla portföy analizlerinin yapılması.</li>
          <li>Portföy performans takibi ve raporlama hizmetlerinin sağlanması.</li>
          <li>Yasal yükümlülüklerin yerine getirilmesi.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-black text-slate-900 border-b-2 border-slate-100 pb-2 mb-6">3. Verilerin Saklanması ve Aktarımı</h2>
        <p>
          Verileriniz, güvenli sunucularımızda ve hizmet sağlayıcılarımız (Supabase vb.) bünyesinde, KVKK'ya uygun teknik ve idari tedbirlerle saklanmaktadır. Verileriniz, yasal zorunluluklar haricinde üçüncü şahıslara ticari amaçlarla satılmamaktadır.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-black text-slate-900 border-b-2 border-slate-100 pb-2 mb-6">4. Kullanıcı Hakları</h2>
        <p>KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
        <ul className="list-disc pl-6 space-y-4">
          <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme.</li>
          <li>Hangi verilerinizin işlendiği konusunda bilgi talep etme.</li>
          <li>Yanlış veya eksik işlenmiş verilerin düzeltilmesini talep etme.</li>
          <li>Kişisel verilerinizin silinmesini veya yok edilmesini talep etme.</li>
        </ul>
      </section>

      <div className="text-slate-400 text-xs italic mt-12 border-t pt-8">
        Veri Sorumlusu: FinAi Ekibi / Salih KAVAKCI<br/>
        İletişim: destek@finai.com.tr
      </div>
    </div>
  );
}
