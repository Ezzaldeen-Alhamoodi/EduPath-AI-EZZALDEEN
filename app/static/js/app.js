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

  "Quran Memorization": {
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
      "أخرى": ["أخرى"]
    },
    detail: {
      "حفظ جديد": ["آية واحدة","نصف صفحة","صفحة كاملة","وجه كامل","مقطع قصير","مقطع متوسط","أخرى"],
      "مراجعة": ["مراجعة بدون مصحف","مراجعة بالمصحف","تكرار 3 مرات","تكرار 5 مرات","تثبيت مواضع الخطأ","أخرى"],
      "تسميع": ["بدون أخطاء","مع تسجيل صوتي","مع تصحيح الأخطاء","تسميع متكرر","أخرى"],
      "تجويد": ["تطبيق الحكم على آيات","استماع لقارئ","تصحيح النطق","تدريب عملي","أخرى"],
      "أخرى": ["أخرى"]
    },
    training: ["حفظ","تكرار","مراجعة","تسميع","استماع لقارئ","تصحيح الأخطاء","تثبيت الحفظ","اختبار ذاتي","مراجعة متباعدة","خطة أسبوعية","أخرى"]
  },

  "Secondary School": {
    icon: "ث",
    main: ["القرآن الكريم","التربية الإسلامية","اللغة العربية","اللغة الإنجليزية","الرياضيات","الفيزياء","الكيمياء","الأحياء","التاريخ","الجغرافيا","الدراسات الاجتماعية","علوم الحاسوب","مراجعة عامة","اختبارات","واجبات","أخرى"],
    sub: {
      "القرآن الكريم": ["الحفظ","المراجعة","التلاوة","التجويد","التفسير","أخرى"],
      "التربية الإسلامية": ["العقيدة","الفقه","الحديث","السيرة النبوية","التفسير","الأخلاق","أخرى"],
      "اللغة العربية": ["النحو","الصرف","البلاغة","الأدب","القراءة","الكتابة","الإملاء","التعبير","أخرى"],
      "اللغة الإنجليزية": ["القراءة","الكتابة","الاستماع","التحدث","القواعد","المفردات","الترجمة","أسئلة الاختبارات","أخرى"],
      "الرياضيات": ["الجبر","الهندسة","المثلثات","مبادئ التفاضل والتكامل","الاحتمالات","الإحصاء","المعادلات","الدوال","اختبارات سابقة","أخرى"],
      "الفيزياء": ["الميكانيكا","الكهرباء","المغناطيسية","الحرارة","الضوء","الموجات","القوانين","مسائل تطبيقية","أخرى"],
      "الكيمياء": ["المفاهيم الأساسية","المعادلات الكيميائية","الحسابات الكيميائية","الأحماض والقواعد","الأملاح","الكيمياء العضوية","التجارب","أخرى"],
      "الأحياء": ["الخلية","الوراثة","جسم الإنسان","النبات","البيئة","التصنيف","مراجعة عامة","أخرى"],
      "التاريخ": ["مراجعة الدرس","حفظ التواريخ","الشخصيات","الأحداث","أسئلة سابقة","أخرى"],
      "الجغرافيا": ["الخرائط","المناخ","السكان","الموارد","المواقع","أسئلة سابقة","أخرى"],
      "الدراسات الاجتماعية": ["المجتمع","المواطنة","القيم","القوانين","مراجعة عامة","أخرى"],
      "علوم الحاسوب": ["أساسيات الحاسوب","البرمجة","الشبكات","قواعد البيانات","أمن المعلومات","مشروع عملي","أخرى"],
      "مراجعة عامة": ["مراجعة درس","مراجعة وحدة","مراجعة فصل","خطة مذاكرة","أخرى"],
      "اختبارات": ["اختبار قصير","اختبار شهري","اختبار نهائي","اختبارات سابقة","محاكاة اختبار","أخرى"],
      "واجبات": ["واجب منزلي","حل تمارين","تلخيص درس","بحث قصير","أخرى"],
      "أخرى": ["دراسة عامة","مراجعة","تدريب","أخرى"]
    },
    detail: {
      "القرآن الكريم": ["مراجعة سورة","ورد يومي","حفظ جديد","حفظ سابق","قاعدة تجويد","تصحيح أخطاء","أخرى"],
      "التربية الإسلامية": ["مراجعة الدرس","حفظ الأدلة","تلخيص","أسئلة وأجوبة","أخرى"],
      "اللغة العربية": ["تدريب قواعد","تحليل نص","كتابة فقرة","إملاء","تعبير كتابي","أخرى"],
      "اللغة الإنجليزية": ["تدريب قراءة","تدريب كتابة","استماع وتكرار","مفردات جديدة","قواعد","أخرى"],
      "الرياضيات": ["مراجعة الدرس","مراجعة القوانين","أسئلة سابقة","مسائل صعبة","تدريب مؤقت","أخرى"],
      "الفيزياء": ["مراجعة القوانين","حل مسائل","تجربة","أسئلة سابقة","تطبيقات","أخرى"],
      "الكيمياء": ["حفظ مفاهيم","حل مسائل","مراجعة معادلات","تجربة","أسئلة سابقة","أخرى"],
      "الأحياء": ["حفظ مصطلحات","رسم مخطط","تلخيص درس","أسئلة سابقة","أخرى"],
      "أخرى": ["موضوع عام","أخرى"]
    },
    training: ["دراسة الدرس","حل التمارين","مراجعة الأخطاء","تدريب مؤقت","التحضير للاختبار","حفظ القوانين","حفظ","مراجعة","استماع","تلاوة","تصحيح الأخطاء","كتابة فقرة","استماع وتكرار","تلخيص","اختبار ذاتي","أخرى"]
  },

  "University": {
    icon: "ج",
    main: ["Computer Science","Information Technology","Computer Engineering","Software Engineering","Artificial Intelligence","Data Science","Cybersecurity","Engineering","Medicine","Pharmacy","Dentistry","Nursing","Business Administration","Accounting","Finance","Economics","Marketing","Management","Law","Sharia and Law","Islamic Studies","Education","English Language","Arabic Language","Translation","Media","Political Science","Psychology","Sociology","Mathematics","Physics","Chemistry","Biology","Architecture","Agriculture","Other"],
    sub: {
      "Computer Science": ["Programming","Algorithms","Data Structures","Databases","Operating Systems","Computer Networks","Software Engineering","Web Development","AI","Cybersecurity","Discrete Mathematics","Computer Architecture","Graduation Project","Other"],
      "Accounting": ["Financial Accounting","Managerial Accounting","Cost Accounting","Auditing","Tax Accounting","Accounting Systems","Reports","Budgeting","Other"],
      "Law": ["Civil Law","Criminal Law","Commercial Law","International Law","Legal Writing","Case Analysis","Legal Research","Other"],
      "Sharia and Law": ["Civil Law","Criminal Law","Commercial Law","International Law","Islamic Jurisprudence","Legal Writing","Case Analysis","Legal Research","Other"],
      "Other": ["Lecture","Assignment","Research","Project","Exam Review","Other"]
    },
    detail: {"Computer Science": ["Lecture Topic","Lab Task","Assignment Question","Project Feature","Exam Chapter","Other"], "Other": ["Topic","Chapter","Lecture","Other"]},
    training: ["Lecture Study","Assignment","Lab Practice","Project Work","Exam Review","Research","Presentation","Problem Solving","Study Lecture","Solve Exercises","Prepare Report","Review Terms","Practice Problems","Analyze Case","Memorize Terms","Other"]
  },

  "Languages": {
    icon: "🌐",
    main: ["English","Turkish","Russian","Chinese","Indonesian","Romanian","Arabic","French","German","Other"],
    sub: {
      "English": ["General English","IELTS","TOEFL","Duolingo English Test","Grammar","Vocabulary","Pronunciation","Reading","Writing","Listening","Speaking","Academic English","Other"],
      "Chinese": ["General Chinese","HSK","Grammar","Vocabulary","Pronunciation","Reading","Writing","Listening","Speaking","Characters","Translation","Other"],
      "Turkish": ["General Turkish","Grammar","Vocabulary","Pronunciation","Reading","Writing","Listening","Speaking","Translation","Other"],
      "Russian": ["General Russian","Grammar","Vocabulary","Pronunciation","Reading","Writing","Listening","Speaking","Translation","Other"],
      "Other": ["General Language","Grammar","Vocabulary","Reading","Writing","Listening","Speaking","Other"]
    },
    detail: {
      "IELTS": ["Listening","Reading","Writing","Speaking"],
      "TOEFL": ["Reading","Listening","Writing","Speaking"],
      "Duolingo English Test": ["Reading","Listening","Writing","Speaking"],
      "HSK": ["Listening","Reading","Writing","Vocabulary","Characters"],
      "General English": ["Daily Conversation","Grammar Review","Vocabulary Building","Pronunciation","Academic English","Other"],
      "Grammar": ["Tenses","Articles","Prepositions","Sentence Structure","Error Correction","Other"],
      "Vocabulary": ["Academic Words","Daily Words","IELTS Words","TOEFL Words","Review Set","Other"],
      "Other": ["General Topic","Other"]
    },
    training: ["Practice","Timed Practice","Review Mistakes","Vocabulary Review","Grammar Practice","Pronunciation Practice","Dictation","Shadowing","Mock Test","Other"],
    examDetails: {
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
      "HSK": {
        "Listening": ["Dialogue","Conversation","Announcement","Lecture"],
        "Reading": ["Vocabulary Recognition","Sentence Completion","Passage Understanding"],
        "Writing": ["Character Writing","Sentence Formation","Essay Writing"],
        "Vocabulary": ["HSK Word List","Character Review","Pinyin Practice"],
        "Characters": ["Stroke Order","Recognition","Writing Practice"]
      }
    },
    examTraining: {
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
      }
    }
  },

  "Programming & Technology": {
    icon: "بر",
    main: ["Python","C","C++","Java","JavaScript","TypeScript","HTML","CSS","SQL","Flask","Django","React","Node.js","Git / GitHub","Web Development","Frontend Development","Backend Development","Full Stack Development","Databases","Algorithms","Data Structures","Problem Solving","Debugging","Software Engineering","Software Testing","Operating Systems","Computer Networks","Cybersecurity","Cloud Computing","DevOps","APIs","Artificial Intelligence","Machine Learning","Data Science","Projects","Documentation","Other"],
    sub: {
      "Python": ["Syntax","Variables","Data Types","Conditions","Loops","Functions","Lists","Tuples","Dictionaries","Sets","Files","OOP","Modules","Libraries","Virtual Environment","APIs","Flask","Data Analysis","Automation","Web Scraping","Machine Learning","Projects","Debugging","Other"],
      "Web Development": ["HTML","CSS","JavaScript","Frontend","Backend","Full Stack","Responsive Design","Forms","Authentication","APIs","Databases","Deployment","Performance","Security","Other"],
      "Algorithms": ["Searching","Sorting","Recursion","Greedy Algorithms","Dynamic Programming","Graph Algorithms","Tree Algorithms","Backtracking","Divide and Conquer","Complexity Analysis","Other"],
      "Cybersecurity": ["Security Basics","Network Security","Web Security","Linux Security","Cryptography","Ethical Hacking Basics","Vulnerabilities","Authentication","OWASP Basics","Other"],
      "Other": ["Concepts","Practice","Project","Debugging","Review","Other"]
    },
    detail: {"Python": ["Classes and Objects","Inheritance","File Handling","List Practice","Dictionary Practice","API Request","Flask Route","Other"], "Algorithms": ["Problem Set","Time Complexity","Code Implementation","Mistake Review","Other"], "Other": ["General Topic","Other"]},
    training: ["Study Concept","Write Code","Solve Exercises","Build Mini Project","Debug Code","Read Documentation","Review Mistakes","Refactor Code","Practice Syntax","Build App","Build Page","Design Layout","Fix Bug","Connect Backend","Create Form","Make Responsive","Deploy Website","Improve UI","Practice Project","Other"]
  },

  "Artificial Intelligence": {
    icon: "AI",
    main: ["Artificial Intelligence","Machine Learning","Deep Learning","Data Science","NLP","Computer Vision","Reinforcement Learning","AI Projects","Other"],
    sub: {"Machine Learning": ["Data Cleaning","Feature Engineering","Models","Training","Evaluation","Scikit-learn","Projects","Other"], "Deep Learning": ["Neural Networks","CNN","RNN","Transformers","Training","Evaluation","Other"], "Other": ["Study","Practice","Project","Review","Other"]},
    detail: {"Machine Learning": ["Dataset","Model Comparison","Accuracy","Feature Selection","Other"], "Other": ["Topic","Other"]},
    training: ["Study Concept","Code Implementation","Experiment","Evaluate Model","Build Project","Read Paper","Review Mistakes","Other"]
  },

  "Mathematics": {
    icon: "🧮",
    main: ["Algebra","Geometry","Trigonometry","Calculus","Probability","Statistics","Linear Algebra","Discrete Mathematics","Equations","Functions","Past Exams","Other"],
    sub: {"Algebra": ["Equations","Inequalities","Functions","Word Problems","Polynomials","Other"], "Calculus": ["Limits","Derivatives","Integrals","Applications","Other"], "Other": ["Concepts","Examples","Exercises","Review","Other"]},
    detail: {"Algebra": ["Exercise Set","Formula","Past Question","Difficult Topic","Other"], "Other": ["General Topic","Other"]},
    training: ["Study Lesson","Solve Exercises","Review Mistakes","Timed Practice","Prepare for Exam","Memorize Formulas","Other"]
  },

  "Scholarships": {
    icon: "🎖️",
    main: ["Scholarship Search","University Research","Application Form","Documents","CV","Motivation Letter","Personal Statement","Recommendation Letter","Interview","Language Test","Portfolio","Email Communication","Visa","Travel Preparation","Follow-up","Other"],
    sub: {"Motivation Letter": ["Bachelor Scholarship","Computer Science","Draft","Edit","Personalize","Final Review","Other"], "Interview": ["Self Introduction","Why Major","Why Scholarship","Future Plans","Mock Interview","Other"], "Documents": ["Preparation","Translation","Review","Upload","Final Check","Other"], "Other": ["Search","Prepare","Review","Submit","Other"]},
    detail: {"Motivation Letter": ["Opening Paragraph","Achievements","Projects","Future Goals","University Fit","Other"], "Interview": ["Question Practice","Answer Improvement","Mock Interview","Feedback","Other"], "Other": ["Topic","Other"]},
    training: ["Search","Compare","Prepare","Write","Edit","Review","Upload","Submit","Follow Up","Practice Interview","Final Check","Other"]
  },

  "Exams & Certificates": {
    icon: "اخ",
    main: ["IELTS","TOEFL","Duolingo English Test","HSK","SAT","ACT","GRE","GMAT","CSCA","Other"],
    sub: {
      "IELTS": ["Listening","Reading","Writing","Speaking"],
      "TOEFL": ["Reading","Listening","Writing","Speaking"],
      "Duolingo English Test": ["Reading","Listening","Writing","Speaking"],
      "HSK": ["Listening","Reading","Writing","Vocabulary","Characters"],
      "SAT": ["Reading and Writing","Mathematics"],
      "CSCA": ["Chinese","English"],
      "Other": ["Study","Practice","Mock Test","Review","Other"]
    },
    detail: {"Other": ["General Topic","Other"]},
    training: ["Practice","Timed Practice","Mock Test","Review Mistakes","Other"]
  },

  "Daily Life": {
    icon: "🗓️",
    main: ["Health","Exercise","Sleep","Food","Water","Personal Routine","Family","Finance","Cleaning","Shopping","Time Management","Reading","Religious Routine","Appointments","Other"],
    sub: {"Other": ["Daily Habit","Weekly Routine","Reminder","Personal Task","Important Appointment","Self-care","Other"]},
    detail: {"Other": ["General Topic","Other"]},
    training: ["Do Task","Review Progress","Repeat Habit","Prepare","Check","Improve Routine","Other"]
  },

  "Projects": {
    icon: "🚀",
    main: ["Programming Project","AI Project","Web Project","Mobile App","Research Project","School Project","University Project","Scholarship Portfolio","Personal Project","Other"],
    sub: {"Programming Project": ["Idea","Planning","Design","Frontend","Backend","Database","Testing","Debugging","Deployment","Documentation","Presentation","Other"], "Other": ["Idea","Planning","Build","Test","Improve","Other"]},
    detail: {"Programming Project": ["Feature","Bug","Page","API","Database Table","Other"], "Other": ["Topic","Other"]},
    training: ["Brainstorm","Build","Code","Test","Improve","Deploy","Write Documentation","Review","Other"]
  },

  "Reading & Research": {
    icon: "ق",
    main: ["Book Reading","Article Reading","Research Paper","Summary","Notes","Literature Review","Critical Thinking","Other"],
    sub: {"Research Paper": ["Abstract","Introduction","Methodology","Results","Discussion","References","Other"], "Other": ["Read","Summarize","Analyze","Take Notes","Other"]},
    detail: {"Research Paper": ["Key Ideas","Methods","Limitations","Findings","Other"], "Other": ["Topic","Other"]},
    training: ["Read","Summarize","Analyze","Take Notes","Review","Discuss","Other"]
  },

  "General": {icon: "✨", main: ["Study","Planning","Review","Reminder","Personal Task","Other"], sub: {"Study": ["Learning","Practice","Review","Application","Other"], "Other": ["General","Other"]}, detail: {"Other": ["General","Other"]}, training: ["Do Task","Study","Practice","Review","Prepare","Other"]},
  "Other": {icon: "🧩", main: ["Other"], sub: {"Other": ["Other"]}, detail: {"Other": ["Other"]}, training: ["Other"]}
};


