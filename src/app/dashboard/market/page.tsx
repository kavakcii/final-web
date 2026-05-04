"use client";

// Vercel Deploy Trigger: v2 - Fixed Pie Chart
import { useState, useEffect } from "react";
import { ArrowRight, CheckCircle2, ChevronRight, PieChart, ShieldCheck, Target, Zap, RotateCcw, Trophy, User, Brain, Loader2, X, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PortfolioService, Asset } from "@/lib/portfolio-service";
import { BehavioralTest } from "@/components/BehavioralTest";
import { analyzeInvestorProfile } from "@/lib/behavioral-engine";

export default function MarketPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [testStarted, setTestStarted] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [showResults, setShowResults] = useState(false);

    // Random Funds Analysis State
    const [randomFunds, setRandomFunds] = useState<Asset[]>([]);
    const [analysisModal, setAnalysisModal] = useState<{ isOpen: boolean; loading: boolean; content: string; title: string }>({
        isOpen: false,
        loading: false,
        content: "",
        title: ""
    });

    // Load saved results and random funds on mount
    useEffect(() => {
        const initData = async () => {
            // Load saved answers
            const savedAnswers = localStorage.getItem("portfolio_answers");
            if (savedAnswers) {
                try {
                    const parsed = JSON.parse(savedAnswers);
                    if (Object.keys(parsed).length > 0) {
                        setAnswers(parsed);
                        setShowResults(true);
                        setTestStarted(true);
                    }
                } catch (e) {
                    console.error("Failed to load saved answers", e);
                }
            }

            // Fetch random funds
            try {
                const assets = await PortfolioService.getAssets();
                const funds = assets.filter(a => a.type === "FUND");
                // Shuffle and pick 4
                const shuffled = funds.sort(() => 0.5 - Math.random());
                setRandomFunds(shuffled.slice(0, 4));
            } catch (error) {
                console.error("Failed to fetch funds", error);
            }

            setIsLoading(false);
        };

        initData();
    }, []);

    const handleAnalyzeFunds = async () => {
        if (randomFunds.length === 0) return;

        setAnalysisModal({ isOpen: true, loading: true, content: "", title: "Fon Portföy Analizi" });

        try {
            // Create a summary prompt for all 4 funds
            const symbols = randomFunds.map(f => f.symbol).join(", ");
            const prompt = `Aşağıdaki fonlar için kısa ve öz bir toplu analiz yap: ${symbols}. Her biri için 1-2 cümlelik yorum ve genel portföy uyumu hakkında tavsiye ver.`;

            // We use the existing API but pass a combined symbol string or handle it custom.
            // Since the API expects { symbol, type }, let's try to send one request per fund and combine results, 
            // OR reuse the API if it handles generic prompts (it probably doesn't).
            // Let's call the API for each fund sequentially to ensure quality.

            const results = await Promise.all(randomFunds.map(async (fund) => {
                try {
                    const res = await fetch("/api/analyze", {
                        method: "POST",
                        body: JSON.stringify({ symbol: fund.symbol, type: fund.type }),
                        headers: { "Content-Type": "application/json" }
                    });
                    const data = await res.json();
                    return { symbol: fund.symbol, analysis: data.analysis || "Analiz alınamadı." };
                } catch (e) {
                    return { symbol: fund.symbol, analysis: "Hata oluştu." };
                }
            }));

            // Combine results into one string
            const combinedAnalysis = results.map(r => `### ${r.symbol}\n${r.analysis}`).join("\n\n");

            setAnalysisModal(prev => ({ ...prev, loading: false, content: combinedAnalysis }));
        } catch (error) {
            console.error("Analysis Error:", error);
            setAnalysisModal(prev => ({ ...prev, loading: false, content: "Analiz sırasında bir hata oluştu." }));
        }
    };

    const questions = [
        {
            id: 1,
            question: "Bu yatırıma ne kadar süre dokunmamayı planlıyorsunuz?",
            options: [
                {
                    label: "Kısa Vade (1 Yıldan Az)",
                    desc: "Yakın zamanda nakit ihtiyacım olabilir, likidite benim için önemli.",
                    score: 1
                },
                {
                    label: "Orta Vade (1-3 Yıl)",
                    desc: "Birkaç yıl bekleyebilirim ancak çok uzun vadeli kilitlemek istemem.",
                    score: 2
                },
                {
                    label: "Uzun Vade (3+ Yıl)",
                    desc: "Bu birikimi emeklilik veya gelecek planları için yapıyorum, acelem yok.",
                    score: 3
                }
            ]
        },
        {
            id: 2,
            question: "Portföyünüz %20 değer kaybetse tepkiniz ne olur?",
            options: [
                {
                    label: "Satış Yaparım",
                    desc: "Daha fazla zarar etmemek için kalan paramı korumaya alırım.",
                    score: 1
                },
                {
                    label: "Beklerim",
                    desc: "Piyasanın toparlanmasını beklerim, panik yapmam.",
                    score: 2
                },
                {
                    label: "Ekleme Yaparım",
                    desc: "Düşüşü fırsat bilip maliyet düşürmek için daha fazla alım yaparım.",
                    score: 3
                }
            ]
        },
        {
            id: 3,
            question: "Finansal piyasalarla ne kadar ilgilisiniz?",
            options: [
                {
                    label: "Başlangıç",
                    desc: "Sadece temel kavramları biliyorum (Döviz, Altın vb.).",
                    score: 1
                },
                {
                    label: "Orta Seviye",
                    desc: "Yatırım fonları ve hisse senetleri hakkında fikrim var.",
                    score: 2
                },
                {
                    label: "İleri Seviye",
                    desc: "Aktif olarak piyasayı takip ediyor ve analiz yapabiliyorum.",
                    score: 3
                }
            ]
        },
        {
            id: 4,
            question: "Sizin için hangisi daha önemli?",
            options: [
                {
                    label: "Kaybetmemek",
                    desc: "Ana paramı korumak, yüksek getiri elde etmekten daha önemli.",
                    score: 1
                },
                {
                    label: "Denge",
                    desc: "Makul bir risk alarak enflasyonun üzerinde getiri hedefliyorum.",
                    score: 2
                },
                {
                    label: "Çok Kazanmak",
                    desc: "Yüksek getiri için yüksek dalgalanmaları göze alabilirim.",
                    score: 3
                }
            ]
        },
        {
            id: 5,
            question: "Yatırımınızdan düzenli nakit akışı bekliyor musunuz?",
            options: [
                {
                    label: "Evet",
                    desc: "Aylık veya dönemsel olarak belirli bir gelir elde etmek istiyorum.",
                    score: 1
                },
                {
                    label: "Kısmen",
                    desc: "Olsa iyi olur ama şart değil.",
                    score: 2
                },
                {
                    label: "Hayır",
                    desc: "Tüm getirinin tekrar yatırıma dönüşerek büyümesini istiyorum.",
                    score: 3
                }
            ]
        },
        {
            id: 6,
            question: "Yatırımlarınızı ne sıklıkla yöneteceksiniz?",
            options: [
                {
                    label: "Her Ay",
                    desc: "Düzenli olarak portföyümü gözden geçirip ekleme yapacağım.",
                    score: 0
                },
                {
                    label: "Fırsat Buldukça",
                    desc: "Piyasada fırsat gördüğüm zamanlarda işlem yapacağım.",
                    score: 0
                },
                {
                    label: "Nadiren",
                    desc: "Bir kere kurup uzun süre dokunmak istemiyorum.",
                    score: 0
                }
            ]
        },
        {
            id: 7,
            question: "Yatırım için ayırmayı düşündüğünüz yaklaşık tutar nedir?",
            options: [
                {
                    label: "0 - 100.000 ₺",
                    desc: "Başlangıç seviyesinde bir birikimle giriş yapıyorum.",
                    score: 0
                },
                {
                    label: "100.000 ₺ - 1.000.000 ₺",
                    desc: "Orta ölçekli bir portföy oluşturmak istiyorum.",
                    score: 0
                },
                {
                    label: "1.000.000 ₺ ve üzeri",
                    desc: "Ciddi bir sermaye yönetimi ve çeşitlendirme hedefliyorum.",
                    score: 0
                }
            ]
        },
        {
            id: 8,
            question: "Faiz hassasiyetiniz (İslami Finans) var mı?",
            options: [
                {
                    label: "Evet, Var",
                    desc: "Yatırımlarımın katılım bankacılığı prensiplerine uygun olması şart.",
                    score: 0
                },
                {
                    label: "Hayır, Yok",
                    desc: "Tüm yasal finansal enstrümanlara yatırım yapabilirim.",
                    score: 1
                }
            ]
        },
        {
            id: 9, // Special Simulation Step
            question: "Şimdi Piyasa Şokuna Hazır Mısınız?",
            isSimulation: true,
            options: []
        }
    ];

    const [inputValue, setInputValue] = useState("");
    const [simulationResult, setSimulationResult] = useState<any>(null);

    const handleAnswer = (score: number | string) => {
        const newAnswers = { ...answers, [currentQuestion]: score.toString() };
        setAnswers(newAnswers);

        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(curr => curr + 1);
            setInputValue(""); // Reset input for next question if any
        } else {
            // Save to local storage when test is finished
            localStorage.setItem("portfolio_answers", JSON.stringify(newAnswers));
            setShowResults(true);
        }
    };

    const handleInputConfirm = () => {
        if (!inputValue) return;
        // Clean input: remove non-numeric chars except dot/comma if needed, but simple number is best for now
        // Assuming user enters raw number or formatted. Let's strip non-digits.
        const cleanValue = inputValue.replace(/[^0-9]/g, '');
        if (!cleanValue) return;

        handleAnswer(cleanValue);
    };

    const getPortfolioRecommendation = () => {
        let totalScore = 0;
        let isIslamic = false;
        let investmentAmount = 0;

        const numQuestions = Object.keys(answers).length;
        // If 6 questions (old version), Islamic is index 5.
        // If 8 questions (new version), Islamic is index 7.
        // Amount question is index 6 in new version.
        const islamicIndex = questions.findIndex(q => q.id === 8);
        const amountIndex = questions.findIndex(q => q.id === 7);
        const simulationIndex = questions.findIndex(q => q.isSimulation);

        Object.entries(answers).forEach(([qIndex, val]) => {
            const idx = parseInt(qIndex);

            if (idx === amountIndex) {
                investmentAmount = parseInt(val) || 0;
            } else if (idx === simulationIndex) {
                try {
                    const actions = JSON.parse(val);
                    const analysis = analyzeInvestorProfile(actions);
                    // Profile based score adjustment
                    if (analysis.profile === 'VALUE_HUNTER') totalScore += 3;
                    if (analysis.profile === 'PANIC_SELLER') totalScore -= 3;
                    if (analysis.profile === 'PATIENT_INVESTOR') totalScore += 1;
                } catch (e) {
                    console.error("Simulation analysis error", e);
                }
            } else {
                const s = parseInt(val);
                if (!isNaN(s)) totalScore += s;
                
                if (idx === islamicIndex && s === 0) {
                    isIslamic = true;
                }
            }
        });

        // Helper to adjust names for Islamic finance
        const adjustForIslamic = (items: any[]) => {
            const formatCurrency = (val: number) => {
                if (!investmentAmount) return "";
                const amount = (investmentAmount * val) / 100;
                return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount);
            };

            const processItems = (list: any[]) => list.map(item => ({
                ...item,
                amountStr: formatCurrency(item.value)
            }));

            if (!isIslamic) return processItems(items);

            return processItems(items.map(item => {
                if (item.name === "Tahvil / Bono") return { ...item, name: "Kira Sertifikaları (Sukuk)" };
                if (item.name === "Hisse Senetleri") return { ...item, name: "Katılım Hisseleri" };
                if (item.name === "Hisse (Temettü)") return { ...item, name: "Katılım Temettü Hisseleri" };
                if (item.name === "Yatırım Fonları") return { ...item, name: "Katılım Fonları" };
                if (item.name === "Nakit") return { ...item, name: "Katılım Hesabı" };
                return item;
            }));
        };

        if (totalScore >= 13) {
            return {
                title: "Agresif Büyüme Portföyü",
                persona: "Cesur Kaşif",
                desc: "Maksimum büyüme odaklı, yüksek volatiliteyi tolere edebilen portföy.",
                advantages: [
                    "Uzun vadede en yüksek getiri potansiyeli",
                    "Bileşik getirinin gücünden maksimum faydalanma",
                    "Enflasyon üzerinde ciddi reel getiri şansı"
                ],
                reasoning: "Yüksek risk toleransınız ve uzun vade hedefiniz nedeniyle portföyün ağırlığı (%60) büyüme potansiyeli yüksek **" + (isIslamic ? "Katılım Hisselerine" : "Hisse Senetlerine") + "** verildi. Bu varlık sınıfı uzun vadede en yüksek getiriyi sunar. %20'lik **" + (isIslamic ? "Katılım Fonu" : "Fon") + "** kısmı sektörel çeşitlilik sağlarken, %10 **Altın** ve **" + (isIslamic ? "Katılım Hesabı" : "Nakit") + "** ise piyasa düzeltmelerinde 'dipten alım' fırsatı yaratmak ve sigorta görevi görmek için eklendi.",
                allocation: adjustForIslamic([
                    { name: "Hisse Senetleri", value: 60, color: "#3b82f6" },
                    { name: "Yatırım Fonları", value: 20, color: "#6366f1" },
                    { name: "Emtia / Altın", value: 10, color: "#eab308" },
                    { name: "Nakit", value: 10, color: "#64748b" }
                ])
            };
        } else if (totalScore >= 9) {
            return {
                title: "Dengeli Portföy",
                persona: "Stratejik Mimar",
                desc: "Risk ve getiri arasında ideal dengeyi kuran, piyasa dalgalanmalarına karşı kısmen korumalı yapı.",
                advantages: [
                    "Hem koruma hem büyüme sağlar",
                    "Aşırı piyasa düşüşlerinde tampon görevi görür",
                    "Stresten uzak, sürdürülebilir bir yatırım deneyimi"
                ],
                reasoning: "Ne paranızı enflasyona ezdiriyorsunuz ne de aşırı risk alıyorsunuz. Portföyün %40'ı ile **" + (isIslamic ? "Katılım Hissesi" : "Hisse Senedi") + "** piyasasının getirisinden faydalanırken, toplamda %50'yi bulan **" + (isIslamic ? "Sukuk" : "Tahvil") + "** ve **Altın** ağırlığı ile piyasa çöküşlerine karşı kalkan oluşturuyorsunuz. Bu yapı, 'geceleri rahat uyuyarak' büyüme sağlar.",
                allocation: adjustForIslamic([
                    { name: "Hisse Senetleri", value: 40, color: "#3b82f6" },
                    { name: "Tahvil / Bono", value: 30, color: "#22c55e" },
                    { name: "Altın", value: 20, color: "#eab308" },
                    { name: "Nakit", value: 10, color: "#64748b" }
                ])
            };
        } else {
            return {
                title: "Koruyucu Portföy",
                persona: "Güvenli Liman",
                desc: "Sermaye koruma öncelikli, düşük riskli ve düzenli gelir odaklı portföy.",
                advantages: [
                    "Anapara kaybı riski minimumdur",
                    "Piyasa krizlerinden en az etkilenen yapıdır",
                    "Düzenli ve öngörülebilir getiri akışı sağlar"
                ],
                reasoning: "Ana parayı kaybetme riskiniz minimize edildi. Portföyün %80'i (**" + (isIslamic ? "Sukuk" : "Tahvil") + "** ve **Altın**) güvenli limanlarda tutularak krizlere karşı tam koruma sağlandı. Sadece %10'luk **" + (isIslamic ? "Katılım Hissesi" : "Hisse (Temettü)") + "** kısmı ile düzenli nakit akışı hedeflendi. Bu portföyün mottosu: 'Önce kaybetme, sonra kazan'.",
                allocation: adjustForIslamic([
                    { name: "Tahvil / Bono", value: 50, color: "#22c55e" },
                    { name: "Altın", value: 30, color: "#eab308" },
                    { name: "Hisse (Temettü)", value: 10, color: "#3b82f6" },
                    { name: "Nakit", value: 10, color: "#64748b" }
                ])
            };
        }
    };

    const recommendation = showResults ? getPortfolioRecommendation() : null;

    if (isLoading) {
        return (
            <div className="p-6 h-full flex flex-col items-center justify-center min-h-[600px] overflow-hidden">
                <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-6 h-full flex flex-col items-center justify-start min-h-[600px] overflow-y-auto space-y-8">
            {/* Random Funds Analysis Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-5xl bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/20 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden shrink-0"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                <div className="relative z-10 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                            <Brain className="w-5 h-5" />
                        </div>
                        <span className="text-purple-300 font-medium text-sm uppercase tracking-wider">Akıllı Portföy Analizi</span>
                    </div>
                    {randomFunds.length > 0 ? (
                        <>
                            <h2 className="text-2xl font-bold text-white mb-2">Fonlarınız İncelenmeye Hazır</h2>
                            <p className="text-slate-400 text-sm">
                                Portföyünüzden seçilen <span className="text-white font-bold">{randomFunds.map(f => f.symbol).join(", ")}</span> fonları için yapay zeka destekli detaylı analiz alın.
                            </p>
                        </>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold text-white mb-2">Fon Analizi</h2>
                            <p className="text-slate-400 text-sm">
                                Akıllı analiz için portföyünüzde henüz yeterli <strong>Yatırım Fonu</strong> bulunamadı. Varlık ekleyerek başlayın.
                            </p>
                        </>
                    )}
                </div>

                <button
                    onClick={handleAnalyzeFunds}
                    disabled={randomFunds.length === 0}
                    className={`relative z-10 px-8 py-4 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 whitespace-nowrap ${randomFunds.length > 0
                        ? "bg-white text-purple-900 hover:bg-purple-50 hover:scale-105 shadow-purple-900/20"
                        : "bg-white/10 text-slate-400 cursor-not-allowed border border-white/5"
                        }`}
                >
                    <Zap className={`w-5 h-5 ${randomFunds.length > 0 ? "fill-purple-900" : "text-slate-500"}`} />
                    {randomFunds.length > 0 ? "Şimdi Analiz Et" : "Fon Bulunamadı"}
                </button>
            </motion.div>

            <AnimatePresence mode="wait">
                {!testStarted ? (
                    <motion.div
                        key="intro"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="text-center max-w-2xl relative"
                    >
                        <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-700"></div>

                        <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-500/10 border border-white/10 backdrop-blur-sm">
                            <span className="text-5xl">🧭</span>
                        </div>
                        <h1 className="text-5xl font-bold text-white mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
                            Yatırım Pusulanızı Bulun
                        </h1>
                        <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                            Sadece 1 dakikada risk profilinizi analiz edelim ve size en uygun <span className="text-blue-400 font-bold">bilimsel portföy dağılımını</span> sunalım.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 text-left">
                            <div className="bg-white/5 p-5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                <h3 className="font-bold text-white">Hedef Odaklı</h3>
                                <p className="text-xs text-slate-400 mt-1">Hayallerinize giden en kısa yol.</p>
                            </div>
                            <div className="bg-white/5 p-5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                <h3 className="font-bold text-white">Güvenli</h3>
                                <p className="text-xs text-slate-400 mt-1">Risk toleransınıza %100 uyumlu.</p>
                            </div>
                            <div className="bg-white/5 p-5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                <h3 className="font-bold text-white">Hızlı</h3>
                                <p className="text-xs text-slate-400 mt-1">Karmaşık terimler yok, sadece sonuç.</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setTestStarted(true)}
                            className="group relative px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xl transition-all hover:scale-105 flex items-center gap-3 mx-auto shadow-2xl shadow-blue-900/40 overflow-hidden"
                        >
                            <span className="relative z-10">Teste Başla</span>
                            <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-1 transition-transform" />
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[length:200%_auto] animate-gradient"></div>
                        </button>
                    </motion.div>
                ) : !showResults ? (
                    <motion.div
                        key="question"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="w-full max-w-xl"
                    >
                        <div className="mb-8">
                            <div className="flex justify-between text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
                                <span>Adım {currentQuestion + 1} / {questions.length}</span>
                            </div>
                            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                    initial={{ width: `${((currentQuestion) / questions.length) * 100}%` }}
                                    animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>

                        <h2 className="text-3xl font-bold text-white mb-8 leading-tight">
                            {questions[currentQuestion].question}
                        </h2>

                        <div className="space-y-4">
                            {questions[currentQuestion].isSimulation ? (
                                <div className="mt-4">
                                    <BehavioralTest 
                                        onFinish={(actions) => {
                                            handleAnswer(JSON.stringify(actions));
                                        }}
                                    />
                                </div>
                            ) : questions[currentQuestion].id === 7 ? (
                                <div className="space-y-6">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => {
                                                // Only allow numbers
                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                setInputValue(val);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleInputConfirm();
                                            }}
                                            placeholder="Örn: 50000"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-2xl font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                            autoFocus
                                        />
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">
                                            ₺
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleInputConfirm}
                                        disabled={!inputValue}
                                        className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-2xl font-bold text-xl transition-all flex items-center justify-center gap-3"
                                    >
                                        Devam Et
                                        <ArrowRight className="w-6 h-6" />
                                    </button>
                                </div>
                            ) : (
                                questions[currentQuestion].options.map((opt, idx) => (
                                    <motion.button
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        onClick={() => handleAnswer(opt.score)}
                                        className="w-full text-left p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 transition-all group flex items-center gap-4 hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <div className="flex-1">
                                            <div className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors">
                                                {opt.label}
                                            </div>
                                            <div className="text-sm text-slate-400 mt-1 font-medium leading-snug">
                                                {opt.desc}
                                            </div>
                                        </div>
                                        <ChevronRight className="w-6 h-6 text-slate-500 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                    </motion.button>
                                )))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="results"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-5xl"
                    >
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center gap-2 px-6 py-2 bg-green-500/20 text-green-400 rounded-full text-sm font-bold mb-6 border border-green-500/30 shadow-lg shadow-green-900/20">
                                <Trophy className="w-4 h-4" />
                                Analiz Tamamlandı
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                                {recommendation?.title}
                            </h2>
                            <div className="text-2xl font-medium text-blue-400 mb-4 bg-blue-500/10 inline-block px-4 py-2 rounded-lg border border-blue-500/20">
                                {recommendation?.persona}
                            </div>
                            <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
                                {recommendation?.desc}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                            {/* Chart Visualization (Recharts Pie) */}
                            <div className="bg-slate-900/80 backdrop-blur-sm rounded-3xl p-8 border border-white/10 shadow-2xl flex flex-col items-center justify-center min-h-[400px]">
                                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                                    <PieChart className="w-5 h-5 text-blue-400" />
                                    Önerilen Dağılım
                                </h3>
                                <div className="w-full h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPie width={400} height={300}>
                                            <Pie
                                                data={recommendation?.allocation}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={0}
                                                outerRadius={100}
                                                paddingAngle={0}
                                                dataKey="value"
                                                stroke="none"
                                                isAnimationActive={true}
                                                labelLine={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }}
                                                label={({ cx, cy, midAngle = 0, innerRadius, outerRadius, percent, index, name, value }) => {
                                                    const RADIAN = Math.PI / 180;
                                                    const radius = outerRadius + 20;
                                                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                                    const y = cy + radius * Math.sin(-midAngle * RADIAN);

                                                    return (
                                                        <text
                                                            x={x}
                                                            y={y}
                                                            fill="#e2e8f0"
                                                            textAnchor={x > cx ? 'start' : 'end'}
                                                            dominantBaseline="central"
                                                            style={{ fontSize: '11px', fontWeight: 600 }}
                                                        >
                                                            {`${name} (%${value})`}
                                                        </text>
                                                    );
                                                }}
                                            >
                                                {recommendation?.allocation.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.color}
                                                        stroke="rgba(255,255,255,0.2)"
                                                        strokeWidth={1}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                                                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                                formatter={(value: any) => [`%${value}`, 'Oran']}
                                            />
                                        </RechartsPie>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/5">
                                    <h4 className="text-sm font-bold text-blue-300 mb-3 flex items-center gap-2">
                                        <Zap className="w-4 h-4" />
                                        Neden Bu Dağılım?
                                    </h4>
                                    <p className="text-sm text-slate-300 leading-relaxed mb-4">
                                        {recommendation?.reasoning.split("**").map((part, i) =>
                                            i % 2 === 1 ? <span key={i} className="text-white font-bold">{part}</span> : part
                                        )}
                                    </p>

                                    {recommendation?.advantages && (
                                        <div className="space-y-2">
                                            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avantajlar</h5>
                                            <ul className="space-y-2">
                                                {recommendation.advantages.map((adv: string, i: number) => (
                                                    <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                                                        {adv}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4 w-full mt-4">
                                    {recommendation?.allocation.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                                            <div className="flex justify-between w-full text-sm">
                                                <span className="text-slate-300 font-medium">{item.name}</span>
                                                <div className="text-right">
                                                    <span className="text-white font-bold block">%{item.value}</span>
                                                    {item.amountStr && (
                                                        <span className="text-xs text-slate-400 font-medium block">({item.amountStr})</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action Card */}
                            <div className="bg-gradient-to-br from-blue-900/40 to-slate-900 border border-blue-500/30 rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                        <Target className="w-6 h-6 text-blue-400" />
                                        Nasıl Başlamalı?
                                    </h3>
                                    <ul className="space-y-6 mb-8">
                                        <li className="flex items-start gap-4 text-slate-300">
                                            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 font-bold border border-blue-500/30">1</div>
                                            <div>
                                                <span className="text-white font-bold block mb-1">Dağılımı Uygula</span>
                                                Önerilen oranlara sadık kalarak portföyünüzü çeşitlendirin.
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-4 text-slate-300">
                                            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 font-bold border border-blue-500/30">2</div>
                                            <div>
                                                <span className="text-white font-bold block mb-1">Fonları İncele</span>
                                                Piyasa Analizi sayfasından ilgili kategorideki fonları (Örn: IPJ, TCD) araştırın.
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-4 text-slate-300">
                                            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 font-bold border border-blue-500/30">3</div>
                                            <div>
                                                <span className="text-white font-bold block mb-1">Sabırlı Ol</span>
                                                Uzun vadeli düşünün ve panik satışlardan kaçının.
                                            </div>
                                        </li>
                                    </ul>
                                </div>

                                <button
                                    onClick={() => {
                                        localStorage.removeItem("portfolio_answers"); // Clear saved data
                                        setTestStarted(false);
                                        setCurrentQuestion(0);
                                        setShowResults(false);
                                        setAnswers({});
                                    }}
                                    className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all border border-white/10 flex items-center justify-center gap-2 hover:scale-[1.02]"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                    Testi Tekrarla
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Analysis Modal */}
            <AnimatePresence>
                {analysisModal.isOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setAnalysisModal(prev => ({ ...prev, isOpen: false }))}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-2xl shadow-2xl max-h-[85vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-start mb-8 border-b border-white/10 pb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                        <div className="p-2 bg-purple-500/20 rounded-xl">
                                            <Brain className="w-6 h-6 text-purple-500" />
                                        </div>
                                        {analysisModal.title}
                                    </h2>
                                    <p className="text-slate-400 text-sm mt-2 ml-1">Yapay zeka tabanlı portföy analizi</p>
                                </div>
                                <button onClick={() => setAnalysisModal(prev => ({ ...prev, isOpen: false }))} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {analysisModal.loading ? (
                                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full"></div>
                                        <Loader2 className="w-12 h-12 animate-spin relative z-10 text-purple-500" />
                                    </div>
                                    <p className="mt-4 font-medium animate-pulse">Analiz hazırlanıyor...</p>
                                </div>
                            ) : (
                                <div className="prose prose-invert max-w-none">
                                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5 text-slate-300 leading-relaxed whitespace-pre-wrap">
                                        {analysisModal.content}
                                    </div>
                                    <div className="mt-6 flex items-center gap-2 text-xs text-slate-500 bg-blue-500/5 p-3 rounded-lg border border-blue-500/10">
                                        <Info className="w-4 h-4 text-blue-400" />
                                        Bu analiz AI tarafından oluşturulmuştur. Yatırım tavsiyesi değildir.
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
