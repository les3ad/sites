
import { GoogleGenAI } from "@google/genai";
import { TradeRecord } from "../types";
import { formatCurrency } from "../utils/currency";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getTradingAdvice = async (history: TradeRecord[]) => {
  if (history.length === 0) return "Начните записывать свои сделки, чтобы получить советы от ИИ!";

  const context = history.slice(-20).map(h => 
    `${h.fromNode} -> ${h.toNode}: ${formatCurrency(h.profit)} в ${new Date(h.timestamp).toLocaleString('ru-RU')}`
  ).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Вы — профессиональный торговый консультант в мире Ashes of Creation (Верра). 
      Проанализируйте историю сделок и предложите наиболее прибыльные маршруты, лучшее время для торговли и общую стратегию. 
      Отвечайте на русском языке, кратко и по делу, используя игровую терминологию.
      
      ИСТОРИЯ СДЕЛОК:
      ${context}`,
      config: {
        systemInstruction: "Вы мастер экономики Верры. Предоставляйте краткие стратегические советы на русском языке на основе данных о торговле караванами.",
        temperature: 0.7,
      }
    });

    return response.text || "Пока нет доступной аналитики.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Не удалось получить советы от ИИ. Проверьте данные и подключение.";
  }
};