/* EduPath AI v4.6.6 Full Arabic UI */
const EDUPATH_LABEL_AR = {
    "Secondary School": "المرحلة الثانوية",
    "University": "المرحلة الجامعية",
    "Languages": "اللغات",
    "Programming & Technology": "البرمجة والتكنولوجيا",
    "Artificial Intelligence": "الذكاء الاصطناعي",
    "Mathematics": "الرياضيات",
    "Scholarships": "المنح الدراسية",
    "Exams & Certificates": "الاختبارات والشهادات",
    "Daily Life": "الحياة اليومية",
    "Projects": "المشاريع",
    "Reading & Research": "القراءة والبحث",
    "General": "عام",
    "Other": "أخرى",
    "Quran Memorization": "حفظ القرآن الكريم",

    "Quran": "القرآن الكريم",
    "Islamic Studies": "التربية الإسلامية",
    "Arabic Language": "اللغة العربية",
    "English Language": "اللغة الإنجليزية",
    "Computer Science": "علوم الحاسوب",
    "General Review": "مراجعة عامة",
    "Exams": "اختبارات",
    "Homework": "واجبات",

    "English": "الإنجليزية",
    "Turkish": "التركية",
    "Russian": "الروسية",
    "Chinese": "الصينية",
    "Arabic": "العربية",
    "French": "الفرنسية",
    "German": "الألمانية",
    "General English": "إنجليزية عامة",
    "Grammar": "القواعد",
    "Vocabulary": "المفردات",
    "Pronunciation": "النطق",
    "Reading": "القراءة",
    "Writing": "الكتابة",
    "Listening": "الاستماع",
    "Speaking": "التحدث",
    "Academic English": "الإنجليزية الأكاديمية",

    "Programming": "البرمجة",
    "Algorithms": "الخوارزميات",
    "Data Structures": "هياكل البيانات",
    "Databases": "قواعد البيانات",
    "Operating Systems": "أنظمة التشغيل",
    "Computer Networks": "شبكات الحاسوب",
    "Software Engineering": "هندسة البرمجيات",
    "Web Development": "تطوير الويب",
    "Cybersecurity": "الأمن السيبراني",
    "Discrete Mathematics": "الرياضيات المتقطعة",
    "Computer Architecture": "معمارية الحاسوب",
    "Graduation Project": "مشروع التخرج",

    "Python": "بايثون",
    "C": "سي",
    "C++": "سي بلس بلس",
    "Java": "جافا",
    "JavaScript": "جافاسكريبت",
    "HTML": "HTML",
    "CSS": "CSS",
    "SQL": "SQL",
    "Flask": "Flask",
    "React": "React",
    "Git / GitHub": "Git / GitHub",
    "Frontend Development": "تطوير الواجهة الأمامية",
    "Backend Development": "تطوير الخلفية",
    "Full Stack Development": "تطوير متكامل",
    "Problem Solving": "حل المشكلات",
    "Debugging": "تصحيح الأخطاء",
    "Syntax": "الصياغة البرمجية",
    "Variables": "المتغيرات",
    "Data Types": "أنواع البيانات",
    "Conditions": "الشروط",
    "Loops": "الحلقات",
    "Functions": "الدوال",
    "Lists": "القوائم",
    "Dictionaries": "القواميس",
    "Files": "الملفات",
    "OOP": "البرمجة الكائنية",
    "Projects": "المشاريع",

    "Study Concept": "دراسة المفهوم",
    "Write Code": "كتابة كود",
    "Solve Exercises": "حل تمارين",
    "Build Mini Project": "بناء مشروع صغير",
    "Debug Code": "تصحيح الكود",
    "Read Documentation": "قراءة التوثيق",
    "Review Mistakes": "مراجعة الأخطاء",
    "Practice Syntax": "تدريب الصياغة",
    "Build App": "بناء تطبيق",
    "Practice": "تدريب",
    "Timed Practice": "تدريب بوقت محدد",
    "Mock Test": "اختبار تجريبي",
    "Final Revision": "مراجعة نهائية",

    "Scholarship Search": "البحث عن منحة",
    "University Research": "بحث عن جامعة",
    "Application Form": "نموذج التقديم",
    "Documents": "المستندات",
    "CV": "السيرة الذاتية",
    "Motivation Letter": "خطاب الدافع",
    "Personal Statement": "البيان الشخصي",
    "Recommendation Letter": "خطاب التوصية",
    "Interview": "المقابلة",
    "Language Test": "اختبار اللغة",
    "Portfolio": "الملف الشخصي",
    "Email Communication": "التواصل بالبريد",
    "Visa": "التأشيرة",
    "Travel Preparation": "الاستعداد للسفر",
    "Follow-up": "المتابعة",

    "Health": "الصحة",
    "Exercise": "الرياضة",
    "Sleep": "النوم",
    "Food": "الطعام",
    "Water": "الماء",
    "Personal Routine": "الروتين الشخصي",
    "Family": "العائلة",
    "Finance": "المال",
    "Cleaning": "التنظيف",
    "Shopping": "التسوق",
    "Time Management": "إدارة الوقت",
    "Reading": "القراءة",
    "Religious Routine": "الروتين الديني",
    "Appointments": "المواعيد",

    "IELTS": "IELTS",
    "TOEFL": "TOEFL",
    "Duolingo English Test": "Duolingo English Test",
    "HSK": "HSK",
    "SAT": "SAT",
    "ACT": "ACT",
    "GRE": "GRE",
    "GMAT": "GMAT",
    "CSCA": "CSCA",

    "Mathematics": "الرياضيات",
    "Physics": "الفيزياء",
    "Chemistry": "الكيمياء",
    "Sets and Inequalities": "المجموعات والمتباينات",
    "Functions": "الدوال",
    "Geometry and Algebra": "الهندسة والجبر",
    "Probability and Statistics": "الاحتمالات والإحصاء",
    "Mechanics": "الميكانيكا",
    "Electromagnetism": "الكهرومغناطيسية",
    "Thermodynamics": "الديناميكا الحرارية",
    "Optics": "البصريات",
    "Modern Physics": "الفيزياء الحديثة",
    "Basic Chemical Concepts and Calculations": "المفاهيم والحسابات الكيميائية الأساسية",
    "Properties and Reactions of Substances": "خصائص وتفاعلات المواد",
    "Chemical Theories and Laws": "النظريات والقوانين الكيميائية",
    "Chemical Experiments and Applications": "التجارب والتطبيقات الكيميائية",

    "Study Theory": "دراسة نظرية",
    "Concept Review": "مراجعة المفهوم",
    "Solved Examples": "أمثلة محلولة",
    "Practice Questions": "أسئلة تدريبية",
    "Formula Review": "مراجعة القوانين",
    "Flashcards": "بطاقات مراجعة",
    "Weakness Training": "تدريب نقاط الضعف",
    "Full Exam Simulation": "محاكاة اختبار كامل",

    "حفظ جديد": "حفظ جديد",
    "مراجعة": "مراجعة",
    "تسميع": "تسميع",
    "تجويد": "تجويد",
    "تفسير مبسط": "تفسير مبسط",
    "خطة حفظ": "خطة حفظ",
    "اختبار حفظ": "اختبار حفظ",
    "Other": "أخرى"
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
    "Other": "أخرى"
});

