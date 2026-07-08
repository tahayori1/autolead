import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // CRM Active Views & Locks Storage
  interface CrmActiveView {
    leadId: number;
    username: string;
    fullName: string;
    isEditing: boolean;
    lastActive: number;
  }

  interface CrmLock {
    leadId: number;
    username: string;
    fullName: string;
    timestamp: number;
  }

  let crmActiveViews: CrmActiveView[] = [];
  let crmLocks: CrmLock[] = [];

  // Cleanup helper for expired active views
  const cleanExpiredActiveViews = () => {
    const now = Date.now();
    crmActiveViews = crmActiveViews.filter(v => now - v.lastActive < 8000);
  };

  // Heartbeat endpoint
  app.post("/api/crm/heartbeat", (req, res) => {
    const { leadId, username, fullName, isEditing } = req.body;
    if (!leadId || !username) {
      return res.status(400).json({ error: "Missing leadId or username" });
    }

    cleanExpiredActiveViews();

    const existingIndex = crmActiveViews.findIndex(
      v => v.leadId === Number(leadId) && v.username === username
    );

    if (existingIndex !== -1) {
      crmActiveViews[existingIndex].lastActive = Date.now();
      crmActiveViews[existingIndex].isEditing = !!isEditing;
      crmActiveViews[existingIndex].fullName = fullName || username;
    } else {
      crmActiveViews.push({
        leadId: Number(leadId),
        username,
        fullName: fullName || username,
        isEditing: !!isEditing,
        lastActive: Date.now()
      });
    }

    res.json({ success: true });
  });

  // Register Activity (Locks)
  app.post("/api/crm/activity", (req, res) => {
    const { leadId, username, fullName } = req.body;
    if (!leadId || !username) {
      return res.status(400).json({ error: "Missing leadId or username" });
    }

    const existingIndex = crmLocks.findIndex(l => l.leadId === Number(leadId));
    if (existingIndex !== -1) {
      crmLocks[existingIndex] = {
        leadId: Number(leadId),
        username,
        fullName: fullName || username,
        timestamp: Date.now()
      };
    } else {
      crmLocks.push({
        leadId: Number(leadId),
        username,
        fullName: fullName || username,
        timestamp: Date.now()
      });
    }

    res.json({ success: true });
  });

  // Get CRM status (Locks and Active Views)
  app.get("/api/crm/status", (req, res) => {
    cleanExpiredActiveViews();
    res.json({
      activeViews: crmActiveViews,
      locks: crmLocks
    });
  });

  // Clear Lock
  app.post("/api/crm/clear-lock", (req, res) => {
    const { leadId } = req.body;
    if (!leadId) {
      return res.status(400).json({ error: "Missing leadId" });
    }
    crmLocks = crmLocks.filter(l => l.leadId !== Number(leadId));
    res.json({ success: true, locks: crmLocks });
  });

  // Clear All Locks
  app.post("/api/crm/clear-all-locks", (req, res) => {
    crmLocks = [];
    res.json({ success: true });
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

  // --- Salary Advance Request Memory Storage ---
  interface ServerSalaryAdvanceRequest {
    id: number;
    requesterName: string;
    amount: number;
    targetDate: string;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    notes?: string;
  }

  let inMemorySalaryAdvances: ServerSalaryAdvanceRequest[] = [
    {
      id: 1,
      requesterName: 'امیررضا محمودی',
      amount: 8000000,
      targetDate: '2026-07-20',
      reason: 'پرداخت قسط بیمه بدنه خودرو شخصی و هزینه‌های درمانی خانواده',
      status: 'PENDING',
      createdAt: '1405/03/25',
    },
    {
      id: 2,
      requesterName: 'مریم اکبری',
      amount: 5000000,
      targetDate: '2026-07-18',
      reason: 'پیش‌پرداخت اجاره‌بهای منزل مسکونی و تمدید قرارداد سالانه',
      status: 'APPROVED',
      createdAt: '1405/03/20',
      notes: 'مورد تایید است. از محل منابع تنخواه‌گردان دفتر مرکزی پرداخت شود.'
    },
    {
      id: 3,
      requesterName: 'سید رضا علوی',
      amount: 12000000,
      targetDate: '2026-07-16',
      reason: 'خرید قطعات سخت‌افزاری کامپیوتر شخصی مورد استفاده در پروژه‌های شرکت',
      status: 'REJECTED',
      createdAt: '1405/03/18',
      notes: 'با عرض معذرت، به دلیل نداشتن سقف کارکرد ماهیانه کافی در این دوره امکان پذیر نیست.'
    },
    {
      id: 4,
      requesterName: 'محمد رضایی',
      amount: 6000000,
      targetDate: '2026-07-14',
      reason: 'هزینه‌های ثبت‌نام فرزند در کلاس‌های تابستانی و تهیه تجهیزات ورزشی',
      status: 'APPROVED',
      createdAt: '1405/03/15',
      notes: 'توسط مدیریت عامل تایید شد.'
    },
  ];

  const getSalaryAdvances = (req: any, res: any) => {
    res.json(inMemorySalaryAdvances);
  };

  const createSalaryAdvance = (req: any, res: any) => {
    const item = req.body;
    if (!item.id) {
      item.id = Date.now();
    }
    inMemorySalaryAdvances.unshift(item);
    res.status(201).json(item);
  };

  const updateSalaryAdvance = (req: any, res: any) => {
    const item = req.body;
    const index = inMemorySalaryAdvances.findIndex(x => x.id === Number(item.id));
    if (index !== -1) {
      inMemorySalaryAdvances[index] = { ...inMemorySalaryAdvances[index], ...item };
      res.json(inMemorySalaryAdvances[index]);
    } else {
      res.status(404).json({ error: "درخواست مساعده یافت نشد" });
    }
  };

  const deleteSalaryAdvance = (req: any, res: any) => {
    const { id } = req.body;
    const initialLength = inMemorySalaryAdvances.length;
    inMemorySalaryAdvances = inMemorySalaryAdvances.filter(x => x.id !== Number(id));
    if (inMemorySalaryAdvances.length < initialLength) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "درخواست مساعده یافت نشد" });
    }
  };

  app.get("/SalaryAdvance", getSalaryAdvances);
  app.post("/SalaryAdvance", createSalaryAdvance);
  app.put("/SalaryAdvance", updateSalaryAdvance);
  app.delete("/SalaryAdvance", deleteSalaryAdvance);

  app.get("/api/SalaryAdvance", getSalaryAdvances);
  app.post("/api/SalaryAdvance", createSalaryAdvance);
  app.put("/api/SalaryAdvance", updateSalaryAdvance);
  app.delete("/api/SalaryAdvance", deleteSalaryAdvance);

  // --- Leave Request Memory Storage ---
  interface ServerLeaveRequest {
    id: number;
    requesterName: string;
    type: 'HOURLY' | 'DAILY';
    startDate: string;
    endDate?: string;
    hours?: number;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
  }

  let inMemoryLeaveRequests: ServerLeaveRequest[] = [
    {
      id: 1,
      requesterName: 'امیررضا محمودی',
      type: 'DAILY',
      startDate: '2026-07-15',
      endDate: '2026-07-17',
      reason: 'شرکت در مراسم سالگرد فوت پدربزرگ و سفر به شهرستان',
      status: 'PENDING',
      createdAt: '1405/04/10',
    },
    {
      id: 2,
      requesterName: 'مریم اکبری',
      type: 'HOURLY',
      startDate: '2026-07-11',
      hours: 3,
      reason: 'مراجعه به پزشک متخصص جهت پیگیری آزمایشات درمانی',
      status: 'APPROVED',
      createdAt: '1405/04/05',
    },
    {
      id: 3,
      requesterName: 'سید رضا علوی',
      type: 'DAILY',
      startDate: '2026-07-01',
      endDate: '2026-07-02',
      reason: 'امور اداری ثبت سند ملک مسکونی و حضور در دفترخانه',
      status: 'REJECTED',
      createdAt: '1405/03/28',
    }
  ];

  const getLeaveRequests = (req: any, res: any) => {
    res.json(inMemoryLeaveRequests);
  };

  const createLeaveRequest = (req: any, res: any) => {
    const item = req.body;
    if (!item.id) {
      item.id = Date.now();
    }
    inMemoryLeaveRequests.unshift(item as ServerLeaveRequest);
    res.status(201).json(item);
  };

  const updateLeaveRequest = (req: any, res: any) => {
    const item = req.body;
    const index = inMemoryLeaveRequests.findIndex(x => x.id === Number(item.id));
    if (index !== -1) {
      inMemoryLeaveRequests[index] = { ...inMemoryLeaveRequests[index], ...item };
      res.json(inMemoryLeaveRequests[index]);
    } else {
      res.status(404).json({ error: "درخواست مرخصی یافت نشد" });
    }
  };

  const deleteLeaveRequest = (req: any, res: any) => {
    const { id } = req.body;
    const initialLength = inMemoryLeaveRequests.length;
    inMemoryLeaveRequests = inMemoryLeaveRequests.filter(x => x.id !== Number(id));
    if (inMemoryLeaveRequests.length < initialLength) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "درخواست مرخصی یافت نشد" });
    }
  };

  app.get("/LeaveReguests", getLeaveRequests);
  app.post("/LeaveReguests", createLeaveRequest);
  app.put("/LeaveReguests", updateLeaveRequest);
  app.delete("/LeaveReguests", deleteLeaveRequest);

  app.get("/api/LeaveReguests", getLeaveRequests);
  app.post("/api/LeaveReguests", createLeaveRequest);
  app.put("/api/LeaveReguests", updateLeaveRequest);
  app.delete("/api/LeaveReguests", deleteLeaveRequest);

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
