import React from 'react';

export default function FontDemo() {
  const sampleHeading = "Bütünleşik Portföy Kontrolü";
  const sampleSubheading = "Sistem Nasıl Çalışır?";
  const sampleText = "Hisse, Altın ve Fonlarınızı tek bir akıllı ekranda birleştirin. Karmaşıklığı değil, hızı ve sadeliği deneyimleyin.";

  // Font options string map
  const fontOptions = [
    {
      name: "Playfair Display",
      family: "'Playfair Display', serif",
      description: "Son derece premium, Apple'ın sevdiği lüks bir Serif. İtalikleri muazzam klas durur.",
    },
    {
      name: "Cormorant Garamond",
      family: "'Cormorant Garamond', serif",
      description: "Çok zarif, ince ve sofistike. Klasik finans ve lüks dergilerin bir numaralı tercihi.",
    },
    {
      name: "Lora",
      family: "'Lora', serif",
      description: "Modern ve okunaklı. Hem dijital hem de klasik ruhu birleştiren dengeli Serif.",
    },
    {
      name: "EB Garamond",
      family: "'EB Garamond', serif",
      description: "Geleneksel ve son derece ciddi. Asil bir tarihsel dokusu var.",
    },
    {
      name: "Merriweather",
      family: "'Merriweather', serif",
      description: "Ekranda kusursuz okunurluk sunan, hafif kalın yapıya sahip güçlü bir italik.",
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-20 px-4 flex flex-col items-center font-sans text-slate-900">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,600&family=EB+Garamond:ital,wght@1,600&family=Lora:ital,wght@1,600&family=Merriweather:ital,wght@1,400&family=Playfair+Display:ital,wght@1,600&display=swap" rel="stylesheet" />

      <div className="max-w-4xl w-full">
        <div className="text-center mb-16">
          <h1 className="text-3xl font-bold bg-[#0a192f] text-white py-4 px-8 rounded-2xl inline-block shadow-xl">
            FinAi Profesyonel İtalik Font Seçimi
          </h1>
          <p className="mt-4 text-slate-500 font-medium">Lütfen aşağıdaki fontlardan markamıza en uygun olanını seçip bana ismini söyleyin.</p>
        </div>

        <div className="grid gap-12">
          {fontOptions.map((font, idx) => (
            <div key={idx} className="bg-white p-8 md:p-12 rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100 relative overflow-hidden group hover:border-[#0a192f]/20 transition-all">
              
              {/* Etiket */}
              <div className="absolute top-0 right-0 bg-[#0a192f] text-white text-xs font-bold px-4 py-2 rounded-bl-2xl">
                Seçenek {idx + 1}
              </div>

              <div className="mb-6 border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-blue-600">{font.name}</h2>
                <p className="text-sm text-slate-500 mt-1">{font.description}</p>
              </div>

              {/* Demo Preview */}
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Ana Başlık (How it works)</span>
                  <h2 
                    className="text-4xl md:text-5xl text-[#0a192f] italic font-semibold"
                    style={{ fontFamily: font.family }}
                  >
                    {sampleSubheading}
                  </h2>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Özellik Başlığı</span>
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-[#0a192f] text-white flex items-center justify-center font-bold font-sans">✓</div>
                     <h3 
                        className="text-2xl md:text-3xl text-[#0a192f] italic font-semibold"
                        style={{ fontFamily: font.family }}
                      >
                        {sampleHeading}
                      </h3>
                  </div>
                </div>

                <div>
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">İçerik Metni (Mevcut Sans-Serif Font ile uyumu)</span>
                   <p className="text-base md:text-lg text-slate-500 font-medium leading-relaxed font-sans max-w-2xl pl-14">
                      {sampleText}
                   </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
