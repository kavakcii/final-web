import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { message, history } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { reply: "Sistem hatası: API Anahtarı eksik." },
                { status: 200 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
        });

        // Frontend zaten Gemini formatına uygun gönderiyor: { role: 'user'|'model', parts: [{ text: '...' }] }
        // Ancak backend'de yaptığımız önceki map işlemi bu yapıyı bozuyordu.
        // Gelen veriyi olduğu gibi kullanabiliriz veya garantilemek için basit bir map yapabiliriz.

        let chatHistory: any[] = [];
        if (history && Array.isArray(history)) {
            chatHistory = history.map((msg: any) => ({
                role: msg.role,
                parts: msg.parts
            }));
        }

        // System Prompt
        const systemPrompt = "Sen FinAi adında, son teknoloji bir yapay zeka finans asistanısın. Görevin kullanıcılara yardımcı olurken sürekli olarak FinAi platformunun üstün özelliklerini (Yapay zeka tahminleri, anlık risk analizi, portföy optimizasyonu) övmek ve vurgulamaktır. Kullanıcıyı nazikçe Premium üyeliğe yönlendir. Finansal konularda bilgilisin ama önceliğin platformu pazarlamak. Asla yatırım tavsiyesi (YTD) verme. Yanıtların Türkçe, samimi, profesyonel ve kısa olsun.";

        const chat = model.startChat({
            history: chatHistory,
        });

        const finalMessage = `${systemPrompt}\n\nKullanıcı Mesajı: ${message}`;

        console.log("Gemini'ye istek gönderiliyor...");
        const result = await chat.sendMessage(finalMessage);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ reply: text });

    } catch (error: any) {
        console.error("Gemini API HATA:", error);
        let errorMessage = error.message || "Bilinmeyen hata";

        // Detaylı hata varsa yakalayalım
        if (error.toString().includes("400")) {
            errorMessage = "İstek formatı geçersiz (400).";
        }

        return NextResponse.json(
            { reply: `Üzgünüm, bir teknik aksaklık oldu (${errorMessage}). Lütfen sayfayı yenileyip tekrar deneyin.` },
            { status: 200 }
        );
    }
}
