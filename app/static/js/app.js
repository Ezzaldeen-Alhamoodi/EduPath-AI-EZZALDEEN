const EDUPATH_BUILD_VERSION = "5.4.5-purge-old-task-sources-ar";
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/static/js/service-worker.js")
        .catch(() => {});
}

async function askNotificationPermission() {
    if (!("Notification" in window)) {
        alert("Notifications are not supported in this browser.");
        return;
    }

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
        new Notification("EduPath AI reminders enabled ✅", {
            body: "You will receive browser reminders while the app is active or installed.",
        });
    } else {
        alert("Notification permission was not granted.");
    }
}

function sameMinute(timeString) {
    if (!timeString) return false;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}` === timeString;
}

function taskShouldNotifyToday(task) {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const jsDay = now.getDay();
    const mondayBasedDay = String((jsDay + 6) % 7);

    if (task.due_date && task.due_date < today) return false;

    if (task.repeat_type === "once") {
        return !task.due_date || task.due_date === today;
    }

    if (task.repeat_type === "weekly") {
        if (!task.due_date) return true;
        const due = new Date(task.due_date);
        return due.getDay() === jsDay;
    }

    if (task.repeat_type === "selected_days") {
        const days = (task.repeat_days || "").split(",").filter(Boolean);
        return days.includes(mondayBasedDay);
    }

    return true;
}

let alreadyNotified = new Set();

async function checkTaskReminders() {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    try {
        const response = await fetch("/api/tasks");
        const tasks = await response.json();
        const today = new Date().toISOString().slice(0, 10);

        tasks.forEach(task => {
            if (!task.reminder_time) return;

            const key = `${today}-${task.id}-${task.reminder_time}`;

            if (taskShouldNotifyToday(task) && sameMinute(task.reminder_time) && !alreadyNotified.has(key)) {
                alreadyNotified.add(key);

                new Notification("EduPath AI Reminder 🔔", {
                    body: `${task.title} — ${task.minutes} minutes`,
                    tag: key,
                });
            }
        });
    } catch (error) {
        console.log("Reminder check failed", error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("enableNotifications");
    if (btn) btn.addEventListener("click", askNotificationPermission);

    setInterval(checkTaskReminders, 30000);
    checkTaskReminders();
});

/* Dark mode v2.1 */
function applyStoredTheme() {
    const storedTheme = localStorage.getItem("edupath-theme");
    if (storedTheme === "dark") {
        document.body.classList.add("dark-mode");
    } else {
        document.body.classList.remove("dark-mode");
    }
    const btn = document.getElementById("themeToggle");
    if (btn) {
        btn.textContent = document.body.classList.contains("dark-mode") ? "☀️ Light Mode" : "🌙 Dark Mode";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    applyStoredTheme();
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");
            localStorage.setItem("edupath-theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
            applyStoredTheme();
        });
    }
});


/* EduPath AI v4.0 Smart Adaptive Task System */
const SMART_TASK_DATA = {
  "حفظ القرآن الكريم": {
    icon: "ق",
    main: ["حفظ جديد","مراجعة","تسميع","تجويد","تفسير مبسط","خطة حفظ","اختبار حفظ","أخرى"],
    sub: {
      "حفظ جديد": ["الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس","هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه","الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم","لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر","فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق","الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة","الصف","الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج","نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس","التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد","الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات","القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر","المسد","الإخلاص","الفلق","الناس","أخرى"],
      "مراجعة": ["مراجعة يومية","مراجعة أسبوعية","مراجعة جزء","مراجعة حزب","مراجعة سورة","مراجعة أخطاء","أخرى"],
      "تسميع": ["تسميع ذاتي","تسميع مع شخص","تسميع صفحة","تسميع سورة","تسميع جزء","أخرى"],
      "تجويد": ["مخارج الحروف","أحكام النون الساكنة والتنوين","أحكام الميم الساكنة","المدود","القلقلة","الغنة","أحكام الراء","أخرى"],
      "تفسير مبسط": ["معاني الكلمات","سبب النزول","الفكرة العامة","فوائد عملية","أخرى"],
      "خطة حفظ": ["ورد يومي","ورد أسبوعي","تثبيت الحفظ","تقسيم السورة","أخرى"],
      "اختبار حفظ": ["اختبار صفحة","اختبار سورة","اختبار جزء","اختبار أخطاء","أخرى"],
      "أخرى": ["موضوع مخصص","أخرى"]
    },
    detail: {
      "الفاتحة": ["الآيات 1-7","السورة كاملة","أخرى"],
      "البقرة": ["الآيات 1-5","آية الكرسي","آخر آيتين","صفحة","ربع حزب","أخرى"],
      "أخرى": ["آيات محددة","صفحة محددة","سورة كاملة","أخرى"]
    },
    training: ["حفظ","مراجعة","تسميع","تثبيت","قراءة بالتجويد","استماع للقارئ","تصحيح أخطاء","تدبر","أخرى"]
  },

  "المرحلة الثانوية": {
    icon: "ث",
    main: ["القرآن الكريم","التربية الإسلامية","اللغة العربية","اللغة الإنجليزية","الرياضيات","الفيزياء","الكيمياء","الأحياء","التاريخ","الجغرافيا","المجتمع","أخرى"],
    sub: {
      "القرآن الكريم": ["حفظ","مراجعة","تلاوة","تفسير","أحكام التجويد","أخرى"],
      "التربية الإسلامية": ["العقيدة","الفقه","الحديث","السيرة","الأخلاق","أخرى"],
      "اللغة العربية": ["النحو","الصرف","البلاغة","الأدب","القراءة","التعبير","الإملاء","أخرى"],
      "اللغة الإنجليزية": ["Reading","Listening","Writing","Speaking","Vocabulary","Grammar","أخرى"],
      "الرياضيات": ["الجبر","الهندسة","المثلثات","التفاضل","التكامل","الإحصاء","الاحتمالات","أخرى"],
      "الفيزياء": ["الميكانيكا","الكهرباء","المغناطيسية","الحرارة","الضوء","الموجات","أخرى"],
      "الكيمياء": ["الحسابات الكيميائية","المحاليل","الأحماض والقواعد","الكيمياء العضوية","الروابط الكيميائية","أخرى"],
      "الأحياء": ["الخلية","الوراثة","الجهاز العصبي","الجهاز الدوري","النبات","البيئة","أخرى"],
      "التاريخ": ["درس","شخصيات","أحداث","خرائط","مراجعة","أخرى"],
      "الجغرافيا": ["خرائط","مناخ","سكان","موارد","مراجعة","أخرى"],
      "المجتمع": ["قضايا اجتماعية","مفاهيم","مراجعة","أخرى"],
      "أخرى": ["درس","وحدة","مراجعة","اختبار","أخرى"]
    },
    detail: {"أخرى": ["شرح درس","حل تمارين","مراجعة وحدة","اختبار قصير","أخرى"]},
    training: ["دراسة الدرس","حل تمارين","تلخيص","مراجعة","حفظ","اختبار ذاتي","تصحيح أخطاء","تحضير للاختبار","أخرى"]
  },

  "المرحلة الجامعية": {
    icon: "ج",
    main: ["علوم الحاسوب","هندسة البرمجيات","الذكاء الاصطناعي","علم البيانات","الأمن السيبراني","تقنية المعلومات","هندسة الحاسوب","الهندسة","الطب","الصيدلة","طب الأسنان","التمريض","إدارة الأعمال","المحاسبة","التمويل","الاقتصاد","التسويق","الإدارة","القانون","الشريعة والقانون","الدراسات الإسلامية","التربية","اللغة الإنجليزية","اللغة العربية","الترجمة","الإعلام","العلوم السياسية","علم النفس","علم الاجتماع","الفيزياء","الكيمياء","الأحياء","الهندسة المعمارية","الزراعة","أخرى"],
    sub: {
      "علوم الحاسوب": ["البرمجة","الخوارزميات","هياكل البيانات","قواعد البيانات","أنظمة التشغيل","شبكات الحاسوب","تطوير الويب","الذكاء الاصطناعي","الرياضيات المتقطعة","مشروع جامعي","أخرى"],
      "هندسة البرمجيات": ["تحليل المتطلبات","تصميم النظام","اختبار البرمجيات","إدارة المشاريع","توثيق البرمجيات","أخرى"],
      "الذكاء الاصطناعي": ["تعلم الآلة","التعلم العميق","معالجة اللغة الطبيعية","الرؤية الحاسوبية","مشروع عملي","أخرى"],
      "علم البيانات": ["تنظيف البيانات","تحليل البيانات","تصور البيانات","النمذجة","الإحصاء","أخرى"],
      "الأمن السيبراني": ["أساسيات الأمن","أمن الشبكات","أمن الويب","Linux","التشفير","الثغرات","أخرى"],
      "أخرى": ["محاضرة","واجب","بحث","مشروع","مراجعة اختبار","أخرى"]
    },
    detail: {
      "البرمجة": ["موضوع محاضرة","تطبيق عملي","سؤال واجب","ميزة في مشروع","مراجعة اختبار","أخرى"],
      "الخوارزميات": ["بحث","ترتيب","استدعاء ذاتي","برمجة ديناميكية","رسوم بيانية","تحليل التعقيد","أخرى"],
      "قواعد البيانات": ["تصميم الجداول","استعلامات SQL","علاقات","تطبيع البيانات","مشروع قاعدة بيانات","أخرى"],
      "أخرى": ["موضوع","فصل","محاضرة","أخرى"]
    },
    training: ["دراسة محاضرة","حل واجب","تطبيق عملي","عمل على مشروع","مراجعة اختبار","بحث","عرض تقديمي","حل مشكلات","حل تمارين","إعداد تقرير","مراجعة مصطلحات","تحليل حالة","حفظ مصطلحات","أخرى"]
  },

  "اللغات": {
    icon: "ل",
    main: ["الإنجليزية","الصينية","التركية","الروسية","الإندونيسية","الرومانية","العربية","الفرنسية","الألمانية","أخرى"],
    sub: {
      "الإنجليزية": ["القراءة","الاستماع","التحدث","الكتابة","الاختبارات","القواعد","المفردات","النطق","اللغة الأكاديمية","أخرى"],
      "الصينية": ["القراءة","الاستماع","التحدث","الكتابة","HSK","HSKK","المفردات","النطق","القواعد","أخرى"],
      "التركية": ["القراءة","الاستماع","التحدث","الكتابة","المفردات","النطق","القواعد","أخرى"],
      "الروسية": ["القراءة","الاستماع","التحدث","الكتابة","المفردات","النطق","القواعد","أخرى"],
      "أخرى": ["القراءة","الاستماع","التحدث","الكتابة","القواعد","المفردات","النطق","أخرى"]
    },
    detail: {
      "القراءة": ["فهم الفكرة العامة","استخراج التفاصيل","فهم الاستنتاجات","فهم المفردات من السياق","القراءة السريعة","القراءة التحليلية","القراءة الأكاديمية","قراءة المقالات","قراءة الأخبار","قراءة القصص","أخرى"],
      "الاستماع": ["فهم الفكرة الرئيسية","فهم التفاصيل","فهم اللهجات","الاستماع الأكاديمي","الاستماع اليومي","المحاضرات","الأخبار","المحادثات","البودكاست","أخرى"],
      "التحدث": ["المحادثات اليومية","العروض التقديمية","المناقشات","وصف الصور","التحدث الأكاديمي","مقابلات القبول","مقابلات العمل","أخرى"],
      "الكتابة": ["الكتابة العامة","الكتابة الأكاديمية","كتابة المقالات","كتابة الرسائل","كتابة التقارير","كتابة الملاحظات","كتابة الحجج","أخرى"],
      "الاختبارات": ["IELTS","TOEFL","Duolingo","HSK","CSCA","SAT","ACT","GRE","GMAT","أخرى"],
      "القواعد": ["الأزمنة","بناء الجملة","أدوات الربط","الجمل الشرطية","المبني للمجهول","حروف الجر","الأخطاء الشائعة","تطبيق القواعد في الكتابة","أخرى"],
      "المفردات": ["مفردات يومية","مفردات أكاديمية","مفردات الاختبارات","مرادفات ومتضادات","تعبيرات شائعة","مفردات حسب الموضوع","مراجعة المفردات","أخرى"],
      "النطق": ["تصحيح مخارج الحروف","النبر والتنغيم","الطلاقة","المحاكاة الصوتية","تسجيل الصوت","تقليد المتحدث","أخرى"],
      "اللغة الأكاديمية": ["المقالات الأكاديمية","الأبحاث","العروض التقديمية","المناقشات الأكاديمية","المفردات الأكاديمية","الاستماع الأكاديمي","الكتابة الأكاديمية","أخرى"],
      "أخرى": ["موضوع مخصص","أخرى"]
    },
    training: ["قراءة نص","حل أسئلة فهم","تلخيص النص","تحليل النص","استخراج الأفكار الرئيسية","استخراج المفردات","تدوين الملاحظات","مراجعة الأخطاء","الاستماع للمقطع","الإجابة عن الأسئلة","التحدث الحر","تسجيل صوتي","محاكاة مقابلة","كتابة مسودة","تصحيح الكتابة","إعادة الصياغة","تحسين الأسلوب","أخرى"]
  },

  "البرمجة والتكنولوجيا": {
    icon: "ب",
    main: ["Python","C","C++","Java","JavaScript","TypeScript","HTML","CSS","SQL","Flask","Django","React","Node.js","Git / GitHub","تطوير الويب","تطوير الواجهة الأمامية","تطوير الخلفية","تطوير متكامل","قواعد البيانات","الخوارزميات","هياكل البيانات","حل المشكلات","تصحيح الأخطاء","هندسة البرمجيات","اختبار البرمجيات","أنظمة التشغيل","شبكات الحاسوب","الأمن السيبراني","الحوسبة السحابية","DevOps","APIs","الذكاء الاصطناعي","تعلم الآلة","علم البيانات","المشاريع","التوثيق","أخرى"],
    sub: {
      "Python": ["الصياغة","المتغيرات","أنواع البيانات","الشروط","الحلقات","الدوال","القوائم","القواميس","الملفات","OOP","الوحدات","المكتبات","Flask","تحليل البيانات","الأتمتة","مشاريع","تصحيح الأخطاء","أخرى"],
      "تطوير الويب": ["HTML","CSS","Responsive Design","Bootstrap","Tailwind CSS","JavaScript","DOM","Async JavaScript","API","JSON","Frontend","Backend","Full Stack","Flask","Django","React","Node.js","Express.js","Authentication","Session Management","REST API","Database Integration","SQLite","MySQL","PostgreSQL","Deployment","Debugging","Testing","Security Basics","Performance Optimization","Project Building","Revision","Portfolio Development","Open Source Contribution","أخرى"],
      "الخوارزميات": ["البحث","الترتيب","الاستدعاء الذاتي","الخوارزميات الجشعة","البرمجة الديناميكية","خوارزميات الرسوم البيانية","الأشجار","تحليل التعقيد","أخرى"],
      "الأمن السيبراني": ["أساسيات الأمن","أمن الشبكات","أمن الويب","Linux","التشفير","أساسيات الاختبار الأخلاقي","الثغرات","المصادقة","OWASP","أخرى"],
      "أخرى": ["مفاهيم","تطبيق","مشروع","تصحيح أخطاء","مراجعة","أخرى"]
    },
    detail: {
      "Python": ["الكائنات والفئات","الوراثة","التعامل مع الملفات","تطبيق على القوائم","تطبيق على القواميس","طلب API","مسار Flask","أخرى"],
      "الخوارزميات": ["مسألة تدريبية","تحليل الحل","تحسين التعقيد","اختبار الحل","أخرى"],
      "تطوير الويب": ["HTML","CSS","Responsive Design","Frontend","Backend","Full Stack","API","Database Integration","Deployment","Project Building","Portfolio Development","أخرى"],
      "أخرى": ["موضوع","ميزة","خطأ","أخرى"]
    },
    training: ["فهم المفهوم","كتابة كود","بناء مشروع صغير","تصحيح الكود","قراءة التوثيق","تحسين الكود","تطبيق الصياغة البرمجية","بناء تطبيق","بناء صفحة","تصميم الواجهة","إصلاح خطأ","ربط الخلفية","إنشاء نموذج","جعله متجاوباً","نشر الموقع","تحسين الواجهة","تطبيق بمشروع","أخرى"]
  },

  "الذكاء الاصطناعي": {
    icon: "ذ",
    main: ["تعلم الآلة","التعلم العميق","معالجة اللغة الطبيعية","الرؤية الحاسوبية","التعلم المعزز","علم البيانات","مشاريع ذكاء اصطناعي","أخرى"],
    sub: {
      "تعلم الآلة": ["تنظيف البيانات","هندسة الخصائص","النماذج","تدريب النموذج","تقييم النموذج","Scikit-learn","أخرى"],
      "التعلم العميق": ["الشبكات العصبية","CNN","RNN","Transformers","PyTorch","TensorFlow","أخرى"],
      "مشاريع ذكاء اصطناعي": ["مجموعة بيانات","تنظيف البيانات","تدريب النموذج","تقييم النموذج","نشر المشروع","أخرى"],
      "أخرى": ["مفاهيم","تطبيق","مشروع","بحث","أخرى"]
    },
    detail: {"تعلم الآلة": ["تصنيف","انحدار","تجميع","مقارنة النماذج","الدقة","أخرى"], "أخرى": ["موضوع","أخرى"]},
    training: ["تعلم","تجربة","تقييم النموذج","بناء مشروع","قراءة بحث","تحليل البيانات","تنظيف البيانات","اختبار النموذج","أخرى"]
  },

  "الرياضيات": {
    icon: "ر",
    main: ["الجبر","الهندسة","المثلثات","التفاضل والتكامل","الاحتمالات","الإحصاء","الجبر الخطي","الرياضيات المتقطعة","اختبارات سابقة","أخرى"],
    sub: {
      "الجبر": ["المعادلات","المتباينات","الدوال","كثيرات الحدود","مسائل لفظية","أخرى"],
      "التفاضل والتكامل": ["النهايات","المشتقات","التكامل","التطبيقات","أخرى"],
      "الإحصاء": ["مقدمة في الإحصاء", "تعريف الإحصاء", "أهمية الإحصاء", "فروع الإحصاء", "الإحصاء الوصفي", "الإحصاء الاستدلالي", "تطبيقات الإحصاء", "الإحصاء في الحياة اليومية", "الإحصاء في الطب", "الإحصاء في الهندسة", "الإحصاء في الاقتصاد", "الإحصاء في علوم الحاسوب", "الإحصاء في الذكاء الاصطناعي", "الإحصاء في علم البيانات", "الإحصاء في البحث العلمي", "البيانات", "تعريف البيانات", "مصادر البيانات", "طرق جمع البيانات", "أنواع البيانات", "البيانات النوعية", "البيانات الكمية", "البيانات المنفصلة", "البيانات المستمرة", "المجتمع الإحصائي", "العينة", "أنواع العينات", "العينة العشوائية", "العينة المنتظمة", "العينة الطبقية", "العينة العنقودية", "التعداد الشامل", "المتغيرات", "المتغير المستقل", "المتغير التابع", "الثوابت", "مستويات القياس", "المقياس الاسمي", "المقياس الترتيبي", "المقياس الفئوي", "المقياس النسبي", "جودة البيانات", "الدقة", "الصدق", "الموثوقية", "التحيز", "الأخطاء الإحصائية", "التطبيقات الواقعية", "حل الأمثلة", "حل المسائل", "المراجعة الشاملة", "اختبار قصير", "اختبار تجريبي", "الاستعداد للجزء الثاني", "نوعية"],
      "أخرى": ["درس","تمارين","مراجعة","اختبار","أخرى"]
    },
    detail: {"الجبر": ["مجموعة تمارين","قانون","سؤال سابق","موضوع صعب","أخرى"], "أخرى": ["موضوع","أخرى"]},
    training: ["دراسة الدرس","حل التمارين","مراجعة الأخطاء","تدريب بوقت محدد","التحضير للاختبار","حفظ القوانين","أخرى"]
  },

  "المنح الدراسية": {
    icon: "م",
    main: ["البحث عن منحة","بحث الجامعات","نموذج التقديم","المستندات","السيرة الذاتية","خطاب الدافع","البيان الشخصي","خطاب التوصية","المقابلة","اختبار اللغة","البورتفوليو","التواصل بالبريد","التأشيرة","الاستعداد للسفر","المتابعة","أخرى"],
    sub: {
      "خطاب الدافع": ["مسودة","تعديل","تخصيص","مراجعة نهائية","أخرى"],
      "المقابلة": ["التعريف بالنفس","لماذا التخصص","لماذا المنحة","الخطط المستقبلية","تدريب مقابلة","أخرى"],
      "المستندات": ["جواز السفر","كشف الدرجات","شهادة التخرج","شهادة اللغة","الترجمة","التصديق","رفع المستندات","مراجعة المستندات","أخرى"],
      "أخرى": ["بحث","تجهيز","كتابة","تعديل","رفع","تقديم","متابعة","أخرى"]
    },
    detail: {"خطاب الدافع": ["الفقرة الافتتاحية","الإنجازات","الأهداف المستقبلية","التوافق مع الجامعة","أخرى"], "المقابلة": ["سؤال تدريبي","تحسين الإجابة","ملاحظات","أخرى"], "أخرى": ["موضوع","أخرى"]},
    training: ["بحث","تجهيز","كتابة","تعديل","رفع","تقديم","متابعة","تدريب مقابلة","فحص نهائي","أخرى"]
  },

  "الاختبارات والشهادات": {
    icon: "خ",
    main: ["IELTS","TOEFL","Duolingo","HSK","CSCA","SAT","ACT","GRE","GMAT","أخرى"],
    sub: {
      "IELTS": ["Mock Test","Listening","Reading","Writing","Speaking","Timed Practice","أخرى"],
      "TOEFL": ["Mock Test","Reading","Listening","Speaking","Writing","Timed Practice","أخرى"],
      "Duolingo": ["Mock Test","Reading","Listening","Writing","Speaking","Timed Practice","أخرى"],
      "HSK": ["Mock Test","Listening","Reading","Writing","Vocabulary","Grammar","Timed Practice","أخرى"],
      "CSCA": ["Mock Test","Mathematics","Physics","Chemistry","English","Timed Practice","أخرى"],
      "SAT": ["Full Digital SAT","Mock Test","Reading and Writing","Math","Timed Practice","أخرى"],
      "ACT": ["Full ACT","Mock Test","English","Mathematics","Reading","Science","Writing","Timed Practice","أخرى"],
      "GRE": ["Full GRE","Mock Test","Analytical Writing","Verbal Reasoning","Quantitative Reasoning","Timed Practice","أخرى"],
      "GMAT": ["Full GMAT","Mock Test","Quantitative Reasoning","Verbal Reasoning","Data Insights","Timed Practice","أخرى"],
      "أخرى": ["Mock Test","Timed Practice","Practice","أخرى"]
    },
    detail: {
      "Listening": ["Multiple Choice","Matching","Plan Labelling","Map Labelling","Diagram Labelling","Form Completion","Note Completion","Table Completion","Flow Chart Completion","Summary Completion","Sentence Completion","Short Answer Questions","Listen and Choose a Response","Listen to a Conversation","Listen to an Announcement","Listen to an Academic Talk","Listen and Type","Interactive Listening","أخرى"],
      "Reading": ["Matching Headings","Matching Information","Matching Features","Matching Sentence Endings","True False Not Given","Yes No Not Given","Multiple Choice","Sentence Completion","Summary Completion","Note Completion","Table Completion","Flow Chart Completion","Diagram Labelling","Short Answer Questions","Read in Daily Life","Read an Academic Passage","Complete the Words","Read and Select","Fill in the Blanks","Read and Complete","Interactive Reading","أخرى"],
      "Writing": ["Task 1","Task 2","Academic Graph","Table","Chart","Process Diagram","Map","Opinion Essay","Discussion Essay","Problem Solution Essay","Advantages Disadvantages Essay","Double Question Essay","Build a Sentence","Write an Email","Write for an Academic Discussion","Write About the Photo","Writing Sample","Interactive Writing","أخرى"],
      "Speaking": ["Part 1","Part 2","Part 3","Speak About the Photo","Read, Then Speak","Speaking Sample","Interactive Speaking","Listen and Repeat","Take an Interview","Cue Card Practice","أخرى"],
      "Mathematics": ["Sets and Variables","Functions","Geometry and Algebra","Probability and Statistics"],
      "Physics": ["Mechanics","Electromagnetism","Thermodynamics","Optics","Modern Physics"],
      "Chemistry": ["Basic Chemical Calculations","Properties and Reactions of Matter","Chemical Theories and Laws","Chemical Experiments and Applications"],
      "English": ["Reading","Listening","Writing","Vocabulary","Grammar"],
      "أخرى": ["أخرى"]
    },
    training: ["Practice","Timed Practice","Mock Test","Error Review","Weakness Training","Final Review","أخرى"]
  },

  "الحياة اليومية": {
    icon: "ح",
    main: ["الصحة","الرياضة","النوم","شرب الماء","التغذية","الروتين الشخصي","العائلة","إدارة الوقت","إدارة المال","الصلاة","التسوق","ترتيب المنزل","تنظيف المنزل","القراءة","الاسترخاء","أخرى"],
    sub: {
      "الصحة": ["التغذية","شرب الماء","الفحوصات الطبية","الوقاية الصحية","العادات الصحية","العناية الصحية","أخرى"],
      "الروتين الشخصي": ["ترتيب اليوم","العناية الشخصية","النظافة الشخصية","العناية بالبشرة","العناية بالشعر","الراحة النفسية","أخرى"],
      "الصلاة": ["صلاة الفجر","الصلوات الخمس","النوافل","الأذكار بعد الصلاة","المحافظة على الوقت","أخرى"],
      "أخرى": ["عادة يومية","روتين أسبوعي","تذكير مهم","مهمة شخصية","أخرى"]
    },
    detail: {"أخرى": ["موضوع عام","أخرى"]},
    training: ["تنفيذ المهمة","متابعة العادة","مراجعة التقدم","تثبيت العادة","تحسين الروتين","تجهيز مسبق","فحص سريع","تذكير يومي","مراجعة أسبوعية","أخرى"]
  },

  "المشاريع": {
    icon: "ش",
    main: ["مشروع برمجي","مشروع ذكاء اصطناعي","مشروع ويب","تطبيق هاتف","مشروع بحثي","مشروع مدرسي","مشروع جامعي","بورتفوليو للمنح","مشروع شخصي","أخرى"],
    sub: {
      "مشروع برمجي": ["الفكرة","التخطيط","التصميم","الواجهة الأمامية","الخلفية","قاعدة البيانات","الاختبار","تصحيح الأخطاء","النشر","التوثيق","العرض التقديمي","أخرى"],
      "أخرى": ["الفكرة","التخطيط","البناء","الاختبار","التحسين","أخرى"]
    },
    detail: {"مشروع برمجي": ["ميزة","خطأ","صفحة","API","جدول قاعدة بيانات","أخرى"], "أخرى": ["موضوع","أخرى"]},
    training: ["عصف ذهني","بناء","كتابة كود","اختبار","تحسين","نشر","كتابة التوثيق","مراجعة","أخرى"]
  },

  "القراءة والبحث": {
    icon: "ب",
    main: ["القراءة","البحث العلمي","الكتب","المقالات","الأبحاث","المراجعات","التلخيص","التفكير النقدي","التعلم الذاتي","أخرى"],
    sub: {
      "الكتب": ["علوم الحاسوب","الذكاء الاصطناعي","الرياضيات","الفيزياء","الكيمياء","الأحياء","الاقتصاد","إدارة الأعمال","التاريخ","الفلسفة","علم النفس","اللغة العربية","اللغة الإنجليزية","التنمية الذاتية","السير الذاتية","الروايات","الأدب","الدين","التفسير","الحديث","الفقه","العقيدة","أخرى"],
      "البحث العلمي": ["اختيار موضوع","جمع مراجع","قراءة أوراق علمية","تحليل النتائج","توثيق المراجع","كتابة البحث","مراجعة البحث","أخرى"],
      "أخرى": ["قراءة","تلخيص","تحليل","تدوين ملاحظات","أخرى"]
    },
    detail: {"أخرى": ["موضوع عام","أخرى"]},
    training: ["قراءة","تلخيص","استخراج أفكار","تحليل","مراجعة","مناقشة","تدوين ملاحظات","بناء خريطة ذهنية","مقارنة","تطبيق عملي","جمع مراجع","قراءة أوراق علمية","تحليل النتائج","توثيق المراجع","كتابة البحث","أخرى"]
  },

  "عام": {
    icon: "ع",
    main: ["التعلم","التطبيق العملي","المراجعة","التخطيط","المتابعة","موضوع عام","أخرى"],
    sub: {"أخرى": ["موضوع","مهمة","مراجعة","تذكير","أخرى"]},
    detail: {"أخرى": ["موضوع عام","أخرى"]},
    training: ["تنفيذ مهمة","مراجعة","تخطيط","متابعة","تحسين","أخرى"]
  },

  "أخرى": {
    icon: "أ",
    main: ["موضوع مخصص","مهمة شخصية","تذكير","أخرى"],
    sub: {"أخرى": ["موضوع","مهمة","ملاحظة","أخرى"]},
    detail: {"أخرى": ["موضوع عام","أخرى"]},
    training: ["تنفيذ مهمة","مراجعة","متابعة","أخرى"]
  }
};


/* EduPath AI v4.6.6 Full Arabic UI */
const EDUPATH_LABEL_AR = {
    "حفظ القرآن الكريم": "حفظ القرآن الكريم",
    "المرحلة الثانوية": "المرحلة الثانوية",
    "المرحلة الجامعية": "المرحلة الجامعية",
    "اللغات": "اللغات",
    "البرمجة والتكنولوجيا": "البرمجة والتكنولوجيا",
    "الذكاء الاصطناعي": "الذكاء الاصطناعي",
    "الرياضيات": "الرياضيات",
    "المنح الدراسية": "المنح الدراسية",
    "الاختبارات والشهادات": "الاختبارات والشهادات",
    "الحياة اليومية": "الحياة اليومية",
    "المشاريع": "المشاريع",
    "القراءة والبحث": "القراءة والبحث",
    "عام": "عام",
    "أخرى": "أخرى"
};


Object.assign(EDUPATH_LABEL_AR, {
    "Memorization": "الحفظ",
    "Revision": "المراجعة",
    "Recitation": "التلاوة",
    "Tajweed": "التجويد",
    "Interpretation": "التفسير",
    "History": "التاريخ",
    "Geography": "الجغرافيا",
    "Society / Social Studies": "المجتمع / الدراسات الاجتماعية",
    "Biology": "الأحياء",
    "Physics": "الفيزياء",
    "Chemistry": "الكيمياء",
    "Lesson Review": "مراجعة الدرس",
    "Formula Review": "مراجعة القوانين",
    "Past Questions": "أسئلة سابقة",
    "Difficult Problems": "مسائل صعبة",
    "Study Lesson": "دراسة الدرس",
    "Solve Exercises": "حل التمارين",
    "Review Mistakes": "مراجعة الأخطاء",
    "Timed Practice": "تدريب مؤقت",
    "Prepare for Exam": "التحضير للاختبار",
    "Memorize Formulas": "حفظ القوانين",
    "Write Paragraph": "كتابة فقرة",
    "Listen and Repeat": "استماع وتكرار",
    "أخرى": "أخرى"
});

function labelForUI(value) {
    const oldToArabic = {
        "أخرى": "أخرى",
        "أخرى": "أخرى"
    };
    return oldToArabic[value] || value;
}

function translateDynamicOptions() {
    document.querySelectorAll("select option").forEach(option => {
        option.textContent = labelForUI(option.value || option.textContent);
    });

    document.querySelectorAll(".task-type-card strong").forEach(el => {
        const type = el.closest(".task-type-card")?.dataset?.type || el.textContent;
        el.textContent = labelForUI(type);
    });
}

function fillSmartSelect(select, values, selectedValue) {
    if (!select) return;
    select.innerHTML = "";
    const unique = [...new Set(values && values.length ? values : ["أخرى"])];
    unique.forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = labelForUI(value);
        if (selectedValue && selectedValue === value) option.selected = true;
        select.appendChild(option);
    });
}

function getSmartConfig(type) {
    const oldToArabic = {
        "أخرى": "أخرى"
    };
    const stableType = oldToArabic[type] || type || "عام";
    return SMART_TASK_DATA[stableType] || SMART_TASK_DATA["عام"];
}

function selectedOrFirst(values, selected) {
    if (selected && values && values.includes(selected)) return selected;
    return values && values.length ? values[0] : "أخرى";
}

function renderTaskTypeCards() {
    const grid = document.getElementById("taskTypeCards");
    const categoryInput = document.getElementById("categorySelect");
    if (!grid || !categoryInput) return;

    grid.innerHTML = "";
    const current = ({"Daily Life":"الحياة اليومية"}[categoryInput.value] || categoryInput.value || "عام");

    Object.entries(SMART_TASK_DATA).forEach(([type, config]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "task-type-card" + (type === current ? " active" : "");
        button.dataset.type = type;
        button.innerHTML = `<span>${config.icon || "⭐"}</span><strong>${labelForUI(type)}</strong>`;
        button.addEventListener("click", () => {
            categoryInput.value = type;
            document.querySelectorAll(".task-type-card").forEach(card => card.classList.remove("active"));
            button.classList.add("active");
            const topicSelect = document.getElementById("topicSelect");
            const skillSelect = document.getElementById("skillSelect");
            const detailSelect = document.getElementById("detailedTopicSelect");
            const trainingSelect = document.getElementById("trainingTypeSelect");
            if (topicSelect) topicSelect.dataset.current = "";
            if (skillSelect) skillSelect.dataset.current = "";
            if (detailSelect) detailSelect.dataset.current = "";
            if (trainingSelect) trainingSelect.dataset.current = "";
            updateSmartTaskFields();
            document.getElementById("taskDetailsArea")?.scrollIntoView({behavior: "smooth", block: "start"});
        });
        grid.appendChild(button);
    });
}



const CSCA_SUBJECTS = ["Mathematics","Physics","Chemistry"];

const CSCA_MAIN_TOPICS = {
    "Mathematics": ["Sets and Inequalities","Functions","Geometry and Algebra","Probability and Statistics"],
    "Physics": ["Mechanics","Electromagnetism","Thermodynamics","Optics","Modern Physics"],
    "Chemistry": ["Basic Chemical Concepts and Calculations","Properties and Reactions of Substances","Chemical Theories and Laws","Chemical Experiments and Applications"]
};

const CSCA_DETAILED_TOPICS = {
    "Sets and Inequalities": ["Definition of Sets","Set Operations","Set Representation","Quadratic Inequalities","Rational Inequalities","Solving Inequalities","Properties of Inequalities"],
    "Functions": ["Function Concepts","Domain","Range","Monotonicity","Parity","Power Functions","Exponential Functions","Logarithmic Functions","Trigonometric Functions","Sequences","Arithmetic Sequences","Geometric Sequences","Series Summation","Derivatives","Geometric Meaning of Derivatives","Applications of Derivatives"],
    "Geometry and Algebra": ["Lines","Circles","Ellipses","Hyperbolas","Parabolas","Vectors","Vector Operations","Complex Numbers","Complex Operations","Coordinate Geometry","Space Coordinates","Solid Geometry","Properties of Solids"],
    "Probability and Statistics": ["Classical Probability","Probability Calculations","Mean","Variance","Data Analysis","Normal Distribution"],

    "Mechanics": ["Displacement","Velocity","Acceleration","Uniform Acceleration","Free Fall","Newton Laws","Applications of Newton Laws","Momentum","Impulse","Conservation of Momentum","Work","Energy","Conservation of Mechanical Energy","Circular Motion","Universal Gravitation","Simple Harmonic Motion","Mechanical Waves"],
    "Electromagnetism": ["Coulomb Law","Electric Field","Electric Potential","Ohm Law","Series Circuits","Parallel Circuits","Magnetic Induction","Ampere Force","Lorentz Force","Faraday Law","Lenz Law"],
    "Thermodynamics": ["Kinetic Theory of Gases","Ideal Gas Equation","First Law of Thermodynamics"],
    "Optics": ["Reflection","Refraction","Interference","Diffraction"],
    "Modern Physics": ["Photoelectric Effect","Atomic Structure","Nuclear Physics"],

    "Basic Chemical Concepts and Calculations": ["Classification of Matter","State Changes","Chemical Notation","Chemical Equations","Solution Concentration","pH Calculations","Amount of Substance","Mole Calculations","Ideal Gas Law"],
    "Properties and Reactions of Substances": ["Elements","Oxides","Acids","Bases","Salts","Hydrocarbons","Organic Derivatives","Redox Reactions","Ionic Reactions","Chemical Testing Methods"],
    "Chemical Theories and Laws": ["Atomic Structure","Periodic Law","Chemical Bonds","Intermolecular Forces","Reaction Rate","Chemical Equilibrium","Electrolyte Solutions"],
    "Chemical Experiments and Applications": ["Laboratory Safety","Laboratory Apparatus","Gas Preparation","Gas Identification","Separation Methods","Purification Methods","Industrial Chemical Processes","Ammonia Synthesis"]
};

const CSCA_TRAINING_TYPES = ["Study Theory","Concept Review","Solved Examples","Practice Questions","Timed Practice","Mock Test","Review Mistakes","Formula Review","Flashcards","Weakness Training","Final Revision","Full Exam Simulation","أخرى"];


function getOfficialExamDetails(exam, skill) {
    const data = {
        "IELTS": {
            "Listening": ["Everyday Conversation","Everyday Monologue","Educational Discussion","Academic Lecture"],
            "Reading": ["Academic Reading","General Training Reading"],
            "Writing": ["Task 1 Academic","Task 2 Academic","Task 1 General","Task 2 General"],
            "Speaking": ["Part 1","Part 2","Part 3"]
        },
        "TOEFL": {
            "Reading": ["Complete the Words","Read in Daily Life","Read an Academic Passage"],
            "Listening": ["Listen and Choose a Response","Listen to a Conversation","Listen to an Announcement","Listen to an Academic Talk"],
            "Writing": ["Build a Sentence","Write an Email","Write for an Academic Discussion"],
            "Speaking": ["Listen and Repeat","Take an Interview"]
        },
        "Duolingo English Test": {
            "Reading": ["Read and Select","Fill in the Blanks","Read and Complete","Interactive Reading"],
            "Listening": ["Listen and Type","Interactive Listening"],
            "Writing": ["Write About the Photo","Writing Sample","Interactive Writing"],
            "Speaking": ["Speak About the Photo","Read Then Speak","Speaking Sample","Interactive Speaking"]
        },
        "CSCA": {
            "Chinese": ["Mathematics","Physics","Chemistry"],
            "English": ["Mathematics","Physics","Chemistry"]
        },
        "HSK": {
            "Listening": ["Dialogue","Conversation","Announcement","Lecture"],
            "Reading": ["Vocabulary Recognition","Sentence Completion","Passage Understanding"],
            "Writing": ["Character Writing","Sentence Formation","Essay Writing"],
            "Vocabulary": ["HSK Word List","Character Review","Pinyin Practice"],
            "Characters": ["Stroke Order","Recognition","Writing Practice"]
        }
    };
    return data[exam] && data[exam][skill] ? data[exam][skill] : null;
}

function getOfficialExamTraining(exam, skill) {
    const data = {
        "IELTS": {
            "Listening": ["Multiple Choice","Matching","Plan Labelling","Map Labelling","Diagram Labelling","Form Completion","Note Completion","Table Completion","Flow Chart Completion","Summary Completion","Sentence Completion","Timed Practice","Review Mistakes"],
            "Reading": ["Gap Filling","Table Completion","Matching Headings","Diagram Matching","Chart Matching","Sentence Completion","Short Answer Questions","Multiple Choice","Skimming","Scanning","Timed Practice","Review Mistakes"],
            "Writing": ["Draft Response","Timed Writing","Task Analysis","Vocabulary Upgrade","Grammar Accuracy","Feedback Review","Rewrite Response"],
            "Speaking": ["Mock Interview","Fluency Practice","Pronunciation Practice","Vocabulary Practice","Record Response","Review Mistakes"]
        },
        "TOEFL": {
            "Reading": ["Practice","Timed Practice","Review Mistakes","Vocabulary Focus","Comprehension Focus","Mock Reading"],
            "Listening": ["Practice","Note Taking","Listening for Details","Listening for Main Idea","Timed Practice","Review Mistakes"],
            "Writing": ["Draft Writing","Timed Writing","Grammar Review","Feedback Review","Rewrite Response","Practice"],
            "Speaking": ["Pronunciation Practice","Fluency Practice","Record Response","Shadowing","Mock Speaking","Review Mistakes"]
        },
        "Duolingo English Test": {
            "Reading": ["Practice","Timed Practice","Accuracy Review","Vocabulary Review","Mistake Review"],
            "Listening": ["Listen and Type Practice","Interactive Listening Practice","Dictation","Review Mistakes"],
            "Writing": ["Timed Writing","Photo Description","Sample Writing","Interactive Writing","Feedback Review"],
            "Speaking": ["Photo Speaking","Read Then Speak","Interactive Speaking","Record Response","Fluency Practice"]
        },
        "CSCA": {
            "Chinese": ["Study Theory","Concept Review","Practice Questions","Timed Practice","Mock Test","Review Mistakes"],
            "English": ["Study Theory","Concept Review","Practice Questions","Timed Practice","Mock Test","Review Mistakes"]
        },
        "HSK": {
            "Listening": ["Listening Practice","Dictation","Main Idea","Detail Review","Mock Test"],
            "Reading": ["Reading Practice","Vocabulary Recognition","Sentence Completion","Passage Review"],
            "Writing": ["Character Writing","Sentence Formation","Essay Practice","Mistake Review"],
            "Vocabulary": ["Word Review","Flashcards","Spaced Repetition","Mock Vocabulary"],
            "Characters": ["Stroke Practice","Recognition Practice","Writing Practice"]
        }
    };
    return data[exam] && data[exam][skill] ? data[exam][skill] : null;
}


function updateCSCAExtraFields() {
    const topicSelect = document.getElementById("topicSelect");
    const skillSelect = document.getElementById("skillSelect");
    const detailSelect = document.getElementById("detailedTopicSelect");
    const trainingSelect = document.getElementById("trainingTypeSelect");
    const cscaBox = document.getElementById("cscaExtraBox");
    const cscaDetailed = document.getElementById("cscaDetailedTopicSelect");
    const cscaTraining = document.getElementById("cscaTrainingTypeSelect");

    if (!topicSelect || !skillSelect || !detailSelect || !trainingSelect || !cscaBox || !cscaDetailed || !cscaTraining) return;

    const isCSCA = topicSelect.value === "CSCA";
    cscaBox.style.display = isCSCA ? "block" : "none";

    const topicLabel = document.getElementById("topicLabel");
    const skillLabel = document.getElementById("skillLabel");
    const detailLabel = document.getElementById("detailLabel");
    const trainingLabel = document.getElementById("trainingLabel");

    if (isCSCA) {
        if (topicLabel) topicLabel.textContent = "Exam";
        if (skillLabel) skillLabel.textContent = "Exam Language";
        if (detailLabel) detailLabel.textContent = "CSCA Subject";
        if (trainingLabel) trainingLabel.textContent = "CSCA Main Topic";

        fillSmartSelect(detailSelect, CSCA_SUBJECTS, detailSelect.value && CSCA_SUBJECTS.includes(detailSelect.value) ? detailSelect.value : "Mathematics");

        const mainTopics = CSCA_MAIN_TOPICS[detailSelect.value] || CSCA_MAIN_TOPICS["Mathematics"];
        fillSmartSelect(trainingSelect, mainTopics, trainingSelect.value && mainTopics.includes(trainingSelect.value) ? trainingSelect.value : mainTopics[0]);

        const detailedTopics = CSCA_DETAILED_TOPICS[trainingSelect.value] || ["أخرى"];
        fillSmartSelect(cscaDetailed, detailedTopics, cscaDetailed.value && detailedTopics.includes(cscaDetailed.value) ? cscaDetailed.value : detailedTopics[0]);

        fillSmartSelect(cscaTraining, CSCA_TRAINING_TYPES, cscaTraining.value && CSCA_TRAINING_TYPES.includes(cscaTraining.value) ? cscaTraining.value : "Study Theory");
    } else {
        if (topicLabel) topicLabel.textContent = "الفئة الرئيسية";
        if (skillLabel) skillLabel.textContent = "الفئة الفرعية";
        if (detailLabel) detailLabel.textContent = "الموضوع التفصيلي";
        if (trainingLabel) trainingLabel.textContent = "نوع النشاط";
    }
}


function updateSmartTaskFields() {
    const categoryInput = document.getElementById("categorySelect");
    const topicSelect = document.getElementById("topicSelect");
    const skillSelect = document.getElementById("skillSelect");
    const detailSelect = document.getElementById("detailedTopicSelect");
    const trainingSelect = document.getElementById("trainingTypeSelect");

    if (!categoryInput || !topicSelect || !skillSelect || !detailSelect || !trainingSelect) return;

    const type = ({"Daily Life":"الحياة اليومية"}[categoryInput.value] || categoryInput.value || "عام");
    const config = getSmartConfig(type);

    const currentTopic = topicSelect.dataset.current || "";
    const topicValues = config.main || ["أخرى"];
    fillSmartSelect(topicSelect, topicValues, selectedOrFirst(topicValues, currentTopic));

    function refreshSubFields() {
        const selectedTopic = topicSelect.value;
        const subValues = (config.sub && (config.sub[selectedTopic] || config.sub["أخرى"])) || ["أخرى"];
        const currentSkill = skillSelect.dataset.current || "";
        fillSmartSelect(skillSelect, subValues, selectedOrFirst(subValues, currentSkill));
        refreshDetails();
        toggleOtherBoxes();
    }

    function refreshDetails() {
        const selectedType = categoryInput.value || "عام";
        const selectedTopic = topicSelect.value;
        const selectedSkill = skillSelect.value;

        let detailValues = null;
        let trainingValues = null;

        // قسم اللغات: الاختبار يكون في الفئة الرئيسية والمهارة في الفئة الفرعية.
        if (["IELTS","TOEFL","Duolingo English Test","HSK","CSCA"].includes(selectedTopic)) {
            detailValues = getOfficialExamDetails(selectedTopic, selectedSkill);
            trainingValues = getOfficialExamTraining(selectedTopic, selectedSkill);
        }

        // قسم الاختبارات والشهادات: الاختبار يظهر في الفئة الرئيسية.
        if (!detailValues && selectedType === "Exams & Certificates" && ["IELTS","TOEFL","Duolingo English Test","HSK","CSCA"].includes(selectedTopic)) {
            detailValues = getOfficialExamDetails(selectedTopic, selectedSkill);
            trainingValues = getOfficialExamTraining(selectedTopic, selectedSkill);
        }

        if (!detailValues) {
            detailValues = (config.detail && (config.detail[selectedSkill] || config.detail[selectedTopic] || config.detail["أخرى"])) || ["موضوع عام", "أخرى"];
        }

        if (!trainingValues) {
            trainingValues = config.training || ["Study", "Practice", "Review", "أخرى"];
        }

        const currentDetail = detailSelect.dataset.current || "";
        fillSmartSelect(detailSelect, detailValues, selectedOrFirst(detailValues, currentDetail));

        const currentTraining = trainingSelect.dataset.current || "";
        fillSmartSelect(trainingSelect, trainingValues, selectedOrFirst(trainingValues, currentTraining));

        updateCSCAExtraFields();
        toggleOtherBoxes();
    }

    function toggleOtherBoxes() {
        const customCategoryBox = document.getElementById("customCategoryBox");
        const customTopicBox = document.getElementById("customTopicBox");
        const customSkillBox = document.getElementById("customSkillBox");
        const customDetailedTopicBox = document.getElementById("customDetailedTopicBox");
        const customTrainingTypeBox = document.getElementById("customTrainingTypeBox");

        if (customCategoryBox) customCategoryBox.style.display = type === "أخرى" ? "block" : "none";
        if (customTopicBox) customTopicBox.style.display = topicSelect.value === "أخرى" ? "block" : "none";
        if (customSkillBox) customSkillBox.style.display = skillSelect.value === "أخرى" ? "block" : "none";
        if (customDetailedTopicBox) customDetailedTopicBox.style.display = detailSelect.value === "أخرى" ? "block" : "none";
        if (customTrainingTypeBox) customTrainingTypeBox.style.display = trainingSelect.value === "أخرى" ? "block" : "none";
    }

    topicSelect.onchange = () => {
        topicSelect.dataset.current = "";
        skillSelect.dataset.current = "";
        detailSelect.dataset.current = "";
        trainingSelect.dataset.current = "";
        refreshSubFields();
        updateCSCAExtraFields();
    };

    skillSelect.onchange = () => {
        skillSelect.dataset.current = "";
        detailSelect.dataset.current = "";
        refreshDetails();
    };

    detailSelect.onchange = () => {
        updateCSCAExtraFields();
        toggleOtherBoxes();
    };
    trainingSelect.onchange = () => {
        updateCSCAExtraFields();
        toggleOtherBoxes();
    };

    refreshSubFields();
}

function updateRepeatDaysVisibility() {
    const repeatSelect = document.getElementById("repeatTypeSelect");
    const daysBox = document.getElementById("repeatDaysBox");
    const customBox = document.getElementById("repeatCustomBox");
    if (!repeatSelect) return;

    if (daysBox) {
        daysBox.style.display = repeatSelect.value === "selected_days" ? "block" : "none";
    }

    if (customBox) {
        customBox.style.display = repeatSelect.value === "custom" ? "block" : "none";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("taskTypeCards")) {
        const categoryInput = document.getElementById("categorySelect");
        if (categoryInput && !categoryInput.value) categoryInput.value = "عام";
        renderTaskTypeCards();
        updateSmartTaskFields();
    }

    const repeatSelect = document.getElementById("repeatTypeSelect");
    if (repeatSelect) {
        updateRepeatDaysVisibility();
        repeatSelect.addEventListener("change", updateRepeatDaysVisibility);
    }
});



/* EduPath AI v4.3 Bilingual Arabic-English UI */
const EDUPATH_I18N = {
    en: {
        "nav.dashboard": "⌂ Dashboard",
        "nav.goals": "◎ Goals",
        "nav.tasks": "▣ Tasks",
        "nav.languages": "◌ Languages",
        "nav.coach": "✦ AI Coach",
        "nav.profile": "◉ Profile",
        "nav.admin": "⚙ Admin",
        "user.profile": "Profile",
        "user.admin": "Admin",
        "user.logout": "Logout",
        "user.login": "Login",
        "user.register": "Register",
        "topbar.pwa": "Responsive Web App",
        "topbar.subtitle": "Smart learning, goals, exams, and AI coaching in one workspace.",
        "mobile.home": "Home",
        "mobile.goals": "Goals",
        "mobile.tasks": "Tasks",
        "mobile.coach": "Coach",
        "mobile.lang": "Lang",
        "mobile.profile": "Profile",
        "dashboard.tag": "Smart Learning Workspace",
        "dashboard.hero_title": "Smart goals, exam-aware tasks, and focused progress for your learning path.",
        "dashboard.hero_desc": "Track your goals, manage tasks, practice languages, prepare scholarships, and improve coding with AI support.",
        "dashboard.focus": "Current Focus",
        "dashboard.focus_desc": "Your most important goals based on progress and recent planning.",
        "dashboard.active_goals": "Active Goals",
        "dashboard.active_desc": "Keep your long-term targets visible. Your tasks are the daily steps.",
        "dashboard.insights": "Learning Insights",
        "dashboard.recent_tasks": "المهام الحديثة",
        "goals.title": "Smart Goals & Progress Intelligence",
        "goals.desc": "Create goals that connect naturally with your tasks: exams, languages, programming, scholarships, university, and daily improvement.",
        "goals.create": "Create Smart Goal",
        "goals.goal_title": "Goal Title",
        "goals.goal_type": "Goal Type",
        "goals.current_level": "Current Level / Score",
        "goals.daily_minutes": "Daily Minutes",
        "goals.start_date": "تاريخ البدء",
        "goals.deadline": "Deadline / Exam Date / Target Date",
        "goals.reminder": "وقت التذكير",
        "goals.notes": "الملاحظات",
        "goals.save": "Save Smart Goal",
        "goals.current_goals": "Current Goals",
        "goals.how": "How Smart Progress Works",
        "tasks.title": "Smart Adaptive Task System",
        "tasks.desc": "Create tasks that feel personal: study, university, languages, programming, scholarships, life routines, projects, exams, and more.",
        "tasks.add": "إضافة مهمة ذكية",
        "tasks.add_desc": "ابدأ بنوع المهمة، ثم يتكيف النموذج تلقائياً خطوة بخطوة.",
        "tasks.your": "مهامك",
        "tasks.empty": "لا توجد مهام بعد. أنشئ أول مهمة ذكية.",
        "coach.tag": "AI Coach Hub",
        "coach.title": "Choose the AI coach you need today.",
        "coach.desc": "One organized place for English, scholarship preparation, and programming support.",
        "coach.status": "AI Access Status"
    },
    ar: {
        "nav.dashboard": "⌂ الرئيسية",
        "nav.goals": "◎ الأهداف",
        "nav.tasks": "▣ المهام",
        "nav.languages": "◌ اللغات",
        "nav.coach": "✦ مدرب الذكاء الاصطناعي",
        "nav.profile": "◉ الحساب",
        "nav.admin": "⚙ الإدارة",
        "user.profile": "الحساب",
        "user.admin": "الإدارة",
        "user.logout": "تسجيل الخروج",
        "user.login": "تسجيل الدخول",
        "user.register": "إنشاء حساب",
        "topbar.pwa": "تطبيق ويب متجاوب",
        "topbar.subtitle": "منصة واحدة للتعلم الذكي، الأهداف، الاختبارات، ومدربي الذكاء الاصطناعي.",
        "mobile.home": "الرئيسية",
        "mobile.goals": "الأهداف",
        "mobile.tasks": "المهام",
        "mobile.coach": "المدرب",
        "mobile.lang": "اللغات",
        "mobile.profile": "الحساب",
        "dashboard.tag": "مساحة تعلم ذكية",
        "dashboard.hero_title": "أهداف ذكية، مهام مخصصة للاختبارات، وتقدم واضح في مسارك التعليمي.",
        "dashboard.hero_desc": "تابع أهدافك، نظّم مهامك، مارس اللغات، استعد للمنح، وطوّر البرمجة بدعم الذكاء الاصطناعي.",
        "dashboard.focus": "التركيز الحالي",
        "dashboard.focus_desc": "أهم أهدافك حسب التقدم والخطة الحالية.",
        "dashboard.active_goals": "الأهداف النشطة",
        "dashboard.active_desc": "اجعل أهدافك الطويلة أمامك دائمًا، والمهام هي خطواتك اليومية.",
        "dashboard.insights": "تحليل التعلم",
        "dashboard.recent_tasks": "آخر المهام",
        "goals.title": "أهداف ذكية وتحليل التقدم",
        "goals.desc": "أنشئ أهدافًا ترتبط تلقائيًا بمهامك في الاختبارات واللغات والبرمجة والمنح والجامعة وتطوير الذات.",
        "goals.create": "إنشاء هدف ذكي",
        "goals.goal_title": "عنوان الهدف",
        "goals.goal_type": "نوع الهدف",
        "goals.current_level": "المستوى أو الدرجة الحالية",
        "goals.daily_minutes": "الدقائق اليومية",
        "goals.start_date": "تاريخ البداية",
        "goals.deadline": "الموعد النهائي / تاريخ الاختبار",
        "goals.reminder": "وقت التذكير",
        "goals.notes": "ملاحظات",
        "goals.save": "حفظ الهدف الذكي",
        "goals.current_goals": "الأهداف الحالية",
        "goals.how": "كيف يعمل التقدم الذكي",
        "tasks.title": "نظام مهام ذكي ومتكيف",
        "tasks.desc": "أنشئ مهامًا مخصصة للدراسة والجامعة واللغات والبرمجة والمنح والحياة اليومية والمشاريع والاختبارات.",
        "tasks.add": "إضافة مهمة ذكية",
        "tasks.add_desc": "ابدأ بنوع المهمة، ثم يتكيف النموذج تلقائيًا خطوة بخطوة.",
        "tasks.your": "مهامك",
        "tasks.empty": "لا توجد مهام بعد. أنشئ أول مهمة ذكية.",
        "coach.tag": "مركز مدرب الذكاء الاصطناعي",
        "coach.title": "اختر المدرب الذي تحتاجه اليوم.",
        "coach.desc": "مكان واحد منظم للإنجليزية والمنح والبرمجة.",
        "coach.status": "حالة استخدام الذكاء الاصطناعي"
    }
};

function applyEduPathLanguage(lang) {
    const selected = lang === "ar" ? "ar" : "en";
    localStorage.setItem("edupath-language", selected);
    document.documentElement.lang = selected;
    document.documentElement.dir = selected === "ar" ? "rtl" : "ltr";
    document.body.classList.toggle("rtl-mode", selected === "ar");

    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (EDUPATH_I18N[selected] && EDUPATH_I18N[selected][key]) {
            el.textContent = EDUPATH_I18N[selected][key];
        }
    });

    translateDynamicOptions();

    const toggle = document.getElementById("languageToggle");
    if (toggle) {
        toggle.textContent = selected === "ar" ? "English | عربي" : "عربي | EN";
        toggle.setAttribute("aria-label", selected === "ar" ? "Switch to English" : "التبديل إلى العربية");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const savedLang = localStorage.getItem("edupath-language") || "ar";
    applyEduPathLanguage(savedLang);

    const toggle = document.getElementById("languageToggle");
    if (toggle) {
        toggle.addEventListener("click", () => {
            const current = localStorage.getItem("edupath-language") || "ar";
            applyEduPathLanguage(current === "ar" ? "en" : "ar");
        });
    }
});



/* EduPath AI v4.6.3 Fast Toast Notifications */
function showEduPathToast(title, body) {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "edupath-toast";
    toast.innerHTML = `
        <div class="toast-mark">✦</div>
        <div>
            <strong>${title || "EduPath AI"}</strong>
            <p>${body || ""}</p>
        </div>
    `;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 50);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 400);
    }, 8500);
}

document.addEventListener("DOMContentLoaded", () => {
    const toastItems = document.querySelectorAll("#adminToastData .toast-data-item, #globalToastData .toast-data-item");
    toastItems.forEach((item, index) => {
        setTimeout(() => {
            showEduPathToast(item.dataset.title, item.dataset.body);
        }, 500 + index * 900);
    });
});



/* EduPath AI v4.6.4 Mobile Header Controls */
document.addEventListener("DOMContentLoaded", () => {
    const desktopTheme = document.getElementById("themeToggle");
    const mobileTheme = document.getElementById("mobileThemeToggle");
    if (mobileTheme && desktopTheme) {
        mobileTheme.addEventListener("click", () => desktopTheme.click());
        const updateMobileThemeIcon = () => {
            mobileTheme.textContent = document.body.classList.contains("dark-mode") ? "☀" : "☾";
        };
        updateMobileThemeIcon();
        desktopTheme.addEventListener("click", () => setTimeout(updateMobileThemeIcon, 50));
    }

    const desktopLang = document.getElementById("languageToggle");
    const mobileLang = document.getElementById("mobileLanguageToggle");
    if (mobileLang && desktopLang) {
        mobileLang.addEventListener("click", () => desktopLang.click());
        const updateMobileLangIcon = () => {
            const current = localStorage.getItem("edupath-language") || "ar";
            mobileLang.textContent = current === "ar" ? "EN" : "ع";
        };
        updateMobileLangIcon();
        desktopLang.addEventListener("click", () => setTimeout(updateMobileLangIcon, 80));
    }
});



/* EduPath AI v4.6.5 Mobile More Menu */
document.addEventListener("DOMContentLoaded", () => {
    const moreToggle = document.getElementById("mobileMoreToggle");
    const moreMenu = document.getElementById("mobileMoreMenu");
    if (moreToggle && moreMenu) {
        moreToggle.addEventListener("click", () => {
            moreMenu.classList.toggle("open");
        });

        document.addEventListener("click", (event) => {
            if (!moreMenu.contains(event.target) && !moreToggle.contains(event.target)) {
                moreMenu.classList.remove("open");
            }
        });
    }

    const themeButton = document.getElementById("mobileMenuTheme");
    const desktopTheme = document.getElementById("themeToggle");
    if (themeButton && desktopTheme) {
        themeButton.addEventListener("click", () => {
            desktopTheme.click();
            moreMenu?.classList.remove("open");
        });
    }

    const langButton = document.getElementById("mobileMenuLanguage");
    const desktopLang = document.getElementById("languageToggle");
    if (langButton && desktopLang) {
        langButton.addEventListener("click", () => {
            desktopLang.click();
            moreMenu?.classList.remove("open");
        });
    }
});



/* Extra static Arabic translations v4.6.6 */
document.addEventListener("DOMContentLoaded", () => {
    const extra = {
        "taskform.choose_type": ["1. Choose Task Type", "١. اختر نوع المهمة"],
        "taskform.choose_desc": ["Only the fields related to your choice will appear. This keeps the task system simple and personal.", "ستظهر فقط الحقول المرتبطة باختيارك حتى يبقى النظام بسيطًا ومخصصًا لك."],
        "taskform.other_type": ["نوع مهمة آخر", "نوع مهمة آخر"],
        "taskform.task_name": ["اسم المهمة", "اسم المهمة"],
        "taskform.other_main": ["اكتب الفئة التي تريدها", "اكتب الفئة التي تريدها"],
        "taskform.other_sub": ["اكتب الفئة الفرعية التي تريدها", "اكتب الفئة الفرعية التي تريدها"],
        "taskform.other_detail": ["اكتب الموضوع التفصيلي الذي تريده", "اكتب الموضوع التفصيلي الذي تريده"],
        "taskform.csca_detail": ["موضوع CSCA التفصيلي", "موضوع CSCA التفصيلي"],
        "taskform.csca_training": ["نوع نشاط CSCA", "نوع نشاط CSCA"],
        "taskform.csca_hint": ["هيكل CSCA: الاختبار ← لغة الاختبار ← المادة ← الموضوع الرئيسي ← الموضوع التفصيلي ← نوع النشاط", "هيكل CSCA: الاختبار ← لغة الاختبار ← المادة ← الموضوع الرئيسي ← الموضوع التفصيلي ← نوع النشاط"],
        "taskform.other_training": ["اكتب نوع النشاط الذي تريده", "اكتب نوع النشاط الذي تريده"],
        "taskform.source": ["المصدر أو الرابط", "المصدر / الرابط"],
        "taskform.difficulty": ["مستوى الصعوبة من ١ إلى ٥", "الصعوبة من ١ إلى ٥"],
        "taskform.priority": ["الأولوية من ١ إلى ٥", "الأولوية من ١ إلى ٥"],
        "taskform.expected": ["الوقت المتوقع (بالدقائق)", "الوقت المتوقع بالدقائق"],
        "taskform.start_date": ["تاريخ البدء", "تاريخ البداية"],
        "taskform.end_date": ["تاريخ الانتهاء", "تاريخ النهاية / الموعد النهائي"],
        "taskform.reminder": ["وقت التذكير", "وقت التذكير"],
        "taskform.repeat": ["التكرار", "التكرار"],
        "taskform.repeat_days": ["أيام التكرار", "أيام التكرار"],
        "taskform.repeat_hint": ["Choose any days that fit this task. Useful for intensive weekends, language routines, or study schedules.", "اختر الأيام المناسبة لهذه المهمة، مثل أيام الدراسة المكثفة أو روتين اللغة أو جدول الحفظ."],
        "taskform.notes": ["الملاحظات", "ملاحظات"],
        "tasks.add_btn": ["إضافة مهمة", "إضافة مهمة"],
        "tasks.save": ["حفظ المهمة", "حفظ المهمة"],
        "tasks.done": ["مكتملة", "مكتملة"],
        "tasks.pending": ["قيد التنفيذ", "قيد التنفيذ"],
        "tasks.edit": ["تعديل", "تعديل"],
        "tasks.delete": ["حذف", "حذف"],
        "tasklabels.type": ["نوع المهمة:", "نوع المهمة:"],
        "tasklabels.main": ["الفئة الرئيسية:", "الفئة الرئيسية:"],
        "tasklabels.sub": ["الفئة الفرعية:", "الفئة الفرعية:"],
        "tasklabels.detail": ["الموضوع التفصيلي:", "الموضوع التفصيلي:"],
        "tasklabels.training": ["نوع النشاط:", "نوع النشاط:"],
        "tasklabels.source": ["المصدر:", "المصدر:"]
    };

    Object.entries(extra).forEach(([key, values]) => {
        if (!EDUPATH_I18N.en[key]) EDUPATH_I18N.en[key] = values[0];
        if (!EDUPATH_I18N.ar[key]) EDUPATH_I18N.ar[key] = values[1];
    });

    applyEduPathLanguage(localStorage.getItem("edupath-language") || "ar");
});
/* EduPath AI v4.6.10 Smart Goals Adaptive Fix */

const SMART_GOAL_AR_LABELS_V520 = {
    "Education": "التعليم",
    "Language": "اللغات",
    "Exam / Certificate": "الاختبارات الدولية",
    "Programming & Technology": "البرمجة والتكنولوجيا",
    "البرمجة والتقنية": "البرمجة والتكنولوجيا",
    "Scholarship": "المنح الدراسية",
    "University": "الجامعة",
    "Project": "المشاريع",
    "الحياة اليومية": "الحياة اليومية",
    "Islamic Goals": "الأهداف الإسلامية",
    "عام": "عام",
    "أخرى": "أخرى",
    "أخرى": "أخرى",
    "School Study": "الدراسة المدرسية",
    "University Study": "الدراسة الجامعية",
    "Online Course": "دورة تعليمية",
    "Research": "بحث",
    "Presentation": "عرض تقديمي",
    "English": "English",
    "Chinese": "Chinese",
    "Turkish": "Turkish",
    "Russian": "Russian",
    "Indonesian": "Indonesian",
    "Romanian": "Romanian",
    "Arabic": "Arabic",
    "French": "French",
    "German": "German",
    "IELTS Academic": "IELTS Academic",
    "TOEFL": "TOEFL",
    "Duolingo English Test": "Duolingo",
    "General English": "General English",
    "Academic English": "Academic English",
    "Speaking": "Speaking",
    "Writing": "Writing",
    "Reading": "Reading",
    "Listening": "Listening",
    "Vocabulary": "Vocabulary",
    "Grammar": "Grammar",
    "Pronunciation": "Pronunciation",
    "IELTS": "IELTS",
    "HSK": "HSK",
    "CSCA": "CSCA",
    "SAT": "SAT",
    "ACT": "ACT",
    "GRE": "GRE",
    "GMAT": "GMAT",
    "Python": "Python",
    "C": "C",
    "C++": "C++",
    "Java": "Java",
    "JavaScript": "JavaScript",
    "HTML": "HTML",
    "CSS": "CSS",
    "SQL": "SQL",
    "Flask": "Flask",
    "React": "React",
    "Node.js": "Node.js",
    "Git / GitHub": "Git / GitHub",
    "Algorithms": "Algorithms",
    "Data Structures": "Data Structures",
    "Databases": "Database Fundamentals",
    "Database Fundamentals": "Database Fundamentals",
    "SQLite": "SQLite",
    "MySQL": "MySQL",
    "PostgreSQL": "PostgreSQL",
    "MongoDB": "MongoDB",
    "Database Design": "Database Design",
    "ORM": "ORM",
    "Database Optimization": "Database Optimization",
    "Database Security": "Database Security",
    "Database Projects": "Database Projects",
    "Cybersecurity": "الأمن السيبراني",
    "Information Technology": "تقنية المعلومات",
    "Web Development": "Web Development",
    "Problem Solving": "Problem Solving",
    "Debugging": "Debugging",
    "Beginner": "مبتدئ",
    "Intermediate": "متوسط",
    "Advanced": "متقدم",
    "Not started": "لم أبدأ بعد",
    "In progress": "قيد التقدم",
    "Need review": "أحتاج إلى مراجعة",
    "Beginner Track": "مسار المبتدئين",
    "Project Track": "مسار المشاريع",
    "Complete course": "إكمال الدورة",
    "High grade": "تحقيق درجة عالية",
    "Finish project": "إنهاء المشروع",
    "Master topic": "إتقان الموضوع",
    "Build a complete project": "بناء مشروع متكامل",
    "Deploy a useful web app": "نشر تطبيق ويب مفيد",
    "Solve 100 problems": "حل 100 مسألة",
    "Internship ready": "الاستعداد للتدريب العملي",
    "Submit complete application": "إرسال طلب مكتمل",
    "Get interview": "الحصول على مقابلة",
    "Win full scholarship": "الحصول على منحة كاملة",
    "Get admission": "الحصول على قبول",
    "Pass exam": "اجتياز الاختبار",
    "Strong score": "تحقيق درجة قوية",
    "Scholarship requirement": "استيفاء شرط المنحة",
    "University requirement": "استيفاء شرط الجامعة",
    "30 minutes daily": "30 دقيقة يومياً",
    "60 minutes daily": "60 دقيقة يومياً",
    "3 hours weekly": "3 ساعات أسبوعياً",
    "Weekly review": "مراجعة أسبوعية",
    "Skill rotation": "تدوير المهارات",
    "Mock test weekly": "اختبار تجريبي أسبوعي",
    "Timed practice daily": "تدريب مؤقت يومياً",
    "Weakness review": "مراجعة نقاط الضعف",
    "Formula review": "مراجعة القوانين",
    "Build weekly": "بناء مشروع أسبوعياً",
    "Solve problems daily": "حل مسائل يومياً",
    "Daily steps": "خطوات يومية",
    "Milestones": "محطات تقدم",
    "القرآن الكريم": "القرآن الكريم",
    "الحديث الشريف": "الحديث الشريف",
    "العقيدة": "العقيدة",
    "الفقه": "الفقه",
    "السيرة النبوية": "السيرة النبوية",
    "الأذكار": "الأذكار",
    "طلب العلم الشرعي": "طلب العلم الشرعي",
    "العبادات": "العبادات",
    "أخرى": "أخرى",
    "خطة مخصصة": "أخرى"
};

function smartGoalLabelArV520(value) {
    if (["أخرى", "أخرى", "خطة مخصصة", "خطة مخصصة", "تحديد يدوي", "أخرى", "أخرى"].includes(value)) return "أخرى";
    return SMART_GOAL_AR_LABELS_V520[value] || value;
}

function smartGoalCanonicalTypeV558(value) {
    const map = {
        "التعليم": "Education",
        "اللغات": "Language",
        "الاختبارات الدولية": "Exam / Certificate",
        "البرمجة والتقنية": "Programming & Technology",
        "الذكاء الاصطناعي": "Artificial Intelligence",
        "المنح الدراسية": "Scholarship",
        "الجامعة": "University",
        "الرياضيات": "Mathematics",
        "المشاريع": "Project",
        "الحياة اليومية": "Daily Life",
        "الأهداف الإسلامية": "Islamic Goals",
        "عام": "General",
        "أخرى": "أخرى",
        "Other": "أخرى",
        "Daily Life": "Daily Life"
    };
    return map[value] || value || "Education";
}


const SMART_GOALS_V4610 = {
    "Education": {
        categories: ["School Study","University Study","Online Course","Research","Presentation","أخرى"],
        paths: {
            "School Study": ["Mathematics","Physics","Chemistry","Biology","English","Arabic","Exam Review","Homework","أخرى"],
            "University Study": ["Course Study","Assignment","Lab","Research","Presentation","Exam Review","أخرى"],
            "Online Course": ["Course Lessons","Practice","Project","Certificate","أخرى"],
            "Research": ["Topic Selection","Reading","التلخيص","Writing","Presentation","أخرى"],
            "Presentation": ["Content Preparation","Slides","Practice Speaking","Final Review","أخرى"],
            "أخرى": ["Study Plan","Exam Review","Assignment","Project","Reading","أخرى"]
        },
        states: {
            "Mathematics": {
                current: ["لم أبدأ بعد","مستوى ضعيف","مستوى متوسط","مستوى جيد","مستوى قوي","أخرى"],
                target: ["فهم الأساسيات","حل التمارين بثقة","تحقيق درجة عالية","إتقان الموضوع","أخرى"],
                commitment: ["30 دقيقة يومياً","60 دقيقة يومياً","حل تمارين يومياً","مراجعة أسبوعية","أخرى"]
            },
            "English": {
                current: ["Beginner","Intermediate","Advanced","أخرى"],
                target: ["تحسين القراءة","تحسين الكتابة","تحسين الاستماع","تحسين التحدث","إتقان المنهج","أخرى"],
                commitment: ["30 دقيقة يومياً","60 دقيقة يومياً","مراجعة أسبوعية","أخرى"]
            },
            "أخرى": {
                current: ["لم أبدأ بعد","مبتدئ","قيد التقدم","أحتاج إلى مراجعة","أخرى"],
                target: ["إكمال الهدف","تحقيق درجة عالية","إتقان الموضوع","أخرى"],
                commitment: ["30 دقيقة يومياً","60 دقيقة يومياً","مراجعة أسبوعية","أخرى"]
            }
        }
    },

    "Language": {
        categories: ["English","Chinese","Turkish","Russian","Indonesian","Romanian","Arabic","French","German","أخرى"],
        paths: {
            "English": ["IELTS","TOEFL","Duolingo","General English","Academic English","Speaking","Writing","Reading","Listening","Vocabulary","Grammar","Pronunciation","أخرى"],
            "IELTS": ["Full Official Test","Mock Test","Listening","Reading","Writing Task 1","Writing Task 2","Speaking Part 1","Speaking Part 2","Speaking Part 3","Vocabulary","Grammar","Matching Headings","True False Not Given","Multiple Choice","Sentence Completion","Summary Completion","Map Labelling","Form Completion","Note Completion","Flow Chart Completion","أخرى"],
            "TOEFL": ["Full Official Test","Mock Test","Reading","Listening","Speaking","Writing","Academic Discussion","Integrated Writing","Independent Writing","Vocabulary","Grammar","أخرى"],
            "Duolingo": ["Full Test","Read and Select","Fill in the Blanks","Read and Complete","Interactive Reading","Listen and Type","Interactive Listening","Write About the Photo","Writing Sample","Interactive Writing","Speak About the Photo","Read Then Speak","Speaking Sample","Interactive Speaking","أخرى"],
            "Chinese": ["HSK","General Chinese","Speaking","Writing","Reading","Listening","Characters","Vocabulary","أخرى"],
            "HSK": ["HSK 1","HSK 2","HSK 3","HSK 4","HSK 5","HSK 6","Vocabulary","Characters","Listening","Reading","Writing","Mock Test","أخرى"],
            "Turkish": ["General Turkish","Speaking","Writing","Reading","Listening","Vocabulary","Grammar","أخرى"],
            "Russian": ["General Russian","Speaking","Writing","Reading","Listening","Vocabulary","Grammar","أخرى"],
            "Arabic": ["Arabic for Quran","Writing","Reading","Grammar","Vocabulary","أخرى"],
            "أخرى": ["General Language","Exam Preparation","Speaking","Writing","Reading","Listening","أخرى"]
        },
        states: {
            "IELTS": {
                current: ["Band 4","Band 4.5","Band 5","Band 5.5","Band 6","Band 6.5","Band 7","Band 7.5","Band 8","أخرى"],
                target: ["Band 5","Band 5.5","Band 6","Band 6.5","Band 7","Band 7.5","Band 8","Band 8.5","Band 9","أخرى"],
                commitment: ["30 دقيقة يومياً","45 دقيقة يومياً","60 دقيقة يومياً","90 دقيقة يومياً","اختبار أسبوعي","اختباران أسبوعياً","أخرى"]
            },
            "TOEFL": {
                current: ["Beginner","40+","60+","70+","80+","90+","100+","أخرى"],
                target: ["70+","80+","90+","100+","110+","أخرى"],
                commitment: ["30 دقيقة يومياً","60 دقيقة يومياً","90 دقيقة يومياً","Mock Test أسبوعياً","أخرى"]
            },
            "Duolingo": {
                current: ["80+","90+","100+","110+","120+","أخرى"],
                target: ["100+","110+","120+","130+","140+","أخرى"],
                commitment: ["30 دقيقة يومياً","60 دقيقة يومياً","تدريب يومي على الأسئلة","اختبار أسبوعي","أخرى"]
            },
            "HSK": {
                current: ["HSK 1","HSK 2","HSK 3","HSK 4","HSK 5","أخرى"],
                target: ["HSK 3","HSK 4","HSK 5","HSK 6","أخرى"],
                commitment: ["30 دقيقة يومياً","60 دقيقة يومياً","مراجعة مفردات يومياً","Mock Test أسبوعياً","أخرى"]
            },
            "أخرى": {
                current: ["Beginner","Intermediate","Advanced","أخرى"],
                target: ["تحسين المستوى","إتقان مهارة محددة","الطلاقة","أخرى"],
                commitment: ["30 دقيقة يومياً","60 دقيقة يومياً","تدريب مهارة يومياً","أخرى"]
            }
        }
    },

    "Exam / Certificate": {
        categories: ["IELTS","TOEFL","Duolingo","HSK","CSCA","SAT","ACT","GRE","GMAT","أخرى"],
        paths: {
            "IELTS": ["Full Official Test","Mock Test","Listening","Reading","Writing Task 1","Writing Task 2","Speaking Part 1","Speaking Part 2","Speaking Part 3","Vocabulary","Grammar","Matching Headings","True False Not Given","Multiple Choice","Sentence Completion","Summary Completion","Map Labelling","Form Completion","Note Completion","Flow Chart Completion","أخرى"],
            "TOEFL": ["Full Official Test","Mock Test","Reading","Listening","Speaking","Writing","Academic Discussion","Integrated Writing","Independent Writing","Vocabulary","Grammar","أخرى"],
            "Duolingo": ["Read and Select","Fill in the Blanks","Read and Complete","Interactive Reading","Listen and Type","Interactive Listening","Write About the Photo","Writing Sample","Interactive Writing","Speak About the Photo","Read Then Speak","Speaking Sample","Interactive Speaking","Full Test","أخرى"],
            "CSCA": ["Mathematics","Physics","Chemistry","Full Exam","Algebra","Geometry","Calculus","Mechanics","Electricity","Organic Chemistry","Inorganic Chemistry","أخرى"],
            "HSK": ["Vocabulary","Characters","Listening","Reading","Writing","Mock Test","أخرى"],
            "SAT": ["Reading","Writing and Language","Math No Calculator","Math Calculator","Full Practice Test","Vocabulary","Grammar","أخرى"],
            "ACT": ["English","Math","Reading","Science","Writing","Full Practice Test","أخرى"],
            "GRE": ["Verbal Reasoning","Quantitative Reasoning","Analytical Writing","Vocabulary","Mock Test","أخرى"],
            "GMAT": ["Quantitative","Verbal","Integrated Reasoning","Analytical Writing","Data Insights","Mock Test","أخرى"],
            "أخرى": ["Subject Review","Mock Test","Weakness Training","Final Revision","أخرى"]
        },
        states: {
            "IELTS": {
                current: ["Band 4","Band 4.5","Band 5","Band 5.5","Band 6","Band 6.5","Band 7","Band 7.5","Band 8","أخرى"],
                target: ["Band 5","Band 5.5","Band 6","Band 6.5","Band 7","Band 7.5","Band 8","Band 8.5","Band 9","أخرى"],
                commitment: ["30 دقيقة يومياً","45 دقيقة يومياً","60 دقيقة يومياً","90 دقيقة يومياً","اختبار أسبوعي","اختباران أسبوعياً","أخرى"]
            },
            "CSCA": {
                current: ["Beginner","Intermediate","Advanced","Need diagnostic","أخرى"],
                target: ["اجتياز الاختبار","درجة قوية","استيفاء شرط الجامعة الصينية","أخرى"],
                commitment: ["30 دقيقة يومياً","60 دقيقة يومياً","مراجعة قوانين","اختبار أسبوعي","أخرى"]
            },
            "أخرى": {
                current: ["Beginner","Intermediate","Advanced","Need diagnostic","أخرى"],
                target: ["اجتياز الاختبار","درجة قوية","استيفاء شرط القبول","أخرى"],
                commitment: ["30 دقيقة يومياً","60 دقيقة يومياً","Mock Test أسبوعياً","مراجعة نقاط الضعف","أخرى"]
            }
        }
    },

    "Programming & Technology": {
        categories: ["Python","C","C++","Java","JavaScript","TypeScript","HTML","CSS","SQL","Flask","Django","React","Node.js","Git / GitHub","Algorithms","Data Structures","Databases","Cybersecurity","Information Technology","Computer Networks","Operating Systems","Software Engineering","تطوير الويب","Projects","Problem Solving","Debugging","أخرى"],
        paths: {
            "Python": ["Beginner Python","Intermediate Python","Advanced Python","OOP","Flask","Automation","Data Analysis","Machine Learning","Projects","Problem Solving","أخرى"],
            "Flask": ["Routes","Templates","Forms","Authentication","Database","Deployment","Full Web App","API","Login System","أخرى"],
            "JavaScript": ["Basics","DOM","Events","Async JavaScript","Fetch API","Projects","أخرى"],
            "React": ["Components","Props","State","Hooks","Routing","API Integration","Project","أخرى"],
            "Algorithms": ["Searching","Sorting","Recursion","Greedy","Dynamic Programming","Graphs","Trees","Complexity","أخرى"],
            "تطوير الويب": ["HTML","CSS","Responsive Design","Bootstrap","Tailwind CSS","JavaScript","DOM","Async JavaScript","API","JSON","Frontend","Backend","Full Stack","Flask","Django","React","Node.js","Express.js","Authentication","Session Management","REST API","Database Integration","SQLite","MySQL","PostgreSQL","Deployment","Debugging","Testing","Security Basics","Performance Optimization","Project Building","Revision","Portfolio Development","Open Source Contribution","أخرى"],
            "أخرى": ["Beginner Track","Project Track","Problem Solving","Documentation","أخرى"]
        },
        states: {
            "Python": {
                current: ["مبتدئ","أعرف الأساسيات","متوسط","متقدم","أخرى"],
                target: ["إتقان الأساسيات","بناء مشروع كامل","تعلم Flask","تحليل بيانات","Machine Learning","أخرى"],
                commitment: ["30 دقيقة يومياً","ساعة يومياً","مشروع أسبوعي","حل مسائل يومية","أخرى"]
            },
            "Flask": {
                current: ["مبتدئ","أعرف Routes","أعرف Templates","أعرف قواعد البيانات","أخرى"],
                target: ["بناء تطبيق Flask كامل","نظام تسجيل دخول","نشر التطبيق","بناء API","أخرى"],
                commitment: ["30 دقيقة يومياً","ساعة يومياً","مشروع أسبوعي","تطوير ميزة يومياً","أخرى"]
            },
            "تطوير الويب": {
                current: ["مبتدئ","أعرف HTML/CSS","أستخدم JavaScript","أفهم Frontend و Backend","أبني مشاريع ويب","أخرى"],
                target: ["بناء موقع كامل","بناء تطبيق ويب","تحسين الواجهة والخلفية","نشر المشروع","تطوير Portfolio","أخرى"],
                commitment: ["ساعة تطوير","تطبيق عملي","بناء ميزة","إصلاح أخطاء","مراجعة أسبوعية","أخرى"]
            },
            "HTML": {
                current: ["لا أعرف HTML","أعرف أساسيات HTML","أستطيع إنشاء صفحة بسيطة","أستخدم النماذج والجداول","أبني صفحات متكاملة","أخرى"],
                target: ["فهم HTML","إنشاء صفحات احترافية","كتابة هيكل صحيح","تحسين الوصولية","بناء مشروع كامل","أخرى"],
                commitment: ["30 دقيقة يومياً","إنشاء صفحة","إعادة بناء تصميم","تطبيق عملي","مشروع صغير","أخرى"]
            },
            "CSS": {
                current: ["لا أعرف CSS","أعرف التنسيق الأساسي","أستخدم Flexbox","أستخدم Grid","أصمم صفحات كاملة","أخرى"],
                target: ["تصميم احترافي","Responsive Design","إتقان Flexbox","إتقان Grid","تحسين تجربة المستخدم","أخرى"],
                commitment: ["تصميم عنصر","إعادة تصميم صفحة","تطبيق عملي","ساعة يومياً","مشروع تصميم","أخرى"]
            },
            "أخرى": {
                current: ["مبتدئ","أعرف الأساسيات","متوسط","متقدم","أخرى"],
                target: ["بناء مشروع متكامل","الاستعداد للتدريب العملي","حل 100 مسألة","أخرى"],
                commitment: ["30 دقيقة يومياً","ساعة يومياً","مشروع أسبوعي","حل مسائل يومية","أخرى"]
            }
        }
    },

    "Artificial Intelligence": {
        categories: ["Machine Learning","Deep Learning","Data Science","NLP","Computer Vision","AI Project","أخرى"],
        paths: {
            "Machine Learning": ["Supervised Learning","Unsupervised Learning","Model Evaluation","Feature Engineering","Projects","أخرى"],
            "Data Science": ["Pandas","Data Cleaning","Visualization","Statistics","Projects","أخرى"],
            "أخرى": ["Theory","Practice","Project","Dataset","Model Training","Deployment","أخرى"]
        },
        states: {
            "أخرى": {
                current: ["مبتدئ","أعرف الأساسيات","متوسط","متقدم","أخرى"],
                target: ["فهم أساسيات ML","بناء مشروع AI","نشر نموذج","أخرى"],
                commitment: ["30 دقيقة يومياً","مشروع أسبوعي","قراءة وتطبيق","أخرى"]
            }
        }
    },

    "Scholarship": {
        categories: ["Scholarship Search","University Research","Documents","CV","Motivation Letter","Personal Statement","Recommendation Letter","Interview","Application Form","Email Communication","Visa","Portfolio","Chinese Scholarship","أخرى"],
        paths: {
            "Chinese Scholarship": ["Full Application Preparation","Language Program","Bachelor Application","Documents","Interview","Email Follow-up","أخرى"],
            "Documents": ["Prepare Documents","Translate Documents","Review Documents","Upload Documents","أخرى"],
            "Motivation Letter": ["First Draft","Personalization","Editing","Final Review","أخرى"],
            "Interview": ["Mock Interview","Common Questions","Answer Improvement","Confidence Practice","أخرى"],
            "أخرى": ["Preparation","Submission","Follow Up","Final Check","أخرى"]
        },
        states: {
            "أخرى": {
                current: ["لم أبدأ بعد","المستندات جاهزة 30٪","المستندات جاهزة 50٪","المستندات جاهزة 70٪","قدمت لبعض الجامعات","أخرى"],
                target: ["إرسال طلب مكتمل","الحصول على مقابلة","الحصول على منحة كاملة","الحصول على قبول","أخرى"],
                commitment: ["30 دقيقة يومياً","مراجعة أسبوعية للطلبات","قائمة تحقق للمستندات","تدريب مقابلة","أخرى"]
            }
        }
    },

    "University": {
        categories: ["Computer Science","Information Technology","Computer Engineering","Software Engineering","Artificial Intelligence","Data Science","Cybersecurity","Engineering","Medicine","Business","Law","Education","أخرى"],
        paths: {
            "Computer Science": ["Programming","Algorithms","Data Structures","Databases","Operating Systems","Networks","AI","Graduation Project","أخرى"],
            "أخرى": ["Course Study","Assignment","Lab","Exam","Research","أخرى"]
        },
        states: {
            "أخرى": {
                current: ["بداية المقرر","أحتاج إلى مراجعة","متوسط","قوي","أخرى"],
                target: ["اجتياز المقرر","تحقيق درجة عالية","إكمال مشروع","إتقان المادة","أخرى"],
                commitment: ["دراسة محاضرة","جدول واجبات","تدريب عملي","مراجعة اختبار","أخرى"]
            }
        }
    },

    "Mathematics": {
        categories: ["Algebra","Geometry","Trigonometry","Calculus","Probability","Statistics","Problem Solving","أخرى"],
        paths: {"أخرى": ["Study theory","Solve exercises","Timed practice","Review mistakes","أخرى"]},
        states: {
            "أخرى": {
                current: ["مبتدئ","متوسط","جيد","قوي","أخرى"],
                target: ["إتقان الموضوع","تحقيق درجة عالية","حل مسائل متقدمة","أخرى"],
                commitment: ["تمارين يومية","تدريب مؤقت","مراجعة الأخطاء","أخرى"]
            }
        }
    },

    "Project": {
        categories: ["Programming Project","AI Project","Web Project","Mobile App","Research Project","Scholarship Portfolio","Personal Project","أخرى"],
        paths: {"أخرى": ["Idea","Planning","Design","Build","Testing","Deployment","Documentation","Presentation","أخرى"]},
        states: {
            "أخرى": {
                current: ["مجرد فكرة","مرحلة التخطيط","بدأت التنفيذ","أنجزت النصف","قارب على الانتهاء","أخرى"],
                target: ["إكمال المشروع","نشر المشروع","جاهز للمعرض/البورتفوليو","جاهز للعرض","أخرى"],
                commitment: ["بناء يومي","محطة أسبوعية","دورة اختبار","أخرى"]
            }
        }
    },

    "Daily Life": {
        categories: ["الصحة","الرياضة","النوم","التغذية","شرب الماء","الروتين الشخصي","العائلة","إدارة المال","تنظيف المنزل","إدارة الوقت","الصلاة","أخرى"],
        paths: {"أخرى": ["عادة يومية","روتين أسبوعي","Reminder","العناية الشخصية","Important Appointment","أخرى"]},
        states: {
            "أخرى": {
                current: ["غير منتظم","أحياناً","متوسط","جيد","أخرى"],
                target: ["بناء عادة","تحسين الروتين","الاستمرار","أخرى"],
                commitment: ["عادة يومية","مراجعة أسبوعية","خطوات صغيرة","أخرى"]
            }
        }
    },

    "Islamic Goals": {
        categories: ["القرآن الكريم","الحديث الشريف","العقيدة","الفقه","السيرة النبوية","الأذكار","طلب العلم الشرعي","الدعوة","العبادات","العربية للقرآن","أخرى"],
        paths: {
            "القرآن الكريم": ["حفظ القرآن","مراجعة القرآن","التجويد","التثبيت","التلاوة","التدبر","ختمة","حفظ سورة محددة","حفظ جزء محدد","أخرى"],
            "الحديث الشريف": ["حفظ أحاديث","شرح أحاديث","مراجعة أحاديث","أخرى"],
            "أخرى": ["خطة علمية","مراجعة","قراءة","حفظ","أخرى"]
        },
        states: {
            "القرآن الكريم": {
                current: ["لا أحفظ شيئاً","أحفظ جزءاً واحداً","أحفظ 5 أجزاء","أحفظ 10 أجزاء","أحفظ 15 جزءاً","أحفظ 20 جزءاً","أخرى"],
                target: ["جزء واحد","5 أجزاء","10 أجزاء","15 جزءاً","20 جزءاً","القرآن كاملاً","أخرى"],
                commitment: ["ربع صفحة يومياً","نصف صفحة يومياً","صفحة يومياً","صفحتان يومياً","مراجعة يومية","مراجعة أسبوعية","أخرى"]
            },
            "أخرى": {
                current: ["لم أبدأ بعد","مبتدئ","قيد التقدم","أخرى"],
                target: ["إكمال الهدف","الاستمرار","إتقان المجال","أخرى"],
                commitment: ["30 دقيقة يومياً","مراجعة يومية","مراجعة أسبوعية","أخرى"]
            }
        }
    },

    "General": {
        categories: ["Personal Goal","Study Goal","Skill Goal","Habit Goal","أخرى"],
        paths: {"أخرى": ["Plan","Practice","Review","Milestone","أخرى"]},
        states: {
            "أخرى": {
                current: ["لم أبدأ بعد","مبتدئ","قيد التقدم","أخرى"],
                target: ["إكمال الهدف","تحسين المستوى","أخرى"],
                commitment: ["خطوات يومية","مراجعة أسبوعية","محطات تقدم","أخرى"]
            }
        }
    },

    "أخرى": {
        categories: ["أخرى"],
        paths: {"أخرى": ["أخرى"]},
        states: {
            "أخرى": {
                current: ["لم أبدأ بعد","أخرى"],
                target: ["أخرى"],
                commitment: ["أخرى"]
            }
        }
    }
};

const JUZ_AMMA_MILESTONES_V4610 = ["النبأ","النازعات","عبس","التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد","الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات","القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر","المسد","الإخلاص","الفلق","الناس"];

function fillGoalSelectV4610(select, values) {
    if (!select) return;
    const previous = select.value;
    select.innerHTML = "";
    values.forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = typeof smartGoalLabelArV520 === "function" ? smartGoalLabelArV520(value) : (typeof labelForUI === "function" ? labelForUI(value) : value);
        select.appendChild(option);
    });
    if (values.includes(previous)) select.value = previous;
}

function shouldShowCustom(value) {
    return isOtherLikeEduPath(value);
}

function toggleGoalCustomFieldsV4610() {
    const category = document.getElementById("goalCategorySelect");
    const path = document.getElementById("goalPathSelect");
    const current = document.getElementById("currentStateSelect");
    const target = document.getElementById("targetStateSelect");
    const commitment = document.getElementById("commitmentSelect");
    const boxes = [
        ["customCategoryBox", category],
        ["customPathBox", path],
        ["customCurrentBox", current],
        ["customTargetBox", target],
        ["customCommitmentBox", commitment]
    ];
    boxes.forEach(([id, select]) => {
        const box = document.getElementById(id);
        if (box) box.style.display = select && shouldShowCustom(select.value) ? "block" : "none";
    });
}


function generatedMilestonesForGoalV4611(typeValue, categoryValue, pathValue, targetValue) {
    const selected = `${typeValue} ${categoryValue} ${pathValue} ${targetValue}`.toLowerCase();
    if (pathValue === "حفظ جزء محدد" || targetValue === "حفظ جزء عم" || selected.includes("جزء عم")) {
        return JUZ_AMMA_MILESTONES_V4610.join(", ");
    }
    if (selected.includes("ielts")) return "Band 5.5 → Band 6.0 → Band 6.5 → Band 7.0";
    if (selected.includes("toefl")) return "Reading, Listening, Writing, Speaking, Full Mock Test";
    if (selected.includes("duolingo")) return "Reading, Listening, Writing, Speaking, Full Mock Test";
    if (selected.includes("csca")) return "Mathematics, Physics, Chemistry, Full Exam Simulation";
    if (selected.includes("python") || selected.includes("flask")) return "Syntax, Functions, OOP, Flask Basics, Database, Final Project, Deployment";
    if (selected.includes("scholarship") || selected.includes("منحة")) return "University Selection, Documents, Motivation Letter, Application Review, Submission, Follow-up";
    if (typeValue === "Project") return "Idea, Planning, Build, Testing, Documentation, Deployment";
    if (typeValue === "الحياة اليومية") return "Start, Consistency, Weekly Review, Improvement";
    return [categoryValue, pathValue, targetValue].filter(Boolean).join(", ");
}

function updateSmartGoalsV4610(changedId = "") {
    const type = document.getElementById("goalTypeSelect");
    const category = document.getElementById("goalCategorySelect");
    const path = document.getElementById("goalPathSelect");
    const current = document.getElementById("currentStateSelect");
    const target = document.getElementById("targetStateSelect");
    const commitment = document.getElementById("commitmentSelect");
    const milestones = document.getElementById("milestonesInput");
    const keywords = document.getElementById("keywordsInput");
    const outcome = document.getElementById("goalOutcomeInput");

    if (!type || !category || !path || !current || !target || !commitment) return;

    const typeKeyV558 = smartGoalCanonicalTypeV558(type.value);
    const data = SMART_GOALS_V4610[typeKeyV558] || SMART_GOALS_V4610["General"] || SMART_GOALS_V4610["أخرى"];

    if (changedId === "goalTypeSelect" || !category.options.length) {
        fillGoalSelectV4610(category, data.categories || ["أخرى"]);
    }

    const firstLevelPaths = (data.paths && (data.paths[category.value] || data.paths["أخرى"])) || ["أخرى"];
    if (changedId === "goalTypeSelect" || changedId === "goalCategorySelect" || !path.options.length) {
        fillGoalSelectV4610(path, firstLevelPaths);
    }

    const secondLevelPaths = (data.paths && data.paths[path.value]) || null;
    if (secondLevelPaths && changedId === "goalPathSelect") {
        fillGoalSelectV4610(path, secondLevelPaths);
    }

    const stateKey = (data.states && (data.states[path.value] || data.states[category.value] || data.states["أخرى"])) || {};
    const currentValues = stateKey.current || data.current || ["أخرى"];
    const targetValues = stateKey.target || data.target || ["أخرى"];
    const commitmentValues = stateKey.commitment || data.commitment || ["أخرى"];

    if (["goalTypeSelect", "goalCategorySelect", "goalPathSelect"].includes(changedId) || !current.options.length) {
        fillGoalSelectV4610(current, currentValues);
    }
    if (["goalTypeSelect", "goalCategorySelect", "goalPathSelect"].includes(changedId) || !target.options.length) {
        fillGoalSelectV4610(target, targetValues);
    }
    if (["goalTypeSelect", "goalCategorySelect", "goalPathSelect"].includes(changedId) || !commitment.options.length) {
        fillGoalSelectV4610(commitment, commitmentValues);
    }

    const labels = {
        cat: document.getElementById("goalCategoryLabel"),
        path: document.getElementById("goalPathLabel"),
        current: document.getElementById("currentStateLabel"),
        target: document.getElementById("targetStateLabel"),
        outcome: document.getElementById("goalOutcomeLabel"),
        milestones: document.getElementById("milestonesLabel"),
        commitment: document.getElementById("commitmentLabel")
    };

    if (labels.cat) labels.cat.textContent = "تصنيف الهدف";
    if (labels.path) labels.path.textContent = "مسار الهدف";
    if (labels.current) labels.current.textContent = "الحالة الحالية";
    if (labels.target) labels.target.textContent = "الحالة المستهدفة";
    if (labels.outcome) labels.outcome.textContent = "النتيجة المستهدفة";
    if (labels.milestones) labels.milestones.textContent = "محطات التقدم";
    if (labels.commitment) labels.commitment.textContent = "الالتزام اليومي أو الأسبوعي";
    if (outcome && !outcome.value) {
        if (typeKeyV558 === "Islamic Goals") {
            outcome.placeholder = "مثال: إتمام حفظ جزء عم وتثبيته";
        } else if (typeKeyV558 === "Scholarship") {
            outcome.placeholder = "مثال: الحصول على منحة أو تقديم طلب قوي ومكتمل";
        } else if (typeKeyV558 === "Programming & Technology") {
            outcome.placeholder = "مثال: بناء مشروع متكامل ونشره";
        } else {
            outcome.placeholder = "ماذا تريد أن يتحقق عند إنجاز هذا الهدف؟";
        }
    }

    const selected = `${type.value} ${category.value} ${path.value} ${target.value}`.toLowerCase();
    const shouldRefreshSuggestions = ["goalTypeSelect", "goalCategorySelect", "goalPathSelect", "targetStateSelect"].includes(changedId);

    if (milestones && (shouldRefreshSuggestions || !milestones.value)) {
        milestones.value = generatedMilestonesForGoalV4611(typeKeyV558, category.value, path.value, target.value);
    }

    if (keywords) {
        keywords.value = [typeKeyV558, category.value, path.value, current.value, target.value, commitment.value, milestones ? milestones.value : ""].filter(Boolean).join(", ");
    }

    toggleGoalCustomFieldsV4610();
    if (typeof translateDynamicOptions === "function") translateDynamicOptions();
}

document.addEventListener("DOMContentLoaded", () => {
    ["goalTypeSelect","goalCategorySelect","goalPathSelect","currentStateSelect","targetStateSelect","commitmentSelect"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("change", () => updateSmartGoalsV4610(id));
    });
    updateSmartGoalsV4610("goalTypeSelect");
});



/* EduPath AI v4.6.11 Robust Other/خانة أخرىs */
function isOtherLikeEduPath(value) {
    return ["أخرى", "أخرى", "أخرى", "خطة مخصصة", "خطة مخصصة", "تحديد يدوي", "أخرى"].includes(value);
}

function forceTaskCustomBoxes() {
    const categoryInput = document.getElementById("categorySelect");
    const topicSelect = document.getElementById("topicSelect");
    const skillSelect = document.getElementById("skillSelect");
    const detailSelect = document.getElementById("detailedTopicSelect");
    const trainingSelect = document.getElementById("trainingTypeSelect");

    const pairs = [
        ["customCategoryBox", categoryInput ? categoryInput.value : ""],
        ["customTopicBox", topicSelect ? topicSelect.value : ""],
        ["customSkillBox", skillSelect ? skillSelect.value : ""],
        ["customDetailedTopicBox", detailSelect ? detailSelect.value : ""],
        ["customTrainingTypeBox", trainingSelect ? trainingSelect.value : ""],
    ];

    pairs.forEach(([boxId, value]) => {
        const box = document.getElementById(boxId);
        if (box) box.style.display = isOtherLikeEduPath(value) ? "block" : "none";
    });
}

document.addEventListener("DOMContentLoaded", () => {
    ["topicSelect","skillSelect","detailedTopicSelect","trainingTypeSelect"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("change", () => setTimeout(forceTaskCustomBoxes, 30));
    });

    document.querySelectorAll(".task-type-card").forEach(card => {
        card.addEventListener("click", () => setTimeout(forceTaskCustomBoxes, 80));
    });

    setTimeout(forceTaskCustomBoxes, 120);
});



/* EduPath AI v4.6.12 خانة أخرىs + Adaptive Layout Fix */
function eduPathIsCustomValue(value) {
    const normalized = (value || "").trim().toLowerCase();
    return ["other", "custom", "custom plan", "other / أخرى", "أخرى", "خطة مخصصة", "تحديد يدوي"].includes(normalized);
}

function eduPathSetBoxVisible(boxId, visible) {
    const box = document.getElementById(boxId);
    if (!box) return;
    box.classList.toggle("edupath-visible-custom", !!visible);
    box.style.display = visible ? "block" : "none";
}

function eduPathRefreshGoalCustomFields() {
    const category = document.getElementById("goalCategorySelect");
    const path = document.getElementById("goalPathSelect");
    const current = document.getElementById("currentStateSelect");
    const target = document.getElementById("targetStateSelect");
    const commitment = document.getElementById("commitmentSelect");

    eduPathSetBoxVisible("customCategoryBox", category && eduPathIsCustomValue(category.value));
    eduPathSetBoxVisible("customPathBox", path && eduPathIsCustomValue(path.value));
    eduPathSetBoxVisible("customCurrentBox", current && eduPathIsCustomValue(current.value));
    eduPathSetBoxVisible("customTargetBox", target && eduPathIsCustomValue(target.value));
    eduPathSetBoxVisible("customCommitmentBox", commitment && eduPathIsCustomValue(commitment.value));
}

function eduPathRefreshTaskCustomFields() {
    const categoryInput = document.getElementById("categorySelect");
    const topic = document.getElementById("topicSelect");
    const skill = document.getElementById("skillSelect");
    const detail = document.getElementById("detailedTopicSelect");
    const training = document.getElementById("trainingTypeSelect");

    eduPathSetBoxVisible("customCategoryBox", categoryInput && eduPathIsCustomValue(categoryInput.value));
    eduPathSetBoxVisible("customTopicBox", topic && eduPathIsCustomValue(topic.value));
    eduPathSetBoxVisible("customSkillBox", skill && eduPathIsCustomValue(skill.value));
    eduPathSetBoxVisible("customDetailedTopicBox", detail && eduPathIsCustomValue(detail.value));
    eduPathSetBoxVisible("customTrainingTypeBox", training && eduPathIsCustomValue(training.value));
}

function eduPathRefreshAllCustomFields() {
    eduPathRefreshGoalCustomFields();
    eduPathRefreshTaskCustomFields();
}

document.addEventListener("DOMContentLoaded", () => {
    ["goalTypeSelect","goalCategorySelect","goalPathSelect","currentStateSelect","targetStateSelect","commitmentSelect",
     "categorySelect","topicSelect","skillSelect","detailedTopicSelect","trainingTypeSelect"].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("change", () => {
                setTimeout(eduPathRefreshAllCustomFields, 50);
                setTimeout(eduPathRefreshAllCustomFields, 180);
            });
        }
    });

    document.addEventListener("click", event => {
        if (event.target.closest(".task-type-card")) {
            setTimeout(eduPathRefreshAllCustomFields, 120);
            setTimeout(eduPathRefreshAllCustomFields, 300);
        }
    });

    setTimeout(eduPathRefreshAllCustomFields, 150);
    setTimeout(eduPathRefreshAllCustomFields, 500);
});



/* EduPath AI v4.6.13 Final Goal خانة أخرى Controller */
function eduPathGoalCustomFinalV4613() {
    const mapping = [
        ["goalCategorySelect", "customCategoryBox"],
        ["goalPathSelect", "customPathBox"],
        ["currentStateSelect", "customCurrentBox"],
        ["targetStateSelect", "customTargetBox"],
        ["commitmentSelect", "customCommitmentBox"]
    ];

    mapping.forEach(([selectId, boxId]) => {
        const select = document.getElementById(selectId);
        const box = document.getElementById(boxId);
        if (!select || !box) return;

        const value = (select.value || "").trim().toLowerCase();
        const shouldShow = ["other", "custom", "custom plan", "أخرى", "خطة مخصصة", "تحديد يدوي"].includes(value);

        box.classList.toggle("edupath-visible-custom", shouldShow);
        box.style.display = shouldShow ? "grid" : "none";
    });
}

document.addEventListener("DOMContentLoaded", () => {
    ["goalTypeSelect","goalCategorySelect","goalPathSelect","currentStateSelect","targetStateSelect","commitmentSelect"].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener("change", () => {
            setTimeout(eduPathGoalCustomFinalV4613, 60);
            setTimeout(eduPathGoalCustomFinalV4613, 220);
        });
    });

    setTimeout(eduPathGoalCustomFinalV4613, 200);
    setTimeout(eduPathGoalCustomFinalV4613, 700);
});



/* EduPath AI v4.6.14 Inline Custom + Arabic Islamic Labels */
function eduPathApplyIslamicGoalCustomLabelsV4614() {
    const type = document.getElementById("goalTypeSelect");
    const isIslamic = type && type.value === "Islamic Goals";

    const labelMap = {
        customCategoryLabel: isIslamic ? "اكتب التصنيف المخصص" : "اكتب التصنيف",
        customPathLabel: isIslamic ? "اكتب المسار المخصص" : "اكتب المسار",
        customCurrentLabel: isIslamic ? "اكتب حالتك الحالية" : "اكتب الحالة الحالية",
        customTargetLabel: isIslamic ? "اكتب هدفك المستهدف" : "اكتب الحالة المستهدفة",
        customCommitmentLabel: isIslamic ? "اكتب الالتزام المخصص" : "اكتب الالتزام"
    };

    Object.entries(labelMap).forEach(([id, text]) => {
        const label = document.getElementById(id);
        if (label) label.textContent = text;
    });

    const placeholders = [
        ["customGoalCategoryInput", isIslamic ? "مثال: القرآن الكريم، التجويد، حلقة التحفيظ" : "Write your custom category"],
        ["customGoalPathInput", isIslamic ? "مثال: حفظ سورة محددة، مراجعة جزء محدد" : "Write your custom path"],
        ["customCurrentInput", isIslamic ? "مثال: أحفظ جزءين وأحتاج مراجعة" : "Write your current state"],
        ["customTargetInput", isIslamic ? "مثال: حفظ جزء عم كاملًا" : "Write your target state"],
        ["customCommitmentInput", isIslamic ? "مثال: صفحة ونصف يوميًا" : "Write your custom commitment"]
    ];

    placeholders.forEach(([id, text]) => {
        const input = document.getElementById(id);
        if (input) input.placeholder = text;
    });
}

document.addEventListener("DOMContentLoaded", () => {
    ["goalTypeSelect","goalCategorySelect","goalPathSelect","currentStateSelect","targetStateSelect","commitmentSelect"].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener("change", () => {
            setTimeout(eduPathApplyIslamicGoalCustomLabelsV4614, 80);
            setTimeout(eduPathGoalCustomFinalV4613, 100);
        });
    });

    setTimeout(eduPathApplyIslamicGoalCustomLabelsV4614, 200);
    setTimeout(eduPathGoalCustomFinalV4613, 220);
});



/* EduPath AI v4.6.16 Resources i18n */
document.addEventListener("DOMContentLoaded", () => {
    if (typeof EDUPATH_I18N !== "undefined") {
        EDUPATH_I18N.en["nav.resources"] = "Resources";
        EDUPATH_I18N.ar["nav.resources"] = "المصادر";
        EDUPATH_I18N.en["mobile.resources"] = "Resources";
        EDUPATH_I18N.ar["mobile.resources"] = "مصادر";
        if (typeof applyEduPathLanguage === "function") {
            applyEduPathLanguage(localStorage.getItem("edupath-language") || "ar");
        }
    }
});



/* EduPath AI v4.7.2 My Resources i18n */
document.addEventListener("DOMContentLoaded", () => {
    if (typeof EDUPATH_I18N !== "undefined") {
        EDUPATH_I18N.en["nav.my_resources"] = "My Resources";
        EDUPATH_I18N.ar["nav.my_resources"] = "مصادري";
        EDUPATH_I18N.en["mobile.my_resources"] = "My";
        EDUPATH_I18N.ar["mobile.my_resources"] = "مصادري";
        if (typeof applyEduPathLanguage === "function") {
            applyEduPathLanguage(localStorage.getItem("edupath-language") || "ar");
        }
    }
});



/* EduPath AI v4.7.6 Arabic task section labels */
function applyArabicSpecialTaskLabelsV476() {
    const type = document.getElementById("categorySelect")?.value || "";
    const arabicMode = type === "Quran Memorization" || type === "Secondary School";
    const map = {
        topicLabel: arabicMode ? "المجال الرئيسي" : "الفئة الرئيسية",
        skillLabel: arabicMode ? "المجال الفرعي" : "الفئة الفرعية",
        detailLabel: arabicMode ? "الموضوع التفصيلي" : "الموضوع التفصيلي",
        trainingLabel: arabicMode ? "نوع التدريب" : "نوع النشاط"
    };
    Object.entries(map).forEach(([id, text]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    });
    document.body.classList.toggle("arabic-task-mode", arabicMode);
}
document.addEventListener("DOMContentLoaded", () => {
    document.addEventListener("click", e => {
        if (e.target.closest(".task-type-card")) {
            setTimeout(applyArabicSpecialTaskLabelsV476, 80);
            setTimeout(translateDynamicOptions, 120);
        }
    });
    ["topicSelect","skillSelect","detailedTopicSelect","trainingTypeSelect"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("change", () => setTimeout(translateDynamicOptions, 50));
    });
    setTimeout(applyArabicSpecialTaskLabelsV476, 250);
});



/* EduPath AI v4.7.7 Full Arabic Quran + Secondary Tasks */
const EDUPATH_ARABIC_SPECIAL_TASK_TYPES_V477 = ["Quran Memorization", "Secondary School"];

function isArabicSpecialTaskV477() {
    const type = document.getElementById("categorySelect")?.value || "";
    return EDUPATH_ARABIC_SPECIAL_TASK_TYPES_V477.includes(type);
}

function setTextV477(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function setPlaceholderV477(id, text) {
    const el = document.getElementById(id);
    if (el) el.placeholder = text;
}

function translateOptionsArabicSpecialV477() {
    if (!isArabicSpecialTaskV477()) return;
    document.querySelectorAll("#topicSelect option, #skillSelect option, #detailedTopicSelect option, #trainingTypeSelect option, #repeatTypeSelect option").forEach(option => {
        const original = option.value || option.textContent;
        option.textContent = EDUPATH_LABEL_AR[original] || original;
    });
}

function applyArabicSpecialTaskLabelsV477() {
    const type = document.getElementById("categorySelect")?.value || "";
    const arabicMode = isArabicSpecialTaskV477();

    document.body.classList.toggle("arabic-task-mode", arabicMode);

    if (!arabicMode) {
        setTextV477("taskNameLabel", "اسم المهمة");
        setPlaceholderV477("taskTitleInput", "مثال: مراجعة حفظ سورة النساء");
        setTextV477("topicLabel", "الفئة الرئيسية");
        setTextV477("skillLabel", "الفئة الفرعية");
        setTextV477("detailLabel", "الموضوع التفصيلي");
        setTextV477("trainingLabel", "نوع النشاط");
        setTextV477("sourceLabel", "المصدر أو الرابط");
        setPlaceholderV477("sourceInput", "كتاب، موقع إلكتروني، فيديو تعليمي، ملف، أو أي مصدر آخر");
        setTextV477("difficultyLabel", "مستوى الصعوبة من ١ إلى ٥");
        setTextV477("priorityLabel", "الأولوية من ١ إلى ٥");
        setTextV477("expectedTimeLabel", "الوقت المتوقع (بالدقائق)");
        setTextV477("startDateLabel", "تاريخ البدء");
        setTextV477("endDateLabel", "تاريخ الانتهاء");
        setTextV477("reminderLabel", "وقت التذكير");
        setTextV477("repeatLabel", "التكرار");
        setTextV477("repeatDaysLabel", "أيام التكرار");
        setTextV477("notesLabel", "الملاحظات");
        setPlaceholderV477("notesInput", "اكتب أي ملاحظات أو خطة أو تعليمات شخصية");
        return;
    }

    setTextV477("taskNameLabel", "اسم المهمة");
    setPlaceholderV477("taskTitleInput", type === "Quran Memorization" ? "مثال: حفظ سورة النبأ أو مراجعة جزء عم" : "مثال: حل تمارين الجبر أو مراجعة درس الفيزياء");
    setTextV477("topicLabel", "المجال الرئيسي");
    setTextV477("skillLabel", "المجال الفرعي");
    setTextV477("detailLabel", "الموضوع التفصيلي");
    setTextV477("trainingLabel", "نوع التدريب");
    setTextV477("sourceLabel", "المصدر أو الرابط");
    setPlaceholderV477("sourceInput", "اكتب اسم كتاب أو مصدر، أو رابط يبدأ بـ https:// ويمكن فصل أكثر من رابط بعلامة &");
    setTextV477("difficultyLabel", "درجة الصعوبة من 1 إلى 5");
    setTextV477("priorityLabel", "الأولوية من 1 إلى 5");
    setTextV477("expectedTimeLabel", "الوقت المتوقع بالدقائق");
    setTextV477("startDateLabel", "تاريخ البداية");
    setTextV477("endDateLabel", "تاريخ النهاية / الموعد النهائي");
    setTextV477("reminderLabel", "وقت التذكير");
    setTextV477("repeatLabel", "التكرار");
    setTextV477("repeatDaysLabel", "أيام التكرار");
    setTextV477("notesLabel", "ملاحظات");
    setPlaceholderV477("notesInput", "اكتب أي ملاحظات أو خطة مختصرة");

    const repeatMap = {
        "once": "بدون تكرار / مرة واحدة",
        "daily": "يوميًا",
        "weekly": "أسبوعيًا",
        "monthly": "شهريًا",
        "selected_days": "أيام محددة"
    };
    document.querySelectorAll("#repeatTypeSelect option").forEach(option => {
        option.textContent = repeatMap[option.value] || option.textContent;
    });

    translateOptionsArabicSpecialV477();
}

document.addEventListener("DOMContentLoaded", () => {
    document.addEventListener("click", e => {
        if (e.target.closest(".task-type-card")) {
            setTimeout(applyArabicSpecialTaskLabelsV477, 90);
            setTimeout(translateOptionsArabicSpecialV477, 150);
        }
    });

    ["topicSelect","skillSelect","detailedTopicSelect","trainingTypeSelect","repeatTypeSelect"].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("change", () => {
                setTimeout(applyArabicSpecialTaskLabelsV477, 70);
                setTimeout(translateOptionsArabicSpecialV477, 120);
            });
        }
    });

    setTimeout(applyArabicSpecialTaskLabelsV477, 350);
    setTimeout(translateOptionsArabicSpecialV477, 500);
});



/* EduPath AI v4.8.1 compact desktop controls */
function compactDesktopControlsV481() {
    const theme = document.getElementById("themeToggle");
    const lang = document.getElementById("languageToggle");
    if (theme && window.innerWidth >= 981) {
        theme.textContent = document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
    }
    if (lang && window.innerWidth >= 981) {
        const current = localStorage.getItem("edupath-language") || "ar";
        lang.textContent = current === "ar" ? "EN" : "ع";
    }
}
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(compactDesktopControlsV481, 100);
    document.addEventListener("click", () => setTimeout(compactDesktopControlsV481, 80));
    window.addEventListener("resize", compactDesktopControlsV481);
});


/* EduPath AI v5.2.4 Urgent Goals Fix */
const GOAL_AR_V524 = {
    "Education": "التعليم",
    "التعليم": "التعليم",
    "Language": "اللغات",
    "اللغات": "اللغات",
    "Exam / Certificate": "الاختبارات الدولية",
    "الاختبارات الدولية": "الاختبارات الدولية",
    "Programming & Technology": "البرمجة والتكنولوجيا",
    "البرمجة والتقنية": "البرمجة والتكنولوجيا",
    "البرمجة والتقنية": "البرمجة والتقنية",
    "Scholarship": "المنح الدراسية",
    "المنح الدراسية": "المنح الدراسية",
    "University": "الجامعة",
    "الجامعة": "الجامعة",
    "Project": "المشاريع",
    "المشاريع": "المشاريع",
    "الحياة اليومية": "الحياة اليومية",
    "Islamic Goals": "الأهداف الإسلامية",
    "الأهداف الإسلامية": "الأهداف الإسلامية",
    "عام": "عام",
    "أخرى": "أخرى",
    "أخرى": "أخرى",
    "خطة مخصصة": "أخرى",

    "الثانوية العامة": "الثانوية العامة",
    "الجامعة": "الجامعة",
    "التعليم الذاتي": "التعليم الذاتي",
    "التعليم عن بعد": "التعليم عن بعد",
    "الدورات التدريبية": "الدورات التدريبية",
    "القرآن الكريم": "القرآن الكريم",
    "التربية الإسلامية": "التربية الإسلامية",
    "اللغة العربية": "اللغة العربية",
    "اللغة الإنجليزية": "اللغة الإنجليزية",
    "الرياضيات": "الرياضيات",
    "الفيزياء": "الفيزياء",
    "الكيمياء": "الكيمياء",
    "الأحياء": "الأحياء",
    "التاريخ": "التاريخ",
    "الجغرافيا": "الجغرافيا",
    "المجتمع": "المجتمع",
    "ضعيف": "ضعيف",
    "مقبول": "مقبول",
    "جيد": "جيد",
    "جيد جداً": "جيد جداً",
    "ممتاز": "ممتاز",
    "رفع المعدل": "رفع المعدل",
    "إتقان المنهج": "إتقان المنهج",
    "الحصول على درجة كاملة": "الحصول على درجة كاملة",
    "الاستعداد للاختبار النهائي": "الاستعداد للاختبار النهائي",
    "حفظ مقرر": "حفظ مقرر",
    "مراجعة دروس": "مراجعة دروس",
    "حل واجبات": "حل واجبات",
    "مراجعة يومية": "مراجعة يومية",
    "مراجعة أسبوعية": "مراجعة أسبوعية",
    "30 دقيقة يومياً": "30 دقيقة يومياً",
    "45 دقيقة يومياً": "45 دقيقة يومياً",
    "60 دقيقة يومياً": "60 دقيقة يومياً",
    "90 دقيقة يومياً": "90 دقيقة يومياً",

    "English": "اللغة الإنجليزية",
    "الإنجليزية": "اللغة الإنجليزية",
    "Chinese": "اللغة الصينية",
    "الصينية": "اللغة الصينية",
    "Turkish": "اللغة التركية",
    "التركية": "اللغة التركية",
    "Russian": "اللغة الروسية",
    "الروسية": "اللغة الروسية",
    "Arabic": "اللغة العربية",
    "العربية": "اللغة العربية",
    "French": "اللغة الفرنسية",
    "الفرنسية": "اللغة الفرنسية",
    "German": "اللغة الألمانية",
    "الألمانية": "اللغة الألمانية",
    "Spanish": "اللغة الإسبانية",
    "الإسبانية": "اللغة الإسبانية",
    "Japanese": "اللغة اليابانية",
    "اليابانية": "اللغة اليابانية",
    "Korean": "اللغة الكورية",
    "الكورية": "اللغة الكورية",
    "Malay": "اللغة الماليزية",
    "الماليزية": "اللغة الماليزية",
    "Indonesian": "اللغة الإندونيسية",
    "الإندونيسية": "اللغة الإندونيسية",
    "Other Language": "لغة أخرى",
    "لغة عامة": "لغة أخرى",

    "IELTS": "IELTS",
    "TOEFL": "TOEFL",
    "Duolingo": "Duolingo",
    "HSK": "HSK",
    "CSCA": "CSCA",
    "SAT": "SAT",
    "ACT": "ACT",
    "GRE": "GRE",
    "GMAT": "GMAT",

    "Full Official Test": "Full Official Test",
    "Mock Test": "Mock Test",
    "Reading": "القراءة",
    "Listening": "الاستماع",
    "Speaking": "التحدث",
    "Writing": "الكتابة",
    "Complete the Words": "Complete the Words",
    "Read in Daily Life": "Read in Daily Life",
    "Read an Academic Passage": "Read an Academic Passage",
    "Build a Sentence": "Build a Sentence",
    "Write an Email": "Write an Email",
    "Write for an Academic Discussion": "Write for an Academic Discussion",
    "Listen and Repeat": "Listen and Repeat",
    "Take an Interview": "Take an Interview",
    "Listen and Choose a Response": "Listen and Choose a Response",
    "Listen to a Conversation": "Listen to a Conversation",
    "Listen to an Announcement": "Listen to an Announcement",
    "Listen to an Academic Talk": "Listen to an Academic Talk",
    "Vocabulary Building": "Vocabulary Building",
    "Grammar Practice": "Grammar Practice",
    "إدارة الوقت": "إدارة الوقت",

    "Writing Task 1": "Writing Task 1",
    "Writing Task 2": "Writing Task 2",
    "Speaking Part 1": "Speaking Part 1",
    "Speaking Part 2": "Speaking Part 2",
    "Speaking Part 3": "Speaking Part 3",
    "Matching Headings": "Matching Headings",
    "True False Not Given": "True False Not Given",
    "Multiple Choice": "Multiple Choice",
    "Sentence Completion": "Sentence Completion",
    "Summary Completion": "Summary Completion",
    "Map Labelling": "Map Labelling",
    "Form Completion": "Form Completion",
    "Note Completion": "Note Completion",
    "Flow Chart Completion": "Flow Chart Completion",
    "Read and Select": "Read and Select",
    "Fill in the Blanks": "Fill in the Blanks",
    "Read and Complete": "Read and Complete",
    "Interactive Reading": "Interactive Reading",
    "Listen and Type": "Listen and Type",
    "Interactive Listening": "Interactive Listening",
    "Write About the Photo": "Write About the Photo",
    "Writing Sample": "Writing Sample",
    "Interactive Writing": "Interactive Writing",
    "Speak About the Photo": "Speak About the Photo",
    "Read Then Speak": "Read Then Speak",
    "Speaking Sample": "Speaking Sample",
    "Interactive Speaking": "Interactive Speaking",

    "Python": "Python",
    "C": "C",
    "C++": "C++",
    "Java": "Java",
    "JavaScript": "JavaScript",
    "HTML": "HTML",
    "CSS": "CSS",
    "SQL": "SQL",
    "Flask": "Flask",
    "React": "React",
    "Node.js": "Node.js",
    "Git / GitHub": "Git / GitHub",
    "OOP": "OOP",
    "المسارات": "المسارات",
    "القوالب": "القوالب",
    "النماذج": "النماذج",
    "تسجيل الدخول والصلاحيات": "تسجيل الدخول والصلاحيات",
    "قاعدة البيانات": "قاعدة البيانات",
    "النشر": "النشر",
    "واجهة API": "واجهة API",

    "تعلم الآلة": "تعلم الآلة",
    "التعلم العميق": "التعلم العميق",
    "معالجة اللغة الطبيعية": "معالجة اللغة الطبيعية",
    "الرؤية الحاسوبية": "الرؤية الحاسوبية",
    "علم البيانات": "علم البيانات",
    "جمع البيانات": "جمع البيانات",
    "تنظيف البيانات": "تنظيف البيانات",
    "تحليل البيانات": "تحليل البيانات",
    "تدريب النموذج": "تدريب النموذج",
    "تقييم النموذج": "تقييم النموذج",
    "تحسين النموذج": "تحسين النموذج",
    "اختبار النموذج": "اختبار النموذج",
    "نشر المشروع": "نشر المشروع",
    "بناء مشروع عملي": "بناء مشروع عملي",

    "البحث عن منح": "البحث عن منح",
    "اختيار الجامعات": "اختيار الجامعات",
    "إعداد المستندات": "إعداد المستندات",
    "السيرة الذاتية": "السيرة الذاتية",
    "رسالة الدافع": "رسالة الدافع",
    "خطابات التوصية": "خطابات التوصية",
    "المقابلات": "المقابلات",
    "اختبارات اللغة": "اختبارات اللغة",
    "إجراءات السفر": "إجراءات السفر",
    "التأشيرة": "التأشيرة",
    "المتابعة بعد التقديم": "المتابعة بعد التقديم",
    "كشف الدرجات": "كشف الدرجات",
    "جواز السفر": "جواز السفر",
    "شهادة التخرج": "شهادة التخرج",
    "شهادة اللغة": "شهادة اللغة",
    "الترجمة": "الترجمة",
    "التصديق": "التصديق",
    "رفع المستندات": "رفع المستندات",
    "مراجعة المستندات": "مراجعة المستندات",

    "علوم الحاسوب": "علوم الحاسوب",
    "هندسة البرمجيات": "هندسة البرمجيات",
    "الذكاء الاصطناعي": "الذكاء الاصطناعي",
    "الأمن السيبراني": "الأمن السيبراني",
    "تقنية المعلومات": "تقنية المعلومات",
    "الطب": "الطب",
    "الصيدلة": "الصيدلة",
    "التمريض": "التمريض",
    "الهندسة المدنية": "الهندسة المدنية",
    "الهندسة المعمارية": "الهندسة المعمارية",
    "الهندسة الكهربائية": "الهندسة الكهربائية",
    "الهندسة الميكانيكية": "الهندسة الميكانيكية",
    "إدارة الأعمال": "إدارة الأعمال",
    "المحاسبة": "المحاسبة",
    "الاقتصاد": "الاقتصاد",
    "القانون": "القانون",
    "الشريعة": "الشريعة",
    "التربية": "التربية",
    "الإعلام": "الإعلام",
    "العلوم السياسية": "العلوم السياسية",
    "الخوارزميات": "الخوارزميات",
    "هياكل البيانات": "هياكل البيانات",
    "قواعد البيانات": "قواعد البيانات",
    "تطوير الويب": "تطوير الويب",
    "البرمجة الكائنية": "البرمجة الكائنية",
    "المشاريع": "المشاريع",

    "الجبر": "الجبر",
    "الهندسة": "الهندسة",
    "التفاضل والتكامل": "التفاضل والتكامل",
    "الإحصاء": "الإحصاء",
    "الاحتمالات": "الاحتمالات",
    "المثلثات": "المثلثات",
    "الجبر الخطي": "الجبر الخطي",
    "الرياضيات المتقطعة": "الرياضيات المتقطعة",
    "المعادلات": "المعادلات",
    "المتباينات": "المتباينات",
    "الدوال": "الدوال",
    "التحليل": "التحليل",
    "التطبيقات": "التطبيقات",
    "حل التمارين": "حل التمارين",
    "الاختبارات": "الاختبارات",
    "المراجعة": "المراجعة",

    "الصحة": "الصحة",
    "الرياضة": "الرياضة",
    "النوم": "النوم",
    "شرب الماء": "شرب الماء",
    "التغذية": "التغذية",
    "الروتين الشخصي": "الروتين الشخصي",
    "العائلة": "العائلة",
    "إدارة الوقت": "إدارة الوقت",
    "إدارة المال": "إدارة المال",
    "الصلاة": "الصلاة",
    "التسوق": "التسوق",
    "ترتيب المنزل": "ترتيب المنزل",
    "تنظيف المنزل": "تنظيف المنزل",
    "القراءة": "القراءة",
    "الاسترخاء": "الاسترخاء",

    "القرآن الكريم": "القرآن الكريم",
    "الحديث الشريف": "الحديث الشريف",
    "العقيدة": "العقيدة",
    "الفقه": "الفقه",
    "السيرة النبوية": "السيرة النبوية",
    "الأذكار": "الأذكار",
    "طلب العلم الشرعي": "طلب العلم الشرعي",
    "الدعوة": "الدعوة",
    "العبادات": "العبادات",
    "العربية للقرآن": "العربية للقرآن",
    "حفظ القرآن": "حفظ القرآن",
    "مراجعة القرآن": "مراجعة القرآن",
    "التجويد": "التجويد",
    "التثبيت": "التثبيت",
    "التلاوة": "التلاوة",
    "التدبر": "التدبر",
    "ختمة": "ختمة",

    "لا أعرف مستواي": "لا أعرف مستواي",
    "لم أبدأ بعد": "لم أبدأ بعد",
    "مبتدئ": "مبتدئ",
    "متوسط": "متوسط",
    "متقدم": "متقدم",
    "أعرف الأساسيات": "أعرف الأساسيات",
    "أنهيت دورة": "أنهيت دورة",
    "نفذت مشروعاً": "نفذت مشروعاً",
    "بناء مشروع متكامل": "بناء مشروع متكامل",
    "إتقان المجال": "إتقان المجال",
    "الاستعداد لسوق العمل": "الاستعداد لسوق العمل",

    "Band 4": "Band 4", "Band 4.5": "Band 4.5", "Band 5": "Band 5", "Band 5.5": "Band 5.5", "Band 6": "Band 6", "Band 6.5": "Band 6.5", "Band 7": "Band 7", "Band 7.5": "Band 7.5", "Band 8": "Band 8", "Band 8.5": "Band 8.5", "Band 9": "Band 9",
    "0": "0", "1": "1", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6",
    "80+": "80+", "90+": "90+", "100+": "100+", "110+": "110+", "120+": "120+", "130+": "130+", "140+": "140+",

    "لا أحفظ شيئاً": "لا أحفظ شيئاً",
    "أحفظ جزءاً واحداً": "أحفظ جزءاً واحداً",
    "أحفظ 5 أجزاء": "أحفظ 5 أجزاء",
    "أحفظ 10 أجزاء": "أحفظ 10 أجزاء",
    "أحفظ 15 جزءاً": "أحفظ 15 جزءاً",
    "أحفظ 20 جزءاً": "أحفظ 20 جزءاً",
    "جزء واحد": "جزء واحد",
    "5 أجزاء": "5 أجزاء",
    "10 أجزاء": "10 أجزاء",
    "15 جزءاً": "15 جزءاً",
    "20 جزءاً": "20 جزءاً",
    "القرآن كاملاً": "القرآن كاملاً",

    "ساعة يومياً": "ساعة يومياً",
    "مشروع أسبوعي": "مشروع أسبوعي",
    "حل مسائل يومية": "حل مسائل يومية",
    "اختبار أسبوعي": "اختبار أسبوعي",
    "اختباران أسبوعياً": "اختباران أسبوعياً",
    "ربع صفحة يومياً": "ربع صفحة يومياً",
    "نصف صفحة يومياً": "نصف صفحة يومياً",
    "صفحة يومياً": "صفحة يومياً",
    "صفحتان يومياً": "صفحتان يومياً"
};

const GOAL_CONFIG_V524 = {
    "التعليم": {
        categories: ["المرحلة الثانوية","المرحلة الجامعية","التعليم الذاتي","التعليم الإلكتروني","الدورات التدريبية","المهارات الأكاديمية","التأهيل الجامعي","التخرج والمشاريع","أخرى"],
        paths: {
            "المرحلة الثانوية": ["القرآن الكريم","التربية الإسلامية","اللغة العربية","اللغة الإنجليزية","الرياضيات","الفيزياء","الكيمياء","الأحياء","التاريخ","الجغرافيا","المجتمع","الحاسب الآلي","مراجعة شاملة","الاستعداد للاختبارات","أخرى"],
            "المرحلة الجامعية": ["حسب التخصص الجامعي","أخرى"],
            "التعليم الذاتي": ["تعلم مهارة جديدة","قراءة كتاب","دورة تعليمية","مشروع تطبيقي","بحث علمي","أخرى"],
            "التعليم الإلكتروني": ["منصة تعليمية","دورة إلكترونية","محاضرات","شهادة احترافية","أخرى"],
            "الدورات التدريبية": ["دورة قصيرة","برنامج تدريبي","ورشة عمل","معسكر تدريبي","أخرى"],
            "المهارات الأكاديمية": ["تنظيم الدراسة","تلخيص الدروس","كتابة البحوث","مهارات العرض","إدارة الوقت الدراسي","أخرى"],
            "التأهيل الجامعي": ["اختيار التخصص","الاستعداد للقبول","تقوية اللغة","تقوية الرياضيات","تجهيز المستندات","أخرى"],
            "التخرج والمشاريع": ["مشروع التخرج","بحث التخرج","العرض النهائي","توثيق المشروع","الاستعداد للمناقشة","أخرى"],
            "أخرى": ["خطة دراسة","مراجعة","تطبيق","اختبار","أخرى"]
        },
        states: {
            "القرآن الكريم": {
                current:["لا أحفظ شيئاً","أحفظ سوراً قصيرة","أحفظ جزءاً واحداً","أحفظ المقرر","أحفظ نصف المقرر","أحفظ عدة أجزاء","أراجع الحفظ","أخرى"],
                target:["حفظ سورة","حفظ جزء","حفظ عدة أجزاء","إكمال مقرر","إتقان المراجعة","ختم مقرر الحفظ","أخرى"],
                commitment:["ربع صفحة يومياً","نصف صفحة يومياً","صفحة يومياً","صفحتان يومياً","مراجعة يومية","مراجعة أسبوعية","برنامج مخصص","أخرى"]
            },
            "التربية الإسلامية": {
                current:["أحتاج تأسيساً","مستوى مقبول","جيد","جيد جداً","متقدم","أخرى"],
                target:["فهم الدروس","حفظ الأدلة","إتقان الأسئلة","رفع المستوى الدراسي","التفوق في المادة","إكمال المنهج","أخرى"],
                commitment:["درس يومي","حفظ نقاط مهمة","حل أسئلة","مراجعة أسبوعية","اختبار ذاتي","أخرى"]
            },
            "اللغة العربية": {
                current:["أحتاج تأسيساً","مستوى مقبول","جيد","جيد جداً","متقدم","أخرى"],
                target:["إتقان القواعد","تحسين الإملاء","تحسين التعبير","رفع المستوى الدراسي","التفوق في المادة","إكمال المنهج","أخرى"],
                commitment:["درس يومي","حل تدريبات","قراءة نص","كتابة موضوع","مراجعة أسبوعية","اختبار ذاتي","أخرى"]
            },
            "اللغة الإنجليزية": {
                current:["مبتدئ","أساسيات","متوسط","جيد","متقدم","أخرى"],
                target:["رفع المستوى","إتقان المنهج","تحسين المفردات","تحسين القواعد","تحسين القراءة","تحسين الكتابة","تحسين التحدث","التفوق الدراسي","أخرى"],
                commitment:["درس يومي","حفظ كلمات","حل تدريبات","قراءة نص","استماع","محادثة","مراجعة أسبوعية","أخرى"]
            },
            "الرياضيات": {
                current:["أحتاج تأسيساً","أعرف الأساسيات","متوسط","جيد","قوي","أخرى"],
                target:["إتقان الأساسيات","رفع المستوى","حل المسائل","إكمال المنهج","التفوق الدراسي","الاستعداد للاختبار","أخرى"],
                commitment:["حل مسائل يومية","درس يومي","مراجعة القوانين","اختبار أسبوعي","حل نماذج","مراجعة شاملة","أخرى"]
            },
            "الفيزياء": {
                current:["أحتاج تأسيساً","متوسط","جيد","قوي","أخرى"],
                target:["فهم المفاهيم","حل المسائل","إكمال المنهج","رفع المستوى","التفوق الدراسي","أخرى"],
                commitment:["درس يومي","حل مسائل","مراجعة القوانين","تجارب تعليمية","اختبار أسبوعي","أخرى"]
            },
            "الكيمياء": {
                current:["أحتاج تأسيساً","متوسط","جيد","قوي","أخرى"],
                target:["فهم التفاعلات","حفظ القوانين","حل المسائل","إكمال المنهج","التفوق الدراسي","أخرى"],
                commitment:["درس يومي","حل تدريبات","مراجعة المعادلات","اختبار أسبوعي","مراجعة شاملة","أخرى"]
            },
            "الأحياء": {
                current:["مبتدئ","متوسط","جيد","قوي","أخرى"],
                target:["فهم المنهج","إتقان الرسومات","حفظ المعلومات","رفع المستوى","التفوق الدراسي","أخرى"],
                commitment:["درس يومي","تلخيص","رسم مخططات","حل أسئلة","اختبار أسبوعي","أخرى"]
            },
            "التاريخ": {
                current:["أحتاج تأسيساً","متوسط","جيد","قوي","أخرى"],
                target:["فهم الأحداث","حفظ التواريخ المهمة","إكمال المنهج","رفع المستوى","التفوق الدراسي","أخرى"],
                commitment:["درس يومي","تلخيص","مراجعة التواريخ","حل أسئلة","اختبار أسبوعي","أخرى"]
            },
            "الجغرافيا": {
                current:["أحتاج تأسيساً","متوسط","جيد","قوي","أخرى"],
                target:["فهم الخرائط","حفظ المفاهيم","إكمال المنهج","رفع المستوى","التفوق الدراسي","أخرى"],
                commitment:["درس يومي","تلخيص","رسم خرائط","حل أسئلة","اختبار أسبوعي","أخرى"]
            },
            "المجتمع": {
                current:["أحتاج تأسيساً","متوسط","جيد","قوي","أخرى"],
                target:["فهم الدروس","حفظ النقاط المهمة","إكمال المنهج","رفع المستوى","التفوق الدراسي","أخرى"],
                commitment:["درس يومي","تلخيص","حل أسئلة","مراجعة أسبوعية","اختبار ذاتي","أخرى"]
            },
            "الحاسب الآلي": {
                current:["مبتدئ","أعرف الأساسيات","متوسط","جيد","قوي","أخرى"],
                target:["إتقان الأساسيات","فهم المنهج","تطبيق عملي","رفع المستوى","التفوق الدراسي","أخرى"],
                commitment:["درس يومي","تطبيق عملي","حل تدريبات","مراجعة أسبوعية","اختبار ذاتي","أخرى"]
            },
            "مراجعة شاملة": {
                current:["لم أبدأ","بدأت المراجعة","منتظم","أحتاج ترتيباً","أخرى"],
                target:["إكمال المراجعة","سد نقاط الضعف","جاهزية كاملة","التفوق الدراسي","أخرى"],
                commitment:["ساعة يومياً","ساعتان يومياً","مراجعة يومية","حل نماذج","اختبار أسبوعي","أخرى"]
            },
            "الاستعداد للاختبارات": {
                current:["لم أبدأ","بدأت التحضير","منتظم","في مرحلة المراجعة","أخرى"],
                target:["اجتياز الاختبار","درجة مرتفعة","التفوق الدراسي","إكمال المراجعة","جاهزية كاملة","أخرى"],
                commitment:["ساعة يومياً","ساعتان يومياً","حل اختبار","مراجعة أسبوعية","اختبار تجريبي","برنامج خاص","أخرى"]
            },
            "حسب التخصص الجامعي": {
                current:["لم أبدأ بعد","أحتاج تحديد المتطلبات","بدأت الدراسة","منتظم","أخرى"],
                target:["إكمال مقرر","رفع المعدل","إتقان مجال التخصص","الاستعداد للاختبار","أخرى"],
                commitment:["محاضرة يومية","مراجعة محاضرة","حل واجبات","مراجعة أسبوعية","برنامج مخصص","أخرى"]
            },
            "تعلم مهارة جديدة": {
                current:["لم أبدأ","أعرف الأساسيات","بدأت التطبيق","متوسط","أخرى"],
                target:["فهم الأساسيات","تطبيق المهارة","بناء نتيجة عملية","إتقان المهارة","أخرى"],
                commitment:["30 دقيقة يومياً","60 دقيقة يومياً","تطبيق يومي","مشروع أسبوعي","أخرى"]
            },
            "قراءة كتاب": {
                current:["لم أبدأ","قرأت جزءاً بسيطاً","في منتصف الكتاب","أحتاج انتظاماً","أخرى"],
                target:["إنهاء الكتاب","تلخيص الكتاب","تطبيق الأفكار","بناء عادة قراءة","أخرى"],
                commitment:["10 صفحات يومياً","20 صفحة يومياً","قراءة يومية","تلخيص أسبوعي","أخرى"]
            },
            "دورة تعليمية": {
                current:["لم أبدأ","شاهدت أول الدروس","منتظم","قريب من الإكمال","أخرى"],
                target:["إكمال الدورة","تطبيق ما تعلمته","الحصول على شهادة","بناء مشروع تطبيقي","أخرى"],
                commitment:["درس يومي","درسان أسبوعياً","تطبيق بعد كل درس","مراجعة أسبوعية","أخرى"]
            },
            "مشروع تطبيقي": {
                current:["مجرد فكرة","مرحلة التخطيط","بدأت التنفيذ","أنجزت جزءاً كبيراً","أخرى"],
                target:["إكمال المشروع","اختبار المشروع","توثيق المشروع","عرض المشروع","أخرى"],
                commitment:["خطوة يومية","جلسة عمل أسبوعية","تطبيق عملي","مراجعة تقدم أسبوعية","أخرى"]
            },
            "بحث علمي": {
                current:["لم أبدأ","أجمع المصادر","أكتب المسودة","أراجع البحث","أخرى"],
                target:["إكمال البحث","تحسين جودة البحث","توثيق المصادر","تجهيز العرض","أخرى"],
                commitment:["قراءة مصادر يومياً","كتابة فقرة يومياً","مراجعة أسبوعية","جلسة بحث أسبوعية","أخرى"]
            },
            "منصة تعليمية": {
                current:["لم أبدأ","اخترت المنصة","بدأت التعلم","منتظم","أخرى"],
                target:["إنهاء المسار","إكمال الدروس","الحصول على شهادة","تطبيق المهارات","أخرى"],
                commitment:["درس يومي","ساعتان أسبوعياً","تطبيق بعد الدروس","مراجعة أسبوعية","أخرى"]
            },
            "محاضرات": {
                current:["لم أبدأ","أشاهد أحياناً","منتظم","أحتاج مراجعة","أخرى"],
                target:["إكمال المحاضرات","تلخيص المحاضرات","فهم المحتوى","تطبيق المفاهيم","أخرى"],
                commitment:["محاضرة يومياً","محاضرتان أسبوعياً","تلخيص بعد كل محاضرة","مراجعة أسبوعية","أخرى"]
            },
            "شهادة احترافية": {
                current:["لم أبدأ","أعرف المتطلبات","بدأت التحضير","جاهز تقريباً","أخرى"],
                target:["إكمال متطلبات الشهادة","اجتياز التقييم","الحصول على الشهادة","تطبيق المهارة عملياً","أخرى"],
                commitment:["30 دقيقة يومياً","60 دقيقة يومياً","تدريب أسبوعي","اختبار تجريبي","أخرى"]
            },
            "دورة قصيرة": {
                current:["لم أبدأ","بدأت الدورة","منتظم","قريب من الإكمال","أخرى"],
                target:["إكمال الدورة","فهم المحتوى","تطبيق المهارة","الحصول على شهادة","أخرى"],
                commitment:["درس يومي","جلسة تدريب أسبوعية","تطبيق بعد الدرس","مراجعة أسبوعية","أخرى"]
            },
            "برنامج تدريبي": {
                current:["لم أبدأ","بدأت البرنامج","منتظم","في المرحلة النهائية","أخرى"],
                target:["إكمال البرنامج","رفع الكفاءة","تطبيق المهارات","الاستعداد للتقييم","أخرى"],
                commitment:["جلسة تدريب يومية","متابعة أسبوعية","تطبيق عملي","مراجعة التقدم","أخرى"]
            },
            "ورشة عمل": {
                current:["لم أسجل بعد","سجلت ولم أبدأ","حضرت جزءاً","أحتاج تطبيقاً","أخرى"],
                target:["حضور الورشة كاملة","تطبيق مخرجات الورشة","تلخيص الفوائد","تحويلها لخطة عمل","أخرى"],
                commitment:["حضور كامل","تدوين ملاحظات","تطبيق بعد الورشة","مراجعة الفوائد","أخرى"]
            },
            "معسكر تدريبي": {
                current:["لم أبدأ","بدأت المعسكر","منتظم","في مرحلة المشروع","أخرى"],
                target:["إكمال المعسكر","بناء مشروع نهائي","تحسين المهارات","الاستعداد للتقييم","أخرى"],
                commitment:["تدريب يومي","مشروع أسبوعي","مراجعة يومية","جلسة تطبيق","أخرى"]
            },
            "تنظيم الدراسة": {
                current:["غير منظم","أحاول التنظيم","متوسط","جيد","أخرى"],
                target:["بناء جدول واضح","الالتزام بالخطة","تحسين الإنتاجية","تقليل التشتت","أخرى"],
                commitment:["تخطيط يومي","مراجعة أسبوعية","جلسة تنظيم","تقييم التقدم","أخرى"]
            },
            "تلخيص الدروس": {
                current:["لا ألخص الدروس","ألخص أحياناً","متوسط","جيد","أخرى"],
                target:["تلخيص كل درس","تحسين جودة الملخصات","تسهيل المراجعة","بناء ملف مراجعة","أخرى"],
                commitment:["تلخيص يومي","تلخيص بعد كل درس","مراجعة الملخصات","أخرى"]
            },
            "كتابة البحوث": {
                current:["أحتاج تأسيساً","كتبت بحوثاً بسيطة","متوسط","جيد","أخرى"],
                target:["تحسين منهجية البحث","تقوية التوثيق","كتابة بحث جيد","الاستعداد للمشاريع الجامعية","أخرى"],
                commitment:["قراءة مصادر","كتابة يومية","مراجعة أسبوعية","تدريب على التوثيق","أخرى"]
            },
            "مهارات العرض": {
                current:["أحتاج ثقة","مبتدئ","متوسط","جيد","أخرى"],
                target:["تحسين الإلقاء","تنظيم العرض","زيادة الثقة","تقديم عرض قوي","أخرى"],
                commitment:["تدريب يومي قصير","عرض أسبوعي","تسجيل ومراجعة","تحضير شرائح","أخرى"]
            },
            "إدارة الوقت الدراسي": {
                current:["أضيع الوقت","غير منتظم","متوسط","جيد","أخرى"],
                target:["تنظيم الوقت","الالتزام بالمواعيد","رفع الإنتاجية","إنهاء المهام في وقتها","أخرى"],
                commitment:["خطة يومية","مراجعة أسبوعية","تحديد أولويات","جلسة تركيز","أخرى"]
            },
            "اختيار التخصص": {
                current:["لم أحدد التخصص","لدي خيارات كثيرة","أحتاج بحثاً","قريب من القرار","أخرى"],
                target:["اختيار تخصص مناسب","فهم شروط القبول","تحديد خطة مستقبلية","أخرى"],
                commitment:["بحث يومي","مقارنة التخصصات","استشارة أسبوعية","كتابة ملاحظات","أخرى"]
            },
            "الاستعداد للقبول": {
                current:["لم أبدأ","أجمع المتطلبات","أجهز المستندات","جاهز تقريباً","أخرى"],
                target:["ملف قبول مكتمل","استيفاء الشروط","إرسال الطلب","أخرى"],
                commitment:["مهمة يومية","مراجعة المتطلبات","تحديث المستندات","متابعة أسبوعية","أخرى"]
            },
            "تقوية اللغة": {
                current:["مبتدئ","أساسيات","متوسط","جيد","أخرى"],
                target:["رفع المستوى","تحسين القراءة","تحسين الكتابة","الاستعداد للدراسة الجامعية","أخرى"],
                commitment:["درس يومي","حفظ كلمات","قراءة نص","استماع","محادثة","أخرى"]
            },
            "تقوية الرياضيات": {
                current:["أحتاج تأسيساً","أعرف الأساسيات","متوسط","جيد","أخرى"],
                target:["إتقان الأساسيات","حل المسائل بثقة","الاستعداد للتخصص","أخرى"],
                commitment:["حل مسائل يومية","مراجعة قوانين","اختبار أسبوعي","أخرى"]
            },
            "تجهيز المستندات": {
                current:["لم أبدأ","أجمع المستندات","أحتاج ترجمة","جاهز تقريباً","أخرى"],
                target:["ملف مستندات مكتمل","ترتيب المستندات","الاستعداد للتقديم","أخرى"],
                commitment:["مهمة يومية","مراجعة أسبوعية","تحديث ملف المستندات","أخرى"]
            },
            "مشروع التخرج": {
                current:["مجرد فكرة","مرحلة التخطيط","بدأت التنفيذ","في مرحلة الاختبار","أخرى"],
                target:["إكمال المشروع","توثيق المشروع","تجهيز العرض","الاستعداد للمناقشة","أخرى"],
                commitment:["عمل يومي","محطة أسبوعية","مراجعة المشرف","اختبار أسبوعي","أخرى"]
            },
            "بحث التخرج": {
                current:["لم أبدأ","أجمع المصادر","أكتب الفصول","أراجع البحث","أخرى"],
                target:["إكمال البحث","تحسين التوثيق","تجهيز النسخة النهائية","الاستعداد للمناقشة","أخرى"],
                commitment:["قراءة يومية","كتابة يومية","مراجعة أسبوعية","جلسة بحث","أخرى"]
            },
            "العرض النهائي": {
                current:["لم أبدأ التحضير","لدي مسودة","أحتاج تدريباً","جاهز تقريباً","أخرى"],
                target:["عرض واضح","تقديم واثق","الإجابة عن الأسئلة","إنهاء العرض بنجاح","أخرى"],
                commitment:["تدريب يومي","تحسين الشرائح","تجربة عرض أسبوعية","مراجعة الأسئلة","أخرى"]
            },
            "توثيق المشروع": {
                current:["لم أبدأ","لدي ملاحظات","أكتب التوثيق","أراجع التوثيق","أخرى"],
                target:["توثيق كامل","شرح واضح","ملف نهائي منظم","أخرى"],
                commitment:["كتابة يومية","مراجعة أسبوعية","تنظيم الملفات","أخرى"]
            },
            "الاستعداد للمناقشة": {
                current:["لم أبدأ","أراجع المشروع","أتدرب على الأسئلة","جاهز تقريباً","أخرى"],
                target:["جاهزية كاملة","إجابة قوية","ثقة في العرض","مناقشة ناجحة","أخرى"],
                commitment:["تدريب يومي","مراجعة الأسئلة","محاكاة أسبوعية","أخرى"]
            },
            "أخرى": {
                current:["لم أبدأ بعد","أحتاج تأسيساً","بدأت التعلم","متوسط","جيد","أخرى"],
                target:["إكمال الهدف","رفع المستوى","إتقان المجال","تحقيق نتيجة واضحة","أخرى"],
                commitment:["30 دقيقة يومياً","60 دقيقة يومياً","مراجعة أسبوعية","برنامج مخصص","أخرى"]
            }
        }
    },

    "الاختبارات الدولية": {
        categories: ["IELTS","TOEFL","Duolingo","HSK","CSCA","SAT","ACT","GRE","GMAT","أخرى"],
        paths: {
            "IELTS": ["Full Official Test","Mock Test","Listening","Reading","Writing Task 1","Writing Task 2","Speaking Part 1","Speaking Part 2","Speaking Part 3","Vocabulary","Grammar","Matching Headings","True False Not Given","Multiple Choice","Sentence Completion","Summary Completion","Map Labelling","Form Completion","Note Completion","Flow Chart Completion","أخرى"],
            "TOEFL": ["Full Official Test","Mock Test","Reading","Listening","Speaking","Writing","Complete the Words","Read in Daily Life","Read an Academic Passage","Build a Sentence","Write an Email","Write for an Academic Discussion","Listen and Repeat","Take an Interview","Listen and Choose a Response","Listen to a Conversation","Listen to an Announcement","Listen to an Academic Talk","Vocabulary Building","Grammar Practice","إدارة الوقت","أخرى"],
            "Duolingo": ["Full Official Test","Read and Select","Fill in the Blanks","Read and Complete","Interactive Reading","Listen and Type","Interactive Listening","Write About the Photo","Writing Sample","Interactive Writing","Speak About the Photo","Read Then Speak","Speaking Sample","Interactive Speaking","أخرى"],
            "HSK": ["HSK 1","HSK 2","HSK 3","HSK 4","HSK 5","HSK 6","Vocabulary","الحروف الصينية","Listening","Reading","Writing","Mock Test","أخرى"],
            "CSCA": ["Mathematics","Physics","Chemistry","Full Official Test","Algebra","Geometry","Calculus","Mechanics","Electricity","Organic Chemistry","Inorganic Chemistry","أخرى"],
            "SAT": ["Reading","Writing and Language","Math No Calculator","Math Calculator","Full Practice Test","Vocabulary","Grammar","أخرى"],
            "ACT": ["English","Math","Reading","Science","Writing","Full Practice Test","أخرى"],
            "GRE": ["Verbal Reasoning","Quantitative Reasoning","Analytical Writing","Vocabulary","Mock Test","أخرى"],
            "GMAT": ["Quantitative","Verbal","Integrated Reasoning","Analytical Writing","Data Insights","Mock Test","أخرى"],
            "أخرى": ["مراجعة موضوع","اختبار تجريبي","تدريب نقاط الضعف","مراجعة نهائية","أخرى"]
        },
        states: {
            "IELTS": {current:["لا أعرف مستواي","Band 4","Band 4.5","Band 5","Band 5.5","Band 6","Band 6.5","Band 7","Band 7.5","Band 8","أخرى"], target:["Band 5","Band 5.5","Band 6","Band 6.5","Band 7","Band 7.5","Band 8","Band 8.5","Band 9","أخرى"], commitment:["30 دقيقة يومياً","45 دقيقة يومياً","60 دقيقة يومياً","90 دقيقة يومياً","اختبار أسبوعي","اختباران أسبوعياً","أخرى"]},
            "TOEFL": {current:["لا أعرف مستواي","0","1","2","3","4","5","6","أخرى"], target:["3","4","5","6","أخرى"], commitment:["30 دقيقة يومياً","45 دقيقة يومياً","60 دقيقة يومياً","90 دقيقة يومياً","اختبار أسبوعي","اختباران أسبوعياً","أخرى"]},
            "Duolingo": {current:["لا أعرف مستواي","80+","90+","100+","110+","120+","أخرى"], target:["100+","110+","120+","130+","140+","أخرى"], commitment:["30 دقيقة يومياً","60 دقيقة يومياً","تدريب يومي على الأسئلة","اختبار أسبوعي","أخرى"]},
            "HSK": {current:["لا أعرف مستواي","HSK 1","HSK 2","HSK 3","HSK 4","HSK 5","أخرى"], target:["HSK 3","HSK 4","HSK 5","HSK 6","أخرى"], commitment:["30 دقيقة يومياً","60 دقيقة يومياً","مراجعة مفردات يومياً","اختبار أسبوعي","أخرى"]},
            "CSCA": {current:["لا أعرف مستواي","مبتدئ","متوسط","متقدم","أخرى"], target:["اجتياز الاختبار","درجة قوية","استيفاء شرط الجامعة الصينية","أخرى"], commitment:["30 دقيقة يومياً","60 دقيقة يومياً","مراجعة قوانين","اختبار أسبوعي","أخرى"]},
            "أخرى": {current:["لا أعرف مستواي","مبتدئ","متوسط","متقدم","أخرى"], target:["اجتياز الاختبار","درجة قوية","استيفاء شرط القبول","أخرى"], commitment:["30 دقيقة يومياً","60 دقيقة يومياً","اختبار أسبوعي","مراجعة نقاط الضعف","أخرى"]}
        }
    },

    "المنح الدراسية": {
        categories: ["البحث عن منح","اختيار الجامعات","إعداد المستندات","السيرة الذاتية","رسالة الدافع","خطابات التوصية","المقابلات","اختبارات اللغة","إجراءات السفر","التأشيرة","المتابعة بعد التقديم","أخرى"],
        paths: {
            "إعداد المستندات": ["السيرة الذاتية","كشف الدرجات","جواز السفر","شهادة التخرج","شهادة اللغة","الترجمة","التصديق","رفع المستندات","مراجعة المستندات","أخرى"],
            "رسالة الدافع": ["كتابة المسودة الأولى","تخصيص الرسالة","مراجعة اللغة","تقوية الأمثلة","المراجعة النهائية","أخرى"],
            "المقابلات": ["تدريب مقابلة","أسئلة شائعة","تحسين الإجابات","زيادة الثقة","محاكاة كاملة","أخرى"],
            "أخرى": ["تخطيط","تنفيذ","مراجعة","متابعة","أخرى"]
        },
        states: {
            "أخرى": {current:["لم أبدأ بعد","أنجزت 25٪","أنجزت 50٪","أنجزت 75٪","جاهز للتقديم","أخرى"], target:["إرسال طلب مكتمل","الحصول على مقابلة","الحصول على منحة","الحصول على قبول","أخرى"], commitment:["30 دقيقة يومياً","60 دقيقة يومياً","متابعة أسبوعية","جلسة تدريب أسبوعية","أخرى"]}
        }
    },

    "الجامعة": {
        categories: ["علوم الحاسوب","هندسة البرمجيات","الذكاء الاصطناعي","الأمن السيبراني","تقنية المعلومات","الطب","الصيدلة","التمريض","الهندسة المدنية","الهندسة المعمارية","الهندسة الكهربائية","الهندسة الميكانيكية","إدارة الأعمال","المحاسبة","الاقتصاد","القانون","الشريعة","اللغة العربية","اللغة الإنجليزية","التربية","الإعلام","العلوم السياسية","أخرى"],
        paths: {
            "علوم الحاسوب": ["الخوارزميات","هياكل البيانات","قواعد البيانات","الذكاء الاصطناعي","تطوير الويب","الأمن السيبراني","البرمجة الكائنية","المشاريع","أخرى"],
            "الذكاء الاصطناعي": ["تعلم الآلة","التعلم العميق","معالجة اللغة الطبيعية","الرؤية الحاسوبية","علم البيانات","بناء مشروع عملي","أخرى"],
            "أخرى": ["المقررات الأساسية","المهارات العملية","مشروع التخرج","التدريب العملي","الاختبارات","الأبحاث","الواجبات","المراجعة","أخرى"]
        },
        states: {
            "الذكاء الاصطناعي": {current:["أعرف الأساسيات","أنهيت دورة","نفذت مشروعاً","أخرى"], target:["بناء مشروع متكامل","إتقان المجال","الاستعداد لسوق العمل","أخرى"], commitment:["30 دقيقة يومياً","60 دقيقة يومياً","مشروع أسبوعي","تطبيق عملي أسبوعي","أخرى"]},
            "الخوارزميات": {current:["مبتدئ","أفهم الأساسيات","أحل مسائل سهلة","أحل مسائل متوسطة","أخرى"], target:["إتقان الأساسيات","حل مسائل متقدمة","الاستعداد للمقابلات","أخرى"], commitment:["حل مسائل يومية","60 دقيقة يومياً","مراجعة أسبوعية","أخرى"]},
            "أخرى": {current:["بداية المقرر","أحتاج إلى مراجعة","متوسط","قوي","أخرى"], target:["اجتياز المقرر","تحقيق درجة عالية","إكمال مشروع","إتقان المادة","أخرى"], commitment:["30 دقيقة يومياً","60 دقيقة يومياً","مراجعة محاضرة","حل واجبات","مراجعة أسبوعية","أخرى"]}
        }
    },

    "الرياضيات": {
        categories: ["الحساب الأساسي","الجبر","الهندسة","حساب المثلثات","ما قبل التفاضل","الإحداثيات","الدوال","المتتاليات","النهايات","التفاضل","التكامل","الإحصاء","الاحتمالات","الرياضيات المنفصلة","المنطق الرياضي","نظرية الأعداد","الجبر الخطي","المصفوفات","المتجهات","المعادلات التفاضلية","الرياضيات المالية","الرياضيات التطبيقية","الرياضيات الهندسية","الرياضيات الجامعية","رياضيات علوم الحاسوب","رياضيات الذكاء الاصطناعي","الاستعداد للاختبارات","المراجعة","أخرى"],
        paths: {
            "الحساب الأساسي": ["الأعداد الطبيعية","الأعداد الصحيحة","الأعداد النسبية","الأعداد العشرية","الكسور","المقارنة والترتيب","الجمع","الطرح","الضرب","القسمة","العمليات الأربع","ترتيب العمليات","القوى والأسس","الجذور التربيعية","الجذور التكعيبية","القيمة المطلقة","العوامل والمضاعفات","الأعداد الأولية","القاسم المشترك الأكبر","المضاعف المشترك الأصغر","النسبة","التناسب","النسبة المئوية","التقدير والتقريب","الوحدات والتحويلات","القياس","المحيط","المساحة","الحجم","المسائل اللفظية","الحساب الذهني","المراجعة الشاملة","اختبار قصير","اختبار تجريبي","أخرى"],
            "الجبر": ["المتغيرات والثوابت","العبارات الجبرية","تبسيط العبارات","القيمة العددية","الحدود الجبرية","وحيدات الحد","كثيرات الحدود","جمع كثيرات الحدود","طرح كثيرات الحدود","ضرب كثيرات الحدود","قسمة كثيرات الحدود","تحليل العبارات الجبرية","العامل المشترك","تحليل الفرق بين مربعين","تحليل ثلاثي الحدود","تحليل المكعبات","المعادلات الخطية","المعادلات متعددة الخطوات","المعادلات ذات الكسور","المعادلات التربيعية","القانون العام","إكمال المربع","التحليل","المعادلات متعددة الحدود","المتباينات","القيمة المطلقة","أنظمة المعادلات","حل المعادلات بيانياً","حل المعادلات جبرياً","الجذور الجبرية","الأعداد المركبة","الاقترانات","الدوال الخطية","الدوال التربيعية","الدوال الأسية","الدوال اللوغاريتمية","الدوال الكسرية","الدوال المطلقة","رسم الدوال","تحويلات الدوال","حل المسائل اللفظية","المراجعة الشاملة","اختبار قصير","اختبار تجريبي","أخرى"],
            "الهندسة": ["المفاهيم الهندسية الأساسية","النقاط والمستقيمات","الزوايا","المثلثات","تطابق المثلثات","تشابه المثلثات","نظرية فيثاغورس","الأشكال الرباعية","المضلعات","الدوائر","الأقواس والزوايا المركزية","المماس والوتر","المحيط","المساحة","الحجوم","المجسمات الهندسية","المنشورات","الأسطوانات","المخاريط","الكرات","البرهان الهندسي","الإنشاءات الهندسية","الهندسة الإحداثية","المسافة بين نقطتين","منتصف القطعة المستقيمة","ميل المستقيم","معادلة المستقيم","الهندسة التحويلية","الانعكاس","الانسحاب","الدوران","التكبير والتصغير","حل المسائل الهندسية","المراجعة الشاملة","اختبار قصير","اختبار تجريبي","أخرى"],
            "حساب المثلثات": ["مقدمة حساب المثلثات","الزوايا","قياس الزوايا","الدرجات والراديان","الأقواس","النسب المثلثية","جيب الزاوية","جيب التمام","الظل","ظل التمام","القاطع","قاطع التمام","الزوايا الخاصة","الدائرة المثلثية","إحداثيات الدائرة المثلثية","إشارات النسب المثلثية","اختزال الزوايا","الهويات المثلثية","الهويات الأساسية","هويات المجموع والفرق","هويات الزاوية المضاعفة","هويات نصف الزاوية","تحويل الجداء إلى مجموع","تحويل المجموع إلى جداء","قوانين الجيب","قوانين جيب التمام","حل المثلثات","المثلثات القائمة","المثلثات غير القائمة","المعادلات المثلثية","المتباينات المثلثية","الدوال المثلثية","رسم الدوال المثلثية","تحويلات الدوال","الدوال العكسية","التطبيقات العملية","حل المسائل اللفظية","المراجعة الشاملة","اختبار قصير","اختبار تجريبي","أخرى"],
            "ما قبل التفاضل": ["مراجعة الجبر","مراجعة حساب المثلثات","الاقترانات","مفهوم الدالة","مجال الدالة","مدى الدالة","أنواع الدوال","الدوال الخطية","الدوال التربيعية","الدوال التكعيبية","الدوال كثيرة الحدود","الدوال الكسرية","الدوال الجذرية","الدوال الأسية","الدوال اللوغاريتمية","الدوال المثلثية","الدوال العكسية","تركيب الدوال","تحويلات الدوال","رسم الدوال","تحليل الرسوم البيانية","المتتاليات","المتتاليات الحسابية","المتتاليات الهندسية","المتسلسلات","المتجهات","عمليات المتجهات","المتجهات في المستوى","المتجهات في الفراغ","الأعداد المركبة","الصورة الجبرية","الصورة القطبية","نظرية دي موافر","المصفوفات الأساسية","المحددات الأساسية","حل الأنظمة الخطية","المقاطع المخروطية","الدائرة","القطع المكافئ","القطع الناقص","القطع الزائد","المتباينات","القيمة المطلقة","حل المسائل التطبيقية","الاستعداد للتفاضل","المراجعة الشاملة","اختبار قصير","اختبار تجريبي","أخرى"],
            "التفاضل": ["مراجعة ما قبل التفاضل","فكرة التفاضل","معدل التغير","النهايات","النهايات الجبرية","النهايات عند اللانهاية","النهايات المثلثية","النهايات الخاصة","الاتصال","استمرارية الدوال","المشتقة","تعريف المشتقة","المشتقة من المبادئ الأولى","قواعد الاشتقاق","اشتقاق الثوابت","اشتقاق القوى","اشتقاق كثيرات الحدود","اشتقاق الدوال الكسرية","اشتقاق الدوال الجذرية","اشتقاق الدوال الأسية","اشتقاق الدوال اللوغاريتمية","اشتقاق الدوال المثلثية","اشتقاق الدوال العكسية","قاعدة الضرب","قاعدة القسمة","قاعدة السلسلة","الاشتقاق الضمني","الاشتقاق اللوغاريتمي","المشتقات العليا","معدل التغير اللحظي","المماس والعمودي","زيادة ونقصان الدوال","القيم العظمى والصغرى","اختبار المشتقة الأولى","اختبار المشتقة الثانية","التقعر ونقاط الانعطاف","رسم المنحنيات","نظرية القيمة المتوسطة","نظرية رول","نظرية لاغرانج","تقريب الدوال","قاعدة لوبيتال","حل المسائل التطبيقية","مسائل الحركة","مسائل المعدلات المرتبطة","مسائل التحسين","التقريب الخطي","مراجعة شاملة","اختبار قصير","اختبار تجريبي","الاستعداد للتكامل","أخرى"],
            "التكامل": ["مراجعة التفاضل", "فكرة التكامل", "مفهوم الدالة الأصلية", "الرموز الأساسية للتكامل", "التكامل غير المحدد", "الدوال الأصلية", "التكامل باعتباره العملية العكسية للاشتقاق", "قواعد التكامل الأساسية", "تكامل الثابت", "تكامل القوى", "تكامل كثيرات الحدود", "تكامل الجمع والطرح", "تكامل الثابت المضروب", "تكامل الدوال الجذرية", "تكامل الدوال الكسرية البسيطة", "تكامل الدوال الأسية الأساسية", "تكامل الدوال اللوغاريتمية الأساسية", "تكامل الدوال المثلثية الأساسية", "التحقق من الحل بالاشتقاق", "حل المسائل الأساسية", "مراجعة التكامل غير المحدد", "فكرة التكامل المحدد", "مفهوم المساحة", "الحدود العليا والسفلى", "خواص التكامل المحدد", "مبرهنة التكامل الأساسية", "حساب التكامل المحدد", "التكامل المحدد للدوال كثيرة الحدود", "التكامل المحدد للدوال الكسرية البسيطة", "التكامل المحدد للدوال الأسية", "التكامل المحدد للدوال اللوغاريتمية", "التكامل المحدد للدوال المثلثية", "استخدام التناظر", "التكامل على فترات مختلفة", "حساب المساحات البسيطة", "المساحة تحت المنحنى", "المساحة فوق المنحنى", "المساحة بين منحنيين بسيطين", "تفسير التكامل بيانياً", "العلاقة بين التفاضل والتكامل", "التطبيقات الأساسية", "مراجعة التكامل الأساسي", "اختيار طريقة التكامل", "التكامل بالتعويض", "التكامل بالتعويض البسيط", "التكامل بالتعويض المركب", "التكامل بالتجزئة", "اختيار الدالتين", "التكامل بالتجزئة المتكرر", "الكسور الجزئية", "تحليل المقامات", "الكسور الجزئية البسيطة", "الكسور الجزئية المتكررة", "الكسور الجزئية التربيعية", "التكاملات المثلثية", "تكاملات جيب الزاوية", "تكاملات جيب التمام", "تكاملات الظل", "تكاملات القوى المثلثية", "التعويضات المثلثية", "التعويض بالجيب", "التعويض بجيب التمام", "التعويض بالظل", "اختيار التعويض المناسب", "التكاملات المختلطة", "اختيار أفضل طريقة", "تبسيط التعبيرات", "حل التكاملات المعقدة", "التحقق من الحل", "حل المسائل التطبيقية", "الاستعداد للتطبيقات", "المراجعة الشاملة", "اختبار قصير", "اختبار تجريبي", "مراجعة التكامل المحدد", "مراجعة تقنيات التكامل", "التطبيقات الهندسية", "فكرة حساب المساحات", "المساحة بين منحنيين", "المساحات متعددة المنحنيات", "اختيار حدود التكامل", "حساب الحجوم", "طريقة الأقراص", "طريقة الغسالات", "طريقة القشور الأسطوانية", "اختيار طريقة الحجم المناسبة", "حجوم المجسمات الدورانية", "مساحات الأسطح الدورانية", "أطوال الأقواس", "المساحات القطبية الأساسية", "الحجوم التطبيقية", "التطبيقات الفيزيائية الأساسية", "التطبيقات الهندسية الأساسية", "اختيار النموذج المناسب", "تحليل الرسوم البيانية", "الاستعداد للتطبيقات المتقدمة", "مراجعة التطبيقات الأساسية", "التطبيقات الفيزيائية", "الإزاحة", "المسافة", "السرعة", "التسارع", "الشغل", "القوة المتغيرة", "الضغط", "السوائل", "مركز الكتلة", "عزم القصور", "الطاقة", "الأحمال", "الكثافة", "مراكز المساحات", "تصميم المقاطع", "الحجوم الهندسية", "التطبيقات الاقتصادية", "التكلفة الكلية", "الإيراد الكلي", "الربح الكلي", "الفائض الاستهلاكي", "الفائض الإنتاجي", "معدلات النمو", "التطبيقات الإحصائية", "القيم المتوسطة", "التوزيعات المستمرة", "التطبيقات الحاسوبية", "تقريب البيانات", "تحليل النماذج", "التفسير الفيزيائي", "التفسير الهندسي", "التفسير الاقتصادي", "الاستعداد للتطبيقات الجامعية", "فكرة التكامل العددي", "أسباب استخدام التقريب العددي", "مفهوم الخطأ العددي", "التقريب الهندسي", "قاعدة المستطيلات", "قاعدة نقطة المنتصف", "قاعدة شبه المنحرف", "قاعدة شبه المنحرف المركبة", "قاعدة سمبسون", "قاعدة سمبسون المركبة", "مقارنة طرق التقريب", "اختيار الطريقة المناسبة", "تقسيم الفترات", "زيادة الدقة", "تقدير الخطأ", "تحليل التقارب", "التكامل العددي باستخدام الحاسوب", "تحليل النتائج", "مقارنة الحل العددي بالحل التحليلي", "الاستعداد للرياضيات التطبيقية", "أخرى", "مراجعة شاملة للتكامل", "التكاملات غير الصحيحة", "تكاملات الحدود اللانهائية", "تكاملات الدوال غير المستمرة", "اختبار تقارب التكامل", "التكاملات الخاصة", "اختيار طريقة الحل", "دمج تقنيات التكامل", "التكاملات المركبة", "التكاملات التطبيقية المتقدمة", "تحليل المسائل المعقدة", "اختيار الاستراتيجية المناسبة", "الربط بين فروع التكامل", "حل المسائل متعددة الخطوات", "حل المسائل الجامعية", "حل المسائل الهندسية", "حل المسائل الفيزيائية", "حل المسائل الحاسوبية", "التطبيقات الواقعية", "المراجعة النهائية", "تحليل الأخطاء الشائعة", "بناء خطة مراجعة", "اختبار شامل", "الاستعداد للاختبارات النهائية", "الاستعداد للرياضيات الجامعية", "الاستعداد للمقررات المتقدمة"], 
            "الإحصاء": ["مقدمة في الإحصاء", "تعريف الإحصاء", "أهمية الإحصاء", "فروع الإحصاء", "الإحصاء الوصفي", "الإحصاء الاستدلالي", "تطبيقات الإحصاء", "الإحصاء في الحياة اليومية", "الإحصاء في الطب", "الإحصاء في الهندسة", "الإحصاء في الاقتصاد", "الإحصاء في علوم الحاسوب", "الإحصاء في الذكاء الاصطناعي", "الإحصاء في علم البيانات", "الإحصاء في البحث العلمي", "البيانات", "تعريف البيانات", "مصادر البيانات", "طرق جمع البيانات", "أنواع البيانات", "البيانات النوعية", "البيانات الكمية", "البيانات المنفصلة", "البيانات المستمرة", "المجتمع الإحصائي", "العينة", "أنواع العينات", "العينة العشوائية", "العينة المنتظمة", "العينة الطبقية", "العينة العنقودية", "التعداد الشامل", "المتغيرات", "المتغير المستقل", "المتغير التابع", "الثوابت", "مستويات القياس", "المقياس الاسمي", "المقياس الترتيبي", "المقياس الفئوي", "المقياس النسبي", "جودة البيانات", "الدقة", "الصدق", "الموثوقية", "التحيز", "الأخطاء الإحصائية", "التطبيقات الواقعية", "حل الأمثلة", "حل المسائل", "المراجعة الشاملة", "اختبار قصير", "اختبار تجريبي", "الاستعداد للجزء الثاني", "نوعية", "كمية", "منفصلة", "مستمرة", "مختلطة", "فهم المفهوم", "تصنيف البيانات", "جمع البيانات", "تحليل البيانات", "تفسير البيانات", "تطبيقات واقعية", "أخرى"],
            "المعادلات التفاضلية": ["مراجعة التفاضل", "مراجعة التكامل", "فكرة المعادلات التفاضلية", "أهمية المعادلات التفاضلية", "التعرف على المعادلات التفاضلية", "تصنيف المعادلات", "رتبة المعادلة", "درجة المعادلة", "المعادلات العادية", "المعادلات الجزئية", "المعادلات الخطية", "المعادلات غير الخطية", "حلول المعادلات التفاضلية", "الحل العام", "الحل الخاص", "المسائل الابتدائية", "المعادلات القابلة للفصل", "معادلات بسيطة", "معادلات جذرية", "معادلات كسرية", "معادلات أسية", "معادلات لوغاريتمية", "معادلات مثلثية", "تطبيقات عملية", "فصل المتغيرات", "تكامل الطرفين", "إيجاد ثابت التكامل", "تطبيق الشروط الابتدائية", "التحقق من الحل", "التطبيقات الأساسية", "النمو السكاني", "الاضمحلال الإشعاعي", "التبريد", "حل المسائل", "المراجعة الشاملة", "اختبار قصير", "اختبار تجريبي", "الاستعداد للجزء الثاني", "مراجعة الجزء الأول", "المعادلات الخطية من الرتبة الأولى", "الصيغة القياسية", "معاملات المعادلة", "العامل التكاملي", "حساب العامل التكاملي", "ضرب المعادلة بالعامل التكاملي", "حل المعادلات الخطية", "المعادلات المتجانسة", "اختبار التجانس", "تحويل المتغيرات", "حل المعادلات المتجانسة", "معادلات برنولي", "تحويل معادلات برنولي", "حل معادلات برنولي", "اختيار طريقة الحل", "التطبيقات الفيزيائية", "التطبيقات الهندسية", "التطبيقات الاقتصادية", "الاستعداد للجزء الثالث", "معادلات ذات معاملات ثابتة", "معادلات ذات معاملات متغيرة", "معادلات مع شروط ابتدائية", "متجانسة بسيطة", "متجانسة كسرية", "متجانسة جذرية", "متجانسة تطبيقية", "أسية", "كسرية", "جذرية", "مراجعة الجزء الثاني", "المعادلات الدقيقة", "التعرف على المعادلات الدقيقة", "شرط الدقة", "اختبار الدقة", "حل المعادلات الدقيقة", "إيجاد دالة الحل", "المعادلات غير الدقيقة", "التعرف على المعادلات غير الدقيقة", "العوامل التكاملية", "العامل التكاملي بدلالة x", "العامل التكاملي بدلالة y", "اختيار العامل التكاملي المناسب", "تحويل المعادلة إلى معادلة دقيقة", "حل المعادلات غير الدقيقة", "تطبيقات الرتبة الأولى", "تطبيقات النمو", "تطبيقات الاضمحلال", "تطبيقات الخلط", "تطبيقات الحركة", "تطبيقات الاقتصاد", "حل المسائل التطبيقية", "الاستعداد للجزء الرابع", "معادلات كثيرة الحدود", "غير دقيقة بسيطة", "غير دقيقة تحتاج عامل تكاملي", "غير دقيقة تطبيقية", "بدلالة x", "بدلالة y", "تطبيقات متنوعة", "مراجعة الجزء الثالث", "المعادلات الخطية من الرتبة الثانية", "المعاملات الثابتة", "المعادلة المميزة", "إيجاد المعادلة المميزة", "حل المعادلة المميزة", "الجذور الحقيقية المختلفة", "الجذور الحقيقية المكررة", "الجذور المركبة", "كتابة الحل العام", "تحليل نوع الجذور", "إيجاد الحل الخاص", "الحركة", "الاهتزازات", "النوابض", "الدوائر الكهربائية", "التطبيقات الحاسوبية", "الاستعداد للجزء الخامس", "معاملات ثابتة بسيطة", "معاملات ثابتة متنوعة", "مسائل مختلطة", "مراجعة الجزء الرابع", "المعادلات غير المتجانسة", "الحد غير المتجانس", "الحل الكامل", "طريقة المعاملات غير المعينة", "مبدأ التخمين المناسب", "اختيار صورة الحل الخاص", "تصحيح صورة الحل", "إيجاد معاملات الحل", "طريقة تغيير المعاملات", "حساب الدوال المساعدة", "مقارنة الطريقتين", "اختيار الطريقة المناسبة", "الحركة القسرية", "الاهتزازات القسرية", "الاستعداد للجزء السادس", "بسيطة", "كثيرة الحدود", "مثلثية", "أسية مثلثية", "مختلطة", "تطبيقية", "اختيار الطريقة", "مراجعة الجزء الخامس", "أنظمة المعادلات التفاضلية", "التعرف على النظام", "كتابة النظام", "تحويل النظام إلى صيغة مصفوفية", "المصفوفات في الأنظمة", "المحددات", "القيم الذاتية", "المتجهات الذاتية", "حساب القيم الذاتية", "حساب المتجهات الذاتية", "الحل باستخدام القيم الذاتية", "الحل العام للنظام", "تحليل الاستقرار", "السلوك طويل المدى", "النظم الخطية", "النظم المتجانسة", "النظم غير المتجانسة", "النماذج السكانية", "نماذج التفاعل", "الاستعداد للجزء السابع", "مراجعة الجزء السادس", "مقدمة تحويل لابلاس", "تعريف تحويل لابلاس", "وجود تحويل لابلاس", "خصائص تحويل لابلاس", "الخطية", "الإزاحة الزمنية", "الإزاحة في المجال", "ضرب الدوال", "القسمة على الزمن", "المشتقات", "التكاملات", "تحويل الدوال الأساسية", "تحويل الدوال الأسية", "تحويل الدوال المثلثية", "تحويل الدوال الزائدية", "تحويل كثيرات الحدود", "تحويل المشتقات", "حل المعادلات التفاضلية", "التحويل العكسي", "الجداول الأساسية", "نظرية الالتفاف", "الدوال الدرجية", "دالة هيفيسايد", "الدوال النبضية", "دالة ديراك", "حل الأنظمة", "التطبيقات الكهربائية", "الاستعداد للجزء الثامن", "دوال كثيرة الحدود", "دوال أسية", "دوال مثلثية", "دوال زائدية", "دوال مختلطة", "هيفيسايد", "ديراك", "الالتفاف", "تطبيقات خاصة", "كهربائية", "متجانسة", "غير متجانسة", "ثنائية", "ثلاثية", "فيزيائية", "هندسية", "اقتصادية", "حاسوبية", "سكانية", "مراجعة الجزء السابع", "مقدمة النمذجة الرياضية", "فهم النماذج الرياضية", "خطوات بناء النموذج", "تحليل الفرضيات", "بناء المعادلة", "تحليل الحل", "تفسير النتائج", "نماذج النمو السكاني", "النمو الأسي", "النمو اللوجستي", "نماذج الاضمحلال", "قانون نيوتن للتبريد", "نماذج الخلط", "مسائل الخلط", "نماذج الحركة", "الحركة الخطية", "الحركة الرأسية", "نماذج الاهتزاز", "الحركة التوافقية", "الاهتزاز المخمد", "الاهتزاز القسري", "دوائر RC", "دوائر RL", "دوائر RLC", "التفاعلات الكيميائية", "نماذج الانتشار", "نماذج الاقتصاد", "نماذج العرض والطلب", "نماذج التمويل", "نماذج التحكم", "الأنظمة الديناميكية", "النماذج البيئية", "النماذج الحيوية", "النماذج الحاسوبية", "النماذج الهندسية", "اختيار النموذج المناسب", "تحليل النتائج", "التحقق من النموذج", "الاستعداد للجزء التاسع", "النمو", "الاضمحلال", "الخلط", "الاهتزاز", "الدوائر", "بيئية", "حيوية", "النمذجة الرياضية", "نماذج النمو والاضمحلال", "الحركة والاهتزازات والدوائر الكهربائية", "النماذج الاقتصادية والبيئية والحيوية والحاسوبية", "مراجعة الجزء الثامن", "مقدمة المعادلات التفاضلية الجزئية", "تعريف المعادلات التفاضلية الجزئية", "الفرق بين المعادلات العادية والجزئية", "رتبة المعادلات الجزئية", "درجة المعادلات الجزئية", "تصنيف المعادلات الجزئية", "المعادلات شبه الخطية", "المعادلات البيضوية", "المعادلات القطعية", "المعادلات الزائدية", "معادلة الحرارة", "معادلة الموجة", "معادلة لابلاس", "الشروط الابتدائية", "شروط الحدود", "الحل التحليلي", "الحل التقريبي", "تفسير الحلول", "انتقال الحرارة", "انتشار المواد", "انتقال الموجات", "التطبيقات البيئية", "التطبيقات الحيوية", "الاستعداد للجزء العاشر", "بيضوية", "قطعية", "زائدية", "خطية", "غير خطية", "شبه خطية", "فيزيائي", "هندسي", "كهربائي", "حاسوبي", "بيئي", "حيوي", "مراجعة شاملة", "مراجعة معادلات الرتبة الأولى", "مراجعة معادلات الرتبة الثانية", "مراجعة المعادلات الدقيقة", "مراجعة معادلات برنولي", "مراجعة المعادلات المتجانسة", "مراجعة الأنظمة", "مراجعة تحويل لابلاس", "مراجعة المعادلات الجزئية", "تصنيف المسائل", "التعرف على نوع المعادلة", "اختيار استراتيجية الحل", "دمج أكثر من طريقة", "حل المسائل المختلطة", "حل المسائل متعددة الخطوات", "حل النماذج الفيزيائية", "حل النماذج الهندسية", "حل النماذج الكهربائية", "حل النماذج الحاسوبية", "حل النماذج الاقتصادية", "حل النماذج البيئية", "حل النماذج الحيوية", "تحليل الحلول", "مقارنة طرق الحل", "تحليل الأخطاء الشائعة", "تصحيح الأخطاء", "تحسين سرعة الحل", "بناء خطة مراجعة", "مراجعة نقاط الضعف", "حل اختبارات قصيرة", "حل اختبارات متوسطة", "حل اختبارات شاملة", "اختبارات تجريبية", "محاكاة اختبار نهائي", "الاستعداد الجامعي", "الاستعداد للمقررات المتقدمة", "الاستعداد للمشاريع التطبيقية", "معادلات رتبة أولى", "معادلات رتبة ثانية", "معادلات دقيقة", "معادلات غير متجانسة", "أنظمة", "تحويل لابلاس", "معادلات جزئية", "التعرف على النوع", "تنفيذ الحل", "تحليل النتيجة", "حل المسألة كاملة", "مختلط", "أخرى"], 
            "أخرى": ["القوانين","حل التمارين","المسائل الكلامية","تدريب مؤقت","مراجعة الأخطاء","أخرى"]
        },
        states: {
            "الأعداد الطبيعية": {current:["لا أعرف الأعداد الطبيعية","أميز الأعداد","أجري عمليات بسيطة","أحل مسائل متنوعة","أخرى"], target:["فهم الأعداد الطبيعية","زيادة سرعة الحل","حل مسائل متنوعة","إتقان المهارة","أخرى"], commitment:["10 مسائل يومياً","20 مسألة يومياً","حل ورقة تدريب","مراجعة أسبوعية","اختبار ذاتي","أخرى"]},
            "الأعداد الصحيحة": {current:["لا أعرف الأعداد الصحيحة","أميز الأعداد الموجبة والسالبة","أجري عمليات بسيطة","أحل مسائل متنوعة","أخرى"], target:["فهم الأعداد الصحيحة","إتقان العمليات عليها","حل مسائل متنوعة","تقليل الأخطاء","أخرى"], commitment:["10 مسائل يومياً","20 مسألة يومياً","حل ورقة تدريب","مراجعة أسبوعية","اختبار ذاتي","أخرى"]},
            "الأعداد النسبية": {current:["لا أعرف الأعداد النسبية","أفهم معناها جزئياً","أحول بين الصور المختلفة","أحل مسائل متنوعة","أخرى"], target:["فهم الأعداد النسبية","التحويل بين الكسور والعشريات","حل مسائل متنوعة","إتقان المقارنة والترتيب","أخرى"], commitment:["10 مسائل يومياً","20 مسألة يومياً","حل ورقة تدريب","مراجعة أسبوعية","اختبار ذاتي","أخرى"]},
            "الأعداد العشرية": {current:["لا أفهم الأعداد العشرية","أقرأ الأعداد العشرية","أجري عمليات بسيطة","أحل مسائل متنوعة","أخرى"], target:["فهم الأعداد العشرية","إتقان العمليات","حل مسائل حياتية","زيادة السرعة","أخرى"], commitment:["10 تدريبات يومياً","20 تدريباً","حل ورقة عمل","مراجعة أسبوعية","اختبار قصير","أخرى"]},
            "الكسور": {current:["لا أفهم الكسور","أجمع الكسور","أطرح الكسور","أضرب وأقسم الكسور","أحل مسائل متنوعة","أخرى"], target:["فهم الكسور","إتقان العمليات","حل المسائل اللفظية","زيادة السرعة","أخرى"], commitment:["10 تدريبات","20 تدريباً","حل ورقة عمل","اختبار قصير","مراجعة أسبوعية","أخرى"]},
            "المقارنة والترتيب": {current:["أواجه صعوبة في المقارنة","أقارن أعداداً بسيطة","أرتب الأعداد","أحل مسائل متنوعة","أخرى"], target:["إتقان المقارنة","إتقان الترتيب","تقليل الأخطاء","حل مسائل متنوعة","أخرى"], commitment:["10 مسائل يومياً","20 مسألة يومياً","حل ورقة تدريب","مراجعة أسبوعية","اختبار ذاتي","أخرى"]},
            "الجمع": {current:["لا أتقن الجمع","أجمع أعداداً بسيطة","أجمع أعداداً متعددة الخانات","أحل مسائل متنوعة","أخرى"], target:["إتقان الجمع","زيادة السرعة","تقليل الأخطاء","حل مسائل مركبة","أخرى"], commitment:["15 مسألة","30 مسألة","تدريب ذهني","اختبار سريع","مراجعة","أخرى"]},
            "الطرح": {current:["لا أتقن الطرح","أطرح أعداداً بسيطة","أطرح مع الاستلاف","أحل مسائل متنوعة","أخرى"], target:["إتقان الطرح","زيادة السرعة","تقليل الأخطاء","حل مسائل مركبة","أخرى"], commitment:["15 مسألة","30 مسألة","تدريب ذهني","اختبار سريع","مراجعة","أخرى"]},
            "الضرب": {current:["لا أتقن الضرب","أحفظ بعض الجداول","أضرب أعداداً بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان جدول الضرب","زيادة سرعة الضرب","تقليل الأخطاء","حل مسائل مركبة","أخرى"], commitment:["تدريب جدول الضرب","15 مسألة","30 مسألة","اختبار سريع","مراجعة","أخرى"]},
            "القسمة": {current:["لا أتقن القسمة","أقسم أعداداً بسيطة","أستخدم القسمة المطولة","أحل مسائل متنوعة","أخرى"], target:["إتقان القسمة","زيادة السرعة","تقليل الأخطاء","حل مسائل مركبة","أخرى"], commitment:["15 مسألة","30 مسألة","تدريب ذهني","اختبار سريع","مراجعة","أخرى"]},
            "العمليات الأربع": {current:["أعرف الجمع فقط","أعرف الجمع والطرح","أجيد الضرب","أجيد القسمة","أجيد العمليات الأربع","أخرى"], target:["إتقان العمليات","زيادة السرعة","تقليل الأخطاء","حل مسائل مركبة","أخرى"], commitment:["15 مسألة","30 مسألة","تدريب ذهني","اختبار سريع","مراجعة","أخرى"]},
            "ترتيب العمليات": {current:["لا أعرف ترتيب العمليات","أعرف القاعدة","أحل أمثلة بسيطة","أحل مسائل مركبة","أخرى"], target:["فهم ترتيب العمليات","تطبيق القاعدة بدقة","حل مسائل مركبة","تقليل الأخطاء","أخرى"], commitment:["10 تدريبات","حل مسائل","مراجعة القواعد","اختبار قصير","أخرى"]},
            "القوى والأسس": {current:["لا أعرف الأسس","أعرف المفهوم","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["فهم القوانين","إتقان التبسيط","حل مسائل متنوعة","أخرى"], commitment:["10 تدريبات","حل مسائل","مراجعة القوانين","اختبار قصير","أخرى"]},
            "الجذور التربيعية": {current:["لا أعرف الجذور","أعرف الجذر التربيعي","أبسط جذوراً بسيطة","أحل مسائل متنوعة","أخرى"], target:["فهم الجذور","تبسيط الجذور","حل مسائل متنوعة","أخرى"], commitment:["حل تدريبات","مراجعة","اختبار","ورقة عمل","أخرى"]},
            "الجذور التكعيبية": {current:["لا أعرف الجذور","أعرف الجذر التكعيبي","أبسط جذوراً بسيطة","أحل مسائل متنوعة","أخرى"], target:["فهم الجذور","تبسيط الجذور","حل مسائل متنوعة","أخرى"], commitment:["حل تدريبات","مراجعة","اختبار","ورقة عمل","أخرى"]},
            "القيمة المطلقة": {current:["لا أعرف القيمة المطلقة","أفهم معناها جزئياً","أحل أمثلة بسيطة","أحل مسائل متنوعة","أخرى"], target:["فهم القيمة المطلقة","حل مسائل متنوعة","تطبيقها في المقارنة والمسافة","أخرى"], commitment:["10 تدريبات","حل مسائل","مراجعة القاعدة","اختبار قصير","أخرى"]},
            "العوامل والمضاعفات": {current:["لا أعرف العوامل والمضاعفات","أميز العوامل","أميز المضاعفات","أحل مسائل متنوعة","أخرى"], target:["فهم العوامل والمضاعفات","إتقان التحليل","حل مسائل متنوعة","أخرى"], commitment:["10 مسائل يومياً","20 مسألة يومياً","حل ورقة تدريب","مراجعة أسبوعية","اختبار ذاتي","أخرى"]},
            "الأعداد الأولية": {current:["لا أعرف الأعداد الأولية","أميز بعضها","أحلل الأعداد","أحل مسائل متنوعة","أخرى"], target:["فهم الأعداد الأولية","تمييز الأعداد المركبة","إتقان التحليل إلى عوامل","أخرى"], commitment:["10 مسائل يومياً","20 مسألة يومياً","حل ورقة تدريب","مراجعة أسبوعية","اختبار ذاتي","أخرى"]},
            "القاسم المشترك الأكبر": {current:["لا أعرف القاسم المشترك الأكبر","أحسبه لأعداد بسيطة","أستخدم التحليل","أحل مسائل متنوعة","أخرى"], target:["فهم القاسم المشترك الأكبر","حسابه بسرعة","حل مسائل تطبيقية","أخرى"], commitment:["10 مسائل","20 مسألة","ورقة تدريب","اختبار","أخرى"]},
            "المضاعف المشترك الأصغر": {current:["لا أعرف المضاعف المشترك الأصغر","أحسبه لأعداد بسيطة","أستخدم التحليل","أحل مسائل متنوعة","أخرى"], target:["فهم المضاعف المشترك الأصغر","حسابه بسرعة","حل مسائل تطبيقية","أخرى"], commitment:["10 مسائل","20 مسألة","ورقة تدريب","اختبار","أخرى"]},
            "النسبة": {current:["لا أعرف المفهوم","أحل مسائل بسيطة","أحل مسائل متوسطة","أحل مسائل متنوعة","أخرى"], target:["إتقان النسبة","حل مسائل حياتية","تطبيق النسبة في القياس","أخرى"], commitment:["10 مسائل","20 مسألة","ورقة تدريب","اختبار","أخرى"]},
            "التناسب": {current:["لا أعرف المفهوم","أحل مسائل بسيطة","أحل مسائل متوسطة","أحل مسائل متنوعة","أخرى"], target:["إتقان التناسب","حل مسائل حياتية","استخدام التناسب في التطبيقات","أخرى"], commitment:["10 مسائل","20 مسألة","ورقة تدريب","اختبار","أخرى"]},
            "النسبة المئوية": {current:["لا أعرفها","أحسب نسباً بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان النسب المئوية","حل مسائل حياتية","زيادة السرعة","أخرى"], commitment:["حل مسائل","تدريب يومي","اختبار","مراجعة","أخرى"]},
            "التقدير والتقريب": {current:["لا أعرف التقدير والتقريب","أقرب أعداداً بسيطة","أستخدم التقدير في الحل","أحل مسائل متنوعة","أخرى"], target:["إتقان التقريب","تحسين التقدير الذهني","حل مسائل بسرعة أكبر","أخرى"], commitment:["تدريب يومي","10 مسائل","اختبار سريع","مراجعة الأخطاء","أخرى"]},
            "الوحدات والتحويلات": {current:["لا أعرف التحويلات","أحول وحدات بسيطة","أحل مسائل قياس","أحل مسائل متنوعة","أخرى"], target:["فهم الوحدات","إتقان التحويلات","حل مسائل تطبيقية","أخرى"], commitment:["10 مسائل","ورقة تدريب","تطبيق عملي","اختبار قصير","أخرى"]},
            "القياس": {current:["لا أعرف أساسيات القياس","أقيس أطوالاً بسيطة","أتعامل مع وحدات مختلفة","أحل مسائل متنوعة","أخرى"], target:["فهم القياس","إتقان استخدام الوحدات","حل مسائل تطبيقية","أخرى"], commitment:["تطبيق عملي","10 مسائل","ورقة تدريب","مراجعة","أخرى"]},
            "المحيط": {current:["لا أعرف المحيط","أحسب محيط أشكال بسيطة","أحل مسائل متنوعة","أخرى"], target:["فهم المحيط","إتقان حساب المحيط","حل مسائل تطبيقية","أخرى"], commitment:["10 مسائل","ورقة تدريب","اختبار قصير","مراجعة","أخرى"]},
            "المساحة": {current:["لا أعرف المساحة","أحسب مساحات بسيطة","أستخدم القوانين","أحل مسائل متنوعة","أخرى"], target:["فهم المساحة","إتقان القوانين","حل مسائل تطبيقية","أخرى"], commitment:["10 مسائل","مراجعة القوانين","ورقة تدريب","اختبار قصير","أخرى"]},
            "الحجم": {current:["لا أعرف الحجم","أحسب أحجاماً بسيطة","أستخدم القوانين","أحل مسائل متنوعة","أخرى"], target:["فهم الحجم","إتقان القوانين","حل مسائل تطبيقية","أخرى"], commitment:["10 مسائل","مراجعة القوانين","ورقة تدريب","اختبار قصير","أخرى"]},
            "المسائل اللفظية": {current:["أواجه صعوبة","أفهم السؤال","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["تحليل السؤال","اختيار الطريقة","حل مسائل معقدة","أخرى"], commitment:["5 مسائل","10 مسائل","ورقة تدريب","مراجعة الأخطاء","أخرى"]},
            "الحساب الذهني": {current:["مبتدئ","أحسب ببطء","أحسب بسرعة جيدة","أحسب بسرعة عالية","أخرى"], target:["زيادة السرعة","تقليل الأخطاء","إتقان الحساب الذهني","أخرى"], commitment:["5 دقائق","10 دقائق","15 دقيقة","تحديات يومية","أخرى"]},
            "المراجعة الشاملة": {current:["أحتاج مراجعة","راجعت جزءاً بسيطاً","أراجع بانتظام","أحل مسائل متنوعة","أخرى"], target:["إكمال المراجعة","تقوية نقاط الضعف","جاهزية كاملة","إتقان الحساب الأساسي","أخرى"], commitment:["مراجعة يومية","مراجعة أسبوعية","حل نماذج","تحليل الأخطاء","أخرى"]},
            "اختبار قصير": {current:["أحتاج مراجعة","أحل اختبارات قصيرة","أحل اختبارات كاملة","أخرى"], target:["اجتياز الاختبار","تحسين الدرجة","تقليل الأخطاء","إتقان الحساب الأساسي","أخرى"], commitment:["اختبار أسبوعي","اختبار تجريبي","تحليل الأخطاء","مراجعة نقاط الضعف","أخرى"]},
            "اختبار تجريبي": {current:["أحتاج مراجعة","أحل اختبارات قصيرة","أحل اختبارات كاملة","أخرى"], target:["اجتياز الاختبار","تحسين الدرجة","تقليل الأخطاء","إتقان الحساب الأساسي","أخرى"], commitment:["اختبار أسبوعي","اختبار تجريبي","تحليل الأخطاء","مراجعة نقاط الضعف","أخرى"]},
            "العبارات الجبرية": {current:["لا أعرف العبارات الجبرية","أميز الحدود","أبسط العبارات","أحل مسائل متنوعة","أخرى"], target:["فهم العبارات","تبسيطها","حل المسائل","إتقان المهارة","أخرى"], commitment:["10 تدريبات","20 تدريباً","ورقة عمل","اختبار","مراجعة","أخرى"]},
            "تبسيط العبارات": {current:["لا أعرف تبسيط العبارات","أبسط عبارات بسيطة","أجمع الحدود المتشابهة","أحل مسائل متنوعة","أخرى"], target:["فهم التبسيط","تبسيط العبارات بدقة","تقليل الأخطاء","إتقان المهارة","أخرى"], commitment:["10 تدريبات","20 تدريباً","ورقة عمل","اختبار","مراجعة","أخرى"]},
            "كثيرات الحدود": {current:["لا أعرفها","أجمع وأطرح","أضرب كثيرات الحدود","أقسم كثيرات الحدود","أخرى"], target:["إتقان العمليات","حل مسائل متنوعة","تحليل الحدود","أخرى"], commitment:["10 مسائل","20 مسألة","حل تدريبات","اختبار","أخرى"]},
            "جمع كثيرات الحدود": {current:["لا أعرف جمع كثيرات الحدود","أجمع حدوداً بسيطة","أجمع كثيرات حدود متعددة","أحل مسائل متنوعة","أخرى"], target:["إتقان الجمع","ترتيب الحدود","تقليل الأخطاء","حل مسائل متنوعة","أخرى"], commitment:["10 مسائل","20 مسألة","حل تدريبات","اختبار","أخرى"]},
            "طرح كثيرات الحدود": {current:["لا أعرف طرح كثيرات الحدود","أطرح حدوداً بسيطة","أطرح كثيرات حدود متعددة","أحل مسائل متنوعة","أخرى"], target:["إتقان الطرح","تبسيط الناتج","تقليل الأخطاء","حل مسائل متنوعة","أخرى"], commitment:["10 مسائل","20 مسألة","حل تدريبات","اختبار","أخرى"]},
            "ضرب كثيرات الحدود": {current:["لا أعرف ضرب كثيرات الحدود","أضرب حدوداً بسيطة","أستخدم التوزيع","أحل مسائل متنوعة","أخرى"], target:["إتقان الضرب","استخدام التوزيع بدقة","حل مسائل متنوعة","أخرى"], commitment:["10 مسائل","20 مسألة","حل تدريبات","اختبار","أخرى"]},
            "قسمة كثيرات الحدود": {current:["لا أعرف قسمة كثيرات الحدود","أقسم حالات بسيطة","أستخدم القسمة المطولة","أحل مسائل متنوعة","أخرى"], target:["إتقان القسمة","تبسيط الناتج","حل مسائل متنوعة","أخرى"], commitment:["10 مسائل","20 مسألة","حل تدريبات","اختبار","أخرى"]},
            "التحليل": {current:["لا أعرف التحليل","أحل العامل المشترك","أحل الفرق بين مربعين","أحل ثلاثيات الحدود","أخرى"], target:["إتقان التحليل","اختيار الطريقة المناسبة","حل مسائل متنوعة","أخرى"], commitment:["حل تدريبات","ورقة عمل","اختبار","مراجعة","أخرى"]},
            "تحليل العبارات الجبرية": {current:["لا أعرف التحليل","أتعرف على العوامل","أحل حالات بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان التحليل","اختيار الطريقة المناسبة","حل مسائل متنوعة","أخرى"], commitment:["حل تدريبات","ورقة عمل","اختبار","مراجعة","أخرى"]},
            "العامل المشترك": {current:["لا أعرف العامل المشترك","أستخرج عاملاً بسيطاً","أحل مسائل متوسطة","أخرى"], target:["إتقان العامل المشترك","تحليل العبارات بدقة","حل مسائل متنوعة","أخرى"], commitment:["حل تدريبات","ورقة عمل","اختبار","مراجعة","أخرى"]},
            "تحليل الفرق بين مربعين": {current:["لا أعرف القاعدة","أتعرف على الفرق بين مربعين","أحل مسائل بسيطة","أخرى"], target:["إتقان القاعدة","اختيارها في الوقت المناسب","حل مسائل متنوعة","أخرى"], commitment:["حل تدريبات","ورقة عمل","اختبار","مراجعة","أخرى"]},
            "تحليل ثلاثي الحدود": {current:["لا أعرف ثلاثي الحدود","أحل حالات بسيطة","أحل مسائل متوسطة","أخرى"], target:["إتقان تحليل ثلاثي الحدود","اختيار الطريقة المناسبة","حل مسائل متنوعة","أخرى"], commitment:["حل تدريبات","ورقة عمل","اختبار","مراجعة","أخرى"]},
            "المعادلات الخطية": {current:["لا أعرف المعادلات","أحل معادلات بسيطة","أحل معادلات متعددة الخطوات","أخرى"], target:["إتقان الحل","زيادة السرعة","حل المسائل التطبيقية","أخرى"], commitment:["10 معادلات","20 معادلة","ورقة تدريب","اختبار","أخرى"]},
            "المعادلات متعددة الخطوات": {current:["أحل معادلات بسيطة فقط","أتعامل مع أكثر من خطوة","أحل مسائل متنوعة","أخرى"], target:["إتقان المعادلات متعددة الخطوات","تنظيم خطوات الحل","تقليل الأخطاء","أخرى"], commitment:["10 معادلات","20 معادلة","ورقة تدريب","اختبار","أخرى"]},
            "المعادلات ذات الكسور": {current:["لا أعرف حلها","أزيل المقامات أحياناً","أحل مسائل متوسطة","أخرى"], target:["إتقان حل المعادلات ذات الكسور","اختيار الخطوات الصحيحة","حل مسائل متنوعة","أخرى"], commitment:["10 معادلات","ورقة تدريب","اختبار","مراجعة","أخرى"]},
            "المعادلات التربيعية": {current:["لا أعرفها","أستخدم التحليل","أستخدم القانون العام","أستخدم إكمال المربع","أخرى"], target:["اختيار أفضل طريقة","حل مسائل متنوعة","إتقان المعادلات التربيعية","أخرى"], commitment:["10 مسائل","حل تدريبات","اختبار","مراجعة","أخرى"]},
            "القانون العام": {current:["لا أعرف القانون العام","أطبقه بمساعدة","أحل به مسائل بسيطة","أخرى"], target:["إتقان القانون العام","تحديد المعاملات بدقة","حل مسائل متنوعة","أخرى"], commitment:["10 مسائل","حل تدريبات","اختبار","مراجعة","أخرى"]},
            "إكمال المربع": {current:["لا أعرف الطريقة","أفهم الفكرة جزئياً","أحل حالات بسيطة","أخرى"], target:["إتقان إكمال المربع","تحويل المعادلات بدقة","حل مسائل متنوعة","أخرى"], commitment:["10 مسائل","حل تدريبات","اختبار","مراجعة","أخرى"]},
            "المتباينات": {current:["لا أعرفها","أحل متباينات بسيطة","أحل متباينات مركبة","أخرى"], target:["إتقان المتباينات","تمثيل الحل","حل مسائل متنوعة","أخرى"], commitment:["حل مسائل","ورقة تدريب","اختبار","أخرى"]},
            "أنظمة المعادلات": {current:["لا أعرفها","أستخدم التعويض","أستخدم الحذف","أحل بيانياً","أخرى"], target:["اختيار الطريقة المناسبة","حل مسائل متنوعة","إتقان الأنظمة","أخرى"], commitment:["10 مسائل","20 مسألة","اختبار","مراجعة","أخرى"]},
            "حل المعادلات بيانياً": {current:["أواجه صعوبة في الرسم","أقرأ الرسم فقط","أحل حالات بسيطة بيانياً","أخرى"], target:["فهم الحل البياني","تحليل نقطة التقاطع","حل مسائل متنوعة","أخرى"], commitment:["رسم يومي","حل مسائل","اختبار","مراجعة","أخرى"]},
            "حل المعادلات جبرياً": {current:["أحل مسائل بسيطة","أختار الطريقة بصعوبة","أحل مسائل متنوعة","أخرى"], target:["إتقان الحل الجبري","اختيار الطريقة المناسبة","تقليل الأخطاء","أخرى"], commitment:["10 مسائل","20 مسألة","اختبار","مراجعة","أخرى"]},
            "الدوال": {current:["لا أعرف الدوال","أفهم المفهوم","أرسم الدوال","أحل مسائل متنوعة","أخرى"], target:["إتقان الدوال","تحليل الرسوم البيانية","حل المسائل","أخرى"], commitment:["حل تدريبات","رسم دوال","اختبار","مراجعة","أخرى"]},
            "الاقترانات": {current:["لا أعرف الاقترانات","أفهم المفهوم","أميز أنواعاً بسيطة","أخرى"], target:["فهم الاقترانات","تحليلها","حل مسائل متنوعة","أخرى"], commitment:["حل تدريبات","رسم دوال","اختبار","مراجعة","أخرى"]},
            "الدوال الخطية": {current:["لا أعرف الدوال الخطية","أفهم الميل جزئياً","أرسم دالة خطية","أخرى"], target:["إتقان الدوال الخطية","تحليل الميل والجزء المقطوع","حل مسائل تطبيقية","أخرى"], commitment:["حل تدريبات","رسم دوال","اختبار","مراجعة","أخرى"]},
            "الدوال التربيعية": {current:["لا أعرف الدوال التربيعية","أميز شكلها","أرسمها بمساعدة","أخرى"], target:["إتقان الدوال التربيعية","تحليل الرأس والمحور","حل مسائل متنوعة","أخرى"], commitment:["حل تدريبات","رسم دوال","اختبار","مراجعة","أخرى"]},
            "الدوال الأسية": {current:["لا أعرف الدوال الأسية","أفهم النمو والتناقص","أحل مسائل بسيطة","أخرى"], target:["إتقان الدوال الأسية","تحليل سلوكها","حل مسائل تطبيقية","أخرى"], commitment:["حل تدريبات","رسم دوال","اختبار","مراجعة","أخرى"]},
            "الدوال اللوغاريتمية": {current:["لا أعرف الدوال اللوغاريتمية","أفهم العلاقة مع الأسية","أحل مسائل بسيطة","أخرى"], target:["إتقان الدوال اللوغاريتمية","تحليل سلوكها","حل مسائل متنوعة","أخرى"], commitment:["حل تدريبات","رسم دوال","اختبار","مراجعة","أخرى"]},
            "رسم الدوال": {current:["أواجه صعوبة","أرسم الدوال البسيطة","أرسم الدوال المختلفة","أخرى"], target:["تحليل الرسوم","إتقان الرسم","حل المسائل","أخرى"], commitment:["رسم يومي","حل مسائل","اختبار","مراجعة","أخرى"]},
            "تحويلات الدوال": {current:["لا أعرف التحويلات","أميز الإزاحة فقط","أحل مسائل بسيطة","أخرى"], target:["فهم التحويلات","تطبيق الإزاحة والتمدد والانعكاس","تحليل الرسوم بدقة","أخرى"], commitment:["رسم يومي","حل مسائل","اختبار","مراجعة","أخرى"]},
            "حل المسائل اللفظية": {current:["أواجه صعوبة","أفهم المطلوب","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["تحليل المسألة","اختيار القانون المناسب","حل مسائل معقدة","أخرى"], commitment:["5 مسائل","10 مسائل","تحليل الأخطاء","اختبار","أخرى"]},
            "المراجعة الشاملة": {current:["أحتاج مراجعة","راجعت جزءاً بسيطاً","أراجع بانتظام","أحل مسائل متنوعة","أخرى"], target:["إكمال المراجعة","تقوية نقاط الضعف","جاهزية كاملة","إتقان الجبر","أخرى"], commitment:["مراجعة يومية","مراجعة أسبوعية","حل نماذج","تحليل الأخطاء","أخرى"]},
            "اختبار قصير": {current:["أحتاج مراجعة","أحل اختبارات قصيرة","أحل اختبارات كاملة","أخرى"], target:["تحسين الدرجة","اجتياز الاختبارات","تقليل الأخطاء","إتقان الجبر","أخرى"], commitment:["اختبار أسبوعي","اختبار تجريبي","تحليل الأخطاء","مراجعة نقاط الضعف","أخرى"]},
            "اختبار تجريبي": {current:["أحتاج مراجعة","أحل اختبارات قصيرة","أحل اختبارات كاملة","أخرى"], target:["تحسين الدرجة","اجتياز الاختبارات","تقليل الأخطاء","إتقان الجبر","أخرى"], commitment:["اختبار أسبوعي","اختبار تجريبي","تحليل الأخطاء","مراجعة نقاط الضعف","أخرى"]},
            "المفاهيم الهندسية الأساسية": {current:["لا أعرف المفاهيم الهندسية","أميز الأشكال البسيطة","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["فهم المفاهيم الهندسية","تمييز العناصر الهندسية","حل مسائل متنوعة","بناء أساس هندسي قوي","أخرى"], commitment:["10 تدريبات","20 تدريباً","ورقة عمل","اختبار","مراجعة","أخرى"]},
            "النقاط والمستقيمات": {current:["لا أعرف النقاط والمستقيمات","أميز النقطة والمستقيم","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["فهم النقاط والمستقيمات","إتقان العلاقات الأساسية","حل مسائل متنوعة","أخرى"], commitment:["10 تدريبات","20 تدريباً","ورقة عمل","اختبار","مراجعة","أخرى"]},
            "الزوايا": {current:["لا أعرف الزوايا","أميز أنواع الزوايا","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["فهم الزوايا","إتقان العلاقات","حل مسائل متنوعة","أخرى"], commitment:["10 تدريبات","20 تدريباً","ورقة عمل","اختبار","مراجعة","أخرى"]},
            "المثلثات": {current:["لا أعرف خصائص المثلثات","أعرف الأنواع","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["فهم خصائص المثلثات","إتقان الحل","حل المسائل التطبيقية","أخرى"], commitment:["10 مسائل","20 مسألة","اختبار","مراجعة","أخرى"]},
            "تطابق المثلثات": {current:["لا أعرف التطابق","أعرف الحالات","أطبق القوانين","أخرى"], target:["إتقان التطابق","حل البراهين","حل المسائل","أخرى"], commitment:["حل تدريبات","ورقة عمل","اختبار","أخرى"]},
            "تشابه المثلثات": {current:["لا أعرف التشابه","أعرف النسب","أحل مسائل متنوعة","أخرى"], target:["إتقان التشابه","حل مسائل متقدمة","تطبيق التشابه","أخرى"], commitment:["حل مسائل","اختبار","مراجعة","أخرى"]},
            "نظرية فيثاغورس": {current:["لا أعرف النظرية","أطبق القانون","أحل مسائل متنوعة","أخرى"], target:["إتقان النظرية","حل المسائل التطبيقية","استخدام النظرية في الهندسة","أخرى"], commitment:["10 مسائل","20 مسألة","اختبار","أخرى"]},
            "الأشكال الرباعية": {current:["أميز الأشكال","أعرف الخصائص","أحل مسائل متنوعة","أخرى"], target:["إتقان الخصائص","حل المسائل","تطبيق المفاهيم","أخرى"], commitment:["حل تدريبات","اختبار","مراجعة","أخرى"]},
            "المضلعات": {current:["أميز بعض المضلعات","أعرف الخصائص الأساسية","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["فهم خصائص المضلعات","إتقان الزوايا والمساحات","حل مسائل متنوعة","أخرى"], commitment:["حل تدريبات","اختبار","مراجعة","أخرى"]},
            "الدوائر": {current:["لا أعرف خصائص الدائرة","أعرف الأجزاء","أحل مسائل بسيطة","أخرى"], target:["إتقان الدائرة","حل المسائل","إتقان العلاقات","أخرى"], commitment:["10 مسائل","حل تدريبات","اختبار","أخرى"]},
            "الأقواس والزوايا المركزية": {current:["لا أعرف الأقواس والزوايا المركزية","أميزها في الدائرة","أحل مسائل بسيطة","أخرى"], target:["فهم العلاقات في الدائرة","حل مسائل الأقواس","إتقان الزوايا المركزية","أخرى"], commitment:["10 مسائل","حل تدريبات","اختبار","مراجعة","أخرى"]},
            "المماس والوتر": {current:["لا أعرف المماس والوتر","أميزهما في الدائرة","أحل مسائل بسيطة","أخرى"], target:["فهم علاقات المماس والوتر","حل مسائل الدائرة","إتقان العلاقات","أخرى"], commitment:["10 مسائل","حل تدريبات","اختبار","مراجعة","أخرى"]},
            "المحيط": {current:["لا أعرف القوانين","أعرف بعض القوانين","أطبق القوانين","أخرى"], target:["إتقان القوانين","حل المسائل التطبيقية","زيادة السرعة","أخرى"], commitment:["حل مسائل","ورقة تدريب","اختبار","أخرى"]},
            "المساحة": {current:["لا أعرف القوانين","أعرف بعض القوانين","أطبق القوانين","أخرى"], target:["إتقان القوانين","حل المسائل التطبيقية","زيادة السرعة","أخرى"], commitment:["حل مسائل","ورقة تدريب","اختبار","أخرى"]},
            "الحجوم": {current:["لا أعرف قوانين الحجوم","أعرف بعض القوانين","أطبق القوانين","أحل مسائل متنوعة","أخرى"], target:["إتقان قوانين الحجوم","حل المسائل التطبيقية","تطبيق القوانين بدقة","أخرى"], commitment:["10 مسائل","حل تدريبات","اختبار","مراجعة","أخرى"]},
            "المجسمات الهندسية": {current:["أعرف الأشكال","أحسب الحجوم","أحسب المساحات","أخرى"], target:["إتقان المجسمات","حل المسائل","تطبيق القوانين","أخرى"], commitment:["10 مسائل","حل تدريبات","اختبار","أخرى"]},
            "المنشورات": {current:["أميز المنشورات","أحسب حجماً بسيطاً","أحل مسائل متنوعة","أخرى"], target:["إتقان المنشورات","حساب المساحة والحجم","حل مسائل تطبيقية","أخرى"], commitment:["10 مسائل","حل تدريبات","اختبار","مراجعة","أخرى"]},
            "الأسطوانات": {current:["أميز الأسطوانة","أعرف بعض القوانين","أحل مسائل بسيطة","أخرى"], target:["إتقان الأسطوانات","حساب المساحة والحجم","حل مسائل تطبيقية","أخرى"], commitment:["10 مسائل","حل تدريبات","اختبار","مراجعة","أخرى"]},
            "المخاريط": {current:["أميز المخروط","أعرف بعض القوانين","أحل مسائل بسيطة","أخرى"], target:["إتقان المخاريط","حساب المساحة والحجم","حل مسائل تطبيقية","أخرى"], commitment:["10 مسائل","حل تدريبات","اختبار","مراجعة","أخرى"]},
            "الكرات": {current:["أميز الكرة","أعرف بعض القوانين","أحل مسائل بسيطة","أخرى"], target:["إتقان الكرات","حساب المساحة والحجم","حل مسائل تطبيقية","أخرى"], commitment:["10 مسائل","حل تدريبات","اختبار","مراجعة","أخرى"]},
            "البرهان الهندسي": {current:["أواجه صعوبة","أفهم خطوات البرهان","أكتب براهين بسيطة","أخرى"], target:["إتقان البرهان","تحليل المسائل","كتابة البراهين","أخرى"], commitment:["حل برهان","تحليل مسألة","ورقة تدريب","اختبار","أخرى"]},
            "الإنشاءات الهندسية": {current:["لا أعرف الإنشاءات الهندسية","أنفذ إنشاءات بسيطة","أستخدم الأدوات بدقة","أخرى"], target:["إتقان الإنشاءات","الرسم بدقة","حل مسائل إنشائية","أخرى"], commitment:["رسم يومي","تطبيق عملي","ورقة تدريب","اختبار","أخرى"]},
            "الهندسة الإحداثية": {current:["لا أعرفها","أحسب المسافات","أحسب الميل","أكتب معادلات المستقيم","أخرى"], target:["إتقان الهندسة الإحداثية","حل المسائل","تطبيق القوانين","أخرى"], commitment:["10 مسائل","حل تدريبات","اختبار","مراجعة","أخرى"]},
            "المسافة بين نقطتين": {current:["لا أعرف القانون","أطبقه بمساعدة","أحل مسائل بسيطة","أخرى"], target:["إتقان قانون المسافة","حل مسائل متنوعة","تطبيقه في الهندسة الإحداثية","أخرى"], commitment:["10 مسائل","حل تدريبات","اختبار","مراجعة","أخرى"]},
            "منتصف القطعة المستقيمة": {current:["لا أعرف القانون","أحسب المنتصف بمساعدة","أحل مسائل بسيطة","أخرى"], target:["إتقان قانون المنتصف","حل مسائل متنوعة","تطبيقه في الهندسة الإحداثية","أخرى"], commitment:["10 مسائل","حل تدريبات","اختبار","مراجعة","أخرى"]},
            "ميل المستقيم": {current:["لا أعرف الميل","أحسب الميل بمساعدة","أحل مسائل متنوعة","أخرى"], target:["إتقان الميل","تحليل المستقيمات","حل مسائل تطبيقية","أخرى"], commitment:["10 مسائل","حل تدريبات","اختبار","مراجعة","أخرى"]},
            "معادلة المستقيم": {current:["لا أعرف معادلة المستقيم","أكتبها بمساعدة","أحل مسائل بسيطة","أخرى"], target:["إتقان معادلة المستقيم","اختيار الصورة المناسبة","حل مسائل متنوعة","أخرى"], commitment:["10 مسائل","حل تدريبات","اختبار","مراجعة","أخرى"]},
            "الهندسة التحويلية": {current:["لا أعرفها","أعرف الانعكاس","أعرف الانسحاب","أعرف الدوران","أخرى"], target:["إتقان التحويلات","حل المسائل","الرسم الصحيح","أخرى"], commitment:["حل تدريبات","اختبار","مراجعة","أخرى"]},
            "الانعكاس": {current:["لا أعرف الانعكاس","أرسم انعكاساً بسيطاً","أحل مسائل متنوعة","أخرى"], target:["إتقان الانعكاس","الرسم الصحيح","حل مسائل التحويلات","أخرى"], commitment:["رسم يومي","حل تدريبات","اختبار","مراجعة","أخرى"]},
            "الانسحاب": {current:["لا أعرف الانسحاب","أرسم انسحاباً بسيطاً","أحل مسائل متنوعة","أخرى"], target:["إتقان الانسحاب","الرسم الصحيح","حل مسائل التحويلات","أخرى"], commitment:["رسم يومي","حل تدريبات","اختبار","مراجعة","أخرى"]},
            "الدوران": {current:["لا أعرف الدوران","أرسم دوراناً بسيطاً","أحل مسائل متنوعة","أخرى"], target:["إتقان الدوران","الرسم الصحيح","حل مسائل التحويلات","أخرى"], commitment:["رسم يومي","حل تدريبات","اختبار","مراجعة","أخرى"]},
            "التكبير والتصغير": {current:["لا أعرف التكبير والتصغير","أطبق معامل قياس بسيط","أحل مسائل متنوعة","أخرى"], target:["إتقان التكبير والتصغير","فهم معامل القياس","حل مسائل التحويلات","أخرى"], commitment:["رسم يومي","حل تدريبات","اختبار","مراجعة","أخرى"]},
            "حل المسائل الهندسية": {current:["أواجه صعوبة","أفهم المطلوب","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["تحليل المسألة","اختيار القانون المناسب","حل مسائل معقدة","أخرى"], commitment:["5 مسائل","10 مسائل","تحليل الأخطاء","اختبار","أخرى"]},
            "المراجعة الشاملة": {current:["أحتاج مراجعة","راجعت جزءاً بسيطاً","أراجع بانتظام","أحل مسائل متنوعة","أخرى"], target:["إكمال المراجعة","تقوية نقاط الضعف","جاهزية كاملة","إتقان الهندسة","أخرى"], commitment:["مراجعة يومية","مراجعة أسبوعية","حل نماذج","تحليل الأخطاء","أخرى"]},
            "اختبار قصير": {current:["أحتاج مراجعة","أحل اختبارات قصيرة","أحل اختبارات كاملة","أخرى"], target:["تحسين الدرجة","اجتياز الاختبارات","تقليل الأخطاء","إتقان الهندسة","أخرى"], commitment:["اختبار أسبوعي","اختبار تجريبي","تحليل الأخطاء","مراجعة نقاط الضعف","أخرى"]},
            "مقدمة حساب المثلثات": {current:["لا أعرف حساب المثلثات","أعرف بعض المفاهيم","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["فهم أساس حساب المثلثات","ربط الزوايا بالمثلثات","الاستعداد للمسارات المتقدمة","أخرى"], commitment:["درس يومي","10 تدريبات","مراجعة أسبوعية","اختبار ذاتي","أخرى"]},
            "قياس الزوايا": {current:["لا أعرف قياس الزوايا","أقيس زوايا بسيطة","أحول بين القياسات","أحل مسائل متنوعة","أخرى"], target:["إتقان قياس الزوايا","إتقان التحويل بين الدرجات والراديان","حل المسائل بدقة","أخرى"], commitment:["10 مسائل","20 مسألة","اختبار","مراجعة","أخرى"]},
            "الدرجات والراديان": {current:["لا أعرف الراديان","أحول بمساعدة","أحول بين الدرجات والراديان","أحل مسائل متنوعة","أخرى"], target:["فهم الدرجات والراديان","إتقان التحويل","استخدامهما في الدوال المثلثية","أخرى"], commitment:["10 مسائل","20 مسألة","مراجعة القوانين","اختبار","أخرى"]},
            "الأقواس": {current:["لا أعرف مفهوم الأقواس","أحسب أطوالاً بسيطة","أربط الأقواس بالزوايا","أحل مسائل متنوعة","أخرى"], target:["فهم الأقواس","حل مسائل الأطوال والزوايا","تطبيق المفاهيم في الدائرة","أخرى"], commitment:["10 مسائل","حل تدريبات","اختبار","مراجعة","أخرى"]},
            "النسب المثلثية": {current:["لا أعرف النسب","أعرف بعض النسب","أحسب القيم","أحل مسائل متنوعة","أخرى"], target:["فهم النسب","إتقان الحساب","حل المسائل","تطبيق المفاهيم","أخرى"], commitment:["10 تدريبات","20 تدريباً","ورقة عمل","اختبار","مراجعة","أخرى"]},
            "جيب الزاوية": {current:["لا أعرف جيب الزاوية","أحسب قيماً بسيطة","أستخدمه في المثلثات","أحل مسائل متنوعة","أخرى"], target:["فهم جيب الزاوية","إتقان حسابه","تطبيقه في حل المثلثات","أخرى"], commitment:["10 تدريبات","20 تدريباً","ورقة عمل","اختبار","مراجعة","أخرى"]},
            "جيب التمام": {current:["لا أعرف جيب التمام","أحسب قيماً بسيطة","أستخدمه في المثلثات","أحل مسائل متنوعة","أخرى"], target:["فهم جيب التمام","إتقان حسابه","تطبيقه في حل المثلثات","أخرى"], commitment:["10 تدريبات","20 تدريباً","ورقة عمل","اختبار","مراجعة","أخرى"]},
            "الظل": {current:["لا أعرف الظل","أحسب قيماً بسيطة","أستخدمه في المثلثات","أحل مسائل متنوعة","أخرى"], target:["فهم الظل","إتقان حسابه","تطبيقه في المسائل العملية","أخرى"], commitment:["10 تدريبات","20 تدريباً","ورقة عمل","اختبار","مراجعة","أخرى"]},
            "ظل التمام": {current:["لا أعرف ظل التمام","أحسب قيماً بسيطة","أستخدمه في الحل","أحل مسائل متنوعة","أخرى"], target:["فهم ظل التمام","إتقان استخدامه","حل مسائل متنوعة","أخرى"], commitment:["10 تدريبات","حل مسائل","اختبار","مراجعة","أخرى"]},
            "القاطع": {current:["لا أعرف القاطع","أحسب قيماً بسيطة","أستخدمه في الحل","أحل مسائل متنوعة","أخرى"], target:["فهم القاطع","إتقان استخدامه","حل مسائل متنوعة","أخرى"], commitment:["10 تدريبات","حل مسائل","اختبار","مراجعة","أخرى"]},
            "قاطع التمام": {current:["لا أعرف قاطع التمام","أحسب قيماً بسيطة","أستخدمه في الحل","أحل مسائل متنوعة","أخرى"], target:["فهم قاطع التمام","إتقان استخدامه","حل مسائل متنوعة","أخرى"], commitment:["10 تدريبات","حل مسائل","اختبار","مراجعة","أخرى"]},
            "الزوايا الخاصة": {current:["لا أحفظ الزوايا الخاصة","أعرف بعضها","أحسب قيمها","أستخدمها في الحل","أخرى"], target:["حفظ القيم الأساسية","استخدام الزوايا الخاصة بسرعة","حل مسائل متنوعة","أخرى"], commitment:["مراجعة يومية","10 تدريبات","اختبار سريع","مراجعة أسبوعية","أخرى"]},
            "الدائرة المثلثية": {current:["لا أعرفها","أعرف المفهوم","أحدد الإحداثيات","أستخدمها في الحل","أخرى"], target:["إتقان الدائرة","حفظ القيم","حل المسائل","أخرى"], commitment:["رسم الدائرة","حل تدريبات","اختبار","مراجعة","أخرى"]},
            "إحداثيات الدائرة المثلثية": {current:["لا أعرف الإحداثيات","أحدد بعض النقاط","أستخدم الإحداثيات في الحل","أحل مسائل متنوعة","أخرى"], target:["إتقان الإحداثيات","ربط الإحداثيات بالنسب","حل مسائل الدائرة المثلثية","أخرى"], commitment:["رسم يومي","حل تدريبات","اختبار","مراجعة","أخرى"]},
            "إشارات النسب المثلثية": {current:["لا أعرف الإشارات","أعرف بعض الأرباع","أحدد الإشارات","أحل مسائل متنوعة","أخرى"], target:["إتقان إشارات النسب","تحليل الأرباع","تقليل الأخطاء","أخرى"], commitment:["10 تدريبات","رسم الدائرة","اختبار","مراجعة","أخرى"]},
            "اختزال الزوايا": {current:["لا أعرف الاختزال","أختزل زوايا بسيطة","أستخدم الدائرة المثلثية","أحل مسائل متنوعة","أخرى"], target:["إتقان اختزال الزوايا","تبسيط المسائل","حل مسائل متقدمة","أخرى"], commitment:["10 مسائل","حل تدريبات","اختبار","مراجعة","أخرى"]},
            "الهويات المثلثية": {current:["لا أعرف الهويات","أعرف الهويات الأساسية","أطبق الهويات","أثبت العلاقات","أخرى"], target:["إتقان الهويات","تبسيط التعابير","إثبات العلاقات","حل المسائل","أخرى"], commitment:["حل تدريبات","مراجعة القوانين","اختبار","ورقة عمل","أخرى"]},
            "الهويات الأساسية": {current:["لا أعرف الهويات الأساسية","أعرف بعضها","أطبقها في التبسيط","أثبت علاقات بسيطة","أخرى"], target:["حفظ الهويات الأساسية","استخدامها بدقة","إثبات علاقات متنوعة","أخرى"], commitment:["مراجعة القوانين","10 تدريبات","اختبار","ورقة عمل","أخرى"]},
            "هويات المجموع والفرق": {current:["لا أعرف هذه الهويات","أطبقها بمساعدة","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان هويات المجموع والفرق","تبسيط التعابير","حل مسائل متقدمة","أخرى"], commitment:["حل تدريبات","مراجعة القوانين","اختبار","ورقة عمل","أخرى"]},
            "هويات الزاوية المضاعفة": {current:["لا أعرف هذه الهويات","أطبقها بمساعدة","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان هويات الزاوية المضاعفة","تبسيط التعابير","حل مسائل متنوعة","أخرى"], commitment:["حل تدريبات","مراجعة القوانين","اختبار","ورقة عمل","أخرى"]},
            "هويات نصف الزاوية": {current:["لا أعرف هذه الهويات","أطبقها بمساعدة","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان هويات نصف الزاوية","تبسيط التعابير","حل مسائل متنوعة","أخرى"], commitment:["حل تدريبات","مراجعة القوانين","اختبار","ورقة عمل","أخرى"]},
            "تحويل الجداء إلى مجموع": {current:["لا أعرف التحويل","أطبقه بمساعدة","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان التحويل","تبسيط التعابير","حل مسائل متقدمة","أخرى"], commitment:["حل تدريبات","مراجعة القوانين","اختبار","ورقة عمل","أخرى"]},
            "تحويل المجموع إلى جداء": {current:["لا أعرف التحويل","أطبقه بمساعدة","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان التحويل","تبسيط التعابير","حل مسائل متقدمة","أخرى"], commitment:["حل تدريبات","مراجعة القوانين","اختبار","ورقة عمل","أخرى"]},
            "قوانين الجيب": {current:["لا أعرف القوانين","أطبق قانون الجيب","أحل مسائل متنوعة","أخرى"], target:["إتقان قانون الجيب","اختيار القانون المناسب","حل المسائل التطبيقية","أخرى"], commitment:["10 مسائل","20 مسألة","اختبار","مراجعة","أخرى"]},
            "قوانين جيب التمام": {current:["لا أعرف القوانين","أطبق قانون جيب التمام","أحل مسائل متنوعة","أخرى"], target:["إتقان قانون جيب التمام","اختيار القانون المناسب","حل المسائل التطبيقية","أخرى"], commitment:["10 مسائل","20 مسألة","اختبار","مراجعة","أخرى"]},
            "حل المثلثات": {current:["لا أعرف الحل","أحل مثلثات قائمة","أحل مثلثات عامة","أخرى"], target:["إتقان الحل","حل المسائل التطبيقية","زيادة السرعة","أخرى"], commitment:["حل تدريبات","اختبار","مراجعة","أخرى"]},
            "المثلثات القائمة": {current:["لا أعرف المثلثات القائمة","أطبق النسب الأساسية","أحل مسائل متنوعة","أخرى"], target:["إتقان حل المثلثات القائمة","استخدام النسب المثلثية","حل مسائل تطبيقية","أخرى"], commitment:["10 مسائل","حل تدريبات","اختبار","مراجعة","أخرى"]},
            "المثلثات غير القائمة": {current:["لا أعرف المثلثات غير القائمة","أطبق بعض القوانين","أحل مسائل متنوعة","أخرى"], target:["إتقان المثلثات غير القائمة","اختيار القانون المناسب","حل مسائل تطبيقية","أخرى"], commitment:["10 مسائل","حل تدريبات","اختبار","مراجعة","أخرى"]},
            "المعادلات المثلثية": {current:["لا أعرفها","أحل معادلات بسيطة","أحل معادلات متنوعة","أخرى"], target:["إتقان المعادلات","حل مسائل متقدمة","تطبيق الهويات","أخرى"], commitment:["10 تدريبات","حل مسائل","اختبار","أخرى"]},
            "المتباينات المثلثية": {current:["لا أعرفها","أحل متباينات بسيطة","أحل متباينات متنوعة","أخرى"], target:["إتقان المتباينات المثلثية","تحليل الحلول على الدائرة","حل مسائل متنوعة","أخرى"], commitment:["10 تدريبات","حل مسائل","اختبار","مراجعة","أخرى"]},
            "الدوال المثلثية": {current:["لا أعرفها","أفهم المفهوم","أرسم الدوال","أحل مسائل متنوعة","أخرى"], target:["إتقان الدوال","تحليل الرسوم","حل المسائل","أخرى"], commitment:["رسم يومي","حل تدريبات","اختبار","مراجعة","أخرى"]},
            "رسم الدوال المثلثية": {current:["أواجه صعوبة في الرسم","أرسم دوال بسيطة","أحلل الرسوم","أخرى"], target:["إتقان الرسم","تحليل التحويلات","حل مسائل الرسوم","أخرى"], commitment:["رسم يومي","حل تدريبات","اختبار","مراجعة","أخرى"]},
            "تحويلات الدوال": {current:["لا أعرف التحويلات","أميز بعضها","أطبقها على الرسم","أحل مسائل متنوعة","أخرى"], target:["إتقان تحويلات الدوال","تحليل أثر التحويل","رسم الدوال بدقة","أخرى"], commitment:["رسم يومي","حل تدريبات","اختبار","مراجعة","أخرى"]},
            "الدوال العكسية": {current:["لا أعرف الدوال العكسية","أفهم المفهوم جزئياً","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["فهم الدوال العكسية","حل مسائل متنوعة","تطبيقها في حساب المثلثات","أخرى"], commitment:["10 تدريبات","حل مسائل","اختبار","مراجعة","أخرى"]},
            "التطبيقات العملية": {current:["أعرف بعض التطبيقات","أطبق القوانين","أحل مسائل حياتية","أخرى"], target:["تطبيق حساب المثلثات","حل مسائل في الفيزياء","حل مسائل هندسية","حل مسائل تطبيقية","أخرى"], commitment:["5 مسائل","10 مسائل","تطبيقات عملية","اختبار","أخرى"]},
            "حل المسائل اللفظية": {current:["أواجه صعوبة","أفهم المطلوب","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["تحليل المسألة","اختيار القانون المناسب","حل مسائل معقدة","أخرى"], commitment:["5 مسائل","10 مسائل","تحليل الأخطاء","اختبار","أخرى"]},
            "المراجعة الشاملة": {current:["أحتاج مراجعة","راجعت جزءاً بسيطاً","أراجع بانتظام","أحل مسائل متنوعة","أخرى"], target:["إكمال المراجعة","تقوية نقاط الضعف","جاهزية كاملة","إتقان حساب المثلثات","أخرى"], commitment:["مراجعة يومية","مراجعة أسبوعية","حل نماذج","تحليل الأخطاء","أخرى"]},
            "اختبار قصير": {current:["أحتاج مراجعة","أحل اختبارات قصيرة","أحل اختبارات كاملة","أخرى"], target:["تحسين الدرجة","اجتياز الاختبارات","تقليل الأخطاء","إتقان حساب المثلثات","أخرى"], commitment:["اختبار أسبوعي","اختبار تجريبي","تحليل الأخطاء","مراجعة نقاط الضعف","أخرى"]},
            "اختبار تجريبي": {current:["أحتاج مراجعة","أحل اختبارات قصيرة","أحل اختبارات كاملة","أخرى"], target:["تحسين الدرجة","اجتياز الاختبارات","تقليل الأخطاء","إتقان حساب المثلثات","أخرى"], commitment:["اختبار أسبوعي","اختبار تجريبي","تحليل الأخطاء","مراجعة نقاط الضعف","أخرى"]},
            "اختبار تجريبي": {current:["أحتاج مراجعة","أحل اختبارات قصيرة","أحل اختبارات كاملة","أخرى"], target:["تحسين الدرجة","اجتياز الاختبارات","تقليل الأخطاء","إتقان الهندسة","أخرى"], commitment:["اختبار أسبوعي","اختبار تجريبي","تحليل الأخطاء","مراجعة نقاط الضعف","أخرى"]},
            "ما قبل التفاضل::مراجعة الجبر": {current:["أحتاج مراجعة","أتذكر الأساسيات","أحل مسائل متنوعة","أخرى"], target:["تقوية الجبر","سد الفجوات","الاستعداد لما قبل التفاضل","أخرى"], commitment:["مراجعة يومية","حل 10 مسائل","تحليل الأخطاء","مراجعة أسبوعية","أخرى"]},
            "ما قبل التفاضل::مراجعة حساب المثلثات": {current:["أحتاج مراجعة","أعرف المفاهيم الأساسية","أحل مسائل متنوعة","أخرى"], target:["تقوية حساب المثلثات","إتقان القوانين الأساسية","الاستعداد للدوال المثلثية","أخرى"], commitment:["مراجعة القوانين","حل تدريبات","اختبار قصير","مراجعة أسبوعية","أخرى"]},
            "ما قبل التفاضل::الاقترانات": {current:["لا أعرف الاقترانات","أفهم المفهوم جزئياً","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["فهم الاقترانات","تحليل العلاقات","الاستعداد للتفاضل","أخرى"], commitment:["10 تدريبات","رسم دوال","اختبار","مراجعة","أخرى"]},
            "ما قبل التفاضل::مفهوم الدالة": {current:["لا أعرف مفهوم الدالة","أفهم المفهوم","أميز المدخلات والمخرجات","أحل مسائل متنوعة","أخرى"], target:["إتقان مفهوم الدالة","تمييز أنواع الدوال","حل مسائل متنوعة","أخرى"], commitment:["10 تدريبات","حل مسائل","رسم أمثلة","اختبار","أخرى"]},
            "ما قبل التفاضل::مجال الدالة": {current:["لا أعرف المجال","أحدد المجال أحياناً","أحدد المجال بدقة","أحل مسائل متنوعة","أخرى"], target:["إتقان مجال الدالة","تحديد القيود","حل مسائل متنوعة","أخرى"], commitment:["10 تدريبات","حل مسائل","مراجعة القواعد","اختبار","أخرى"]},
            "ما قبل التفاضل::مدى الدالة": {current:["لا أعرف المدى","أحدد المدى من الرسم","أحدد المدى جبرياً","أحل مسائل متنوعة","أخرى"], target:["إتقان مدى الدالة","تحليل الرسوم","حل مسائل متنوعة","أخرى"], commitment:["10 تدريبات","رسم دوال","اختبار","مراجعة","أخرى"]},
            "ما قبل التفاضل::أنواع الدوال": {current:["لا أعرف الأنواع","أميز بعض الأنواع","أتعامل مع أنواع متعددة","أخرى"], target:["تمييز أنواع الدوال","اختيار الطريقة المناسبة","حل مسائل متنوعة","أخرى"], commitment:["مراجعة يومية","تصنيف دوال","حل تدريبات","اختبار","أخرى"]},
            "ما قبل التفاضل::الدوال الخطية": {current:["لا أعرف الدوال الخطية","أفهم الميل والمقطع","أرسم الدوال الخطية","أحل مسائل متنوعة","أخرى"], target:["إتقان الدوال الخطية","تحليل الرسم","حل مسائل تطبيقية","أخرى"], commitment:["10 تدريبات","رسم دوال","اختبار","مراجعة","أخرى"]},
            "ما قبل التفاضل::الدوال التربيعية": {current:["لا أعرف الدوال التربيعية","أعرف الشكل العام","أرسم القطع المكافئ","أحل مسائل متنوعة","أخرى"], target:["إتقان الدوال التربيعية","تحليل الرأس والجذور","حل مسائل متنوعة","أخرى"], commitment:["10 تدريبات","رسم دوال","اختبار","مراجعة","أخرى"]},
            "ما قبل التفاضل::الدوال التكعيبية": {current:["لا أعرف الدوال التكعيبية","أميز شكلها","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["فهم الدوال التكعيبية","تحليل الرسم","حل مسائل متنوعة","أخرى"], commitment:["حل تدريبات","رسم بياني","اختبار","مراجعة","أخرى"]},
            "ما قبل التفاضل::الدوال كثيرة الحدود": {current:["لا أعرفها","أعرف أساسياتها","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان دوال كثيرة الحدود","تحليل الجذور والسلوك","حل مسائل متنوعة","أخرى"], commitment:["10 تدريبات","رسم دوال","اختبار","مراجعة","أخرى"]},
            "ما قبل التفاضل::الدوال الكسرية": {current:["لا أعرف الدوال الكسرية","أحدد القيود","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان الدوال الكسرية","تحليل المجال والخطوط المقاربة","حل مسائل متنوعة","أخرى"], commitment:["10 تدريبات","رسم دوال","اختبار","مراجعة","أخرى"]},
            "ما قبل التفاضل::الدوال الجذرية": {current:["لا أعرف الدوال الجذرية","أحدد المجال","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان الدوال الجذرية","تحليل الرسم","حل مسائل متنوعة","أخرى"], commitment:["حل تدريبات","رسم بياني","اختبار","مراجعة","أخرى"]},
            "ما قبل التفاضل::الدوال الأسية": {current:["لا أعرف الدوال الأسية","أفهم النمو الأسي","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان الدوال الأسية","حل مسائل النمو والتناقص","الاستعداد للتفاضل","أخرى"], commitment:["10 تدريبات","رسم دوال","اختبار","مراجعة","أخرى"]},
            "ما قبل التفاضل::الدوال اللوغاريتمية": {current:["لا أعرف اللوغاريتمات","أعرف القوانين الأساسية","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان الدوال اللوغاريتمية","تطبيق القوانين","حل مسائل متنوعة","أخرى"], commitment:["10 تدريبات","مراجعة القوانين","اختبار","أخرى"]},
            "ما قبل التفاضل::الدوال المثلثية": {current:["لا أعرف الدوال المثلثية","أفهم بعض الرسوم","أرسم الدوال","أحل مسائل متنوعة","أخرى"], target:["إتقان الدوال المثلثية","تحليل الرسوم","الاستعداد للتفاضل","أخرى"], commitment:["رسم يومي","حل تدريبات","اختبار","مراجعة","أخرى"]},
            "ما قبل التفاضل::الدوال العكسية": {current:["لا أعرف الدوال العكسية","أفهم المفهوم جزئياً","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["فهم الدوال العكسية","إيجاد العكس","حل مسائل متنوعة","أخرى"], commitment:["10 تدريبات","حل مسائل","اختبار","مراجعة","أخرى"]},
            "ما قبل التفاضل::تركيب الدوال": {current:["لا أعرف تركيب الدوال","أركب دوال بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان تركيب الدوال","تحليل العلاقات","حل مسائل متنوعة","أخرى"], commitment:["10 تدريبات","حل مسائل","اختبار","مراجعة","أخرى"]},
            "ما قبل التفاضل::تحويلات الدوال": {current:["لا أعرف التحويلات","أعرف بعض التحويلات","أطبق التحويلات","أخرى"], target:["إتقان التحويلات","تحليل الرسوم","حل المسائل","أخرى"], commitment:["حل تدريبات","رسم بياني","اختبار","أخرى"]},
            "ما قبل التفاضل::رسم الدوال": {current:["أواجه صعوبة في الرسم","أرسم دوال بسيطة","أرسم دوال مختلفة","أحل مسائل متنوعة","أخرى"], target:["إتقان رسم الدوال","تحليل الرسوم","حل مسائل الرسم","أخرى"], commitment:["رسم يومي","حل تدريبات","اختبار","مراجعة","أخرى"]},
            "ما قبل التفاضل::تحليل الرسوم البيانية": {current:["أواجه صعوبة في التحليل","أقرأ الرسوم البسيطة","أحلل الرسوم","أحل مسائل متنوعة","أخرى"], target:["إتقان تحليل الرسوم","استخراج المعلومات","حل مسائل متنوعة","أخرى"], commitment:["تحليل رسم يومي","حل مسائل","اختبار","مراجعة","أخرى"]},
            "ما قبل التفاضل::المتتاليات": {current:["لا أعرف المتتاليات","أعرف المتتاليات الحسابية","أعرف المتتاليات الهندسية","أخرى"], target:["إتقان المتتاليات","إيجاد الحدود","حل المسائل","أخرى"], commitment:["10 مسائل","20 مسألة","اختبار","مراجعة","أخرى"]},
            "ما قبل التفاضل::المتتاليات الحسابية": {current:["لا أعرفها","أجد الحدود الأولى","أستخدم القانون","أحل مسائل متنوعة","أخرى"], target:["إتقان المتتاليات الحسابية","إيجاد الحد العام","حل مسائل تطبيقية","أخرى"], commitment:["10 مسائل","20 مسألة","اختبار","مراجعة","أخرى"]},
            "ما قبل التفاضل::المتتاليات الهندسية": {current:["لا أعرفها","أجد الحدود الأولى","أستخدم القانون","أحل مسائل متنوعة","أخرى"], target:["إتقان المتتاليات الهندسية","إيجاد الحد العام","حل مسائل تطبيقية","أخرى"], commitment:["10 مسائل","20 مسألة","اختبار","مراجعة","أخرى"]},
            "ما قبل التفاضل::المتسلسلات": {current:["لا أعرف المتسلسلات","أجمع حدوداً بسيطة","أستخدم القوانين","أحل مسائل متنوعة","أخرى"], target:["إتقان المتسلسلات","حساب المجاميع","حل مسائل متنوعة","أخرى"], commitment:["10 مسائل","حل تدريبات","اختبار","مراجعة","أخرى"]},
            "ما قبل التفاضل::المتجهات": {current:["لا أعرف المتجهات","أعرف المفهوم","أجري العمليات","أحل مسائل متنوعة","أخرى"], target:["إتقان المتجهات","حل المسائل","التطبيق الهندسي","أخرى"], commitment:["حل تدريبات","اختبار","مراجعة","أخرى"]},
            "ما قبل التفاضل::عمليات المتجهات": {current:["لا أعرف العمليات","أجمع وأطرح متجهات","أتعامل مع الضرب القياسي","أحل مسائل متنوعة","أخرى"], target:["إتقان عمليات المتجهات","حل مسائل تطبيقية","ربطها بالهندسة","أخرى"], commitment:["حل تدريبات","اختبار","مراجعة","أخرى"]},
            "ما قبل التفاضل::المتجهات في المستوى": {current:["لا أعرفها","أمثل المتجهات","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان متجهات المستوى","حل مسائل هندسية","تطبيق العمليات","أخرى"], commitment:["حل تدريبات","رسم متجهات","اختبار","أخرى"]},
            "ما قبل التفاضل::المتجهات في الفراغ": {current:["لا أعرفها","أفهم الإحداثيات الثلاثية","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان متجهات الفراغ","حل مسائل ثلاثية الأبعاد","الاستعداد للجبر الخطي","أخرى"], commitment:["حل تدريبات","رسم توضيحي","اختبار","أخرى"]},
            "ما قبل التفاضل::الأعداد المركبة": {current:["لا أعرف الأعداد المركبة","أعرف الصورة الجبرية","أجري العمليات","أستخدم الصورة القطبية","أخرى"], target:["إتقان الأعداد المركبة","حل المسائل","تطبيق النظريات","أخرى"], commitment:["10 مسائل","20 مسألة","اختبار","أخرى"]},
            "ما قبل التفاضل::الصورة الجبرية": {current:["لا أعرف الصورة الجبرية","أجري عمليات بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان الصورة الجبرية","تنفيذ العمليات بدقة","حل مسائل متنوعة","أخرى"], commitment:["10 مسائل","حل تدريبات","اختبار","أخرى"]},
            "ما قبل التفاضل::الصورة القطبية": {current:["لا أعرف الصورة القطبية","أحول إليها بمساعدة","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان الصورة القطبية","التحويل بين الصور","حل مسائل متنوعة","أخرى"], commitment:["10 مسائل","حل تدريبات","اختبار","أخرى"]},
            "ما قبل التفاضل::نظرية دي موافر": {current:["لا أعرف النظرية","أطبقها بمساعدة","أحل مسائل بسيطة","أخرى"], target:["فهم نظرية دي موافر","تطبيقها في القوى والجذور","حل مسائل متنوعة","أخرى"], commitment:["حل تدريبات","مراجعة القانون","اختبار","أخرى"]},
            "ما قبل التفاضل::المصفوفات الأساسية": {current:["لا أعرف المصفوفات","أجري العمليات","أحسب المحددات","أحل الأنظمة","أخرى"], target:["إتقان المصفوفات","حل الأنظمة","التطبيقات","أخرى"], commitment:["حل تدريبات","اختبار","مراجعة","أخرى"]},
            "ما قبل التفاضل::المحددات الأساسية": {current:["لا أعرف المحددات","أحسب محددات بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان المحددات","استخدامها في الأنظمة","حل مسائل متنوعة","أخرى"], commitment:["حل تدريبات","اختبار","مراجعة","أخرى"]},
            "ما قبل التفاضل::حل الأنظمة الخطية": {current:["لا أعرف حل الأنظمة","أحل أنظمة بسيطة","أستخدم المصفوفات","أحل مسائل متنوعة","أخرى"], target:["إتقان حل الأنظمة","اختيار الطريقة المناسبة","حل مسائل تطبيقية","أخرى"], commitment:["10 مسائل","حل تدريبات","اختبار","أخرى"]},
            "ما قبل التفاضل::المقاطع المخروطية": {current:["لا أعرفها","أعرف الأشكال","أكتب المعادلات","أحل مسائل متنوعة","أخرى"], target:["إتقان المقاطع المخروطية","تحليل الرسوم","حل المسائل","أخرى"], commitment:["10 تدريبات","حل مسائل","اختبار","أخرى"]},
            "ما قبل التفاضل::الدائرة": {current:["لا أعرف معادلة الدائرة","أميز عناصرها","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان الدائرة","تحليل المعادلة والرسم","حل مسائل متنوعة","أخرى"], commitment:["10 تدريبات","رسم بياني","اختبار","أخرى"]},
            "ما قبل التفاضل::القطع المكافئ": {current:["لا أعرفه","أميز شكله","أكتب معادلته","أحل مسائل متنوعة","أخرى"], target:["إتقان القطع المكافئ","تحليل الخصائص","حل مسائل متنوعة","أخرى"], commitment:["10 تدريبات","رسم بياني","اختبار","أخرى"]},
            "ما قبل التفاضل::القطع الناقص": {current:["لا أعرفه","أميز شكله","أكتب معادلته","أحل مسائل متنوعة","أخرى"], target:["إتقان القطع الناقص","تحليل الخصائص","حل مسائل متنوعة","أخرى"], commitment:["10 تدريبات","رسم بياني","اختبار","أخرى"]},
            "ما قبل التفاضل::القطع الزائد": {current:["لا أعرفه","أميز شكله","أكتب معادلته","أحل مسائل متنوعة","أخرى"], target:["إتقان القطع الزائد","تحليل الخصائص","حل مسائل متنوعة","أخرى"], commitment:["10 تدريبات","رسم بياني","اختبار","أخرى"]},
            "ما قبل التفاضل::المتباينات": {current:["لا أعرف المتباينات","أحل متباينات بسيطة","أحل متباينات مركبة","أخرى"], target:["إتقان المتباينات","تمثيل الحل","حل مسائل متنوعة","أخرى"], commitment:["حل مسائل","ورقة تدريب","اختبار","أخرى"]},
            "ما قبل التفاضل::القيمة المطلقة": {current:["لا أعرف القيمة المطلقة","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان القيمة المطلقة","حل المعادلات والمتباينات","تحليل الرسوم","أخرى"], commitment:["10 تدريبات","حل مسائل","اختبار","أخرى"]},
            "ما قبل التفاضل::حل المسائل التطبيقية": {current:["أواجه صعوبة","أفهم المطلوب","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["تحليل المسألة","اختيار القانون المناسب","حل مسائل معقدة","أخرى"], commitment:["5 مسائل","10 مسائل","تحليل الأخطاء","اختبار","أخرى"]},
            "ما قبل التفاضل::الاستعداد للتفاضل": {current:["أحتاج مراجعة","أعرف الأساسيات","أشعر بالاستعداد","أخرى"], target:["الاستعداد الكامل","إتقان المفاهيم","الانتقال للتفاضل","أخرى"], commitment:["مراجعة يومية","اختبار أسبوعي","تحليل الأخطاء","مراجعة نقاط الضعف","أخرى"]},
            "ما قبل التفاضل::المراجعة الشاملة": {current:["أحتاج مراجعة","راجعت جزءاً بسيطاً","أراجع بانتظام","أحل مسائل متنوعة","أخرى"], target:["إكمال المراجعة","تقوية نقاط الضعف","جاهزية كاملة","إتقان ما قبل التفاضل","أخرى"], commitment:["مراجعة يومية","اختبار أسبوعي","تحليل الأخطاء","مراجعة نقاط الضعف","أخرى"]},
            "ما قبل التفاضل::اختبار قصير": {current:["أحتاج مراجعة","أحل اختبارات قصيرة","أحل اختبارات كاملة","أخرى"], target:["تحسين الدرجة","اجتياز الاختبارات","تقليل الأخطاء","إتقان ما قبل التفاضل","أخرى"], commitment:["اختبار أسبوعي","اختبار تجريبي","تحليل الأخطاء","مراجعة نقاط الضعف","أخرى"]},
            "ما قبل التفاضل::اختبار تجريبي": {current:["أحتاج مراجعة","أحل اختبارات قصيرة","أحل اختبارات كاملة","أخرى"], target:["تحسين الدرجة","اجتياز الاختبارات","تقليل الأخطاء","إتقان ما قبل التفاضل","أخرى"], commitment:["اختبار أسبوعي","اختبار تجريبي","تحليل الأخطاء","مراجعة نقاط الضعف","أخرى"]},
            "ما قبل التفاضل::أخرى": {current:["أحتاج تحديد الموضوع","بدأت المراجعة","أحل تدريبات","أحتاج خطة واضحة","أخرى"], target:["بناء أساس قوي","الاستعداد للتفاضل","إتقان المسار المختار","أخرى"], commitment:["تدريب يومي","مراجعة أسبوعية","اختبار ذاتي","برنامج مخصص","أخرى"]},
            "التفاضل::مراجعة ما قبل التفاضل": {current:["أحتاج مراجعة","أعرف الأساسيات","أحل مسائل متنوعة","أشعر بالاستعداد","أخرى"], target:["تقوية الأساس","سد الفجوات","الاستعداد للتفاضل","أخرى"], commitment:["مراجعة يومية","حل 10 مسائل","تحليل الأخطاء","مراجعة أسبوعية","أخرى"]},
            "التفاضل::فكرة التفاضل": {current:["لا أعرف الفكرة","أفهم الفكرة جزئياً","أربطها بمعدل التغير","أحل أمثلة بسيطة","أخرى"], target:["فهم معنى التفاضل","ربطه بالتغير والحركة","الاستعداد للمشتقة","أخرى"], commitment:["درس يومي","حل أمثلة","رسم توضيحي","مراجعة","أخرى"]},
            "التفاضل::معدل التغير": {current:["لا أعرف معدل التغير","أحسب معدلات بسيطة","أربطه بالميل","أحل مسائل متنوعة","أخرى"], target:["فهم معدل التغير","حل مسائل تطبيقية","الاستعداد للمشتقة","أخرى"], commitment:["10 تدريبات","حل مسائل","اختبار قصير","مراجعة","أخرى"]},
            "التفاضل::النهايات": {current:["لا أعرف النهايات","أفهم الفكرة","أحسب نهايات بسيطة","أحسب نهايات متنوعة","أخرى"], target:["فهم النهايات","إتقان الحساب","حل مسائل متنوعة","الاستعداد للمشتقات","أخرى"], commitment:["10 تدريبات","20 تدريباً","ورقة عمل","اختبار","مراجعة","أخرى"]},
            "التفاضل::النهايات الجبرية": {current:["لا أعرف النهايات الجبرية","أستخدم التعويض المباشر","أبسط التعابير","أحل مسائل متنوعة","أخرى"], target:["إتقان النهايات الجبرية","اختيار طريقة التبسيط","حل مسائل متنوعة","أخرى"], commitment:["10 تدريبات","حل مسائل","مراجعة القواعد","اختبار","أخرى"]},
            "التفاضل::النهايات عند اللانهاية": {current:["لا أعرفها","أفهم الفكرة","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان النهايات عند اللانهاية","تحليل السلوك النهائي","حل مسائل متنوعة","أخرى"], commitment:["حل تدريبات","رسم سلوك الدالة","اختبار","مراجعة","أخرى"]},
            "التفاضل::النهايات المثلثية": {current:["لا أعرفها","أعرف النهايات الأساسية","أطبق القواعد","أحل مسائل متنوعة","أخرى"], target:["إتقان النهايات المثلثية","استخدام الهويات","حل مسائل متقدمة","أخرى"], commitment:["10 تدريبات","مراجعة القوانين","اختبار","أخرى"]},
            "التفاضل::النهايات الخاصة": {current:["لا أعرف النهايات الخاصة","أحفظ بعضها","أطبقها في مسائل بسيطة","أخرى"], target:["إتقان النهايات الخاصة","اختيار النهاية المناسبة","حل مسائل متنوعة","أخرى"], commitment:["مراجعة القوانين","حل تدريبات","اختبار","أخرى"]},
            "التفاضل::الاتصال": {current:["لا أعرف الاتصال","أفهم المفهوم","أحدد نقاط الانقطاع","أخرى"], target:["إتقان الاتصال","تحليل الدوال","حل المسائل","أخرى"], commitment:["حل تدريبات","اختبار","مراجعة","أخرى"]},
            "التفاضل::استمرارية الدوال": {current:["لا أعرف الاستمرارية","أميز الدوال المستمرة","أحدد الانقطاعات","أحل مسائل متنوعة","أخرى"], target:["إتقان الاستمرارية","تحليل شروط الاتصال","حل مسائل متنوعة","أخرى"], commitment:["10 تدريبات","تحليل رسوم","اختبار","مراجعة","أخرى"]},
            "التفاضل::المشتقة": {current:["لا أعرف المشتقة","أعرف التعريف","أستخدم القواعد","أحل مسائل متنوعة","أخرى"], target:["إتقان الاشتقاق","اختيار القاعدة المناسبة","حل مسائل معقدة","أخرى"], commitment:["10 مسائل","20 مسألة","اختبار","ورقة تدريب","أخرى"]},
            "التفاضل::تعريف المشتقة": {current:["لا أعرف التعريف","أفهمه نظرياً","أطبقه في أمثلة بسيطة","أخرى"], target:["فهم تعريف المشتقة","ربطه بالميل","حل مسائل من التعريف","أخرى"], commitment:["حل أمثلة","رسم توضيحي","اختبار قصير","مراجعة","أخرى"]},
            "التفاضل::المشتقة من المبادئ الأولى": {current:["لا أعرف الطريقة","أطبقها بمساعدة","أحل أمثلة بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان الاشتقاق من المبادئ الأولى","فهم خطوات الحل","تقليل الأخطاء","أخرى"], commitment:["5 مسائل","10 مسائل","مراجعة الخطوات","اختبار","أخرى"]},
            "التفاضل::قواعد الاشتقاق": {current:["أعرف بعض القواعد","أستخدم معظم القواعد","أطبق القواعد المركبة","أخرى"], target:["إتقان جميع القواعد","زيادة السرعة","تقليل الأخطاء","أخرى"], commitment:["حل تدريبات","مراجعة القوانين","اختبار","أخرى"]},
            "التفاضل::اشتقاق الثوابت": {current:["لا أعرف القاعدة","أطبقها أحياناً","أحل أمثلة بسرعة","أخرى"], target:["إتقان القاعدة","تقليل الأخطاء","الانتقال لقواعد أصعب","أخرى"], commitment:["10 تدريبات","مراجعة القاعدة","اختبار سريع","أخرى"]},
            "التفاضل::اشتقاق القوى": {current:["لا أعرف قاعدة القوى","أطبقها في أمثلة بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان قاعدة القوى","زيادة السرعة","حل مسائل مركبة","أخرى"], commitment:["10 مسائل","20 مسألة","اختبار","أخرى"]},
            "التفاضل::اشتقاق كثيرات الحدود": {current:["لا أعرفها","أشتق حدوداً بسيطة","أشتق كثيرات حدود","أحل مسائل متنوعة","أخرى"], target:["إتقان اشتقاق كثيرات الحدود","تبسيط الحل","حل مسائل متنوعة","أخرى"], commitment:["10 تدريبات","حل مسائل","اختبار","مراجعة","أخرى"]},
            "التفاضل::اشتقاق الدوال الكسرية": {current:["لا أعرفها","أطبق قاعدة القسمة","أحل مسائل بسيطة","أخرى"], target:["إتقان اشتقاق الدوال الكسرية","اختيار القاعدة المناسبة","حل مسائل متنوعة","أخرى"], commitment:["حل تدريبات","مراجعة القاعدة","اختبار","أخرى"]},
            "التفاضل::اشتقاق الدوال الجذرية": {current:["لا أعرفها","أحول الجذور إلى أسس","أحل مسائل بسيطة","أخرى"], target:["إتقان اشتقاق الدوال الجذرية","تطبيق قاعدة السلسلة","حل مسائل متنوعة","أخرى"], commitment:["10 تدريبات","حل مسائل","اختبار","أخرى"]},
            "التفاضل::اشتقاق الدوال الأسية": {current:["لا أعرفها","أعرف قاعدة e","أشتق دوال أسية بسيطة","أخرى"], target:["إتقان الدوال الأسية","حل مسائل نمو وتناقص","تطبيق القواعد","أخرى"], commitment:["حل تدريبات","مراجعة القوانين","اختبار","أخرى"]},
            "التفاضل::اشتقاق الدوال اللوغاريتمية": {current:["لا أعرفها","أعرف القاعدة الأساسية","أحل مسائل بسيطة","أخرى"], target:["إتقان الدوال اللوغاريتمية","تطبيق الاشتقاق اللوغاريتمي","حل مسائل متنوعة","أخرى"], commitment:["10 تدريبات","مراجعة القوانين","اختبار","أخرى"]},
            "التفاضل::اشتقاق الدوال المثلثية": {current:["لا أعرفها","أعرف بعض القواعد","أشتق دوال بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان اشتقاق الدوال المثلثية","حفظ القواعد","حل مسائل مركبة","أخرى"], commitment:["مراجعة القوانين","حل تدريبات","اختبار","أخرى"]},
            "التفاضل::اشتقاق الدوال العكسية": {current:["لا أعرفها","أفهم الفكرة","أطبقها في أمثلة بسيطة","أخرى"], target:["إتقان اشتقاق الدوال العكسية","حل مسائل متنوعة","أخرى"], commitment:["حل تدريبات","اختبار","مراجعة","أخرى"]},
            "التفاضل::قاعدة الضرب": {current:["لا أعرفها","أعرف الصيغة","أطبقها في مسائل بسيطة","أخرى"], target:["إتقان قاعدة الضرب","اختيارها عند الحاجة","حل مسائل مركبة","أخرى"], commitment:["10 تدريبات","مراجعة القانون","اختبار","أخرى"]},
            "التفاضل::قاعدة القسمة": {current:["لا أعرفها","أعرف الصيغة","أطبقها في مسائل بسيطة","أخرى"], target:["إتقان قاعدة القسمة","تقليل الأخطاء","حل مسائل مركبة","أخرى"], commitment:["10 تدريبات","مراجعة القانون","اختبار","أخرى"]},
            "التفاضل::قاعدة السلسلة": {current:["لا أعرفها","أعرف الفكرة","أطبقها","أحل مسائل متنوعة","أخرى"], target:["إتقان القاعدة","حل المسائل المعقدة","أخرى"], commitment:["10 تدريبات","حل مسائل","اختبار","أخرى"]},
            "التفاضل::الاشتقاق الضمني": {current:["لا أعرفه","أفهم الفكرة","أحل مسائل بسيطة","أخرى"], target:["إتقان الاشتقاق الضمني","حل مسائل المنحنيات","تطبيقه بثقة","أخرى"], commitment:["حل تدريبات","مراجعة الخطوات","اختبار","أخرى"]},
            "التفاضل::الاشتقاق اللوغاريتمي": {current:["لا أعرفه","أفهم الفكرة","أطبقه في مسائل بسيطة","أخرى"], target:["إتقان الاشتقاق اللوغاريتمي","تبسيط المسائل المعقدة","حل مسائل متنوعة","أخرى"], commitment:["10 تدريبات","حل مسائل","اختبار","أخرى"]},
            "التفاضل::المشتقات العليا": {current:["لا أعرفها","أحسب مشتقة ثانية","أحسب مشتقات متعددة","أخرى"], target:["إتقان المشتقات العليا","تطبيقها في التقعر والحركة","حل مسائل متنوعة","أخرى"], commitment:["حل تدريبات","اختبار","مراجعة","أخرى"]},
            "التفاضل::معدل التغير اللحظي": {current:["لا أعرفه","أفهم الفكرة","أحسبه باستخدام المشتقة","أخرى"], target:["إتقان معدل التغير اللحظي","ربطه بالتطبيقات","حل مسائل متنوعة","أخرى"], commitment:["حل مسائل","تطبيقات عملية","اختبار","أخرى"]},
            "التفاضل::المماس والعمودي": {current:["لا أعرف العلاقة","أحسب ميل المماس","أكتب معادلة المماس","أحل مسائل متنوعة","أخرى"], target:["إتقان مسائل المماس والعمودي","كتابة المعادلات بدقة","حل مسائل هندسية","أخرى"], commitment:["10 مسائل","رسم توضيحي","اختبار","أخرى"]},
            "التفاضل::زيادة ونقصان الدوال": {current:["لا أعرفها","أستخدم إشارة المشتقة","أحدد الفترات","أحل مسائل متنوعة","أخرى"], target:["إتقان التحليل","تحديد السلوك بدقة","حل مسائل الرسم","أخرى"], commitment:["حل تدريبات","تحليل رسوم","اختبار","أخرى"]},
            "التفاضل::القيم العظمى والصغرى": {current:["لا أعرفها","أحدد نقاطاً حرجة","أحل مسائل بسيطة","أخرى"], target:["إتقان القيم العظمى والصغرى","حل مسائل التحسين","تحليل الدوال","أخرى"], commitment:["10 مسائل","حل تطبيقات","اختبار","أخرى"]},
            "التفاضل::اختبار المشتقة الأولى": {current:["لا أعرفه","أطبقه بمساعدة","أحل مسائل بسيطة","أخرى"], target:["إتقان اختبار المشتقة الأولى","تحديد القيم القصوى","تحليل الدوال","أخرى"], commitment:["حل تدريبات","مراجعة الخطوات","اختبار","أخرى"]},
            "التفاضل::اختبار المشتقة الثانية": {current:["لا أعرفه","أطبقه بمساعدة","أحل مسائل بسيطة","أخرى"], target:["إتقان اختبار المشتقة الثانية","تحديد التقعر والقيم القصوى","حل مسائل متنوعة","أخرى"], commitment:["حل تدريبات","اختبار","مراجعة","أخرى"]},
            "التفاضل::التقعر ونقاط الانعطاف": {current:["لا أعرفها","أحسب المشتقة الثانية","أحدد التقعر","أخرى"], target:["إتقان التقعر","تحديد نقاط الانعطاف","تحليل المنحنيات","أخرى"], commitment:["حل تدريبات","رسم منحنيات","اختبار","أخرى"]},
            "التفاضل::رسم المنحنيات": {current:["أواجه صعوبة","أرسم دوال بسيطة","أحلل الرسوم","أخرى"], target:["إتقان الرسم","تحليل المنحنيات","حل المسائل","أخرى"], commitment:["رسم يومي","حل تدريبات","اختبار","أخرى"]},
            "التفاضل::نظرية القيمة المتوسطة": {current:["لا أعرف النظرية","أفهم نصها","أطبقها في مسائل بسيطة","أخرى"], target:["فهم النظرية","تطبيق الشروط","حل مسائل متنوعة","أخرى"], commitment:["حل تدريبات","مراجعة الشروط","اختبار","أخرى"]},
            "التفاضل::نظرية رول": {current:["لا أعرف النظرية","أفهم شروطها","أطبقها في مسائل بسيطة","أخرى"], target:["إتقان نظرية رول","تحديد الشروط","حل مسائل متنوعة","أخرى"], commitment:["حل تدريبات","مراجعة الشروط","اختبار","أخرى"]},
            "التفاضل::نظرية لاغرانج": {current:["لا أعرف النظرية","أفهم شروطها","أطبقها في مسائل بسيطة","أخرى"], target:["إتقان نظرية لاغرانج","تطبيقها بثقة","حل مسائل متنوعة","أخرى"], commitment:["حل تدريبات","اختبار","مراجعة","أخرى"]},
            "التفاضل::تقريب الدوال": {current:["لا أعرف التقريب","أفهم الفكرة","أستخدم التقريب الخطي","أخرى"], target:["إتقان تقريب الدوال","تقدير القيم بدقة","حل مسائل تطبيقية","أخرى"], commitment:["حل تدريبات","تطبيقات عملية","اختبار","أخرى"]},
            "التفاضل::قاعدة لوبيتال": {current:["لا أعرفها","أفهم الفكرة","أطبقها","أخرى"], target:["إتقان القاعدة","اختيار الحالات المناسبة","حل المسائل","أخرى"], commitment:["حل تدريبات","اختبار","مراجعة","أخرى"]},
            "التفاضل::حل المسائل التطبيقية": {current:["أواجه صعوبة","أفهم المطلوب","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["تحليل المسألة","اختيار الطريقة المناسبة","حل مسائل معقدة","أخرى"], commitment:["5 مسائل","10 مسائل","تحليل الأخطاء","اختبار","أخرى"]},
            "التفاضل::مسائل الحركة": {current:["لا أعرف نماذج الحركة","أفهم السرعة والتسارع","أحل مسائل بسيطة","أخرى"], target:["إتقان مسائل الحركة","ربط المشتقة بالحركة","حل مسائل متنوعة","أخرى"], commitment:["5 مسائل","10 مسائل","رسم مخطط","اختبار","أخرى"]},
            "التفاضل::مسائل المعدلات المرتبطة": {current:["لا أعرفها","أفهم الفكرة","أحل مسائل بسيطة","أخرى"], target:["إتقان المعدلات المرتبطة","نمذجة المسائل","حل مسائل تطبيقية","أخرى"], commitment:["حل 5 مسائل","تحليل خطوات الحل","اختبار","أخرى"]},
            "التفاضل::مسائل التحسين": {current:["لا أعرفها","أفهم الفكرة","أحل مسائل بسيطة","أخرى"], target:["إتقان مسائل التحسين","بناء الدالة المناسبة","حل مسائل واقعية","أخرى"], commitment:["5 مسائل","10 مسائل","تحليل الأخطاء","اختبار","أخرى"]},
            "التفاضل::التقريب الخطي": {current:["لا أعرفه","أفهم الفكرة","أطبقه في أمثلة بسيطة","أخرى"], target:["إتقان التقريب الخطي","تقدير القيم","حل مسائل تطبيقية","أخرى"], commitment:["حل تدريبات","اختبار","مراجعة","أخرى"]},
            "التفاضل::مراجعة شاملة": {current:["أحتاج مراجعة","راجعت جزءاً بسيطاً","أراجع بانتظام","أحل مسائل متنوعة","أخرى"], target:["إكمال المراجعة","تقوية نقاط الضعف","جاهزية كاملة","إتقان التفاضل","أخرى"], commitment:["مراجعة يومية","اختبار أسبوعي","تحليل الأخطاء","مراجعة نقاط الضعف","أخرى"]},
            "التفاضل::اختبار قصير": {current:["أحتاج مراجعة","أحل اختبارات قصيرة","أحل اختبارات كاملة","أخرى"], target:["تحسين الدرجة","اجتياز الاختبارات","تقليل الأخطاء","إتقان التفاضل","أخرى"], commitment:["اختبار أسبوعي","اختبار تجريبي","تحليل الأخطاء","مراجعة نقاط الضعف","أخرى"]},
            "التفاضل::اختبار تجريبي": {current:["أحتاج مراجعة","أحل اختبارات قصيرة","أحل اختبارات كاملة","أخرى"], target:["تحسين الدرجة","اجتياز الاختبارات","تقليل الأخطاء","إتقان التفاضل","أخرى"], commitment:["اختبار أسبوعي","اختبار تجريبي","تحليل الأخطاء","مراجعة نقاط الضعف","أخرى"]},
            "التفاضل::الاستعداد للتكامل": {current:["أحتاج مراجعة","أعرف الأساسيات","أشعر بالاستعداد","أخرى"], target:["الاستعداد الكامل","إتقان المفاهيم","الانتقال للتكامل","أخرى"], commitment:["مراجعة يومية","اختبار أسبوعي","تحليل الأخطاء","مراجعة نقاط الضعف","أخرى"]},
            "التفاضل::أخرى": {current:["أحتاج تحديد الموضوع","بدأت المراجعة","أحل تدريبات","أحتاج خطة واضحة","أخرى"], target:["بناء أساس قوي","إتقان التفاضل","الاستعداد للتكامل","أخرى"], commitment:["تدريب يومي","مراجعة أسبوعية","اختبار ذاتي","برنامج مخصص","أخرى"]},
            "التكامل::مراجعة التفاضل": {current:["أحتاج مراجعة كاملة","أتذكر الأساسيات","أجيد الاشتقاق الأساسي","أجيد معظم القواعد","أخرى"], target:["استرجاع المفاهيم","الربط بالتكامل","إتقان الأساسيات","الاستعداد للتكامل","أخرى"], commitment:["15 دقيقة مراجعة","30 دقيقة مراجعة","حل تدريبات","اختبار ذاتي","أخرى"]},
            "التكامل::فكرة التكامل": {current:["لا أعرف مفهوم التكامل","أفهم الفكرة العامة","أربطه بالاشتقاق","أطبق المفهوم","أخرى"], target:["فهم التكامل","فهم التراكم","فهم العلاقة بالتفاضل","إتقان المفهوم","أخرى"], commitment:["قراءة المفهوم","حل أمثلة","تلخيص الدرس","اختبار سريع","أخرى"]},
            "التكامل::مفهوم الدالة الأصلية": {current:["لا أعرفها","أفهم الفكرة","أوجد دوال أصلية بسيطة","أوجد دوال متنوعة","أخرى"], target:["إتقان الدوال الأصلية","اختيار الدالة المناسبة","حل المسائل","أخرى"], commitment:["10 تدريبات","20 تدريباً","حل ورقة عمل","اختبار","أخرى"]},
            "التكامل::الرموز الأساسية للتكامل": {current:["لا أعرف الرموز","أميز رمز التكامل","أفهم الثابت والتفاضل","أقرأ المسائل بثقة","أخرى"], target:["فهم الرموز الأساسية","قراءة مسائل التكامل","الاستعداد للتكامل غير المحدد","أخرى"], commitment:["مراجعة الرموز","حل أمثلة","تلخيص الدرس","اختبار سريع","أخرى"]},
            "التكامل::التكامل غير المحدد": {current:["لا أعرفه","أطبق القواعد الأساسية","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان التكامل غير المحدد","زيادة السرعة","تقليل الأخطاء","حل مسائل متنوعة","أخرى"], commitment:["10 مسائل","20 مسألة","حل تدريبات","اختبار","أخرى"]},
            "التكامل::الدوال الأصلية": {current:["لا أعرفها","أفهم الفكرة","أوجد دوال أصلية بسيطة","أوجد دوال متنوعة","أخرى"], target:["إتقان الدوال الأصلية","اختيار الدالة المناسبة","حل المسائل","أخرى"], commitment:["10 تدريبات","20 تدريباً","حل ورقة عمل","اختبار","أخرى"]},
            "التكامل::التكامل باعتباره العملية العكسية للاشتقاق": {current:["لا أفهم العلاقة","أربطه بالاشتقاق جزئياً","أستخدم العلاقة في مسائل بسيطة","أخرى"], target:["فهم العلاقة العكسية","التحقق من الحل بالاشتقاق","حل مسائل بثقة","أخرى"], commitment:["حل أمثلة","مراجعة قواعد الاشتقاق","اختبار سريع","أخرى"]},
            "التكامل::قواعد التكامل الأساسية": {current:["أعرف بعض القواعد","أعرف معظم القواعد","أطبق القواعد","أحل مسائل متنوعة","أخرى"], target:["إتقان القواعد","اختيار القاعدة المناسبة","زيادة السرعة","أخرى"], commitment:["حل تدريبات","مراجعة القوانين","اختبار","ورقة عمل","أخرى"]},
            "التكامل::تكامل الثابت": {current:["لا أعرف القاعدة","أطبقها أحياناً","أحل أمثلة بسرعة","أخرى"], target:["إتقان قاعدة تكامل الثابت","تقليل الأخطاء","الانتقال لقواعد أكثر تقدماً","أخرى"], commitment:["10 تدريبات","مراجعة القاعدة","اختبار سريع","أخرى"]},
            "التكامل::تكامل القوى": {current:["لا أعرف القانون","أطبق القانون","أحل مسائل متنوعة","أخرى"], target:["إتقان القانون","حل مسائل متنوعة","زيادة السرعة","أخرى"], commitment:["10 تدريبات","20 تدريباً","اختبار","مراجعة","أخرى"]},
            "التكامل::تكامل كثيرات الحدود": {current:["لا أعرفها","أكامل حدوداً بسيطة","أكامل كثيرات حدود","أحل مسائل متنوعة","أخرى"], target:["إتقان تكامل كثيرات الحدود","تبسيط الحل","حل مسائل متنوعة","أخرى"], commitment:["10 تدريبات","حل مسائل","اختبار","مراجعة","أخرى"]},
            "التكامل::تكامل الجمع والطرح": {current:["لا أعرف القاعدة","أطبقها في أمثلة بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان تكامل الجمع والطرح","تنظيم خطوات الحل","تقليل الأخطاء","أخرى"], commitment:["حل تدريبات","مراجعة القاعدة","اختبار","أخرى"]},
            "التكامل::تكامل الثابت المضروب": {current:["لا أعرف القاعدة","أطبقها أحياناً","أحل مسائل بسيطة","أخرى"], target:["إتقان قاعدة الثابت المضروب","حل مسائل بسرعة","تقليل الأخطاء","أخرى"], commitment:["10 تدريبات","حل مسائل","اختبار","أخرى"]},
            "التكامل::تكامل الدوال الجذرية": {current:["لا أعرفها","أحول الجذور إلى أسس","أحل مسائل بسيطة","أخرى"], target:["إتقان تكامل الدوال الجذرية","استخدام قاعدة القوى","حل مسائل متنوعة","أخرى"], commitment:["10 تدريبات","حل مسائل","اختبار","أخرى"]},
            "التكامل::تكامل الدوال الكسرية البسيطة": {current:["لا أعرفها","أتعامل مع كسور بسيطة","أحل مسائل مباشرة","أخرى"], target:["إتقان التكاملات الكسرية البسيطة","اختيار القاعدة المناسبة","حل مسائل متنوعة","أخرى"], commitment:["حل تدريبات","مراجعة القوانين","اختبار","أخرى"]},
            "التكامل::تكامل الدوال الأسية الأساسية": {current:["لا أعرف القوانين","أطبق القوانين","أحل مسائل متنوعة","أخرى"], target:["إتقان القوانين","حل مسائل متنوعة","ربطها بالتطبيقات","أخرى"], commitment:["حل تدريبات","اختبار","مراجعة","أخرى"]},
            "التكامل::تكامل الدوال اللوغاريتمية الأساسية": {current:["لا أعرف القوانين","أطبق القوانين","أحل مسائل بسيطة","أخرى"], target:["إتقان التكاملات اللوغاريتمية الأساسية","حل مسائل متنوعة","تقليل الأخطاء","أخرى"], commitment:["حل تدريبات","مراجعة القوانين","اختبار","أخرى"]},
            "التكامل::تكامل الدوال المثلثية الأساسية": {current:["لا أعرف القوانين","أعرف بعض القوانين","أطبق القوانين","أخرى"], target:["إتقان التكاملات المثلثية الأساسية","حل المسائل","زيادة السرعة","أخرى"], commitment:["10 تدريبات","حل مسائل","اختبار","أخرى"]},
            "التكامل::التحقق من الحل بالاشتقاق": {current:["لا أعرف الطريقة","أستخدمها أحياناً","أتحقق من الحل دائماً","أخرى"], target:["إتقان التحقق","اكتشاف الأخطاء","زيادة الدقة","أخرى"], commitment:["التحقق من كل مسألة","مراجعة الأخطاء","اختبار","أخرى"]},
            "التكامل::حل المسائل الأساسية": {current:["أواجه صعوبة","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["تحليل المسألة","اختيار القانون المناسب","حل مسائل معقدة","أخرى"], commitment:["5 مسائل","10 مسائل","تحليل الأخطاء","اختبار","أخرى"]},
            "التكامل::المراجعة الشاملة": {current:["أحتاج مراجعة","راجعت جزءاً بسيطاً","أراجع بانتظام","أحل مسائل متنوعة","أخرى"], target:["إكمال المراجعة","تقوية نقاط الضعف","جاهزية كاملة","إتقان التكامل","أخرى"], commitment:["مراجعة يومية","اختبار أسبوعي","تحليل الأخطاء","مراجعة نقاط الضعف","أخرى"]},
            "التكامل::اختبار قصير": {current:["أحتاج مراجعة","أحل اختبارات قصيرة","أحل اختبارات كاملة","أخرى"], target:["تحسين الدرجة","اجتياز الاختبارات","تقليل الأخطاء","إتقان تقنيات التكامل","أخرى"], commitment:["اختبار أسبوعي","اختبار تجريبي","تحليل الأخطاء","مراجعة نقاط الضعف","أخرى"]},
            "التكامل::اختبار تجريبي": {current:["أحتاج مراجعة","أحل اختبارات قصيرة","أحل اختبارات كاملة","أخرى"], target:["تحسين الدرجة","اجتياز الاختبارات","تقليل الأخطاء","إتقان تقنيات التكامل","أخرى"], commitment:["اختبار أسبوعي","اختبار تجريبي","تحليل الأخطاء","مراجعة نقاط الضعف","أخرى"]},
            "التكامل::مراجعة التكامل غير المحدد": {current:["أحتاج مراجعة","أتذكر القواعد","أطبق القواعد","أخرى"], target:["استرجاع المفاهيم","الربط بالتكامل المحدد","إتقان الأساسيات","أخرى"], commitment:["15 دقيقة مراجعة","30 دقيقة مراجعة","حل تدريبات","اختبار","أخرى"]},
            "التكامل::فكرة التكامل المحدد": {current:["لا أعرف المفهوم","أفهم الفكرة","أربطه بالمساحات","أخرى"], target:["فهم التكامل المحدد","فهم المساحات","ربط المفاهيم","أخرى"], commitment:["قراءة المفهوم","حل أمثلة","تلخيص","اختبار","أخرى"]},
            "التكامل::مفهوم المساحة": {current:["لا أعرف المفهوم","أفهم المساحات البسيطة","أربط المساحة بالتكامل","أخرى"], target:["فهم مفهوم المساحة","ربط المساحة بالتكامل المحدد","حل مسائل أساسية","أخرى"], commitment:["حل أمثلة","رسم بياني","اختبار سريع","أخرى"]},
            "التكامل::الحدود العليا والسفلى": {current:["لا أعرفها","أميز الحدود","أستخدمها في الحساب","أخرى"], target:["فهم حدود التكامل","تطبيق الحدود بدقة","تقليل الأخطاء","أخرى"], commitment:["10 تدريبات","حل مسائل","اختبار","أخرى"]},
            "التكامل::خواص التكامل المحدد": {current:["لا أعرف الخواص","أعرف بعضها","أطبقها","أخرى"], target:["إتقان الخواص","اختيار الخاصية المناسبة","حل المسائل","أخرى"], commitment:["10 تدريبات","20 تدريباً","اختبار","مراجعة","أخرى"]},
            "التكامل::مبرهنة التكامل الأساسية": {current:["لا أعرفها","أفهم الفكرة","أطبقها","أحل مسائل متنوعة","أخرى"], target:["إتقان المبرهنة","ربط التفاضل بالتكامل","حل المسائل","أخرى"], commitment:["10 مسائل","20 مسألة","اختبار","مراجعة","أخرى"]},
            "التكامل::حساب التكامل المحدد": {current:["لا أعرف الطريقة","أطبق القوانين","أحل مسائل متنوعة","أخرى"], target:["إتقان الحساب","زيادة السرعة","تقليل الأخطاء","أخرى"], commitment:["10 تدريبات","20 تدريباً","حل مسائل","اختبار","أخرى"]},
            "التكامل::التكامل المحدد للدوال كثيرة الحدود": {current:["لا أعرفه","أحسب أمثلة بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان التكامل المحدد لكثيرات الحدود","تطبيق الحدود بدقة","حل مسائل متنوعة","أخرى"], commitment:["10 تدريبات","20 تدريباً","اختبار","مراجعة","أخرى"]},
            "التكامل::التكامل المحدد للدوال الكسرية البسيطة": {current:["لا أعرفه","أتعامل مع كسور بسيطة","أحل مسائل مباشرة","أخرى"], target:["إتقان التكاملات الكسرية المحددة","اختيار الطريقة المناسبة","حل مسائل متنوعة","أخرى"], commitment:["حل تدريبات","مراجعة القوانين","اختبار","أخرى"]},
            "التكامل::التكامل المحدد للدوال الأسية": {current:["لا أعرف القوانين","أطبق القوانين","أحل مسائل متنوعة","أخرى"], target:["إتقان التكامل المحدد للدوال الأسية","حل مسائل متنوعة","ربطها بالتطبيقات","أخرى"], commitment:["حل تدريبات","اختبار","مراجعة","أخرى"]},
            "التكامل::التكامل المحدد للدوال اللوغاريتمية": {current:["لا أعرف القوانين","أطبق القوانين","أحل مسائل بسيطة","أخرى"], target:["إتقان التكامل المحدد للدوال اللوغاريتمية","حل مسائل متنوعة","تقليل الأخطاء","أخرى"], commitment:["حل تدريبات","مراجعة القوانين","اختبار","أخرى"]},
            "التكامل::التكامل المحدد للدوال المثلثية": {current:["لا أعرف القوانين","أعرف بعض القوانين","أطبق القوانين","أخرى"], target:["إتقان التكاملات المثلثية المحددة","حل المسائل","زيادة السرعة","أخرى"], commitment:["10 تدريبات","حل مسائل","اختبار","أخرى"]},
            "التكامل::استخدام التناظر": {current:["لا أعرف الفكرة","أفهمها جزئياً","أستخدمها في أمثلة بسيطة","أخرى"], target:["إتقان استخدام التناظر","تبسيط الحلول","حل مسائل أسرع","أخرى"], commitment:["حل أمثلة","رسم بياني","اختبار","أخرى"]},
            "التكامل::التكامل على فترات مختلفة": {current:["لا أعرف الطريقة","أقسم الفترات أحياناً","أحل مسائل متعددة الفترات","أخرى"], target:["إتقان التعامل مع الفترات","تقليل الأخطاء","حل مسائل متنوعة","أخرى"], commitment:["10 تدريبات","حل مسائل","مراجعة","أخرى"]},
            "التكامل::حساب المساحات البسيطة": {current:["لا أعرف الفكرة","أحسب مساحات بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان حساب المساحات","تفسير النتائج","حل التطبيقات","أخرى"], commitment:["10 مسائل","حل تدريبات","اختبار","أخرى"]},
            "التكامل::المساحة بين منحنيين بسيطين": {current:["لا أعرف الطريقة","أطبق الفكرة","أحل مسائل متنوعة","أخرى"], target:["إتقان الحل","حل التطبيقات","زيادة الدقة","أخرى"], commitment:["حل تدريبات","اختبار","مراجعة","أخرى"]},
            "التكامل::تفسير التكامل بيانياً": {current:["أواجه صعوبة","أفهم الرسوم","أربط الرسم بالتكامل","أخرى"], target:["تحليل الرسوم","تفسير المساحات","إتقان التمثيل البياني","أخرى"], commitment:["رسم يومي","حل تدريبات","اختبار","أخرى"]},
            "التكامل::العلاقة بين التفاضل والتكامل": {current:["لا أفهم العلاقة","أفهمها جزئياً","أطبقها في مسائل بسيطة","أخرى"], target:["فهم العلاقة بوضوح","ربط المفاهيم","حل مسائل بثقة","أخرى"], commitment:["مراجعة المفاهيم","حل أمثلة","اختبار سريع","أخرى"]},
            "التكامل::التطبيقات الأساسية": {current:["أعرف المفهوم","أطبق بعض التطبيقات","أحل مسائل متنوعة","أخرى"], target:["تطبيق التكامل","حل مسائل حياتية","حل تطبيقات علمية","أخرى"], commitment:["5 مسائل","10 مسائل","اختبار","أخرى"]},
            "التكامل::مراجعة التكامل الأساسي": {current:["أحتاج مراجعة","أتذكر القواعد الأساسية","أطبق القواعد الأساسية","أخرى"], target:["استرجاع الأساسيات","الاستعداد لتقنيات التكامل","تقليل الأخطاء","أخرى"], commitment:["15 دقيقة مراجعة","30 دقيقة مراجعة","حل تدريبات","اختبار","أخرى"]},
            "التكامل::اختيار طريقة التكامل": {current:["لا أعرف الطريقة المناسبة","أجرب عدة طرق","أختار الطريقة الصحيحة غالباً","أخرى"], target:["اختيار الطريقة المناسبة مباشرة","تقليل الوقت","زيادة الدقة","أخرى"], commitment:["حل 5 مسائل","حل 10 مسائل","تحليل طرق الحل","اختبار","أخرى"]},
            "التكامل::التكامل بالتعويض": {current:["لا أعرف التعويض","أستخدم التعويض البسيط","أستخدم التعويض المركب","أخرى"], target:["إتقان التعويض","اختيار التعويض المناسب","حل مسائل متنوعة","أخرى"], commitment:["10 تدريبات","20 تدريباً","اختبار","مراجعة","أخرى"]},
            "التكامل::التكامل بالتعويض البسيط": {current:["لا أعرف التعويض البسيط","أتعرف على التعويض المناسب","أحل مسائل مباشرة","أخرى"], target:["إتقان التعويض البسيط","تبسيط التكاملات","حل مسائل متنوعة","أخرى"], commitment:["10 تدريبات","حل مسائل","اختبار","أخرى"]},
            "التكامل::التكامل بالتعويض المركب": {current:["لا أعرف التعويض المركب","أطبقه أحياناً","أحل مسائل متنوعة","أخرى"], target:["إتقان التعويض المركب","اختيار التعويض بدقة","حل تكاملات معقدة","أخرى"], commitment:["10 تدريبات","20 تدريباً","تحليل الحلول","اختبار","أخرى"]},
            "التكامل::التكامل بالتجزئة": {current:["لا أعرف الطريقة","أطبق القاعدة","أختار الدالتين","أحل مسائل متنوعة","أخرى"], target:["إتقان الطريقة","اختيار أفضل ترتيب","حل مسائل معقدة","أخرى"], commitment:["10 مسائل","20 مسألة","اختبار","مراجعة","أخرى"]},
            "التكامل::اختيار الدالتين": {current:["أحتار في الاختيار","أختار أحياناً بطريقة صحيحة","أحدد الترتيب غالباً","أخرى"], target:["اختيار الدالتين بدقة","تقليل خطوات الحل","زيادة سرعة الحل","أخرى"], commitment:["حل تدريبات","تحليل اختيارات الحل","اختبار","أخرى"]},
            "التكامل::التكامل بالتجزئة المتكرر": {current:["لا أعرفه","أطبقه في مسائل بسيطة","أحل مسائل متكررة","أخرى"], target:["إتقان التجزئة المتكررة","تنظيم خطوات الحل","حل مسائل متقدمة","أخرى"], commitment:["حل مسائل","مراجعة الخطوات","اختبار","أخرى"]},
            "التكامل::الكسور الجزئية": {current:["لا أعرف التحليل","أحل الكسور البسيطة","أحل الكسور المتكررة","أخرى"], target:["إتقان الكسور الجزئية","تحليل المقامات","حل المسائل","أخرى"], commitment:["حل تدريبات","اختبار","مراجعة","أخرى"]},
            "التكامل::تحليل المقامات": {current:["أواجه صعوبة في التحليل","أحلل مقامات بسيطة","أحلل مقامات متنوعة","أخرى"], target:["إتقان تحليل المقامات","اختيار صيغة الكسور الجزئية","تقليل الأخطاء","أخرى"], commitment:["10 تدريبات","حل مسائل","مراجعة","أخرى"]},
            "التكامل::الكسور الجزئية البسيطة": {current:["لا أعرفها","أحل أمثلة مباشرة","أحل مسائل متنوعة","أخرى"], target:["إتقان الكسور الجزئية البسيطة","حل التكاملات بسرعة","زيادة الدقة","أخرى"], commitment:["حل تدريبات","اختبار","مراجعة","أخرى"]},
            "التكامل::الكسور الجزئية المتكررة": {current:["لا أعرفها","أطبقها بصعوبة","أحل مسائل متنوعة","أخرى"], target:["إتقان الكسور المتكررة","تنظيم الحل","حل مسائل متقدمة","أخرى"], commitment:["10 مسائل","تحليل الأخطاء","اختبار","أخرى"]},
            "التكامل::الكسور الجزئية التربيعية": {current:["لا أعرفها","أتعرف على المقام التربيعي","أحل مسائل بسيطة","أخرى"], target:["إتقان الكسور التربيعية","اختيار النموذج المناسب","حل مسائل متنوعة","أخرى"], commitment:["حل تدريبات","مراجعة القوانين","اختبار","أخرى"]},
            "التكامل::التكاملات المثلثية": {current:["لا أعرف القوانين","أعرف بعض القوانين","أطبق القوانين","أخرى"], target:["إتقان التكاملات المثلثية","حل مسائل متنوعة","زيادة السرعة","أخرى"], commitment:["10 تدريبات","20 تدريباً","اختبار","أخرى"]},
            "التكامل::تكاملات جيب الزاوية": {current:["لا أعرف القوانين","أطبق أمثلة بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان تكاملات جيب الزاوية","حل مسائل متنوعة","تقليل الأخطاء","أخرى"], commitment:["10 تدريبات","حل مسائل","اختبار","أخرى"]},
            "التكامل::تكاملات جيب التمام": {current:["لا أعرف القوانين","أطبق أمثلة بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان تكاملات جيب التمام","حل مسائل متنوعة","تقليل الأخطاء","أخرى"], commitment:["10 تدريبات","حل مسائل","اختبار","أخرى"]},
            "التكامل::تكاملات الظل": {current:["لا أعرف القوانين","أطبق أمثلة بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان تكاملات الظل","اختيار الهوية المناسبة","حل مسائل متنوعة","أخرى"], commitment:["حل تدريبات","مراجعة القوانين","اختبار","أخرى"]},
            "التكامل::تكاملات القوى المثلثية": {current:["لا أعرفها","أستخدم بعض الهويات","أحل مسائل متنوعة","أخرى"], target:["إتقان تكاملات القوى المثلثية","اختيار الهوية المناسبة","حل مسائل متقدمة","أخرى"], commitment:["10 مسائل","20 مسألة","تحليل الحلول","اختبار","أخرى"]},
            "التكامل::التعويضات المثلثية": {current:["لا أعرفها","أعرف الحالات","أختار التعويض المناسب","أخرى"], target:["إتقان التعويضات","حل التكاملات المعقدة","زيادة الدقة","أخرى"], commitment:["حل تدريبات","اختبار","مراجعة","أخرى"]},
            "التكامل::التعويض بالجيب": {current:["لا أعرف متى أستخدمه","أطبقه في أمثلة بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان التعويض بالجيب","اختيار الحالة المناسبة","حل مسائل متقدمة","أخرى"], commitment:["حل تدريبات","مراجعة الحالات","اختبار","أخرى"]},
            "التكامل::التعويض بجيب التمام": {current:["لا أعرف متى أستخدمه","أطبقه في أمثلة بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان التعويض بجيب التمام","اختيار الحالة المناسبة","حل مسائل متقدمة","أخرى"], commitment:["حل تدريبات","مراجعة الحالات","اختبار","أخرى"]},
            "التكامل::التعويض بالظل": {current:["لا أعرف متى أستخدمه","أطبقه في أمثلة بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان التعويض بالظل","اختيار الحالة المناسبة","حل مسائل متقدمة","أخرى"], commitment:["حل تدريبات","مراجعة الحالات","اختبار","أخرى"]},
            "التكامل::اختيار التعويض المناسب": {current:["أحتار في التعويض","أختار أحياناً بشكل صحيح","أختار التعويض غالباً","أخرى"], target:["اختيار التعويض المناسب بسرعة","تقليل الأخطاء","حل مسائل متنوعة","أخرى"], commitment:["تحليل 5 مسائل","حل 10 مسائل","اختبار","أخرى"]},
            "التكامل::التكاملات المختلطة": {current:["أواجه صعوبة","أجرب أكثر من طريقة","أحل مسائل متنوعة","أخرى"], target:["تحليل التكاملات المختلطة","اختيار التسلسل المناسب","حل مسائل معقدة","أخرى"], commitment:["5 مسائل","10 مسائل","تحليل الحلول","اختبار","أخرى"]},
            "التكامل::اختيار أفضل طريقة": {current:["أحتار بين الطرق","أعرف بعض الطرق","أختار الطريقة المناسبة","أخرى"], target:["اختيار الطريقة مباشرة","تقليل زمن الحل","حل التكاملات المعقدة","أخرى"], commitment:["5 مسائل","10 مسائل","تحليل الحلول","اختبار","أخرى"]},
            "التكامل::تبسيط التعبيرات": {current:["أواجه صعوبة في التبسيط","أبسط تعبيرات مباشرة","أبسط قبل التكامل غالباً","أخرى"], target:["إتقان التبسيط قبل التكامل","اختيار الشكل الأنسب","تقليل خطوات الحل","أخرى"], commitment:["حل تدريبات","مراجعة القوانين","اختبار","أخرى"]},
            "التكامل::حل التكاملات المعقدة": {current:["أواجه صعوبة","أحل بعض التكاملات","أحل مسائل متنوعة","أخرى"], target:["تحليل التكاملات المعقدة","اختيار التقنية المناسبة","حل مسائل متقدمة","أخرى"], commitment:["5 مسائل","10 مسائل","تحليل الأخطاء","اختبار","أخرى"]},
            "التكامل::التحقق من الحل": {current:["لا أتحقق","أتحقق أحياناً","أتحقق دائماً","أخرى"], target:["إتقان التحقق","اكتشاف الأخطاء","زيادة الدقة","أخرى"], commitment:["التحقق من كل مسألة","تحليل الأخطاء","اختبار","أخرى"]},
            "التكامل::حل المسائل التطبيقية": {current:["أواجه صعوبة","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["تحليل المسألة","اختيار أفضل تقنية","حل مسائل معقدة","أخرى"], commitment:["5 مسائل","10 مسائل","تحليل الأخطاء","اختبار","أخرى"]},
            "التكامل::الاستعداد للتطبيقات": {current:["أحتاج مراجعة","أعرف التقنيات","أشعر بالاستعداد","أخرى"], target:["إتقان تقنيات التكامل","الاستعداد للتطبيقات","حل المسائل المتقدمة","أخرى"], commitment:["مراجعة يومية","اختبار أسبوعي","تحليل الأخطاء","مراجعة نقاط الضعف","أخرى"]},
            "التكامل::مراجعة التكامل المحدد": {current:["أحتاج مراجعة","أعرف الأساسيات","أحل مسائل محددة","أخرى"], target:["استرجاع مفاهيم التكامل المحدد","الاستعداد للتطبيقات الهندسية","تقوية الأساس","أخرى"], commitment:["15 دقيقة مراجعة","30 دقيقة مراجعة","حل تدريبات","اختبار","أخرى"]},
            "التكامل::مراجعة تقنيات التكامل": {current:["أحتاج مراجعة","أعرف بعض التقنيات","أختار التقنية غالباً","أخرى"], target:["إتقان تقنيات التكامل","اختيار الطريقة المناسبة","الاستعداد للتطبيقات","أخرى"], commitment:["حل تدريبات","تحليل طرق الحل","اختبار","مراجعة","أخرى"]},
            "التكامل::التطبيقات الهندسية": {current:["لا أعرف التطبيقات","أعرف بعض الأفكار","أحل مسائل بسيطة","أخرى"], target:["إتقان التطبيقات","حل المسائل","ربط التكامل بالهندسة","أخرى"], commitment:["5 مسائل","10 مسائل","اختبار","مراجعة","أخرى"]},
            "التكامل::فكرة حساب المساحات": {current:["لا أعرف الفكرة","أفهم المساحات البسيطة","أربط المساحة بالتكامل","أخرى"], target:["فهم فكرة حساب المساحات","تفسير النتائج بيانياً","الاستعداد لمساحات أكثر تعقيداً","أخرى"], commitment:["حل أمثلة","رسم بياني","اختبار سريع","أخرى"]},
            "التكامل::المساحة تحت المنحنى": {current:["لا أعرف الفكرة","أحسب مساحات بسيطة","أحسب مساحات متنوعة","أخرى"], target:["إتقان المساحات","تفسير النتائج","حل التطبيقات","أخرى"], commitment:["10 مسائل","20 مسألة","اختبار","مراجعة","أخرى"]},
            "التكامل::المساحة فوق المنحنى": {current:["لا أعرف الفكرة","أحسب حالات بسيطة","أحل مسائل متنوعة","أخرى"], target:["فهم الإشارة والمساحة","تفسير النتائج","حل التطبيقات","أخرى"], commitment:["10 مسائل","حل تدريبات","اختبار","مراجعة","أخرى"]},
            "التكامل::المساحة بين منحنيين": {current:["لا أعرف الطريقة","أطبق الفكرة","أحل مسائل متنوعة","أخرى"], target:["إتقان الطريقة","اختيار الدالة المناسبة","حل التطبيقات","أخرى"], commitment:["10 تدريبات","حل مسائل","اختبار","أخرى"]},
            "التكامل::المساحات متعددة المنحنيات": {current:["أواجه صعوبة","أحدد بعض المناطق","أحل مسائل بسيطة","أخرى"], target:["تحليل المناطق المعقدة","اختيار الحدود المناسبة","حل مسائل متنوعة","أخرى"], commitment:["5 مسائل","10 مسائل","تحليل الرسوم","اختبار","أخرى"]},
            "التكامل::اختيار حدود التكامل": {current:["أواجه صعوبة","أحدد الحدود البسيطة","أحدد الحدود المعقدة","أخرى"], target:["اختيار الحدود الصحيحة","زيادة الدقة","حل التطبيقات","أخرى"], commitment:["حل تدريبات","تحليل الرسوم","اختبار","أخرى"]},
            "التكامل::حساب الحجوم": {current:["لا أعرف الفكرة","أحسب حجوماً بسيطة","أحل مسائل متنوعة","أخرى"], target:["فهم حساب الحجوم بالتكامل","اختيار الطريقة المناسبة","حل التطبيقات","أخرى"], commitment:["10 مسائل","حل تدريبات","اختبار","أخرى"]},
            "التكامل::طريقة الأقراص": {current:["لا أعرفها","أفهم الفكرة","أطبق القانون","أخرى"], target:["إتقان الطريقة","حل المسائل","اختيار الطريقة المناسبة","أخرى"], commitment:["10 مسائل","20 مسألة","اختبار","أخرى"]},
            "التكامل::طريقة الغسالات": {current:["لا أعرفها","أعرف القانون","أطبق الطريقة","أخرى"], target:["إتقان الطريقة","حل التطبيقات","زيادة السرعة","أخرى"], commitment:["حل تدريبات","اختبار","مراجعة","أخرى"]},
            "التكامل::طريقة القشور الأسطوانية": {current:["لا أعرفها","أفهم الفكرة","أطبق الطريقة","أخرى"], target:["إتقان الطريقة","اختيارها عند الحاجة","حل المسائل","أخرى"], commitment:["10 تدريبات","حل مسائل","اختبار","أخرى"]},
            "التكامل::اختيار طريقة الحجم المناسبة": {current:["أحتار بين الطرق","أعرف بعض الطرق","أختار الطريقة المناسبة","أخرى"], target:["اختيار الطريقة مباشرة","تقليل الأخطاء","زيادة السرعة","أخرى"], commitment:["5 مسائل","10 مسائل","تحليل الحلول","اختبار","أخرى"]},
            "التكامل::حجوم المجسمات الدورانية": {current:["لا أعرفها","أفهم الفكرة","أحل مسائل بسيطة","أخرى"], target:["إتقان الحجوم الدورانية","اختيار النموذج المناسب","حل تطبيقات متنوعة","أخرى"], commitment:["10 مسائل","حل تدريبات","اختبار","أخرى"]},
            "التكامل::مساحات الأسطح الدورانية": {current:["لا أعرفها","أعرف المفهوم","أحل مسائل بسيطة","أخرى"], target:["إتقان المساحات","حل التطبيقات","زيادة الدقة","أخرى"], commitment:["حل تدريبات","اختبار","مراجعة","أخرى"]},
            "التكامل::أطوال الأقواس": {current:["لا أعرفها","أفهم الفكرة","أحل مسائل متنوعة","أخرى"], target:["إتقان الحساب","حل التطبيقات","زيادة السرعة","أخرى"], commitment:["10 تدريبات","حل مسائل","اختبار","أخرى"]},
            "التكامل::المساحات القطبية الأساسية": {current:["لا أعرفها","أفهم الفكرة جزئياً","أحل مسائل بسيطة","أخرى"], target:["فهم المساحات القطبية","حل مسائل أساسية","الاستعداد للتطبيقات المتقدمة","أخرى"], commitment:["حل تدريبات","رسم منحنيات","اختبار","أخرى"]},
            "التكامل::الحجوم التطبيقية": {current:["لا أعرف التطبيقات","أطبق بعض القوانين","أحل مسائل متنوعة","أخرى"], target:["حل مسائل الحجوم التطبيقية","اختيار الطريقة المناسبة","تفسير النتائج","أخرى"], commitment:["5 مسائل","10 مسائل","تحليل التطبيقات","اختبار","أخرى"]},
            "التكامل::التطبيقات الفيزيائية الأساسية": {current:["أعرف بعض التطبيقات","أطبق بعض الأفكار","أحل مسائل متنوعة","أخرى"], target:["حل التطبيقات","ربط التكامل بالفيزياء","ربط التكامل بالهندسة","أخرى"], commitment:["5 مسائل","10 مسائل","تحليل التطبيقات","اختبار","أخرى"]},
            "التكامل::التطبيقات الهندسية الأساسية": {current:["أعرف بعض التطبيقات","أطبق بعض الأفكار","أحل مسائل متنوعة","أخرى"], target:["حل التطبيقات الهندسية","ربط التكامل بالهندسة","اختيار النموذج المناسب","أخرى"], commitment:["5 مسائل","10 مسائل","تحليل التطبيقات","اختبار","أخرى"]},
            "التكامل::اختيار النموذج المناسب": {current:["أواجه صعوبة","أختار النموذج أحياناً","أختار النموذج غالباً","أخرى"], target:["اختيار النموذج المناسب بسرعة","تقليل الأخطاء","حل تطبيقات معقدة","أخرى"], commitment:["تحليل 5 مسائل","حل 10 مسائل","اختبار","أخرى"]},
            "التكامل::تحليل الرسوم البيانية": {current:["أواجه صعوبة","أفهم الرسوم البسيطة","أحلل الرسوم غالباً","أخرى"], target:["تحليل الرسوم بدقة","استخراج الحدود والمساحات","تفسير النتائج","أخرى"], commitment:["رسم يومي","حل تدريبات","اختبار","أخرى"]},
            "التكامل::الاستعداد للتطبيقات المتقدمة": {current:["أحتاج مراجعة","أعرف الأساسيات","أشعر بالاستعداد","أخرى"], target:["إتقان التطبيقات","الاستعداد للموضوعات المتقدمة","حل التطبيقات المعقدة","أخرى"], commitment:["مراجعة يومية","اختبار أسبوعي","تحليل الأخطاء","مراجعة نقاط الضعف","أخرى"]},
            "التكامل::مراجعة التطبيقات الأساسية": {current:["أحتاج مراجعة","أعرف الأساسيات","أحل تطبيقات بسيطة","أخرى"], target:["استرجاع التطبيقات الأساسية","ربط التكامل بالتطبيقات المتقدمة","زيادة الجاهزية","أخرى"], commitment:["15 دقيقة مراجعة","30 دقيقة مراجعة","حل تدريبات","اختبار","أخرى"]},
            "التكامل::التطبيقات الفيزيائية": {current:["لا أعرف التطبيقات","أعرف المفاهيم","أطبق القوانين","أخرى"], target:["إتقان التطبيقات","حل مسائل متنوعة","ربط التكامل بالفيزياء","أخرى"], commitment:["5 مسائل","10 مسائل","اختبار","مراجعة","أخرى"]},
            "التكامل::الإزاحة": {current:["لا أعرف العلاقة","أفهم الفكرة","أحل مسائل بسيطة","أخرى"], target:["ربط الإزاحة بالتكامل","حل مسائل الحركة","تفسير النتائج","أخرى"], commitment:["حل تدريبات","رسم مخطط","اختبار","أخرى"]},
            "التكامل::المسافة": {current:["لا أعرف الفرق بين المسافة والإزاحة","أحل مسائل مباشرة","أحل مسائل متنوعة","أخرى"], target:["حساب المسافة بدقة","تحليل الحركة","حل مسائل تطبيقية","أخرى"], commitment:["5 مسائل","10 مسائل","تحليل الأخطاء","أخرى"]},
            "التكامل::السرعة": {current:["أعرف المفهوم فقط","أربط السرعة بالتغير","أستخدم التكامل في مسائل بسيطة","أخرى"], target:["ربط السرعة بالإزاحة","حل مسائل الحركة","زيادة الدقة","أخرى"], commitment:["حل مسائل","مراجعة القوانين","اختبار","أخرى"]},
            "التكامل::التسارع": {current:["أعرف المفهوم فقط","أربطه بالسرعة","أحل مسائل بسيطة","أخرى"], target:["ربط التسارع بالسرعة والمسافة","حل مسائل متنوعة","تفسير النتائج","أخرى"], commitment:["حل تدريبات","تحليل رسوم","اختبار","أخرى"]},
            "التكامل::الشغل": {current:["لا أعرف المفهوم","أفهم العلاقة","أحل مسائل متنوعة","أخرى"], target:["إتقان تطبيقات الشغل","حل مسائل فيزيائية","ربط المفاهيم","أخرى"], commitment:["10 تدريبات","اختبار","مراجعة","أخرى"]},
            "التكامل::القوة المتغيرة": {current:["لا أعرف الفكرة","أفهم القوة الثابتة فقط","أحل مسائل بسيطة","أخرى"], target:["حساب الشغل مع القوة المتغيرة","اختيار النموذج المناسب","حل مسائل تطبيقية","أخرى"], commitment:["حل تدريبات","رسم العلاقة","اختبار","أخرى"]},
            "التكامل::الضغط": {current:["لا أعرف التطبيق","أفهم المفهوم الفيزيائي","أحل مسائل بسيطة","أخرى"], target:["ربط الضغط بالتكامل","حل تطبيقات فيزيائية","زيادة الدقة","أخرى"], commitment:["5 مسائل","مراجعة المفهوم","اختبار","أخرى"]},
            "التكامل::السوائل": {current:["لا أعرف تطبيقات السوائل","أفهم الأساسيات","أحل مسائل بسيطة","أخرى"], target:["حل مسائل السوائل","ربط التكامل بالضغط والكثافة","إتقان التطبيقات","أخرى"], commitment:["حل تدريبات","تحليل نموذج","اختبار","أخرى"]},
            "التكامل::مركز الكتلة": {current:["لا أعرفه","أفهم الفكرة","أطبق القانون","أخرى"], target:["إتقان الحساب","حل التطبيقات","زيادة الدقة","أخرى"], commitment:["حل تدريبات","اختبار","مراجعة","أخرى"]},
            "التكامل::عزم القصور": {current:["لا أعرف المفهوم","أعرف الفكرة العامة","أحل مسائل بسيطة","أخرى"], target:["فهم عزم القصور","حل تطبيقات فيزيائية","ربط التكامل بالدوران","أخرى"], commitment:["حل مسائل","مراجعة القوانين","اختبار","أخرى"]},
            "التكامل::الطاقة": {current:["أعرف بعض المفاهيم","أربط الطاقة بالشغل جزئياً","أحل مسائل بسيطة","أخرى"], target:["ربط التكامل بالطاقة","حل مسائل فيزيائية","تفسير النتائج","أخرى"], commitment:["5 مسائل","10 مسائل","تحليل الأخطاء","أخرى"]},
            "التكامل::الأحمال": {current:["لا أعرف نماذج الأحمال","أفهم الفكرة العامة","أحل مسائل بسيطة","أخرى"], target:["تحليل الأحمال","ربطها بالتكامل","حل تطبيقات هندسية","أخرى"], commitment:["حل تدريبات","رسم نموذج","اختبار","أخرى"]},
            "التكامل::الكثافة": {current:["أعرف المفهوم فقط","أستخدم كثافة ثابتة","أتعامل مع كثافة متغيرة","أخرى"], target:["استخدام الكثافة في التكامل","حل مسائل كتلة ومركز كتلة","زيادة الدقة","أخرى"], commitment:["حل مسائل","مراجعة الوحدات","اختبار","أخرى"]},
            "التكامل::مراكز المساحات": {current:["لا أعرفها","أفهم الفكرة","أحل مسائل بسيطة","أخرى"], target:["حساب مراكز المساحات","حل تطبيقات هندسية","إتقان الخطوات","أخرى"], commitment:["حل تدريبات","تحليل الرسوم","اختبار","أخرى"]},
            "التكامل::تصميم المقاطع": {current:["لا أعرف التطبيق","أفهم بعض المفاهيم","أحل مسائل بسيطة","أخرى"], target:["ربط التكامل بتصميم المقاطع","حل تطبيقات هندسية","تفسير النتائج","أخرى"], commitment:["5 مسائل","تحليل نموذج","اختبار","أخرى"]},
            "التكامل::الحجوم الهندسية": {current:["أعرف الحجوم الأساسية","أحل حجوماً بسيطة","أحل تطبيقات متنوعة","أخرى"], target:["إتقان الحجوم الهندسية","اختيار طريقة الحساب","حل تطبيقات متقدمة","أخرى"], commitment:["10 مسائل","حل تدريبات","اختبار","أخرى"]},
            "التكامل::التطبيقات الاقتصادية": {current:["لا أعرفها","أفهم المفاهيم","أحل مسائل بسيطة","أخرى"], target:["إتقان التطبيقات","تحليل المسائل","حل التطبيقات","أخرى"], commitment:["5 مسائل","10 مسائل","اختبار","أخرى"]},
            "التكامل::التكلفة الكلية": {current:["لا أعرف العلاقة","أفهم التكلفة الحدية","أحل مسائل بسيطة","أخرى"], target:["استخراج التكلفة الكلية","تحليل النماذج الاقتصادية","حل مسائل متنوعة","أخرى"], commitment:["حل تدريبات","مراجعة القوانين","اختبار","أخرى"]},
            "التكامل::الإيراد الكلي": {current:["لا أعرف العلاقة","أفهم الإيراد الحدي","أحل مسائل بسيطة","أخرى"], target:["استخراج الإيراد الكلي","تحليل النماذج","حل التطبيقات","أخرى"], commitment:["5 مسائل","10 مسائل","اختبار","أخرى"]},
            "التكامل::الربح الكلي": {current:["لا أعرف العلاقة","أفهم الربح الحدي","أحل مسائل بسيطة","أخرى"], target:["حساب الربح الكلي","ربط التكلفة بالإيراد","حل تطبيقات اقتصادية","أخرى"], commitment:["حل تدريبات","تحليل أخطاء","اختبار","أخرى"]},
            "التكامل::الفائض الاستهلاكي": {current:["لا أعرفه","أفهم الفكرة العامة","أحل مسائل بسيطة","أخرى"], target:["فهم الفائض الاستهلاكي","حساب المساحات الاقتصادية","تحليل النتائج","أخرى"], commitment:["حل مسائل","رسم بياني","اختبار","أخرى"]},
            "التكامل::الفائض الإنتاجي": {current:["لا أعرفه","أفهم الفكرة العامة","أحل مسائل بسيطة","أخرى"], target:["فهم الفائض الإنتاجي","حساب المساحات الاقتصادية","تحليل النتائج","أخرى"], commitment:["حل مسائل","رسم بياني","اختبار","أخرى"]},
            "التكامل::معدلات النمو": {current:["لا أعرف العلاقة","أفهم المفهوم","أحل مسائل بسيطة","أخرى"], target:["ربط معدلات النمو بالتكامل","تحليل النماذج","حل تطبيقات متنوعة","أخرى"], commitment:["حل تدريبات","تلخيص النموذج","اختبار","أخرى"]},
            "التكامل::التطبيقات الإحصائية": {current:["لا أعرف التطبيقات","أعرف بعض المفاهيم","أحل مسائل بسيطة","أخرى"], target:["ربط التكامل بالإحصاء","حل تطبيقات التوزيعات","تفسير النتائج","أخرى"], commitment:["5 مسائل","10 مسائل","مراجعة","أخرى"]},
            "التكامل::القيم المتوسطة": {current:["لا أعرفها","أفهم الفكرة","أحسب أمثلة بسيطة","أخرى"], target:["حساب القيمة المتوسطة للدوال","تفسير النتائج","حل تطبيقات متنوعة","أخرى"], commitment:["حل تدريبات","اختبار","مراجعة","أخرى"]},
            "التكامل::التوزيعات المستمرة": {current:["لا أعرفها","أعرف الفكرة العامة","أحل مسائل بسيطة","أخرى"], target:["فهم التوزيعات المستمرة","ربط الاحتمال بالتكامل","حل تطبيقات إحصائية","أخرى"], commitment:["حل مسائل","رسم منحنيات","اختبار","أخرى"]},
            "التكامل::التطبيقات الحاسوبية": {current:["لا أعرفها","أفهم الفكرة العامة","أطبق أمثلة بسيطة","أخرى"], target:["ربط التكامل بالنماذج الحاسوبية","تحليل البيانات","حل مشكلات تطبيقية","أخرى"], commitment:["تطبيق عملي","تحليل نموذج","اختبار","أخرى"]},
            "التكامل::تقريب البيانات": {current:["لا أعرف الطريقة","أقرب بيانات بسيطة","أحل مسائل متنوعة","أخرى"], target:["تقريب البيانات بالتكامل","تحليل النتائج","تحسين الدقة","أخرى"], commitment:["تطبيق عملي","حل تدريبات","اختبار","أخرى"]},
            "التكامل::تحليل النماذج": {current:["أواجه صعوبة","أفهم بعض النماذج","أحلل نماذج بسيطة","أخرى"], target:["تحليل النماذج بوضوح","اختيار التكامل المناسب","تفسير النتائج","أخرى"], commitment:["تحليل نموذج","حل 5 مسائل","مراجعة","أخرى"]},
            "التكامل::التفسير الفيزيائي": {current:["أحفظ القوانين فقط","أفهم التفسير جزئياً","أفسر النتائج غالباً","أخرى"], target:["تفسير التكامل فيزيائياً","ربط النتائج بالواقع","حل مسائل بثقة","أخرى"], commitment:["تلخيص المفهوم","حل تطبيقات","اختبار","أخرى"]},
            "التكامل::التفسير الهندسي": {current:["أفهم الرسم جزئياً","أربط المساحة بالتكامل","أفسر النتائج غالباً","أخرى"], target:["تفسير التكامل هندسياً","تحليل الرسوم بدقة","حل تطبيقات هندسية","أخرى"], commitment:["رسم يومي","حل تدريبات","اختبار","أخرى"]},
            "التكامل::التفسير الاقتصادي": {current:["لا أعرفه","أفهم بعض المفاهيم","أفسر مسائل بسيطة","أخرى"], target:["تفسير التكامل اقتصادياً","تحليل المساحات الاقتصادية","حل تطبيقات اقتصادية","أخرى"], commitment:["رسم بياني","حل مسائل","اختبار","أخرى"]},
            "التكامل::الاستعداد للتطبيقات الجامعية": {current:["أحتاج مراجعة","أعرف الأساسيات","أشعر بالاستعداد","أخرى"], target:["إتقان التطبيقات","الاستعداد الجامعي","حل المسائل المتقدمة","أخرى"], commitment:["مراجعة يومية","اختبار أسبوعي","تحليل الأخطاء","مراجعة نقاط الضعف","أخرى"]},
            "التكامل::فكرة التكامل العددي": {current:["لا أعرف الفكرة","أفهم المفهوم","أطبق التقريبات","أخرى"], target:["فهم التكامل العددي","إتقان التقريبات","حل التطبيقات","أخرى"], commitment:["قراءة المفهوم","حل أمثلة","تلخيص","اختبار","أخرى"]},
            "التكامل::أسباب استخدام التقريب العددي": {current:["لا أعرف الأسباب","أفهم بعض الحالات","أميز متى نحتاج التقريب","أخرى"], target:["فهم أسباب التقريب العددي","اختيار التقريب عند الحاجة","ربط التقريب بالتطبيقات","أخرى"], commitment:["قراءة المفهوم","حل أمثلة","تلخيص","اختبار","أخرى"]},
            "التكامل::مفهوم الخطأ العددي": {current:["لا أعرف مفهوم الخطأ","أفهم الفكرة جزئياً","أحسب أخطاء بسيطة","أخرى"], target:["فهم الخطأ العددي","تحليل دقة التقريب","تقليل الخطأ","أخرى"], commitment:["حل تدريبات","مقارنة النتائج","اختبار","أخرى"]},
            "التكامل::التقريب الهندسي": {current:["لا أعرف الفكرة","أفهم الرسم تقريبياً","أربط التقريب بالمساحات","أخرى"], target:["فهم التقريب الهندسي","تحليل المساحات تقريبياً","اختيار النموذج المناسب","أخرى"], commitment:["رسم تقريبي","حل أمثلة","اختبار","أخرى"]},
            "التكامل::قاعدة المستطيلات": {current:["لا أعرفها","أعرف الفكرة","أطبقها","أخرى"], target:["إتقان الطريقة","حل المسائل","زيادة الدقة","أخرى"], commitment:["10 تدريبات","20 تدريباً","اختبار","أخرى"]},
            "التكامل::قاعدة نقطة المنتصف": {current:["لا أعرفها","أطبقها","أحل مسائل متنوعة","أخرى"], target:["إتقان الطريقة","حل التطبيقات","زيادة الدقة","أخرى"], commitment:["حل تدريبات","اختبار","أخرى"]},
            "التكامل::قاعدة شبه المنحرف": {current:["لا أعرفها","أعرف القانون","أطبق الطريقة","أخرى"], target:["إتقان الطريقة","حل المسائل","اختيارها عند الحاجة","أخرى"], commitment:["10 مسائل","20 مسألة","اختبار","أخرى"]},
            "التكامل::قاعدة شبه المنحرف المركبة": {current:["لا أعرفها","أطبق القاعدة البسيطة","أحل مسائل مركبة","أخرى"], target:["إتقان القاعدة المركبة","تقسيم الفترات بدقة","تحسين التقريب","أخرى"], commitment:["حل تدريبات","مقارنة النتائج","اختبار","أخرى"]},
            "التكامل::قاعدة سمبسون": {current:["لا أعرفها","أعرف الفكرة","أطبقها","أخرى"], target:["إتقان الطريقة","زيادة الدقة","حل التطبيقات","أخرى"], commitment:["حل تدريبات","اختبار","مراجعة","أخرى"]},
            "التكامل::قاعدة سمبسون المركبة": {current:["لا أعرفها","أطبق قاعدة سمبسون البسيطة","أحل مسائل مركبة","أخرى"], target:["إتقان القاعدة المركبة","تحسين الدقة","حل تطبيقات عددية","أخرى"], commitment:["حل تدريبات","مقارنة الطرق","اختبار","أخرى"]},
            "التكامل::مقارنة طرق التقريب": {current:["لا أعرف الفروق","أعرف بعض الفروق","أختار الطريقة المناسبة","أخرى"], target:["اختيار الطريقة المثلى","تقليل الخطأ","زيادة الدقة","أخرى"], commitment:["تحليل مسائل","مقارنة الحلول","اختبار","أخرى"]},
            "التكامل::اختيار الطريقة المناسبة": {current:["أحتار بين الطرق","أعرف بعض الطرق","أختار الطريقة غالباً","أخرى"], target:["اختيار الطريقة المناسبة بسرعة","تقليل الأخطاء","حل تطبيقات متنوعة","أخرى"], commitment:["تحليل مسائل","مقارنة الحلول","اختبار","أخرى"]},
            "التكامل::تقسيم الفترات": {current:["لا أعرف أثر التقسيم","أقسم الفترات بمساعدة","أقسمها بدقة غالباً","أخرى"], target:["إتقان تقسيم الفترات","تحسين الدقة","تقليل الخطأ","أخرى"], commitment:["حل تدريبات","رسم الجداول","اختبار","أخرى"]},
            "التكامل::زيادة الدقة": {current:["لا أعرف كيف أزيد الدقة","أجرب زيادة الفترات","أحلل النتائج أحياناً","أخرى"], target:["تحسين دقة التقريب","اختيار عدد الفترات المناسب","تحليل النتائج","أخرى"], commitment:["مقارنة النتائج","حل مسائل","اختبار","أخرى"]},
            "التكامل::تقدير الخطأ": {current:["لا أعرفه","أفهم الفكرة","أحسب الخطأ","أخرى"], target:["إتقان تقدير الخطأ","تحسين الحلول","تحليل النتائج","أخرى"], commitment:["حل تدريبات","اختبار","مراجعة","أخرى"]},
            "التكامل::تحليل التقارب": {current:["لا أعرف التقارب","ألاحظ تحسن النتائج","أحلل التقارب جزئياً","أخرى"], target:["فهم التقارب","تحليل تحسن التقريب","ربط التقارب بالدقة","أخرى"], commitment:["تحليل جداول","مقارنة نتائج","اختبار","أخرى"]},
            "التكامل::التكامل العددي باستخدام الحاسوب": {current:["لا أستخدم الحاسوب في التكامل","أطبق أمثلة بسيطة","أحل مسائل عددية برمجياً","أخرى"], target:["تطبيق التكامل العددي حاسوبياً","تحليل البيانات","حل تطبيقات عملية","أخرى"], commitment:["تطبيق عملي","حل مسائل","اختبار","أخرى"]},
            "التكامل::تحليل النتائج": {current:["أحسب فقط دون تحليل","أفسر بعض النتائج","أحلل النتائج غالباً","أخرى"], target:["تحليل النتائج بدقة","تفسير الخطأ والدقة","اختيار الحل الأفضل","أخرى"], commitment:["تحليل مسائل","مقارنة نتائج","اختبار","أخرى"]},
            "التكامل::مقارنة الحل العددي بالحل التحليلي": {current:["لا أعرف الفرق","أقارن أحياناً","أحلل النتائج","أخرى"], target:["إتقان المقارنة","تحليل الدقة","اختيار الطريقة المناسبة","أخرى"], commitment:["تحليل مسائل","مقارنة النتائج","اختبار","أخرى"]},
            "التكامل::الاستعداد للرياضيات التطبيقية": {current:["أحتاج مراجعة","أعرف الأساسيات","أشعر بالاستعداد","أخرى"], target:["إتقان التكامل العددي","الاستعداد للرياضيات التطبيقية","حل التطبيقات المتقدمة","أخرى"], commitment:["مراجعة يومية","اختبار أسبوعي","تحليل الأخطاء","مراجعة نقاط الضعف","أخرى"]},
            "التكامل::مراجعة شاملة للتكامل": {current:["أحتاج مراجعة","أراجع بعض الأجزاء","أراجع المنهج كاملاً","أخرى"], target:["إتقان التكامل","الاستعداد للاختبار","تحقيق درجة عالية","أخرى"], commitment:["مراجعة يومية","مراجعة أسبوعية","اختبار شامل","تحليل نقاط الضعف","أخرى"] },
            "التكامل::التكاملات غير الصحيحة": {current:["لا أعرفها","أعرف الفكرة","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان المفهوم","إتقان الحل","تحليل التقارب","حل المسائل","أخرى"], commitment:["10 تدريبات","20 تدريباً","اختبار","مراجعة","أخرى"] },
            "التكامل::تكاملات الحدود اللانهائية": {current:["لا أعرفها","أعرف الفكرة","أحل مسائل بسيطة","أخرى"], target:["إتقان تكاملات الحدود اللانهائية","تحليل التقارب","حل المسائل","أخرى"], commitment:["حل تدريبات","اختبار","مراجعة","أخرى"] },
            "التكامل::تكاملات الدوال غير المستمرة": {current:["لا أعرفها","أعرف الفكرة","أحل مسائل بسيطة","أخرى"], target:["إتقان التعامل مع عدم الاستمرارية","تحليل التقارب","حل المسائل","أخرى"], commitment:["حل تدريبات","اختبار","مراجعة","أخرى"] },
            "التكامل::اختبار تقارب التكامل": {current:["لا أعرفه","أفهم الفكرة","أطبقه","أخرى"], target:["إتقان الاختبار","تحليل النتائج","حل المسائل","أخرى"], commitment:["حل تدريبات","اختبار","أخرى"] },
            "التكامل::التكاملات الخاصة": {current:["لا أعرفها","أعرف بعض الأنواع","أحل مسائل بسيطة","أخرى"], target:["فهم التكاملات الخاصة","اختيار طريقة الحل المناسبة","حل مسائل متنوعة","أخرى"], commitment:["حل تدريبات","مراجعة القوانين","اختبار","أخرى"] },
            "التكامل::اختيار طريقة الحل": {current:["أحتار بين الطرق","أعرف بعض الطرق","أختار الطريقة المناسبة غالباً","أخرى"], target:["اختيار الاستراتيجية المناسبة","تقليل وقت الحل","زيادة الدقة","أخرى"], commitment:["تحليل 5 مسائل","تحليل 10 مسائل","اختبار","أخرى"] },
            "التكامل::دمج تقنيات التكامل": {current:["أستخدم طريقة واحدة","أستخدم عدة طرق","أختار أفضل طريقة","أخرى"], target:["اختيار التقنية المناسبة","حل التكاملات المعقدة","زيادة السرعة","أخرى"], commitment:["5 مسائل","10 مسائل","تحليل الحلول","اختبار","أخرى"] },
            "التكامل::التكاملات المركبة": {current:["أواجه صعوبة","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["تحليل التكاملات المركبة","دمج التقنيات بوضوح","حل مسائل متقدمة","أخرى"], commitment:["5 مسائل","10 مسائل","تحليل الحلول","اختبار","أخرى"] },
            "التكامل::التكاملات التطبيقية المتقدمة": {current:["أعرف بعض التطبيقات","أحل تطبيقات بسيطة","أحل تطبيقات متنوعة","أخرى"], target:["إتقان التطبيقات المتقدمة","اختيار النموذج المناسب","تحليل النتائج","أخرى"], commitment:["5 مسائل","10 مسائل","اختبار","أخرى"] },
            "التكامل::تحليل المسائل المعقدة": {current:["أواجه صعوبة","أفهم بعض المعطيات","أحل مسائل متنوعة","أخرى"], target:["تحليل المسائل بدقة","تقسيم الحل إلى خطوات","حل مسائل معقدة","أخرى"], commitment:["تحليل مسائل","مراجعة الأخطاء","اختبار","أخرى"] },
            "التكامل::اختيار الاستراتيجية المناسبة": {current:["أختار عشوائياً","أميز بعض الاستراتيجيات","أختار غالباً بشكل صحيح","أخرى"], target:["اختيار الاستراتيجية بسرعة","تقليل الأخطاء","حل مسائل متقدمة","أخرى"], commitment:["تحليل 5 مسائل","تحليل 10 مسائل","اختبار","أخرى"] },
            "التكامل::الربط بين فروع التكامل": {current:["أتعلم الأجزاء منفصلة","أربط بعض المفاهيم","أفهم العلاقات غالباً","أخرى"], target:["ربط فروع التكامل","فهم الصورة الكاملة","حل مسائل شاملة","أخرى"], commitment:["مراجعة خريطة المفاهيم","حل مسائل شاملة","اختبار","أخرى"] },
            "التكامل::حل المسائل متعددة الخطوات": {current:["أواجه صعوبة","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["تحليل المسألة","تقسيمها إلى خطوات","حل المسائل المعقدة","أخرى"], commitment:["5 مسائل","10 مسائل","تحليل الأخطاء","اختبار","أخرى"] },
            "التكامل::حل المسائل الجامعية": {current:["أحتاج مراجعة","أحل مسائل بسيطة","أحل مسائل جامعية متنوعة","أخرى"], target:["حل مسائل جامعية بثقة","الاستعداد للمقررات المتقدمة","تقليل الأخطاء","أخرى"], commitment:["حل مسائل متقدمة","اختبار أسبوعي","تحليل الأخطاء","أخرى"] },
            "التكامل::حل المسائل الهندسية": {current:["أعرف بعض الأفكار","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["ربط التكامل بالهندسة","حل مسائل هندسية متقدمة","تحليل النتائج","أخرى"], commitment:["5 مسائل","10 مسائل","اختبار","أخرى"] },
            "التكامل::حل المسائل الفيزيائية": {current:["أعرف بعض التطبيقات","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["ربط التكامل بالفيزياء","حل مسائل فيزيائية متقدمة","تفسير النتائج","أخرى"], commitment:["5 مسائل","10 مسائل","اختبار","أخرى"] },
            "التكامل::حل المسائل الحاسوبية": {current:["لا أربط التكامل بالحاسوب","أطبق أمثلة بسيطة","أحل مسائل حاسوبية متنوعة","أخرى"], target:["ربط التكامل بالحوسبة","تحليل النماذج","حل مسائل تطبيقية","أخرى"], commitment:["تطبيق عملي","تحليل نتائج","اختبار","أخرى"] },
            "التكامل::التطبيقات الواقعية": {current:["أعرف بعض التطبيقات","أطبق بعض الأفكار","أحل مسائل متنوعة","أخرى"], target:["ربط التكامل بالواقع","حل التطبيقات","تحليل النتائج","أخرى"], commitment:["5 مسائل","10 مسائل","اختبار","أخرى"] },
            "التكامل::المراجعة النهائية": {current:["أحتاج مراجعة","أراجع بعض الأجزاء","أراجع المنهج كاملاً","أخرى"], target:["إتقان التكامل","الاستعداد للاختبار","تحقيق درجة عالية","أخرى"], commitment:["مراجعة يومية","مراجعة أسبوعية","اختبار شامل","تحليل نقاط الضعف","أخرى"] },
            "التكامل::تحليل الأخطاء الشائعة": {current:["أكرر الأخطاء","أعرف بعض الأخطاء","أتعلم منها","أخرى"], target:["تقليل الأخطاء","زيادة الدقة","تحسين الأداء","أخرى"], commitment:["مراجعة الأخطاء","تحليل الحلول","اختبار","أخرى"] },
            "التكامل::بناء خطة مراجعة": {current:["لا أملك خطة","لدي خطة بسيطة","أراجع وفق خطة","أخرى"], target:["بناء خطة مراجعة واضحة","تغطية جميع الأجزاء","تحسين الاستعداد","أخرى"], commitment:["تحديث الخطة","مراجعة يومية","اختبار أسبوعي","أخرى"] },
            "التكامل::اختبار شامل": {current:["لم أحل اختباراً شاملاً","أحل اختبارات متوسطة","أحل اختبارات كاملة","أخرى"], target:["تحسين الدرجة","تقليل الأخطاء","إتقان التكامل","أخرى"], commitment:["اختبار شامل","تحليل الأخطاء","مراجعة نقاط الضعف","أخرى"] },
            "التكامل::الاستعداد للاختبارات النهائية": {current:["أحتاج مراجعة","أحل اختبارات قصيرة","أحل اختبارات كاملة","أخرى"], target:["الاستعداد الكامل","تحسين الدرجة","اجتياز الاختبار بثقة","أخرى"], commitment:["اختبار أسبوعي","اختبار تجريبي","تحليل الأخطاء","مراجعة نقاط الضعف","أخرى"] },
            "التكامل::الاستعداد للرياضيات الجامعية": {current:["أحتاج مراجعة","أعرف الأساسيات","أشعر بالاستعداد","أخرى"], target:["إتقان التكامل","الاستعداد للمقررات الجامعية","الاستعداد للرياضيات المتقدمة","أخرى"], commitment:["مراجعة يومية","حل مسائل متقدمة","اختبار أسبوعي","تحليل الأخطاء","أخرى"] },
            "التكامل::الاستعداد للمقررات المتقدمة": {current:["أحتاج مراجعة","أفهم الأساسيات","أشعر بالاستعداد","أخرى"], target:["الاستعداد للمقررات المتقدمة","حل المسائل الجامعية","بناء أساس قوي","أخرى"], commitment:["مراجعة يومية","حل مسائل متقدمة","تحليل الأخطاء","أخرى"] },
            "التكامل::أخرى": {current:["أحتاج تحديد الموضوع","بدأت المراجعة","أحل تدريبات","أحتاج خطة واضحة","أخرى"], target:["بناء أساس قوي في التكامل","إتقان المسار المختار","الاستعداد للتكامل المحدد","أخرى"], commitment:["تدريب يومي","مراجعة أسبوعية","اختبار ذاتي","برنامج مخصص","أخرى"]},
            "الإحصاء::مقدمة في الإحصاء": {current:["لا أعرفها", "أعرف بعض المفاهيم", "أفهم الأساسيات", "أخرى"], target:["إتقان الأساسيات", "فهم التطبيقات", "الاستعداد للجزء الثاني", "أخرى"], commitment:["15 دقيقة", "30 دقيقة", "حل أمثلة", "اختبار", "أخرى"]},
            "الإحصاء::تعريف الإحصاء": {current:["لا أعرف التعريف", "أعرف الفكرة العامة", "أفهم الأساسيات", "أخرى"], target:["فهم معنى الإحصاء", "تمييز فروع الإحصاء", "ربطه بالتطبيقات", "أخرى"], commitment:["15 دقيقة", "30 دقيقة", "حل أمثلة", "اختبار", "أخرى"]},
            "الإحصاء::أهمية الإحصاء": {current:["لا أعرف أهميته", "أعرف بعض الاستخدامات", "أفهم دوره في التحليل", "أخرى"], target:["فهم أهمية الإحصاء", "ربطه بالحياة اليومية", "ربطه بالعلوم الحديثة", "أخرى"], commitment:["15 دقيقة", "تلخيص أمثلة", "حل تطبيقات", "اختبار", "أخرى"]},
            "الإحصاء::فروع الإحصاء": {current:["لا أميز الفروع", "أميز بعضها", "أفهم الفرق بينها", "أخرى"], target:["تمييز الفروع", "فهم الإحصاء الوصفي والاستدلالي", "اختيار الفرع المناسب", "أخرى"], commitment:["10 تدريبات", "20 تدريباً", "اختبار", "أخرى"]},
            "الإحصاء::الإحصاء الوصفي": {current:["لا أعرفه", "أعرف المفهوم", "أصف بيانات بسيطة", "أخرى"], target:["إتقان الوصف الإحصائي", "تلخيص البيانات", "تفسير النتائج", "أخرى"], commitment:["10 تدريبات", "حل أمثلة", "اختبار", "أخرى"]},
            "الإحصاء::الإحصاء الاستدلالي": {current:["لا أعرفه", "أفهم الفكرة", "أميز استخدامه", "أخرى"], target:["فهم الاستدلال الإحصائي", "ربط العينة بالمجتمع", "الاستعداد للاختبارات الإحصائية", "أخرى"], commitment:["10 تدريبات", "حل أمثلة", "اختبار", "أخرى"]},
            "الإحصاء::تطبيقات الإحصاء": {current:["أعرف بعض التطبيقات", "أطبق بعضها", "أحل مسائل متنوعة", "أخرى"], target:["ربط الإحصاء بالتطبيقات", "تحليل البيانات الواقعية", "فهم دوره في التخصصات الحديثة", "أخرى"], commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "الإحصاء::البيانات": {current:["لا أميز الأنواع", "أعرف بعضها", "أميز جميع الأنواع", "أخرى"], target:["إتقان التصنيف", "تحليل البيانات", "حل التطبيقات", "أخرى"], commitment:["10 تدريبات", "20 تدريباً", "اختبار", "أخرى"]},
            "الإحصاء::تعريف البيانات": {current:["لا أعرف المفهوم", "أعرف أمثلة بسيطة", "أميز البيانات في المسائل", "أخرى"], target:["فهم معنى البيانات", "تمييز مصادرها", "استخدامها في التحليل", "أخرى"], commitment:["10 تدريبات", "حل أمثلة", "اختبار", "أخرى"]},
            "الإحصاء::مصادر البيانات": {current:["لا أعرف المصادر", "أعرف بعضها", "أميز المصدر المناسب", "أخرى"], target:["تمييز مصادر البيانات", "اختيار المصدر المناسب", "تحسين جودة التحليل", "أخرى"], commitment:["تحليل أمثلة", "اختبار", "أخرى"]},
            "الإحصاء::طرق جمع البيانات": {current:["لا أعرف الطرق", "أعرف بعضها", "أختار طريقة مناسبة", "أخرى"], target:["إتقان طرق الجمع", "اختيار الطريقة المناسبة", "تقليل التحيز", "أخرى"], commitment:["10 تدريبات", "تصميم مثال", "اختبار", "أخرى"]},
            "الإحصاء::أنواع البيانات": {current:["لا أميز الأنواع", "أميز بعضها", "أصنف البيانات بدقة", "أخرى"], target:["إتقان أنواع البيانات", "تصنيف البيانات بسرعة", "حل التطبيقات", "أخرى"], commitment:["10 تدريبات", "20 تدريباً", "اختبار", "أخرى"]},
            "الإحصاء::البيانات النوعية": {current:["لا أعرفها", "أميز أمثلة بسيطة", "أصنفها بدقة", "أخرى"], target:["فهم البيانات النوعية", "تمييز مستوياتها", "تحليل أمثلتها", "أخرى"], commitment:["10 تدريبات", "اختبار", "أخرى"]},
            "الإحصاء::البيانات الكمية": {current:["لا أعرفها", "أميز أمثلة بسيطة", "أصنفها بدقة", "أخرى"], target:["فهم البيانات الكمية", "تمييز المنفصلة والمستمرة", "حل التطبيقات", "أخرى"], commitment:["10 تدريبات", "اختبار", "أخرى"]},
            "الإحصاء::البيانات المنفصلة": {current:["لا أعرفها", "أميز أمثلة بسيطة", "أصنفها بدقة", "أخرى"], target:["إتقان البيانات المنفصلة", "تمييزها عن المستمرة", "حل التطبيقات", "أخرى"], commitment:["10 تدريبات", "اختبار", "أخرى"]},
            "الإحصاء::البيانات المستمرة": {current:["لا أعرفها", "أميز أمثلة بسيطة", "أصنفها بدقة", "أخرى"], target:["إتقان البيانات المستمرة", "تمييزها عن المنفصلة", "حل التطبيقات", "أخرى"], commitment:["10 تدريبات", "اختبار", "أخرى"]},
            "الإحصاء::المجتمع الإحصائي": {current:["لا أعرف الفرق", "أفهم المفهوم", "أطبق أمثلة", "أخرى"], target:["إتقان المفهوم", "تمييز المجتمع عن العينة", "تحليل الدراسات", "أخرى"], commitment:["10 تدريبات", "اختبار", "أخرى"]},
            "الإحصاء::العينة": {current:["لا أعرف الفرق", "أفهم المفهوم", "أطبق أمثلة", "أخرى"], target:["إتقان مفهوم العينة", "اختيار عينة مناسبة", "تحليل الدراسات", "أخرى"], commitment:["10 تدريبات", "اختبار", "أخرى"]},
            "الإحصاء::أنواع العينات": {current:["لا أعرفها", "أعرف بعضها", "أطبقها", "أخرى"], target:["إتقان الأنواع", "اختيار النوع المناسب", "تحليل الدراسات", "أخرى"], commitment:["حل تدريبات", "اختبار", "أخرى"]},
            "الإحصاء::العينة العشوائية": {current:["لا أعرفها", "أفهم الفكرة", "أميز أمثلتها", "أخرى"], target:["إتقان العينة العشوائية", "اختيارها عند الحاجة", "تقليل التحيز", "أخرى"], commitment:["حل تدريبات", "اختبار", "أخرى"]},
            "الإحصاء::العينة المنتظمة": {current:["لا أعرفها", "أفهم الفكرة", "أطبق أمثلة", "أخرى"], target:["إتقان العينة المنتظمة", "تمييز استخدامها", "حل التطبيقات", "أخرى"], commitment:["حل تدريبات", "اختبار", "أخرى"]},
            "الإحصاء::العينة الطبقية": {current:["لا أعرفها", "أفهم الفكرة", "أطبق أمثلة", "أخرى"], target:["إتقان العينة الطبقية", "اختيار الطبقات المناسبة", "تحليل الدراسات", "أخرى"], commitment:["حل تدريبات", "اختبار", "أخرى"]},
            "الإحصاء::العينة العنقودية": {current:["لا أعرفها", "أفهم الفكرة", "أميزها عن الطبقية", "أخرى"], target:["إتقان العينة العنقودية", "اختيارها عند الحاجة", "تحليل الدراسات", "أخرى"], commitment:["حل تدريبات", "اختبار", "أخرى"]},
            "الإحصاء::المتغيرات": {current:["لا أعرفها", "أميز بينها", "أطبقها", "أخرى"], target:["إتقان المفاهيم", "تحليل البيانات", "حل التطبيقات", "أخرى"], commitment:["10 تدريبات", "اختبار", "أخرى"]},
            "الإحصاء::المتغير المستقل": {current:["لا أعرفه", "أميزه أحياناً", "أحدده بدقة", "أخرى"], target:["إتقان المتغير المستقل", "تمييزه في الدراسات", "تحليل العلاقات", "أخرى"], commitment:["10 تدريبات", "اختبار", "أخرى"]},
            "الإحصاء::المتغير التابع": {current:["لا أعرفه", "أميزه أحياناً", "أحدده بدقة", "أخرى"], target:["إتقان المتغير التابع", "تمييزه في الدراسات", "تحليل النتائج", "أخرى"], commitment:["10 تدريبات", "اختبار", "أخرى"]},
            "الإحصاء::مستويات القياس": {current:["لا أعرفها", "أميز بينها", "أطبقها", "أخرى"], target:["إتقان مستويات القياس", "اختيار التحليل المناسب", "حل التطبيقات", "أخرى"], commitment:["10 تدريبات", "اختبار", "أخرى"]},
            "الإحصاء::جودة البيانات": {current:["لا أعرفها", "أفهمها", "أكتشف الأخطاء", "أخرى"], target:["تحسين جودة البيانات", "زيادة الدقة", "تحسين التحليل", "أخرى"], commitment:["تحليل أمثلة", "اختبار", "أخرى"]},
            "الإحصاء::الأخطاء الإحصائية": {current:["لا أعرفها", "أفهمها", "أكتشف الأخطاء", "أخرى"], target:["تقليل الأخطاء", "زيادة الدقة", "تحسين التحليل", "أخرى"], commitment:["تحليل أمثلة", "اختبار", "أخرى"]},
            "الإحصاء::التطبيقات الواقعية": {current:["أواجه صعوبة", "أفهم بعض التطبيقات", "أطبق بعض المفاهيم", "أخرى"], target:["ربط الإحصاء بالحياة", "حل التطبيقات", "تحليل البيانات الواقعية", "أخرى"], commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "الإحصاء::حل الأمثلة": {current:["أحتاج مساعدة", "أحل أمثلة بسيطة", "أحل أمثلة متنوعة", "أخرى"], target:["فهم خطوات الحل", "زيادة الثقة", "الاستعداد للمسائل", "أخرى"], commitment:["5 أمثلة", "10 أمثلة", "تحليل الأخطاء", "أخرى"]},
            "الإحصاء::حل المسائل": {current:["أواجه صعوبة", "أحل مسائل بسيطة", "أحل مسائل متنوعة", "أخرى"], target:["تحليل المسألة", "اختيار المفهوم المناسب", "حل تطبيقات متنوعة", "أخرى"], commitment:["5 مسائل", "10 مسائل", "تحليل الأخطاء", "اختبار", "أخرى"]},
            "الإحصاء::المراجعة الشاملة": {current:["أحتاج مراجعة", "أراجع بعض الأجزاء", "أراجع المنهج كاملاً", "أخرى"], target:["إتقان الأساسيات", "الاستعداد للجزء الثاني", "تحقيق فهم قوي", "أخرى"], commitment:["مراجعة يومية", "مراجعة أسبوعية", "اختبار شامل", "تحليل نقاط الضعف", "أخرى"]},
            "الإحصاء::اختبار قصير": {current:["أحتاج مراجعة", "أحل اختبارات قصيرة", "أحل اختبارات كاملة", "أخرى"], target:["تحسين الدرجة", "إتقان الأساسيات", "الاستعداد للجزء الثاني", "أخرى"], commitment:["اختبار أسبوعي", "اختبار تجريبي", "تحليل الأخطاء", "أخرى"]},
            "الإحصاء::اختبار تجريبي": {current:["أحتاج مراجعة", "أحل اختبارات قصيرة", "أحل اختبارات كاملة", "أخرى"], target:["تحسين الدرجة", "إتقان الأساسيات", "الاستعداد للجزء الثاني", "أخرى"], commitment:["اختبار أسبوعي", "اختبار تجريبي", "تحليل الأخطاء", "أخرى"]},
            "الإحصاء::الاستعداد للجزء الثاني": {current:["أحتاج مراجعة", "أعرف الأساسيات", "أشعر بالاستعداد", "أخرى"], target:["إتقان الأساسيات", "الاستعداد لتنظيم البيانات والجداول والرسوم البيانية", "أخرى"], commitment:["مراجعة يومية", "حل مسائل", "اختبار أسبوعي", "أخرى"]},
            "الإحصاء::نوعية": {current:["لا أميز البيانات النوعية", "أميز أمثلة بسيطة", "أصنفها بدقة", "أخرى"], target:["فهم البيانات النوعية", "تصنيفها بدقة", "استخدامها في التحليل", "أخرى"], commitment:["10 تدريبات", "اختبار", "أخرى"]},
            "الإحصاء::كمية": {current:["لا أميز البيانات الكمية", "أميز أمثلة بسيطة", "أصنفها بدقة", "أخرى"], target:["فهم البيانات الكمية", "تمييز أنواعها", "استخدامها في التحليل", "أخرى"], commitment:["10 تدريبات", "اختبار", "أخرى"]},
            "الإحصاء::منفصلة": {current:["لا أعرفها", "أميز أمثلة بسيطة", "أصنفها بدقة", "أخرى"], target:["إتقان البيانات المنفصلة", "تمييزها عن المستمرة", "حل التطبيقات", "أخرى"], commitment:["10 تدريبات", "اختبار", "أخرى"]},
            "الإحصاء::مستمرة": {current:["لا أعرفها", "أميز أمثلة بسيطة", "أصنفها بدقة", "أخرى"], target:["إتقان البيانات المستمرة", "تمييزها عن المنفصلة", "حل التطبيقات", "أخرى"], commitment:["10 تدريبات", "اختبار", "أخرى"]},
            "الإحصاء::مختلطة": {current:["أواجه صعوبة في التصنيف", "أميز بعض الأنواع", "أتعامل مع بيانات متنوعة", "أخرى"], target:["تصنيف البيانات المختلطة", "اختيار المهارة المناسبة", "حل التطبيقات", "أخرى"], commitment:["تحليل أمثلة", "اختبار", "أخرى"]},
            "الإحصاء::فهم المفهوم": {current:["أحتاج شرحاً", "أفهم جزئياً", "أطبق المفهوم", "أخرى"], target:["فهم المفهوم بوضوح", "تطبيقه في الأمثلة", "الاستعداد للمهارات التالية", "أخرى"], commitment:["15 دقيقة", "30 دقيقة", "حل أمثلة", "أخرى"]},
            "الإحصاء::تصنيف البيانات": {current:["لا أصنف البيانات", "أصنف بعض الأنواع", "أصنف بدقة", "أخرى"], target:["إتقان التصنيف", "تقليل الأخطاء", "تحليل البيانات بثقة", "أخرى"], commitment:["10 تدريبات", "اختبار", "أخرى"]},
            "الإحصاء::جمع البيانات": {current:["لا أعرف الطرق", "أعرف بعضها", "أختار طريقة مناسبة", "أخرى"], target:["إتقان جمع البيانات", "اختيار طريقة مناسبة", "تقليل التحيز", "أخرى"], commitment:["تصميم مثال", "تحليل أمثلة", "اختبار", "أخرى"]},
            "الإحصاء::تحليل البيانات": {current:["لا أحلل البيانات", "أحلل بيانات بسيطة", "أحلل بيانات متنوعة", "أخرى"], target:["تحليل البيانات بثقة", "اختيار الطريقة المناسبة", "تفسير النتائج", "أخرى"], commitment:["تحليل أمثلة", "حل مسائل", "اختبار", "أخرى"]},
            "الإحصاء::تفسير البيانات": {current:["أكتفي بالأرقام", "أفسر بعض النتائج", "أربط النتائج بالسياق", "أخرى"], target:["تفسير البيانات بوضوح", "ربط النتائج بالواقع", "تحسين جودة القرار", "أخرى"], commitment:["تحليل أمثلة", "اختبار", "أخرى"]},
            "الإحصاء::تطبيقات واقعية": {current:["أواجه صعوبة", "أفهم بعض التطبيقات", "أطبق بعض المفاهيم", "أخرى"], target:["ربط الإحصاء بالحياة", "حل التطبيقات", "تحليل البيانات الواقعية", "أخرى"], commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "الإحصاء::أخرى": {current:["أحتاج تحديد الموضوع", "بدأت التعلم", "أحل تدريبات", "أحتاج خطة واضحة", "أخرى"], target:["بناء أساس قوي في الإحصاء", "إتقان المسار المختار", "الاستعداد للجزء الثاني", "أخرى"], commitment:["تدريب يومي", "مراجعة أسبوعية", "اختبار ذاتي", "برنامج مخصص", "أخرى"]},
            "المعادلات التفاضلية::مراجعة التفاضل": {current:["أحتاج مراجعة","أتذكر الأساسيات","أجيد التفاضل الأساسي","أجيد معظم القواعد","أخرى"], target:["استرجاع مفاهيم التفاضل","الاستعداد للمعادلات التفاضلية","تقليل الأخطاء","أخرى"], commitment:["15 دقيقة مراجعة","30 دقيقة مراجعة","حل تدريبات","اختبار ذاتي","أخرى"]},
            "المعادلات التفاضلية::مراجعة التكامل": {current:["أحتاج مراجعة","أتذكر القواعد","أحل تكاملات بسيطة","أحل تكاملات متنوعة","أخرى"], target:["استرجاع مفاهيم التكامل","تطبيق التكامل في الحل","الاستعداد للمعادلات القابلة للفصل","أخرى"], commitment:["15 دقيقة مراجعة","30 دقيقة مراجعة","حل تدريبات","اختبار","أخرى"]},
            "المعادلات التفاضلية::فكرة المعادلات التفاضلية": {current:["لا أعرفها","سمعت عنها","أفهم الفكرة العامة","أخرى"], target:["فهم المفهوم","ربطها بالتطبيقات","إتقان الأساسيات","أخرى"], commitment:["15 دقيقة","30 دقيقة","حل أمثلة","اختبار","أخرى"]},
            "المعادلات التفاضلية::أهمية المعادلات التفاضلية": {current:["لا أعرف أهميتها","أعرف بعض التطبيقات","أربطها بالعلوم جزئياً","أخرى"], target:["فهم أهميتها","ربطها بالهندسة والفيزياء","تحديد استخداماتها العملية","أخرى"], commitment:["قراءة أمثلة","تلخيص التطبيقات","حل أمثلة","أخرى"]},
            "المعادلات التفاضلية::التعرف على المعادلات التفاضلية": {current:["لا أميزها","أميز بعض الأمثلة","أتعرف عليها غالباً","أخرى"], target:["التعرف السريع على المعادلات","تمييزها عن المعادلات العادية","الاستعداد للتصنيف","أخرى"], commitment:["10 تدريبات","20 تدريباً","اختبار سريع","أخرى"]},
            "المعادلات التفاضلية::تصنيف المعادلات": {current:["لا أعرف التصنيف","أفرق بين بعض الأنواع","أصنف المعادلات","أخرى"], target:["إتقان التصنيف","التعرف السريع على النوع","اختيار طريقة الحل","أخرى"], commitment:["10 تدريبات","20 تدريباً","اختبار","أخرى"]},
            "المعادلات التفاضلية::رتبة المعادلة": {current:["لا أعرف الرتبة","أحدد الرتبة أحياناً","أحدد الرتبة بدقة","أخرى"], target:["إتقان تحديد الرتبة","تقليل الأخطاء","تسريع التصنيف","أخرى"], commitment:["10 تدريبات","اختبار","مراجعة","أخرى"]},
            "المعادلات التفاضلية::درجة المعادلة": {current:["لا أعرف الدرجة","أحدد الدرجة أحياناً","أحدد الدرجة بدقة","أخرى"], target:["إتقان تحديد الدرجة","تمييز الرتبة عن الدرجة","تقليل الأخطاء","أخرى"], commitment:["10 تدريبات","اختبار","مراجعة","أخرى"]},
            "المعادلات التفاضلية::المعادلات العادية": {current:["لا أعرفها","أميزها عن الجزئية","أتعامل مع أمثلة بسيطة","أخرى"], target:["فهم المعادلات العادية","تصنيفها بثقة","الاستعداد لحلها","أخرى"], commitment:["حل أمثلة","مراجعة التصنيف","اختبار","أخرى"]},
            "المعادلات التفاضلية::المعادلات الجزئية": {current:["لا أعرفها","أعرف الفكرة العامة","أميزها عن العادية","أخرى"], target:["فهم الفكرة الأساسية","تمييزها بوضوح","الاستعداد للموضوعات المتقدمة","أخرى"], commitment:["قراءة المفهوم","حل أمثلة تصنيف","مراجعة","أخرى"]},
            "المعادلات التفاضلية::المعادلات الخطية": {current:["لا أعرفها","أميز بعض الأمثلة","أصنفها غالباً","أخرى"], target:["فهم الخطية","تصنيف المعادلات بدقة","الاستعداد للجزء الثاني","أخرى"], commitment:["10 تدريبات","اختبار","مراجعة","أخرى"]},
            "المعادلات التفاضلية::المعادلات غير الخطية": {current:["لا أعرفها","أميز بعض الأمثلة","أفهم صعوبتها","أخرى"], target:["تمييز غير الخطية","تحليل شكل المعادلة","الاستعداد لمسائل متنوعة","أخرى"], commitment:["10 تدريبات","تحليل أمثلة","اختبار","أخرى"]},
            "المعادلات التفاضلية::حلول المعادلات التفاضلية": {current:["لا أعرف معنى الحل","أفهم الفكرة","أتحقق من الحل أحياناً","أخرى"], target:["فهم معنى الحل","التمييز بين الحل العام والخاص","التحقق من الحل","أخرى"], commitment:["حل أمثلة","مراجعة المفهوم","اختبار","أخرى"]},
            "المعادلات التفاضلية::الحل العام": {current:["لا أعرفه","أفهم الفكرة","أوجد حلولاً عامة بسيطة","أخرى"], target:["إتقان الحل العام","فهم ثابت التكامل","الاستعداد للحل الخاص","أخرى"], commitment:["10 مسائل","حل تدريبات","اختبار","أخرى"]},
            "المعادلات التفاضلية::الحل الخاص": {current:["لا أعرفه","أطبق الشروط أحياناً","أجد الحل الخاص","أخرى"], target:["إتقان الحل الخاص","تطبيق الشروط الابتدائية","زيادة السرعة","أخرى"], commitment:["10 تدريبات","اختبار","مراجعة","أخرى"]},
            "المعادلات التفاضلية::المسائل الابتدائية": {current:["لا أعرفها","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["فهم المسائل الابتدائية","تطبيق الشروط بدقة","حل مسائل بثقة","أخرى"], commitment:["10 مسائل","20 مسألة","اختبار","أخرى"]},
            "المعادلات التفاضلية::المعادلات القابلة للفصل": {current:["لا أعرفها","أفصل المتغيرات","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان الفصل","زيادة السرعة","حل تطبيقات","أخرى"], commitment:["10 مسائل","20 مسألة","اختبار","مراجعة","أخرى"]},
            "المعادلات التفاضلية::معادلات بسيطة": {current:["لا أعرف طريقة الحل","أفصل المتغيرات بمساعدة","أحل مسائل بسيطة","أخرى"], target:["إتقان المعادلات البسيطة","بناء الثقة","الانتقال لأنواع أصعب","أخرى"], commitment:["10 مسائل","حل تدريبات","اختبار","أخرى"]},
            "المعادلات التفاضلية::معادلات جذرية": {current:["أواجه صعوبة مع الجذور","أتعامل مع أمثلة بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان التعامل مع الجذور","اختيار التبسيط المناسب","حل مسائل بدقة","أخرى"], commitment:["حل تدريبات","مراجعة الجذور","اختبار","أخرى"]},
            "المعادلات التفاضلية::معادلات كسرية": {current:["أواجه صعوبة مع الكسور","أحل أمثلة بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان المعادلات الكسرية","تبسيط الحل","تقليل الأخطاء","أخرى"], commitment:["10 تدريبات","تحليل الأخطاء","اختبار","أخرى"]},
            "المعادلات التفاضلية::معادلات أسية": {current:["لا أعرف التعامل معها","أفهم الأساسيات","أحل مسائل بسيطة","أخرى"], target:["إتقان المعادلات الأسية","ربطها بالنمو والاضمحلال","حل التطبيقات","أخرى"], commitment:["حل تدريبات","مراجعة القوانين","اختبار","أخرى"]},
            "المعادلات التفاضلية::معادلات لوغاريتمية": {current:["لا أعرف التعامل معها","أفهم بعض القوانين","أحل مسائل بسيطة","أخرى"], target:["إتقان المعادلات اللوغاريتمية","تطبيق القوانين بدقة","حل مسائل متنوعة","أخرى"], commitment:["حل تدريبات","مراجعة القوانين","اختبار","أخرى"]},
            "المعادلات التفاضلية::معادلات مثلثية": {current:["لا أعرف التعامل معها","أعرف بعض الهويات","أحل مسائل بسيطة","أخرى"], target:["إتقان المعادلات المثلثية","استخدام الهويات المناسبة","حل مسائل متنوعة","أخرى"], commitment:["حل تدريبات","مراجعة الهويات","اختبار","أخرى"]},
            "المعادلات التفاضلية::تطبيقات عملية": {current:["أعرف الفكرة فقط","أطبق بعض النماذج","أحل تطبيقات متنوعة","أخرى"], target:["ربط المعادلات بالتطبيقات","تحليل النتائج","حل نماذج واقعية","أخرى"], commitment:["5 مسائل","10 مسائل","اختبار","أخرى"]},
            "المعادلات التفاضلية::فصل المتغيرات": {current:["أواجه صعوبة","أطبق الفكرة","أحل مسائل متنوعة","أخرى"], target:["إتقان الفصل","تقليل الأخطاء","زيادة الدقة","أخرى"], commitment:["حل تدريبات","اختبار","أخرى"]},
            "المعادلات التفاضلية::تكامل الطرفين": {current:["أخطئ في التكامل","أكامل الطرفين بمساعدة","أطبق الخطوة غالباً","أخرى"], target:["إتقان تكامل الطرفين","تنظيم خطوات الحل","تقليل الأخطاء","أخرى"], commitment:["حل تدريبات","مراجعة التكامل","اختبار","أخرى"]},
            "المعادلات التفاضلية::إيجاد ثابت التكامل": {current:["أنسى الثابت","أضيفه أحياناً","أتعامل معه جيداً","أخرى"], target:["إتقان ثابت التكامل","فهم دوره في الحل العام","تقليل الأخطاء","أخرى"], commitment:["مراجعة الحلول","حل تدريبات","اختبار","أخرى"]},
            "المعادلات التفاضلية::تطبيق الشروط الابتدائية": {current:["لا أعرفها","أطبقها","أجد الحل الخاص","أخرى"], target:["إتقان التطبيق","حل المسائل","زيادة السرعة","أخرى"], commitment:["10 تدريبات","اختبار","مراجعة","أخرى"]},
            "المعادلات التفاضلية::التحقق من الحل": {current:["لا أتحقق","أتحقق أحياناً","أتحقق دائماً","أخرى"], target:["إتقان التحقق","اكتشاف الأخطاء","زيادة الدقة","أخرى"], commitment:["التحقق من كل مسألة","تحليل الأخطاء","اختبار","أخرى"]},
            "المعادلات التفاضلية::التطبيقات الأساسية": {current:["أعرف المفهوم","أطبق بعض التطبيقات","أحل مسائل متنوعة","أخرى"], target:["ربط الرياضيات بالواقع","حل التطبيقات","تحليل النتائج","أخرى"], commitment:["5 مسائل","10 مسائل","اختبار","أخرى"]},
            "المعادلات التفاضلية::النمو السكاني": {current:["لا أعرف النموذج","أفهم الفكرة","أحل مسائل بسيطة","أخرى"], target:["إتقان النموذج","حل التطبيقات","تحليل النتائج","أخرى"], commitment:["حل تدريبات","اختبار","أخرى"]},
            "المعادلات التفاضلية::الاضمحلال الإشعاعي": {current:["لا أعرفه","أفهم النموذج","أحل مسائل متنوعة","أخرى"], target:["إتقان النموذج","حل التطبيقات","ربطه بالعلوم","أخرى"], commitment:["حل تدريبات","اختبار","أخرى"]},
            "المعادلات التفاضلية::التبريد": {current:["لا أعرف القانون","أفهم الفكرة","أطبق النموذج","أخرى"], target:["إتقان النموذج","حل التطبيقات","تحليل النتائج","أخرى"], commitment:["حل تدريبات","اختبار","أخرى"]},
            "المعادلات التفاضلية::حل المسائل": {current:["أواجه صعوبة","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["تحليل المسألة","اختيار الطريقة","حل التطبيقات","أخرى"], commitment:["5 مسائل","10 مسائل","تحليل الأخطاء","اختبار","أخرى"]},
            "المعادلات التفاضلية::المراجعة الشاملة": {current:["أحتاج مراجعة","أراجع بعض الأجزاء","أراجع الجزء الأول كاملاً","أخرى"], target:["إتقان الجزء الأول","تقوية نقاط الضعف","جاهزية للجزء الثاني","أخرى"], commitment:["مراجعة يومية","اختبار أسبوعي","تحليل الأخطاء","أخرى"]},
            "المعادلات التفاضلية::اختبار قصير": {current:["أحتاج مراجعة","أحل اختبارات قصيرة","أحل اختبارات كاملة","أخرى"], target:["تحسين الدرجة","اجتياز الاختبارات","تقليل الأخطاء","إتقان الجزء الأول","أخرى"], commitment:["اختبار أسبوعي","اختبار تجريبي","تحليل الأخطاء","مراجعة نقاط الضعف","أخرى"]},
            "المعادلات التفاضلية::اختبار تجريبي": {current:["أحتاج مراجعة","أحل اختبارات قصيرة","أحل اختبارات كاملة","أخرى"], target:["تحسين الدرجة","اجتياز الاختبارات","تقليل الأخطاء","إتقان الجزء الأول","أخرى"], commitment:["اختبار أسبوعي","اختبار تجريبي","تحليل الأخطاء","مراجعة نقاط الضعف","أخرى"]},
            "المعادلات التفاضلية::الاستعداد للجزء الثاني": {current:["أحتاج مراجعة","أعرف الأساسيات","أشعر بالاستعداد","أخرى"], target:["إتقان الجزء الأول","الانتقال للمعادلات الخطية","الاستعداد للموضوعات المتقدمة","أخرى"], commitment:["مراجعة يومية","حل مسائل","اختبار أسبوعي","أخرى"]},

            "المعادلات التفاضلية::مراجعة الجزء الأول": {current:["أحتاج مراجعة","أعرف الأساسيات","أحل مسائل الجزء الأول","أشعر بالاستعداد","أخرى"], target:["إتقان الجزء الأول","تقوية الأساس","الانتقال للمعادلات الخطية","أخرى"], commitment:["مراجعة يومية","حل مسائل","اختبار أسبوعي","أخرى"]},
            "المعادلات التفاضلية::المعادلات الخطية من الرتبة الأولى": {current:["لا أعرفها","أعرف الصيغة","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان الصيغة","إتقان الحل","حل التطبيقات","زيادة السرعة","أخرى"], commitment:["10 مسائل","20 مسألة","اختبار","تحليل الأخطاء","أخرى"]},
            "المعادلات التفاضلية::الصيغة القياسية": {current:["لا أعرفها","أتعرف عليها أحياناً","أحول المعادلة إليها","أخرى"], target:["إتقان الصيغة القياسية","تهيئة المعادلة للحل","تقليل الأخطاء","أخرى"], commitment:["10 تدريبات","20 تدريباً","اختبار","أخرى"]},
            "المعادلات التفاضلية::معاملات المعادلة": {current:["لا أميز المعاملات","أميز بعضها","أحددها بدقة","أخرى"], target:["إتقان تحديد المعاملات","فهم دورها في الحل","اختيار الطريقة المناسبة","أخرى"], commitment:["حل تدريبات","تحليل أمثلة","اختبار","أخرى"]},
            "المعادلات التفاضلية::العامل التكاملي": {current:["لا أعرفه","أحسبه","أستخدمه في الحل","أخرى"], target:["إتقان العامل التكاملي","حل المسائل","زيادة الدقة","أخرى"], commitment:["10 تدريبات","20 تدريباً","اختبار","مراجعة","أخرى"]},
            "المعادلات التفاضلية::حساب العامل التكاملي": {current:["أخطئ في حسابه","أحسبه بمساعدة","أحسبه بثقة","أخرى"], target:["إتقان الحساب","تقليل الأخطاء","تسريع الحل","أخرى"], commitment:["10 تدريبات","اختبار","مراجعة","أخرى"]},
            "المعادلات التفاضلية::ضرب المعادلة بالعامل التكاملي": {current:["لا أعرف الخطوة","أطبقها أحياناً","أطبقها بدقة","أخرى"], target:["إتقان الخطوة","تنظيم الحل","تجهيز المعادلة للتكامل","أخرى"], commitment:["حل تدريبات","تحليل الحلول","اختبار","أخرى"]},
            "المعادلات التفاضلية::حل المعادلات الخطية": {current:["لا أعرف الطريقة","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان الحل","حل تطبيقات","زيادة السرعة والدقة","أخرى"], commitment:["10 مسائل","20 مسألة","اختبار","تحليل الأخطاء","أخرى"]},
            "المعادلات التفاضلية::المعادلات المتجانسة": {current:["لا أعرفها","أتعرف عليها","أحل مسائل بسيطة","أخرى"], target:["إتقان الحل","اختيار التعويض المناسب","حل التطبيقات","أخرى"], commitment:["10 مسائل","حل تدريبات","اختبار","أخرى"]},
            "المعادلات التفاضلية::اختبار التجانس": {current:["لا أعرف الاختبار","أطبقه أحياناً","أحدد التجانس بدقة","أخرى"], target:["إتقان اختبار التجانس","التعرف السريع على النوع","اختيار طريقة الحل","أخرى"], commitment:["10 تدريبات","اختبار","مراجعة","أخرى"]},
            "المعادلات التفاضلية::تحويل المتغيرات": {current:["لا أعرف التحويل","أطبقه بمساعدة","أطبقه بثقة","أخرى"], target:["إتقان التحويل","تبسيط المعادلة","حل المسائل المتجانسة","أخرى"], commitment:["حل تدريبات","اختبار","مراجعة","أخرى"]},
            "المعادلات التفاضلية::حل المعادلات المتجانسة": {current:["أواجه صعوبة","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان الحل","زيادة الدقة","حل التطبيقات","أخرى"], commitment:["10 مسائل","حل تدريبات","اختبار","أخرى"]},
            "المعادلات التفاضلية::معادلات برنولي": {current:["لا أعرفها","أفهم التحويل","أحل مسائل بسيطة","أخرى"], target:["إتقان التحويل","إتقان الحل","حل التطبيقات","أخرى"], commitment:["10 تدريبات","20 تدريباً","اختبار","أخرى"]},
            "المعادلات التفاضلية::تحويل معادلات برنولي": {current:["لا أعرف التحويل","أطبقه بمساعدة","أطبقه بثقة","أخرى"], target:["إتقان التحويل","تحويلها إلى معادلة خطية","تقليل الأخطاء","أخرى"], commitment:["حل تدريبات","اختبار","مراجعة","أخرى"]},
            "المعادلات التفاضلية::حل معادلات برنولي": {current:["لا أعرف طريقة الحل","أحل مسائل بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان الحل","حل التطبيقات","زيادة السرعة","أخرى"], commitment:["10 مسائل","20 مسألة","اختبار","أخرى"]},
            "المعادلات التفاضلية::اختيار طريقة الحل": {current:["أحتار بين الطرق","أعرف بعض الطرق","أختار الطريقة المناسبة","أخرى"], target:["اختيار الطريقة مباشرة","تقليل الأخطاء","زيادة السرعة","أخرى"], commitment:["تحليل 5 مسائل","تحليل 10 مسائل","اختبار","أخرى"]},
            "المعادلات التفاضلية::التطبيقات الفيزيائية": {current:["أعرف بعض التطبيقات","أطبق بعضها","أحل مسائل متنوعة","أخرى"], target:["ربط المعادلات بالفيزياء","حل التطبيقات","تحليل النتائج","أخرى"], commitment:["5 مسائل","10 مسائل","اختبار","أخرى"]},
            "المعادلات التفاضلية::التطبيقات الهندسية": {current:["أعرف بعض التطبيقات","أطبق بعضها","أحل مسائل متنوعة","أخرى"], target:["ربط المعادلات بالهندسة","حل التطبيقات","تحليل النتائج","أخرى"], commitment:["5 مسائل","10 مسائل","اختبار","أخرى"]},
            "المعادلات التفاضلية::التطبيقات الاقتصادية": {current:["أعرف بعض التطبيقات","أطبق بعضها","أحل مسائل متنوعة","أخرى"], target:["ربط المعادلات بالاقتصاد","حل التطبيقات","تحليل النتائج","أخرى"], commitment:["5 مسائل","10 مسائل","اختبار","أخرى"]},
            "المعادلات التفاضلية::التطبيقات الفيزيائية والهندسية والاقتصادية": {current:["أعرف بعض التطبيقات","أطبق بعضها","أحل مسائل متنوعة","أخرى"], target:["ربط المعادلات بالواقع","حل التطبيقات","تحليل النتائج","أخرى"], commitment:["5 مسائل","10 مسائل","اختبار","أخرى"]},
            "المعادلات التفاضلية::الاستعداد للجزء الثالث": {current:["أحتاج مراجعة","أعرف الأساسيات","أشعر بالاستعداد","أخرى"], target:["إتقان الجزء الثاني","الاستعداد للمعادلات الدقيقة","الاستعداد للموضوعات المتقدمة","أخرى"], commitment:["مراجعة يومية","حل مسائل","اختبار أسبوعي","أخرى"]},
            "المعادلات التفاضلية::معادلات ذات معاملات ثابتة": {current:["لا أعرفها","أحل أمثلة بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان هذا النوع","حل المسائل بسرعة","تقليل الأخطاء","أخرى"], commitment:["10 تدريبات","اختبار","مراجعة","أخرى"]},
            "المعادلات التفاضلية::معادلات ذات معاملات متغيرة": {current:["أواجه صعوبة","أميزها أحياناً","أحل مسائل بسيطة","أخرى"], target:["إتقان التعامل معها","اختيار طريقة الحل","حل مسائل متنوعة","أخرى"], commitment:["حل تدريبات","تحليل الحلول","اختبار","أخرى"]},
            "المعادلات التفاضلية::معادلات مع شروط ابتدائية": {current:["لا أعرف تطبيق الشروط","أطبقها أحياناً","أجد الحل الخاص","أخرى"], target:["إتقان الشروط الابتدائية","الوصول للحل الخاص","زيادة الدقة","أخرى"], commitment:["10 تدريبات","اختبار","مراجعة","أخرى"]},
            "المعادلات التفاضلية::متجانسة بسيطة": {current:["لا أعرفها","أحل أمثلة بسيطة","أحل بثقة","أخرى"], target:["إتقان المتجانسة البسيطة","بناء أساس قوي","الانتقال لمسائل أصعب","أخرى"], commitment:["10 مسائل","اختبار","أخرى"]},
            "المعادلات التفاضلية::متجانسة كسرية": {current:["أواجه صعوبة","أحل أمثلة بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان المتجانسة الكسرية","تبسيط الحل","تقليل الأخطاء","أخرى"], commitment:["حل تدريبات","اختبار","مراجعة","أخرى"]},
            "المعادلات التفاضلية::متجانسة جذرية": {current:["أواجه صعوبة","أفهم بعض الأمثلة","أحل مسائل متنوعة","أخرى"], target:["إتقان المتجانسة الجذرية","اختيار التبسيط المناسب","حل المسائل","أخرى"], commitment:["حل تدريبات","اختبار","مراجعة","أخرى"]},
            "المعادلات التفاضلية::متجانسة تطبيقية": {current:["أعرف الفكرة فقط","أطبق بعض النماذج","أحل تطبيقات متنوعة","أخرى"], target:["ربط التجانس بالتطبيقات","تحليل النتائج","حل نماذج واقعية","أخرى"], commitment:["5 مسائل","10 مسائل","اختبار","أخرى"]},
            "المعادلات التفاضلية::أسية": {current:["أواجه صعوبة","أحل أمثلة بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان المعادلات الأسية","ربطها بالنماذج التطبيقية","حل المسائل","أخرى"], commitment:["حل تدريبات","مراجعة القوانين","اختبار","أخرى"]},
            "المعادلات التفاضلية::كسرية": {current:["أواجه صعوبة","أحل أمثلة بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان المعادلات الكسرية","تبسيط الحل","تقليل الأخطاء","أخرى"], commitment:["10 تدريبات","تحليل الأخطاء","اختبار","أخرى"]},
            "المعادلات التفاضلية::جذرية": {current:["أواجه صعوبة","أتعامل مع أمثلة بسيطة","أحل مسائل متنوعة","أخرى"], target:["إتقان المعادلات الجذرية","اختيار التبسيط المناسب","حل مسائل بدقة","أخرى"], commitment:["حل تدريبات","مراجعة الجذور","اختبار","أخرى"]},
            "المعادلات التفاضلية::مراجعة الجزء الثاني": {current:["أحتاج مراجعة", "أعرف الأساسيات", "أحل مسائل الجزء الثاني", "أشعر بالاستعداد", "أخرى"], target:["إتقان الجزء الثاني", "تقوية طرق الحل", "الاستعداد للمعادلات الدقيقة", "أخرى"], commitment:["مراجعة يومية", "حل مسائل", "اختبار أسبوعي", "أخرى"]},
            "المعادلات التفاضلية::المعادلات الدقيقة": {current:["لا أعرفها", "أتعرف عليها", "أطبق شرط الدقة", "أحل مسائل متنوعة", "أخرى"], target:["إتقان التعرف", "إتقان الحل", "حل التطبيقات", "زيادة السرعة", "أخرى"], commitment:["10 مسائل", "20 مسألة", "اختبار", "تحليل الأخطاء", "أخرى"]},
            "المعادلات التفاضلية::التعرف على المعادلات الدقيقة": {current:["لا أميزها", "أميز بعض الأمثلة", "أتعرف عليها غالباً", "أخرى"], target:["التعرف السريع", "تمييزها عن غير الدقيقة", "اختيار طريقة الحل", "أخرى"], commitment:["10 تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::شرط الدقة": {current:["لا أعرف الشرط", "أطبقه أحياناً", "أتحقق منه بدقة", "أخرى"], target:["إتقان شرط الدقة", "تقليل الأخطاء", "تسريع التصنيف", "أخرى"], commitment:["10 تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::اختبار الدقة": {current:["لا أعرف الاختبار", "أطبقه", "أتحقق من الدقة", "أخرى"], target:["إتقان الاختبار", "زيادة الدقة", "تقليل الأخطاء", "أخرى"], commitment:["10 تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::حل المعادلات الدقيقة": {current:["لا أعرف طريقة الحل", "أحل مسائل بسيطة", "أحل مسائل متنوعة", "أخرى"], target:["إتقان الحل", "إيجاد دالة الحل", "حل التطبيقات", "أخرى"], commitment:["10 مسائل", "20 مسألة", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::إيجاد دالة الحل": {current:["أواجه صعوبة", "أجدها بمساعدة", "أجدها بثقة", "أخرى"], target:["إتقان إيجاد دالة الحل", "تنظيم خطوات الحل", "تقليل الأخطاء", "أخرى"], commitment:["حل تدريبات", "تحليل الحلول", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::المعادلات غير الدقيقة": {current:["لا أعرفها", "أتعرف عليها", "أحتاج عاملاً تكاملياً", "أخرى"], target:["فهم المعادلات غير الدقيقة", "تحويلها إلى دقيقة", "حل المسائل", "أخرى"], commitment:["10 تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::التعرف على المعادلات غير الدقيقة": {current:["لا أميزها", "أكتشف عدم الدقة أحياناً", "أحددها بثقة", "أخرى"], target:["إتقان التعرف", "اختيار العامل المناسب", "الاستعداد للتحويل", "أخرى"], commitment:["حل تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::العوامل التكاملية": {current:["لا أعرفها", "أحسبها", "أستخدمها", "أخرى"], target:["إتقان العوامل التكاملية", "اختيار العامل المناسب", "حل المسائل", "أخرى"], commitment:["10 تدريبات", "20 تدريباً", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::العامل التكاملي بدلالة x": {current:["لا أعرفه", "أحسبه أحياناً", "أستخدمه في الحل", "أخرى"], target:["إتقان العامل بدلالة x", "تحويل المعادلة بدقة", "حل المسائل", "أخرى"], commitment:["10 تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::العامل التكاملي بدلالة y": {current:["لا أعرفه", "أحسبه أحياناً", "أستخدمه في الحل", "أخرى"], target:["إتقان العامل بدلالة y", "تحويل المعادلة بدقة", "حل المسائل", "أخرى"], commitment:["10 تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::اختيار العامل التكاملي المناسب": {current:["أحتار في الاختيار", "أعرف بعض الحالات", "أختار غالباً بشكل صحيح", "أخرى"], target:["اختيار العامل مباشرة", "زيادة الدقة", "تقليل الوقت", "أخرى"], commitment:["تحليل 5 مسائل", "تحليل 10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::تحويل المعادلة إلى معادلة دقيقة": {current:["أواجه صعوبة", "أطبق الفكرة", "أحل مسائل متنوعة", "أخرى"], target:["إتقان التحويل", "زيادة السرعة", "حل التطبيقات", "أخرى"], commitment:["حل تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::حل المعادلات غير الدقيقة": {current:["لا أعرف الطريقة", "أحل مسائل بسيطة", "أحل مسائل متنوعة", "أخرى"], target:["إتقان الحل بعد التحويل", "اختيار العامل المناسب", "حل تطبيقات", "أخرى"], commitment:["10 مسائل", "20 مسألة", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::تطبيقات الرتبة الأولى": {current:["أعرف بعض التطبيقات", "أطبق بعضها", "أحل مسائل متنوعة", "أخرى"], target:["إتقان التطبيقات", "ربط المعادلات بالواقع", "تحليل النتائج", "أخرى"], commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::تطبيقات النمو": {current:["أعرف المفهوم", "أطبق بعض الأمثلة", "أحل مسائل بسيطة", "أخرى"], target:["إتقان نموذج النمو", "تحليل النتائج", "حل التطبيقات", "أخرى"], commitment:["حل تدريبات", "اختبار", "تحليل النتائج", "أخرى"]},
            "المعادلات التفاضلية::تطبيقات الاضمحلال": {current:["أعرف المفهوم", "أطبق بعض الأمثلة", "أحل مسائل بسيطة", "أخرى"], target:["إتقان نموذج الاضمحلال", "تحليل النتائج", "حل التطبيقات", "أخرى"], commitment:["حل تدريبات", "اختبار", "تحليل النتائج", "أخرى"]},
            "المعادلات التفاضلية::تطبيقات الخلط": {current:["لا أعرف النموذج", "أفهم الفكرة", "أحل مسائل بسيطة", "أخرى"], target:["إتقان مسائل الخلط", "بناء النموذج", "تحليل النتائج", "أخرى"], commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::تطبيقات الحركة": {current:["أعرف بعض الأفكار", "أطبق بعض النماذج", "أحل مسائل متنوعة", "أخرى"], target:["ربط المعادلات بالحركة", "حل تطبيقات الحركة", "تحليل النتائج", "أخرى"], commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::تطبيقات الاقتصاد": {current:["أعرف بعض التطبيقات", "أطبق بعضها", "أحل مسائل بسيطة", "أخرى"], target:["ربط المعادلات بالاقتصاد", "حل التطبيقات", "تحليل النتائج", "أخرى"], commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::تطبيقات النمو والاضمحلال والخلط والحركة والاقتصاد": {current:["أعرف المفهوم", "أطبق بعض الأمثلة", "أحل مسائل بسيطة", "أخرى"], target:["إتقان النماذج", "حل التطبيقات", "ربط الرياضيات بالحياة", "أخرى"], commitment:["حل تدريبات", "اختبار", "تحليل النتائج", "أخرى"]},
            "المعادلات التفاضلية::الاستعداد للجزء الرابع": {current:["أحتاج مراجعة", "أعرف الأساسيات", "أشعر بالاستعداد", "أخرى"], target:["إتقان الجزء الثالث", "الاستعداد للرتبة الثانية", "الاستعداد للموضوعات المتقدمة", "أخرى"], commitment:["مراجعة يومية", "حل مسائل", "اختبار أسبوعي", "أخرى"]},
            "المعادلات التفاضلية::معادلات كثيرة الحدود": {current:["لا أعرف هذا النوع", "أحل أمثلة بسيطة", "أحل مسائل متنوعة", "أخرى"], target:["إتقان معادلات كثيرة الحدود", "اختيار طريقة الحل", "تقليل الأخطاء", "أخرى"], commitment:["10 تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::غير دقيقة بسيطة": {current:["لا أعرفها", "أحل أمثلة بسيطة", "أحل بثقة", "أخرى"], target:["إتقان غير الدقيقة البسيطة", "الانتقال لمسائل أصعب", "حل المسائل", "أخرى"], commitment:["10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::غير دقيقة تحتاج عامل تكاملي": {current:["أواجه صعوبة", "أحسب العامل بمساعدة", "أطبق العامل بثقة", "أخرى"], target:["إتقان العامل التكاملي", "تحويل المعادلة", "حل مسائل متنوعة", "أخرى"], commitment:["حل تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::غير دقيقة تطبيقية": {current:["أعرف الفكرة فقط", "أطبق بعض النماذج", "أحل تطبيقات متنوعة", "أخرى"], target:["ربط غير الدقيقة بالتطبيقات", "تحليل النتائج", "حل نماذج واقعية", "أخرى"], commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::بدلالة x": {current:["لا أعرفها", "أحسبها أحياناً", "أستخدمها في الحل", "أخرى"], target:["إتقان الحالات بدلالة x", "تحويل المعادلات بدقة", "حل المسائل", "أخرى"], commitment:["10 تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::بدلالة y": {current:["لا أعرفها", "أحسبها أحياناً", "أستخدمها في الحل", "أخرى"], target:["إتقان الحالات بدلالة y", "تحويل المعادلات بدقة", "حل المسائل", "أخرى"], commitment:["10 تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::تطبيقات متنوعة": {current:["أعرف بعض التطبيقات", "أحل أمثلة بسيطة", "أحل مسائل متنوعة", "أخرى"], target:["إتقان التطبيقات المتنوعة", "اختيار النموذج المناسب", "تحليل النتائج", "أخرى"], commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::مراجعة الجزء الثالث": {current:["أحتاج مراجعة", "أعرف الأساسيات", "أحل مسائل الجزء الثالث", "أشعر بالاستعداد", "أخرى"], target:["إتقان الجزء الثالث", "تقوية المعادلات الدقيقة", "الاستعداد للرتبة الثانية", "أخرى"], commitment:["مراجعة يومية", "حل مسائل", "اختبار أسبوعي", "أخرى"]},
            "المعادلات التفاضلية::المعادلات الخطية من الرتبة الثانية": {current:["لا أعرفها", "أتعرف عليها", "أحل مسائل بسيطة", "أحل مسائل متنوعة", "أخرى"], target:["إتقان المفهوم", "إتقان الحل", "حل التطبيقات", "زيادة السرعة", "أخرى"], commitment:["10 مسائل", "20 مسألة", "اختبار", "تحليل الأخطاء", "أخرى"]},
            "المعادلات التفاضلية::الصيغة القياسية": {current:["لا أعرف الصيغة", "أميز الصيغة أحياناً", "أكتبها بثقة", "أخرى"], target:["إتقان الصيغة القياسية", "ترتيب المعادلة بدقة", "الاستعداد للحل", "أخرى"], commitment:["10 تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::المعاملات الثابتة": {current:["لا أعرفها", "أميزها", "أحل مسائل بسيطة", "أخرى"], target:["إتقان معاملات ثابتة", "حل مسائل متنوعة", "ربطها بالمعادلة المميزة", "أخرى"], commitment:["10 مسائل", "20 مسألة", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::المعادلة المميزة": {current:["لا أعرفها", "أكتبها", "أحلها", "أخرى"], target:["إتقان المعادلة المميزة", "زيادة السرعة", "حل التطبيقات", "أخرى"], commitment:["10 تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::إيجاد المعادلة المميزة": {current:["أواجه صعوبة", "أجدها أحياناً", "أجدها بثقة", "أخرى"], target:["إتقان استخراج المعادلة", "تقليل الأخطاء", "تسريع خطوات الحل", "أخرى"], commitment:["10 تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::حل المعادلة المميزة": {current:["لا أعرف الحل", "أحل جذوراً بسيطة", "أحل جذوراً متنوعة", "أخرى"], target:["إتقان حل المعادلة المميزة", "تحليل نوع الجذور", "اختيار صورة الحل", "أخرى"], commitment:["10 مسائل", "20 مسألة", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::الجذور الحقيقية المختلفة": {current:["لا أعرفها", "أحل مسائل بسيطة", "أحل مسائل متنوعة", "أخرى"], target:["إتقان الحل", "زيادة الدقة", "حل التطبيقات", "أخرى"], commitment:["10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::الجذور الحقيقية المكررة": {current:["لا أعرفها", "أفهم الفكرة", "أحل مسائل متنوعة", "أخرى"], target:["إتقان الحل", "زيادة السرعة", "حل التطبيقات", "أخرى"], commitment:["حل تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::الجذور المركبة": {current:["لا أعرفها", "أفهم الفكرة", "أحل مسائل متنوعة", "أخرى"], target:["إتقان الحل", "ربطها بالدوال المثلثية", "حل التطبيقات", "أخرى"], commitment:["10 تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::كتابة الحل العام": {current:["أواجه صعوبة", "أكتب الحل", "أتحقق منه", "أخرى"], target:["إتقان الحل العام", "تقليل الأخطاء", "زيادة الدقة", "أخرى"], commitment:["حل تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::تحليل نوع الجذور": {current:["لا أميز نوع الجذور", "أميز بعضها", "أحللها بثقة", "أخرى"], target:["تحليل نوع الجذور بسرعة", "اختيار صورة الحل الصحيحة", "تقليل الأخطاء", "أخرى"], commitment:["10 تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::إيجاد الحل الخاص": {current:["لا أعرفه", "أطبقه أحياناً", "أجده بثقة", "أخرى"], target:["إتقان الحل الخاص", "تطبيق الشروط بدقة", "حل المسائل", "أخرى"], commitment:["10 تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::الحركة": {current:["أعرف المفهوم", "أطبق بعض الأمثلة", "أحل مسائل بسيطة", "أخرى"], target:["إتقان نموذج الحركة", "حل التطبيقات", "تحليل النتائج", "أخرى"], commitment:["حل تدريبات", "اختبار", "تحليل النتائج", "أخرى"]},
            "المعادلات التفاضلية::الاهتزازات": {current:["لا أعرف النموذج", "أفهم الفكرة", "أحل أمثلة بسيطة", "أخرى"], target:["إتقان نماذج الاهتزاز", "ربطها بالفيزياء", "حل التطبيقات", "أخرى"], commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::النوابض": {current:["لا أعرفها", "أفهم النموذج", "أحل مسائل بسيطة", "أخرى"], target:["إتقان مسائل النوابض", "ربطها بالاهتزازات", "تحليل النتائج", "أخرى"], commitment:["حل تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::الدوائر الكهربائية": {current:["لا أعرف النموذج", "أفهم بعض العلاقات", "أحل مسائل بسيطة", "أخرى"], target:["إتقان تطبيقات الدوائر", "ربط الرياضيات بالهندسة", "حل التطبيقات", "أخرى"], commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::التطبيقات الحاسوبية": {current:["أعرف المفهوم", "أطبق بعض الأمثلة", "أحل مسائل بسيطة", "أخرى"], target:["ربط المعادلات بالحاسوب", "تحليل النماذج", "حل التطبيقات", "أخرى"], commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::التطبيقات الفيزيائية والهندسية": {current:["أعرف بعض التطبيقات", "أطبق بعضها", "أحل مسائل متنوعة", "أخرى"], target:["ربط المعادلات بالواقع", "حل التطبيقات", "تحليل النتائج", "أخرى"], commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::الحركة والاهتزازات والنوابض والدوائر الكهربائية": {current:["أعرف المفهوم", "أطبق بعض الأمثلة", "أحل مسائل بسيطة", "أخرى"], target:["إتقان النماذج", "حل التطبيقات", "ربط الرياضيات بالفيزياء والهندسة", "أخرى"], commitment:["حل تدريبات", "اختبار", "تحليل النتائج", "أخرى"]},
            "المعادلات التفاضلية::الاستعداد للجزء الخامس": {current:["أحتاج مراجعة", "أعرف الأساسيات", "أشعر بالاستعداد", "أخرى"], target:["إتقان الجزء الرابع", "الاستعداد للمعادلات غير المتجانسة", "الاستعداد للموضوعات المتقدمة", "أخرى"], commitment:["مراجعة يومية", "حل مسائل", "اختبار أسبوعي", "أخرى"]},
            "المعادلات التفاضلية::معاملات ثابتة بسيطة": {current:["لا أعرف هذا النوع", "أحل أمثلة بسيطة", "أحل بثقة", "أخرى"], target:["إتقان المعاملات الثابتة البسيطة", "الانتقال لمسائل متنوعة", "حل المسائل", "أخرى"], commitment:["10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::معاملات ثابتة متنوعة": {current:["أواجه صعوبة", "أحل مسائل بسيطة", "أحل مسائل متنوعة", "أخرى"], target:["إتقان المعاملات الثابتة المتنوعة", "تحليل الجذور", "حل التطبيقات", "أخرى"], commitment:["10 مسائل", "20 مسألة", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::مسائل مختلطة": {current:["أحتاج مراجعة", "أحل بعض الأنواع", "أحل مسائل متنوعة", "أخرى"], target:["إتقان المسائل المختلطة", "اختيار طريقة الحل", "تقليل الأخطاء", "أخرى"], commitment:["حل تدريبات", "تحليل الأخطاء", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::مراجعة الجزء الرابع": {current:["أحتاج مراجعة", "أعرف الأساسيات", "أحل مسائل الجزء الرابع", "أشعر بالاستعداد", "أخرى"], target:["إتقان الجزء الرابع", "الاستعداد للمعادلات غير المتجانسة", "تقوية الرتبة الثانية", "أخرى"], commitment:["مراجعة يومية", "حل مسائل", "اختبار أسبوعي", "أخرى"]},
            "المعادلات التفاضلية::المعادلات غير المتجانسة": {current:["لا أعرفها", "أتعرف عليها", "أحل مسائل بسيطة", "أحل مسائل متنوعة", "أخرى"], target:["إتقان المفهوم", "إتقان الحل", "حل التطبيقات", "زيادة السرعة", "أخرى"], commitment:["10 مسائل", "20 مسألة", "اختبار", "تحليل الأخطاء", "أخرى"]},
            "المعادلات التفاضلية::الحد غير المتجانس": {current:["لا أميز الحد غير المتجانس", "أميزه أحياناً", "أحلله بثقة", "أخرى"], target:["فهم الحد غير المتجانس", "اختيار طريقة الحل المناسبة", "تقليل الأخطاء", "أخرى"], commitment:["10 تدريبات", "تحليل أمثلة", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::الحل الكامل": {current:["لا أعرفه", "أجمع الحلول بمساعدة", "أكتب الحل الكامل بثقة", "أخرى"], target:["إتقان الحل الكامل", "دمج الحل العام والخاص", "تطبيق الشروط بدقة", "أخرى"], commitment:["10 تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::طريقة المعاملات غير المعينة": {current:["لا أعرفها", "أطبقها", "أحل مسائل متنوعة", "أخرى"], target:["إتقان الطريقة", "اختيار التخمين المناسب", "حل التطبيقات", "أخرى"], commitment:["10 تدريبات", "20 تدريباً", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::مبدأ التخمين المناسب": {current:["لا أعرف التخمين", "أخمن بمساعدة", "أختار التخمين غالباً", "أخرى"], target:["اختيار التخمين المناسب", "تصحيح صورة الحل", "زيادة السرعة", "أخرى"], commitment:["تحليل 5 مسائل", "تحليل 10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::اختيار صورة الحل الخاص": {current:["أواجه صعوبة", "أختار الصورة أحياناً", "أختارها بثقة", "أخرى"], target:["إتقان اختيار الصورة", "تقليل الأخطاء", "حل مسائل متنوعة", "أخرى"], commitment:["حل تدريبات", "تحليل الأخطاء", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::تصحيح صورة الحل": {current:["لا أعرف متى أصححها", "أصححها أحياناً", "أتعامل مع التداخل بثقة", "أخرى"], target:["إتقان التصحيح", "تجنب تكرار حلول متداخلة", "زيادة الدقة", "أخرى"], commitment:["10 تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::إيجاد معاملات الحل": {current:["أواجه صعوبة", "أجد المعاملات بمساعدة", "أجدها بثقة", "أخرى"], target:["إتقان إيجاد المعاملات", "تنظيم خطوات الحل", "زيادة السرعة", "أخرى"], commitment:["حل تدريبات", "اختبار", "تحليل الأخطاء", "أخرى"]},
            "المعادلات التفاضلية::طريقة تغيير المعاملات": {current:["لا أعرفها", "أفهم الفكرة", "أطبقها", "أخرى"], target:["إتقان الطريقة", "حل المسائل", "زيادة السرعة", "أخرى"], commitment:["10 تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::حساب الدوال المساعدة": {current:["لا أعرفها", "أحسبها بمساعدة", "أحسبها بثقة", "أخرى"], target:["إتقان حساب الدوال المساعدة", "تطبيق تغيير المعاملات بدقة", "تقليل الأخطاء", "أخرى"], commitment:["10 تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::مقارنة الطريقتين": {current:["لا أعرف الفرق", "أعرف بعض الفروق", "أقارن بينهما", "أخرى"], target:["اختيار الطريقة الأنسب", "معرفة حدود كل طريقة", "زيادة كفاءة الحل", "أخرى"], commitment:["تحليل مسائل", "مقارنة الحلول", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::اختيار الطريقة المناسبة": {current:["أحتار بين الطرق", "أعرف بعض الطرق", "أختار الطريقة المناسبة", "أخرى"], target:["اختيار الطريقة مباشرة", "تقليل الأخطاء", "زيادة السرعة", "أخرى"], commitment:["تحليل 5 مسائل", "تحليل 10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::الحركة القسرية": {current:["أعرف الفكرة فقط", "أطبق أمثلة بسيطة", "أحل مسائل متنوعة", "أخرى"], target:["إتقان نموذج الحركة القسرية", "تحليل الاستجابة", "حل التطبيقات", "أخرى"], commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::الاهتزازات القسرية": {current:["لا أعرف النموذج", "أفهم الفكرة", "أحل مسائل بسيطة", "أخرى"], target:["إتقان الاهتزازات القسرية", "ربطها بالفيزياء", "تحليل النتائج", "أخرى"], commitment:["حل تدريبات", "اختبار", "تحليل النتائج", "أخرى"]},
            "المعادلات التفاضلية::الحركة القسرية والاهتزازات والدوائر الكهربائية": {current:["أعرف بعض التطبيقات", "أطبق بعضها", "أحل مسائل متنوعة", "أخرى"], target:["ربط المعادلات بالتطبيقات", "تحليل النتائج", "حل النماذج", "أخرى"], commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::الاستعداد للجزء السادس": {current:["أحتاج مراجعة", "أعرف الأساسيات", "أشعر بالاستعداد", "أخرى"], target:["إتقان الجزء الخامس", "الاستعداد لأنظمة المعادلات التفاضلية", "الاستعداد للموضوعات المتقدمة", "أخرى"], commitment:["مراجعة يومية", "حل مسائل", "اختبار أسبوعي", "أخرى"]},
            "المعادلات التفاضلية::بسيطة": {current:["لا أعرف هذا النوع", "أحل أمثلة بسيطة", "أحل بثقة", "أخرى"], target:["إتقان المعادلات البسيطة", "الانتقال لمسائل متنوعة", "حل المسائل", "أخرى"], commitment:["10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::أسية مثلثية": {current:["أواجه صعوبة", "أميز هذا النوع", "أحل أمثلة بسيطة", "أخرى"], target:["إتقان المعادلات الأسية المثلثية", "اختيار طريقة الحل", "حل التطبيقات", "أخرى"], commitment:["حل تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::مختلطة": {current:["أحتاج مراجعة", "أحل بعض الأنواع", "أحل مسائل متنوعة", "أخرى"], target:["إتقان المسائل المختلطة", "اختيار طريقة الحل", "تقليل الأخطاء", "أخرى"], commitment:["حل تدريبات", "تحليل الأخطاء", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::تطبيقية": {current:["أعرف الفكرة فقط", "أطبق بعض النماذج", "أحل تطبيقات متنوعة", "أخرى"], target:["ربط المعادلات بالتطبيقات", "تحليل النتائج", "حل نماذج واقعية", "أخرى"], commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},

            "المعادلات التفاضلية::مراجعة الجزء الخامس": {current:["أحتاج مراجعة", "أعرف الأساسيات", "أحل مسائل الجزء الخامس", "أشعر بالاستعداد", "أخرى"], target:["إتقان الجزء الخامس", "الاستعداد لأنظمة المعادلات التفاضلية", "تقوية المعادلات غير المتجانسة", "أخرى"], commitment:["مراجعة يومية", "حل مسائل", "اختبار أسبوعي", "أخرى"]},
            "المعادلات التفاضلية::أنظمة المعادلات التفاضلية": {current:["لا أعرفها", "أتعرف عليها", "أحل مسائل بسيطة", "أحل مسائل متنوعة", "أخرى"], target:["إتقان المفهوم", "إتقان الحل", "حل التطبيقات", "زيادة السرعة", "أخرى"], commitment:["10 مسائل", "20 مسألة", "اختبار", "تحليل الأخطاء", "أخرى"]},
            "المعادلات التفاضلية::التعرف على النظام": {current:["لا أميز الأنظمة", "أتعرف عليها أحياناً", "أميز أنواعها بثقة", "أخرى"], target:["التعرف السريع على النظام", "تمييز نوع النظام", "اختيار طريقة الحل", "أخرى"], commitment:["10 تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::كتابة النظام": {current:["أواجه صعوبة", "أكتب أنظمة بسيطة", "أكتب أنظمة متنوعة", "أخرى"], target:["إتقان كتابة النظام", "تنظيم المعادلات", "تقليل الأخطاء", "أخرى"], commitment:["حل تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::تحويل النظام إلى صيغة مصفوفية": {current:["لا أعرف التحويل", "أحوله بمساعدة", "أحوله بثقة", "أخرى"], target:["إتقان الصيغة المصفوفية", "ربط الأنظمة بالمصفوفات", "حل الأنظمة بدقة", "أخرى"], commitment:["10 تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::المصفوفات في الأنظمة": {current:["لا أعرفها", "أستخدمها", "أحل بها الأنظمة", "أخرى"], target:["إتقان التمثيل المصفوفي", "حل الأنظمة", "زيادة الدقة", "أخرى"], commitment:["10 تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::المحددات": {current:["أحتاج مراجعة", "أحسب محددات بسيطة", "أستخدمها في الحل", "أخرى"], target:["إتقان المحددات", "ربطها بالقيم الذاتية", "حل مسائل الأنظمة", "أخرى"], commitment:["10 تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::القيم الذاتية": {current:["لا أعرفها", "أحسبها", "أستخدمها", "أخرى"], target:["إتقان الحساب", "إتقان الاستخدام", "حل التطبيقات", "أخرى"], commitment:["10 تدريبات", "20 تدريباً", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::المتجهات الذاتية": {current:["لا أعرفها", "أحسبها بمساعدة", "أستخدمها في الحل", "أخرى"], target:["إتقان المتجهات الذاتية", "بناء الحل العام", "حل الأنظمة بثقة", "أخرى"], commitment:["10 تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::حساب القيم الذاتية": {current:["أواجه صعوبة", "أحسب أمثلة بسيطة", "أحسب مسائل متنوعة", "أخرى"], target:["إتقان حساب القيم الذاتية", "زيادة السرعة", "تقليل الأخطاء", "أخرى"], commitment:["10 تدريبات", "20 تدريباً", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::حساب المتجهات الذاتية": {current:["أواجه صعوبة", "أحسب أمثلة بسيطة", "أحسب مسائل متنوعة", "أخرى"], target:["إتقان حساب المتجهات الذاتية", "استخدامها في الحل", "زيادة الدقة", "أخرى"], commitment:["10 تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::الحل باستخدام القيم الذاتية": {current:["أواجه صعوبة", "أطبق الفكرة", "أحل مسائل متنوعة", "أخرى"], target:["إتقان الحل", "زيادة السرعة", "حل التطبيقات", "أخرى"], commitment:["حل تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::الحل العام للنظام": {current:["لا أعرفه", "أكتبه بمساعدة", "أكتبه بثقة", "أخرى"], target:["إتقان الحل العام للنظام", "تنظيم خطوات الحل", "تقليل الأخطاء", "أخرى"], commitment:["10 مسائل", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::تحليل الاستقرار": {current:["لا أعرفه", "أفهم الفكرة", "أحل مسائل بسيطة", "أخرى"], target:["إتقان التحليل", "تفسير النتائج", "حل التطبيقات", "أخرى"], commitment:["حل تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::السلوك طويل المدى": {current:["لا أعرفه", "أفسره أحياناً", "أحلله بثقة", "أخرى"], target:["فهم السلوك طويل المدى", "ربطه بالاستقرار", "تحليل النماذج", "أخرى"], commitment:["حل أمثلة", "تحليل نتائج", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::النظم الخطية": {current:["لا أعرفها", "أتعرف عليها", "أحل مسائل بسيطة", "أخرى"], target:["إتقان النظم الخطية", "حل الأنظمة", "تحليل النتائج", "أخرى"], commitment:["10 مسائل", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::النظم المتجانسة": {current:["لا أعرفها", "أحل أمثلة بسيطة", "أحل مسائل متنوعة", "أخرى"], target:["إتقان النظم المتجانسة", "بناء الحل العام", "زيادة الدقة", "أخرى"], commitment:["حل تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::النظم غير المتجانسة": {current:["لا أعرفها", "أميزها", "أحل مسائل بسيطة", "أخرى"], target:["إتقان النظم غير المتجانسة", "اختيار طريقة الحل", "حل التطبيقات", "أخرى"], commitment:["حل تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::النماذج السكانية": {current:["أعرف بعض النماذج", "أطبق بعضها", "أحل مسائل متنوعة", "أخرى"], target:["إتقان النماذج", "تحليل النتائج", "ربطها بالواقع", "أخرى"], commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::نماذج التفاعل": {current:["لا أعرفها", "أفهم الفكرة", "أحل أمثلة بسيطة", "أخرى"], target:["إتقان نماذج التفاعل", "تحليل العلاقات", "حل التطبيقات", "أخرى"], commitment:["حل تدريبات", "اختبار", "تحليل النتائج", "أخرى"]},
            "المعادلات التفاضلية::التطبيقات الفيزيائية والهندسية والحاسوبية والاقتصادية": {current:["أعرف بعض التطبيقات", "أطبق بعضها", "أحل مسائل متنوعة", "أخرى"], target:["ربط الأنظمة بالتطبيقات", "حل النماذج", "تحليل النتائج", "أخرى"], commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::الاستعداد للجزء السابع": {current:["أحتاج مراجعة", "أعرف الأساسيات", "أشعر بالاستعداد", "أخرى"], target:["إتقان الجزء السادس", "الاستعداد لتحويل لابلاس", "الاستعداد للموضوعات المتقدمة", "أخرى"], commitment:["مراجعة يومية", "حل مسائل", "اختبار أسبوعي", "أخرى"]},

            "المعادلات التفاضلية::مراجعة الجزء السادس": {current:["أحتاج مراجعة", "أعرف الأساسيات", "أشعر بالاستعداد", "أخرى"], target:["إتقان أنظمة المعادلات", "الاستعداد لتحويل لابلاس", "تقوية نقاط الضعف", "أخرى"], commitment:["مراجعة يومية", "حل مسائل", "اختبار أسبوعي", "أخرى"]},
            "المعادلات التفاضلية::مقدمة تحويل لابلاس": {current:["لا أعرفه", "سمعت عنه", "أفهم الفكرة العامة", "أخرى"], target:["فهم تحويل لابلاس", "ربطه بالمعادلات التفاضلية", "الاستعداد للحل", "أخرى"], commitment:["15 دقيقة", "30 دقيقة", "حل أمثلة", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::تعريف تحويل لابلاس": {current:["لا أعرف التعريف", "أفهمه جزئياً", "أطبقه في أمثلة بسيطة", "أخرى"], target:["فهم التعريف", "تطبيق التعريف", "الانتقال للخصائص", "أخرى"], commitment:["قراءة المفهوم", "حل أمثلة", "تلخيص", "أخرى"]},
            "المعادلات التفاضلية::وجود تحويل لابلاس": {current:["لا أعرف شروط الوجود", "أعرف بعضها", "أطبقها", "أخرى"], target:["فهم شروط الوجود", "تمييز الدوال المناسبة", "تقليل الأخطاء", "أخرى"], commitment:["حل تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::خصائص تحويل لابلاس": {current:["لا أعرف الخصائص", "أعرف بعضها", "أطبقها", "أخرى"], target:["إتقان الخصائص", "اختيار الخاصية المناسبة", "حل المسائل", "أخرى"], commitment:["10 تدريبات", "20 تدريباً", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::تحويل الدوال الأساسية": {current:["لا أعرف التحويلات", "أستخدم الجداول", "أحل مسائل متنوعة", "أخرى"], target:["إتقان التحويلات الأساسية", "زيادة السرعة", "تقليل الأخطاء", "أخرى"], commitment:["10 مسائل", "20 مسألة", "اختبار", "تحليل الأخطاء", "أخرى"]},
            "المعادلات التفاضلية::تحويل الدوال الأسية": {current:["لا أعرف التحويل", "أطبقه أحياناً", "أحل مسائل متنوعة", "أخرى"], target:["إتقان تحويل الدوال الأسية", "ربطه بالإزاحة", "حل التطبيقات", "أخرى"], commitment:["10 تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::تحويل الدوال المثلثية": {current:["لا أعرف التحويل", "أعرف بعض القوانين", "أحل مسائل متنوعة", "أخرى"], target:["إتقان التحويلات المثلثية", "زيادة السرعة", "حل التطبيقات", "أخرى"], commitment:["10 تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::تحويل المشتقات": {current:["لا أعرف الطريقة", "أطبقها بمساعدة", "أحل مسائل متنوعة", "أخرى"], target:["إتقان تحويل المشتقات", "حل المعادلات التفاضلية", "تطبيق الشروط الابتدائية", "أخرى"], commitment:["10 مسائل", "20 مسألة", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::تحويل لابلاس": {current:["لا أعرفه", "أفهم المفهوم", "أطبق القوانين", "أحل مسائل متنوعة", "أخرى"], target:["إتقان التحويل", "إتقان الحل", "حل التطبيقات", "زيادة السرعة", "أخرى"], commitment:["10 مسائل", "20 مسألة", "اختبار", "تحليل الأخطاء", "أخرى"]},
            "المعادلات التفاضلية::التحويل العكسي": {current:["لا أعرفه", "أستخدم الجداول", "أحل مسائل متنوعة", "أخرى"], target:["إتقان التحويل العكسي", "حل التطبيقات", "زيادة الدقة", "أخرى"], commitment:["10 تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::الجداول الأساسية": {current:["لا أعرف الجداول", "أستخدمها ببطء", "أستخدمها بثقة", "أخرى"], target:["إتقان الجداول", "زيادة سرعة الحل", "تقليل الأخطاء", "أخرى"], commitment:["مراجعة يومية", "حل تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::الدوال الدرجية والنبضية": {current:["لا أعرفها", "أفهم الفكرة", "أطبقها", "أخرى"], target:["إتقان الاستخدام", "حل التطبيقات", "ربطها بالهندسة", "أخرى"], commitment:["10 تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::الدوال الدرجية": {current:["لا أعرفها", "أفهم الفكرة", "أطبقها", "أخرى"], target:["إتقان الدوال الدرجية", "استخدام دالة هيفيسايد", "حل التطبيقات", "أخرى"], commitment:["10 تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::دالة هيفيسايد": {current:["لا أعرفها", "أفهم الفكرة", "أستخدمها في مسائل بسيطة", "أخرى"], target:["إتقان دالة هيفيسايد", "نمذجة الإشارات المتقطعة", "حل التطبيقات", "أخرى"], commitment:["حل تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::الدوال النبضية": {current:["لا أعرفها", "أفهم الفكرة", "أطبقها أحياناً", "أخرى"], target:["إتقان الدوال النبضية", "ربطها بالتطبيقات", "حل المسائل", "أخرى"], commitment:["حل تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::دالة ديراك": {current:["لا أعرفها", "أفهم الفكرة", "أطبقها أحياناً", "أخرى"], target:["إتقان دالة ديراك", "فهم النبضات", "حل التطبيقات", "أخرى"], commitment:["حل تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::نظرية الالتفاف": {current:["لا أعرفها", "أفهم الفكرة", "أحل مسائل متنوعة", "أخرى"], target:["إتقان النظرية", "حل التطبيقات", "زيادة السرعة", "أخرى"], commitment:["حل تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::حل المعادلات باستخدام لابلاس": {current:["أواجه صعوبة", "أطبق الطريقة", "أحل مسائل متنوعة", "أخرى"], target:["إتقان الطريقة", "حل المعادلات", "حل التطبيقات", "أخرى"], commitment:["10 مسائل", "20 مسألة", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::حل الأنظمة باستخدام لابلاس": {current:["لا أعرف الطريقة", "أطبقها", "أحل مسائل متنوعة", "أخرى"], target:["إتقان الطريقة", "حل الأنظمة", "تحليل النتائج", "أخرى"], commitment:["حل تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::حل الأنظمة": {current:["لا أعرف الطريقة", "أطبقها", "أحل مسائل متنوعة", "أخرى"], target:["إتقان حل الأنظمة", "تحليل النتائج", "ربطها بالتطبيقات", "أخرى"], commitment:["حل تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::التطبيقات الفيزيائية والهندسية والكهربائية والحاسوبية": {current:["أعرف بعض التطبيقات", "أطبق بعضها", "أحل مسائل متنوعة", "أخرى"], target:["ربط التحويل بالتطبيقات", "تحليل النتائج", "حل النماذج", "أخرى"], commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::التطبيقات الكهربائية": {current:["لا أعرف التطبيقات", "أفهم بعض النماذج", "أحل مسائل بسيطة", "أخرى"], target:["إتقان التطبيقات الكهربائية", "تحليل الدوائر", "حل النماذج", "أخرى"], commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::اختيار الطريقة المناسبة": {current:["أحتار بين الطرق", "أعرف بعض الطرق", "أختار الطريقة المناسبة", "أخرى"], target:["اختيار الطريقة مباشرة", "تقليل الأخطاء", "زيادة السرعة", "أخرى"], commitment:["تحليل 5 مسائل", "تحليل 10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::الاستعداد للجزء الثامن": {current:["أحتاج مراجعة", "أعرف الأساسيات", "أشعر بالاستعداد", "أخرى"], target:["إتقان تحويل لابلاس", "الاستعداد للنمذجة الرياضية", "الاستعداد للتطبيقات المتقدمة", "أخرى"], commitment:["مراجعة يومية", "حل مسائل", "اختبار أسبوعي", "أخرى"]},
            "المعادلات التفاضلية::مراجعة الجزء السابع": {current: ["أحتاج مراجعة", "أعرف أساسيات تحويل لابلاس", "أشعر بالاستعداد", "أخرى"], target: ["إتقان الجزء السابع", "الاستعداد للنمذجة الرياضية", "تقوية نقاط الضعف", "أخرى"], commitment: ["مراجعة يومية", "حل مسائل", "اختبار أسبوعي", "أخرى"]},
            "المعادلات التفاضلية::مقدمة النمذجة الرياضية": {current: ["لا أعرفها", "أفهم الفكرة", "أبني نماذج بسيطة", "أخرى"], target: ["إتقان النمذجة", "تحليل النتائج", "حل التطبيقات", "أخرى"], commitment: ["15 دقيقة", "30 دقيقة", "حل أمثلة", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::النمذجة الرياضية": {current: ["لا أعرفها", "أفهم الفكرة", "أبني نماذج بسيطة", "أخرى"], target: ["إتقان النمذجة", "تحليل النتائج", "حل التطبيقات", "أخرى"], commitment: ["15 دقيقة", "30 دقيقة", "حل أمثلة", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::فهم النماذج الرياضية": {current: ["لا أعرف النماذج", "أفهم بعض النماذج", "أميز النماذج الأساسية", "أخرى"], target: ["فهم النماذج الرياضية", "ربطها بالواقع", "اختيار النموذج المناسب", "أخرى"], commitment: ["قراءة المفهوم", "حل أمثلة", "تلخيص", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::خطوات بناء النموذج": {current: ["لا أعرف الخطوات", "أطبق بعض الخطوات", "أبني نموذجاً بسيطاً", "أخرى"], target: ["إتقان خطوات البناء", "تحليل الفرضيات", "بناء معادلة مناسبة", "أخرى"], commitment: ["تحليل مثال", "بناء نموذج", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::تحليل الفرضيات": {current: ["لا أحلل الفرضيات", "أفهم بعضها", "أحلل الفرضيات غالباً", "أخرى"], target: ["إتقان تحليل الفرضيات", "تحسين دقة النموذج", "ربط الفرضيات بالحل", "أخرى"], commitment: ["تحليل مسائل", "مراجعة النماذج", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::بناء المعادلة": {current: ["أواجه صعوبة", "أبني معادلات بسيطة", "أبني معادلات متنوعة", "أخرى"], target: ["بناء المعادلة المناسبة", "تقليل الأخطاء", "حل التطبيقات", "أخرى"], commitment: ["5 مسائل", "10 مسائل", "تحليل الأخطاء", "أخرى"]},
            "المعادلات التفاضلية::تحليل الحل": {current: ["أكتفي بالحساب", "أحلل بعض النتائج", "أربط الحل بالواقع", "أخرى"], target: ["تحليل الحل باحتراف", "تفسير السلوك", "اتخاذ استنتاجات صحيحة", "أخرى"], commitment: ["تحليل مسائل", "كتابة تفسير", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::تفسير النتائج": {current: ["لا أفسر النتائج", "أفسر أحياناً", "أربط النتائج بالواقع", "أخرى"], target: ["تفسير النتائج بدقة", "ربط النتائج بالسياق", "تحسين النموذج", "أخرى"], commitment: ["تحليل مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::نماذج النمو السكاني": {current: ["لا أعرفها", "أفهم الفكرة", "أحل مسائل بسيطة", "أخرى"], target: ["إتقان نماذج النمو السكاني", "تحليل النتائج", "حل التطبيقات", "أخرى"], commitment: ["10 تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::النمو الأسي": {current: ["لا أعرف النموذج", "أطبقه أحياناً", "أحل مسائل متنوعة", "أخرى"], target: ["إتقان النمو الأسي", "تحليل النتائج", "حل التطبيقات", "أخرى"], commitment: ["حل تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::النمو اللوجستي": {current: ["لا أعرفه", "أفهم الفكرة", "أحل مسائل بسيطة", "أخرى"], target: ["إتقان النمو اللوجستي", "تحليل السلوك طويل المدى", "حل التطبيقات", "أخرى"], commitment: ["حل تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::نماذج الاضمحلال": {current: ["لا أعرفها", "أطبقها", "أحل مسائل متنوعة", "أخرى"], target: ["إتقان النماذج", "تحليل النتائج", "حل التطبيقات", "أخرى"], commitment: ["10 تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::قانون نيوتن للتبريد": {current: ["لا أعرفه", "أفهمه", "أحل مسائل متنوعة", "أخرى"], target: ["إتقان النموذج", "حل التطبيقات", "تحليل النتائج", "أخرى"], commitment: ["حل تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::مسائل الخلط": {current: ["لا أعرفها", "أطبقها", "أحل مسائل متنوعة", "أخرى"], target: ["إتقان الحل", "تحليل النتائج", "حل التطبيقات", "أخرى"], commitment: ["10 تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::نماذج الحركة": {current: ["أعرف المفهوم", "أطبق بعض الأمثلة", "أحل مسائل بسيطة", "أخرى"], target: ["إتقان نماذج الحركة", "ربط الرياضيات بالفيزياء", "حل التطبيقات", "أخرى"], commitment: ["10 تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::الحركة والاهتزازات والدوائر الكهربائية": {current: ["أعرف المفهوم", "أطبق بعض الأمثلة", "أحل مسائل بسيطة", "أخرى"], target: ["إتقان النماذج", "ربط الرياضيات بالفيزياء والهندسة", "حل التطبيقات", "أخرى"], commitment: ["10 تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::دوائر RC": {current: ["لا أعرفها", "أفهم النموذج", "أحل مسائل بسيطة", "أخرى"], target: ["إتقان دوائر RC", "تحليل النتائج", "حل التطبيقات", "أخرى"], commitment: ["حل تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::دوائر RL": {current: ["لا أعرفها", "أفهم النموذج", "أحل مسائل بسيطة", "أخرى"], target: ["إتقان دوائر RL", "تحليل النتائج", "حل التطبيقات", "أخرى"], commitment: ["حل تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::دوائر RLC": {current: ["لا أعرفها", "أفهم النموذج", "أحل مسائل بسيطة", "أخرى"], target: ["إتقان دوائر RLC", "تحليل الاهتزازات", "حل التطبيقات", "أخرى"], commitment: ["حل تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::النماذج الاقتصادية والبيئية والحيوية والحاسوبية": {current: ["أعرف بعض التطبيقات", "أطبق بعضها", "أحل مسائل متنوعة", "أخرى"], target: ["إتقان النماذج", "تحليل النتائج", "ربطها بالتخصصات الحديثة", "أخرى"], commitment: ["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::النماذج الحاسوبية": {current: ["أعرف بعض التطبيقات", "أطبق بعضها", "أحل مسائل متنوعة", "أخرى"], target: ["إتقان النماذج الحاسوبية", "تحليل النتائج", "ربطها بالبرمجة", "أخرى"], commitment: ["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::اختيار النموذج المناسب": {current: ["أحتار بين النماذج", "أعرف بعضها", "أختار النموذج المناسب", "أخرى"], target: ["اختيار النموذج مباشرة", "تقليل الأخطاء", "زيادة السرعة", "أخرى"], commitment: ["تحليل 5 مسائل", "تحليل 10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::تحليل النتائج": {current: ["أكتفي بالحساب", "أفسر النتائج", "أربط النتائج بالواقع", "أخرى"], target: ["تحليل احترافي", "تفسير النتائج", "اتخاذ القرارات", "أخرى"], commitment: ["تحليل مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::التحقق من النموذج": {current: ["لا أتحقق", "أتحقق أحياناً", "أتحقق دائماً", "أخرى"], target: ["إتقان التحقق", "تحسين النموذج", "زيادة الدقة", "أخرى"], commitment: ["التحقق من كل مسألة", "تحليل الأخطاء", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::حل المسائل التطبيقية": {current: ["أواجه صعوبة", "أحل مسائل بسيطة", "أحل مسائل متنوعة", "أخرى"], target: ["تحليل المسألة", "اختيار النموذج المناسب", "حل التطبيقات المعقدة", "أخرى"], commitment: ["5 مسائل", "10 مسائل", "تحليل الأخطاء", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::الاختبارات": {current: ["أحتاج مراجعة", "أحل اختبارات قصيرة", "أحل اختبارات كاملة", "أخرى"], target: ["تحسين الدرجة", "اجتياز الاختبارات", "تقليل الأخطاء", "إتقان الجزء الثامن", "أخرى"], commitment: ["اختبار أسبوعي", "اختبار تجريبي", "تحليل الأخطاء", "مراجعة نقاط الضعف", "أخرى"]},
            "المعادلات التفاضلية::الاستعداد للجزء التاسع": {current: ["أحتاج مراجعة", "أعرف الأساسيات", "أشعر بالاستعداد", "أخرى"], target: ["إتقان النمذجة الرياضية", "الاستعداد للمعادلات التفاضلية الجزئية", "الاستعداد للموضوعات المتقدمة", "أخرى"], commitment: ["مراجعة يومية", "حل مسائل", "اختبار أسبوعي", "أخرى"]},
            "المعادلات التفاضلية::مراجعة الجزء الثامن": {current: ["أحتاج مراجعة", "أعرف الأساسيات", "أشعر بالاستعداد", "أخرى"], target: ["استرجاع النمذجة الرياضية", "الاستعداد للمعادلات الجزئية", "تقليل الأخطاء", "أخرى"], commitment: ["مراجعة يومية", "حل مسائل", "اختبار أسبوعي", "أخرى"]},
            "المعادلات التفاضلية::مقدمة المعادلات التفاضلية الجزئية": {current: ["لا أعرفها", "أفهم الفكرة", "أفرق بينها وبين المعادلات العادية", "أخرى"], target: ["فهم المفهوم", "تصنيف المعادلات", "حل التطبيقات", "أخرى"], commitment: ["15 دقيقة", "30 دقيقة", "حل أمثلة", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::تعريف المعادلات التفاضلية الجزئية": {current: ["لا أعرف التعريف", "أفهم الفكرة العامة", "أميز أمثلة بسيطة", "أخرى"], target: ["فهم التعريف", "تمييز المعادلات الجزئية", "الاستعداد للتصنيف", "أخرى"], commitment: ["قراءة المفهوم", "حل أمثلة", "اختبار سريع", "أخرى"]},
            "المعادلات التفاضلية::الفرق بين المعادلات العادية والجزئية": {current: ["أخلط بينهما", "أميز بعض الفروق", "أفرق بينهما غالباً", "أخرى"], target: ["تمييز الفرق بوضوح", "تصنيف الأمثلة بسرعة", "تقليل الأخطاء", "أخرى"], commitment: ["10 تدريبات", "20 تدريباً", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::تصنيف المعادلات الجزئية": {current: ["لا أعرف التصنيف", "أعرف بعض الأنواع", "أصنف المعادلات غالباً", "أخرى"], target: ["إتقان التصنيف", "تمييز الأنواع", "اختيار طريقة الحل المناسبة", "أخرى"], commitment: ["10 تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::معادلة الحرارة": {current: ["لا أعرفها", "أفهم النموذج", "أحل مسائل بسيطة", "أخرى"], target: ["إتقان النموذج", "حل التطبيقات", "تحليل النتائج", "أخرى"], commitment: ["10 تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::معادلة الموجة": {current: ["لا أعرفها", "أفهم الفكرة", "أطبقها", "أخرى"], target: ["إتقان النموذج", "حل التطبيقات", "تحليل النتائج", "أخرى"], commitment: ["10 تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::معادلة لابلاس": {current: ["لا أعرفها", "أفهم الفكرة", "أحل مسائل متنوعة", "أخرى"], target: ["إتقان النموذج", "حل التطبيقات", "زيادة الدقة", "أخرى"], commitment: ["حل تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::شروط الحدود والشروط الابتدائية": {current: ["لا أعرفها", "أطبقها", "أفسرها", "أخرى"], target: ["إتقان التطبيق", "زيادة الدقة", "تحليل النتائج", "أخرى"], commitment: ["حل تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::الشروط الابتدائية": {current: ["لا أعرفها", "أطبقها", "أفسرها", "أخرى"], target: ["إتقان التطبيق", "ربطها بالحل", "زيادة الدقة", "أخرى"], commitment: ["حل تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::شروط الحدود": {current: ["لا أعرفها", "أطبقها", "أفسرها", "أخرى"], target: ["إتقان شروط الحدود", "تحليل تأثيرها", "حل التطبيقات", "أخرى"], commitment: ["حل تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::التطبيقات الفيزيائية والهندسية والحاسوبية": {current: ["أعرف بعض التطبيقات", "أطبق بعضها", "أحل مسائل متنوعة", "أخرى"], target: ["ربط المعادلات بالتطبيقات", "تحليل النتائج", "حل النماذج", "أخرى"], commitment: ["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::اختيار النموذج وطريقة الحل": {current: ["أحتار بين الطرق", "أعرف بعضها", "أختار الطريقة المناسبة", "أخرى"], target: ["اختيار الطريقة مباشرة", "تقليل الأخطاء", "زيادة السرعة", "أخرى"], commitment: ["تحليل 5 مسائل", "تحليل 10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::الاستعداد للجزء العاشر": {current: ["أحتاج مراجعة", "أعرف الأساسيات", "أشعر بالاستعداد", "أخرى"], target: ["إتقان المعادلات التفاضلية الجزئية", "الاستعداد للمراجعة الشاملة", "الاستعداد للموضوعات المتقدمة", "أخرى"], commitment: ["مراجعة يومية", "حل مسائل", "اختبار أسبوعي", "أخرى"]},
            "المعادلات التفاضلية::بيضوية": {current: ["لا أعرف النوع", "أميز أمثلة بسيطة", "أحل مسائل مرتبطة", "أخرى"], target: ["تمييز المعادلات البيضوية", "فهم تطبيقاتها", "حل مسائل مناسبة", "أخرى"], commitment: ["حل أمثلة", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::قطعية": {current: ["لا أعرف النوع", "أميز أمثلة بسيطة", "أحل مسائل مرتبطة", "أخرى"], target: ["تمييز المعادلات القطعية", "فهم تطبيقاتها", "حل مسائل مناسبة", "أخرى"], commitment: ["حل أمثلة", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::زائدية": {current: ["لا أعرف النوع", "أميز أمثلة بسيطة", "أحل مسائل مرتبطة", "أخرى"], target: ["تمييز المعادلات الزائدية", "فهم تطبيقاتها", "حل مسائل مناسبة", "أخرى"], commitment: ["حل أمثلة", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::خطية": {current: ["لا أعرف النوع", "أميز بعض المعادلات", "أحل أمثلة بسيطة", "أخرى"], target: ["تمييز المعادلات الخطية", "اختيار الحل المناسب", "تقليل الأخطاء", "أخرى"], commitment: ["10 تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::غير خطية": {current: ["لا أعرف النوع", "أميز بعض الأمثلة", "أفهم صعوبتها", "أخرى"], target: ["تمييز غير الخطية", "تحليل النموذج", "الاستعداد للموضوعات المتقدمة", "أخرى"], commitment: ["تحليل أمثلة", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::شبه خطية": {current: ["لا أعرف النوع", "أفهم الفكرة جزئياً", "أميز أمثلة بسيطة", "أخرى"], target: ["فهم شبه الخطية", "تصنيف الأمثلة", "حل مسائل مناسبة", "أخرى"], commitment: ["حل أمثلة", "مراجعة", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::الحل التحليلي": {current: ["لا أعرف الطريقة", "أطبقها بمساعدة", "أحل مسائل متنوعة", "أخرى"], target: ["إتقان الحل التحليلي", "تحليل الخطوات", "زيادة الدقة", "أخرى"], commitment: ["حل تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::الحل التقريبي": {current: ["لا أعرف الطريقة", "أفهم الفكرة", "أطبق أمثلة بسيطة", "أخرى"], target: ["فهم الحل التقريبي", "تحليل الدقة", "ربطه بالتطبيقات الحاسوبية", "أخرى"], commitment: ["حل تدريبات", "تحليل نتائج", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::فيزيائي": {current: ["أعرف بعض التطبيقات", "أطبق بعضها", "أحل مسائل بسيطة", "أخرى"], target: ["ربط المعادلات بالفيزياء", "تحليل النماذج", "حل التطبيقات", "أخرى"], commitment: ["5 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::هندسي": {current: ["أعرف بعض التطبيقات", "أطبق بعضها", "أحل مسائل بسيطة", "أخرى"], target: ["ربط المعادلات بالهندسة", "تحليل النماذج", "حل التطبيقات", "أخرى"], commitment: ["5 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::كهربائي": {current: ["أعرف بعض التطبيقات", "أطبق بعضها", "أحل مسائل بسيطة", "أخرى"], target: ["ربط المعادلات بالكهرباء", "تحليل الدوائر", "حل التطبيقات", "أخرى"], commitment: ["5 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::حاسوبي": {current: ["أعرف بعض التطبيقات", "أطبق بعضها", "أحل مسائل بسيطة", "أخرى"], target: ["ربط المعادلات بالحوسبة", "تحليل النتائج", "حل التطبيقات", "أخرى"], commitment: ["5 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::بيئي": {current: ["أعرف بعض التطبيقات", "أطبق بعضها", "أحل مسائل بسيطة", "أخرى"], target: ["ربط المعادلات بالبيئة", "تحليل النماذج", "حل التطبيقات", "أخرى"], commitment: ["5 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::حيوي": {current: ["أعرف بعض التطبيقات", "أطبق بعضها", "أحل مسائل بسيطة", "أخرى"], target: ["ربط المعادلات بالعلوم الحيوية", "تحليل النماذج", "حل التطبيقات", "أخرى"], commitment: ["5 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::النمو": {current: ["لا أعرف النموذج", "أطبقه أحياناً", "أحل مسائل متنوعة", "أخرى"], target: ["إتقان النمو", "تحليل النتائج", "حل التطبيقات", "أخرى"], commitment: ["حل تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::الاضمحلال": {current: ["لا أعرف النموذج", "أطبقه أحياناً", "أحل مسائل متنوعة", "أخرى"], target: ["إتقان الاضمحلال", "تحليل النتائج", "حل التطبيقات", "أخرى"], commitment: ["حل تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::الخلط": {current: ["لا أعرفه", "أفهم الفكرة", "أحل مسائل متنوعة", "أخرى"], target: ["إتقان الخلط", "تحليل النتائج", "حل التطبيقات", "أخرى"], commitment: ["10 تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::الاهتزاز": {current: ["لا أعرف النموذج", "أفهم الفكرة", "أحل مسائل بسيطة", "أخرى"], target: ["إتقان الاهتزاز", "ربطه بالفيزياء", "حل التطبيقات", "أخرى"], commitment: ["10 تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::الدوائر": {current: ["لا أعرفها", "أفهم بعض النماذج", "أحل مسائل بسيطة", "أخرى"], target: ["إتقان الدوائر", "تحليل النماذج", "حل التطبيقات", "أخرى"], commitment: ["حل تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::بيئية": {current: ["أعرف بعض التطبيقات", "أطبق بعضها", "أحل مسائل بسيطة", "أخرى"], target: ["إتقان النماذج البيئية", "تحليل النتائج", "ربطها بالواقع", "أخرى"], commitment: ["5 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::حيوية": {current: ["أعرف بعض التطبيقات", "أطبق بعضها", "أحل مسائل بسيطة", "أخرى"], target: ["إتقان النماذج الحيوية", "تحليل النتائج", "ربطها بالعلوم", "أخرى"], commitment: ["5 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::دوال كثيرة الحدود": {current:["لا أعرف التحويل", "أطبق أمثلة بسيطة", "أحل مسائل متنوعة", "أخرى"], target:["إتقان تحويل كثيرات الحدود", "زيادة السرعة", "تقليل الأخطاء", "أخرى"], commitment:["10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::دوال أسية": {current:["لا أعرف التحويل", "أطبق أمثلة بسيطة", "أحل مسائل متنوعة", "أخرى"], target:["إتقان تحويل الدوال الأسية", "حل التطبيقات", "زيادة السرعة", "أخرى"], commitment:["10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::دوال مثلثية": {current:["لا أعرف التحويل", "أعرف بعض القوانين", "أحل مسائل متنوعة", "أخرى"], target:["إتقان تحويل الدوال المثلثية", "حل التطبيقات", "زيادة السرعة", "أخرى"], commitment:["10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::دوال زائدية": {current:["لا أعرفها", "أفهم بعضها", "أحل أمثلة بسيطة", "أخرى"], target:["إتقان تحويل الدوال الزائدية", "زيادة الدقة", "حل المسائل", "أخرى"], commitment:["حل تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::دوال مختلطة": {current:["أواجه صعوبة", "أحل أمثلة بسيطة", "أحل مسائل متنوعة", "أخرى"], target:["تحليل الدوال المختلطة", "اختيار الخاصية المناسبة", "حل المسائل", "أخرى"], commitment:["حل تدريبات", "تحليل الحلول", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::هيفيسايد": {current:["لا أعرفها", "أفهم الفكرة", "أستخدمها في مسائل بسيطة", "أخرى"], target:["إتقان هيفيسايد", "حل التطبيقات الخاصة", "زيادة الدقة", "أخرى"], commitment:["حل تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::ديراك": {current:["لا أعرفها", "أفهم الفكرة", "أطبقها أحياناً", "أخرى"], target:["إتقان ديراك", "فهم النبضات", "حل التطبيقات", "أخرى"], commitment:["حل تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::الالتفاف": {current:["لا أعرفه", "أفهم الفكرة", "أحل أمثلة بسيطة", "أخرى"], target:["إتقان الالتفاف", "ربطه بالتحويل العكسي", "حل المسائل", "أخرى"], commitment:["حل تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::تطبيقات خاصة": {current:["أعرف المفهوم", "أطبق أمثلة بسيطة", "أحل مسائل متنوعة", "أخرى"], target:["إتقان التطبيقات الخاصة", "تحليل النتائج", "حل النماذج", "أخرى"], commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::كهربائية": {current:["لا أعرف التطبيقات", "أفهم بعض النماذج", "أحل مسائل بسيطة", "أخرى"], target:["إتقان التطبيقات الكهربائية", "ربطها بالدوائر", "حل النماذج", "أخرى"], commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::متجانسة": {current:["لا أعرف هذا النوع", "أحل أمثلة بسيطة", "أحل بثقة", "أخرى"], target:["إتقان الأنظمة المتجانسة", "بناء الحل العام", "حل المسائل", "أخرى"], commitment:["10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::غير متجانسة": {current:["أواجه صعوبة", "أميز النوع", "أحل أمثلة بسيطة", "أخرى"], target:["إتقان الأنظمة غير المتجانسة", "اختيار طريقة الحل", "حل التطبيقات", "أخرى"], commitment:["حل تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::ثنائية": {current:["لا أعرفها", "أحل أنظمة ثنائية بسيطة", "أحل أنظمة ثنائية متنوعة", "أخرى"], target:["إتقان الأنظمة الثنائية", "زيادة السرعة", "حل التطبيقات", "أخرى"], commitment:["10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::ثلاثية": {current:["أواجه صعوبة", "أحل أمثلة بسيطة", "أحل مسائل متنوعة", "أخرى"], target:["إتقان الأنظمة الثلاثية", "تنظيم الحل", "تقليل الأخطاء", "أخرى"], commitment:["حل تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::فيزيائية": {current:["أعرف المفهوم", "أطبق أمثلة بسيطة", "أحل تطبيقات متنوعة", "أخرى"], target:["إتقان التطبيقات الفيزيائية", "تحليل النتائج", "ربط النموذج بالواقع", "أخرى"], commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::هندسية": {current:["أعرف المفهوم", "أطبق أمثلة بسيطة", "أحل تطبيقات متنوعة", "أخرى"], target:["إتقان التطبيقات الهندسية", "تحليل النماذج", "حل المسائل", "أخرى"], commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::اقتصادية": {current:["لا أعرف التطبيقات", "أفهم بعض النماذج", "أحل مسائل بسيطة", "أخرى"], target:["إتقان التطبيقات الاقتصادية", "تحليل النتائج", "حل النماذج", "أخرى"], commitment:["حل تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::حاسوبية": {current:["أعرف الفكرة", "أطبق أمثلة بسيطة", "أحل مسائل متنوعة", "أخرى"], target:["ربط الأنظمة بالحاسوب", "تحليل النماذج", "حل التطبيقات", "أخرى"], commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::سكانية": {current:["لا أعرف النماذج السكانية", "أطبق أمثلة بسيطة", "أحل مسائل متنوعة", "أخرى"], target:["إتقان النماذج السكانية", "تحليل النتائج", "ربطها بالواقع", "أخرى"], commitment:["حل تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::مراجعة شاملة": {current:["أحتاج مراجعة", "أراجع بعض الأجزاء", "أراجع المنهج كاملاً", "أخرى"], target:["إتقان المعادلات التفاضلية", "رفع مستوى الفهم", "تحقيق درجة عالية", "أخرى"], commitment:["30 دقيقة", "ساعة يومياً", "اختبار أسبوعي", "أخرى"]},
            "المعادلات التفاضلية::مراجعة معادلات الرتبة الأولى": {current:["أحتاج مراجعة", "أتذكر بعض الطرق", "أحل مسائل متنوعة", "أخرى"], target:["إتقان معادلات الرتبة الأولى", "اختيار الطريقة المناسبة", "تقليل الأخطاء", "أخرى"], commitment:["مراجعة يومية", "10 مسائل", "اختبار أسبوعي", "أخرى"]},
            "المعادلات التفاضلية::مراجعة معادلات الرتبة الثانية": {current:["أحتاج مراجعة", "أعرف المعادلة المميزة", "أحل مسائل متنوعة", "أخرى"], target:["إتقان معادلات الرتبة الثانية", "تحليل الجذور", "حل التطبيقات", "أخرى"], commitment:["مراجعة يومية", "10 مسائل", "اختبار أسبوعي", "أخرى"]},
            "المعادلات التفاضلية::مراجعة المعادلات الدقيقة": {current:["أحتاج مراجعة", "أطبق شرط الدقة", "أحل مسائل متنوعة", "أخرى"], target:["إتقان المعادلات الدقيقة", "استخدام العوامل التكاملية", "تقليل الأخطاء", "أخرى"], commitment:["حل تدريبات", "اختبار", "مراجعة الأخطاء", "أخرى"]},
            "المعادلات التفاضلية::مراجعة معادلات برنولي": {current:["أحتاج مراجعة", "أفهم التحويل", "أحل مسائل بسيطة", "أخرى"], target:["إتقان تحويل برنولي", "حل مسائل متنوعة", "زيادة السرعة", "أخرى"], commitment:["10 تدريبات", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::مراجعة المعادلات المتجانسة": {current:["أحتاج مراجعة", "أتعرف على النوع", "أحل مسائل بسيطة", "أخرى"], target:["إتقان المعادلات المتجانسة", "اختيار التعويض المناسب", "حل التطبيقات", "أخرى"], commitment:["10 مسائل", "اختبار", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::مراجعة الأنظمة": {current:["أحتاج مراجعة", "أستخدم المصفوفات", "أحل أنظمة متنوعة", "أخرى"], target:["إتقان الأنظمة", "تحليل الاستقرار", "حل التطبيقات", "أخرى"], commitment:["حل مسائل", "اختبار أسبوعي", "تحليل الأخطاء", "أخرى"]},
            "المعادلات التفاضلية::مراجعة تحويل لابلاس": {current:["أحتاج مراجعة", "أستخدم الجداول", "أحل مسائل متنوعة", "أخرى"], target:["إتقان تحويل لابلاس", "حل المعادلات والأنظمة", "زيادة الدقة", "أخرى"], commitment:["حل تدريبات", "اختبار", "مراجعة القوانين", "أخرى"]},
            "المعادلات التفاضلية::مراجعة المعادلات الجزئية": {current:["أحتاج مراجعة", "أميز الأنواع", "أحل مسائل بسيطة", "أخرى"], target:["إتقان أساسيات المعادلات الجزئية", "اختيار النموذج المناسب", "حل التطبيقات", "أخرى"], commitment:["مراجعة يومية", "حل مسائل", "اختبار أسبوعي", "أخرى"]},
            "المعادلات التفاضلية::تصنيف المسائل": {current:["أحتار في التصنيف", "أتعرف على بعض الأنواع", "أصنف معظم المسائل", "أخرى"], target:["تصنيف المسائل بسرعة", "اختيار المسار المناسب", "تقليل الأخطاء", "أخرى"], commitment:["10 مسائل", "20 مسألة", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::التعرف على نوع المعادلة": {current:["أحتار في التصنيف", "أتعرف على بعض الأنواع", "أتعرف بسرعة على النوع", "أخرى"], target:["التعرف المباشر", "اختيار الحل المناسب", "تقليل الأخطاء", "أخرى"], commitment:["10 مسائل", "20 مسألة", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::اختيار استراتيجية الحل": {current:["أحتار بين الطرق", "أعرف بعض الطرق", "أختار الطريقة المناسبة", "أخرى"], target:["اختيار الاستراتيجية مباشرة", "زيادة السرعة", "زيادة الدقة", "أخرى"], commitment:["تحليل 5 مسائل", "تحليل 10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::دمج أكثر من طريقة": {current:["أستخدم طريقة واحدة", "أدمج أحياناً بين الطرق", "أحل مسائل مختلطة", "أخرى"], target:["دمج الطرق بوعي", "حل المسائل المركبة", "زيادة المرونة", "أخرى"], commitment:["5 مسائل", "10 مسائل", "تحليل الحلول", "أخرى"]},
            "المعادلات التفاضلية::حل المسائل المختلطة": {current:["أواجه صعوبة", "أحل مسائل بسيطة", "أحل مسائل متنوعة", "أخرى"], target:["حل المسائل المعقدة", "دمج أكثر من طريقة", "تحليل الحلول", "أخرى"], commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::حل المسائل متعددة الخطوات": {current:["أواجه صعوبة", "أحل مسائل بسيطة", "أحل مسائل متنوعة", "أخرى"], target:["تقسيم المسألة إلى خطوات", "تنظيم الحل", "حل مسائل معقدة", "أخرى"], commitment:["5 مسائل", "10 مسائل", "تحليل الأخطاء", "أخرى"]},
            "المعادلات التفاضلية::حل النماذج الفيزيائية": {current:["أعرف بعض النماذج", "أطبق بعضها", "أحل مسائل متنوعة", "أخرى"], target:["ربط المعادلات بالفيزياء", "تحليل النماذج", "حل التطبيقات", "أخرى"], commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::حل النماذج الهندسية": {current:["أعرف بعض النماذج", "أطبق بعضها", "أحل مسائل متنوعة", "أخرى"], target:["ربط المعادلات بالهندسة", "تحليل النماذج", "حل التطبيقات", "أخرى"], commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::حل النماذج الكهربائية": {current:["أعرف بعض النماذج", "أطبق بعضها", "أحل مسائل متنوعة", "أخرى"], target:["تحليل الدوائر الكهربائية", "حل النماذج", "ربط النتائج بالتطبيقات", "أخرى"], commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::حل النماذج الحاسوبية": {current:["أعرف بعض النماذج", "أطبق بعضها", "أحل مسائل متنوعة", "أخرى"], target:["ربط المعادلات بالحوسبة", "تحليل النتائج", "حل التطبيقات", "أخرى"], commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::حل النماذج الاقتصادية": {current:["أعرف بعض التطبيقات", "أحل مسائل بسيطة", "أحل مسائل متنوعة", "أخرى"], target:["تحليل النماذج الاقتصادية", "تفسير النتائج", "حل التطبيقات", "أخرى"], commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::حل النماذج البيئية": {current:["أعرف بعض التطبيقات", "أحل مسائل بسيطة", "أحل مسائل متنوعة", "أخرى"], target:["تحليل النماذج البيئية", "ربط النتائج بالواقع", "حل التطبيقات", "أخرى"], commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::حل النماذج الحيوية": {current:["أعرف بعض التطبيقات", "أحل مسائل بسيطة", "أحل مسائل متنوعة", "أخرى"], target:["تحليل النماذج الحيوية", "ربط النتائج بالعلوم", "حل التطبيقات", "أخرى"], commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::تحليل الحلول": {current:["أكتفي بالحساب", "أفسر بعض النتائج", "أحلل الحلول غالباً", "أخرى"], target:["تحليل الحلول بعمق", "تفسير النتائج", "تحسين القرارات", "أخرى"], commitment:["تحليل مسائل", "مراجعة الحلول", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::مقارنة طرق الحل": {current:["لا أقارن بين الطرق", "أقارن أحياناً", "أختار الأفضل غالباً", "أخرى"], target:["اختيار أفضل طريقة", "تقليل زمن الحل", "زيادة الدقة", "أخرى"], commitment:["تحليل 5 مسائل", "مقارنة الحلول", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::تحليل الأخطاء الشائعة": {current:["أكرر الأخطاء", "أعرف بعض الأخطاء", "أتجنب الأخطاء غالباً", "أخرى"], target:["تقليل الأخطاء", "زيادة الدقة", "تحسين الأداء", "أخرى"], commitment:["تحليل الحلول", "مراجعة الأخطاء", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::تصحيح الأخطاء": {current:["أحتاج مساعدة", "أصحح أخطاء بسيطة", "أصحح الأخطاء غالباً", "أخرى"], target:["تصحيح الأخطاء بسرعة", "فهم سبب الخطأ", "تحسين الحلول", "أخرى"], commitment:["مراجعة الأخطاء", "إعادة حل المسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::تحسين سرعة الحل": {current:["أحل ببطء", "أتحسن تدريجياً", "أحل بسرعة جيدة", "أخرى"], target:["زيادة السرعة", "الحفاظ على الدقة", "الاستعداد للاختبارات", "أخرى"], commitment:["حل يومي", "اختبار زمني", "مراجعة الأداء", "أخرى"]},
            "المعادلات التفاضلية::بناء خطة مراجعة": {current:["لا أملك خطة", "لدي خطة بسيطة", "أراجع بانتظام", "أخرى"], target:["بناء خطة واضحة", "تغطية جميع الأجزاء", "تحسين الالتزام", "أخرى"], commitment:["تحديث الخطة", "مراجعة يومية", "مراجعة أسبوعية", "أخرى"]},
            "المعادلات التفاضلية::مراجعة نقاط الضعف": {current:["لا أعرف نقاط ضعفي", "أعرف بعضها", "أراجعها بانتظام", "أخرى"], target:["تقوية نقاط الضعف", "تقليل الأخطاء", "رفع المستوى", "أخرى"], commitment:["مراجعة يومية", "تحليل الأخطاء", "اختبار أسبوعي", "أخرى"]},
            "المعادلات التفاضلية::حل اختبارات قصيرة": {current:["لا أحل اختبارات", "أحل أحياناً", "أحل بانتظام", "أخرى"], target:["تحسين الدرجة", "قياس المستوى", "تقليل الأخطاء", "أخرى"], commitment:["اختبار قصير", "تحليل الأخطاء", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::حل اختبارات متوسطة": {current:["أحتاج تدريباً", "أحل أحياناً", "أحل بثقة", "أخرى"], target:["رفع القدرة على الاختبارات", "تحسين الوقت", "تقليل الأخطاء", "أخرى"], commitment:["اختبار متوسط", "تحليل الأداء", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::حل اختبارات شاملة": {current:["أحل اختبارات قصيرة", "أحل اختبارات متوسطة", "أحل اختبارات كاملة", "أخرى"], target:["تحسين الدرجة", "اجتياز الاختبارات", "إتقان المنهج", "أخرى"], commitment:["اختبار أسبوعي", "اختبار تجريبي", "محاكاة اختبار نهائي", "تحليل الأخطاء", "أخرى"]},
            "المعادلات التفاضلية::اختبارات تجريبية": {current:["لم أبدأ", "أحل اختبارات أحياناً", "أحل اختبارات كاملة", "أخرى"], target:["تحسين الدرجة", "تجهيز نفسي للاختبار", "تقليل الأخطاء", "أخرى"], commitment:["اختبار تجريبي", "تحليل النتائج", "مراجعة نقاط الضعف", "أخرى"]},
            "المعادلات التفاضلية::محاكاة اختبار نهائي": {current:["لم أجرب المحاكاة", "أجرب أحياناً", "أجري محاكاة كاملة", "أخرى"], target:["الاستعداد للاختبار النهائي", "إدارة الوقت", "تحقيق درجة عالية", "أخرى"], commitment:["محاكاة اختبار نهائي", "تحليل الأخطاء", "مراجعة", "أخرى"]},
            "المعادلات التفاضلية::الاستعداد الجامعي": {current:["أحتاج مراجعة", "أعرف الأساسيات", "أشعر بالاستعداد", "أخرى"], target:["إتقان المعادلات التفاضلية", "الاستعداد للمقررات الجامعية", "الاستعداد للمشاريع التطبيقية", "أخرى"], commitment:["مراجعة يومية", "حل مسائل متقدمة", "اختبار أسبوعي", "أخرى"]},
            "المعادلات التفاضلية::الاستعداد للمقررات المتقدمة": {current:["أحتاج مراجعة", "أعرف الأساسيات", "أشعر بالاستعداد", "أخرى"], target:["الاستعداد للموضوعات المتقدمة", "حل مسائل جامعية", "بناء أساس قوي", "أخرى"], commitment:["مراجعة يومية", "حل مسائل متقدمة", "اختبار أسبوعي", "أخرى"]},
            "المعادلات التفاضلية::الاستعداد للمشاريع التطبيقية": {current:["أحتاج مراجعة", "أفهم بعض التطبيقات", "أشعر بالاستعداد", "أخرى"], target:["تطبيق المعادلات في المشاريع", "تحليل النماذج", "بناء مشروع تطبيقي", "أخرى"], commitment:["مراجعة يومية", "حل نموذج تطبيقي", "اختبار أسبوعي", "أخرى"]},
            "المعادلات التفاضلية::معادلات رتبة أولى": {current:["أحتاج مراجعة", "أحل مسائل بسيطة", "أحل مسائل متنوعة", "أخرى"], target:["إتقان الرتبة الأولى", "اختيار طريقة الحل", "حل التطبيقات", "أخرى"], commitment:["10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::معادلات رتبة ثانية": {current:["أحتاج مراجعة", "أحل مسائل بسيطة", "أحل مسائل متنوعة", "أخرى"], target:["إتقان الرتبة الثانية", "تحليل الجذور", "حل التطبيقات", "أخرى"], commitment:["10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::معادلات دقيقة": {current:["أحتاج مراجعة", "أطبق شرط الدقة", "أحل مسائل متنوعة", "أخرى"], target:["إتقان المعادلات الدقيقة", "استخدام العوامل التكاملية", "تقليل الأخطاء", "أخرى"], commitment:["حل تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::معادلات غير متجانسة": {current:["أحتاج مراجعة", "أميز النوع", "أحل مسائل بسيطة", "أخرى"], target:["إتقان غير المتجانسة", "اختيار طريقة الحل", "حل التطبيقات", "أخرى"], commitment:["حل تدريبات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::أنظمة": {current:["أحتاج مراجعة", "أحل أنظمة بسيطة", "أحل أنظمة متنوعة", "أخرى"], target:["إتقان الأنظمة", "تحليل الاستقرار", "حل التطبيقات", "أخرى"], commitment:["حل مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::معادلات جزئية": {current:["أحتاج مراجعة", "أميز الأنواع", "أحل مسائل بسيطة", "أخرى"], target:["إتقان المعادلات الجزئية", "اختيار طريقة الحل", "حل التطبيقات", "أخرى"], commitment:["حل مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::التعرف على النوع": {current:["أحتار في التصنيف", "أتعرف على بعض الأنواع", "أتعرف بسرعة", "أخرى"], target:["التعرف المباشر", "اختيار الحل المناسب", "تقليل الأخطاء", "أخرى"], commitment:["10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::اختيار الطريقة": {current:["أحتار بين الطرق", "أعرف بعض الطرق", "أختار غالباً", "أخرى"], target:["اختيار الطريقة مباشرة", "زيادة السرعة", "زيادة الدقة", "أخرى"], commitment:["تحليل 5 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::تنفيذ الحل": {current:["أتعثر في الخطوات", "أنفذ بعض الخطوات", "أنفذ الحل كاملاً", "أخرى"], target:["تنفيذ الحل بدقة", "تنظيم الخطوات", "تقليل الأخطاء", "أخرى"], commitment:["حل مسائل", "مراجعة الخطوات", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::تحليل النتيجة": {current:["لا أحلل النتيجة", "أفسرها أحياناً", "أحللها غالباً", "أخرى"], target:["تحليل النتيجة بوضوح", "ربطها بالتطبيق", "اكتشاف الأخطاء", "أخرى"], commitment:["تحليل مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::حل المسألة كاملة": {current:["أحتاج مساعدة", "أحل أجزاء من المسألة", "أحل المسألة كاملة غالباً", "أخرى"], target:["حل المسائل كاملة", "تنظيم الحل", "زيادة الثقة", "أخرى"], commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::مختلط": {current:["أواجه صعوبة", "أحل مسائل بسيطة", "أحل مسائل متنوعة", "أخرى"], target:["حل المسائل المختلطة", "دمج الطرق", "تحليل النتائج", "أخرى"], commitment:["5 مسائل", "اختبار", "أخرى"]},
            "المعادلات التفاضلية::أخرى": {current:["أحتاج تحديد الموضوع","بدأت التعلم","أحل تدريبات","أحتاج خطة واضحة","أخرى"], target:["بناء أساس قوي في المعادلات التفاضلية","إتقان المسار المختار","الاستعداد للموضوعات المتقدمة","أخرى"], commitment:["تدريب يومي","مراجعة أسبوعية","اختبار ذاتي","برنامج مخصص","أخرى"]},
            "أخرى": {current:["أحتاج تحديد المستوى","بدأت التعلم","أحل تدريبات","أحتاج خطة واضحة","أخرى"], target:["بناء أساس قوي","تحسين المستوى","إتقان المهارة المختارة","أخرى"], commitment:["تدريب يومي","مراجعة أسبوعية","اختبار ذاتي","برنامج مخصص","أخرى"]}
        }
    },

    "الحياة اليومية": {
        categories: ["الصحة","الرياضة","النوم","شرب الماء","التغذية","الروتين الشخصي","العائلة","إدارة الوقت","إدارة المال","الصلاة","التسوق","ترتيب المنزل","تنظيف المنزل","القراءة","الاسترخاء","أخرى"],
        paths: {
            "شرب الماء": ["تذكير شرب الماء","تتبع الكمية اليومية","تحسين العادة","أخرى"],
            "الصلاة": ["الالتزام بالصلوات","صلاة الفجر","النوافل","مراجعة يومية","أخرى"],
            "أخرى": ["عادة يومية","روتين أسبوعي","تذكير مهم","العناية بالنفس","تحسين الاستمرارية","أخرى"]
        },
        states: {
            "أخرى": {current:["غير منتظم","أحياناً","متوسط","جيد","أخرى"], target:["بناء عادة ثابتة","تحسين الروتين","الاستمرار لمدة شهر","أخرى"], commitment:["خطوة يومية صغيرة","تذكير يومي","مراجعة أسبوعية","أخرى"]}
        }
    },

    "الذكاء الاصطناعي": {
        categories: ["تعلم الآلة","التعلم العميق","معالجة اللغة الطبيعية","الرؤية الحاسوبية","علم البيانات","أخرى"],
        paths: {
            "أخرى": ["جمع البيانات","تنظيف البيانات","تحليل البيانات","تدريب النموذج","تقييم النموذج","تحسين النموذج","اختبار النموذج","نشر المشروع","بناء مشروع عملي","أخرى"]
        },
        states: {
            "أخرى": {current:["لم أبدأ بعد","أعرف المفاهيم فقط","طبقت مثالاً بسيطاً","بنيت مشروعاً صغيراً","أحتاج إلى تدريب عملي","أخرى"], target:["فهم المفاهيم الأساسية","بناء مشروع عملي","تدريب نموذج جيد","نشر نموذج قابل للاستخدام","أخرى"], commitment:["30 دقيقة يومياً","60 دقيقة يومياً","مشروع أسبوعي","تجربة نموذج أسبوعياً","أخرى"]}
        }
    },

    "اللغات": {
        categories: ["اللغة الإنجليزية","اللغة الصينية","اللغة التركية","اللغة الروسية","اللغة الفرنسية","اللغة الألمانية","اللغة الإسبانية","اللغة اليابانية","اللغة الكورية","اللغة الماليزية","اللغة الإندونيسية","اللغة العربية","لغة أخرى"],
        paths: {
            "اللغة الإنجليزية": ["الاستماع","التحدث","القراءة","الكتابة","القواعد","المفردات","النطق","اللغة الأكاديمية","التواصل اليومي","لغة العمل","الاستعداد للسفر","مراجعة شاملة","أخرى"],
            "اللغة الصينية": ["الاستماع","التحدث","القراءة","الكتابة","المفردات","القواعد","الرموز الصينية","التواصل اليومي","اللغة الأكاديمية","الثقافة الصينية","الدراسة الجامعية","السفر","الأعمال","قراءة المصادر","مراجعة شاملة","أخرى"],
            "اللغة التركية": ["الاستماع","التحدث","القراءة","الكتابة","القواعد","المفردات","النطق","التواصل اليومي","اللغة الأكاديمية","الدراسة الجامعية","السفر","الثقافة التركية","مراجعة شاملة","أخرى"],
            "اللغة الروسية": ["الاستماع","التحدث","القراءة","الكتابة","القواعد","المفردات","النطق","الأبجدية الروسية","التواصل اليومي","اللغة الأكاديمية","الدراسة الجامعية","السفر","مراجعة شاملة","أخرى"],
            "اللغة الفرنسية": ["الاستماع","التحدث","القراءة","الكتابة","القواعد","المفردات","النطق","التواصل اليومي","لغة العمل","اللغة الأكاديمية","السفر","الثقافة الفرنسية","مراجعة شاملة","أخرى"],
            "اللغة الألمانية": ["الاستماع","التحدث","القراءة","الكتابة","القواعد","المفردات","النطق","التواصل اليومي","لغة العمل","اللغة الأكاديمية","الدراسة الجامعية","السفر","مراجعة شاملة","أخرى"],
            "اللغة الإسبانية": ["الاستماع","التحدث","القراءة","الكتابة","القواعد","المفردات","النطق","التواصل اليومي","لغة العمل","السفر","الثقافة الإسبانية","مراجعة شاملة","أخرى"],
            "اللغة اليابانية": ["الاستماع","التحدث","القراءة","الكتابة","القواعد","المفردات","النطق","الكانجي الياباني","الهيراغانا والكاتاكانا","التواصل اليومي","الثقافة اليابانية","الدراسة","مراجعة شاملة","أخرى"],
            "اللغة الكورية": ["الاستماع","التحدث","القراءة","الكتابة","القواعد","المفردات","النطق","الهانغول الكوري","التواصل اليومي","الثقافة الكورية","الدراسة","مراجعة شاملة","أخرى"],
            "اللغة الماليزية": ["الاستماع","التحدث","القراءة","الكتابة","القواعد","المفردات","النطق","التواصل اليومي","السفر","الدراسة","الثقافة الماليزية","مراجعة شاملة","أخرى"],
            "اللغة الإندونيسية": ["الاستماع","التحدث","القراءة","الكتابة","القواعد","المفردات","النطق","التواصل اليومي","السفر","الدراسة","الثقافة الإندونيسية","مراجعة شاملة","أخرى"],
            "اللغة العربية": ["الاستماع","التحدث","القراءة","الكتابة","القواعد","المفردات","النطق","الفصحى","الكتابة الأكاديمية","التعبير","البلاغة","مراجعة شاملة","أخرى"],
            "لغة أخرى": ["الاستماع","التحدث","القراءة","الكتابة","القواعد","المفردات","النطق","التواصل اليومي","الدراسة","السفر","العمل","الثقافة","مراجعة شاملة","أخرى"]
        },
        states: {
            "الاستماع": {
                current:["لا أفهم إلا القليل","أفهم الكلمات الأساسية","أفهم المحادثات البسيطة","أفهم المحادثات المتوسطة","أفهم معظم المحتوى","أخرى"],
                target:["فهم المحادثات اليومية","فهم المحتوى التعليمي","فهم الأفلام","فهم المحاضرات","فهم المتحدثين بطلاقة","أخرى"],
                commitment:["15 دقيقة يومياً","30 دقيقة يومياً","ساعة يومياً","ثلاث مرات أسبوعياً","مراجعة أسبوعية","برنامج خاص","أخرى"]
            },
            "التحدث": {
                current:["أتردد في التحدث","أكوّن جملاً بسيطة","أجري محادثات قصيرة","أتحدث بصورة جيدة","أتحدث بطلاقة نسبية","أخرى"],
                target:["تحسين المحادثة","زيادة الطلاقة","التحدث بثقة","التحدث الأكاديمي","التحدث الاحترافي","أخرى"],
                commitment:["محادثة يومية","تسجيل صوتي","تحدث مع شريك","تحدث أسبوعي","تطبيق عملي","أخرى"]
            },
            "القراءة": {
                current:["أقرأ كلمات بسيطة","أقرأ نصوصاً قصيرة","أقرأ مقالات بسيطة","أقرأ كتباً سهلة","أقرأ نصوصاً متقدمة","أخرى"],
                target:["تحسين سرعة القراءة","فهم النصوص","قراءة الكتب","قراءة المقالات","قراءة المحتوى الأكاديمي","أخرى"],
                commitment:["قراءة يومية","مقال يومي","قصة قصيرة","كتاب أسبوعي","مراجعة أسبوعية","أخرى"]
            },
            "الكتابة": {
                current:["أكتب كلمات","أكتب جملاً","أكتب فقرات","أكتب موضوعات","أكتب بصورة جيدة","أخرى"],
                target:["تحسين الكتابة","كتابة رسائل","كتابة مقالات","الكتابة الأكاديمية","الكتابة الاحترافية","أخرى"],
                commitment:["كتابة يومية","فقرة يومية","موضوع أسبوعي","تصحيح الأخطاء","مراجعة أسبوعية","أخرى"]
            },
            "القواعد": {
                current:["مبتدئ","أساسيات","متوسط","جيد","متقدم","أخرى"],
                target:["إتقان الأساسيات","تحسين القواعد","تقليل الأخطاء","فهم التراكيب","إتقان القواعد","أخرى"],
                commitment:["درس يومي","حل تدريبات","مراجعة أسبوعية","تطبيق عملي","اختبار ذاتي","أخرى"]
            },
            "المفردات": {
                current:["رصيد محدود","مبتدئ","متوسط","جيد","واسع","أخرى"],
                target:["زيادة المفردات","استخدام المفردات","المفردات الأكاديمية","المفردات اليومية","إثراء الحصيلة","أخرى"],
                commitment:["5 كلمات يومياً","10 كلمات يومياً","20 كلمة يومياً","مراجعة أسبوعية","بطاقات مراجعة","أخرى"]
            },
            "النطق": {
                current:["أحتاج تحسيناً كبيراً","متوسط","جيد","جيد جداً","متقدم","أخرى"],
                target:["تحسين مخارج الحروف","تقليل الأخطاء","التحدث بوضوح","تحسين اللهجة","النطق الطبيعي","أخرى"],
                commitment:["10 دقائق يومياً","15 دقيقة يومياً","تقليد المتحدثين","تسجيل صوتي","مراجعة أسبوعية","أخرى"]
            },
            "اللغة الأكاديمية": {
                current:["مبتدئ","متوسط","جيد","متقدم","أخرى"],
                target:["قراءة أبحاث","كتابة أكاديمية","فهم المحاضرات","المناقشات الأكاديمية","الاستعداد للدراسة الجامعية","أخرى"],
                commitment:["درس يومي","قراءة مقال","تلخيص","كتابة فقرة","مراجعة أسبوعية","أخرى"]
            },
            "التواصل اليومي": {
                current:["أعرف عبارات قليلة","أجري حواراً بسيطاً","أتواصل في مواقف محدودة","أتواصل بصورة جيدة","أخرى"],
                target:["التواصل بثقة","إدارة محادثات يومية","فهم المواقف العامة","التفاعل الطبيعي","أخرى"],
                commitment:["تدريب يومي","محادثة قصيرة","حفظ عبارات","تطبيق في موقف يومي","مراجعة أسبوعية","أخرى"]
            },
            "لغة العمل": {
                current:["مبتدئ","أعرف مصطلحات محدودة","أتعامل مع رسائل بسيطة","جيد","أخرى"],
                target:["كتابة رسائل عمل","فهم اجتماعات العمل","التواصل المهني","استخدام المصطلحات المهنية","أخرى"],
                commitment:["تدريب يومي","رسالة عمل أسبوعية","مفردات مهنية","محادثة عمل","مراجعة أسبوعية","أخرى"]
            },
            "الاستعداد للسفر": {
                current:["لا أعرف عبارات السفر","أعرف عبارات بسيطة","أتعامل مع مواقف محدودة","جيد","أخرى"],
                target:["التعامل في المطار","الحجز والسكن","طلب المساعدة","التواصل أثناء السفر","أخرى"],
                commitment:["حفظ عبارات يومية","موقف سفر يومي","تدريب محادثة","مراجعة أسبوعية","أخرى"]
            },
            "مراجعة شاملة": {
                current:["غير منتظم","بدأت المراجعة","متوسط","جيد","أخرى"],
                target:["تقوية المهارات الأساسية","سد نقاط الضعف","رفع المستوى العام","الاستمرار بثبات","أخرى"],
                commitment:["30 دقيقة يومياً","ساعة يومياً","تدريب مهارة يومياً","خطة أسبوعية","مراجعة أسبوعية","أخرى"]
            },
            "الرموز الصينية": {
                current:["لا أعرف الرموز","أعرف عدداً قليلاً","أقرأ رموزاً بسيطة","أكتب بعض الرموز","أخرى"],
                target:["إتقان الرموز الأساسية","تحسين القراءة","تحسين الكتابة","حفظ رموز يومية","أخرى"],
                commitment:["5 رموز يومياً","10 رموز يومياً","كتابة يومية","مراجعة أسبوعية","أخرى"]
            },
            "الثقافة الصينية": {
                current:["معرفة محدودة","أعرف بعض العادات","أفهم جوانب أساسية","جيد","أخرى"],
                target:["فهم الثقافة اليومية","فهم آداب التواصل","الاستعداد للحياة في الصين","التفاعل مع المجتمع","أخرى"],
                commitment:["قراءة قصيرة يومية","فيديو ثقافي","تلخيص أسبوعي","تطبيق عملي","أخرى"]
            },
            "الدراسة الجامعية": {
                current:["غير مستعد لغوياً","أفهم بعض المصطلحات","أتابع محتوى بسيطاً","جيد","أخرى"],
                target:["فهم المحاضرات","قراءة المراجع","كتابة الواجبات","المشاركة في النقاشات","أخرى"],
                commitment:["مصطلحات يومية","قراءة أكاديمية","تلخيص محاضرة","تدريب أسبوعي","أخرى"]
            },
            "السفر": {
                current:["لا أعرف عبارات السفر","أعرف عبارات بسيطة","أتعامل مع مواقف محدودة","جيد","أخرى"],
                target:["التعامل في المطار","السؤال عن الطريق","الحجز والسكن","التواصل أثناء السفر","أخرى"],
                commitment:["حفظ عبارات يومية","تمثيل موقف سفر","استماع قصير","مراجعة أسبوعية","أخرى"]
            },
            "الأعمال": {
                current:["لا أعرف لغة الأعمال","أعرف مصطلحات بسيطة","أفهم رسائل عمل بسيطة","جيد","أخرى"],
                target:["فهم المراسلات","التواصل في العمل","المفردات التجارية","المحادثة المهنية","أخرى"],
                commitment:["مصطلحات يومية","رسالة عمل أسبوعية","محادثة عمل","مراجعة أسبوعية","أخرى"]
            },
            "قراءة المصادر": {
                current:["أحتاج ترجمة مستمرة","أقرأ مصادر بسيطة","أفهم جزءاً من المصادر","جيد","أخرى"],
                target:["قراءة مصادر أصلية","فهم المقالات","تلخيص المصادر","استخدام اللغة في البحث","أخرى"],
                commitment:["قراءة مصدر قصير","تلخيص أسبوعي","مفردات تخصصية","مراجعة أسبوعية","أخرى"]
            },
            "الأبجدية الروسية": {
                current:["لا أعرف الحروف","أميز بعض الحروف","أقرأ كلمات بسيطة","أقرأ جملاً قصيرة","أخرى"],
                target:["إتقان الحروف","القراءة السليمة","الكتابة الصحيحة","الانتقال للنصوص","أخرى"],
                commitment:["تدريب حروف يومي","كتابة يومية","قراءة كلمات","مراجعة أسبوعية","أخرى"]
            },
            "الكانجي الياباني": {
                current:["لا أعرف الكانجي","أعرف رموزاً قليلة","أقرأ كانجي بسيطاً","أكتب بعض الرموز","أخرى"],
                target:["حفظ الكانجي الأساسي","تحسين القراءة","تحسين الكتابة","استخدام الكانجي في جمل","أخرى"],
                commitment:["5 رموز يومياً","10 رموز يومياً","كتابة رموز","مراجعة أسبوعية","أخرى"]
            },
            "الهيراغانا والكاتاكانا": {
                current:["لا أعرفهما","أعرف بعض الحروف","أقرأ كلمات بسيطة","أكتب الحروف","أخرى"],
                target:["إتقان الهيراغانا","إتقان الكاتاكانا","قراءة كلمات أساسية","الانتقال للنصوص","أخرى"],
                commitment:["تدريب حروف يومي","كتابة يومية","قراءة كلمات","مراجعة أسبوعية","أخرى"]
            },
            "الهانغول الكوري": {
                current:["لا أعرف الهانغول","أعرف بعض الحروف","أقرأ كلمات بسيطة","أكتب الحروف","أخرى"],
                target:["إتقان الهانغول","تحسين القراءة","تحسين الكتابة","قراءة نصوص بسيطة","أخرى"],
                commitment:["تدريب حروف يومي","كتابة يومية","قراءة كلمات","مراجعة أسبوعية","أخرى"]
            },
            "الفصحى": {
                current:["أحتاج تأسيساً","مستوى مقبول","جيد","جيد جداً","متقدم","أخرى"],
                target:["تحسين الفصحى","تقوية الأسلوب","الحديث بفصحى سليمة","الكتابة بفصحى واضحة","أخرى"],
                commitment:["قراءة يومية","تدريب تحدث","كتابة فقرة","مراجعة أسبوعية","أخرى"]
            },
            "الكتابة الأكاديمية": {
                current:["مبتدئ","أكتب فقرات بسيطة","أكتب موضوعات","جيد","متقدم","أخرى"],
                target:["كتابة بحثية","تنظيم الأفكار","تحسين الأسلوب","توثيق المصادر","أخرى"],
                commitment:["فقرة يومية","موضوع أسبوعي","مراجعة أخطاء","قراءة نموذجية","أخرى"]
            },
            "التعبير": {
                current:["أجد صعوبة في التعبير","أكتب جملاً بسيطة","أكتب فقرات","جيد","أخرى"],
                target:["تحسين التعبير","ترتيب الأفكار","كتابة موضوعات قوية","التعبير الشفهي والكتابي","أخرى"],
                commitment:["كتابة يومية","موضوع أسبوعي","قراءة نصوص","مراجعة أسبوعية","أخرى"]
            },
            "البلاغة": {
                current:["مبتدئ","أعرف بعض المفاهيم","متوسط","جيد","أخرى"],
                target:["فهم الصور البلاغية","تحليل النصوص","تحسين الأسلوب","إتقان البلاغة الأساسية","أخرى"],
                commitment:["درس يومي","تحليل نص","حل تدريبات","مراجعة أسبوعية","أخرى"]
            },
            "الثقافة التركية": {
                current:["معرفة محدودة","أعرف بعض العادات","أفهم جوانب أساسية","جيد","أخرى"],
                target:["فهم الحياة اليومية","فهم آداب التواصل","الاستعداد للدراسة أو السفر","التفاعل مع المجتمع","أخرى"],
                commitment:["فيديو ثقافي","قراءة قصيرة","تلخيص أسبوعي","محادثة عن الثقافة","أخرى"]
            },
            "الثقافة الفرنسية": {
                current:["معرفة محدودة","أعرف بعض العادات","أفهم جوانب أساسية","جيد","أخرى"],
                target:["فهم الحياة اليومية","فهم آداب التواصل","التعرف على الثقافة","التفاعل بثقة","أخرى"],
                commitment:["قراءة قصيرة","فيديو ثقافي","تلخيص أسبوعي","محادثة عن الثقافة","أخرى"]
            },
            "الثقافة الإسبانية": {
                current:["معرفة محدودة","أعرف بعض العادات","أفهم جوانب أساسية","جيد","أخرى"],
                target:["فهم الحياة اليومية","فهم آداب التواصل","التعرف على الثقافة","التفاعل بثقة","أخرى"],
                commitment:["قراءة قصيرة","فيديو ثقافي","تلخيص أسبوعي","محادثة عن الثقافة","أخرى"]
            },
            "الثقافة اليابانية": {
                current:["معرفة محدودة","أعرف بعض العادات","أفهم جوانب أساسية","جيد","أخرى"],
                target:["فهم الحياة اليومية","فهم آداب التواصل","التعرف على الثقافة","الاستعداد للدراسة أو السفر","أخرى"],
                commitment:["قراءة قصيرة","فيديو ثقافي","تلخيص أسبوعي","محادثة عن الثقافة","أخرى"]
            },
            "الثقافة الكورية": {
                current:["معرفة محدودة","أعرف بعض العادات","أفهم جوانب أساسية","جيد","أخرى"],
                target:["فهم الحياة اليومية","فهم آداب التواصل","التعرف على الثقافة","الاستعداد للدراسة أو السفر","أخرى"],
                commitment:["قراءة قصيرة","فيديو ثقافي","تلخيص أسبوعي","محادثة عن الثقافة","أخرى"]
            },
            "الثقافة الماليزية": {
                current:["معرفة محدودة","أعرف بعض العادات","أفهم جوانب أساسية","جيد","أخرى"],
                target:["فهم الحياة اليومية","فهم آداب التواصل","التعرف على الثقافة","الاستعداد للدراسة أو السفر","أخرى"],
                commitment:["قراءة قصيرة","فيديو ثقافي","تلخيص أسبوعي","محادثة عن الثقافة","أخرى"]
            },
            "الثقافة الإندونيسية": {
                current:["معرفة محدودة","أعرف بعض العادات","أفهم جوانب أساسية","جيد","أخرى"],
                target:["فهم الحياة اليومية","فهم آداب التواصل","التعرف على الثقافة","الاستعداد للدراسة أو السفر","أخرى"],
                commitment:["قراءة قصيرة","فيديو ثقافي","تلخيص أسبوعي","محادثة عن الثقافة","أخرى"]
            },
            "الدراسة": {
                current:["غير مستعد لغوياً","أفهم بعض المصطلحات","أتابع محتوى بسيطاً","جيد","أخرى"],
                target:["فهم الدروس","قراءة المراجع","كتابة الواجبات","المشاركة في الصف","أخرى"],
                commitment:["مصطلحات يومية","قراءة تعليمية","تلخيص درس","مراجعة أسبوعية","أخرى"]
            },
            "العمل": {
                current:["مبتدئ","أعرف مصطلحات محدودة","أتعامل مع مواقف بسيطة","جيد","أخرى"],
                target:["التواصل في العمل","كتابة رسائل مهنية","فهم تعليمات العمل","استخدام اللغة مهنياً","أخرى"],
                commitment:["مصطلحات يومية","تدريب موقف عمل","رسالة أسبوعية","مراجعة أسبوعية","أخرى"]
            },
            "الثقافة": {
                current:["معرفة محدودة","أعرف معلومات عامة","أفهم جوانب أساسية","جيد","أخرى"],
                target:["فهم الثقافة اليومية","فهم آداب التواصل","التعرف على المجتمع","استخدام اللغة بثقة","أخرى"],
                commitment:["قراءة قصيرة","فيديو ثقافي","تلخيص أسبوعي","مراجعة أسبوعية","أخرى"]
            },
            "أخرى": {
                current:["لا أعرف مستواي","مبتدئ","متوسط","متقدم","أخرى"],
                target:["تحسين المستوى","إتقان مهارة محددة","الطلاقة","استخدام اللغة بثقة","أخرى"],
                commitment:["30 دقيقة يومياً","60 دقيقة يومياً","تدريب مهارة يومياً","مراجعة أسبوعية","أخرى"]
            }
        }
    },

    "البرمجة والتكنولوجيا": {
        categories: ["أساسيات البرمجة", "Python", "C", "C++", "Java", "JavaScript", "تطوير الويب", "Data Structures", "Algorithms", "Problem Solving", "Competitive Programming", "Machine Learning", "Deep Learning", "Data Science", "Computer Vision", "Natural Language Processing", "Reinforcement Learning", "Generative AI", "MLOps", "AI Projects", "SQL", "Database Fundamentals", "SQLite", "MySQL", "PostgreSQL", "MongoDB", "Database Design", "ORM", "Database Optimization", "Database Security", "Database Projects", "Software Engineering", "Git", "GitHub", "Debugging", "Testing", "Documentation", "Clean Code", "Refactoring", "Design Patterns", "System Design", "Deployment", "Open Source", "Portfolio Development", "Software Projects", "Revision", "TypeScript", "HTML", "CSS", "PHP", "Flask", "Django", "React", "Angular", "Vue", "Node.js", "Express.js", "Express", "Linux", "Docker", "API", "REST API", "GraphQL", "OOP", "Database", "Backend", "Frontend", "Full Stack", "DevOps", "Mobile Development", "Game Development", "Cybersecurity", "Cloud Computing", "Operating Systems", "Networking", "Version Control", "Blockchain", "IoT", "Embedded Systems", "AR/VR", "Robotics", "Technical Portfolio", "Freelancing", "Startup Projects", "Emerging Technologies", "Technical Roadmap", "Interview Preparation", "Technical Certifications", "Internship Preparation", "Research Projects", "Graduation Projects", "Open Source Career", "Remote Work", "Technical Leadership", "Tech Entrepreneurship", "Career Planning", "Continuous Learning", "أخرى", "Kubernetes", "System Administration", "Infrastructure Projects"],
        paths: {
            "أساسيات البرمجة": ["أساسيات البرمجة","المتغيرات وأنواع البيانات","العمليات الحسابية والمنطقية","الشروط","الحلقات التكرارية","الدوال","المصفوفات والقوائم","حل المشكلات","التعامل مع الأخطاء","كتابة برامج بسيطة","مراجعة شاملة","أخرى"],
            "Python": ["Syntax Basics","Variables","Data Types","Operators","Conditions","Loops","Functions","Lists","Tuples","Dictionaries","Sets","Strings","File Handling","Exception Handling","Modules","OOP","Virtual Environment","Libraries","Flask","API","SQLite","Project Building","Debugging","Code Review","Revision","أخرى"],
            "C": ["Syntax Basics","Variables","Data Types","Operators","Conditions","Loops","Functions","Arrays","Pointers","Strings","Structures","Memory Management","File Handling","Debugging","Problem Solving","Revision","أخرى"],
            "C++": ["Syntax Basics","OOP","Classes","Objects","Inheritance","Polymorphism","Templates","STL","Vectors","Maps","Algorithms","Problem Solving","Competitive Programming","Debugging","Project Building","Revision","أخرى"],
            "Java": ["Syntax Basics","OOP","Classes","Objects","Inheritance","Interfaces","Collections","Exception Handling","File Handling","GUI","Database","Spring Basics","Project Building","Debugging","Revision","أخرى"],
            "JavaScript": ["Syntax Basics","Variables","Functions","Arrays","Objects","DOM","Events","Async Programming","Promises","Fetch API","ES6","Modules","JSON","Debugging","Frontend Basics","Project Building","Revision","أخرى"],
            "TypeScript": ["Syntax Basics","Types","Interfaces","Generics","Modules","Project Building","Debugging","Revision","أخرى"],
            "HTML": ["Structure","Forms","Semantic HTML","Tables","Media","Accessibility","Revision","أخرى"],
            "CSS": ["Selectors","Box Model","Flexbox","Grid","Responsive Design","Animations","Revision","أخرى"],
            "SQL": ["SQL Basics", "SELECT", "WHERE", "ORDER BY", "GROUP BY", "HAVING", "JOIN", "Subqueries", "Aggregate Functions", "Views", "Indexes", "Stored Procedures", "Transactions", "Advanced SQL", "SQL Projects", "Revision", "أخرى"],
            "Database Fundamentals": ["Database Concepts", "Tables", "Rows", "Columns", "Primary Key", "Foreign Key", "Relationships", "Normalization", "Constraints", "Transactions", "Database Modeling", "Revision", "أخرى"],
            "SQLite": ["SQLite Basics", "CRUD Operations", "SQLite with Python", "SQLite with Flask", "Database Projects", "Revision", "أخرى"],
            "MySQL": ["Installation", "CRUD", "Joins", "Indexes", "Stored Procedures", "Optimization", "Backup", "Security", "Projects", "Revision", "أخرى"],
            "PostgreSQL": ["Installation", "CRUD", "Advanced Queries", "Indexes", "JSON Support", "Performance", "Projects", "Revision", "أخرى"],
            "MongoDB": ["NoSQL Basics", "Collections", "Documents", "CRUD", "Aggregation", "Indexes", "MongoDB with Python", "MongoDB Projects", "Revision", "أخرى"],
            "Database Design": ["Entity Relationship Diagram", "Normalization", "Schema Design", "Relationship Design", "Optimization", "Database Architecture", "Projects", "Revision", "أخرى"],
            "ORM": ["ORM Basics", "SQLAlchemy", "Models", "Relationships", "CRUD", "Migration", "Flask Integration", "Projects", "Revision", "أخرى"],
            "Database Optimization": ["Indexes", "Query Optimization", "Caching", "Performance Analysis", "Scaling", "Monitoring", "Projects", "Revision", "أخرى"],
            "Database Security": ["Authentication", "Authorization", "SQL Injection Prevention", "Encryption", "Backup", "Recovery", "Security Best Practices", "Projects", "Revision", "أخرى"],
            "Database Projects": ["Student Management System", "Library System", "Inventory System", "E-commerce Database", "Blog Database", "Portfolio Project", "Capstone Project", "Revision", "أخرى"],
            "PHP": ["Syntax Basics","Forms","Sessions","Database","Project Building","Debugging","Revision","أخرى"],
            "Flask": ["Routing","Templates","Forms","Authentication","Database","API","Deployment","Project Building","Debugging","Revision","أخرى"],
            "Django": ["Models","Views","Templates","Forms","Authentication","Admin Panel","REST API","Deployment","Project Building","أخرى"],
            "React": ["Components","Props","State","Hooks","Routing","API Integration","Project Building","Debugging","Revision","أخرى"],
            "Angular": ["Components","Services","Routing","Forms","API Integration","Project Building","Revision","أخرى"],
            "Vue": ["Components","Directives","State Management","Routing","API Integration","Project Building","Revision","أخرى"],
            "Node.js": ["Modules","Express","Routing","Middleware","API","Database","Authentication","Deployment","Project Building","أخرى"],
            "Express": ["Routing","Middleware","REST API","Authentication","Database","Error Handling","Project Building","أخرى"],
            "Express.js": ["Routing","Middleware","REST API","Authentication","Database","Error Handling","Project Building","أخرى"],
            "Git": ["Git Basics", "Repository", "Clone", "Commit", "Branch", "Merge", "Rebase", "Pull", "Push", "Conflict Resolution", "Git Workflow", "Revision", "أخرى"],
            "GitHub": ["Repositories", "README", "Issues", "Pull Requests", "Actions", "Projects", "GitHub Pages", "Open Source", "Portfolio", "Revision", "أخرى"],
            "Linux": ["Linux Basics", "File System", "Terminal", "File Permissions", "Users and Groups", "Package Management", "Shell Scripting", "Process Management", "System Monitoring", "Cron Jobs", "Linux Networking", "Linux Security", "Server Management", "Linux Projects", "Revision", "أخرى"],
            "Docker": ["Docker Basics", "Images", "Containers", "Volumes", "Networks", "Docker Compose", "Dockerfile", "Container Management", "Docker Projects", "Revision", "أخرى"],
            "API": ["Requests","Responses","JSON","Authentication","Testing","Integration","أخرى"],
            "REST API": ["Endpoints","Methods","Status Codes","Authentication","Testing","Documentation","أخرى"],
            "GraphQL": ["Queries","Mutations","Schema","Resolvers","API Integration","أخرى"],
            "Data Structures": ["Arrays","Strings","Linked Lists","Stacks","Queues","Hash Tables","Trees","Binary Trees","Binary Search Trees","Heaps","Priority Queues","Graphs","Tries","Sets","Maps","Disjoint Set Union","Segment Tree","Fenwick Tree","Sparse Table","Revision","أخرى"],
            "Algorithms": ["Searching","Binary Search","Sorting","Recursion","Divide and Conquer","Greedy Algorithms","Dynamic Programming","Backtracking","Two Pointers","Sliding Window","Prefix Sum","Bit Manipulation","Graph Algorithms","Shortest Path","Minimum Spanning Tree","Topological Sort","String Algorithms","Mathematical Algorithms","Computational Geometry","Revision","أخرى"],
            "Problem Solving": ["Problem Analysis","Pattern Recognition","Brute Force","Optimization","Implementation","Simulation","Ad Hoc Problems","Constructive Problems","Mathematical Problems","Logic Problems","Debugging Solutions","Revision","أخرى"],
            "OOP": ["Classes","Objects","Inheritance","Polymorphism","Encapsulation","Abstraction","Revision","أخرى"],
            "Database": ["Database Concepts", "Tables", "Rows", "Columns", "Primary Key", "Foreign Key", "Relationships", "Normalization", "Constraints", "Transactions", "Database Modeling", "SQLite", "MySQL", "PostgreSQL", "Revision", "أخرى"],
            "Backend": ["Server Logic","Routing","Database","Authentication","API","Security","Deployment","Project Building","أخرى"],
            "Frontend": ["HTML","CSS","JavaScript","Responsive Design","DOM","UI Components","API Integration","Project Building","أخرى"],
            "Full Stack": ["Frontend","Backend","Database","Authentication","API","Deployment","Full Project","أخرى"],
            "DevOps": ["DevOps Fundamentals", "CI/CD", "Automation", "Infrastructure as Code", "Configuration Management", "Monitoring", "Logging", "DevOps Pipelines", "DevOps Projects", "Revision", "أخرى"],
            "Software Engineering": ["Software Development Life Cycle", "Requirements Analysis", "Software Design", "Implementation", "Testing", "Maintenance", "Agile", "Scrum", "Software Architecture", "Project Management", "Revision", "أخرى"],
            "Testing": ["Unit Testing", "Integration Testing", "Functional Testing", "Regression Testing", "Automation Testing", "Test Cases", "Quality Assurance", "Revision", "أخرى"],
            "Debugging": ["Finding Bugs", "Logic Errors", "Syntax Errors", "Runtime Errors", "Debugging Tools", "Logging", "Performance Debugging", "Revision", "أخرى"],
            "Mobile Development": ["Android Fundamentals", "Flutter", "React Native", "UI Design", "Navigation", "State Management", "Local Storage", "API Integration", "Firebase", "Performance Optimization", "Mobile Projects", "Revision", "أخرى"],
            "Game Development": ["Game Programming Basics", "Unity", "Unreal Engine", "2D Games", "3D Games", "Game Physics", "Animation", "AI for Games", "Game UI", "Game Projects", "Revision", "أخرى"],
            "Emerging Technologies": ["Quantum Computing Basics", "Edge Computing", "Digital Twins", "Autonomous Systems", "Smart Cities", "Green Computing", "Future Technologies", "Research Topics", "Revision", "أخرى"],
            "Startup Projects": ["Idea Validation", "Market Research", "MVP", "Product Design", "Team Building", "Funding Basics", "Project Management", "Startup Growth", "Startup Projects", "Revision", "أخرى"],
            "Freelancing": ["Freelancing Basics", "Client Communication", "Proposal Writing", "Project Pricing", "Time Management", "Freelance Platforms", "Portfolio Building", "Freelance Projects", "Revision", "أخرى"],
            "Technical Portfolio": ["Portfolio Planning", "GitHub Portfolio", "Personal Website", "Project Documentation", "CV Integration", "LinkedIn Profile", "Technical Blog", "Portfolio Projects", "Revision", "أخرى"],
            "Robotics": ["Robotics Basics", "Robot Programming", "Sensors", "Actuators", "Robot Control", "Autonomous Systems", "Robotics Projects", "Revision", "أخرى"],
            "AR/VR": ["AR Fundamentals", "VR Fundamentals", "Unity AR", "Unity VR", "Interaction Design", "AR Projects", "VR Projects", "Revision", "أخرى"],
            "Embedded Systems": ["Embedded Basics", "Microcontrollers", "ARM", "Real Time Systems", "Device Drivers", "Communication Protocols", "Embedded Projects", "Revision", "أخرى"],
            "IoT": ["IoT Fundamentals", "Sensors", "Microcontrollers", "Arduino", "ESP32", "Raspberry Pi", "IoT Networking", "IoT Security", "IoT Projects", "Revision", "أخرى"],
            "Blockchain": ["Blockchain Fundamentals", "Cryptography Basics", "Smart Contracts", "Ethereum", "Solidity", "Web3", "NFT Concepts", "DeFi Basics", "Blockchain Projects", "Revision", "أخرى"],
            "تطوير الويب": ["HTML","CSS","Responsive Design","Bootstrap","Tailwind CSS","JavaScript","DOM","Async JavaScript","API","JSON","Frontend","Backend","Full Stack","Flask","Django","React","Node.js","Express.js","Authentication","Session Management","REST API","Database Integration","SQLite","MySQL","PostgreSQL","Deployment","Debugging","Testing","Security Basics","Performance Optimization","Project Building","Revision","Portfolio Development","Open Source Contribution","أخرى"],
            "Documentation": ["README", "Code Documentation", "API Documentation", "Project Documentation", "Technical Writing", "Revision", "أخرى"],
            "Clean Code": ["Naming", "Formatting", "Functions", "Classes", "Code Organization", "SOLID Principles", "Best Practices", "Revision", "أخرى"],
            "Refactoring": ["Code Refactoring", "Performance Improvement", "Code Simplification", "Removing Duplication", "Revision", "أخرى"],
            "Design Patterns": ["Singleton", "Factory", "Observer", "Strategy", "MVC", "Dependency Injection", "Revision", "أخرى"],
            "Deployment": ["Deployment Basics", "Render", "VPS", "Docker", "CI/CD", "Cloud Deployment", "Monitoring", "Revision", "أخرى"],
            "Portfolio Development": ["Project Selection", "Portfolio Website", "GitHub Portfolio", "Project Documentation", "CV Integration", "Revision", "أخرى"],
            "Software Projects": ["Planning", "Development", "Testing", "Deployment", "Maintenance", "Project Improvement", "Revision", "أخرى"],
            "Cybersecurity": ["Cybersecurity Fundamentals", "Network Security", "Web Security", "Cryptography", "Authentication", "Authorization", "Security Best Practices", "Vulnerability Assessment", "Penetration Testing Basics", "Incident Response", "Digital Forensics", "Secure Coding", "Cybersecurity Projects", "Revision", "أخرى"],
            "Cloud Computing": ["Cloud Fundamentals", "IaaS", "PaaS", "SaaS", "Virtual Machines", "Storage", "Networking", "Cloud Security", "AWS Basics", "Azure Basics", "Google Cloud Basics", "Cloud Deployment", "Cloud Projects", "Revision", "أخرى"],
            "Operating Systems": ["Processes","Memory","Files","Scheduling","Linux","Revision","أخرى"],
            "Networking": ["Networking Basics", "OSI Model", "TCP/IP", "IP Addressing", "Subnetting", "DNS", "DHCP", "Routing", "Switching", "HTTP", "HTTPS", "FTP", "SSH", "Network Security", "Network Troubleshooting", "Revision", "أخرى"],
            "System Design": ["Scalability", "Load Balancing", "Caching", "Database Design", "API Design", "Microservices", "System Architecture", "Revision", "أخرى"],
            "Competitive Programming": ["Codeforces","AtCoder","LeetCode","CodeChef","TopCoder","ICPC Preparation","Contest Strategy","Virtual Contest","Upsolving","Time Management","Speed Coding","Revision","أخرى"],
            "Machine Learning": ["ML Fundamentals","Data Collection","Data Cleaning","Feature Engineering","Data Visualization","Supervised Learning","Unsupervised Learning","Regression","Classification","Clustering","Model Evaluation","Hyperparameter Tuning","Cross Validation","Ensemble Methods","Model Deployment","ML Projects","Revision","أخرى"],
            "Deep Learning": ["Neural Networks","Activation Functions","Forward Propagation","Backpropagation","Optimization","CNN","RNN","LSTM","GRU","Transformers","Transfer Learning","Fine Tuning","Model Training","Model Evaluation","DL Projects","Revision","أخرى"],
            "Data Science": ["Data Analysis","Pandas","NumPy","Data Cleaning","Data Visualization","Statistics","Exploratory Data Analysis","Feature Engineering","Business Analytics","Dashboard Building","Data Projects","Revision","أخرى"],
            "Computer Vision": ["Image Processing","OpenCV","CNN","Image Classification","Object Detection","Image Segmentation","Face Recognition","OCR","CV Projects","Revision","أخرى"],
            "Natural Language Processing": ["Text Processing","Tokenization","Word Embeddings","Sequence Models","Transformers","BERT","GPT","Text Classification","Sentiment Analysis","Machine Translation","Question Answering","Chatbots","NLP Projects","Revision","أخرى"],
            "Reinforcement Learning": ["RL Fundamentals","Markov Decision Process","Q Learning","Deep Q Network","Policy Gradient","Actor Critic","Multi Agent RL","RL Projects","Revision","أخرى"],
            "Generative AI": ["LLM Fundamentals","Prompt Engineering","Embeddings","Vector Databases","RAG","Fine Tuning","AI Agents","Function Calling","Generative AI Projects","Revision","أخرى"],
            "MLOps": ["Model Deployment","Docker","Model Monitoring","CI/CD","Model Versioning","Pipeline Building","Cloud Deployment","MLOps Projects","Revision","أخرى"],
            "AI Projects": ["Classification Project","Regression Project","NLP Project","Computer Vision Project","Generative AI Project","Healthcare AI","Education AI","Portfolio Project","Capstone Project","Revision","أخرى"],
            "Open Source": ["Finding Projects", "Understanding Code", "Issues", "Pull Requests", "Code Review", "Community Contribution", "Revision", "أخرى"],
            "Version Control": ["Git","Commits","Branches","Merge","Conflict Resolution","Workflow","أخرى"],
            "Kubernetes": ["Kubernetes Basics", "Pods", "Deployments", "Services", "Volumes", "ConfigMaps", "Secrets", "Scaling", "Monitoring", "Kubernetes Projects", "Revision", "أخرى"],
            "System Administration": ["User Management", "File Management", "Service Management", "Backup", "Monitoring", "Performance", "Security", "Automation", "Server Maintenance", "Revision", "أخرى"],
            "Infrastructure Projects": ["Linux Server", "Network Lab", "Cybersecurity Lab", "Docker Project", "Cloud Project", "DevOps Project", "Portfolio Project", "Capstone Project", "Revision", "أخرى"],
            "Technical Roadmap": ["Computer Science Roadmap", "Backend Roadmap", "Frontend Roadmap", "Full Stack Roadmap", "AI Roadmap", "Data Science Roadmap", "Cybersecurity Roadmap", "Mobile Development Roadmap", "Game Development Roadmap", "Cloud Roadmap", "Revision", "أخرى"],
            "Interview Preparation": ["Technical Interview", "Coding Interview", "Behavioral Interview", "System Design Interview", "Problem Solving Interview", "Mock Interview", "CV Review", "Revision", "أخرى"],
            "Technical Certifications": ["Programming Certificates", "Cloud Certificates", "Cybersecurity Certificates", "AI Certificates", "Data Certificates", "Linux Certificates", "Networking Certificates", "Revision", "أخرى"],
            "Internship Preparation": ["CV Building", "Portfolio", "Technical Skills", "Interview Practice", "Company Research", "Application Preparation", "Revision", "أخرى"],
            "Research Projects": ["Research Basics", "Paper Reading", "Literature Review", "Research Methodology", "Experiment Design", "Paper Writing", "Publication Preparation", "Revision", "أخرى"],
            "Graduation Projects": ["Idea Selection", "Planning", "Research", "Implementation", "Testing", "Documentation", "Presentation", "Revision", "أخرى"],
            "Open Source Career": ["GitHub Growth", "Project Contribution", "Issue Solving", "Pull Requests", "Community Engagement", "Maintaining Projects", "Revision", "أخرى"],
            "Remote Work": ["Remote Skills", "Communication", "Time Management", "Team Collaboration", "Freelance Platforms", "Remote Projects", "Revision", "أخرى"],
            "Technical Leadership": ["Team Leadership", "Project Management", "Mentoring", "Communication", "Decision Making", "Technical Planning", "Revision", "أخرى"],
            "Tech Entrepreneurship": ["Startup Planning", "MVP Development", "Market Validation", "Product Management", "Business Growth", "Funding Basics", "Revision", "أخرى"],
            "Career Planning": ["Career Exploration", "Goal Setting", "Skill Gap Analysis", "Learning Plan", "Career Transition", "Long Term Planning", "Revision", "أخرى"],
            "Continuous Learning": ["Reading Technical Books", "Watching Courses", "Following Technology News", "Building Side Projects", "Learning New Tools", "Skill Improvement", "Revision", "أخرى"],
            "Revision": ["مراجعة شاملة", "مراجعة المفاهيم", "مراجعة المشاريع", "مراجعة أسبوعية", "مراجعة المسار", "أخرى"],
            "أخرى": ["تعلم الأساسيات","تطبيق عملي","بناء مشروع","حل مسائل","مراجعة الشيفرة البرمجية","إصلاح الأخطاء البرمجية","توثيق المشروع","مراجعة شاملة","أخرى"]
        },
        states: {
            "أساسيات البرمجة": {
                current:["لا أملك أي معرفة","أعرف المفاهيم الأساسية","أستطيع كتابة برامج بسيطة","أحل مسائل متوسطة","أطبق أكثر من مفهوم معاً","أخرى"],
                target:["فهم أساسيات البرمجة","حل المشكلات الأساسية","كتابة برامج مستقلة","إتقان المفاهيم","الاستعداد للغة برمجة متقدمة","أخرى"],
                commitment:["30 دقيقة يومياً","ساعة يومياً","حل مسألتين يومياً","ثلاث جلسات أسبوعياً","حل تحديات أسبوعية","برنامج مخصص","أخرى"]
            },
            "Python": {
                current:["مبتدئ","أعرف الأساسيات","أكتب برامج بسيطة","أتعامل مع الملفات والمكتبات","أبني مشاريع صغيرة","أخرى"],
                target:["إتقان Python","كتابة برامج مستقلة","بناء مشروع عملي","استخدام المكتبات بفعالية","الاستعداد لمسار متقدم","أخرى"],
                commitment:["30 دقيقة تدريب عملي","ساعة تدريب عملي","حل مسائل يومية","تطبيق عملي يومي","مشروع أسبوعي","مراجعة الكود","أخرى"]
            },
            "Flask": {
                current:["أعرف Python","أنشأت تطبيقاً","أتعامل مع Routes","أستخدم Templates","أستخدم قواعد البيانات","أخرى"],
                target:["بناء موقع كامل","إنشاء API","ربط قاعدة بيانات","تسجيل المستخدمين","رفع المشروع","أخرى"],
                commitment:["ميزة جديدة","ساعة تطوير","حل Bug","مراجعة الكود","تطوير المشروع","أخرى"]
            },
            "Project Building": {
                current:["فكرة فقط","بدأت المشروع","طورت أجزاء","اقتربت من الإنجاز","أخرى"],
                target:["إكمال المشروع","رفع المشروع","تحسين المشروع","إضافة مميزات","بناء Portfolio","نشر المشروع","المساهمة في Open Source","أخرى"],
                commitment:["30 دقيقة تطوير","ساعة تطوير","ميزة جديدة","إصلاح Bug","تحسين الأداء","كتابة توثيق","رفع تحديث","مراجعة أسبوعية","أخرى"]
            },
            "C": {
                current:["مبتدئ","أعرف الأساسيات","أحل مسائل بسيطة","أستخدم المؤشرات","أخرى"],
                target:["إتقان الأساسيات","فهم المؤشرات","حل مسائل متقدمة","كتابة برامج متكاملة","أخرى"],
                commitment:["حل مسألة","درس يومي","مراجعة الكود","برنامج عملي","اختبار أسبوعي","أخرى"]
            },
            "C++": {
                current:["مبتدئ","أعرف الأساسيات","أعرف OOP","أستخدم STL","أخرى"],
                target:["إتقان OOP","حل مسائل متقدمة","Competitive Programming","بناء مشاريع","أخرى"],
                commitment:["حل مسائل","تدريب عملي","مراجعة STL","تحديات أسبوعية","مشروع تطبيقي","أخرى"]
            },
            "Java": {
                current:["مبتدئ","أعرف الأساسيات","أعرف OOP","أطور برامج بسيطة","أخرى"],
                target:["إتقان Java","تطوير تطبيقات","ربط قواعد البيانات","بناء مشاريع","أخرى"],
                commitment:["درس يومي","برنامج عملي","حل مسائل","تطوير مشروع","مراجعة أسبوعية","أخرى"]
            },
            "JavaScript": {
                current:["أعرف الأساسيات","أستخدم DOM","أتعامل مع Events","أستخدم Async","أخرى"],
                target:["إتقان JavaScript","إنشاء تطبيقات تفاعلية","ربط API","بناء مشاريع","أخرى"],
                commitment:["حل تحديات","ساعة تدريب","بناء ميزة","إصلاح أخطاء","أخرى"]
            },
            "HTML": {
                current:["لا أعرف HTML","أعرف أساسيات HTML","أستطيع إنشاء صفحة بسيطة","أستخدم النماذج والجداول","أبني صفحات متكاملة","أخرى"],
                target:["فهم HTML","إنشاء صفحات احترافية","كتابة هيكل صحيح","تحسين الوصولية","بناء مشروع كامل","أخرى"],
                commitment:["30 دقيقة يومياً","إنشاء صفحة","إعادة بناء تصميم","تطبيق عملي","مشروع صغير","أخرى"]
            },
            "CSS": {
                current:["لا أعرف CSS","أعرف التنسيق الأساسي","أستخدم Flexbox","أستخدم Grid","أصمم صفحات كاملة","أخرى"],
                target:["تصميم احترافي","Responsive Design","إتقان Flexbox","إتقان Grid","تحسين تجربة المستخدم","أخرى"],
                commitment:["تصميم عنصر","إعادة تصميم صفحة","تطبيق عملي","ساعة يومياً","مشروع تصميم","أخرى"]
            },
            "Responsive Design": {
                current:["مبتدئ","أعرف Media Queries","أصمم للهواتف","أصمم لجميع الأجهزة","أخرى"],
                target:["تصميم متجاوب كامل","تحسين تجربة الهاتف","تحسين الكمبيوتر","تحسين الأجهزة اللوحية","أخرى"],
                commitment:["تصميم يومي","تجربة أجهزة","إعادة تصميم","تحسين واجهة","أخرى"]
            },
            "API": {
                current:["لا أعرف API","أعرف المفهوم","أرسل Requests","أتعامل مع JSON","أبني API","أخرى"],
                target:["استخدام API","بناء REST API","ربط التطبيقات","توثيق API","أخرى"],
                commitment:["طلب API","تجربة Endpoint","ربط مشروع","بناء خدمة","أخرى"]
            },
            "Django": {
                current:["مبتدئ","أعرف Models","أتعامل مع Views","أستخدم Admin Panel","أخرى"],
                target:["بناء مشروع","إدارة المستخدمين","ربط قاعدة بيانات","رفع المشروع","أخرى"],
                commitment:["درس عملي","تطوير ميزة","مشروع","إصلاح أخطاء","أخرى"]
            },
            "React": {
                current:["أعرف الأساسيات","أستخدم Components","أتعامل مع State","أستخدم Hooks","أخرى"],
                target:["بناء واجهات حديثة","إدارة الحالة","ربط API","بناء مشروع","أخرى"],
                commitment:["مكون جديد","تطوير واجهة","حل تحديات","مشروع","أخرى"]
            },
            "Backend": {
                current:["مبتدئ","أعرف المفاهيم","أبني API","أتعامل مع قواعد البيانات","أخرى"],
                target:["بناء Backend كامل","إدارة المستخدمين","تحسين الأداء","رفع المشروع","أخرى"],
                commitment:["ميزة جديدة","بناء API","إصلاح Bug","تحسين الأداء","أخرى"]
            },
            "Frontend": {
                current:["مبتدئ","أعرف HTML/CSS","أستخدم JavaScript","أستخدم Framework","أخرى"],
                target:["بناء واجهات احترافية","تحسين UX","تحسين UI","إكمال مشروع","أخرى"],
                commitment:["تصميم واجهة","تطوير عنصر","تحسين تجربة","مشروع","أخرى"]
            },
            "Full Stack": {
                current:["أعرف Frontend","أعرف Backend","أربط الطرفين","أنشأت مشروعاً","أخرى"],
                target:["بناء تطبيق كامل","إدارة المشروع","رفع التطبيق","تحسين الأداء","إنشاء Portfolio","أخرى"],
                commitment:["ساعة تطوير","ميزة جديدة","إصلاح أخطاء","اختبار النظام","توثيق المشروع","تطوير مشروع كامل","أخرى"]
            },
            "تطوير الويب": {
                current:["مبتدئ","أعرف HTML/CSS","أستخدم JavaScript","أفهم Frontend و Backend","أبني مشاريع ويب","أخرى"],
                target:["بناء موقع كامل","بناء تطبيق ويب","تحسين الواجهة والخلفية","نشر المشروع","تطوير Portfolio","أخرى"],
                commitment:["ساعة تطوير","تطبيق عملي","بناء ميزة","إصلاح أخطاء","مراجعة أسبوعية","أخرى"]
            },
            "Portfolio Development": {
                current:["لا أملك Portfolio", "لدي مشاريع قليلة", "أحتاج تحسين العرض", "لدي Portfolio بسيط", "أخرى"],
                target:["بناء Portfolio قوي", "عرض المشاريع بوضوح", "تحسين GitHub", "نشر المشاريع", "أخرى"],
                commitment:["تحسين مشروع", "كتابة وصف مشروع", "رفع تحديث", "مراجعة أسبوعية", "أخرى"]
            },
            "Open Source Contribution": {
                current:["لم أساهم من قبل","أعرف GitHub","أفهم Issues","قدمت مساهمة بسيطة","أخرى"],
                target:["المساهمة في Open Source","فهم Pull Requests","تحسين مشروع مفتوح المصدر","بناء سجل مساهمات","أخرى"],
                commitment:["قراءة Issue","تحسين توثيق","إرسال Pull Request","مراجعة أسبوعية","أخرى"]
            },
            "Debugging": {
                current:["أواجه صعوبة", "أحل أخطاء بسيطة", "أحل أخطاء متوسطة", "أحل أخطاء معقدة", "أخرى"],
                target:["تحسين المهارة", "تقليل الأخطاء", "تحليل المشاكل", "إصلاح الأخطاء بسرعة", "أخرى"],
                commitment:["حل Bug", "تحليل خطأ", "تطبيق عملي", "مراجعة الكود", "أخرى"]
            },
            "Code Review": {
                current:["لا أراجع الكود","أراجع بشكل بسيط","أكتشف بعض الأخطاء","أحسن بنية الكود","أخرى"],
                target:["مراجعة الشيفرة البرمجية بثقة","تحسين جودة الكود","اكتشاف الأخطاء مبكراً","اتباع أسلوب كتابة أفضل","أخرى"],
                commitment:["مراجعة يومية","مراجعة مشروع","تحسين جزء من الكود","توثيق الملاحظات","أخرى"]
            },
            "Data Structures": {
                current:["لا أعرف المفهوم","أعرف الأساسيات","أفهم طريقة العمل","أستطيع حل مسائل بسيطة","أحل مسائل متوسطة","أحل مسائل متقدمة","أخرى"],
                target:["فهم البنية","تطبيقها عملياً","حل مسائل سهلة","حل مسائل متوسطة","حل مسائل متقدمة","اختيار البنية المناسبة","استخدامها في المشاريع","الاستعداد للمقابلات","أخرى"],
                commitment:["حل مسألة يومياً","حل ثلاث مسائل","مراجعة المفهوم","رسم المخططات","تطبيق عملي","مراجعة أسبوعية","برنامج خاص","أخرى"]
            },
            "Algorithms": {
                current:["لا أعرف المفهوم","أعرف الأساسيات","أطبق الخوارزميات البسيطة","أحل مسائل متوسطة","أحل مسائل متقدمة","أخرى"],
                target:["فهم الخوارزميات","تحليل التعقيد","اختيار الحل المناسب","حل مسائل متقدمة","تحسين الأداء","الاستعداد للمقابلات","Competitive Programming","أخرى"],
                commitment:["حل مسألة","حل تحديات","تحليل الحلول","مراجعة المفهوم","ساعة تدريب","اختبار أسبوعي","أخرى"]
            },
            "Problem Solving": {
                current:["أواجه صعوبة","أحل مسائل سهلة","أحل مسائل متوسطة","أحل مسائل متنوعة","أخرى"],
                target:["تحسين التفكير","زيادة سرعة الحل","تحسين جودة الحل","تقليل الأخطاء","حل مسائل صعبة","أخرى"],
                commitment:["مسألة يومية","ثلاث مسائل","مسابقة أسبوعية","تحليل الحلول","تصحيح الأخطاء","مراجعة أسبوعية","أخرى"]
            },
            "Competitive Programming": {
                current:["لم أبدأ","أشارك أحياناً","أشارك باستمرار","أحل مسائل متوسطة","أحل مسائل متقدمة","أخرى"],
                target:["زيادة التصنيف","تحسين سرعة الحل","حل مسائل أصعب","تحسين الأداء","الاستعداد للمسابقات","تحقيق تصنيف مستهدف","أخرى"],
                commitment:["مسألة يومية","ثلاث مسائل يومياً","مسابقة أسبوعية","Virtual Contest","Upsolving","تحليل الأخطاء","مراجعة أسبوعية","أخرى"]
            },
            "SQL": {
                current:["لا أعرف SQL", "أعرف الأساسيات", "أكتب استعلامات بسيطة", "أتعامل مع JOIN", "أكتب استعلامات متقدمة", "أخرى"],
                target:["فهم SQL", "كتابة استعلامات احترافية", "تحليل البيانات", "إدارة قواعد البيانات", "تطبيق مشاريع", "أخرى"],
                commitment:["درس يومي", "كتابة استعلامات", "حل تحديات", "مشروع عملي", "مراجعة أسبوعية", "أخرى"]
            },
            "Database Fundamentals": {
                current:["لا أعرف المفهوم", "أعرف الأساسيات", "أفهم العلاقات", "أصمم قواعد بيانات", "أخرى"],
                target:["فهم قواعد البيانات", "تصميم قاعدة بيانات", "بناء مشروع", "تحسين التصميم", "أخرى"],
                commitment:["درس", "رسم مخطط", "تطبيق عملي", "مشروع", "مراجعة", "أخرى"]
            },
            "SQLite": {
                current:["مبتدئ", "أعرف الأساسيات", "أستخدمها مع Python", "أستخدمها مع Flask", "أخرى"],
                target:["بناء تطبيق", "ربط مشروع", "إدارة البيانات", "إكمال مشروع", "أخرى"],
                commitment:["تطبيق", "ربط قاعدة بيانات", "مشروع", "مراجعة", "أخرى"]
            },
            "MySQL": {
                current:["مبتدئ", "أعرف الأساسيات", "أستخدم CRUD", "أتعامل مع Joins", "أخرى"],
                target:["إدارة قاعدة بيانات", "كتابة استعلامات عملية", "تحسين الأداء", "تأمين البيانات", "بناء مشروع", "أخرى"],
                commitment:["درس عملي", "كتابة استعلامات", "تطبيق على مشروع", "مراجعة أسبوعية", "أخرى"]
            },
            "PostgreSQL": {
                current:["مبتدئ", "أعرف الأساسيات", "أستخدم CRUD", "أكتب استعلامات متقدمة", "أخرى"],
                target:["إدارة PostgreSQL", "استخدام Advanced Queries", "تحسين الأداء", "بناء مشروع", "أخرى"],
                commitment:["درس عملي", "تطبيق استعلامات", "تحسين مشروع", "مراجعة أسبوعية", "أخرى"]
            },
            "MongoDB": {
                current:["لا أعرف NoSQL", "أعرف الأساسيات", "أستخدم CRUD", "أبني مشاريع", "أخرى"],
                target:["فهم MongoDB", "بناء مشروع", "تحسين الأداء", "إدارة البيانات", "أخرى"],
                commitment:["درس", "تطبيق", "مشروع", "حل تحديات", "مراجعة", "أخرى"]
            },
            "Database Design": {
                current:["مبتدئ", "أعرف المفاهيم", "أصمم قواعد بيانات", "أخرى"],
                target:["تصميم احترافي", "تحسين الأداء", "بناء مشروع", "أخرى"],
                commitment:["رسم مخطط", "تصميم قاعدة بيانات", "مشروع", "تحسين التصميم", "أخرى"]
            },
            "ORM": {
                current:["لا أعرف ORM", "أعرف الأساسيات", "أستخدم SQLAlchemy", "أطبق مشاريع", "أخرى"],
                target:["ربط التطبيقات", "إدارة البيانات", "بناء مشروع", "أخرى"],
                commitment:["درس", "تطبيق", "ربط مشروع", "تحسين الكود", "أخرى"]
            },
            "Database Optimization": {
                current:["مبتدئ", "أعرف Indexes", "أحلل أداء الاستعلامات", "أحسن قواعد بيانات", "أخرى"],
                target:["تحسين الاستعلامات", "رفع الأداء", "تحليل المشكلات", "تطبيق تحسينات عملية", "أخرى"],
                commitment:["تحليل Query", "إضافة Index", "مراجعة الأداء", "تطبيق تحسين", "أخرى"]
            },
            "Database Security": {
                current:["مبتدئ", "أعرف أساسيات الحماية", "أفهم SQL Injection", "أطبق نسخاً احتياطياً", "أخرى"],
                target:["تأمين قاعدة البيانات", "منع SQL Injection", "إدارة الصلاحيات", "حماية البيانات", "أخرى"],
                commitment:["مراجعة صلاحيات", "تطبيق حماية", "اختبار أمني", "نسخ احتياطي", "مراجعة أسبوعية", "أخرى"]
            },
            "Database Projects": {
                current:["فكرة", "بدأت المشروع", "أنجزت جزءاً", "اقتربت من الإنجاز", "أخرى"],
                target:["إكمال المشروع", "تحسين المشروع", "ربطه بتطبيق", "رفع المشروع", "بناء Portfolio", "أخرى"],
                commitment:["ساعة تطوير", "ميزة جديدة", "تحسين قاعدة البيانات", "توثيق المشروع", "إصلاح الأخطاء", "أخرى"]
            },
            "Database": {
                current:["لا أعرف المفهوم", "أعرف الأساسيات", "أفهم العلاقات", "أستخدم SQL", "أصمم قواعد بيانات", "أخرى"],
                target:["فهم قواعد البيانات", "تصميم قاعدة بيانات", "ربطها بتطبيق", "تحسين الأداء", "بناء مشروع", "أخرى"],
                commitment:["درس يومي", "رسم مخطط", "كتابة استعلامات", "تطبيق عملي", "مراجعة أسبوعية", "أخرى"]
            },
            "Machine Learning": {
                current:["لا أعرف المفهوم","أعرف الأساسيات","أطبق أمثلة بسيطة","أبني نماذج أولية","أطبق مشاريع","أخرى"],
                target:["فهم المفاهيم","بناء نموذج عملي","تحسين النماذج","تطبيق مشروع متكامل","نشر نموذج","أخرى"],
                commitment:["درس يومي","تطبيق عملي","تحليل Dataset","بناء نموذج","تحسين نموذج","مشروع أسبوعي","أخرى"]
            },
            "Deep Learning": {
                current:["لا أعرف المفهوم","أعرف الأساسيات","أطبق نماذج بسيطة","أبني شبكات","أطبق مشاريع","أخرى"],
                target:["فهم الشبكات","بناء نموذج","تحسين الأداء","تطبيق مشروع","نشر النموذج","أخرى"],
                commitment:["ساعة دراسة","تطبيق عملي","بناء نموذج","تحليل النتائج","مشروع","أخرى"]
            },
            "Data Science": {
                current:["مبتدئ","أعرف الأساسيات","أحلل البيانات","أطبق مشاريع","أخرى"],
                target:["تحليل البيانات","بناء Dashboard","استخراج النتائج","تطبيق مشروع","أخرى"],
                commitment:["تحليل Dataset","حل تمرين","مشروع","مراجعة","أخرى"]
            },
            "Computer Vision": {
                current:["مبتدئ","أعرف المفاهيم","أطبق أمثلة","أبني مشاريع","أخرى"],
                target:["تطبيق عملي","بناء مشروع","تحسين النموذج","نشر المشروع","أخرى"],
                commitment:["تطبيق","تدريب نموذج","مشروع","تحليل النتائج","أخرى"]
            },
            "Natural Language Processing": {
                current:["مبتدئ","أعرف الأساسيات","أطبق نماذج","أبني مشاريع","أخرى"],
                target:["فهم NLP","تطبيق مشروع","تحسين النموذج","نشر المشروع","أخرى"],
                commitment:["درس","تطبيق","مشروع","تحليل","مراجعة","أخرى"]
            },
            "Reinforcement Learning": {
                current:["لا أعرف المفهوم","أعرف الأساسيات","أطبق أمثلة بسيطة","أبني تجارب أولية","أخرى"],
                target:["فهم RL","بناء تجربة عملية","تحسين سياسة التعلم","تطبيق مشروع","أخرى"],
                commitment:["درس يومي","تطبيق عملي","تحليل النتائج","تجربة نموذج","مراجعة أسبوعية","أخرى"]
            },
            "Generative AI": {
                current:["مبتدئ","أعرف المفاهيم الأساسية","أستخدم أدوات جاهزة","أبني نماذج أولية","أخرى"],
                target:["فهم LLM Fundamentals","بناء تطبيق Generative AI","تطبيق RAG","تحسين Prompt Engineering","بناء مشروع عملي","أخرى"],
                commitment:["درس يومي","تجربة Prompt","بناء ميزة","تحليل النتائج","تطوير مشروع","أخرى"]
            },
            "MLOps": {
                current:["مبتدئ","أعرف Model Deployment","أستخدم Docker","أبني Pipeline بسيطة","أخرى"],
                target:["نشر نموذج","بناء Pipeline","مراقبة النموذج","إدارة الإصدارات","تطبيق مشروع MLOps","أخرى"],
                commitment:["تطبيق عملي","تجربة Deployment","تحسين Pipeline","مراجعة النظام","مشروع أسبوعي","أخرى"]
            },
            "AI Projects": {
                current:["فكرة","بدأت المشروع","أنجزت جزءاً","اقتربت من الإنجاز","أخرى"],
                target:["إكمال المشروع","تحسين المشروع","رفع المشروع","بناء Portfolio","نشر المشروع","أخرى"],
                commitment:["ساعة تطوير","ميزة جديدة","تحليل النتائج","إصلاح الأخطاء","توثيق المشروع","رفع تحديث","أخرى"]
            },
            "Linux": {
                current:["لا أعرف Linux", "أعرف الأوامر الأساسية", "أستخدم Terminal", "أدير النظام", "أدير الخوادم", "أخرى"],
                target:["إتقان Linux", "إدارة الخوادم", "كتابة Scripts", "إدارة المشاريع", "إعداد بيئة احترافية", "أخرى"],
                commitment:["درس يومي", "تطبيق عملي", "كتابة Script", "إدارة خادم", "مشروع", "مراجعة", "أخرى"]
            },
            "Networking": {
                current:["لا أعرف الشبكات", "أعرف المفاهيم", "أفهم البروتوكولات", "أحل المشاكل", "أخرى"],
                target:["فهم الشبكات", "إدارة الشبكات", "حل المشكلات", "تطبيق عملي", "أخرى"],
                commitment:["درس", "تطبيق", "تحليل شبكة", "حل مشكلة", "مشروع", "أخرى"]
            },
            "Cybersecurity": {
                current:["لا أعرف الأمن السيبراني", "أعرف الأساسيات", "أطبق المفاهيم", "أنفذ مشاريع", "أخرى"],
                target:["فهم الأمن السيبراني", "تأمين الأنظمة", "تحليل الثغرات", "بناء مشروع", "أخرى"],
                commitment:["درس", "تطبيق", "مختبر عملي", "تحليل ثغرة", "مشروع", "مراجعة", "أخرى"]
            },
            "Cloud Computing": {
                current:["مبتدئ", "أعرف المفاهيم الأساسية", "استخدم خدمات بسيطة", "نشرت مشروعاً بسيطاً", "أخرى"],
                target:["فهم Cloud Computing", "نشر تطبيق على Cloud", "إدارة الموارد", "تحسين الأمان والأداء", "بناء مشروع Cloud", "أخرى"],
                commitment:["درس", "تطبيق عملي", "نشر تجربة", "تحسين إعدادات", "مشروع", "مراجعة", "أخرى"]
            },
            "Docker": {
                current:["مبتدئ", "أعرف الأساسيات", "أبني Containers", "أستخدم Docker Compose", "أخرى"],
                target:["إتقان Docker", "إدارة التطبيقات", "نشر المشاريع", "أخرى"],
                commitment:["تطبيق عملي", "إنشاء Container", "بناء Image", "مشروع", "مراجعة", "أخرى"]
            },
            "Kubernetes": {
                current:["مبتدئ", "أعرف المفاهيم الأساسية", "أتعامل مع Pods", "أدير Deployments بسيطة", "أخرى"],
                target:["فهم Kubernetes", "إدارة Services و Deployments", "توسيع التطبيقات", "مراقبة النظام", "بناء مشروع Kubernetes", "أخرى"],
                commitment:["درس", "تطبيق عملي", "إعداد Deployment", "تحسين Service", "مشروع", "مراجعة", "أخرى"]
            },
            "DevOps": {
                current:["لا أعرف DevOps", "أعرف المفاهيم", "أطبق الأدوات", "أبني Pipelines", "أخرى"],
                target:["فهم DevOps", "أتمتة العمليات", "بناء CI/CD", "إدارة المشاريع", "أخرى"],
                commitment:["درس", "تطبيق", "Pipeline", "مشروع", "تحسين الأداء", "أخرى"]
            },
            "System Administration": {
                current:["مبتدئ", "أدير ملفات ومستخدمين", "أدير خدمات بسيطة", "أتابع أداء النظام", "أخرى"],
                target:["إدارة النظام بكفاءة", "تحسين الأداء", "تأمين الخادم", "أتمتة المهام", "صيانة الخوادم", "أخرى"],
                commitment:["درس", "تطبيق عملي", "مهمة إدارة", "نسخ احتياطي", "مراجعة أمنية", "أخرى"]
            },
            "Infrastructure Projects": {
                current:["فكرة", "بدأت المشروع", "أنجزت جزءاً", "اقتربت من الإنجاز", "أخرى"],
                target:["إكمال المشروع", "تحسين المشروع", "رفع المشروع", "بناء Portfolio", "نشر المشروع", "أخرى"],
                commitment:["ساعة تطوير", "ميزة جديدة", "إصلاح مشكلة", "تحسين الأداء", "توثيق", "رفع تحديث", "أخرى"]
            },
            "Mobile Development": {
                current:["لا أعرف تطوير التطبيقات", "أعرف الأساسيات", "أنشأت تطبيقاً بسيطاً", "أطور تطبيقات", "أخرى"],
                target:["بناء تطبيق كامل", "ربط API", "نشر التطبيق", "تحسين الأداء", "بناء Portfolio", "أخرى"],
                commitment:["درس", "تطبيق عملي", "ميزة جديدة", "مشروع", "اختبار التطبيق", "أخرى"]
            },
            "Game Development": {
                current:["لا أعرف تطوير الألعاب", "أعرف المفاهيم الأساسية", "أنشأت لعبة بسيطة", "أطبق مشاريع ألعاب", "أخرى"],
                target:["فهم Game Development", "بناء لعبة 2D", "بناء لعبة 3D", "تحسين تجربة اللعب", "بناء مشروع ألعاب", "أخرى"],
                commitment:["درس", "تطبيق عملي", "ميزة جديدة", "اختبار اللعبة", "مشروع", "أخرى"]
            },
            "Blockchain": {
                current:["لا أعرف Blockchain", "أعرف المفاهيم الأساسية", "أفهم Smart Contracts", "أطبق مشروعاً بسيطاً", "أخرى"],
                target:["فهم Blockchain", "بناء Smart Contract", "تطبيق Web3", "بناء مشروع Blockchain", "أخرى"],
                commitment:["درس", "تطبيق عملي", "كتابة عقد ذكي", "تحليل مشروع", "مراجعة", "أخرى"]
            },
            "IoT": {
                current:["لا أعرف IoT", "أعرف المفاهيم الأساسية", "أتعامل مع Sensors", "أبني تجارب بسيطة", "أخرى"],
                target:["فهم IoT", "بناء مشروع IoT", "ربط الأجهزة بالشبكة", "تحسين الأمان", "أخرى"],
                commitment:["درس", "تطبيق عملي", "تجربة Sensor", "مشروع", "مراجعة", "أخرى"]
            },
            "Embedded Systems": {
                current:["مبتدئ", "أعرف Microcontrollers", "أتعامل مع Hardware بسيط", "أطبق مشاريع", "أخرى"],
                target:["فهم Embedded Systems", "برمجة Microcontrollers", "بناء مشروع عملي", "تحسين الأداء", "أخرى"],
                commitment:["درس", "تطبيق عملي", "تجربة Hardware", "مشروع", "مراجعة", "أخرى"]
            },
            "AR/VR": {
                current:["لا أعرف AR/VR", "أعرف المفاهيم الأساسية", "أطبق تجربة بسيطة", "أعمل على مشروع", "أخرى"],
                target:["فهم AR/VR", "بناء تجربة تفاعلية", "تطوير مشروع AR", "تطوير مشروع VR", "أخرى"],
                commitment:["درس", "تطبيق عملي", "تحسين التفاعل", "مشروع", "مراجعة", "أخرى"]
            },
            "Robotics": {
                current:["لا أعرف Robotics", "أعرف المفاهيم الأساسية", "أبرمج روبوتاً بسيطاً", "أتعامل مع Sensors و Actuators", "أخرى"],
                target:["فهم Robotics", "برمجة Robot", "بناء نظام Autonomous", "تنفيذ مشروع Robotics", "أخرى"],
                commitment:["درس", "تطبيق عملي", "تجربة تحكم", "مشروع", "مراجعة", "أخرى"]
            },
            "Technical Portfolio": {
                current:["لا أملك Portfolio", "بدأت Portfolio", "أضفت مشاريع", "Portfolio جيد", "أخرى"],
                target:["Portfolio احترافي", "تحسين المشاريع", "رفع المشاريع", "تطوير الموقع الشخصي", "أخرى"],
                commitment:["رفع مشروع", "تحسين مشروع", "كتابة توثيق", "تحديث GitHub", "مراجعة أسبوعية", "أخرى"]
            },
            "Freelancing": {
                current:["لا أعرف العمل الحر", "أعرف المفاهيم", "نفذت مشروعاً", "أعمل مع عملاء", "أخرى"],
                target:["الحصول على أول عميل", "تنفيذ مشاريع", "زيادة الخبرة", "بناء سمعة قوية", "أخرى"],
                commitment:["ساعة تعلم", "تحسين Portfolio", "التواصل مع العملاء", "تنفيذ مشروع", "أخرى"]
            },
            "Startup Projects": {
                current:["فكرة فقط", "أدرس الفكرة", "بدأت التنفيذ", "لدي مشروع", "أخرى"],
                target:["بناء MVP", "إطلاق المشروع", "تحسين المنتج", "توسيع المشروع", "أخرى"],
                commitment:["تحسين المنتج", "ميزة جديدة", "اختبار المستخدمين", "تحليل السوق", "أخرى"]
            },
            "Emerging Technologies": {
                current:["مبتدئ", "أعرف المفاهيم العامة", "أتابع التطورات", "أبحث في موضوع محدد", "أخرى"],
                target:["فهم التقنية", "إعداد بحث", "تطبيق تجربة أولية", "بناء مشروع تجريبي", "أخرى"],
                commitment:["قراءة بحث", "تلخيص فكرة", "تجربة عملية", "مراجعة أسبوعية", "أخرى"]
            },
            "Technical Roadmap": {
                current:["لا أعرف الطريق", "أعرف الأساسيات", "لدي خطة مبدئية", "أسير بخطة واضحة", "أخرى"],
                target:["بناء خطة واضحة", "إكمال Roadmap", "تحقيق الأهداف", "تطوير المسار", "أخرى"],
                commitment:["مراجعة الخطة", "إنجاز مرحلة", "تعلم مهارة", "تحديث الخطة", "أخرى"]
            },
            "Interview Preparation": {
                current:["لم أبدأ", "أعرف الأساسيات", "أتدرب أحياناً", "مستعد للمقابلات", "أخرى"],
                target:["اجتياز المقابلات", "تحسين الأداء", "زيادة الثقة", "الحصول على فرصة", "أخرى"],
                commitment:["حل أسئلة", "Mock Interview", "تحسين CV", "مراجعة", "أخرى"]
            },
            "Technical Certifications": {
                current:["لم أحدد الشهادة", "أعرف المتطلبات", "بدأت التحضير", "أحل تدريبات", "أخرى"],
                target:["اختيار الشهادة المناسبة", "إكمال التحضير", "اجتياز الشهادة", "تعزيز المسار المهني", "أخرى"],
                commitment:["درس يومي", "حل أسئلة", "مراجعة المجالات", "اختبار تجريبي", "مراجعة أسبوعية", "أخرى"]
            },
            "Internship Preparation": {
                current:["لم أبدأ", "لدي CV مبدئي", "أملك مشاريع بسيطة", "أتدرب على المقابلات", "أخرى"],
                target:["تجهيز CV قوي", "بناء Portfolio", "الاستعداد للمقابلات", "التقديم للتدريب", "الحصول على تدريب", "أخرى"],
                commitment:["تحسين CV", "تطوير مشروع", "تدريب مقابلة", "بحث عن شركات", "تقديم طلب", "مراجعة أسبوعية", "أخرى"]
            },
            "Research Projects": {
                current:["لا أعرف البحث العلمي", "أعرف الأساسيات", "أقرأ الأوراق العلمية", "أعمل على مشروع", "أخرى"],
                target:["إجراء بحث", "كتابة ورقة", "نشر بحث", "المشاركة في مؤتمر", "أخرى"],
                commitment:["قراءة Paper", "تلخيص", "تحليل", "كتابة", "تطبيق عملي", "أخرى"]
            },
            "Graduation Projects": {
                current:["لم أختر فكرة", "اخترت فكرة مبدئية", "بدأت التخطيط", "بدأت التنفيذ", "أخرى"],
                target:["اختيار فكرة قوية", "تنفيذ المشروع", "اختبار المشروع", "توثيق المشروع", "عرض المشروع بنجاح", "أخرى"],
                commitment:["تطوير جزء", "قراءة مرجع", "اختبار ميزة", "توثيق", "تحضير عرض", "مراجعة أسبوعية", "أخرى"]
            },
            "Open Source Career": {
                current:["لم أبدأ", "أتابع مشاريع", "أحل Issues بسيطة", "أرسلت Pull Requests", "أخرى"],
                target:["المساهمة بانتظام", "تحسين GitHub", "بناء سمعة تقنية", "المشاركة في مشاريع مؤثرة", "أخرى"],
                commitment:["قراءة كود", "حل Issue", "إرسال Pull Request", "مراجعة مشروع", "تواصل مجتمعي", "أخرى"]
            },
            "Remote Work": {
                current:["لا أعرف العمل عن بعد", "أعرف المفاهيم", "أعمل أحياناً", "أعمل باستمرار", "أخرى"],
                target:["الحصول على وظيفة", "زيادة الخبرة", "تحسين الدخل", "بناء مسيرة مهنية", "أخرى"],
                commitment:["ساعة تعلم", "مشروع", "تطوير Portfolio", "التقديم للوظائف", "أخرى"]
            },
            "Technical Leadership": {
                current:["لا أقود فرقاً", "أساعد زملاء", "أدير مهام صغيرة", "أقود مشروعاً", "أخرى"],
                target:["قيادة فريق", "تحسين التواصل", "إدارة القرارات التقنية", "توجيه الآخرين", "أخرى"],
                commitment:["تخطيط مهمة", "مراجعة فريق", "Mentoring", "تحسين تواصل", "مراجعة أسبوعية", "أخرى"]
            },
            "Tech Entrepreneurship": {
                current:["فكرة فقط", "أدرس السوق", "أبني MVP", "لدي منتج مبدئي", "أخرى"],
                target:["اختبار الفكرة", "بناء MVP", "إطلاق المنتج", "نمو المشروع", "أخرى"],
                commitment:["تحليل سوق", "تطوير ميزة", "مقابلة مستخدمين", "تحسين المنتج", "مراجعة أسبوعية", "أخرى"]
            },
            "Career Planning": {
                current:["لا أعرف المسار", "أبحث عن المجال", "اخترت التخصص", "أسير بخطة", "أخرى"],
                target:["اختيار المسار", "بناء الخبرة", "الحصول على فرصة", "تحقيق الأهداف", "أخرى"],
                commitment:["مراجعة الخطة", "تعلم مهارة", "تحسين Portfolio", "التقديم", "مراجعة أسبوعية", "أخرى"]
            },
            "Continuous Learning": {
                current:["أتعلم بشكل متقطع", "لدي مصادر متعددة", "أتعلم بانتظام", "أطبق ما أتعلمه", "أخرى"],
                target:["الاستمرار في التعلم", "تحديث المهارات", "بناء مشاريع جانبية", "متابعة التقنيات الحديثة", "أخرى"],
                commitment:["قراءة تقنية", "مشاهدة درس", "تطبيق أداة", "مشروع جانبي", "مراجعة أسبوعية", "أخرى"]
            },
            "Revision": {
                current:["أحتاج مراجعة شاملة", "نسيت بعض المفاهيم", "أراجع جزئياً", "مستواي جيد", "أخرى"],
                target:["تثبيت المفاهيم", "سد الفجوات", "تحسين التطبيق العملي", "الاستعداد للمرحلة التالية", "أخرى"],
                commitment:["مراجعة يومية", "حل تدريبات", "تلخيص مفاهيم", "اختبار ذاتي", "مراجعة أسبوعية", "أخرى"]
            },
            "أخرى": {
                current:["مبتدئ","أعرف الأساسيات","أحتاج تدريباً عملياً","أعمل على مشروع","أخرى"],
                target:["إتقان المهارة","بناء مشروع متكامل","الاستعداد للتدريب العملي","تحسين المستوى","أخرى"],
                commitment:["30 دقيقة يومياً","ساعة يومياً","تطبيق عملي","مشروع أسبوعي","مراجعة أسبوعية","أخرى"]
            },
            "Software Engineering": {
                current:["لا أعرف المفهوم", "أعرف الأساسيات", "أطبق المفاهيم", "أشارك في مشاريع", "أخرى"],
                target:["فهم هندسة البرمجيات", "إدارة مشروع", "بناء تطبيق متكامل", "تحسين جودة البرمجيات", "أخرى"],
                commitment:["درس يومي", "تطبيق عملي", "تحليل مشروع", "بناء مشروع", "مراجعة أسبوعية", "أخرى"]
            },
            "Git": {
                current:["لم أستخدم Git", "أعرف الأساسيات", "أستخدم Git يومياً", "أتعامل مع الفروع", "أخرى"],
                target:["إتقان Git", "إدارة المشاريع", "حل التعارضات", "العمل الجماعي", "أخرى"],
                commitment:["تطبيق عملي", "Commit يومي", "حل مشكلة", "مشروع", "مراجعة", "أخرى"]
            },
            "GitHub": {
                current:["لم أستخدم GitHub", "أرفع مشاريع بسيطة", "أتعامل مع Repositories", "أستخدم Issues و Pull Requests", "أخرى"],
                target:["تنظيم المشاريع على GitHub", "كتابة README احترافي", "استخدام Pull Requests", "بناء Portfolio على GitHub", "أخرى"],
                commitment:["رفع تحديث", "تحسين README", "فتح Issue", "إرسال Pull Request", "مراجعة أسبوعية", "أخرى"]
            },
            "Testing": {
                current:["لا أعرف Testing", "أعرف الأساسيات", "أكتب اختبارات", "أطبق الاختبارات", "أخرى"],
                target:["تحسين الجودة", "كتابة اختبارات", "اختبار المشاريع", "أخرى"],
                commitment:["كتابة اختبار", "تحليل النتائج", "مشروع", "مراجعة", "أخرى"]
            },
            "Documentation": {
                current:["نادراً أوثق", "أوثق أحياناً", "أوثق المشاريع", "أخرى"],
                target:["تحسين التوثيق", "كتابة README احترافي", "توثيق مشروع كامل", "أخرى"],
                commitment:["توثيق ميزة", "تحسين README", "كتابة شرح", "مشروع", "أخرى"]
            },
            "Clean Code": {
                current:["أكتب كوداً غير منظم", "أحاول تنظيم الكود", "أطبق بعض الممارسات الجيدة", "أخرى"],
                target:["كتابة كود واضح", "تحسين أسماء المتغيرات", "تنظيم الدوال والفئات", "اتباع Best Practices", "أخرى"],
                commitment:["تحسين ملف كود", "مراجعة Naming", "إعادة تنظيم دالة", "مراجعة أسبوعية", "أخرى"]
            },
            "Refactoring": {
                current:["لا أمارس Refactoring", "أحسن أجزاء بسيطة", "أزيل بعض التكرار", "أخرى"],
                target:["تبسيط الكود", "تحسين الأداء", "إزالة التكرار", "رفع قابلية الصيانة", "أخرى"],
                commitment:["تحسين دالة", "إزالة تكرار", "إعادة تنظيم ملف", "مراجعة الكود", "أخرى"]
            },
            "Design Patterns": {
                current:["لا أعرف Design Patterns", "أعرف بعض الأنماط", "أطبق نمطاً بسيطاً", "أخرى"],
                target:["فهم الأنماط الأساسية", "اختيار النمط المناسب", "تطبيق Design Patterns في مشروع", "أخرى"],
                commitment:["دراسة Pattern", "تطبيق مثال", "مراجعة كود", "مشروع صغير", "أخرى"]
            },
            "System Design": {
                current:["مبتدئ", "أعرف بعض المفاهيم", "صممت نظاماً بسيطاً", "أخرى"],
                target:["فهم Scalability", "تصميم نظام متكامل", "تحسين Architecture", "الاستعداد للمقابلات", "أخرى"],
                commitment:["تحليل نظام", "رسم Architecture", "دراسة Case Study", "مراجعة أسبوعية", "أخرى"]
            },
            "Deployment": {
                current:["لم أنشر مشروعاً", "نشرت مشروعاً بسيطاً", "أنشر المشاريع", "أخرى"],
                target:["نشر تطبيق", "إدارة الخادم", "تحسين الأداء", "نشر مشروع احترافي", "أخرى"],
                commitment:["رفع تحديث", "نشر مشروع", "تحسين الأداء", "حل مشكلة", "أخرى"]
            },
            "Open Source": {
                current:["لم أساهم من قبل", "أفهم GitHub", "أفهم Issues", "قدمت مساهمة بسيطة", "أخرى"],
                target:["المساهمة في Open Source", "فهم Pull Requests", "تحسين مشروع مفتوح المصدر", "بناء سجل مساهمات", "أخرى"],
                commitment:["قراءة Issue", "تحسين توثيق", "إرسال Pull Request", "مراجعة أسبوعية", "أخرى"]
            },
            "Software Projects": {
                current:["فكرة", "بدأت المشروع", "أنجزت جزءاً", "اقتربت من الإنجاز", "أخرى"],
                target:["إكمال المشروع", "تحسين المشروع", "رفع المشروع", "إضافة مميزات", "بناء Portfolio", "نشر المشروع", "أخرى"],
                commitment:["ساعة تطوير", "ميزة جديدة", "إصلاح Bug", "توثيق", "اختبار", "رفع تحديث", "مراجعة أسبوعية", "أخرى"]
            },
        }
    },

    "الأهداف الإسلامية": {
        categories: ["القرآن الكريم","الحديث الشريف","العقيدة","الفقه","السيرة النبوية","الأذكار","طلب العلم الشرعي","الدعوة","العبادات","العربية للقرآن","أخرى"],
        paths: {
            "القرآن الكريم": ["حفظ القرآن","مراجعة القرآن","التجويد","التثبيت","التلاوة","التدبر","ختمة","حفظ سورة محددة","حفظ جزء محدد","أخرى"],
            "أخرى": ["خطة علمية","مراجعة","قراءة","حفظ","أخرى"]
        },
        states: {
            "القرآن الكريم": {current:["لا أحفظ شيئاً","أحفظ جزءاً واحداً","أحفظ 5 أجزاء","أحفظ 10 أجزاء","أحفظ 15 جزءاً","أحفظ 20 جزءاً","أخرى"], target:["جزء واحد","5 أجزاء","10 أجزاء","15 جزءاً","20 جزءاً","القرآن كاملاً","أخرى"], commitment:["ربع صفحة يومياً","نصف صفحة يومياً","صفحة يومياً","صفحتان يومياً","مراجعة يومية","مراجعة أسبوعية","أخرى"]},
            "أخرى": {current:["لم أبدأ بعد","مبتدئ","قيد التقدم","أخرى"], target:["إكمال الهدف","الاستمرار","إتقان المجال","أخرى"], commitment:["30 دقيقة يومياً","مراجعة يومية","مراجعة أسبوعية","أخرى"]}
        }
    },

    "المشاريع": {categories:["مشروع برمجي","مشروع AI","مشروع ويب","تطبيق هاتف","مشروع بحثي","بورتفوليو للمنح","مشروع شخصي","أخرى"], paths:{"أخرى":["الفكرة","التخطيط","التصميم","البناء","الاختبار","النشر","التوثيق","العرض","أخرى"]}, states:{"أخرى":{current:["مجرد فكرة","مرحلة التخطيط","بدأت التنفيذ","أنجزت النصف","قارب على الانتهاء","أخرى"], target:["إكمال المشروع","نشر المشروع","جاهز للبورتفوليو","جاهز للعرض","أخرى"], commitment:["بناء يومي","محطة أسبوعية","اختبار أسبوعي","أخرى"]}}},
    "عام": {categories:["هدف شخصي","هدف دراسي","هدف مهاري","عادة","أخرى"], paths:{"أخرى":["خطة","تدريب","مراجعة","محطة تقدم","أخرى"]}, states:{"أخرى":{current:["لم أبدأ بعد","مبتدئ","قيد التقدم","أخرى"], target:["إكمال الهدف","تحسين المستوى","أخرى"], commitment:["خطوات يومية","مراجعة أسبوعية","محطات تقدم","أخرى"]}}},
    "أخرى": {categories:["أخرى"], paths:{"أخرى":["أخرى"]}, states:{"أخرى":{current:["لم أبدأ بعد","أخرى"], target:["أخرى"], commitment:["أخرى"]}}}
};

const GOAL_TYPE_CANONICAL_V557 = {
    "Education": "التعليم",
    "Language": "اللغات",
    "Exam / Certificate": "الاختبارات الدولية",
    "Programming & Technology": "البرمجة والتكنولوجيا",
    "البرمجة والتقنية": "البرمجة والتكنولوجيا",
    "Artificial Intelligence": "الذكاء الاصطناعي",
    "Scholarship": "المنح الدراسية",
    "University": "الجامعة",
    "Mathematics": "الرياضيات",
    "Project": "المشاريع",
    "Daily Life": "الحياة اليومية",
    "Islamic Goals": "الأهداف الإسلامية",
    "General": "عام",
    "Other": "أخرى"
};

function goalV524CanonicalType(value) {
    return GOAL_TYPE_CANONICAL_V557[value] || value || "التعليم";
}

function goalV524Label(value) {
    if (["أخرى","أخرى","خطة مخصصة","أخرى","تحديد يدوي","خطة مخصصة","أخرى"].includes(value)) return "أخرى";
    return GOAL_AR_V524[value] || value;
}

function fillGoalV524(select, values) {
    if (!select) return;
    const old = select.value || select.dataset.saved || "";
    select.innerHTML = "";
    const list = values || ["أخرى"];
    list.forEach(value => {
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = goalV524Label(value);
        select.appendChild(opt);
    });

    if (old && [...select.options].some(o => o.value === old)) {
        select.value = old;
    } else if (old && list.length) {
        const opt = document.createElement("option");
        opt.value = old;
        opt.textContent = goalV524Label(old);
        select.appendChild(opt);
        select.value = old;
    }
}

function stateSetV524(data, categoryValue, pathValue) {
    const scopedKey = `${categoryValue}::${pathValue}`;
    return (data.states && (data.states[scopedKey] || data.states[pathValue] || data.states[categoryValue] || data.states["أخرى"])) || {current:["أخرى"], target:["أخرى"], commitment:["أخرى"]};
}


function applyGoalSavedValueV525(select) {
    if (!select || !select.dataset.saved) return;
    const saved = select.dataset.saved;
    if ([...select.options].some(o => o.value === saved)) {
        select.value = saved;
    } else if (saved) {
        const opt = document.createElement("option");
        opt.value = saved;
        opt.textContent = goalV524Label(saved);
        select.appendChild(opt);
        select.value = saved;
    }
}

function clearGoalSavedAfterFirstUseV525() {
    ["goalTypeSelect","goalCategorySelect","goalPathSelect","currentStateSelect","targetStateSelect","commitmentSelect"].forEach(id => {
        const el = document.getElementById(id);
        if (el && el.dataset.savedApplied === "1") delete el.dataset.saved;
    });
}

function showGoalOtherBoxesV524() {
    const pairs = [
        ["goalCategorySelect", "customCategoryBox", "اكتب التصنيف"],
        ["goalPathSelect", "customPathBox", "اكتب المسار"],
        ["currentStateSelect", "customCurrentBox", "اكتب الحالة الحالية"],
        ["targetStateSelect", "customTargetBox", "اكتب الحالة المستهدفة"],
        ["commitmentSelect", "customCommitmentBox", "اكتب الالتزام"]
    ];
    pairs.forEach(([selectId, boxId, labelText]) => {
        const select = document.getElementById(selectId);
        const box = document.getElementById(boxId);
        if (!select || !box) return;
        const visible = ["أخرى","أخرى","خطة مخصصة","أخرى","تحديد يدوي","خطة مخصصة","أخرى"].includes(select.value);
        box.style.display = visible ? "block" : "none";
        const label = box.querySelector("label");
        const input = box.querySelector("input");
        if (label) label.textContent = labelText;
        if (input) input.placeholder = "يرجى كتابة ما تريد";
    });
}

function refreshGoalsArabicV524(changedId) {
    const type = document.getElementById("goalTypeSelect");
    const category = document.getElementById("goalCategorySelect");
    const path = document.getElementById("goalPathSelect");
    const current = document.getElementById("currentStateSelect");
    const target = document.getElementById("targetStateSelect");
    const commitment = document.getElementById("commitmentSelect");
    const outcome = document.querySelector("input[name='goal_outcome']");
    const keywords = document.getElementById("goalKeywordsInput");
    const milestones = document.getElementById("milestonesInput");
    if (!type || !category || !path || !current || !target || !commitment) return;

    if (!type.dataset.v524Ready) {
        fillGoalV524(type, Object.keys(GOAL_CONFIG_V524));
        type.dataset.v524Ready = "1";
    }

    const canonicalType = goalV524CanonicalType(type.value);
    const data = GOAL_CONFIG_V524[canonicalType] || GOAL_CONFIG_V524["التعليم"];

    if (changedId === "goalTypeSelect" || !category.options.length) {
        fillGoalV524(category, data.categories || ["أخرى"]);
    }

    const basePaths = (data.paths && (data.paths[category.value] || data.paths["أخرى"])) || ["أخرى"];
    if (changedId === "goalTypeSelect" || changedId === "goalCategorySelect" || !path.options.length) {
        fillGoalV524(path, basePaths);
    }

    const states = stateSetV524(data, category.value, path.value);
    if (["goalTypeSelect","goalCategorySelect","goalPathSelect"].includes(changedId) || !current.options.length) fillGoalV524(current, states.current || ["أخرى"]);
    if (["goalTypeSelect","goalCategorySelect","goalPathSelect"].includes(changedId) || !target.options.length) fillGoalV524(target, states.target || ["أخرى"]);
    if (["goalTypeSelect","goalCategorySelect","goalPathSelect"].includes(changedId) || !commitment.options.length) fillGoalV524(commitment, states.commitment || ["أخرى"]);

    const labelMap = {
        goalCategoryLabel: "تصنيف الهدف",
        goalPathLabel: "مسار الهدف",
        currentStateLabel: "الحالة الحالية",
        targetStateLabel: "الحالة المستهدفة",
        goalOutcomeLabel: "النتيجة المستهدفة",
        commitmentLabel: "الالتزام اليومي أو الأسبوعي",
        milestonesLabel: "محطات التقدم"
    };
    Object.entries(labelMap).forEach(([id, text]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    });

    if (outcome && !outcome.value) {
        if (goalV524CanonicalType(type.value) === "التعليم") outcome.placeholder = "مثال: رفع المعدل أو إتقان المنهج";
        else if (goalV524CanonicalType(type.value) === "المنح الدراسية") outcome.placeholder = "مثال: إرسال طلب منحة قوي ومكتمل";
        else if (goalV524CanonicalType(type.value) === "الجامعة") outcome.placeholder = "مثال: إتقان المقرر أو بناء مشروع متكامل";
        else if (goalV524CanonicalType(type.value) === "الحياة اليومية") outcome.placeholder = "مثال: بناء عادة ثابتة والاستمرار عليها";
        else outcome.placeholder = "ماذا تريد أن يتحقق عند إنجاز هذا الهدف؟";
    }

    if (keywords) keywords.value = [goalV524CanonicalType(type.value), category.value, path.value, current.value, target.value, commitment.value].filter(Boolean).join(", ");
    if (milestones && !milestones.value && typeof generatedMilestonesForGoalV4611 === "function") {
        milestones.value = generatedMilestonesForGoalV4611(goalV524CanonicalType(type.value), category.value, path.value, target.value);
    }

    ["goalTypeSelect","goalCategorySelect","goalPathSelect","currentStateSelect","targetStateSelect","commitmentSelect"].forEach(id => {
        const el = document.getElementById(id);
        if (el && el.dataset.saved) {
            applyGoalSavedValueV525(el);
            el.dataset.savedApplied = "1";
        }
    });
    showGoalOtherBoxesV524();
}

document.addEventListener("DOMContentLoaded", () => {
    if (!document.getElementById("goalTypeSelect")) return;
    ["goalTypeSelect","goalCategorySelect","goalPathSelect","currentStateSelect","targetStateSelect","commitmentSelect"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("change", () => {
            setTimeout(() => refreshGoalsArabicV524(id), 0);
            setTimeout(showGoalOtherBoxesV524, 25);
        });
    });
    setTimeout(() => refreshGoalsArabicV524("goalTypeSelect"), 60);
    setTimeout(showGoalOtherBoxesV524, 120);
    setTimeout(clearGoalSavedAfterFirstUseV525, 300);
});


/* EduPath AI v5.3.0 Deep Native Arabic Tasks */
const TASK_OFFICIAL_KEEP_V530 = new Set([
    "IELTS","TOEFL","Duolingo English Test","Duolingo","HSK","CSCA","SAT","ACT","GRE","GMAT",
    "Python","C","C++","Java","JavaScript","TypeScript","HTML","CSS","SQL","Flask","Django","React","Node.js",
    "Git","GitHub","Git / GitHub","Docker","Linux","TensorFlow","PyTorch","Scikit-learn","Pandas","NumPy",
    "CNN","RNN","NLP","API","APIs","OOP",
    "True False Not Given","Yes No Not Given","Matching Headings","Multiple Choice","Writing Task 1","Writing Task 2",
    "Speaking Part 1","Speaking Part 2","Speaking Part 3","Map Labelling","Form Completion","Note Completion",
    "Flow Chart Completion","Summary Completion","Sentence Completion","Table Completion"
]);

const TASK_AR_V530 = {
    "الحياة اليومية": "الحياة اليومية",
    "عام": "عام",
    "أخرى": "أخرى",
    "English": "الإنجليزية",
    "Turkish": "التركية",
    "Russian": "الروسية",
    "Chinese": "الصينية",
    "Indonesian": "الإندونيسية",
    "Romanian": "الرومانية",
    "Arabic": "العربية",
    "French": "الفرنسية",
    "German": "الألمانية",
    "General English": "إنجليزية عامة",
    "General Chinese": "صينية عامة",
    "General Turkish": "تركية عامة",
    "General Russian": "روسية عامة",
    "General Language": "لغة عامة",
    "Grammar": "القواعد",
    "Vocabulary": "المفردات",
    "Pronunciation": "النطق",
    "Reading": "القراءة",
    "Writing": "الكتابة",
    "Listening": "الاستماع",
    "Speaking": "التحدث",
    "Academic English": "الإنجليزية الأكاديمية",
    "Characters": "الحروف الصينية",
    "Translation": "الترجمة",
    "Daily Conversation": "محادثة يومية",
    "Grammar Review": "مراجعة القواعد",
    "Vocabulary Building": "إثراء المفردات",
    "Pronunciation Practice": "ممارسة النطق",
    "Grammar Practice": "حل تمارين القواعد",
    "Vocabulary Review": "مراجعة المفردات",
    "Dictation": "إملاء",
    "Shadowing": "المحاكاة الصوتية",
    "Practice": "تطبيق عملي",
    "Timed Practice": "تدريب بوقت محدد",
    "Review Mistakes": "مراجعة الأخطاء",
    "Mock Test": "اختبار تجريبي",
    "Reading Practice": "فهم المقروء",
    "Speaking Practice": "ممارسة التحدث",
    "Writing Practice": "تدريب الكتابة",
    "Listening Practice": "فهم المسموع",
    "Fluency Practice": "تحسين الطلاقة",
    "Record Response": "تسجيل الإجابة",
    "Photo Description": "وصف صورة",
    "Sample Writing": "كتابة نموذجية",
    "Accuracy Review": "مراجعة الدقة",
    "Mistake Review": "مراجعة الأخطاء",
    "Gap Filling": "ملء الفراغات",
    "Diagram Matching": "مطابقة الرسوم",
    "Chart Matching": "مطابقة المخططات",
    "Short Answer Questions": "أسئلة إجابة قصيرة",
    "Skimming": "قراءة سريعة",
    "Scanning": "بحث سريع داخل النص",
    "Draft Response": "كتابة مسودة",
    "Timed Writing": "كتابة بوقت محدد",
    "Task Analysis": "تحليل المهمة",
    "Vocabulary Upgrade": "تقوية المفردات",
    "Grammar Accuracy": "تحسين دقة القواعد",
    "Feedback Review": "مراجعة الملاحظات",
    "Rewrite Response": "إعادة كتابة الإجابة",
    "Mock Interview": "مقابلة تجريبية",
    "Everyday Conversation": "محادثة يومية",
    "Everyday Monologue": "حديث يومي فردي",
    "Educational Discussion": "نقاش تعليمي",
    "Academic Lecture": "محاضرة أكاديمية",
    "Academic Reading": "قراءة أكاديمية",
    "General Training Reading": "قراءة عامة",
    "Plan Labelling": "Plan Labelling",
    "Diagram Labelling": "Diagram Labelling",

    "Computer Science": "علوم الحاسوب",
    "Information Technology": "تقنية المعلومات",
    "Computer Engineering": "هندسة الحاسوب",
    "Software Engineering": "هندسة البرمجيات",
    "Data Science": "Data Science",
    "Cybersecurity": "الأمن السيبراني",
    "Engineering": "الهندسة",
    "Medicine": "الطب",
    "Pharmacy": "الصيدلة",
    "Dentistry": "طب الأسنان",
    "Nursing": "التمريض",
    "Business Administration": "إدارة الأعمال",
    "Accounting": "المحاسبة",
    "إدارة المال": "التمويل",
    "Economics": "الاقتصاد",
    "Marketing": "التسويق",
    "Management": "الإدارة",
    "Law": "القانون",
    "Sharia and Law": "الشريعة والقانون",
    "Islamic Studies": "الدراسات الإسلامية",
    "Education": "التربية",
    "English Language": "اللغة الإنجليزية",
    "Arabic Language": "اللغة العربية",
    "Media": "الإعلام",
    "Political Science": "العلوم السياسية",
    "Psychology": "علم النفس",
    "Sociology": "علم الاجتماع",
    "Physics": "الفيزياء",
    "Chemistry": "الكيمياء",
    "Biology": "الأحياء",
    "Architecture": "الهندسة المعمارية",
    "Agriculture": "الزراعة",
    "Programming": "البرمجة",
    "Algorithms": "Algorithms",
    "Data Structures": "Data Structures",
    "Databases": "Database Fundamentals",
    "Database Fundamentals": "Database Fundamentals",
    "SQLite": "SQLite",
    "MySQL": "MySQL",
    "PostgreSQL": "PostgreSQL",
    "MongoDB": "MongoDB",
    "Database Design": "Database Design",
    "ORM": "ORM",
    "Database Optimization": "Database Optimization",
    "Database Security": "Database Security",
    "Database Projects": "Database Projects",
    "Operating Systems": "أنظمة التشغيل",
    "Computer Networks": "شبكات الحاسوب",
    "Web Development": "Web Development",
    "AI": "الذكاء الاصطناعي",
    "Discrete Mathematics": "الرياضيات المتقطعة",
    "Computer Architecture": "معمارية الحاسوب",
    "Graduation Project": "مشروع التخرج",
    "Lecture": "محاضرة",
    "Assignment": "واجب",
    "Research": "بحث",
    "Project": "مشروع",
    "Exam Review": "مراجعة اختبار",
    "Lecture Topic": "موضوع المحاضرة",
    "Lab Task": "تطبيق عملي",
    "Assignment Question": "سؤال واجب",
    "Project Feature": "ميزة في المشروع",
    "Exam Chapter": "فصل اختبار",
    "Lecture Study": "دراسة محاضرة",
    "Lab Practice": "تطبيق عملي",
    "Project Work": "عمل على مشروع",
    "Presentation": "عرض تقديمي",
    "Problem Solving": "Problem Solving",
    "Study Lecture": "دراسة محاضرة",
    "Solve Exercises": "حل تمارين",
    "Prepare Report": "إعداد تقرير",
    "Review Terms": "مراجعة المصطلحات",
    "Practice Problems": "حل مسائل تدريبية",
    "Analyze Case": "تحليل حالة",
    "Memorize Terms": "حفظ مصطلحات",

    "Frontend Development": "تطوير الواجهة الأمامية",
    "Backend Development": "تطوير الخلفية",
    "Full Stack Development": "تطوير متكامل",
    "Frontend": "Frontend",
    "Backend": "Backend",
    "Full Stack": "Full Stack",
    "Responsive Design": "Responsive Design",
    "Forms": "النماذج",
    "Authentication": "Authentication",
    "Deployment": "Deployment",
    "Performance": "الأداء",
    "Security": "الأمان",
    "Concepts": "المفاهيم",
    "Debugging": "Debugging",
    "Review": "Review",
    "Syntax": "الصياغة",
    "Variables": "المتغيرات",
    "Data Types": "أنواع البيانات",
    "Conditions": "الشروط",
    "Loops": "الحلقات",
    "Functions": "الدوال",
    "Lists": "القوائم",
    "Tuples": "الصفوف",
    "Dictionaries": "القواميس",
    "Sets": "المجموعات",
    "Files": "الملفات",
    "Modules": "الوحدات",
    "Libraries": "المكتبات",
    "Virtual Environment": "البيئة الافتراضية",
    "Data Analysis": "Data Analysis",
    "Automation": "الأتمتة",
    "Web Scraping": "استخراج البيانات من الويب",
    "Study Concept": "فهم المفهوم",
    "Write Code": "كتابة كود",
    "Build Mini Project": "بناء مشروع صغير",
    "Debug Code": "تصحيح الكود",
    "Read Documentation": "قراءة التوثيق",
    "Refactor Code": "تحسين الكود",
    "Practice Syntax": "تطبيق الصياغة البرمجية",
    "Build App": "بناء تطبيق",
    "Build Page": "بناء صفحة",
    "Design Layout": "تصميم الواجهة",
    "Fix Bug": "إصلاح خطأ",
    "Connect Backend": "ربط الخلفية",
    "Create Form": "إنشاء نموذج",
    "Make Responsive": "جعله متجاوبًا",
    "Deploy Website": "نشر الموقع",
    "Improve UI": "تحسين الواجهة",
    "Practice Project": "تطبيق بمشروع",

    "Machine Learning": "Machine Learning",
    "Deep Learning": "Deep Learning",
    "Computer Vision": "Computer Vision",
    "Reinforcement Learning": "Reinforcement Learning",
    "AI Projects": "AI Projects",
    "Natural Language Processing": "Natural Language Processing",
    "Generative AI": "Generative AI",
    "MLOps": "MLOps",
    "ML Fundamentals": "ML Fundamentals",
    "Data Collection": "Data Collection",
    "Data Visualization": "Data Visualization",
    "Supervised Learning": "Supervised Learning",
    "Unsupervised Learning": "Unsupervised Learning",
    "Regression": "Regression",
    "Classification": "Classification",
    "Clustering": "Clustering",
    "Model Evaluation": "Model Evaluation",
    "Hyperparameter Tuning": "Hyperparameter Tuning",
    "Cross Validation": "Cross Validation",
    "Ensemble Methods": "Ensemble Methods",
    "Model Deployment": "Model Deployment",
    "ML Projects": "ML Projects",
    "Activation Functions": "Activation Functions",
    "Forward Propagation": "Forward Propagation",
    "Backpropagation": "Backpropagation",
    "Optimization": "Optimization",
    "CNN": "CNN",
    "RNN": "RNN",
    "LSTM": "LSTM",
    "GRU": "GRU",
    "Transformers": "Transformers",
    "Transfer Learning": "Transfer Learning",
    "Fine Tuning": "Fine Tuning",
    "Model Training": "Model Training",
    "DL Projects": "DL Projects",
    "Pandas": "Pandas",
    "NumPy": "NumPy",
    "Statistics": "Statistics",
    "Exploratory Data Analysis": "Exploratory Data Analysis",
    "Business Analytics": "Business Analytics",
    "Dashboard Building": "Dashboard Building",
    "Data Projects": "Data Projects",
    "Image Processing": "Image Processing",
    "OpenCV": "OpenCV",
    "Image Classification": "Image Classification",
    "Object Detection": "Object Detection",
    "Image Segmentation": "Image Segmentation",
    "Face Recognition": "Face Recognition",
    "OCR": "OCR",
    "CV Projects": "CV Projects",
    "Text Processing": "Text Processing",
    "Tokenization": "Tokenization",
    "Word Embeddings": "Word Embeddings",
    "Sequence Models": "Sequence Models",
    "BERT": "BERT",
    "GPT": "GPT",
    "Text Classification": "Text Classification",
    "Sentiment Analysis": "Sentiment Analysis",
    "Machine Translation": "Machine Translation",
    "Question Answering": "Question Answering",
    "Chatbots": "Chatbots",
    "NLP Projects": "NLP Projects",
    "RL Fundamentals": "RL Fundamentals",
    "Markov Decision Process": "Markov Decision Process",
    "Q Learning": "Q Learning",
    "Deep Q Network": "Deep Q Network",
    "Policy Gradient": "Policy Gradient",
    "Actor Critic": "Actor Critic",
    "Multi Agent RL": "Multi Agent RL",
    "RL Projects": "RL Projects",
    "LLM Fundamentals": "LLM Fundamentals",
    "Prompt Engineering": "Prompt Engineering",
    "Embeddings": "Embeddings",
    "Vector Databases": "Vector Databases",
    "RAG": "RAG",
    "AI Agents": "AI Agents",
    "Function Calling": "Function Calling",
    "Generative AI Projects": "Generative AI Projects",
    "Model Monitoring": "Model Monitoring",
    "CI/CD": "CI/CD",
    "Model Versioning": "Model Versioning",
    "Pipeline Building": "Pipeline Building",
    "Cloud Deployment": "Cloud Deployment",
    "MLOps Projects": "MLOps Projects",
    "Classification Project": "Classification Project",
    "Regression Project": "Regression Project",
    "NLP Project": "NLP Project",
    "Computer Vision Project": "Computer Vision Project",
    "Generative AI Project": "Generative AI Project",
    "Healthcare AI": "Healthcare AI",
    "Education AI": "Education AI",
    "Portfolio Project": "Portfolio Project",
    "Capstone Project": "Capstone Project",
    "Data Cleaning": "Data Cleaning",
    "Feature Engineering": "Feature Engineering",
    "Models": "Models",
    "Training": "Training",
    "Evaluation": "Evaluation",
    "Neural Networks": "Neural Networks",
    "Study": "تعلم",
    "Experiment": "تجربة",
    "Evaluate Model": "تقييم النموذج",
    "Build Project": "بناء مشروع",
    "Read Paper": "قراءة بحث",
    "Dataset": "Dataset",
    "Model Comparison": "مقارنة النماذج",
    "Accuracy": "Accuracy",
    "Feature Selection": "Feature Selection",
    "Code Implementation": "تطبيق برمجي",

    "Algebra": "الجبر",
    "Geometry": "الهندسة",
    "Trigonometry": "المثلثات",
    "Calculus": "التفاضل والتكامل",
    "Probability": "الاحتمالات",
    "Statistics": "الإحصاء",
    "Linear Algebra": "الجبر الخطي",
    "Equations": "المعادلات",
    "Functions": "الدوال",
    "Past Exams": "اختبارات سابقة",
    "Inequalities": "المتباينات",
    "Word Problems": "مسائل لفظية",
    "Polynomials": "كثيرات الحدود",
    "Limits": "النهايات",
    "Derivatives": "المشتقات",
    "Integrals": "التكامل",
    "Applications": "تطبيقات",
    "Examples": "أمثلة",
    "Exercises": "تمارين",
    "Exercise Set": "مجموعة تمارين",
    "Formula": "قانون",
    "Past Question": "سؤال سابق",
    "Difficult Topic": "موضوع صعب",
    "Study Lesson": "دراسة الدرس",
    "Prepare for Exam": "التحضير للاختبار",
    "Memorize Formulas": "حفظ القوانين",

    "Scholarship Search": "البحث عن منحة",
    "University Research": "بحث الجامعات",
    "Application Form": "نموذج التقديم",
    "Documents": "المستندات",
    "CV": "السيرة الذاتية",
    "Motivation Letter": "خطاب الدافع",
    "Personal Statement": "البيان الشخصي",
    "Recommendation Letter": "خطاب التوصية",
    "Interview": "المقابلة",
    "Language Test": "اختبار اللغة",
    "Portfolio": "البورتفوليو",
    "Email Communication": "التواصل بالبريد",
    "Visa": "التأشيرة",
    "Travel Preparation": "الاستعداد للسفر",
    "Follow-up": "المتابعة",
    "Bachelor Scholarship": "منحة بكالوريوس",
    "Draft": "مسودة",
    "Edit": "تعديل",
    "Personalize": "تخصيص",
    "Final Review": "مراجعة نهائية",
    "Self Introduction": "التعريف بالنفس",
    "Why Major": "لماذا التخصص",
    "Why Scholarship": "لماذا المنحة",
    "Future Plans": "الخطط المستقبلية",
    "Preparation": "تجهيز",
    "Upload": "رفع",
    "Search": "بحث",
    "Prepare": "تجهيز",
    "Write": "كتابة",
    "Submit": "تقديم",
    "Follow Up": "متابعة",
    "Practice Interview": "تدريب مقابلة",
    "Final Check": "فحص نهائي",
    "Opening Paragraph": "الفقرة الافتتاحية",
    "Achievements": "الإنجازات",
    "Future Goals": "الأهداف المستقبلية",
    "University Fit": "التوافق مع الجامعة",
    "Question Practice": "التدرب على الأسئلة",
    "Answer Improvement": "تحسين الإجابات",
    "Feedback": "ملاحظات",

    "الصحة": "الصحة",
    "الرياضة": "الرياضة",
    "النوم": "النوم",
    "التغذية": "التغذية",
    "شرب الماء": "شرب الماء",
    "الروتين الشخصي": "الروتين الشخصي",
    "العائلة": "العائلة",
    "إدارة المال": "إدارة المال",
    "تنظيف المنزل": "تنظيف المنزل",
    "التسوق": "التسوق",
    "إدارة الوقت": "إدارة الوقت",
    "الصلاة": "الصلاة",
    "Appointments": "المواعيد",
    "عادة يومية": "عادة يومية",
    "روتين أسبوعي": "روتين أسبوعي",
    "Reminder": "تذكير",
    "Personal Task": "مهمة شخصية",
    "Important Appointment": "موعد مهم",
    "العناية الشخصية": "العناية الشخصية",
    "تنفيذ مهمة": "تنفيذ مهمة",
    "مراجعة التقدم": "مراجعة التقدم",
    "تثبيت العادة": "تثبيت العادة",
    "Check": "فحص",
    "Improve Routine": "تحسين الروتين",

    "Programming Project": "مشروع برمجي",
    "AI Project": "مشروع ذكاء اصطناعي",
    "Web Project": "مشروع ويب",
    "Mobile App": "تطبيق هاتف",
    "Research Project": "مشروع بحثي",
    "School Project": "مشروع مدرسي",
    "University Project": "مشروع جامعي",
    "Scholarship Portfolio": "بورتفوليو للمنح",
    "Personal Project": "مشروع شخصي",
    "Idea": "الفكرة",
    "Planning": "التخطيط",
    "Design": "التصميم",
    "Build": "البناء",
    "Test": "الاختبار",
    "Improve": "التحسين",
    "Deploy": "النشر",
    "Write Documentation": "كتابة التوثيق",
    "Brainstorm": "عصف ذهني",

    "الكتب": "الكتب",
    "المقالات": "المقالات",
    "الأبحاث": "الأبحاث",
    "التلخيص": "التلخيص",
    "الملاحظات": "تدوين ملاحظات",
    "Literature Review": "المراجعات",
    "التفكير النقدي": "التفكير النقدي",
    "قراءة": "قراءة",
    "تلخيص": "تلخيص",
    "تحليل": "تحليل",
    "تدوين ملاحظات": "تدوين ملاحظات",
    "مناقشة": "مناقشة",
    "Learning": "التعلم الذاتي",
    "تطبيق عملي": "تطبيق عملي",
    "موضوع عام": "موضوع عام",
    "Topic": "موضوع",

    "once": "بدون تكرار / مرة واحدة",
    "daily": "يوميًا",
    "weekly": "أسبوعيًا",
    "monthly": "شهريًا",
    "selected_days": "أيام محددة"
};

function taskLabelArV530(value) {
    if (!value) return "";
    if (TASK_OFFICIAL_KEEP_V530.has(value)) return value;
    return TASK_AR_V530[value] || value;
}

function applyDeepNativeTaskConfigV530() {
    if (typeof SMART_TASK_DATA === "undefined") return;

    if (SMART_TASK_DATA["Languages"]) {
        SMART_TASK_DATA["Languages"].training = [
            "ممارسة التحدث","فهم المقروء","فهم المسموع","تدريب الكتابة","دراسة القواعد",
            "حل تمارين القواعد","إثراء المفردات","تحسين النطق","ممارسة النطق",
            "تصحيح النطق","المحاكاة الصوتية","إملاء","اختبار تجريبي","مراجعة الأخطاء","أخرى"
        ];
    }

    if (SMART_TASK_DATA["Daily Life"]) {
        SMART_TASK_DATA["Daily Life"].main = [
            "الصحة","الرياضة","النوم","شرب الماء","التغذية","الروتين الشخصي",
            "العائلة","إدارة الوقت","إدارة المال","الصلاة","التسوق","ترتيب المنزل",
            "تنظيف المنزل","القراءة","الاسترخاء","أخرى"
        ];
        SMART_TASK_DATA["Daily Life"].sub = {
            "الصحة": ["التغذية","شرب الماء","الفحوصات الطبية","الوقاية الصحية","العادات الصحية","العناية الصحية","أخرى"],
            "الرياضة": ["المشي","تمارين منزلية","تمارين مقاومة","تمارين مرونة","رياضة خفيفة","أخرى"],
            "النوم": ["تنظيم وقت النوم","تقليل السهر","روتين قبل النوم","الاستيقاظ المبكر","أخرى"],
            "شرب الماء": ["كمية الماء اليومية","تذكير شرب الماء","تقليل المشروبات الغازية","متابعة العادة","أخرى"],
            "التغذية": ["وجبة صحية","تقليل السكر","تنظيم الوجبات","تحضير طعام","متابعة الوزن","أخرى"],
            "الروتين الشخصي": ["ترتيب اليوم","العناية الشخصية","النظافة الشخصية","العناية بالبشرة","العناية بالشعر","الراحة النفسية","أخرى"],
            "العائلة": ["زيارة عائلية","مساعدة الأسرة","مكالمة عائلية","مسؤولية منزلية","أخرى"],
            "إدارة الوقت": ["تخطيط اليوم","ترتيب الأولويات","تقليل التشتت","مراجعة الإنجاز","أخرى"],
            "إدارة المال": ["تتبع المصروفات","ميزانية أسبوعية","ادخار","مراجعة النفقات","أخرى"],
            "الصلاة": ["صلاة الفجر","الصلوات الخمس","النوافل","الأذكار بعد الصلاة","المحافظة على الوقت","أخرى"],
            "التسوق": ["قائمة مشتريات","شراء احتياجات","مقارنة الأسعار","متابعة الميزانية","أخرى"],
            "ترتيب المنزل": ["ترتيب الغرفة","ترتيب المكتب","ترتيب الملفات","تنظيم الملابس","أخرى"],
            "تنظيف المنزل": ["تنظيف الغرفة","تنظيف المكتب","تنظيف المطبخ","تنظيف أسبوعي","أخرى"],
            "القراءة": ["قراءة يومية","قراءة كتاب","قراءة مقال","تدوين فائدة","أخرى"],
            "الاسترخاء": ["راحة قصيرة","تنفس عميق","مشي هادئ","وقت بلا هاتف","أخرى"],
            "أخرى": ["عادة يومية","روتين أسبوعي","تذكير مهم","مهمة شخصية","أخرى"]
        };
        SMART_TASK_DATA["Daily Life"].detail = {
            "التغذية": ["اختيار وجبة صحية","تقليل السكر","زيادة البروتين","تنظيم الوجبات","أخرى"],
            "شرب الماء": ["كوب صباحي","زجاجة يومية","تذكير كل فترة","متابعة الكمية","أخرى"],
            "الفحوصات الطبية": ["حجز موعد","متابعة نتيجة","تجهيز ملف طبي","أخرى"],
            "الوقاية الصحية": ["نظافة شخصية","مشي خفيف","نوم كافٍ","تقليل التوتر","أخرى"],
            "العناية الشخصية": ["نظافة شخصية","ترتيب المظهر","عناية يومية","أخرى"],
            "النظافة الشخصية": ["غسل الأسنان","الاستحمام","تغيير الملابس","تنظيم الأدوات","أخرى"],
            "العناية بالبشرة": ["غسل الوجه","ترطيب","حماية من الشمس","متابعة روتين","أخرى"],
            "العناية بالشعر": ["غسل الشعر","ترتيب الشعر","روتين عناية","أخرى"],
            "الراحة النفسية": ["وقت هادئ","كتابة مشاعر","تنفس عميق","تقليل التوتر","أخرى"],
            "أخرى": ["موضوع عام","أخرى"]
        };
        SMART_TASK_DATA["Daily Life"].training = [
            "تنفيذ المهمة","متابعة العادة","مراجعة التقدم","تثبيت العادة","تحسين الروتين",
            "تجهيز مسبق","فحص سريع","تذكير يومي","مراجعة أسبوعية","أخرى"
        ];
    }

    if (SMART_TASK_DATA["Reading & Research"]) {
        SMART_TASK_DATA["Reading & Research"].main = [
            "القراءة","البحث العلمي","الكتب","المقالات","الأبحاث","المراجعات",
            "التلخيص","التفكير النقدي","التعلم الذاتي","أخرى"
        ];
        SMART_TASK_DATA["Reading & Research"].sub = {
            "الكتب": ["علوم الحاسوب","الذكاء الاصطناعي","الرياضيات","الفيزياء","الكيمياء","الأحياء","الاقتصاد","إدارة الأعمال","التاريخ","الفلسفة","علم النفس","اللغة العربية","اللغة الإنجليزية","التنمية الذاتية","السير الذاتية","الروايات","الأدب","الدين","التفسير","الحديث","الفقه","العقيدة","أخرى"],
            "القراءة": ["قراءة موجهة","قراءة تحليلية","قراءة مكثفة","قراءة سريعة","فهم المقروء","تدوين فوائد","أخرى"],
            "البحث العلمي": ["اختيار موضوع","جمع مراجع","قراءة أوراق علمية","تحليل النتائج","توثيق المراجع","كتابة البحث","مراجعة البحث","أخرى"],
            "المقالات": ["مقال تعليمي","مقال علمي","مقال رأي","تحليل مقال","تلخيص مقال","أخرى"],
            "الأبحاث": ["الملخص","المقدمة","المنهجية","النتائج","المناقشة","المراجع","أخرى"],
            "المراجعات": ["مراجعة كتاب","مراجعة مقال","مراجعة بحث","مقارنة مصادر","أخرى"],
            "التلخيص": ["تلخيص فصل","تلخيص مقال","تلخيص بحث","استخراج أفكار","أخرى"],
            "التفكير النقدي": ["تحليل حجة","تمييز الفكرة الرئيسية","تقييم دليل","مقارنة آراء","أخرى"],
            "التعلم الذاتي": ["خطة تعلم","مصدر تعليمي","تطبيق عملي","مراجعة أسبوعية","أخرى"],
            "أخرى": ["قراءة","تلخيص","تحليل","تدوين ملاحظات","أخرى"]
        };
        SMART_TASK_DATA["Reading & Research"].detail = {
            "علوم الحاسوب": ["الخوارزميات","هياكل البيانات","قواعد البيانات","تطوير الويب","الأمن السيبراني","أخرى"],
            "الذكاء الاصطناعي": ["تعلم الآلة","التعلم العميق","معالجة اللغة الطبيعية","الرؤية الحاسوبية","أخرى"],
            "الرياضيات": ["الجبر","التفاضل والتكامل","الإحصاء","الاحتمالات","أخرى"],
            "الدين": ["التفسير","الحديث","الفقه","العقيدة","السيرة","أخرى"],
            "البحث العلمي": ["سؤال البحث","مراجعة الأدبيات","منهجية البحث","تحليل النتائج","توثيق المراجع","أخرى"],
            "أخرى": ["موضوع عام","أخرى"]
        };
        SMART_TASK_DATA["Reading & Research"].training = [
            "قراءة","تلخيص","استخراج أفكار","تحليل","مراجعة","مناقشة",
            "تدوين ملاحظات","بناء خريطة ذهنية","مقارنة","تطبيق عملي",
            "جمع مراجع","قراءة أوراق علمية","تحليل النتائج","توثيق المراجع","كتابة البحث","أخرى"
        ];
    }
}

applyDeepNativeTaskConfigV530();

labelForUI = function(value) {
    return taskLabelArV530(value);
};

function forceTaskArabicLabelsV530() {
    if (!document.getElementById("taskTypeCards")) return;

    const fixedLabels = {
        taskNameLabel: "اسم المهمة",
        topicLabel: "الفئة الرئيسية",
        skillLabel: "الفئة الفرعية",
        detailLabel: "الموضوع التفصيلي",
        trainingLabel: "نوع النشاط",
        sourceLabel: "المصدر أو الرابط",
        difficultyLabel: "مستوى الصعوبة من ١ إلى ٥",
        priorityLabel: "الأولوية من ١ إلى ٥",
        expectedTimeLabel: "الوقت المتوقع (بالدقائق)",
        startDateLabel: "تاريخ البدء",
        endDateLabel: "تاريخ الانتهاء أو الموعد النهائي",
        reminderLabel: "وقت التذكير",
        repeatLabel: "التكرار",
        repeatDaysLabel: "أيام التكرار",
        notesLabel: "ملاحظات إضافية"
    };
    Object.entries(fixedLabels).forEach(([id, text]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    });

    const customLabels = [
        ["customCategoryBox", "اكتب نوع المهمة"],
        ["customTopicBox", "اكتب الفئة التي تريدها"],
        ["customSkillBox", "اكتب الفئة الفرعية"],
        ["customDetailedTopicBox", "اكتب الموضوع الذي تريده"],
        ["customTrainingTypeBox", "اكتب نوع النشاط"]
    ];
    customLabels.forEach(([boxId, text]) => {
        const box = document.getElementById(boxId);
        if (!box) return;
        const label = box.querySelector("label");
        const input = box.querySelector("input");
        if (label) label.textContent = text;
        if (input) input.placeholder = "يرجى كتابة ما تريد";
    });

    const placeholders = {
        taskTitleInput: "مثال: مراجعة حفظ سورة النساء",
        sourceInput: "كتاب، موقع إلكتروني، فيديو تعليمي، ملف، أو أي مصدر آخر",
        notesInput: "اكتب أي ملاحظات أو خطة أو تعليمات شخصية"
    };
    Object.entries(placeholders).forEach(([id, text]) => {
        const el = document.getElementById(id);
        if (el) el.placeholder = text;
    });

    document.querySelectorAll("#topicSelect option, #skillSelect option, #detailedTopicSelect option, #trainingTypeSelect option, #repeatTypeSelect option, #cscaDetailedTopicSelect option, #cscaTrainingTypeSelect option").forEach(option => {
        option.textContent = taskLabelArV530(option.value || option.textContent);
    });

    document.querySelectorAll(".task-type-card strong").forEach(el => {
        const value = el.closest(".task-type-card")?.dataset?.type || el.textContent;
        el.textContent = taskLabelArV530(value);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(forceTaskArabicLabelsV530, 80);
    ["categorySelect", "topicSelect", "skillSelect", "detailedTopicSelect", "trainingTypeSelect", "repeatTypeSelect"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("change", () => setTimeout(forceTaskArabicLabelsV530, 30));
    });
    document.addEventListener("click", (event) => {
        if (event.target.closest(".task-type-card")) {
            setTimeout(forceTaskArabicLabelsV530, 60);
        }
    });
});


/* EduPath AI v5.3.1 Deep Language Tasks */
function applyDeepLanguageTaskConfigV531() {
    if (typeof SMART_TASK_DATA === "undefined" || !SMART_TASK_DATA["Languages"]) return;

    SMART_TASK_DATA["Languages"].main = [
        "English", "Chinese", "Turkish", "Russian", "Indonesian", "Romanian", "Arabic", "French", "German", "أخرى"
    ];

    const languageSubfieldsV531 = [
        "القراءة",
        "الاستماع",
        "التحدث",
        "الكتابة",
        "الاختبارات",
        "القواعد",
        "المفردات",
        "النطق",
        "اللغة الأكاديمية",
        "أخرى"
    ];

    SMART_TASK_DATA["Languages"].sub = {
        "English": languageSubfieldsV531,
        "Chinese": languageSubfieldsV531,
        "Turkish": languageSubfieldsV531,
        "Russian": languageSubfieldsV531,
        "Indonesian": languageSubfieldsV531,
        "Romanian": languageSubfieldsV531,
        "Arabic": languageSubfieldsV531,
        "French": languageSubfieldsV531,
        "German": languageSubfieldsV531,
        "أخرى": languageSubfieldsV531
    };

    SMART_TASK_DATA["Languages"].detail = {
        "القراءة": [
            "فهم الفكرة العامة",
            "استخراج التفاصيل",
            "فهم الاستنتاجات",
            "فهم المفردات من السياق",
            "القراءة السريعة",
            "القراءة التحليلية",
            "القراءة الأكاديمية",
            "قراءة المقالات",
            "قراءة الأخبار",
            "قراءة القصص",
            "أخرى"
        ],
        "الاستماع": [
            "فهم الفكرة الرئيسية",
            "فهم التفاصيل",
            "فهم اللهجات",
            "الاستماع الأكاديمي",
            "الاستماع اليومي",
            "المحاضرات",
            "الأخبار",
            "المحادثات",
            "البودكاست",
            "أخرى"
        ],
        "التحدث": [
            "المحادثات اليومية",
            "العروض التقديمية",
            "المناقشات",
            "وصف الصور",
            "التحدث الأكاديمي",
            "مقابلات القبول",
            "مقابلات العمل",
            "أخرى"
        ],
        "الكتابة": [
            "الكتابة العامة",
            "الكتابة الأكاديمية",
            "كتابة المقالات",
            "كتابة الرسائل",
            "كتابة التقارير",
            "كتابة الملاحظات",
            "كتابة الحجج",
            "أخرى"
        ],
        "الاختبارات": [
            "IELTS",
            "TOEFL",
            "Duolingo",
            "HSK",
            "CSCA",
            "SAT",
            "ACT",
            "GRE",
            "GMAT",
            "اختبار تجريبي",
            "إدارة الوقت",
            "مراجعة الأخطاء",
            "أخرى"
        ],
        "القواعد": [
            "الأزمنة",
            "بناء الجملة",
            "أدوات الربط",
            "الجمل الشرطية",
            "المبني للمجهول",
            "حروف الجر",
            "الأخطاء الشائعة",
            "تطبيق القواعد في الكتابة",
            "أخرى"
        ],
        "المفردات": [
            "مفردات يومية",
            "مفردات أكاديمية",
            "مفردات الاختبارات",
            "مرادفات ومتضادات",
            "تعبيرات شائعة",
            "مفردات حسب الموضوع",
            "مراجعة المفردات",
            "أخرى"
        ],
        "النطق": [
            "تصحيح مخارج الحروف",
            "النبر والتنغيم",
            "الطلاقة",
            "المحاكاة الصوتية",
            "تسجيل الصوت",
            "تقليد المتحدث",
            "أخرى"
        ],
        "اللغة الأكاديمية": [
            "المقالات الأكاديمية",
            "الأبحاث",
            "العروض التقديمية",
            "المناقشات الأكاديمية",
            "المفردات الأكاديمية",
            "الاستماع الأكاديمي",
            "الكتابة الأكاديمية",
            "أخرى"
        ],
        "IELTS": [
            "Listening",
            "Reading",
            "Writing Task 1",
            "Writing Task 2",
            "Speaking Part 1",
            "Speaking Part 2",
            "Speaking Part 3",
            "True False Not Given",
            "Matching Headings",
            "Multiple Choice",
            "Sentence Completion",
            "Summary Completion",
            "Map Labelling",
            "Form Completion",
            "Note Completion",
            "Flow Chart Completion",
            "أخرى"
        ],
        "TOEFL": [
            "Reading",
            "Listening",
            "Speaking",
            "Writing",
            "Complete the Words",
            "Read in Daily Life",
            "Read an Academic Passage",
            "Build a Sentence",
            "Write an Email",
            "Write for an Academic Discussion",
            "Listen and Repeat",
            "Take an Interview",
            "Listen and Choose a Response",
            "Listen to a Conversation",
            "Listen to an Announcement",
            "Listen to an Academic Talk",
            "أخرى"
        ],
        "Duolingo": [
            "Read and Select",
            "Fill in the Blanks",
            "Read and Complete",
            "Interactive Reading",
            "Listen and Type",
            "Interactive Listening",
            "Write About the Photo",
            "Writing Sample",
            "Interactive Writing",
            "Speak About the Photo",
            "Read Then Speak",
            "Speaking Sample",
            "Interactive Speaking",
            "أخرى"
        ],
        "HSK": ["HSK 1", "HSK 2", "HSK 3", "HSK 4", "HSK 5", "HSK 6", "Characters", "Vocabulary", "Listening", "Reading", "Writing", "أخرى"],
        "أخرى": ["موضوع مخصص", "أخرى"]
    };

    SMART_TASK_DATA["Languages"].trainingByDetail = {
        "فهم الفكرة العامة": ["قراءة نص", "تحديد الفكرة الرئيسية", "تلخيص النص", "مراجعة الإجابة", "أخرى"],
        "استخراج التفاصيل": ["قراءة نص", "حل أسئلة فهم", "تمييز المعلومات المهمة", "تسجيل الملاحظات", "أخرى"],
        "فهم الاستنتاجات": ["تحليل النص", "استنتاج المعنى", "مقارنة الإجابات", "مراجعة الأخطاء", "أخرى"],
        "فهم المفردات من السياق": ["استخراج المفردات", "تخمين المعنى من السياق", "كتابة جمل جديدة", "مراجعة المفردات", "أخرى"],
        "القراءة السريعة": ["قراءة بوقت محدد", "تحديد الكلمات المفتاحية", "تدريب Skimming", "تدريب Scanning", "أخرى"],
        "القراءة التحليلية": ["تحليل النص", "استخراج الأفكار الرئيسية", "تسجيل الملاحظات", "مناقشة النص", "أخرى"],
        "القراءة الأكاديمية": ["قراءة نص أكاديمي", "تلخيص الفقرات", "تحليل المصطلحات", "حل أسئلة أكاديمية", "أخرى"],
        "قراءة المقالات": ["قراءة مقال", "تلخيص المقال", "استخراج الأفكار", "مراجعة المفردات", "أخرى"],
        "قراءة الأخبار": ["قراءة خبر", "تلخيص الخبر", "استخراج مفردات", "مناقشة الخبر", "أخرى"],
        "قراءة القصص": ["قراءة قصة", "تلخيص الأحداث", "وصف الشخصيات", "استخراج مفردات", "أخرى"],

        "فهم الفكرة الرئيسية": ["الاستماع للمقطع", "تحديد الفكرة الرئيسية", "تلخيص المحتوى", "إعادة الاستماع", "أخرى"],
        "فهم التفاصيل": ["الاستماع للمقطع", "تدوين الملاحظات", "الإجابة عن الأسئلة", "تحليل الأخطاء", "أخرى"],
        "فهم اللهجات": ["الاستماع لمتحدثين مختلفين", "تقليد النطق", "مقارنة اللهجات", "إعادة الاستماع", "أخرى"],
        "الاستماع الأكاديمي": ["الاستماع لمحاضرة", "تدوين الملاحظات", "تلخيص المحاضرة", "مراجعة المصطلحات", "أخرى"],
        "الاستماع اليومي": ["الاستماع لحوار يومي", "استخراج عبارات", "إعادة الاستماع", "تطبيق العبارات", "أخرى"],
        "المحاضرات": ["الاستماع لمحاضرة", "تدوين الملاحظات", "تلخيص النقاط", "مراجعة المصطلحات", "أخرى"],
        "الأخبار": ["الاستماع لخبر", "تلخيص الخبر", "استخراج مفردات", "مناقشة المحتوى", "أخرى"],
        "المحادثات": ["الاستماع لمحادثة", "الإجابة عن الأسئلة", "تقليد العبارات", "إعادة الاستماع", "أخرى"],
        "البودكاست": ["الاستماع لحلقة", "تدوين الفوائد", "تلخيص المحتوى", "مراجعة المفردات", "أخرى"],

        "المحادثات اليومية": ["التحدث الحر", "محاكاة حوار", "تسجيل صوتي", "مراجعة النطق", "أخرى"],
        "العروض التقديمية": ["تحضير عرض شفهي", "تسجيل العرض", "مراجعة الأداء", "تحسين الأسلوب", "أخرى"],
        "المناقشات": ["مناقشة موضوع", "عرض رأي", "الرد على أسئلة", "تقييم الطلاقة", "أخرى"],
        "وصف الصور": ["وصف صورة", "تسجيل الإجابة", "تصحيح الأخطاء", "إعادة المحاولة", "أخرى"],
        "التحدث الأكاديمي": ["شرح فكرة أكاديمية", "الإجابة عن أسئلة", "استخدام مفردات أكاديمية", "تسجيل صوتي", "أخرى"],
        "مقابلات القبول": ["محاكاة مقابلة", "الإجابة عن أسئلة", "مراجعة الإجابات", "تحسين الثقة", "أخرى"],
        "مقابلات العمل": ["محاكاة مقابلة", "التعريف بالنفس", "الإجابة عن أسئلة", "تحسين الطلاقة", "أخرى"],

        "الكتابة العامة": ["كتابة مسودة", "تصحيح الكتابة", "إعادة الصياغة", "مراجعة الكتابة", "أخرى"],
        "الكتابة الأكاديمية": ["كتابة فقرة أكاديمية", "تحسين الترابط", "مراجعة الحجة", "تصحيح الأخطاء", "أخرى"],
        "كتابة المقالات": ["كتابة مقال", "بناء مقدمة", "كتابة فقرات", "مراجعة الخاتمة", "أخرى"],
        "كتابة الرسائل": ["كتابة رسالة", "تحسين الأسلوب", "مراجعة الصياغة", "تصحيح الأخطاء", "أخرى"],
        "كتابة التقارير": ["كتابة تقرير", "تنظيم العناوين", "تلخيص النتائج", "مراجعة التقرير", "أخرى"],
        "كتابة الملاحظات": ["كتابة ملاحظات", "تنظيم النقاط", "اختصار الأفكار", "مراجعة الملاحظات", "أخرى"],
        "كتابة الحجج": ["كتابة حجة", "دعم الرأي بأمثلة", "مراجعة المنطق", "تحسين الترابط", "أخرى"],

        "الأزمنة": ["دراسة القاعدة", "حل تمارين القواعد", "كتابة أمثلة", "مراجعة الأخطاء", "أخرى"],
        "بناء الجملة": ["تحليل الجمل", "إعادة ترتيب الجمل", "كتابة جمل", "مراجعة الأخطاء", "أخرى"],
        "أدوات الربط": ["دراسة أدوات الربط", "تطبيق في جمل", "تطبيق في كتابة", "مراجعة الأخطاء", "أخرى"],
        "الجمل الشرطية": ["دراسة القاعدة", "حل تمارين", "كتابة أمثلة", "مراجعة الأخطاء", "أخرى"],
        "المبني للمجهول": ["دراسة القاعدة", "تحويل الجمل", "كتابة أمثلة", "مراجعة الأخطاء", "أخرى"],
        "حروف الجر": ["دراسة الاستخدام", "حل تمارين", "كتابة أمثلة", "مراجعة الأخطاء", "أخرى"],
        "الأخطاء الشائعة": ["تحليل الأخطاء", "تصحيح الجمل", "كتابة أمثلة صحيحة", "مراجعة متكررة", "أخرى"],
        "تطبيق القواعد في الكتابة": ["كتابة فقرة", "تحديد الأخطاء", "تصحيح الكتابة", "إعادة الصياغة", "أخرى"],

        "مفردات يومية": ["حفظ مفردات", "كتابة جمل", "مراجعة المفردات", "استخدام المفردات في حديث", "أخرى"],
        "مفردات أكاديمية": ["حفظ مفردات أكاديمية", "قراءة أمثلة", "كتابة جمل أكاديمية", "مراجعة دورية", "أخرى"],
        "مفردات الاختبارات": ["حفظ كلمات اختبار", "حل تمارين مفردات", "مراجعة الأخطاء", "اختبار قصير", "أخرى"],
        "مرادفات ومتضادات": ["جمع مرادفات", "كتابة أمثلة", "تدريب مطابقة", "مراجعة", "أخرى"],
        "تعبيرات شائعة": ["حفظ تعبيرات", "تطبيق في محادثة", "كتابة أمثلة", "مراجعة", "أخرى"],
        "مفردات حسب الموضوع": ["جمع مفردات", "تصنيف الكلمات", "كتابة جمل", "اختبار ذاتي", "أخرى"],
        "مراجعة المفردات": ["مراجعة بطاقات", "اختبار قصير", "تطبيق في جمل", "تكرار متباعد", "أخرى"],

        "تصحيح مخارج الحروف": ["تسجيل صوتي", "مقارنة النطق", "تكرار الكلمات", "تصحيح الأخطاء", "أخرى"],
        "النبر والتنغيم": ["الاستماع للنموذج", "تقليد المتحدث", "تسجيل صوتي", "مراجعة الأداء", "أخرى"],
        "الطلاقة": ["تحدث حر", "تسجيل دقيقة واحدة", "تقليل التوقف", "مراجعة الطلاقة", "أخرى"],
        "المحاكاة الصوتية": ["الاستماع للنموذج", "تقليد المتحدث", "التحدث مع التسجيل", "إعادة المحاولة", "أخرى"],
        "تسجيل الصوت": ["تسجيل إجابة", "الاستماع للتسجيل", "تحديد الأخطاء", "إعادة التسجيل", "أخرى"],
        "تقليد المتحدث": ["الاستماع", "تكرار الجمل", "مجاراة النطق الأصلي", "مراجعة التسجيل", "أخرى"],

        "المقالات الأكاديمية": ["قراءة مقال أكاديمي", "تلخيص المقال", "استخراج المصطلحات", "تحليل الحجة", "أخرى"],
        "الأبحاث": ["قراءة بحث", "تلخيص المنهجية", "تحليل النتائج", "توثيق المراجع", "أخرى"],
        "العروض التقديمية": ["تحضير عرض أكاديمي", "تدريب الإلقاء", "تسجيل العرض", "مراجعة الأداء", "أخرى"],
        "المناقشات الأكاديمية": ["تحضير نقاط نقاش", "عرض رأي أكاديمي", "الرد على الأسئلة", "مراجعة اللغة", "أخرى"],
        "المفردات الأكاديمية": ["جمع مفردات أكاديمية", "كتابة أمثلة", "مراجعة المفردات", "استخدامها في كتابة", "أخرى"],
        "الاستماع الأكاديمي": ["الاستماع لمحاضرة", "تدوين الملاحظات", "تلخيص المحتوى", "مراجعة المصطلحات", "أخرى"],

        "IELTS": ["اختبار تجريبي", "تدريب بوقت محدد", "مراجعة الأخطاء", "تحليل النتيجة", "أخرى"],
        "TOEFL": ["اختبار تجريبي", "تدريب بوقت محدد", "مراجعة الأخطاء", "تحليل النتيجة", "أخرى"],
        "Duolingo": ["اختبار تجريبي", "تدريب سريع", "مراجعة الأخطاء", "تحليل النتيجة", "أخرى"]
    };

    SMART_TASK_DATA["Languages"].training = [
        "قراءة نص",
        "حل أسئلة فهم",
        "تلخيص النص",
        "تحليل النص",
        "استخراج الأفكار الرئيسية",
        "استخراج المفردات",
        "تسجيل الملاحظات",
        "مراجعة الأخطاء",
        "الاستماع للمقطع",
        "تدوين الملاحظات",
        "الإجابة عن الأسئلة",
        "التحدث الحر",
        "تسجيل صوتي",
        "محاكاة مقابلة",
        "كتابة مسودة",
        "تصحيح الكتابة",
        "إعادة الصياغة",
        "تحسين الأسلوب",
        "أخرى"
    ];
}

const previousUpdateTrainingOptionsV531 = typeof updateTrainingOptions === "function" ? updateTrainingOptions : null;
updateTrainingOptions = function() {
    if (selectedTaskType === "Languages") {
        const selectedDetail = detailedTopicSelect ? detailedTopicSelect.value : "";
        const byDetail = SMART_TASK_DATA["Languages"] && SMART_TASK_DATA["Languages"].trainingByDetail;
        if (selectedDetail && byDetail && byDetail[selectedDetail]) {
            setOptions(trainingTypeSelect, byDetail[selectedDetail]);
            toggleOtherFields();
            return;
        }
    }
    if (previousUpdateTrainingOptionsV531) previousUpdateTrainingOptionsV531();
};

applyDeepLanguageTaskConfigV531();


/* EduPath AI v5.5.45 — Goals Math Statistics Part 2 Database
   Smart Merge فقط لقسم: الرياضيات -> الإحصاء
   لا يغير التصميم ولا يحذف البيانات السابقة. */
(function applyMathStatisticsPart2V5545(){
    if (typeof GOAL_CONFIG_V524 === "undefined" || !GOAL_CONFIG_V524["الرياضيات"]) return;
    const math = GOAL_CONFIG_V524["الرياضيات"];
    math.categories = math.categories || [];
    if (!math.categories.includes("الإحصاء")) math.categories.push("الإحصاء");
    math.paths = math.paths || {};
    math.states = math.states || {};

    const mergeUnique = (base, additions) => {
        const out = Array.isArray(base) ? base.slice() : [];
        additions.forEach(item => {
            if (item && !out.includes(item)) out.push(item);
        });
        if (!out.includes("أخرى")) out.push("أخرى");
        return out;
    };

    const statisticsPart2Paths = [
        "مراجعة الجزء الأول",
        "تنظيم البيانات",
        "ترتيب البيانات",
        "تصنيف البيانات",
        "تبويب البيانات",
        "الجداول الإحصائية",
        "إنشاء الجداول",
        "قراءة الجداول",
        "تفسير الجداول",
        "التوزيعات التكرارية",
        "التكرار المطلق",
        "التكرار النسبي",
        "التكرار المئوي",
        "التكرار التراكمي",
        "الفئات الإحصائية",
        "حدود الفئات",
        "مراكز الفئات",
        "سعة الفئة",
        "اختيار عدد الفئات",
        "التمثيل البياني",
        "الأعمدة البيانية",
        "الأشرطة البيانية",
        "المدرج التكراري",
        "المضلع التكراري",
        "المنحنى التكراري",
        "القطاع الدائري",
        "الرسم الخطي",
        "الساق والأوراق",
        "الصندوق والشوارب",
        "اختيار الرسم المناسب",
        "قراءة الرسوم البيانية",
        "تفسير الرسوم البيانية",
        "استخراج المعلومات",
        "المقارنة بين الرسوم",
        "تحليل البيانات",
        "التطبيقات الواقعية",
        "حل الأمثلة",
        "حل المسائل",
        "المراجعة الشاملة",
        "اختبار قصير",
        "اختبار تجريبي",
        "الاستعداد للجزء الثالث",
        "أخرى"
    ];

    math.paths["الإحصاء"] = mergeUnique(math.paths["الإحصاء"], statisticsPart2Paths);

    math.dataTypesByPath = math.dataTypesByPath || {};
    math.representationTypesByPath = math.representationTypesByPath || {};
    const dataTypes = ["نوعية", "كمية", "منفصلة", "مستمرة", "مختلطة", "أخرى"];
    const representationTypes = ["جداول", "توزيعات تكرارية", "رسوم بيانية", "تحليل البيانات", "تفسير الرسوم", "أخرى"];
    statisticsPart2Paths.forEach(path => {
        if (path !== "أخرى") {
            math.dataTypesByPath[`الإحصاء::${path}`] = mergeUnique(math.dataTypesByPath[`الإحصاء::${path}`], dataTypes);
            math.representationTypesByPath[`الإحصاء::${path}`] = mergeUnique(math.representationTypesByPath[`الإحصاء::${path}`], representationTypes);
        }
    });

    const part2States = {
        "مراجعة الجزء الأول": {
            current:["أحتاج مراجعة", "أعرف الأساسيات", "أشعر بالاستعداد", "أخرى"],
            target:["إتقان أساسيات الإحصاء", "الانتقال لتنظيم البيانات", "تقوية الفهم قبل الجزء الثاني", "أخرى"],
            commitment:["مراجعة يومية", "حل مسائل", "اختبار أسبوعي", "أخرى"]
        },
        "تنظيم البيانات": {
            current:["لا أعرفه", "أنظم بيانات بسيطة", "أنظم بيانات متنوعة", "أخرى"],
            target:["إتقان التنظيم", "زيادة السرعة", "تحليل البيانات", "أخرى"],
            commitment:["15 دقيقة", "30 دقيقة", "حل أمثلة", "اختبار", "أخرى"]
        },
        "ترتيب البيانات": {
            current:["لا أرتب البيانات", "أرتب بيانات بسيطة", "أرتب بيانات متنوعة", "أخرى"],
            target:["إتقان ترتيب البيانات", "تسهيل التحليل", "تقليل الأخطاء", "أخرى"],
            commitment:["15 دقيقة", "30 دقيقة", "حل أمثلة", "اختبار", "أخرى"]
        },
        "تصنيف البيانات": {
            current:["لا أصنف البيانات", "أصنف بعض الأنواع", "أصنف بدقة", "أخرى"],
            target:["إتقان التصنيف", "اختيار التمثيل المناسب", "تحليل البيانات بثقة", "أخرى"],
            commitment:["10 تدريبات", "20 تدريباً", "اختبار", "أخرى"]
        },
        "تبويب البيانات": {
            current:["لا أعرف التبويب", "أبني تبويباً بسيطاً", "أبوب بيانات متنوعة", "أخرى"],
            target:["إتقان التبويب", "تنظيم البيانات في جداول", "تحليل البيانات بسهولة", "أخرى"],
            commitment:["حل تدريبات", "إنشاء جدول", "اختبار", "أخرى"]
        },
        "الجداول الإحصائية": {
            current:["لا أعرفها", "أنشئ جداول بسيطة", "أنشئ جداول متنوعة", "أخرى"],
            target:["إتقان الجداول", "تحليل البيانات", "تفسير النتائج", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "أخرى"]
        },
        "إنشاء الجداول": {
            current:["لا أنشئ الجداول", "أنشئ جداول بسيطة", "أنشئ جداول كاملة", "أخرى"],
            target:["إنشاء جداول صحيحة", "تنظيم البيانات بوضوح", "الاستعداد للتحليل", "أخرى"],
            commitment:["إنشاء جدول", "حل تدريبات", "اختبار", "أخرى"]
        },
        "قراءة الجداول": {
            current:["أواجه صعوبة", "أقرأ الجداول البسيطة", "أقرأ جداول متنوعة", "أخرى"],
            target:["قراءة الجداول بثقة", "استخراج المعلومات", "تفسير النتائج", "أخرى"],
            commitment:["تحليل جدول", "حل أسئلة", "اختبار", "أخرى"]
        },
        "تفسير الجداول": {
            current:["أقرأ فقط دون تفسير", "أفسر بعض النتائج", "أفسر الجداول بثقة", "أخرى"],
            target:["تفسير الجداول بوضوح", "استخراج الاستنتاجات", "ربط النتائج بالواقع", "أخرى"],
            commitment:["تحليل أمثلة", "حل مسائل", "اختبار", "أخرى"]
        },
        "التوزيعات التكرارية": {
            current:["لا أعرفها", "أحسبها", "أحل مسائل متنوعة", "أخرى"],
            target:["إتقان التوزيعات", "تحليل البيانات", "حل التطبيقات", "أخرى"],
            commitment:["10 تدريبات", "20 تدريباً", "اختبار", "أخرى"]
        },
        "التكرار المطلق": {
            current:["لا أعرفه", "أحسبه أحياناً", "أحسبه بدقة", "أخرى"],
            target:["إتقان التكرار المطلق", "بناء جداول صحيحة", "تقليل الأخطاء", "أخرى"],
            commitment:["10 تدريبات", "20 تدريباً", "اختبار", "أخرى"]
        },
        "التكرار النسبي": {
            current:["لا أعرفه", "أحسبه أحياناً", "أستخدمه في الجداول", "أخرى"],
            target:["إتقان التكرار النسبي", "تفسير النسب", "تحليل البيانات", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "أخرى"]
        },
        "التكرار المئوي": {
            current:["لا أعرفه", "أحسبه أحياناً", "أفسره في الجداول", "أخرى"],
            target:["إتقان التكرار المئوي", "تفسير النتائج", "ربطه بالرسوم البيانية", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "أخرى"]
        },
        "التكرار التراكمي": {
            current:["لا أعرفه", "أحسبه أحياناً", "أتعامل مع الجداول التراكمية", "أخرى"],
            target:["إتقان التكرار التراكمي", "تحليل التوزيعات", "حل التطبيقات", "أخرى"],
            commitment:["10 تدريبات", "20 تدريباً", "اختبار", "أخرى"]
        },
        "الفئات الإحصائية": {
            current:["لا أعرفها", "أحدد الفئات", "أبني جداول كاملة", "أخرى"],
            target:["إتقان الفئات", "زيادة الدقة", "حل التطبيقات", "أخرى"],
            commitment:["حل تدريبات", "اختبار", "أخرى"]
        },
        "حدود الفئات": {
            current:["لا أعرف الحدود", "أحدد حدوداً بسيطة", "أحدد الحدود بدقة", "أخرى"],
            target:["إتقان حدود الفئات", "تحسين بناء الجداول", "تقليل الأخطاء", "أخرى"],
            commitment:["حل تدريبات", "اختبار", "أخرى"]
        },
        "مراكز الفئات": {
            current:["لا أعرفها", "أحسب مراكز بسيطة", "أستخدمها في التحليل", "أخرى"],
            target:["إتقان مراكز الفئات", "استخدامها في التمثيل", "تحليل البيانات", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "أخرى"]
        },
        "سعة الفئة": {
            current:["لا أعرفها", "أحسبها أحياناً", "أحددها بدقة", "أخرى"],
            target:["إتقان سعة الفئة", "اختيار الفئات المناسبة", "تحسين التبويب", "أخرى"],
            commitment:["حل تدريبات", "اختبار", "أخرى"]
        },
        "اختيار عدد الفئات": {
            current:["أحتار في العدد", "أختار عدداً تقريبياً", "أختار عدداً مناسباً", "أخرى"],
            target:["اختيار عدد الفئات بدقة", "تحسين عرض البيانات", "تقليل التشويش", "أخرى"],
            commitment:["تحليل أمثلة", "اختبار", "أخرى"]
        },
        "التمثيل البياني": {
            current:["لا أعرفه", "أقرأ الرسوم", "أرسم وأفسر الرسوم", "أخرى"],
            target:["إتقان التمثيل البياني", "اختيار الرسم المناسب", "تحليل البيانات", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "أخرى"]
        },
        "الأعمدة البيانية": {
            current:["لا أعرفها", "أرسم أعمدة بسيطة", "أفسرها بدقة", "أخرى"],
            target:["إتقان الأعمدة البيانية", "مقارنة الفئات", "تحليل البيانات النوعية", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "أخرى"]
        },
        "الأشرطة البيانية": {
            current:["لا أعرفها", "أرسم أشرطة بسيطة", "أفسرها بدقة", "أخرى"],
            target:["إتقان الأشرطة البيانية", "مقارنة القيم", "تحليل النتائج", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "أخرى"]
        },
        "المدرج التكراري": {
            current:["لا أعرفه", "أرسمه أحياناً", "أفسره بدقة", "أخرى"],
            target:["إتقان المدرج التكراري", "تحليل التوزيعات", "تمييز شكل البيانات", "أخرى"],
            commitment:["10 تدريبات", "20 تدريباً", "اختبار", "أخرى"]
        },
        "المضلع التكراري": {
            current:["لا أعرفه", "أرسمه بمساعدة", "أفسره بدقة", "أخرى"],
            target:["إتقان المضلع التكراري", "مقارنة التوزيعات", "تحليل البيانات", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "أخرى"]
        },
        "المنحنى التكراري": {
            current:["لا أعرفه", "أقرأه أحياناً", "أفسره بدقة", "أخرى"],
            target:["إتقان المنحنى التكراري", "تحليل شكل التوزيع", "استخراج الاستنتاجات", "أخرى"],
            commitment:["تحليل رسومات", "اختبار", "أخرى"]
        },
        "القطاع الدائري": {
            current:["لا أعرفه", "أقرأه أحياناً", "أرسمه وأفسره", "أخرى"],
            target:["إتقان القطاع الدائري", "تفسير النسب", "عرض البيانات بوضوح", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "أخرى"]
        },
        "الرسم الخطي": {
            current:["لا أعرفه", "أقرأه أحياناً", "أفسر الاتجاهات", "أخرى"],
            target:["إتقان الرسم الخطي", "تحليل التغيرات", "تفسير الاتجاهات", "أخرى"],
            commitment:["تحليل رسومات", "اختبار", "أخرى"]
        },
        "الساق والأوراق": {
            current:["لا أعرفه", "أبنيه بمساعدة", "أفسره بدقة", "أخرى"],
            target:["إتقان الساق والأوراق", "تنظيم القيم", "تحليل التوزيع", "أخرى"],
            commitment:["حل تدريبات", "اختبار", "أخرى"]
        },
        "الصندوق والشوارب": {
            current:["لا أعرفه", "أقرأه أحياناً", "أفسره بدقة", "أخرى"],
            target:["إتقان الصندوق والشوارب", "تحليل التشتت", "مقارنة البيانات", "أخرى"],
            commitment:["تحليل رسومات", "حل تدريبات", "اختبار", "أخرى"]
        },
        "اختيار الرسم المناسب": {
            current:["أحتار بين الرسوم", "أعرف بعضها", "أختار الرسم المناسب", "أخرى"],
            target:["الاختيار المباشر", "تقليل الأخطاء", "زيادة السرعة", "أخرى"],
            commitment:["تحليل أمثلة", "اختبار", "أخرى"]
        },
        "قراءة الرسوم البيانية": {
            current:["أواجه صعوبة", "أقرأ رسوماً بسيطة", "أقرأ رسوماً متنوعة", "أخرى"],
            target:["قراءة الرسوم بثقة", "استخراج المعلومات", "تفسير النتائج", "أخرى"],
            commitment:["تحليل رسومات", "حل أسئلة", "اختبار", "أخرى"]
        },
        "تفسير الرسوم البيانية": {
            current:["أكتفي بالقراءة", "أفسر البيانات", "أحلل النتائج", "أخرى"],
            target:["تحليل احترافي", "استخراج الاستنتاجات", "ربط النتائج بالواقع", "أخرى"],
            commitment:["تحليل مسائل", "اختبار", "أخرى"]
        },
        "استخراج المعلومات": {
            current:["أفوت بعض المعلومات", "أستخرج معلومات أساسية", "أستخرج معلومات دقيقة", "أخرى"],
            target:["استخراج المعلومات بسرعة", "زيادة الدقة", "حل الأسئلة بثقة", "أخرى"],
            commitment:["تحليل رسوم", "حل أسئلة", "اختبار", "أخرى"]
        },
        "المقارنة بين الرسوم": {
            current:["أواجه صعوبة", "أقارن أحياناً", "أقارن بدقة", "أخرى"],
            target:["إتقان المقارنة", "استخراج الفروق", "تحليل الاتجاهات", "أخرى"],
            commitment:["تحليل أمثلة", "اختبار", "أخرى"]
        },
        "تحليل البيانات": {
            current:["لا أحلل البيانات", "أحلل بيانات بسيطة", "أحلل بيانات متنوعة", "أخرى"],
            target:["تحليل البيانات بثقة", "اختيار الطريقة المناسبة", "تفسير النتائج", "أخرى"],
            commitment:["تحليل أمثلة", "حل مسائل", "اختبار", "أخرى"]
        },
        "التطبيقات الواقعية": {
            current:["أواجه صعوبة", "أفهم بعض التطبيقات", "أطبق بعض المفاهيم", "أخرى"],
            target:["ربط الإحصاء بالحياة", "تحليل البيانات الواقعية", "حل التطبيقات", "أخرى"],
            commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]
        },
        "حل الأمثلة": {
            current:["أحتاج مساعدة", "أحل أمثلة بسيطة", "أحل أمثلة متنوعة", "أخرى"],
            target:["فهم خطوات الحل", "زيادة الثقة", "الاستعداد للمسائل", "أخرى"],
            commitment:["5 أمثلة", "10 أمثلة", "تحليل الأخطاء", "أخرى"]
        },
        "حل المسائل": {
            current:["أواجه صعوبة", "أحل مسائل بسيطة", "أحل مسائل متنوعة", "أخرى"],
            target:["تحليل المسألة", "اختيار المفهوم المناسب", "حل تطبيقات متنوعة", "أخرى"],
            commitment:["5 مسائل", "10 مسائل", "تحليل الأخطاء", "اختبار", "أخرى"]
        },
        "المراجعة الشاملة": {
            current:["أحتاج مراجعة", "أراجع بعض الأجزاء", "أراجع المنهج كاملاً", "أخرى"],
            target:["إتقان تنظيم البيانات والتمثيل البياني", "الاستعداد للجزء الثالث", "تحقيق فهم قوي", "أخرى"],
            commitment:["مراجعة يومية", "مراجعة أسبوعية", "اختبار شامل", "تحليل نقاط الضعف", "أخرى"]
        },
        "اختبار قصير": {
            current:["أحتاج مراجعة", "أحل اختبارات قصيرة", "أحل اختبارات كاملة", "أخرى"],
            target:["تحسين الدرجة", "إتقان الجزء الثاني", "الاستعداد للجزء الثالث", "أخرى"],
            commitment:["اختبار أسبوعي", "اختبار تجريبي", "تحليل الأخطاء", "أخرى"]
        },
        "اختبار تجريبي": {
            current:["أحتاج مراجعة", "أحل اختبارات قصيرة", "أحل اختبارات كاملة", "أخرى"],
            target:["تحسين الدرجة", "إتقان الجزء الثاني", "الاستعداد للجزء الثالث", "أخرى"],
            commitment:["اختبار أسبوعي", "اختبار تجريبي", "تحليل الأخطاء", "أخرى"]
        },
        "الاستعداد للجزء الثالث": {
            current:["أحتاج مراجعة", "أعرف الأساسيات", "أشعر بالاستعداد", "أخرى"],
            target:["إتقان تنظيم البيانات والتمثيل البياني", "الاستعداد لمقاييس النزعة المركزية", "أخرى"],
            commitment:["مراجعة يومية", "حل مسائل", "اختبار أسبوعي", "أخرى"]
        },
        "أخرى": {
            current:["أحتاج تحديد الموضوع", "بدأت التعلم", "أحل تدريبات", "أحتاج خطة واضحة", "أخرى"],
            target:["بناء أساس قوي في الإحصاء", "إتقان المسار المختار", "الاستعداد للجزء الثالث", "أخرى"],
            commitment:["تدريب يومي", "مراجعة أسبوعية", "اختبار ذاتي", "برنامج مخصص", "أخرى"]
        }
    };

    Object.entries(part2States).forEach(([path, value]) => {
        math.states[`الإحصاء::${path}`] = {
            current: mergeUnique(value.current, ["أخرى"]),
            target: mergeUnique(value.target, ["أخرى"]),
            commitment: mergeUnique(value.commitment, ["أخرى"])
        };
    });
})();


/* EduPath AI v5.5.46 — Goals Math Statistics Part 3 Database
   Smart Merge فقط لقسم: الرياضيات -> الإحصاء
   لا يغير التصميم ولا يحذف البيانات السابقة. */
(function applyMathStatisticsPart3V5546(){
    if (typeof GOAL_CONFIG_V524 === "undefined" || !GOAL_CONFIG_V524["الرياضيات"]) return;
    const math = GOAL_CONFIG_V524["الرياضيات"];
    math.categories = math.categories || [];
    if (!math.categories.includes("الإحصاء")) math.categories.push("الإحصاء");
    math.paths = math.paths || {};
    math.states = math.states || {};

    const mergeUnique = (base, additions) => {
        const out = Array.isArray(base) ? base.slice() : [];
        additions.forEach(item => {
            if (item && !out.includes(item)) out.push(item);
        });
        if (!out.includes("أخرى")) out.push("أخرى");
        return out;
    };

    const statisticsPart3Paths = [
        "مراجعة الجزء الثاني",
        "مقاييس النزعة المركزية",
        "المتوسط الحسابي",
        "المتوسط المرجح",
        "المتوسط الهندسي",
        "المتوسط التوافقي",
        "الوسيط",
        "المنوال",
        "اختيار المقياس المناسب",
        "مقارنة المقاييس",
        "مقاييس الموقع",
        "الربيعات",
        "الأعشار",
        "المئينات",
        "الرتب المئينية",
        "إيجاد المقاييس من البيانات الخام",
        "إيجاد المقاييس من الجداول",
        "إيجاد المقاييس من التوزيعات التكرارية",
        "تفسير النتائج",
        "المقارنة بين البيانات",
        "تحليل البيانات",
        "التطبيقات الواقعية",
        "حل الأمثلة",
        "حل المسائل",
        "المراجعة الشاملة",
        "اختبار قصير",
        "اختبار تجريبي",
        "الاستعداد للجزء الرابع",
        "أخرى"
    ];

    math.paths["الإحصاء"] = mergeUnique(math.paths["الإحصاء"], statisticsPart3Paths);

    math.dataTypesByPath = math.dataTypesByPath || {};
    math.measureTypesByPath = math.measureTypesByPath || {};
    const dataTypes = ["خام", "مجدولة", "توزيعات تكرارية", "نوعية", "كمية", "مختلطة", "أخرى"];
    const measureTypes = ["متوسطات", "وسيط", "منوال", "ربيعات", "أعشار", "مئينات", "تحليل البيانات", "أخرى"];
    statisticsPart3Paths.forEach(path => {
        if (path !== "أخرى") {
            math.dataTypesByPath[`الإحصاء::${path}`] = mergeUnique(math.dataTypesByPath[`الإحصاء::${path}`], dataTypes);
            math.measureTypesByPath[`الإحصاء::${path}`] = mergeUnique(math.measureTypesByPath[`الإحصاء::${path}`], measureTypes);
        }
    });

    const part3States = {
        "مراجعة الجزء الثاني": {
            current:["أحتاج مراجعة", "أعرف تنظيم البيانات", "أفسر الرسوم البيانية", "أخرى"],
            target:["إتقان تنظيم البيانات", "الاستعداد لمقاييس النزعة المركزية", "تقوية أساس الإحصاء", "أخرى"],
            commitment:["مراجعة يومية", "حل مسائل", "اختبار أسبوعي", "أخرى"]
        },
        "مقاييس النزعة المركزية": {
            current:["لا أعرفها", "أعرف بعضها", "أحسب المقاييس الأساسية", "أخرى"],
            target:["فهم المقاييس", "اختيار المقياس المناسب", "تحليل البيانات بثقة", "أخرى"],
            commitment:["10 تدريبات", "20 تدريباً", "اختبار", "أخرى"]
        },
        "المتوسط الحسابي": {
            current:["لا أعرفه", "أحسبه من بيانات بسيطة", "أحسبه من جداول", "أخرى"],
            target:["إتقان المتوسط الحسابي", "تفسير قيمته", "حل التطبيقات", "أخرى"],
            commitment:["10 تدريبات", "20 تدريباً", "اختبار", "أخرى"]
        },
        "المتوسط المرجح": {
            current:["لا أعرفه", "أفهم فكرته", "أحسبه في مسائل بسيطة", "أخرى"],
            target:["إتقان المتوسط المرجح", "اختيار الأوزان الصحيحة", "حل التطبيقات الواقعية", "أخرى"],
            commitment:["10 تدريبات", "حل أمثلة", "اختبار", "أخرى"]
        },
        "المتوسط الهندسي": {
            current:["لا أعرفه", "أفهم استخدامه", "أحسبه في مسائل بسيطة", "أخرى"],
            target:["إتقان المتوسط الهندسي", "استخدامه في معدلات النمو", "تحليل النتائج", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "مراجعة", "أخرى"]
        },
        "المتوسط التوافقي": {
            current:["لا أعرفه", "أفهم فكرته", "أحسبه بمساعدة", "أخرى"],
            target:["إتقان المتوسط التوافقي", "استخدامه في مسائل المعدلات", "اختيار المقياس المناسب", "أخرى"],
            commitment:["حل تدريبات", "اختبار", "مراجعة", "أخرى"]
        },
        "المتوسطات": {
            current:["لا أعرفها", "أحسب المتوسط الحسابي", "أحسب جميع المتوسطات", "أخرى"],
            target:["إتقان المتوسطات", "اختيار المتوسط المناسب", "حل التطبيقات", "أخرى"],
            commitment:["10 تدريبات", "20 تدريباً", "اختبار", "أخرى"]
        },
        "الوسيط": {
            current:["لا أعرفه", "أحسبه", "أطبقه على مسائل متنوعة", "أخرى"],
            target:["إتقان الوسيط", "تحليل البيانات", "حل التطبيقات", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "أخرى"]
        },
        "المنوال": {
            current:["لا أعرفه", "أحسبه", "أحل مسائل متنوعة", "أخرى"],
            target:["إتقان المنوال", "تحليل البيانات", "حل التطبيقات", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "أخرى"]
        },
        "اختيار المقياس المناسب": {
            current:["أحتار بين المقاييس", "أعرف بعضها", "أختار المناسب", "أخرى"],
            target:["الاختيار المباشر", "تقليل الأخطاء", "زيادة السرعة", "أخرى"],
            commitment:["تحليل أمثلة", "اختبار", "أخرى"]
        },
        "مقارنة المقاييس": {
            current:["لا أقارن بين المقاييس", "أقارن أحياناً", "أفسر الفروق", "أخرى"],
            target:["إتقان المقارنة", "فهم أثر القيم المتطرفة", "اختيار المقياس الأنسب", "أخرى"],
            commitment:["تحليل أمثلة", "حل مسائل", "اختبار", "أخرى"]
        },
        "مقاييس الموقع": {
            current:["لا أعرفها", "أعرف بعضها", "أحسب مقاييس بسيطة", "أخرى"],
            target:["إتقان مقاييس الموقع", "تحديد موقع القيم", "تحليل توزيع البيانات", "أخرى"],
            commitment:["10 تدريبات", "20 تدريباً", "اختبار", "أخرى"]
        },
        "الربيعات": {
            current:["لا أعرفها", "أحسب بعضها", "أحسبها بدقة", "أخرى"],
            target:["إتقان الربيعات", "تحليل موقع البيانات", "الاستعداد لمقاييس التشتت", "أخرى"],
            commitment:["10 تدريبات", "20 تدريباً", "اختبار", "أخرى"]
        },
        "الأعشار": {
            current:["لا أعرفها", "أحسب بعضها", "أحسبها بدقة", "أخرى"],
            target:["إتقان الأعشار", "تحليل موقع القيم", "حل التطبيقات", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "أخرى"]
        },
        "المئينات": {
            current:["لا أعرفها", "أحسب بعضها", "أحسبها بدقة", "أخرى"],
            target:["إتقان المئينات", "تحليل الرتب", "تفسير النتائج", "أخرى"],
            commitment:["10 تدريبات", "20 تدريباً", "اختبار", "أخرى"]
        },
        "الرتب المئينية": {
            current:["لا أعرفها", "أفسرها أحياناً", "أحسبها وأحللها", "أخرى"],
            target:["إتقان الرتب المئينية", "تحديد موقع الفرد أو القيمة", "ربطها بالاختبارات والتقييم", "أخرى"],
            commitment:["حل تدريبات", "تحليل أمثلة", "اختبار", "أخرى"]
        },
        "الربيعات والأعشار والمئينات": {
            current:["لا أعرفها", "أحسب بعضها", "أحسب جميعها", "أخرى"],
            target:["إتقان المقاييس", "تحليل البيانات", "حل التطبيقات", "أخرى"],
            commitment:["10 تدريبات", "20 تدريباً", "اختبار", "أخرى"]
        },
        "إيجاد المقاييس من البيانات الخام": {
            current:["أواجه صعوبة", "أحسب مقاييس بسيطة", "أحسب مقاييس متنوعة", "أخرى"],
            target:["إتقان الحساب من البيانات الخام", "تنظيم الخطوات", "تقليل الأخطاء", "أخرى"],
            commitment:["10 تدريبات", "20 تدريباً", "اختبار", "أخرى"]
        },
        "إيجاد المقاييس من الجداول": {
            current:["لا أعرف الطريقة", "أطبقها بمساعدة", "أحسب من الجداول", "أخرى"],
            target:["إتقان الحساب من الجداول", "فهم التكرارات", "تحليل النتائج", "أخرى"],
            commitment:["حل تدريبات", "اختبار", "مراجعة", "أخرى"]
        },
        "إيجاد المقاييس من التوزيعات التكرارية": {
            current:["لا أعرف الطريقة", "أطبق القوانين أحياناً", "أحسب المقاييس بثقة", "أخرى"],
            target:["إتقان الحساب من التوزيعات", "زيادة الدقة", "حل التطبيقات المتقدمة", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "مراجعة", "أخرى"]
        },
        "تفسير النتائج": {
            current:["أحسب فقط", "أفسر النتائج", "أحلل البيانات", "أخرى"],
            target:["تحليل احترافي", "استخراج الاستنتاجات", "ربط النتائج بالواقع", "أخرى"],
            commitment:["تحليل مسائل", "اختبار", "أخرى"]
        },
        "المقارنة بين البيانات": {
            current:["أواجه صعوبة", "أقارن قيماً بسيطة", "أقارن مجموعات بيانات", "أخرى"],
            target:["إتقان المقارنة", "تفسير الفروق", "دعم القرار بالبيانات", "أخرى"],
            commitment:["تحليل أمثلة", "حل مسائل", "اختبار", "أخرى"]
        },
        "تحليل البيانات": {
            current:["لا أحلل البيانات", "أحلل بيانات بسيطة", "أحلل بيانات متنوعة", "أخرى"],
            target:["تحليل البيانات بثقة", "اختيار المقياس المناسب", "تفسير النتائج", "أخرى"],
            commitment:["تحليل أمثلة", "حل مسائل", "اختبار", "أخرى"]
        },
        "التطبيقات الواقعية": {
            current:["أواجه صعوبة", "أفهم بعض التطبيقات", "أطبق بعض المفاهيم", "أخرى"],
            target:["ربط الإحصاء بالحياة", "تحليل البيانات الواقعية", "حل التطبيقات", "أخرى"],
            commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]
        },
        "حل الأمثلة": {
            current:["أحتاج مساعدة", "أحل أمثلة بسيطة", "أحل أمثلة متنوعة", "أخرى"],
            target:["فهم خطوات الحل", "زيادة الثقة", "الاستعداد للمسائل", "أخرى"],
            commitment:["5 أمثلة", "10 أمثلة", "تحليل الأخطاء", "أخرى"]
        },
        "حل المسائل": {
            current:["أواجه صعوبة", "أحل مسائل بسيطة", "أحل مسائل متنوعة", "أخرى"],
            target:["تحليل المسألة", "اختيار المقياس المناسب", "حل تطبيقات متنوعة", "أخرى"],
            commitment:["5 مسائل", "10 مسائل", "تحليل الأخطاء", "اختبار", "أخرى"]
        },
        "المراجعة الشاملة": {
            current:["أحتاج مراجعة", "أراجع بعض الأجزاء", "أراجع المنهج كاملاً", "أخرى"],
            target:["إتقان مقاييس النزعة المركزية والموقع", "الاستعداد للجزء الرابع", "تحقيق فهم قوي", "أخرى"],
            commitment:["مراجعة يومية", "مراجعة أسبوعية", "اختبار شامل", "تحليل نقاط الضعف", "أخرى"]
        },
        "اختبار قصير": {
            current:["أحتاج مراجعة", "أحل اختبارات قصيرة", "أحل اختبارات كاملة", "أخرى"],
            target:["تحسين الدرجة", "إتقان الجزء الثالث", "الاستعداد للجزء الرابع", "أخرى"],
            commitment:["اختبار أسبوعي", "اختبار تجريبي", "تحليل الأخطاء", "أخرى"]
        },
        "اختبار تجريبي": {
            current:["أحتاج مراجعة", "أحل اختبارات قصيرة", "أحل اختبارات كاملة", "أخرى"],
            target:["تحسين الدرجة", "إتقان الجزء الثالث", "الاستعداد للجزء الرابع", "أخرى"],
            commitment:["اختبار أسبوعي", "اختبار تجريبي", "تحليل الأخطاء", "أخرى"]
        },
        "الاستعداد للجزء الرابع": {
            current:["أحتاج مراجعة", "أعرف الأساسيات", "أشعر بالاستعداد", "أخرى"],
            target:["إتقان مقاييس النزعة المركزية ومقاييس الموقع", "الاستعداد لمقاييس التشتت", "أخرى"],
            commitment:["مراجعة يومية", "حل مسائل", "اختبار أسبوعي", "أخرى"]
        },
        "أخرى": {
            current:["أحتاج تحديد الموضوع", "بدأت التعلم", "أحل تدريبات", "أحتاج خطة واضحة", "أخرى"],
            target:["بناء أساس قوي في الإحصاء", "إتقان المسار المختار", "الاستعداد للجزء الرابع", "أخرى"],
            commitment:["تدريب يومي", "مراجعة أسبوعية", "اختبار ذاتي", "برنامج مخصص", "أخرى"]
        }
    };

    Object.entries(part3States).forEach(([path, value]) => {
        math.states[`الإحصاء::${path}`] = {
            current: mergeUnique(value.current, ["أخرى"]),
            target: mergeUnique(value.target, ["أخرى"]),
            commitment: mergeUnique(value.commitment, ["أخرى"])
        };
    });
})();


/* EduPath AI v5.5.47 — Goals Math Statistics Part 4 Database
   Smart Merge فقط لقسم: الرياضيات -> الإحصاء -> مقاييس التشتت
   لا يغير التصميم ولا يحذف البيانات السابقة. */
(function applyMathStatisticsPart4V5547(){
    if (typeof GOAL_CONFIG_V524 === "undefined" || !GOAL_CONFIG_V524["الرياضيات"]) return;
    const math = GOAL_CONFIG_V524["الرياضيات"];
    math.categories = math.categories || [];
    if (!math.categories.includes("الإحصاء")) math.categories.push("الإحصاء");
    math.paths = math.paths || {};
    math.states = math.states || {};

    const mergeUnique = (base, additions) => {
        const out = Array.isArray(base) ? base.slice() : [];
        additions.forEach(item => {
            if (item && !out.includes(item)) out.push(item);
        });
        if (!out.includes("أخرى")) out.push("أخرى");
        return out;
    };

    const statisticsPart4Paths = [
        "مراجعة الجزء الثالث",
        "مقاييس التشتت",
        "أهمية التشتت",
        "المدى",
        "المدى الربيعي",
        "نصف المدى الربيعي",
        "الانحراف المتوسط",
        "التباين",
        "التباين للمجتمع",
        "التباين للعينة",
        "الانحراف المعياري",
        "معامل الاختلاف",
        "اختيار مقياس التشتت المناسب",
        "مقارنة التشتت",
        "التشتت في البيانات الخام",
        "التشتت في الجداول",
        "التشتت في التوزيعات التكرارية",
        "حساب المقاييس",
        "تفسير النتائج",
        "تحليل البيانات",
        "مقارنة مجموعات البيانات",
        "اكتشاف القيم المتطرفة",
        "تأثير القيم المتطرفة",
        "التطبيقات الواقعية",
        "التطبيقات الاقتصادية",
        "التطبيقات الطبية",
        "التطبيقات الهندسية",
        "التطبيقات الحاسوبية",
        "التطبيقات في الذكاء الاصطناعي",
        "حل الأمثلة",
        "حل المسائل",
        "المراجعة الشاملة",
        "اختبار قصير",
        "اختبار تجريبي",
        "الاستعداد للجزء الخامس",
        "أخرى"
    ];

    math.paths["الإحصاء"] = mergeUnique(math.paths["الإحصاء"], statisticsPart4Paths);

    math.dataTypesByPath = math.dataTypesByPath || {};
    math.dispersionTypesByPath = math.dispersionTypesByPath || {};
    const dataTypes = ["خام", "مجدولة", "توزيعات تكرارية", "نوعية", "كمية", "مختلطة", "أخرى"];
    const dispersionTypes = ["المدى", "المدى الربيعي", "الانحراف المتوسط", "التباين", "الانحراف المعياري", "معامل الاختلاف", "تحليل البيانات", "أخرى"];
    statisticsPart4Paths.forEach(path => {
        if (path !== "أخرى") {
            math.dataTypesByPath[`الإحصاء::${path}`] = mergeUnique(math.dataTypesByPath[`الإحصاء::${path}`], dataTypes);
            math.dispersionTypesByPath[`الإحصاء::${path}`] = mergeUnique(math.dispersionTypesByPath[`الإحصاء::${path}`], dispersionTypes);
        }
    });

    const part4States = {
        "مراجعة الجزء الثالث": {
            current:["أحتاج مراجعة", "أعرف مقاييس النزعة المركزية", "أحل مسائل متنوعة", "أخرى"],
            target:["إتقان الجزء الثالث", "الاستعداد لمقاييس التشتت", "تقوية أساس التحليل", "أخرى"],
            commitment:["مراجعة يومية", "حل مسائل", "اختبار أسبوعي", "أخرى"]
        },
        "مقاييس التشتت": {
            current:["لا أعرفها", "أعرف بعضها", "أحسب مقاييس بسيطة", "أخرى"],
            target:["فهم التشتت", "اختيار مقياس التشتت المناسب", "تحليل البيانات بثقة", "أخرى"],
            commitment:["10 تدريبات", "20 تدريباً", "اختبار", "أخرى"]
        },
        "أهمية التشتت": {
            current:["لا أفهم أهميته", "أعرف الفكرة العامة", "أربطه بالمقارنة بين البيانات", "أخرى"],
            target:["فهم أهمية التشتت", "تفسير اختلاف البيانات", "ربطه بجودة التحليل", "أخرى"],
            commitment:["قراءة المفهوم", "تحليل أمثلة", "اختبار", "أخرى"]
        },
        "المدى": {
            current:["لا أعرفه", "أحسبه", "أطبقه على مسائل متنوعة", "أخرى"],
            target:["إتقان المدى", "تحليل البيانات", "حل التطبيقات", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "أخرى"]
        },
        "المدى الربيعي": {
            current:["لا أعرفه", "أحسبه", "أحل مسائل متنوعة", "أخرى"],
            target:["إتقان المدى الربيعي", "تحليل التشتت حول الوسط", "تقليل أثر القيم المتطرفة", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "مراجعة", "أخرى"]
        },
        "نصف المدى الربيعي": {
            current:["لا أعرفه", "أحسبه", "أفسر قيمته", "أخرى"],
            target:["إتقان الحساب", "تحليل البيانات", "حل التطبيقات", "أخرى"],
            commitment:["حل تدريبات", "اختبار", "أخرى"]
        },
        "المدى الربيعي ونصف المدى الربيعي": {
            current:["لا أعرفهما", "أحسبهما", "أحل مسائل متنوعة", "أخرى"],
            target:["إتقان الحساب", "تحليل البيانات", "حل التطبيقات", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "أخرى"]
        },
        "الانحراف المتوسط": {
            current:["لا أعرفه", "أحسبه", "أطبق أمثلة متنوعة", "أخرى"],
            target:["إتقان المفهوم", "حل التطبيقات", "تحليل البيانات", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "أخرى"]
        },
        "التباين": {
            current:["لا أعرفه", "أحسبه للمجتمع", "أحسبه للعينة", "أخرى"],
            target:["إتقان التباين", "زيادة الدقة", "حل التطبيقات", "أخرى"],
            commitment:["10 تدريبات", "20 تدريباً", "اختبار", "أخرى"]
        },
        "التباين للمجتمع": {
            current:["لا أعرفه", "أحسبه بخطوات", "أطبقه على بيانات متنوعة", "أخرى"],
            target:["إتقان تباين المجتمع", "تفسير النتائج", "حل التطبيقات", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "مراجعة", "أخرى"]
        },
        "التباين للعينة": {
            current:["لا أعرفه", "أميز بينه وبين تباين المجتمع", "أحسبه بدقة", "أخرى"],
            target:["إتقان تباين العينة", "زيادة الدقة", "الاستعداد للاستدلال الإحصائي", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "مراجعة", "أخرى"]
        },
        "الانحراف المعياري": {
            current:["لا أعرفه", "أحسبه", "أطبق على بيانات متنوعة", "أخرى"],
            target:["إتقان الانحراف المعياري", "تحليل البيانات", "حل التطبيقات", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "أخرى"]
        },
        "معامل الاختلاف": {
            current:["لا أعرفه", "أحسبه", "أقارن بين البيانات", "أخرى"],
            target:["إتقان معامل الاختلاف", "اختيار المجموعة الأنسب", "تحليل النتائج", "أخرى"],
            commitment:["حل تدريبات", "اختبار", "أخرى"]
        },
        "اختيار مقياس التشتت المناسب": {
            current:["أحتار بين المقاييس", "أعرف بعضها", "أختار المناسب", "أخرى"],
            target:["الاختيار المباشر", "تقليل الأخطاء", "زيادة السرعة", "أخرى"],
            commitment:["تحليل أمثلة", "اختبار", "أخرى"]
        },
        "مقارنة التشتت": {
            current:["أواجه صعوبة", "أقارن بيانات بسيطة", "أقارن مجموعات متعددة", "أخرى"],
            target:["إتقان المقارنة", "تفسير الفروق", "دعم القرار بالبيانات", "أخرى"],
            commitment:["تحليل أمثلة", "حل مسائل", "اختبار", "أخرى"]
        },
        "التشتت في البيانات الخام": {
            current:["أواجه صعوبة", "أحسب مقاييس بسيطة", "أحل مسائل متنوعة", "أخرى"],
            target:["إتقان الحساب من البيانات الخام", "تنظيم خطوات الحل", "تقليل الأخطاء", "أخرى"],
            commitment:["10 تدريبات", "20 تدريباً", "اختبار", "أخرى"]
        },
        "التشتت في الجداول": {
            current:["لا أعرف الطريقة", "أطبقها بمساعدة", "أحسب من الجداول", "أخرى"],
            target:["إتقان الحساب من الجداول", "فهم التكرارات", "تحليل النتائج", "أخرى"],
            commitment:["حل تدريبات", "اختبار", "مراجعة", "أخرى"]
        },
        "التشتت في التوزيعات التكرارية": {
            current:["لا أعرف الطريقة", "أطبق القوانين أحياناً", "أحسب المقاييس بثقة", "أخرى"],
            target:["إتقان الحساب من التوزيعات", "زيادة الدقة", "حل التطبيقات المتقدمة", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "مراجعة", "أخرى"]
        },
        "حساب المقاييس": {
            current:["أحتاج تدريباً", "أحسب بعض المقاييس", "أحسب معظم المقاييس", "أخرى"],
            target:["إتقان الحساب", "زيادة السرعة", "تقليل الأخطاء", "أخرى"],
            commitment:["10 تدريبات", "20 تدريباً", "اختبار", "أخرى"]
        },
        "تفسير النتائج": {
            current:["أحسب فقط", "أفسر النتائج", "أحلل البيانات", "أخرى"],
            target:["تحليل احترافي", "استخراج الاستنتاجات", "ربط النتائج بالواقع", "أخرى"],
            commitment:["تحليل مسائل", "اختبار", "أخرى"]
        },
        "تحليل البيانات": {
            current:["أحسب فقط", "أفسر النتائج", "أحلل البيانات", "أخرى"],
            target:["تحليل احترافي", "استخراج الاستنتاجات", "ربط النتائج بالواقع", "أخرى"],
            commitment:["تحليل مسائل", "اختبار", "أخرى"]
        },
        "مقارنة مجموعات البيانات": {
            current:["أواجه صعوبة", "أقارن مجموعة أو مجموعتين", "أحلل عدة مجموعات", "أخرى"],
            target:["إتقان المقارنة", "تفسير التشتت", "اختيار المجموعة الأنسب", "أخرى"],
            commitment:["تحليل أمثلة", "حل مسائل", "اختبار", "أخرى"]
        },
        "اكتشاف القيم المتطرفة": {
            current:["لا أعرفها", "أكتشفها", "أحلل تأثيرها", "أخرى"],
            target:["إتقان التحليل", "تفسير تأثيرها", "تحسين جودة البيانات", "أخرى"],
            commitment:["حل تدريبات", "اختبار", "أخرى"]
        },
        "تأثير القيم المتطرفة": {
            current:["لا أفهم تأثيرها", "ألاحظ أثرها أحياناً", "أحلل أثرها على المقاييس", "أخرى"],
            target:["فهم تأثير القيم المتطرفة", "اختيار المقاييس المقاومة", "تحسين تفسير النتائج", "أخرى"],
            commitment:["تحليل أمثلة", "اختبار", "أخرى"]
        },
        "القيم المتطرفة": {
            current:["لا أعرفها", "أكتشفها", "أحلل تأثيرها", "أخرى"],
            target:["إتقان التحليل", "تفسير تأثيرها", "تحسين جودة البيانات", "أخرى"],
            commitment:["حل تدريبات", "اختبار", "أخرى"]
        },
        "التطبيقات الواقعية": {
            current:["أواجه صعوبة", "أفهم بعض التطبيقات", "أطبق بعض المفاهيم", "أخرى"],
            target:["ربط الإحصاء بالحياة", "تحليل البيانات الواقعية", "حل التطبيقات", "أخرى"],
            commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]
        },
        "التطبيقات الاقتصادية": {
            current:["أعرف بعض الأمثلة", "أطبق مفاهيم بسيطة", "أحل مسائل متنوعة", "أخرى"],
            target:["تحليل التشتت الاقتصادي", "تفسير المخاطر", "ربط النتائج بالقرارات", "أخرى"],
            commitment:["5 مسائل", "تحليل بيانات", "اختبار", "أخرى"]
        },
        "التطبيقات الطبية": {
            current:["أعرف بعض الأمثلة", "أطبق مفاهيم بسيطة", "أحل مسائل متنوعة", "أخرى"],
            target:["تحليل تشتت القياسات الطبية", "تفسير النتائج", "ربطها بجودة البيانات", "أخرى"],
            commitment:["5 مسائل", "تحليل أمثلة", "اختبار", "أخرى"]
        },
        "التطبيقات الهندسية": {
            current:["أعرف بعض الأمثلة", "أطبق مفاهيم بسيطة", "أحل مسائل متنوعة", "أخرى"],
            target:["تحليل التشتت في القياسات", "تفسير الدقة", "حل تطبيقات هندسية", "أخرى"],
            commitment:["5 مسائل", "تحليل بيانات", "اختبار", "أخرى"]
        },
        "التطبيقات الحاسوبية": {
            current:["أعرف بعض الأمثلة", "أطبق مفاهيم بسيطة", "أحل مسائل متنوعة", "أخرى"],
            target:["تحليل البيانات الحاسوبية", "ربط التشتت بعلوم البيانات", "حل التطبيقات", "أخرى"],
            commitment:["5 مسائل", "تحليل بيانات", "اختبار", "أخرى"]
        },
        "التطبيقات في الذكاء الاصطناعي": {
            current:["لا أعرف العلاقة", "أفهم بعض الأمثلة", "أربط التشتت بالنماذج", "أخرى"],
            target:["ربط التشتت بجودة البيانات", "فهم أثر التشتت على النماذج", "الاستعداد لعلوم البيانات والذكاء الاصطناعي", "أخرى"],
            commitment:["تحليل أمثلة", "حل مسائل", "اختبار", "أخرى"]
        },
        "حل الأمثلة": {
            current:["أحتاج مساعدة", "أحل أمثلة بسيطة", "أحل أمثلة متنوعة", "أخرى"],
            target:["فهم خطوات الحل", "زيادة الثقة", "الاستعداد للمسائل", "أخرى"],
            commitment:["5 أمثلة", "10 أمثلة", "تحليل الأخطاء", "أخرى"]
        },
        "حل المسائل": {
            current:["أواجه صعوبة", "أحل مسائل بسيطة", "أحل مسائل متنوعة", "أخرى"],
            target:["تحليل المسألة", "اختيار مقياس التشتت المناسب", "حل تطبيقات متنوعة", "أخرى"],
            commitment:["5 مسائل", "10 مسائل", "تحليل الأخطاء", "اختبار", "أخرى"]
        },
        "المراجعة الشاملة": {
            current:["أحتاج مراجعة", "أراجع بعض الأجزاء", "أراجع المنهج كاملاً", "أخرى"],
            target:["إتقان مقاييس التشتت", "الاستعداد للجزء الخامس", "تحقيق فهم قوي", "أخرى"],
            commitment:["مراجعة يومية", "مراجعة أسبوعية", "اختبار شامل", "تحليل نقاط الضعف", "أخرى"]
        },
        "اختبار قصير": {
            current:["أحتاج مراجعة", "أحل اختبارات قصيرة", "أحل اختبارات كاملة", "أخرى"],
            target:["تحسين الدرجة", "إتقان الجزء الرابع", "الاستعداد للجزء الخامس", "أخرى"],
            commitment:["اختبار أسبوعي", "اختبار تجريبي", "تحليل الأخطاء", "أخرى"]
        },
        "اختبار تجريبي": {
            current:["أحتاج مراجعة", "أحل اختبارات قصيرة", "أحل اختبارات كاملة", "أخرى"],
            target:["تحسين الدرجة", "إتقان الجزء الرابع", "الاستعداد للجزء الخامس", "أخرى"],
            commitment:["اختبار أسبوعي", "اختبار تجريبي", "تحليل الأخطاء", "أخرى"]
        },
        "الاستعداد للجزء الخامس": {
            current:["أحتاج مراجعة", "أعرف الأساسيات", "أشعر بالاستعداد", "أخرى"],
            target:["إتقان مقاييس التشتت", "الاستعداد للتطبيقات الإحصائية المتقدمة", "أخرى"],
            commitment:["مراجعة يومية", "حل مسائل", "اختبار أسبوعي", "أخرى"]
        },
        "أخرى": {
            current:["أحتاج تحديد الموضوع", "بدأت التعلم", "أحل تدريبات", "أحتاج خطة واضحة", "أخرى"],
            target:["بناء أساس قوي في الإحصاء", "إتقان المسار المختار", "الاستعداد للجزء الخامس", "أخرى"],
            commitment:["تدريب يومي", "مراجعة أسبوعية", "اختبار ذاتي", "برنامج مخصص", "أخرى"]
        }
    };

    Object.entries(part4States).forEach(([path, value]) => {
        math.states[`الإحصاء::${path}`] = {
            current: mergeUnique(value.current, ["أخرى"]),
            target: mergeUnique(value.target, ["أخرى"]),
            commitment: mergeUnique(value.commitment, ["أخرى"])
        };
    });
})();


/* EduPath AI v5.5.48 — Goals Math Statistics Part 5 Database
   Smart Merge فقط لقسم: الرياضيات -> الإحصاء -> العلاقات والتحليل والمراجعة النهائية
   لا يغير التصميم ولا يحذف البيانات السابقة. */
(function applyMathStatisticsPart5V5548(){
    if (typeof GOAL_CONFIG_V524 === "undefined" || !GOAL_CONFIG_V524["الرياضيات"]) return;
    const math = GOAL_CONFIG_V524["الرياضيات"];
    math.categories = math.categories || [];
    if (!math.categories.includes("الإحصاء")) math.categories.push("الإحصاء");
    math.paths = math.paths || {};
    math.states = math.states || {};

    const mergeUnique = (base, additions) => {
        const out = Array.isArray(base) ? base.slice() : [];
        additions.forEach(item => {
            if (item && !out.includes(item)) out.push(item);
        });
        if (!out.includes("أخرى")) out.push("أخرى");
        return out;
    };

    const statisticsPart5Paths = [
        "مراجعة الجزء الرابع",
        "العلاقات الإحصائية",
        "الارتباط",
        "أنواع الارتباط",
        "الارتباط الموجب",
        "الارتباط السالب",
        "الارتباط الصفري",
        "قوة الارتباط",
        "تفسير الارتباط",
        "الانحدار",
        "الانحدار الخطي",
        "تقدير القيم",
        "التنبؤ",
        "تحليل العلاقات",
        "السلاسل الزمنية الأساسية",
        "قراءة البيانات الزمنية",
        "تحليل الاتجاه العام",
        "التغيرات الموسمية",
        "تفسير البيانات",
        "تحليل البيانات",
        "المقارنة بين البيانات",
        "اكتشاف الأنماط",
        "اتخاذ القرار",
        "الإحصاء في البحث العلمي",
        "الإحصاء في الطب",
        "الإحصاء في الاقتصاد",
        "الإحصاء في الهندسة",
        "الإحصاء في علوم الحاسوب",
        "الإحصاء في الذكاء الاصطناعي",
        "الإحصاء في علم البيانات",
        "تحليل مجموعات البيانات",
        "حل المشكلات الواقعية",
        "دراسة الحالات",
        "تحليل الدراسات",
        "قراءة التقارير الإحصائية",
        "تفسير الرسوم والجداول",
        "التطبيقات الواقعية",
        "المراجعة الشاملة لبنك الإحصاء",
        "حل اختبارات شاملة",
        "اختبار تجريبي",
        "محاكاة اختبار نهائي",
        "الاستعداد لبنك الاحتمالات",
        "أخرى"
    ];

    math.paths["الإحصاء"] = mergeUnique(math.paths["الإحصاء"], statisticsPart5Paths);

    math.relationshipTypesByPath = math.relationshipTypesByPath || {};
    math.analysisTypesByPath = math.analysisTypesByPath || {};
    const relationshipTypes = ["ارتباط", "انحدار", "سلاسل زمنية", "تحليل بيانات", "مقارنة بيانات", "تطبيقات عملية", "أخرى"];
    const analysisTypes = ["تحليل وصفي", "تحليل العلاقات", "تحليل الاتجاهات", "تفسير النتائج", "اتخاذ القرار", "حل التطبيقات", "أخرى"];
    statisticsPart5Paths.forEach(path => {
        if (path !== "أخرى") {
            math.relationshipTypesByPath[`الإحصاء::${path}`] = mergeUnique(math.relationshipTypesByPath[`الإحصاء::${path}`], relationshipTypes);
            math.analysisTypesByPath[`الإحصاء::${path}`] = mergeUnique(math.analysisTypesByPath[`الإحصاء::${path}`], analysisTypes);
        }
    });

    const part5States = {
        "مراجعة الجزء الرابع": {
            current:["أحتاج مراجعة", "أعرف مقاييس التشتت", "أحل مسائل متنوعة", "أخرى"],
            target:["إتقان الجزء الرابع", "الاستعداد للعلاقات الإحصائية", "تقوية التحليل", "أخرى"],
            commitment:["مراجعة يومية", "حل مسائل", "اختبار أسبوعي", "أخرى"]
        },
        "العلاقات الإحصائية": {
            current:["لا أعرفها", "أفهم الفكرة العامة", "أفسر علاقات بسيطة", "أخرى"],
            target:["فهم العلاقات الإحصائية", "تحليل العلاقات", "الاستعداد للارتباط والانحدار", "أخرى"],
            commitment:["10 تدريبات", "20 تدريباً", "اختبار", "أخرى"]
        },
        "الارتباط": {
            current:["لا أعرفه", "أفهم المفهوم", "أفسر العلاقات", "أخرى"],
            target:["إتقان الارتباط", "تحليل العلاقات", "حل التطبيقات", "أخرى"],
            commitment:["10 تدريبات", "20 تدريباً", "اختبار", "أخرى"]
        },
        "أنواع الارتباط": {
            current:["لا أميز الأنواع", "أعرف بعضها", "أفسر الأنواع بدقة", "أخرى"],
            target:["تمييز أنواع الارتباط", "تفسير العلاقات", "تقليل أخطاء التحليل", "أخرى"],
            commitment:["10 تدريبات", "تحليل أمثلة", "اختبار", "أخرى"]
        },
        "الارتباط الموجب": {
            current:["لا أعرفه", "أفهم الفكرة", "أفسر أمثلة", "أخرى"],
            target:["إتقان الارتباط الموجب", "تفسير النتائج", "حل التطبيقات", "أخرى"],
            commitment:["حل تدريبات", "تحليل أمثلة", "اختبار", "أخرى"]
        },
        "الارتباط السالب": {
            current:["لا أعرفه", "أفهم الفكرة", "أفسر أمثلة", "أخرى"],
            target:["إتقان الارتباط السالب", "تفسير النتائج", "حل التطبيقات", "أخرى"],
            commitment:["حل تدريبات", "تحليل أمثلة", "اختبار", "أخرى"]
        },
        "الارتباط الصفري": {
            current:["لا أعرفه", "أفهم الفكرة", "أميز غياب العلاقة", "أخرى"],
            target:["إتقان الارتباط الصفري", "تجنب الاستنتاجات الخاطئة", "تحليل النتائج بدقة", "أخرى"],
            commitment:["حل تدريبات", "تحليل أمثلة", "اختبار", "أخرى"]
        },
        "قوة الارتباط": {
            current:["لا أعرف تفسير القوة", "أقارن العلاقات أحياناً", "أفسر قوة العلاقة", "أخرى"],
            target:["إتقان تفسير قوة الارتباط", "مقارنة العلاقات", "دعم القرار بالبيانات", "أخرى"],
            commitment:["تحليل أمثلة", "حل مسائل", "اختبار", "أخرى"]
        },
        "تفسير الارتباط": {
            current:["أحسب فقط", "أفسر أحياناً", "أربط النتائج بالسياق", "أخرى"],
            target:["تفسير احترافي", "استخراج الاستنتاجات", "تمييز العلاقة عن السببية", "أخرى"],
            commitment:["تحليل مسائل", "قراءة تقارير", "اختبار", "أخرى"]
        },
        "الانحدار": {
            current:["لا أعرفه", "أفهم الفكرة", "أستخدمه للتنبؤ", "أخرى"],
            target:["إتقان الانحدار", "تحليل البيانات", "التنبؤ", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "أخرى"]
        },
        "الانحدار الخطي": {
            current:["لا أعرفه", "أفهم خط الانحدار", "أطبق أمثلة بسيطة", "أخرى"],
            target:["إتقان الانحدار الخطي", "تقدير القيم", "حل التطبيقات", "أخرى"],
            commitment:["10 تدريبات", "حل أمثلة", "اختبار", "أخرى"]
        },
        "تقدير القيم": {
            current:["أواجه صعوبة", "أقدر قيماً بسيطة", "أستخدم نموذجاً للتقدير", "أخرى"],
            target:["إتقان التقدير", "تقليل الأخطاء", "استخدام النتائج في القرار", "أخرى"],
            commitment:["حل تدريبات", "تحليل أمثلة", "اختبار", "أخرى"]
        },
        "التنبؤ": {
            current:["لا أعرفه", "أفهم فكرته", "أطبق تنبؤات بسيطة", "أخرى"],
            target:["إتقان التنبؤ", "تحليل النتائج", "ربطه بالتطبيقات الحديثة", "أخرى"],
            commitment:["10 تدريبات", "تحليل بيانات", "اختبار", "أخرى"]
        },
        "تحليل العلاقات": {
            current:["أواجه صعوبة", "أحلل علاقات بسيطة", "أحلل علاقات متنوعة", "أخرى"],
            target:["تحليل العلاقات باحتراف", "تفسير النتائج", "اتخاذ قرارات مبنية على البيانات", "أخرى"],
            commitment:["تحليل أمثلة", "حل مسائل", "اختبار", "أخرى"]
        },
        "السلاسل الزمنية الأساسية": {
            current:["لا أعرفها", "أقرأ البيانات", "أحلل الاتجاهات", "أخرى"],
            target:["إتقان التحليل", "اكتشاف الأنماط", "تحليل البيانات", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "أخرى"]
        },
        "قراءة البيانات الزمنية": {
            current:["أواجه صعوبة", "أقرأ جداول بسيطة", "أقرأ بيانات زمنية متنوعة", "أخرى"],
            target:["إتقان قراءة البيانات الزمنية", "استخراج الأنماط", "الاستعداد للتحليل", "أخرى"],
            commitment:["تحليل أمثلة", "اختبار", "أخرى"]
        },
        "تحليل الاتجاه العام": {
            current:["لا أعرفه", "ألاحظ الاتجاهات أحياناً", "أحلل الاتجاه العام", "أخرى"],
            target:["إتقان تحليل الاتجاه", "تفسير التغيرات", "دعم التنبؤ", "أخرى"],
            commitment:["10 تدريبات", "تحليل رسوم", "اختبار", "أخرى"]
        },
        "التغيرات الموسمية": {
            current:["لا أعرفها", "ألاحظها في أمثلة", "أحللها جزئياً", "أخرى"],
            target:["فهم التغيرات الموسمية", "تحليل الأنماط المتكررة", "ربطها بالتطبيقات الواقعية", "أخرى"],
            commitment:["تحليل أمثلة", "اختبار", "أخرى"]
        },
        "تفسير البيانات": {
            current:["أحسب فقط", "أفسر النتائج", "أحلل البيانات", "أخرى"],
            target:["تحليل احترافي", "استخراج الاستنتاجات", "ربط النتائج بالواقع", "أخرى"],
            commitment:["تحليل مسائل", "اختبار", "أخرى"]
        },
        "تحليل البيانات": {
            current:["أحسب فقط", "أفسر النتائج", "أحلل البيانات", "أخرى"],
            target:["تحليل احترافي", "استخراج الاستنتاجات", "اتخاذ القرارات", "أخرى"],
            commitment:["تحليل مسائل", "اختبار", "أخرى"]
        },
        "المقارنة بين البيانات": {
            current:["أواجه صعوبة", "أقارن بيانات بسيطة", "أقارن بيانات متنوعة", "أخرى"],
            target:["إتقان المقارنة", "تفسير الفروق", "اختيار الاستنتاج المناسب", "أخرى"],
            commitment:["تحليل أمثلة", "حل مسائل", "اختبار", "أخرى"]
        },
        "اكتشاف الأنماط": {
            current:["لا ألاحظ الأنماط", "أكتشف أنماطاً بسيطة", "أحلل أنماطاً متنوعة", "أخرى"],
            target:["اكتشاف الأنماط بوضوح", "ربط الأنماط بالسبب المحتمل", "تحسين جودة التحليل", "أخرى"],
            commitment:["تحليل بيانات", "اختبار", "أخرى"]
        },
        "اتخاذ القرار": {
            current:["لا أربط البيانات بالقرار", "أستنتج أحياناً", "أتخذ قرارات مبنية على التحليل", "أخرى"],
            target:["اتخاذ قرارات مبنية على البيانات", "تقليل التحيز", "تفسير القرار بوضوح", "أخرى"],
            commitment:["تحليل حالات", "قراءة تقارير", "اختبار", "أخرى"]
        },
        "الإحصاء في البحث العلمي": {
            current:["لا أعرف التطبيقات", "أفهم بعضها", "أحلل نتائج بحثية", "أخرى"],
            target:["ربط الإحصاء بالبحث", "تحليل الدراسات", "تقييم النتائج", "أخرى"],
            commitment:["قراءة دراسة", "تحليل تقرير", "اختبار", "أخرى"]
        },
        "الإحصاء في الطب": {
            current:["لا أعرف التطبيقات", "أفهم أمثلة بسيطة", "أحلل بيانات طبية", "أخرى"],
            target:["فهم التطبيقات الطبية", "تحليل النتائج الصحية", "تقييم الدراسات", "أخرى"],
            commitment:["قراءة تطبيقات", "تحليل أمثلة", "اختبار", "أخرى"]
        },
        "الإحصاء في الاقتصاد": {
            current:["لا أعرف التطبيقات", "أفهم أمثلة اقتصادية", "أحلل مؤشرات بسيطة", "أخرى"],
            target:["تحليل البيانات الاقتصادية", "تفسير المؤشرات", "دعم القرار", "أخرى"],
            commitment:["تحليل أمثلة", "قراءة تقرير", "اختبار", "أخرى"]
        },
        "الإحصاء في الهندسة": {
            current:["لا أعرف التطبيقات", "أفهم أمثلة هندسية", "أحلل قياسات بسيطة", "أخرى"],
            target:["تحليل القياسات الهندسية", "فهم الجودة والدقة", "حل التطبيقات", "أخرى"],
            commitment:["تحليل أمثلة", "اختبار", "أخرى"]
        },
        "الإحصاء في علوم الحاسوب": {
            current:["لا أعرف التطبيقات", "أعرف بعضها", "أفهم استخدامها", "أخرى"],
            target:["ربط الإحصاء بالتقنية", "تحليل البيانات", "فهم تطبيقات علوم الحاسوب", "أخرى"],
            commitment:["قراءة تطبيقات", "حل أمثلة", "اختبار", "أخرى"]
        },
        "الإحصاء في الذكاء الاصطناعي": {
            current:["لا أعرف التطبيقات", "أعرف بعضها", "أفهم استخدامها", "أخرى"],
            target:["ربط الإحصاء بالتقنية", "تحليل البيانات", "فهم تطبيقات الذكاء الاصطناعي", "أخرى"],
            commitment:["قراءة تطبيقات", "حل أمثلة", "اختبار", "أخرى"]
        },
        "الإحصاء في علم البيانات": {
            current:["لا أعرف التطبيقات", "أفهم بعضها", "أحلل بيانات بسيطة", "أخرى"],
            target:["ربط الإحصاء بعلم البيانات", "تحليل مجموعات البيانات", "الاستعداد للتعلم المتقدم", "أخرى"],
            commitment:["تحليل بيانات", "قراءة تطبيقات", "اختبار", "أخرى"]
        },
        "الإحصاء في علوم الحاسوب والذكاء الاصطناعي": {
            current:["لا أعرف التطبيقات", "أعرف بعضها", "أفهم استخدامها", "أخرى"],
            target:["ربط الإحصاء بالتقنية", "تحليل البيانات", "فهم تطبيقات الذكاء الاصطناعي", "أخرى"],
            commitment:["قراءة تطبيقات", "حل أمثلة", "اختبار", "أخرى"]
        },
        "تحليل مجموعات البيانات": {
            current:["أواجه صعوبة", "أحلل بيانات بسيطة", "أحلل مجموعات متنوعة", "أخرى"],
            target:["تحليل مجموعات البيانات", "استخراج الأنماط", "تفسير النتائج", "أخرى"],
            commitment:["تحليل بيانات", "اختبار", "أخرى"]
        },
        "حل المشكلات الواقعية": {
            current:["أواجه صعوبة", "أفهم المشكلة", "أستخدم البيانات للحل", "أخرى"],
            target:["تحليل المشكلات الواقعية", "استخدام الإحصاء في الحل", "اتخاذ قرار مناسب", "أخرى"],
            commitment:["5 مسائل", "10 مسائل", "تحليل حالات", "أخرى"]
        },
        "دراسة الحالات": {
            current:["لا أعرف كيف أبدأ", "أحلل حالة بسيطة", "أحلل حالات متنوعة", "أخرى"],
            target:["إتقان دراسة الحالات", "تفسير النتائج", "استخراج قرارات", "أخرى"],
            commitment:["تحليل حالة", "قراءة تقرير", "اختبار", "أخرى"]
        },
        "تحليل الدراسات": {
            current:["أجد صعوبة", "أفهم بعض الدراسات", "أحلل الدراسات", "أخرى"],
            target:["تحليل احترافي", "تقييم النتائج", "استخراج المعلومات", "أخرى"],
            commitment:["تحليل تقارير", "قراءة دراسة", "اختبار", "أخرى"]
        },
        "قراءة التقارير الإحصائية": {
            current:["أجد صعوبة", "أفهم بعض التقارير", "أحلل الدراسات", "أخرى"],
            target:["تحليل احترافي", "تقييم النتائج", "استخراج المعلومات", "أخرى"],
            commitment:["تحليل تقارير", "اختبار", "أخرى"]
        },
        "تفسير الرسوم والجداول": {
            current:["أقرأ فقط", "أفسر بعض الرسوم", "أحلل الرسوم والجداول", "أخرى"],
            target:["تفسير الرسوم والجداول", "استخراج الاستنتاجات", "ربطها بالسياق", "أخرى"],
            commitment:["تحليل أمثلة", "اختبار", "أخرى"]
        },
        "التطبيقات الواقعية": {
            current:["أواجه صعوبة", "أفهم بعض التطبيقات", "أطبق بعض المفاهيم", "أخرى"],
            target:["ربط الإحصاء بالحياة", "تحليل البيانات الواقعية", "حل التطبيقات", "أخرى"],
            commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]
        },
        "المراجعة الشاملة لبنك الإحصاء": {
            current:["أحتاج مراجعة", "أراجع بعض الأجزاء", "أراجع البنك كاملاً", "أخرى"],
            target:["إتقان الإحصاء", "تحقيق درجة عالية", "الاستعداد لبنك الاحتمالات", "أخرى"],
            commitment:["30 دقيقة", "ساعة يومياً", "اختبار أسبوعي", "أخرى"]
        },
        "المراجعة الشاملة": {
            current:["أحتاج مراجعة", "أراجع بعض الأجزاء", "أراجع البنك كاملاً", "أخرى"],
            target:["إتقان الإحصاء", "تحقيق درجة عالية", "الاستعداد لبنك الاحتمالات", "أخرى"],
            commitment:["30 دقيقة", "ساعة يومياً", "اختبار أسبوعي", "أخرى"]
        },
        "حل اختبارات شاملة": {
            current:["أحل اختبارات قصيرة", "أحل اختبارات متوسطة", "أحل اختبارات كاملة", "أخرى"],
            target:["تحسين الدرجة", "إتقان البنك", "الاستعداد للموضوعات القادمة", "أخرى"],
            commitment:["اختبار أسبوعي", "اختبار تجريبي", "محاكاة اختبار نهائي", "تحليل الأخطاء", "أخرى"]
        },
        "اختبار تجريبي": {
            current:["أحل اختبارات قصيرة", "أحل اختبارات متوسطة", "أحل اختبارات كاملة", "أخرى"],
            target:["تحسين الدرجة", "إتقان البنك", "الاستعداد للموضوعات القادمة", "أخرى"],
            commitment:["اختبار أسبوعي", "اختبار تجريبي", "محاكاة اختبار نهائي", "تحليل الأخطاء", "أخرى"]
        },
        "محاكاة اختبار نهائي": {
            current:["أحتاج مراجعة", "أحل اختبارات متوسطة", "أحل اختباراً كاملاً", "أخرى"],
            target:["محاكاة الاختبار بثقة", "تحسين إدارة الوقت", "تقليل الأخطاء", "أخرى"],
            commitment:["اختبار زمني", "تحليل الأخطاء", "مراجعة أسبوعية", "أخرى"]
        },
        "الاختبارات الشاملة": {
            current:["أحل اختبارات قصيرة", "أحل اختبارات متوسطة", "أحل اختبارات كاملة", "أخرى"],
            target:["تحسين الدرجة", "إتقان البنك", "الاستعداد للموضوعات القادمة", "أخرى"],
            commitment:["اختبار أسبوعي", "اختبار تجريبي", "محاكاة اختبار نهائي", "تحليل الأخطاء", "أخرى"]
        },
        "الاستعداد لبنك الاحتمالات": {
            current:["أحتاج مراجعة", "أعرف الأساسيات", "أشعر بالاستعداد", "أخرى"],
            target:["إتقان بنك الإحصاء", "الاستعداد للاحتمالات", "ربط الإحصاء بالاحتمالات", "أخرى"],
            commitment:["مراجعة يومية", "حل مسائل", "اختبار أسبوعي", "أخرى"]
        },
        "أخرى": {
            current:["أحتاج تحديد الموضوع", "بدأت التعلم", "أحل تدريبات", "أحتاج خطة واضحة", "أخرى"],
            target:["إتقان الإحصاء", "الاستعداد للاحتمالات", "إتقان المسار المختار", "أخرى"],
            commitment:["تدريب يومي", "مراجعة أسبوعية", "اختبار ذاتي", "برنامج مخصص", "أخرى"]
        }
    };

    Object.entries(part5States).forEach(([path, value]) => {
        math.states[`الإحصاء::${path}`] = {
            current: mergeUnique(value.current, ["أخرى"]),
            target: mergeUnique(value.target, ["أخرى"]),
            commitment: mergeUnique(value.commitment, ["أخرى"])
        };
    });
})();


/* EduPath AI v5.5.49 — Goals Math Probability Part 1 Database
   Smart Merge فقط لقسم: الرياضيات -> الاحتمالات -> أساسيات الاحتمالات
   لا يغير التصميم ولا يحذف البيانات السابقة. */
(function applyMathProbabilityPart1V5549(){
    if (typeof GOAL_CONFIG_V524 === "undefined" || !GOAL_CONFIG_V524["الرياضيات"]) return;
    const math = GOAL_CONFIG_V524["الرياضيات"];
    math.categories = math.categories || [];
    if (!math.categories.includes("الاحتمالات")) math.categories.push("الاحتمالات");
    math.paths = math.paths || {};
    math.states = math.states || {};

    const mergeUnique = (base, additions) => {
        const out = Array.isArray(base) ? base.slice() : [];
        additions.forEach(item => {
            if (item && !out.includes(item)) out.push(item);
        });
        if (!out.includes("أخرى")) out.push("أخرى");
        return out;
    };

    const probabilityPart1Paths = [
        "مراجعة بنك الإحصاء",
        "مقدمة في الاحتمالات",
        "تعريف الاحتمالات",
        "أهمية الاحتمالات",
        "تطبيقات الاحتمالات",
        "الاحتمالات في الحياة اليومية",
        "الاحتمالات في الألعاب",
        "الاحتمالات في الاقتصاد",
        "الاحتمالات في الطب",
        "الاحتمالات في الهندسة",
        "الاحتمالات في علوم الحاسوب",
        "الاحتمالات في الذكاء الاصطناعي",
        "الاحتمالات في علم البيانات",
        "التجربة العشوائية",
        "النتائج الممكنة",
        "فضاء العينة",
        "تمثيل فضاء العينة",
        "الأحداث",
        "الحدث البسيط",
        "الحدث المركب",
        "الحدث المؤكد",
        "الحدث المستحيل",
        "أنواع الأحداث",
        "الأحداث المتنافية",
        "الأحداث غير المتنافية",
        "الأحداث المستقلة",
        "الأحداث غير المستقلة",
        "تمثيل الأحداث",
        "الجداول",
        "المخططات",
        "المخططات الشجرية الأساسية",
        "المجموعات",
        "الاحتمال الأساسي",
        "تعريف الاحتمال",
        "خصائص الاحتمال",
        "حساب الاحتمال",
        "تفسير الاحتمال",
        "الاحتمال التجريبي",
        "الاحتمال النظري",
        "مقارنة الاحتمالات",
        "تحليل النتائج",
        "التطبيقات الواقعية",
        "حل الأمثلة",
        "حل المسائل",
        "المراجعة الشاملة",
        "اختبار قصير",
        "اختبار تجريبي",
        "الاستعداد للجزء الثاني",
        "أخرى"
    ];

    math.paths["الاحتمالات"] = mergeUnique(math.paths["الاحتمالات"], probabilityPart1Paths);

    math.experimentTypesByPath = math.experimentTypesByPath || {};
    math.eventTypesByPath = math.eventTypesByPath || {};
    const experimentTypes = ["رمي قطعة نقد", "رمي نرد", "سحب بطاقات", "اختيار عناصر", "تجارب حياتية", "تجارب مختلطة", "أخرى"];
    const eventTypes = ["بسيط", "مركب", "مؤكد", "مستحيل", "متناف", "غير متناف", "مستقل", "غير مستقل", "أخرى"];
    probabilityPart1Paths.forEach(path => {
        if (path !== "أخرى") {
            math.experimentTypesByPath[`الاحتمالات::${path}`] = mergeUnique(math.experimentTypesByPath[`الاحتمالات::${path}`], experimentTypes);
            math.eventTypesByPath[`الاحتمالات::${path}`] = mergeUnique(math.eventTypesByPath[`الاحتمالات::${path}`], eventTypes);
        }
    });

    const part1States = {
        "مراجعة بنك الإحصاء": {
            current:["أحتاج مراجعة", "أعرف أساسيات الإحصاء", "أربط الإحصاء بالاحتمالات", "أخرى"],
            target:["استرجاع بنك الإحصاء", "فهم العلاقة بالاحتمالات", "الاستعداد لبنك الاحتمالات", "أخرى"],
            commitment:["مراجعة يومية", "حل مسائل", "اختبار أسبوعي", "أخرى"]
        },
        "مقدمة في الاحتمالات": {
            current:["لا أعرفها", "أعرف المفاهيم الأساسية", "أفهم الفكرة", "أخرى"],
            target:["إتقان الأساسيات", "فهم التطبيقات", "الاستعداد للجزء الثاني", "أخرى"],
            commitment:["15 دقيقة", "30 دقيقة", "حل أمثلة", "اختبار", "أخرى"]
        },
        "تعريف الاحتمالات": {
            current:["لا أعرف التعريف", "أعرف الفكرة العامة", "أفهم معنى الاحتمال", "أخرى"],
            target:["فهم تعريف الاحتمال", "تفسير معنى الاحتمال", "استخدامه في المسائل", "أخرى"],
            commitment:["15 دقيقة", "30 دقيقة", "حل أمثلة", "اختبار", "أخرى"]
        },
        "أهمية الاحتمالات": {
            current:["لا أعرف أهميتها", "أعرف بعض الاستخدامات", "أفهم دورها في التحليل", "أخرى"],
            target:["فهم أهمية الاحتمالات", "ربطها بالحياة اليومية", "ربطها بالعلوم الحديثة", "أخرى"],
            commitment:["15 دقيقة", "تلخيص أمثلة", "حل تطبيقات", "اختبار", "أخرى"]
        },
        "تطبيقات الاحتمالات": {
            current:["أعرف بعض التطبيقات", "أطبق بعض المفاهيم", "أحل مسائل متنوعة", "أخرى"],
            target:["ربط الاحتمالات بالتطبيقات", "تحليل المواقف", "فهم دورها في التخصصات الحديثة", "أخرى"],
            commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]
        },
        "الاحتمالات في الحياة اليومية": {
            current:["لا أربطها بالحياة", "أفهم أمثلة بسيطة", "أحل مواقف حياتية", "أخرى"],
            target:["ربط الاحتمالات بالحياة", "تحليل المواقف اليومية", "حل تطبيقات واقعية", "أخرى"],
            commitment:["تحليل أمثلة", "5 مسائل", "اختبار", "أخرى"]
        },
        "الاحتمالات في الألعاب": {
            current:["لا أعرف التطبيقات", "أفهم أمثلة بسيطة", "أحسب احتمالات ألعاب بسيطة", "أخرى"],
            target:["فهم احتمالات الألعاب", "تحليل النتائج الممكنة", "حل مسائل متنوعة", "أخرى"],
            commitment:["حل أمثلة", "10 تدريبات", "اختبار", "أخرى"]
        },
        "الاحتمالات في الاقتصاد": {
            current:["لا أعرف التطبيقات", "أفهم أمثلة اقتصادية", "أحل مسائل بسيطة", "أخرى"],
            target:["ربط الاحتمالات بالاقتصاد", "تحليل المخاطر", "تفسير النتائج", "أخرى"],
            commitment:["قراءة تطبيقات", "حل أمثلة", "اختبار", "أخرى"]
        },
        "الاحتمالات في الطب": {
            current:["لا أعرف التطبيقات", "أفهم أمثلة طبية", "أحل مسائل بسيطة", "أخرى"],
            target:["ربط الاحتمالات بالطب", "فهم المخاطر والنتائج", "تحليل تطبيقات صحية", "أخرى"],
            commitment:["قراءة تطبيقات", "حل أمثلة", "اختبار", "أخرى"]
        },
        "الاحتمالات في الهندسة": {
            current:["لا أعرف التطبيقات", "أفهم أمثلة هندسية", "أحل مسائل بسيطة", "أخرى"],
            target:["ربط الاحتمالات بالهندسة", "تحليل الموثوقية والمخاطر", "حل تطبيقات هندسية", "أخرى"],
            commitment:["قراءة تطبيقات", "حل أمثلة", "اختبار", "أخرى"]
        },
        "الاحتمالات في علوم الحاسوب": {
            current:["لا أعرف التطبيقات", "أعرف بعضها", "أفهم استخدامها", "أخرى"],
            target:["ربط الاحتمالات بعلوم الحاسوب", "تحليل الخوارزميات العشوائية", "فهم تطبيقات البيانات", "أخرى"],
            commitment:["قراءة تطبيقات", "حل أمثلة", "اختبار", "أخرى"]
        },
        "الاحتمالات في الذكاء الاصطناعي": {
            current:["لا أعرف التطبيقات", "أعرف بعضها", "أفهم استخدامها", "أخرى"],
            target:["ربط الاحتمالات بالذكاء الاصطناعي", "فهم النماذج الاحتمالية", "تحليل البيانات", "أخرى"],
            commitment:["قراءة تطبيقات", "حل أمثلة", "اختبار", "أخرى"]
        },
        "الاحتمالات في علم البيانات": {
            current:["لا أعرف التطبيقات", "أفهم بعضها", "أحلل أمثلة بسيطة", "أخرى"],
            target:["ربط الاحتمالات بعلم البيانات", "تحليل عدم اليقين", "الاستعداد للنمذجة", "أخرى"],
            commitment:["تحليل بيانات", "حل أمثلة", "اختبار", "أخرى"]
        },
        "التجربة العشوائية": {
            current:["لا أعرفها", "أحدد نتائج بسيطة", "أحلل تجارب متنوعة", "أخرى"],
            target:["إتقان التجربة العشوائية", "تحليل النتائج الممكنة", "حل التطبيقات", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "أخرى"]
        },
        "النتائج الممكنة": {
            current:["لا أحدد النتائج", "أحدد بعض النتائج", "أحدد النتائج بدقة", "أخرى"],
            target:["إتقان تحديد النتائج", "تقليل الأخطاء", "تحليل التجارب", "أخرى"],
            commitment:["10 تدريبات", "حل أمثلة", "اختبار", "أخرى"]
        },
        "فضاء العينة": {
            current:["لا أعرفه", "أحدد فضاء عينة بسيط", "أمثل فضاء العينة", "أخرى"],
            target:["إتقان فضاء العينة", "تمثيل النتائج", "حل التطبيقات", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "أخرى"]
        },
        "تمثيل فضاء العينة": {
            current:["لا أعرف الطرق", "أستخدم الجداول", "أستخدم المخططات", "أخرى"],
            target:["إتقان التمثيل", "اختيار طريقة مناسبة", "تحليل التجارب", "أخرى"],
            commitment:["حل تدريبات", "اختبار", "أخرى"]
        },
        "الأحداث": {
            current:["لا أعرف الأحداث", "أميز أحداثاً بسيطة", "أحلل أحداثاً متنوعة", "أخرى"],
            target:["فهم الأحداث", "تصنيف الأحداث", "حل التطبيقات", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "أخرى"]
        },
        "الحدث البسيط": {
            current:["لا أعرفه", "أميز أمثلة بسيطة", "أحسب احتماله", "أخرى"],
            target:["إتقان الحدث البسيط", "تحليل الأمثلة", "حل المسائل", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "أخرى"]
        },
        "الحدث المركب": {
            current:["لا أعرفه", "أميز بعض الأمثلة", "أحسب احتماله", "أخرى"],
            target:["إتقان الحدث المركب", "تحليل الأحداث", "حل مسائل متنوعة", "أخرى"],
            commitment:["10 تدريبات", "20 تدريباً", "اختبار", "أخرى"]
        },
        "الحدث المؤكد": {
            current:["لا أعرفه", "أفهم أمثلة بسيطة", "أميزه في المسائل", "أخرى"],
            target:["فهم الحدث المؤكد", "تمييزه بسرعة", "تفسير احتماله", "أخرى"],
            commitment:["حل أمثلة", "اختبار", "أخرى"]
        },
        "الحدث المستحيل": {
            current:["لا أعرفه", "أفهم أمثلة بسيطة", "أميزه في المسائل", "أخرى"],
            target:["فهم الحدث المستحيل", "تمييزه بسرعة", "تفسير احتماله", "أخرى"],
            commitment:["حل أمثلة", "اختبار", "أخرى"]
        },
        "أنواع الأحداث": {
            current:["لا أعرف الأنواع", "أميز بعضها", "أميز جميع الأنواع", "أخرى"],
            target:["إتقان التصنيف", "تحليل الأحداث", "حل التطبيقات", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "أخرى"]
        },
        "الأحداث المتنافية": {
            current:["لا أعرفها", "أميز أمثلة بسيطة", "أحل مسائل عليها", "أخرى"],
            target:["إتقان الأحداث المتنافية", "تفسير العلاقات", "حل التطبيقات", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "أخرى"]
        },
        "الأحداث غير المتنافية": {
            current:["لا أعرفها", "أميز أمثلة بسيطة", "أحل مسائل عليها", "أخرى"],
            target:["إتقان الأحداث غير المتنافية", "تفسير التداخل", "حل التطبيقات", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "أخرى"]
        },
        "الأحداث المستقلة": {
            current:["لا أعرفها", "أميز أمثلة بسيطة", "أحل مسائل عليها", "أخرى"],
            target:["إتقان الأحداث المستقلة", "تحليل العلاقة بين الأحداث", "حل التطبيقات", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "أخرى"]
        },
        "الأحداث غير المستقلة": {
            current:["لا أعرفها", "أميز أمثلة بسيطة", "أحل مسائل عليها", "أخرى"],
            target:["إتقان الأحداث غير المستقلة", "تحليل تأثير الأحداث", "حل التطبيقات", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "أخرى"]
        },
        "تمثيل الأحداث": {
            current:["لا أعرف الطرق", "أستخدم بعضها", "أستخدم جميع الطرق", "أخرى"],
            target:["إتقان التمثيل", "تحليل البيانات", "حل التطبيقات", "أخرى"],
            commitment:["حل تدريبات", "اختبار", "أخرى"]
        },
        "الجداول": {
            current:["لا أستخدم الجداول", "أقرأ جداول بسيطة", "أبني جداول احتمالية", "أخرى"],
            target:["إتقان الجداول", "تنظيم النتائج", "حل المسائل", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "أخرى"]
        },
        "المخططات": {
            current:["لا أستخدم المخططات", "أقرأ مخططات بسيطة", "أحلل مخططات متنوعة", "أخرى"],
            target:["إتقان المخططات", "تمثيل التجارب", "حل التطبيقات", "أخرى"],
            commitment:["حل تدريبات", "اختبار", "أخرى"]
        },
        "المخططات الشجرية الأساسية": {
            current:["لا أعرفها", "أرسم مخططات بسيطة", "أستخدمها في الحل", "أخرى"],
            target:["إتقان المخططات الشجرية", "تحليل التجارب متعددة المراحل", "الاستعداد لقواعد العد", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "أخرى"]
        },
        "المجموعات": {
            current:["لا أربطها بالاحتمالات", "أستخدمها جزئياً", "أمثل الأحداث كمجموعات", "أخرى"],
            target:["استخدام المجموعات في الاحتمالات", "تحليل العلاقات", "حل التطبيقات", "أخرى"],
            commitment:["حل تدريبات", "اختبار", "أخرى"]
        },
        "الاحتمال الأساسي": {
            current:["لا أعرفه", "أحسبه", "أطبق على مسائل متنوعة", "أخرى"],
            target:["إتقان الاحتمال", "تحليل النتائج", "حل التطبيقات", "أخرى"],
            commitment:["10 تدريبات", "20 تدريباً", "اختبار", "أخرى"]
        },
        "تعريف الاحتمال": {
            current:["لا أعرف التعريف", "أفهم الفكرة", "أطبقه في مسائل بسيطة", "أخرى"],
            target:["إتقان تعريف الاحتمال", "تفسير الاحتمال", "حل المسائل", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "أخرى"]
        },
        "خصائص الاحتمال": {
            current:["لا أعرف الخصائص", "أعرف بعضها", "أستخدمها في الحل", "أخرى"],
            target:["إتقان خصائص الاحتمال", "تقليل الأخطاء", "حل التطبيقات", "أخرى"],
            commitment:["10 تدريبات", "مراجعة القوانين", "اختبار", "أخرى"]
        },
        "حساب الاحتمال": {
            current:["لا أحسبه", "أحسب مسائل بسيطة", "أحل مسائل متنوعة", "أخرى"],
            target:["إتقان حساب الاحتمال", "زيادة السرعة", "تحليل النتائج", "أخرى"],
            commitment:["10 تدريبات", "20 تدريباً", "اختبار", "أخرى"]
        },
        "تفسير الاحتمال": {
            current:["أحسب فقط", "أفسر أحياناً", "أربط النتائج بالواقع", "أخرى"],
            target:["تفسير احترافي", "تحليل النتائج", "استخراج استنتاجات", "أخرى"],
            commitment:["تحليل مسائل", "اختبار", "أخرى"]
        },
        "الاحتمال التجريبي": {
            current:["لا أعرفه", "أفهم المفهوم", "أطبق أمثلة", "أخرى"],
            target:["إتقان الاحتمال التجريبي", "تحليل نتائج التجارب", "مقارنته بالنظري", "أخرى"],
            commitment:["10 تدريبات", "تجربة بسيطة", "اختبار", "أخرى"]
        },
        "الاحتمال النظري": {
            current:["لا أعرفه", "أفهم المفهوم", "أطبق أمثلة", "أخرى"],
            target:["إتقان الاحتمال النظري", "حساب الاحتمالات بدقة", "مقارنته بالتجريبي", "أخرى"],
            commitment:["10 تدريبات", "اختبار", "أخرى"]
        },
        "مقارنة الاحتمالات": {
            current:["لا أقارنها", "أقارن أمثلة بسيطة", "أحلل الفروق", "أخرى"],
            target:["إتقان المقارنة", "تفسير الفروق", "حل التطبيقات", "أخرى"],
            commitment:["تحليل أمثلة", "اختبار", "أخرى"]
        },
        "تحليل النتائج": {
            current:["أحسب فقط", "أفسر النتائج", "أحلل النتائج", "أخرى"],
            target:["تحليل احترافي", "ربط النتائج بالواقع", "اتخاذ قرارات", "أخرى"],
            commitment:["تحليل مسائل", "اختبار", "أخرى"]
        },
        "التطبيقات الواقعية": {
            current:["أواجه صعوبة", "أفهم بعض التطبيقات", "أطبق بعض المفاهيم", "أخرى"],
            target:["ربط الاحتمالات بالحياة", "تحليل المواقف", "حل التطبيقات", "أخرى"],
            commitment:["5 مسائل", "10 مسائل", "اختبار", "أخرى"]
        },
        "حل الأمثلة": {
            current:["أحتاج أمثلة بسيطة", "أحل بعض الأمثلة", "أحل أمثلة متنوعة", "أخرى"],
            target:["فهم طريقة الحل", "تقليل الأخطاء", "الاستعداد للمسائل", "أخرى"],
            commitment:["5 أمثلة", "10 أمثلة", "مراجعة الأخطاء", "أخرى"]
        },
        "حل المسائل": {
            current:["أواجه صعوبة", "أحل مسائل بسيطة", "أحل مسائل متنوعة", "أخرى"],
            target:["تحليل المسألة", "اختيار الطريقة", "حل التطبيقات", "أخرى"],
            commitment:["5 مسائل", "10 مسائل", "تحليل الأخطاء", "اختبار", "أخرى"]
        },
        "المراجعة الشاملة": {
            current:["أحتاج مراجعة", "أراجع بعض الأجزاء", "أراجع الجزء كاملاً", "أخرى"],
            target:["إتقان أساسيات الاحتمالات", "تحقيق درجة عالية", "الاستعداد للجزء الثاني", "أخرى"],
            commitment:["30 دقيقة", "ساعة يومياً", "اختبار أسبوعي", "أخرى"]
        },
        "اختبار قصير": {
            current:["أحتاج مراجعة", "أحل اختبارات قصيرة", "أحل اختبارات كاملة", "أخرى"],
            target:["تحسين الدرجة", "إتقان الجزء الأول", "الاستعداد للجزء الثاني", "أخرى"],
            commitment:["اختبار أسبوعي", "اختبار تجريبي", "تحليل الأخطاء", "أخرى"]
        },
        "اختبار تجريبي": {
            current:["أحتاج مراجعة", "أحل اختبارات قصيرة", "أحل اختبارات كاملة", "أخرى"],
            target:["تحسين الدرجة", "إتقان الجزء الأول", "الاستعداد للجزء الثاني", "أخرى"],
            commitment:["اختبار أسبوعي", "اختبار تجريبي", "تحليل الأخطاء", "أخرى"]
        },
        "الاستعداد للجزء الثاني": {
            current:["أحتاج مراجعة", "أعرف الأساسيات", "أشعر بالاستعداد", "أخرى"],
            target:["إتقان أساسيات الاحتمالات", "الاستعداد لقواعد العد والتباديل والتوافيق", "أخرى"],
            commitment:["مراجعة يومية", "حل مسائل", "اختبار أسبوعي", "أخرى"]
        }
    };

    Object.entries(part1States).forEach(([path, state]) => {
        math.states[`الاحتمالات::${path}`] = {
            current: mergeUnique(math.states[`الاحتمالات::${path}`]?.current, state.current),
            target: mergeUnique(math.states[`الاحتمالات::${path}`]?.target, state.target),
            commitment: mergeUnique(math.states[`الاحتمالات::${path}`]?.commitment, state.commitment)
        };
        if (!math.states[path]) {
            math.states[path] = math.states[`الاحتمالات::${path}`];
        }
    });
})();
