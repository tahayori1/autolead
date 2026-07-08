import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // CORS Middleware to allow api.hoseinikhodro.com and other origins
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // API endpoint for Gemini generation
  app.post("/api/generate-ad", async (req, res) => {
    try {
      const apiKey = process.env.LIARA_API_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXkiOiI2YTNhMTM0ZTIxMzAxMmJlMTIwMmRiZjMiLCJ0eXBlIjoiYWlfa2V5IiwiaWF0IjoxNzgyMTkwOTI2fQ.aWbFXlkFn1eI9DC-aMRFSvuClET6tWmphhaVrS92q5c";
      
      const { type, model_name, targetType, customKeywords, companyDetails } = req.body;

      let systemInstruction = "شما یک کارشناس ارشد بازاریابی دیجیتال، نویسنده تبلیغات خلاق و متخصص فروش خودرو (به‌ویژه برندهای کرمان موتور، مدیران خودرو، بهمن موتور، فردا موتور و غیره) هستید که به بازار ایران، اصطلاحات خودرویی و نحوه نگارش جذاب مسلط است. زبان پاسخ حتما روان، جذاب و فارسی باشد.";
      
      let prompt = `یک متن جذاب و خلاقانه برای ${targetType === 'divar' ? 'آگهی سایت دیوار' : targetType === 'instagram' ? 'کپشن پست اینستاگرام' : 'پیامک تبلیغاتی (SMS)'} بنویس.
مدل خودرو: ${model_name}
${customKeywords ? `کلیدواژه‌ها یا نکات خاص: ${customKeywords}` : ''}
${companyDetails ? `اطلاعات تماس یا شرکت: ${companyDetails}` : ''}

قوانین نگارش:
۱. برای دیوار: دارای یک عنوان بسیار جذاب و مهیج در اول متن، لیست مشخصات کلیدی به همراه وضعیت سند، حواله یا تحویل، و بخش دعوت به تماس با لحن حرفه‌ای و رسمی متمایز.
۲. برای اینستاگرام: دارای یک شروع طوفانی و جذاب برای قلاب کردن مخاطب (Hook)، توضیح کوتاه امکانات و جذابیت‌های خودرو، استفاده از ایموجی‌های مرتبط و پر انرژی، و هشتگ‌های پربازدید خودرویی ایرانی در انتهای متن.
۳. برای پیامک: متنی بسیار کوتاه، تاثیرگذار، خلاصه و همراه با دعوت به اقدام صریح (مثلا تماس با شماره یا مراجعه حضوری) که در قالب یک پیامک قرار بگیرد.

تمامی پاسخ‌ها کاملا خلاقانه، حرفه‌ای، دارای فضابندی مناسب و به شکل تمیز و خوانا مرتب شده باشند.`;

      // Call Liara AI Gateway
      const response = await fetch("https://ai.liara.ir/api/683580a8fe913a5ae3e52a34/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-lite-001",
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt }
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`خطای سرور لیارا آرتیفیشال: ${errText}`);
      }

      const responseData = await response.json();
      const text = responseData.choices?.[0]?.message?.content || "";
      res.json({ result: text });
    } catch (error: any) {
      console.error("Liara API Error:", error);
      res.status(500).json({ error: error.message || "خطایی در پردازش درخواست توسط هوش مصنوعی رخ داد." });
    }
  });

  // Call Logs Memory Storage
  interface ServerCallLog {
    id: string;
    userId?: number;
    customerName: string;
    customerNumber: string;
    callType: 'INBOUND' | 'OUTBOUND';
    callStatus: 'SUCCESSFUL' | 'MISSED' | 'NO_ANSWER' | 'BUSY' | 'REJECTED';
    duration: number;
    agentName: string;
    notes: string;
    timestamp: string;
  }

  let inMemoryCallLogs: ServerCallLog[] = [];

  // GET /calllog
  app.get("/calllog", (req, res) => {
    res.json(inMemoryCallLogs);
  });

  // POST /calllog
  app.post("/calllog", (req, res) => {
    const log = req.body;
    if (!log.id) {
      log.id = `call-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    }
    inMemoryCallLogs.unshift(log);
    res.status(201).json(log);
  });

  // PUT /calllog
  app.put("/calllog", (req, res) => {
    const log = req.body;
    const index = inMemoryCallLogs.findIndex(item => item.id === log.id);
    if (index !== -1) {
      inMemoryCallLogs[index] = { ...inMemoryCallLogs[index], ...log };
      res.json(inMemoryCallLogs[index]);
    } else {
      res.status(404).json({ error: "گزارش تماس یافت نشد" });
    }
  });

  // GET /api/calllog
  app.get("/api/calllog", (req, res) => {
    res.json(inMemoryCallLogs);
  });

  // POST /api/calllog
  app.post("/api/calllog", (req, res) => {
    const log = req.body;
    if (!log.id) {
      log.id = `call-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    }
    inMemoryCallLogs.unshift(log);
    res.status(201).json(log);
  });

  // PUT /api/calllog
  app.put("/api/calllog", (req, res) => {
    const log = req.body;
    const index = inMemoryCallLogs.findIndex(item => item.id === log.id);
    if (index !== -1) {
      inMemoryCallLogs[index] = { ...inMemoryCallLogs[index], ...log };
      res.json(inMemoryCallLogs[index]);
    } else {
      res.status(404).json({ error: "گزارش تماس یافت نشد" });
    }
  });

  // CRM Lead Live Viewing Sessions Memory Storage
  interface LeadSession {
    leadId: number;
    username: string;
    fullName: string;
    lastActive: number; // timestamp
  }
  let inMemoryLeadSessions: LeadSession[] = [];

  const cleanupSessions = () => {
    const expirationTime = 15000; // 15 seconds
    const now = Date.now();
    inMemoryLeadSessions = inMemoryLeadSessions.filter(s => now - s.lastActive < expirationTime);
  };

  // GET /api/lead-sessions
  app.get("/api/lead-sessions", (req, res) => {
    cleanupSessions();
    res.json(inMemoryLeadSessions);
  });

  // POST /api/lead-sessions
  app.post("/api/lead-sessions", (req, res) => {
    const { leadId, username, fullName } = req.body;
    if (!leadId || !username) {
      return res.status(400).json({ error: "شناسه سرنخ و نام کاربری الزامی است" });
    }
    
    cleanupSessions();

    const now = Date.now();
    const existingIndex = inMemoryLeadSessions.findIndex(s => s.leadId === Number(leadId) && s.username === username);
    if (existingIndex !== -1) {
      inMemoryLeadSessions[existingIndex].lastActive = now;
      if (fullName) {
        inMemoryLeadSessions[existingIndex].fullName = fullName;
      }
    } else {
      inMemoryLeadSessions.push({
        leadId: Number(leadId),
        username,
        fullName: fullName || username,
        lastActive: now
      });
    }

    res.json(inMemoryLeadSessions.filter(s => s.leadId === Number(leadId)));
  });

  // DELETE /api/lead-sessions
  app.delete("/api/lead-sessions", (req, res) => {
    const { leadId, username } = req.body;
    if (!leadId) {
      return res.status(400).json({ error: "شناسه سرنخ الزامی است" });
    }

    inMemoryLeadSessions = inMemoryLeadSessions.filter(s => {
      const matchLead = s.leadId === Number(leadId);
      const matchUser = username ? s.username === username : true;
      return !(matchLead && matchUser);
    });

    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