function labelForUI(value) {
    const alwaysArabic = {
        "Quran Memorization": "حفظ القرآن",
        "Secondary School": "المرحلة الثانوية"
    };
    if (alwaysArabic[value]) return alwaysArabic[value];
    const lang = localStorage.getItem("edupath-language") || "en";
    if (lang !== "ar") return value;
    return EDUPATH_LABEL_AR[value] || value;
}

function translateDynamicOptions() {
    const lang = localStorage.getItem("edupath-language") || "en";
    document.querySelectorAll("select option").forEach(option => {
        if (!option.dataset.originalText) option.dataset.originalText = option.textContent;
        const original = option.dataset.originalText;
        option.textContent = lang === "ar" ? (EDUPATH_LABEL_AR[original] || original) : original;
    });

    document.querySelectorAll(".task-type-card strong").forEach(el => {
        if (!el.dataset.originalText) el.dataset.originalText = el.textContent;
        const original = el.dataset.originalText;
        el.textContent = lang === "ar" ? (EDUPATH_LABEL_AR[original] || original) : original;
    });
}

function fillSmartSelect(select, values, selectedValue) {
    if (!select) return;
    select.innerHTML = "";
    const unique = [...new Set(values && values.length ? values : ["Other"])];
    unique.forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = labelForUI(value);
        if (selectedValue && value === selectedValue) option.selected = true;
        select.appendChild(option);
    });
}

