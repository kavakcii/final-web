// components/ui/ruixen-accordian02.tsx

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

export default function Accordion_02() {
    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-20 relative z-10">
            <div className="flex flex-col md:flex-row gap-12 items-start">
                {/* Left Column */}
                <div className="md:w-1/2">
                    <h2 className="text-4xl font-bold mb-4 text-white">Sorularınız mı var?</h2>
                    <p className="text-slate-400 text-lg">
                        Sistemin nasıl çalıştığını anlamanıza yardımcı olmak için buradayız. Hala aklınıza takılanlar varsa, bizimle{" "}
                        <a href="#" className="underline text-blue-400 hover:text-blue-300">
                            iletişime geçmekten
                        </a>
                        {" "}çekinmeyin.
                    </p>
                </div>

                {/* Right Column */}
                <div className="md:w-1/2 space-y-10">
                    {/* General Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-blue-500 mb-2">
                            Genel
                        </h3>
                        <Accordion type="multiple" className="w-full">
                            <AccordionItem value="gen-1">
                                <AccordionTrigger className="text-slate-200">
                                    Bu platformun amacı nedir?
                                </AccordionTrigger>
                                <AccordionContent>
                                    Platformumuz, otomasyon ve yapay zeka destekli araçlar kullanarak iş akışınızı basitleştirmek ve her hafta saatlerce zaman kazanmanızı sağlamak için tasarlanmıştır.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="gen-2">
                                <AccordionTrigger className="text-slate-200">
                                    Bu hizmet dünya çapında mevcut mu?
                                </AccordionTrigger>
                                <AccordionContent>
                                    Evet, dünya genelindeki kullanıcıları destekliyoruz. Bazı bölgesel özellikler değişiklik gösterebilir.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>

                    {/* Billing Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-blue-500 mb-2">
                            Ödeme ve Üyelik
                        </h3>
                        <Accordion type="multiple" className="w-full">
                            <AccordionItem value="bill-1">
                                <AccordionTrigger className="text-slate-200">
                                    İade politikanız var mı?
                                </AccordionTrigger>
                                <AccordionContent>
                                    Evet, 7 günlük iade politikamız var. Memnun kalmazsanız, bu süre içinde destek ekibimizle iletişime geçmeniz yeterlidir.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="bill-2">
                                <AccordionTrigger className="text-slate-200">
                                    Planımı daha sonra değiştirebilir miyim?
                                </AccordionTrigger>
                                <AccordionContent>
                                    Kesinlikle! İstediğiniz zaman hesap panelinizden planınızı yükseltebilir veya düşürebilirsiniz.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>

                    {/* Technical Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-blue-500 mb-2">
                            Teknik Detaylar
                        </h3>
                        <Accordion type="multiple" className="w-full">
                            <AccordionItem value="tech-1">
                                <AccordionTrigger className="text-slate-200">
                                    Diğer araçlarla entegrasyon sağlıyor mu?
                                </AccordionTrigger>
                                <AccordionContent>
                                    Evet! Slack, Notion, Zapier ve daha birçok araçla entegrasyonu destekliyoruz.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="tech-2">
                                <AccordionTrigger className="text-slate-200">
                                    API desteği var mı?
                                </AccordionTrigger>
                                <AccordionContent>
                                    Evet, tüm Pro kullanıcıları için genel API'miz mevcuttur. Dokümantasyona geliştirici portalından ulaşabilirsiniz.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </div>
            </div>
        </div>
    )
}