function getSmartConfig(type) {
    return SMART_TASK_DATA[type] || SMART_TASK_DATA["General"];
}

function selectedOrFirst(values, selected) {
    if (selected && values && values.includes(selected)) return selected;
    return values && values.length ? values[0] : "Other";
}

function renderTaskTypeCards() {
    const grid = document.getElementById("taskTypeCards");
    const categoryInput = document.getElementById("categorySelect");
    if (!grid || !categoryInput) return;

    grid.innerHTML = "";
    const current = categoryInput.value || "General";

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

const CSCA_TRAINING_TYPES = ["Study Theory","Concept Review","Solved Examples","Practice Questions","Timed Practice","Mock Test","Review Mistakes","Formula Review","Flashcards","Weakness Training","Final Revision","Full Exam Simulation","Other"];


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

        const detailedTopics = CSCA_DETAILED_TOPICS[trainingSelect.value] || ["Other"];
        fillSmartSelect(cscaDetailed, detailedTopics, cscaDetailed.value && detailedTopics.includes(cscaDetailed.value) ? cscaDetailed.value : detailedTopics[0]);

        fillSmartSelect(cscaTraining, CSCA_TRAINING_TYPES, cscaTraining.value && CSCA_TRAINING_TYPES.includes(cscaTraining.value) ? cscaTraining.value : "Study Theory");
    } else {
        if (topicLabel) topicLabel.textContent = "Main Field";
        if (skillLabel) skillLabel.textContent = "Sub Field";
        if (detailLabel) detailLabel.textContent = "Detailed Topic";
        if (trainingLabel) trainingLabel.textContent = "Training Type";
    }
}


function updateSmartTaskFields() {
    const categoryInput = document.getElementById("categorySelect");
    const topicSelect = document.getElementById("topicSelect");
    const skillSelect = document.getElementById("skillSelect");
    const detailSelect = document.getElementById("detailedTopicSelect");
    const trainingSelect = document.getElementById("trainingTypeSelect");

    if (!categoryInput || !topicSelect || !skillSelect || !detailSelect || !trainingSelect) return;

    const type = categoryInput.value || "General";
    const config = getSmartConfig(type);

    const currentTopic = topicSelect.dataset.current || "";
    const topicValues = config.main || ["Other"];
    fillSmartSelect(topicSelect, topicValues, selectedOrFirst(topicValues, currentTopic));

    function refreshSubFields() {
        const selectedTopic = topicSelect.value;
        const subValues = (config.sub && (config.sub[selectedTopic] || config.sub["Other"])) || ["Other"];
        const currentSkill = skillSelect.dataset.current || "";
        fillSmartSelect(skillSelect, subValues, selectedOrFirst(subValues, currentSkill));
        refreshDetails();
        toggleOtherBoxes();
    }

    function refreshDetails() {
        const selectedType = categoryInput.value || "General";
        const selectedTopic = topicSelect.value;
        const selectedSkill = skillSelect.value;

        let detailValues = null;
        let trainingValues = null;

        // Languages section: exam is selected as Main Field, skill is Sub Field.
        if (["IELTS","TOEFL","Duolingo English Test","HSK","CSCA"].includes(selectedTopic)) {
            detailValues = getOfficialExamDetails(selectedTopic, selectedSkill);
            trainingValues = getOfficialExamTraining(selectedTopic, selectedSkill);
        }

        // Exams & Certificates section: exam is also selected as Main Field.
        if (!detailValues && selectedType === "Exams & Certificates" && ["IELTS","TOEFL","Duolingo English Test","HSK","CSCA"].includes(selectedTopic)) {
            detailValues = getOfficialExamDetails(selectedTopic, selectedSkill);
            trainingValues = getOfficialExamTraining(selectedTopic, selectedSkill);
        }

        if (!detailValues) {
            detailValues = (config.detail && (config.detail[selectedSkill] || config.detail[selectedTopic] || config.detail["Other"])) || ["General Topic", "Other"];
        }

        if (!trainingValues) {
            trainingValues = config.training || ["Study", "Practice", "Review", "Other"];
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

        if (customCategoryBox) customCategoryBox.style.display = type === "Other" ? "block" : "none";
        if (customTopicBox) customTopicBox.style.display = topicSelect.value === "Other" ? "block" : "none";
        if (customSkillBox) customSkillBox.style.display = skillSelect.value === "Other" ? "block" : "none";
        if (customDetailedTopicBox) customDetailedTopicBox.style.display = detailSelect.value === "Other" ? "block" : "none";
        if (customTrainingTypeBox) customTrainingTypeBox.style.display = trainingSelect.value === "Other" ? "block" : "none";
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
    const box = document.getElementById("repeatDaysBox");
    if (!repeatSelect || !box) return;
    box.style.display = repeatSelect.value === "selected_days" ? "block" : "none";
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("taskTypeCards")) {
        const categoryInput = document.getElementById("categorySelect");
        if (categoryInput && !categoryInput.value) categoryInput.value = "General";
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
        "dashboard.recent_tasks": "Recent Tasks",
        "goals.title": "Smart Goals & Progress Intelligence",
        "goals.desc": "Create goals that connect naturally with your tasks: exams, languages, programming, scholarships, university, and daily improvement.",
        "goals.create": "Create Smart Goal",
        "goals.goal_title": "Goal Title",
        "goals.goal_type": "Goal Type",
        "goals.current_level": "Current Level / Score",
        "goals.daily_minutes": "Daily Minutes",
        "goals.start_date": "Start Date",
        "goals.deadline": "Deadline / Exam Date / Target Date",
        "goals.reminder": "Reminder Time",
        "goals.notes": "Notes",
        "goals.save": "Save Smart Goal",
        "goals.current_goals": "Current Goals",
        "goals.how": "How Smart Progress Works",
        "tasks.title": "Smart Adaptive Task System",
        "tasks.desc": "Create tasks that feel personal: study, university, languages, programming, scholarships, life routines, projects, exams, and more.",
        "tasks.add": "Add Smart Task",
        "tasks.add_desc": "Start with Task Type, then the form adapts automatically step by step.",
        "tasks.your": "Your Tasks",
        "tasks.empty": "No tasks yet. Create your first smart task.",
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
    const savedLang = localStorage.getItem("edupath-language") || "en";
    applyEduPathLanguage(savedLang);

    const toggle = document.getElementById("languageToggle");
    if (toggle) {
        toggle.addEventListener("click", () => {
            const current = localStorage.getItem("edupath-language") || "en";
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
            const current = localStorage.getItem("edupath-language") || "en";
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
        "taskform.other_type": ["Other Task Type", "نوع مهمة آخر"],
        "taskform.task_name": ["Task Name", "اسم المهمة"],
        "taskform.other_main": ["Other Main Field", "مجال رئيسي آخر"],
        "taskform.other_sub": ["Other Sub Field", "مجال فرعي آخر"],
        "taskform.other_detail": ["Other Detailed Topic", "موضوع تفصيلي آخر"],
        "taskform.csca_detail": ["CSCA Detailed Topic", "موضوع CSCA التفصيلي"],
        "taskform.csca_training": ["CSCA Training Type", "نوع تدريب CSCA"],
        "taskform.csca_hint": ["CSCA structure: Exam → Language → Subject → Main Topic → Detailed Topic → Training Type", "هيكل CSCA: الاختبار ← لغة الاختبار ← المادة ← الموضوع الرئيسي ← الموضوع التفصيلي ← نوع التدريب"],
        "taskform.other_training": ["Other Training Type", "نوع تدريب آخر"],
        "taskform.source": ["Source / Link", "المصدر / الرابط"],
        "taskform.difficulty": ["Difficulty 1-5", "الصعوبة من ١ إلى ٥"],
        "taskform.priority": ["Priority 1-5", "الأولوية من ١ إلى ٥"],
        "taskform.expected": ["Expected Time in Minutes", "الوقت المتوقع بالدقائق"],
        "taskform.start_date": ["Start Date", "تاريخ البداية"],
        "taskform.end_date": ["End Date / Deadline", "تاريخ النهاية / الموعد النهائي"],
        "taskform.reminder": ["Reminder Time", "وقت التذكير"],
        "taskform.repeat": ["Repeat", "التكرار"],
        "taskform.repeat_days": ["Repeat Days", "أيام التكرار"],
        "taskform.repeat_hint": ["Choose any days that fit this task. Useful for intensive weekends, language routines, or study schedules.", "اختر الأيام المناسبة لهذه المهمة، مثل أيام الدراسة المكثفة أو روتين اللغة أو جدول الحفظ."],
        "taskform.notes": ["Notes", "ملاحظات"],
        "tasks.add_btn": ["Add Task", "إضافة مهمة"],
        "tasks.save": ["Save Task", "حفظ المهمة"],
        "tasks.done": ["Done", "تم"],
        "tasks.pending": ["Pending", "قيد الانتظار"],
        "tasks.edit": ["Edit", "تعديل"],
        "tasks.delete": ["Delete", "حذف"],
        "tasklabels.type": ["Task Type:", "نوع المهمة:"],
        "tasklabels.main": ["Main Field:", "المجال الرئيسي:"],
        "tasklabels.sub": ["Sub Field:", "المجال الفرعي:"],
        "tasklabels.detail": ["Detailed Topic:", "الموضوع التفصيلي:"],
        "tasklabels.training": ["Training Type:", "نوع التدريب:"],
        "tasklabels.source": ["Source:", "المصدر:"]
    };

    Object.entries(extra).forEach(([key, values]) => {
        if (!EDUPATH_I18N.en[key]) EDUPATH_I18N.en[key] = values[0];
        if (!EDUPATH_I18N.ar[key]) EDUPATH_I18N.ar[key] = values[1];
    });

    applyEduPathLanguage(localStorage.getItem("edupath-language") || "en");
});



/* v4.6.6.1 Safe Arabic repeat labels */
function translateRepeatOptionsSafely() {
    const lang = localStorage.getItem("edupath-language") || "en";
    const repeatSelect = document.getElementById("repeatTypeSelect");
    if (!repeatSelect) return;
    const ar = {
        "No Repeat / Once": "بدون تكرار / مرة واحدة",
        "Daily": "يوميًا",
        "Weekly": "أسبوعيًا",
        "Monthly": "شهريًا",
        "Custom Days": "أيام مخصصة"
    };
    [...repeatSelect.options].forEach(option => {
        if (!option.dataset.originalText) option.dataset.originalText = option.textContent;
        option.textContent = lang === "ar" ? (ar[option.dataset.originalText] || option.dataset.originalText) : option.dataset.originalText;
    });
}
document.addEventListener("DOMContentLoaded", () => {
    translateRepeatOptionsSafely();
    const langBtn = document.getElementById("languageToggle");
    const mobileLangBtn = document.getElementById("mobileMenuLanguage");
    if (langBtn) langBtn.addEventListener("click", () => setTimeout(translateRepeatOptionsSafely, 120));
    if (mobileLangBtn) mobileLangBtn.addEventListener("click", () => setTimeout(translateRepeatOptionsSafely, 160));
});










/* EduPath AI v4.6.10 Smart Goals Adaptive Fix */

const SMART_GOAL_AR_LABELS_V520 = {
    "Education": "التعليم",
    "Language": "اللغات",
    "Exam / Certificate": "الاختبارات الدولية",
    "Programming & Technology": "البرمجة والتقنية",
    "Artificial Intelligence": "الذكاء الاصطناعي",
    "Scholarship": "المنح الدراسية",
    "University": "الجامعة",
    "Mathematics": "الرياضيات",
    "Project": "المشاريع",
    "Daily Life": "الحياة اليومية",
    "Islamic Goals": "الأهداف الإسلامية",
    "General": "عام",
    "Other": "أخرى",
    "Custom": "مخصص",
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
    "Algorithms": "الخوارزميات",
    "Data Structures": "هياكل البيانات",
    "Databases": "قواعد البيانات",
    "Cybersecurity": "الأمن السيبراني",
    "Information Technology": "تقنية المعلومات",
    "Web Development": "تطوير الويب",
    "Problem Solving": "حل المشكلات",
    "Debugging": "تصحيح الأخطاء",
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
    "Custom Plan": "خطة مخصصة"
};

function smartGoalLabelArV520(value) {
    return SMART_GOAL_AR_LABELS_V520[value] || value;
}

const SMART_GOALS_V4610 = {
    "Education": {
        categories: ["School Study","University Study","Online Course","Research","Presentation","Other"],
        paths: {
            "School Study": ["Mathematics","Physics","Chemistry","Biology","English","Arabic","Exam Review","Homework","Other"],
            "University Study": ["Course Study","Assignment","Lab","Research","Presentation","Exam Review","Other"],
            "Other": ["Study Plan","Exam Review","Assignment","Project","Reading","Other"]
        },
        current: ["Not started","Beginner","In progress","Need review","Custom"],
        target: ["Complete course","High grade","Finish project","Master topic","Custom"],
        commitment: ["30 minutes daily","60 minutes daily","Weekly review","Custom"]
    },
    "Language": {
        categories: ["English","Chinese","Turkish","Russian","Indonesian","Romanian","Arabic","French","German","Other"],
        paths: {
            "English": ["IELTS Academic","TOEFL","Duolingo English Test","General English","Academic English","Speaking","Writing","Reading","Listening","Vocabulary","Grammar","Pronunciation","Other"],
            "Chinese": ["HSK","General Chinese","Speaking","Writing","Reading","Listening","Characters","Vocabulary","Other"],
            "Turkish": ["General Turkish","Speaking","Writing","Reading","Listening","Vocabulary","Grammar","Other"],
            "Russian": ["General Russian","Speaking","Writing","Reading","Listening","Vocabulary","Grammar","Other"],
            "Arabic": ["Arabic for Quran","Writing","Reading","Grammar","Vocabulary","Other"],
            "Other": ["General Language","Exam Preparation","Speaking","Writing","Reading","Listening","Other"]
        },
        current: ["Beginner","Intermediate","Advanced","IELTS Band 5.0","IELTS Band 5.5","IELTS Band 6.0","Custom"],
        target: ["IELTS Band 6.5","IELTS Band 7.0","TOEFL 90+","Duolingo 120+","HSK 4","HSK 5","Fluent Speaking","Custom"],
        commitment: ["30 minutes daily","60 minutes daily","Skill rotation","Mock test weekly","Custom"]
    },
    "Exam / Certificate": {
        categories: ["IELTS","TOEFL","Duolingo English Test","HSK","CSCA","SAT","ACT","GRE","GMAT","Other"],
        paths: {
            "IELTS": ["Listening","Reading","Writing Task 1","Writing Task 2","Speaking Part 1","Speaking Part 2","Speaking Part 3","Full Test"],
            "TOEFL": ["Complete the Words","Read in Daily Life","Read an Academic Passage","Listen and Choose a Response","Listen to a Conversation","Listen to an Announcement","Listen to an Academic Talk","Build a Sentence","Write an Email","Write for an Academic Discussion","Listen and Repeat","Take an Interview","Full Test"],
            "Duolingo English Test": ["Read and Select","Fill in the Blanks","Read and Complete","Interactive Reading","Listen and Type","Interactive Listening","Write About the Photo","Writing Sample","Interactive Writing","Speak About the Photo","Read Then Speak","Speaking Sample","Interactive Speaking","Full Test"],
            "CSCA": ["Mathematics","Physics","Chemistry","Full Exam"],
            "HSK": ["Vocabulary","Characters","Listening","Reading","Writing","Mock Test"],
            "Other": ["Subject Review","Mock Test","Weakness Training","Final Revision","Other"]
        },
        current: ["Beginner","Intermediate","Advanced","Need diagnostic","Custom"],
        target: ["Pass exam","Strong score","Scholarship requirement","University requirement","Custom"],
        commitment: ["Timed practice daily","Mock test weekly","Weakness review","Formula review","Custom"]
    },
    "Programming & Technology": {
        categories: ["Python","C","C++","Java","JavaScript","TypeScript","HTML","CSS","SQL","Flask","Django","React","Node.js","Git / GitHub","Algorithms","Data Structures","Databases","Cybersecurity","Information Technology","Computer Networks","Operating Systems","Software Engineering","Web Development","Projects","Problem Solving","Debugging","Other"],
        paths: {
            "Python": ["Beginner Python","Intermediate Python","Advanced Python","OOP","Flask","Automation","Data Analysis","Machine Learning","Projects","Problem Solving","Other"],
            "Flask": ["Routes","Templates","Forms","Authentication","Database","Deployment","Full Web App","Other"],
            "Web Development": ["Frontend","Backend","Full Stack","Responsive Design","Authentication","APIs","Databases","Deployment","Other"],
            "Algorithms": ["Searching","Sorting","Recursion","Greedy","Dynamic Programming","Graphs","Trees","Complexity","Other"],
            "Other": ["Beginner Track","Project Track","Problem Solving","Documentation","Other"]
        },
        current: ["Beginner","Know basics","Intermediate","Advanced","Custom"],
        target: ["Build a complete project","Deploy a useful web app","Solve 100 problems","Internship ready","Custom"],
        commitment: ["30 minutes daily","60 minutes daily","Build weekly","Solve problems daily","Custom"]
    },
    "Artificial Intelligence": {
        categories: ["Machine Learning","Deep Learning","Data Science","NLP","Computer Vision","AI Project","Other"],
        paths: {
            "Machine Learning": ["Supervised Learning","Unsupervised Learning","Model Evaluation","Feature Engineering","Projects","Other"],
            "Data Science": ["Pandas","Data Cleaning","Visualization","Statistics","Projects","Other"],
            "Other": ["Theory","Practice","Project","Dataset","Model Training","Deployment","Other"]
        },
        current: ["Beginner","Know basics","Intermediate","Advanced","Custom"],
        target: ["Build AI project","Understand ML basics","Deploy model","Custom"],
        commitment: ["30 minutes daily","Project weekly","Reading + practice","Custom"]
    },
    "Scholarship": {
        categories: ["Scholarship Search","University Research","Documents","CV","Motivation Letter","Personal Statement","Recommendation Letter","Interview","Application Form","Email Communication","Visa","Portfolio","Chinese Scholarship","Other"],
        paths: {
            "Chinese Scholarship": ["Full Application Preparation","Language Program","Bachelor Application","Documents","Interview","Email Follow-up","Other"],
            "Documents": ["Prepare Documents","Translate Documents","Review Documents","Upload Documents","Other"],
            "Motivation Letter": ["First Draft","Personalization","Editing","Final Review","Other"],
            "Interview": ["Mock Interview","Common Questions","Answer Improvement","Confidence Practice","Other"],
            "Other": ["Preparation","Submission","Follow Up","Final Check","Other"]
        },
        current: ["Not started","Documents 30% ready","Documents 50% ready","Documents 70% ready","Submitted some applications","Custom"],
        target: ["Submit complete application","Get interview","Win full scholarship","Get admission","Custom"],
        commitment: ["30 minutes daily","Weekly application review","Document checklist","Interview practice","Custom"]
    },
    "University": {
        categories: ["Computer Science","Information Technology","Computer Engineering","Software Engineering","Artificial Intelligence","Data Science","Cybersecurity","Engineering","Medicine","Business","Law","Education","Other"],
        paths: {
            "Computer Science": ["Programming","Algorithms","Data Structures","Databases","Operating Systems","Networks","AI","Graduation Project","Other"],
            "Other": ["Course Study","Assignment","Lab","Exam","Research","Other"]
        },
        current: ["Start of course","Need review","Average","Strong","Custom"],
        target: ["Pass course","High grade","Complete project","Master subject","Custom"],
        commitment: ["Lecture study","Assignment schedule","Lab practice","Exam review","Custom"]
    },
    "Mathematics": {
        categories: ["Algebra","Geometry","Trigonometry","Calculus","Probability","Statistics","Problem Solving","Other"],
        paths: {"Other": ["Study theory","Solve exercises","Timed practice","Review mistakes","Other"]},
        current: ["Beginner","Average","Good","Strong","Custom"],
        target: ["Master topic","High exam score","Solve advanced problems","Custom"],
        commitment: ["Daily exercises","Timed practice","Mistake review","Custom"]
    },
    "Project": {
        categories: ["Programming Project","AI Project","Web Project","Mobile App","Research Project","Scholarship Portfolio","Personal Project","Other"],
        paths: {"Other": ["Idea","Planning","Design","Build","Testing","Deployment","Documentation","Presentation","Other"]},
        current: ["Idea only","Planning","Started","Half complete","Almost done","Custom"],
        target: ["Complete project","Deploy project","Portfolio ready","Presentation ready","Custom"],
        commitment: ["Daily build","Weekly milestone","Testing cycle","Custom"]
    },
    "Daily Life": {
        categories: ["Health","Exercise","Sleep","Food","Water","Personal Routine","Family","Finance","Cleaning","Time Management","Religious Routine","Other"],
        paths: {"Other": ["Daily Habit","Weekly Routine","Reminder","Self-care","Important Appointment","Other"]},
        current: ["Not regular","Sometimes","Average","Good","Custom"],
        target: ["Build habit","Improve routine","Stay consistent","Custom"],
        commitment: ["Daily habit","Weekly review","Small steps","Custom"]
    },
    "Islamic Goals": {
        categories: ["القرآن الكريم","الحديث الشريف","العقيدة","الفقه","السيرة النبوية","الأذكار","طلب العلم الشرعي","الدعوة","العبادات","العربية للقرآن","أخرى"],
        paths: {
            "القرآن الكريم": ["حفظ القرآن الكريم","مراجعة القرآن الكريم","إتقان التجويد","ختمة تلاوة","ختمة تدبر","حفظ سورة محددة","حفظ جزء محدد","تثبيت المحفوظ","أخرى"],
            "الحديث الشريف": ["حفظ أحاديث","شرح أحاديث","مراجعة أحاديث","أخرى"],
            "أخرى": ["خطة علمية","مراجعة","قراءة","حفظ","أخرى"]
        },
        current: ["لا أحفظ شيئًا","أحفظ أقل من جزء","أحفظ جزءًا واحدًا","أحفظ جزأين","أحفظ 5 أجزاء","أحفظ 10 أجزاء","أحفظ أكثر من ذلك","تحديد يدوي"],
        target: ["حفظ سورة محددة","حفظ جزء عم","حفظ 5 أجزاء","حفظ 10 أجزاء","حفظ 15 جزءًا","حفظ 20 جزءًا","حفظ القرآن كاملًا","خطة مخصصة"],
        commitment: ["ربع صفحة يوميًا","نصف صفحة يوميًا","صفحة يوميًا","صفحة ونصف يوميًا","صفحتان يوميًا","عدد آيات محدد يوميًا","مدة زمنية يومية","خطة مخصصة"]
    },
    "General": {
        categories: ["Personal Goal","Study Goal","Skill Goal","Habit Goal","Other"],
        paths: {"Other": ["Plan","Practice","Review","Milestone","Other"]},
        current: ["Not started","Beginner","In progress","Custom"],
        target: ["Complete goal","Improve level","Custom"],
        commitment: ["Daily steps","Weekly review","Milestones","Custom"]
    },
    "Other": {
        categories: ["Other"],
        paths: {"Other": ["Custom Plan","Other"]},
        current: ["Not started","Custom"],
        target: ["Custom"],
        commitment: ["Custom"]
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
    if (typeValue === "Daily Life") return "Start, Consistency, Weekly Review, Improvement";
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

    const data = SMART_GOALS_V4610[type.value] || SMART_GOALS_V4610["General"];

    if (changedId === "goalTypeSelect" || !category.options.length) {
        fillGoalSelectV4610(category, data.categories || ["Other"]);
    }

    const paths = (data.paths && (data.paths[category.value] || data.paths["Other"])) || ["Other"];
    if (changedId === "goalTypeSelect" || changedId === "goalCategorySelect" || !path.options.length) {
        fillGoalSelectV4610(path, paths);
    }

    if (!current.options.length || changedId === "goalTypeSelect") fillGoalSelectV4610(current, data.current || ["Custom"]);
    if (!target.options.length || changedId === "goalTypeSelect") fillGoalSelectV4610(target, data.target || ["Custom"]);
    if (!commitment.options.length || changedId === "goalTypeSelect") fillGoalSelectV4610(commitment, data.commitment || ["Custom"]);

    const labels = {
        cat: document.getElementById("goalCategoryLabel"),
        path: document.getElementById("goalPathLabel"),
        current: document.getElementById("currentStateLabel"),
        target: document.getElementById("targetStateLabel"),
        outcome: document.getElementById("goalOutcomeLabel"),
        milestones: document.getElementById("milestonesLabel"),
        commitment: document.getElementById("commitmentLabel")
    };

    labels.cat.textContent = "تصنيف الهدف";
    labels.path.textContent = "مسار الهدف";
    labels.current.textContent = "الحالة الحالية";
    labels.target.textContent = "الحالة المستهدفة";
    labels.outcome.textContent = "النتيجة المستهدفة";
    if (labels.milestones) labels.milestones.textContent = "محطات التقدم";
    labels.commitment.textContent = "الالتزام اليومي أو الأسبوعي";
    if (outcome && !outcome.value) {
        if (type.value === "Islamic Goals") {
            outcome.placeholder = "مثال: إتمام حفظ جزء عم وتثبيته";
        } else if (type.value === "Scholarship") {
            outcome.placeholder = "مثال: الحصول على منحة أو تقديم طلب قوي ومكتمل";
        } else if (type.value === "Programming & Technology") {
            outcome.placeholder = "مثال: بناء مشروع متكامل ونشره";
        } else {
            outcome.placeholder = "ماذا تريد أن يتحقق عند إنجاز هذا الهدف؟";
        }
    }

    const selected = `${type.value} ${category.value} ${path.value} ${target.value}`.toLowerCase();
    const shouldRefreshSuggestions = ["goalTypeSelect", "goalCategorySelect", "goalPathSelect", "targetStateSelect"].includes(changedId);

    if (milestones && (shouldRefreshSuggestions || !milestones.value)) {
        milestones.value = generatedMilestonesForGoalV4611(type.value, category.value, path.value, target.value);
    }

    if (keywords) {
        keywords.value = [type.value, category.value, path.value, current.value, target.value, commitment.value, milestones ? milestones.value : ""].filter(Boolean).join(", ");
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



/* EduPath AI v4.6.11 Robust Other/Custom Fields */
function isOtherLikeEduPath(value) {
    return ["Other", "أخرى", "Custom", "Custom Plan", "خطة مخصصة", "تحديد يدوي", "Other / أخرى"].includes(value);
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



/* EduPath AI v4.6.12 Custom Fields + Adaptive Layout Fix */
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



/* EduPath AI v4.6.13 Final Goal Custom Field Controller */
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
        customCategoryLabel: isIslamic ? "اكتب التصنيف المخصص" : "Custom Goal Category",
        customPathLabel: isIslamic ? "اكتب المسار المخصص" : "Custom Goal Path",
        customCurrentLabel: isIslamic ? "اكتب حالتك الحالية" : "Custom Current State",
        customTargetLabel: isIslamic ? "اكتب هدفك المستهدف" : "Custom Target State",
        customCommitmentLabel: isIslamic ? "اكتب الالتزام المخصص" : "Custom Commitment"
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
            applyEduPathLanguage(localStorage.getItem("edupath-language") || "en");
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
            applyEduPathLanguage(localStorage.getItem("edupath-language") || "en");
        }
    }
});



/* EduPath AI v4.7.6 Arabic task section labels */
function applyArabicSpecialTaskLabelsV476() {
    const type = document.getElementById("categorySelect")?.value || "";
    const arabicMode = type === "Quran Memorization" || type === "Secondary School";
    const map = {
        topicLabel: arabicMode ? "المجال الرئيسي" : "Main Field",
        skillLabel: arabicMode ? "المجال الفرعي" : "Sub Field",
        detailLabel: arabicMode ? "الموضوع التفصيلي" : "Detailed Topic",
        trainingLabel: arabicMode ? "نوع التدريب" : "Training Type"
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
        setTextV477("taskNameLabel", "Task Name");
        setPlaceholderV477("taskTitleInput", "Example: Review Quran memorization / مثال: مراجعة حفظ القرآن");
        setTextV477("topicLabel", "Main Field");
        setTextV477("skillLabel", "Sub Field");
        setTextV477("detailLabel", "Detailed Topic");
        setTextV477("trainingLabel", "Training Type");
        setTextV477("sourceLabel", "Source / Link");
        setPlaceholderV477("sourceInput", "Book, website, YouTube, document link... / كتاب أو رابط أو مصدر");
        setTextV477("difficultyLabel", "Difficulty 1-5");
        setTextV477("priorityLabel", "Priority 1-5");
        setTextV477("expectedTimeLabel", "Expected Time in Minutes");
        setTextV477("startDateLabel", "Start Date");
        setTextV477("endDateLabel", "End Date / Deadline");
        setTextV477("reminderLabel", "Reminder Time");
        setTextV477("repeatLabel", "Repeat");
        setTextV477("repeatDaysLabel", "Repeat Days");
        setTextV477("notesLabel", "Notes");
        setPlaceholderV477("notesInput", "Any notes or plan... / اكتب أي ملاحظات أو خطة");
        return;
    }

    setTextV477("taskNameLabel", type === "Quran Memorization" ? "اسم مهمة القرآن" : "اسم المهمة الدراسية");
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
        const current = localStorage.getItem("edupath-language") || "en";
        lang.textContent = current === "ar" ? "EN" : "ع";
    }
}
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(compactDesktopControlsV481, 100);
    document.addEventListener("click", () => setTimeout(compactDesktopControlsV481, 80));
    window.addEventListener("resize", compactDesktopControlsV481);
});
