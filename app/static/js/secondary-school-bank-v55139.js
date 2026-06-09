
/* EduPath AI v5.5.139 - Direct Core Patch for Secondary School Task Bank
   This file is loaded after app.js and applies the secondary-school adaptive bank directly.
   It changes only the current task type: "المرحلة الثانوية". */
(function () {
    "use strict";

    const OTHER = "أخرى";

    function uniqueWithOther(items) {
        const result = [];
        (items || []).forEach((item) => {
            if (item && item !== OTHER && !result.includes(item)) result.push(item);
        });
        result.push(OTHER);
        return result;
    }

    const GRADES = uniqueWithOther([
        "الصف الأول الثانوي",
        "الصف الثاني الثانوي",
        "الصف الثالث الثانوي",
        "مراجعة عامة للمرحلة الثانوية"
    ]);

    const SUBJECTS = uniqueWithOther([
        "القرآن الكريم",
        "التربية الإسلامية",
        "اللغة العربية",
        "اللغة الإنجليزية",
        "الرياضيات",
        "الفيزياء",
        "الكيمياء",
        "الأحياء",
        "التاريخ",
        "الجغرافيا",
        "الدراسات الاجتماعية والمواطنة",
        "علوم الأرض والبيئة",
        "الحاسوب وتقنية المعلومات",
        "المهارات الدراسية وتنظيم المذاكرة",
        "البحث والقراءة الإثرائية",
        "الاختبارات والمراجعة النهائية"
    ]);

    const DETAILS = {
        "القرآن الكريم": uniqueWithOther([
            "سور المقرر",
            "آيات الحفظ المقررة",
            "مقطع الحفظ",
            "صفحة من المقرر",
            "مراجعة محفوظ سابق",
            "مراجعة مقرر الصف",
            "تلاوة مقرر الصف",
            "تفسير آيات المقرر",
            "معاني المفردات",
            "أسباب النزول إن وجدت",
            "الفوائد والهدايات",
            "أحكام التجويد المقررة",
            "المتشابهات",
            "الوقف والابتداء",
            "اختبار حفظ",
            "اختبار تلاوة"
        ]),

        /* التربية الإسلامية: خمسة خيارات فقط كما هو مطلوب */
        "التربية الإسلامية": [
            "الإيمان",
            "الحديث",
            "الفقه",
            "السيرة",
            OTHER
        ],

        "اللغة العربية": uniqueWithOther([
            "النحو",
            "الصرف",
            "البلاغة",
            "الأدب",
            "القراءة",
            "التعبير",
            "الإملاء",
            "النصوص",
            "المحفوظات",
            "القواعد اللغوية",
            "تحليل نص",
            "مراجعة وحدة",
            "مراجعة اختبار",
            "الجملة الاسمية",
            "الجملة الفعلية",
            "المبتدأ والخبر",
            "الفعل والفاعل",
            "المفعول به",
            "النواسخ",
            "كان وأخواتها",
            "إن وأخواتها",
            "الحال",
            "التمييز",
            "النعت",
            "العطف",
            "البدل",
            "التوكيد",
            "علامات الإعراب",
            "المبني والمعرب",
            "الميزان الصرفي",
            "الفعل الصحيح والمعتل",
            "المجرد والمزيد",
            "المشتقات",
            "اسم الفاعل",
            "اسم المفعول",
            "اسم التفضيل",
            "صيغ المبالغة",
            "المصدر",
            "الإعلال والإبدال",
            "التشبيه",
            "الاستعارة",
            "الكناية",
            "المجاز",
            "الطباق",
            "المقابلة",
            "الجناس",
            "السجع",
            "الأسلوب الخبري",
            "الأسلوب الإنشائي",
            "تحليل صورة بلاغية",
            "الفكرة العامة",
            "الأفكار الجزئية",
            "معاني المفردات",
            "تحليل الأسلوب",
            "كتابة فقرة",
            "كتابة موضوع",
            "المقدمة والخاتمة",
            "ترتيب الأفكار",
            "الاستشهاد",
            "علامات الترقيم"
        ]),

        /* English subject: Arabic-first labels as requested */
        "اللغة الإنجليزية": uniqueWithOther([
            "القراءة",
            "الكتابة",
            "القواعد",
            "المفردات",
            "الاستماع",
            "المحادثة",
            "الترجمة",
            "النطق",
            "تدريب الاختبار",
            "نص قراءة",
            "مهمة كتابة",
            "وحدة قواعد",
            "وحدة مفردات",
            "تدريب استماع",
            "تدريب تحدث",
            "الفكرة العامة",
            "التفاصيل الداعمة",
            "معاني الكلمات من السياق",
            "الاستنتاج",
            "الضمائر والإحالات",
            "القراءة السريعة",
            "البحث عن معلومة محددة",
            "أسئلة صح أو خطأ",
            "نص فهم مقروء",
            "كتابة جمل صحيحة",
            "كتابة فقرة",
            "جملة الموضوع",
            "الجمل الداعمة",
            "جملة الخاتمة",
            "أساسيات المقال",
            "كتابة بريد إلكتروني",
            "وصف صورة",
            "تصحيح أخطاء الكتابة",
            "ترتيب الأفكار",
            "الأزمنة",
            "المضارع البسيط",
            "المضارع المستمر",
            "الماضي البسيط",
            "الماضي المستمر",
            "المستقبل",
            "الأفعال الناقصة",
            "الجمل الشرطية",
            "المبني للمجهول",
            "الكلام المنقول",
            "ضمائر الوصل",
            "أدوات التعريف والتنكير",
            "حروف الجر",
            "المقارنة والتفضيل",
            "كلمات المدرسة",
            "كلمات الحياة اليومية",
            "كلمات أكاديمية",
            "المترادفات والمتضادات",
            "عائلات الكلمات",
            "الأفعال المركبة",
            "الكلمات المتلازمة",
            "الإملاء",
            "كلمات الوحدة"
        ]),

        "الرياضيات": uniqueWithOther([
            "الجبر",
            "الهندسة",
            "الهندسة التحليلية",
            "الدوال",
            "المعادلات والمتباينات",
            "المثلثات",
            "التفاضل",
            "التكامل",
            "الإحصاء والاحتمالات",
            "المتتاليات والمتسلسلات",
            "مراجعة قوانين",
            "مراجعة وحدة",
            "مراجعة اختبار",
            "العمليات الجبرية",
            "التحليل",
            "المقادير الجبرية",
            "الكسور الجبرية",
            "المعادلات الخطية",
            "المعادلات التربيعية",
            "المعادلات الأسية",
            "المعادلات اللوغاريتمية",
            "المتطابقات",
            "النقاط والمستقيمات",
            "الزوايا",
            "التطابق والتشابه",
            "الدائرة",
            "المضلعات",
            "المساحة",
            "الحجم",
            "البراهين الهندسية",
            "مفهوم الدالة",
            "مجال ومدى الدالة",
            "الدوال الخطية",
            "الدوال التربيعية",
            "الدوال الأسية",
            "الدوال اللوغاريتمية",
            "تحويلات الدوال",
            "رسم الدوال",
            "النهايات",
            "الاتصال",
            "المشتقة",
            "قواعد الاشتقاق",
            "تطبيقات المشتقة",
            "التكامل غير المحدد",
            "التكامل المحدد",
            "المساحة تحت المنحنى",
            "المتوسط",
            "الوسيط",
            "المنوال",
            "المدى",
            "الانحراف المعياري",
            "التمثيل البياني",
            "الاحتمال",
            "الاحتمال الشرطي",
            "التباديل والتوافيق"
        ]),

        "الفيزياء": uniqueWithOther([
            "الوحدة الأولى",
            "الوحدة الثانية",
            "الوحدة الثالثة",
            "الوحدة الرابعة",
            "الوحدة الخامسة",
            "الوحدة السادسة",
            "الوحدة السابعة",
            "الوحدة الثامنة",
            "الوحدة التاسعة",
            "مختبر وتجارب",
            "قوانين الفيزياء",
            "مسائل الفيزياء",
            "مراجعة اختبار",
            "القياس والوحدات",
            "الكميات القياسية والمتجهة",
            "الحركة في خط مستقيم",
            "الحركة بعجلة",
            "القوى وقوانين نيوتن",
            "الشغل والطاقة",
            "القدرة",
            "الزخم والدفع",
            "الحركة الدائرية",
            "الجاذبية",
            "الحرارة ودرجة الحرارة",
            "التمدد الحراري",
            "الكهرباء الساكنة",
            "التيار الكهربائي",
            "الدوائر الكهربائية",
            "المغناطيسية",
            "الحث الكهرومغناطيسي",
            "الموجات",
            "الصوت",
            "الضوء",
            "العدسات والمرايا",
            "الفيزياء الحديثة",
            "الذرة والنواة"
        ]),

        "الكيمياء": uniqueWithOther([
            "الوحدة الأولى",
            "الوحدة الثانية",
            "الوحدة الثالثة",
            "الوحدة الرابعة",
            "الوحدة الخامسة",
            "الوحدة السادسة",
            "الوحدة السابعة",
            "الوحدة الثامنة",
            "الوحدة التاسعة",
            "مختبر وتجارب",
            "المعادلات والتفاعلات",
            "الحسابات الكيميائية",
            "مراجعة اختبار",
            "المادة وخواصها",
            "الذرة والجزيء",
            "الجدول الدوري",
            "الروابط الكيميائية",
            "المعادلات الكيميائية",
            "المول والحسابات الكيميائية",
            "المحاليل",
            "الأحماض والقواعد",
            "الأكسدة والاختزال",
            "الاتزان الكيميائي",
            "سرعة التفاعل",
            "الطاقة في التفاعلات",
            "الكيمياء العضوية",
            "الهيدروكربونات",
            "المجموعات الوظيفية",
            "الكيمياء الحيوية",
            "السلامة في المختبر"
        ]),

        "الأحياء": uniqueWithOther([
            "الوحدة الأولى",
            "الوحدة الثانية",
            "الوحدة الثالثة",
            "الوحدة الرابعة",
            "الوحدة الخامسة",
            "الوحدة السادسة",
            "الوحدة السابعة",
            "الوحدة الثامنة",
            "الوحدة التاسعة",
            "مختبر ورسومات",
            "مصطلحات أحيائية",
            "عمليات حيوية",
            "مراجعة اختبار",
            "الخلية",
            "الأنسجة",
            "الأجهزة الحيوية",
            "التغذية والهضم",
            "التنفس",
            "الدوران",
            "الإخراج",
            "الجهاز العصبي",
            "الغدد والهرمونات",
            "التكاثر",
            "الوراثة",
            "DNA والجينات",
            "التطور والتنوع الحيوي",
            "النبات",
            "البيئة",
            "الميكروبات",
            "المناعة"
        ]),

        "التاريخ": uniqueWithOther([
            "الوحدة الأولى",
            "الوحدة الثانية",
            "الوحدة الثالثة",
            "الوحدة الرابعة",
            "الوحدة الخامسة",
            "الوحدة السادسة",
            "الوحدة السابعة",
            "الوحدة الثامنة",
            "الوحدة التاسعة",
            "شخصيات تاريخية",
            "خرائط زمنية",
            "أسباب ونتائج",
            "مراجعة اختبار",
            "الحضارات القديمة",
            "التاريخ الإسلامي",
            "الدولة الأموية",
            "الدولة العباسية",
            "الأندلس",
            "العصر الحديث",
            "الثورات والحركات الوطنية",
            "الحروب العالمية",
            "تاريخ الوطن العربي",
            "تاريخ محلي",
            "شخصيات وأحداث",
            "تسلسل زمني"
        ]),

        "الجغرافيا": uniqueWithOther([
            "الوحدة الأولى",
            "الوحدة الثانية",
            "الوحدة الثالثة",
            "الوحدة الرابعة",
            "الوحدة الخامسة",
            "الوحدة السادسة",
            "الوحدة السابعة",
            "الوحدة الثامنة",
            "الوحدة التاسعة",
            "خرائط",
            "إحصاءات ورسوم",
            "مصطلحات جغرافية",
            "مراجعة اختبار",
            "الجغرافيا الطبيعية",
            "المناخ",
            "التضاريس",
            "المياه",
            "السكان",
            "العمران",
            "الزراعة",
            "الصناعة",
            "التجارة",
            "النقل",
            "الموارد الطبيعية",
            "البيئة",
            "الخرائط",
            "الموقع الجغرافي"
        ]),

        "الدراسات الاجتماعية والمواطنة": uniqueWithOther([
            "المواطنة",
            "المجتمع",
            "الدستور والقانون",
            "الحقوق والواجبات",
            "المؤسسات",
            "القيم والسلوك",
            "القضايا المعاصرة",
            "البحث المجتمعي",
            "مراجعة اختبار"
        ]),

        "علوم الأرض والبيئة": uniqueWithOther([
            "الوحدة الأولى",
            "الوحدة الثانية",
            "الوحدة الثالثة",
            "الوحدة الرابعة",
            "الوحدة الخامسة",
            "الوحدة السادسة",
            "الوحدة السابعة",
            "الوحدة الثامنة",
            "الوحدة التاسعة",
            "تجارب وملاحظات",
            "مراجعة اختبار",
            "الصخور والمعادن",
            "القشرة الأرضية",
            "البراكين",
            "الزلازل",
            "الصفائح التكتونية",
            "الطقس والمناخ",
            "المياه الجوفية",
            "الموارد الطبيعية",
            "التلوث",
            "التغير المناخي",
            "النظم البيئية",
            "حماية البيئة"
        ]),

        "الحاسوب وتقنية المعلومات": uniqueWithOther([
            "أساسيات الحاسوب",
            "نظم التشغيل",
            "معالجة النصوص",
            "العروض التقديمية",
            "الجداول الإلكترونية",
            "الإنترنت",
            "السلامة الرقمية",
            "مبادئ البرمجة",
            "مشروع حاسوبي",
            "مراجعة اختبار"
        ]),

        "المهارات الدراسية وتنظيم المذاكرة": uniqueWithOther([
            "تنظيم جدول",
            "مراجعة يومية",
            "مراجعة أسبوعية",
            "تلخيص",
            "خرائط ذهنية",
            "بطاقات مراجعة",
            "اختبار ذاتي",
            "إدارة وقت",
            "مراجعة أخطاء",
            "خطة اختبار"
        ]),

        "البحث والقراءة الإثرائية": uniqueWithOther([
            "بحث قصير",
            "قراءة خارجية",
            "مصادر متعددة",
            "تلخيص مصدر",
            "مقارنة مصادر",
            "عرض معلومات",
            "مقال علمي مبسط",
            "مشروع إثرائي",
            "موضوع من اختيار الطالب",
            "موضوع علمي",
            "موضوع ديني",
            "موضوع لغوي",
            "موضوع تاريخي",
            "موضوع جغرافي",
            "موضوع بيئي",
            "موضوع صحي",
            "موضوع تقني",
            "موضوع اجتماعي"
        ]),

        "الاختبارات والمراجعة النهائية": uniqueWithOther([
            "مراجعة درس",
            "مراجعة وحدة",
            "مراجعة مادة",
            "اختبار ذاتي",
            "حل نماذج",
            "مراجعة أخطاء",
            "خطة اختبار",
            "حفظ قوانين",
            "مراجعة ليلة الاختبار",
            "أسئلة السنوات السابقة"
        ]),

        "أخرى": uniqueWithOther([
            "موضوع يحدده الطالب",
            "وحدة من المقرر",
            "درس من الكتاب",
            "مراجعة خاصة"
        ])
    };

    const ISLAMIC_ACTIVITIES = {
        "الإيمان": uniqueWithOther([
            "دراسة درس الإيمان",
            "تلخيص المفاهيم الأساسية",
            "حفظ دليل شرعي",
            "شرح معنى الدليل",
            "ربط الدرس بالسلوك اليومي",
            "عمل خريطة ذهنية لأركان الإيمان",
            "حل أسئلة الكتاب",
            "إعداد اختبار ذاتي",
            "مراجعة أخطاء الدرس",
            "مراجعة قبل اختبار التربية الإسلامية"
        ]),
        "الحديث": uniqueWithOther([
            "حفظ الحديث",
            "قراءة شرح الحديث",
            "شرح معاني المفردات",
            "استخراج فوائد الحديث",
            "معرفة راوي الحديث إن كان مقرراً",
            "ربط الحديث بسلوك عملي",
            "حل أسئلة الحديث",
            "تسميع الحديث",
            "مراجعة أحاديث الوحدة",
            "مراجعة قبل اختبار الحديث"
        ]),
        "الفقه": uniqueWithOther([
            "دراسة حكم فقهي",
            "تلخيص الشروط والأركان",
            "حفظ دليل فقهي",
            "حل مسائل فقهية",
            "مقارنة حالات فقهية",
            "كتابة جدول أحكام",
            "ربط الحكم بموقف يومي",
            "مراجعة أسئلة الفقه",
            "مراجعة قبل اختبار الفقه"
        ]),
        "السيرة": uniqueWithOther([
            "قراءة درس من السيرة",
            "تلخيص الحدث",
            "ترتيب أحداث السيرة زمنياً",
            "استخراج الدروس والعبر",
            "كتابة أهم الشخصيات والأحداث",
            "ربط موقف من السيرة بالحياة",
            "حل أسئلة السيرة",
            "مراجعة أحداث الوحدة",
            "مراجعة قبل اختبار السيرة"
        ]),
        "أخرى": uniqueWithOther([
            "كتابة موضوع من مقرر التربية الإسلامية",
            "دراسة درس يحدده الطالب",
            "تلخيص موضوع خاص",
            "مراجعة أسئلة خاصة",
            "إعداد بحث قصير"
        ])
    };

    const ACTIVITIES = {
        "القرآن الكريم": uniqueWithOther([
            "حفظ مقطع جديد",
            "تكرار الآيات للحفظ",
            "تقسيم المقطع إلى أجزاء صغيرة",
            "تسميع ذاتي",
            "تسميع لشخص آخر",
            "مراجعة محفوظ سابق",
            "تثبيت الحفظ",
            "ربط الآيات بالمعنى",
            "كتابة الأخطاء بعد التسميع",
            "مراجعة المتشابهات",
            "تلاوة بتأنٍ",
            "الاستماع لقارئ ثم التلاوة",
            "قراءة تفسير مبسط",
            "تلخيص معاني الآيات",
            "استخراج الفوائد والهدايات",
            "تطبيق حكم تجويدي على الآيات",
            "تسجيل التلاوة ومراجعتها",
            "اختبار حفظ قصير",
            "مراجعة قبل اختبار القرآن"
        ]),
        "التربية الإسلامية": uniqueWithOther(Object.values(ISLAMIC_ACTIVITIES).flat().filter(Boolean)),
        "اللغة العربية": uniqueWithOther([
            "دراسة قاعدة",
            "إعراب جمل",
            "تحليل أمثلة",
            "حل تدريبات",
            "تصحيح أخطاء نحوية",
            "تلخيص قاعدة في جدول",
            "تحليل كلمة صرفياً",
            "استخدام الميزان الصرفي",
            "استخراج مشتقات",
            "استخراج صورة بلاغية",
            "تحليل أثر بلاغي",
            "قراءة نص",
            "استخراج الفكرة العامة",
            "تلخيص نص",
            "تحليل نص أدبي",
            "كتابة فقرة",
            "كتابة موضوع تعبير",
            "مراجعة إملاء",
            "حفظ أبيات",
            "تحليل أبيات",
            "اختبار ذاتي",
            "مراجعة قبل اختبار"
        ]),
        "اللغة الإنجليزية": uniqueWithOther([
            "قراءة نص",
            "استخراج الفكرة العامة",
            "حل أسئلة فهم",
            "تحديد كلمات جديدة",
            "استخراج معنى كلمة من السياق",
            "تلخيص النص بالعربية أو الإنجليزية",
            "دراسة قاعدة",
            "حل تمارين قواعد",
            "تصحيح جمل",
            "كتابة جمل",
            "كتابة فقرة",
            "تحسين فقرة",
            "كتابة موضوع قصير",
            "حفظ كلمات",
            "استخدام الكلمات في جمل",
            "اختبار إملاء كلمات",
            "الاستماع لمقطع",
            "تدوين ملاحظات من الاستماع",
            "تكرار الجمل لتحسين النطق",
            "تسجيل الصوت ومراجعته",
            "إجابة أسئلة شفهية",
            "تدريب محادثة قصيرة",
            "ترجمة جمل",
            "ترجمة فقرة قصيرة",
            "مراجعة أخطاء",
            "اختبار ذاتي",
            "مراجعة قبل اختبار"
        ]),
        "الرياضيات": uniqueWithOther([
            "دراسة قاعدة",
            "فهم مثال محلول",
            "حل تمارين تدريجية",
            "حل واجب",
            "حل مسائل صعبة",
            "تلخيص خطوات الحل",
            "مراجعة قوانين",
            "إعادة حل أخطاء",
            "تصنيف أنواع المسائل",
            "رسم شكل هندسي",
            "كتابة برهان",
            "رسم دالة",
            "تحليل مجال ومدى",
            "حل اختبار تدريبي",
            "مراجعة قبل اختبار"
        ]),
        "الفيزياء": uniqueWithOther([
            "دراسة وحدة",
            "تلخيص قانون",
            "حل مسائل",
            "تحليل تجربة",
            "رسم مخطط فيزيائي",
            "تحويل وحدات",
            "استخراج المعطيات والمطلوب",
            "تطبيق قانون",
            "مراجعة أخطاء الحل",
            "كتابة تقرير تجربة",
            "ربط المفهوم بتطبيق حياتي",
            "حل اختبار ذاتي",
            "مراجعة قبل اختبار"
        ]),
        "الكيمياء": uniqueWithOther([
            "دراسة وحدة",
            "تلخيص مفاهيم",
            "حفظ قوانين أو تعاريف",
            "حل مسائل كيميائية",
            "موازنة معادلات",
            "تحليل تفاعل",
            "مقارنة خصائص",
            "رسم جدول مقارنة",
            "تحضير تجربة",
            "كتابة تقرير مختبر",
            "مراجعة أخطاء",
            "اختبار ذاتي",
            "مراجعة قبل اختبار"
        ]),
        "الأحياء": uniqueWithOther([
            "دراسة وحدة",
            "تلخيص درس",
            "رسم مخطط حيوي",
            "تسمية أجزاء رسم",
            "حفظ مصطلحات",
            "مقارنة عمليات حيوية",
            "شرح دورة حيوية",
            "حل أسئلة",
            "إعداد خريطة ذهنية",
            "كتابة تقرير مختبر",
            "اختبار ذاتي",
            "مراجعة قبل اختبار"
        ]),
        "التاريخ": uniqueWithOther([
            "دراسة درس",
            "تلخيص حدث",
            "ترتيب أحداث زمنياً",
            "عمل خط زمني",
            "مقارنة بين عصرين",
            "استخراج أسباب ونتائج",
            "حفظ تواريخ مهمة",
            "تحليل شخصية تاريخية",
            "حل أسئلة",
            "مراجعة قبل اختبار"
        ]),
        "الجغرافيا": uniqueWithOther([
            "دراسة درس",
            "تلخيص مفاهيم",
            "رسم خريطة",
            "تحليل خريطة",
            "قراءة جدول أو رسم بياني",
            "مقارنة مناطق",
            "حفظ مصطلحات",
            "حل أسئلة",
            "بحث قصير",
            "مراجعة قبل اختبار"
        ]),
        "الدراسات الاجتماعية والمواطنة": uniqueWithOther([
            "دراسة درس",
            "تلخيص مفهوم",
            "تحليل موقف",
            "ربط الدرس بالواقع",
            "كتابة رأي",
            "إعداد بحث قصير",
            "مناقشة قضية",
            "حل أسئلة",
            "مراجعة قبل اختبار"
        ]),
        "علوم الأرض والبيئة": uniqueWithOther([
            "دراسة وحدة",
            "تلخيص مفاهيم",
            "رسم دورة أو طبقات",
            "تحليل ظاهرة طبيعية",
            "قراءة خريطة أو رسم",
            "بحث قصير",
            "حل أسئلة",
            "مراجعة قبل اختبار"
        ]),
        "الحاسوب وتقنية المعلومات": uniqueWithOther([
            "دراسة درس",
            "تطبيق عملي",
            "إنشاء ملف",
            "تنظيم مجلدات",
            "إعداد عرض",
            "إنشاء جدول",
            "حل تمرين حاسوبي",
            "مراجعة خطوات",
            "مشروع صغير",
            "اختبار ذاتي",
            "مراجعة قبل اختبار"
        ]),
        "المهارات الدراسية وتنظيم المذاكرة": uniqueWithOther([
            "ترتيب جدول مذاكرة",
            "مراجعة درس سابق",
            "تلخيص درس",
            "إنشاء خريطة ذهنية",
            "إنشاء بطاقات",
            "حل اختبار ذاتي",
            "تحديد نقاط الضعف",
            "مراجعة أخطاء",
            "إعداد خطة اختبار",
            "تقييم التقدم الأسبوعي"
        ]),
        "البحث والقراءة الإثرائية": uniqueWithOther([
            "البحث عن مصادر",
            "قراءة مصدر",
            "تلخيص مصدر",
            "مقارنة مصدرين",
            "كتابة تقرير قصير",
            "إعداد عرض",
            "استخراج أفكار جديدة",
            "ربط الموضوع بالمقرر",
            "توثيق المصادر"
        ]),
        "الاختبارات والمراجعة النهائية": uniqueWithOther([
            "مراجعة مركزة",
            "حل نموذج",
            "تصحيح نموذج",
            "تحليل أخطاء",
            "إعادة حل أسئلة خاطئة",
            "حفظ قوانين",
            "مراجعة ملخص",
            "اختبار زمني",
            "تجهيز خطة آخر أسبوع",
            "تحديد نقاط الضعف"
        ]),
        "أخرى": uniqueWithOther([
            "دراسة درس",
            "حل تمارين",
            "تلخيص",
            "مراجعة",
            "اختبار ذاتي"
        ])
    };

    function byId(id) {
        return document.getElementById(id);
    }

    function currentType() {
        const input = byId("categorySelect");
        return (input && input.value ? input.value : "").trim();
    }

    function isSecondary() {
        const type = currentType();
        return type === "المرحلة الثانوية" || type === "Secondary School";
    }

    function setText(id, text) {
        const el = byId(id);
        if (el) el.textContent = text;
    }

    function optionValues(select) {
        return select ? Array.from(select.options).map((option) => option.value) : [];
    }

    function fillSelect(select, values, preferred) {
        if (!select) return;
        const items = uniqueWithOther(values || []);
        const previous = preferred || select.value || select.dataset.current || "";

        select.innerHTML = "";
        items.forEach((value) => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            if (previous === value) option.selected = true;
            select.appendChild(option);
        });

        if (!items.includes(previous)) select.value = items[0] || OTHER;
        select.dataset.current = select.value;
    }

    function ensureSecondaryBank() {
        const categoryInput = byId("categorySelect");
        if (categoryInput && categoryInput.value === "Secondary School") {
            categoryInput.value = "المرحلة الثانوية";
        }

        if (typeof SMART_TASK_DATA !== "undefined") {
            SMART_TASK_DATA["المرحلة الثانوية"] = {
                icon: "ث",
                main: GRADES,
                sub: {
                    "الصف الأول الثانوي": SUBJECTS,
                    "الصف الثاني الثانوي": SUBJECTS,
                    "الصف الثالث الثانوي": SUBJECTS,
                    "مراجعة عامة للمرحلة الثانوية": SUBJECTS,
                    "أخرى": SUBJECTS
                },
                detail: DETAILS,
                training: ["دراسة درس", "حل تمارين", "مراجعة", "اختبار ذاتي", OTHER]
            };

            if (SMART_TASK_DATA["Secondary School"]) {
                delete SMART_TASK_DATA["Secondary School"];
            }
        }
    }

    function activityList(subject, detail) {
        if (subject === "التربية الإسلامية") {
            return ISLAMIC_ACTIVITIES[detail] || ISLAMIC_ACTIVITIES[OTHER];
        }
        if (/اختبار|مراجعة اختبار|مراجعة نهائية|حل نماذج|أسئلة السنوات السابقة/.test(`${detail || ""}`)) {
            return ACTIVITIES["الاختبارات والمراجعة النهائية"];
        }
        return ACTIVITIES[subject] || ACTIVITIES[OTHER];
    }

    function suggestion(subject, detail, activity) {
        const text = `${subject || ""} ${detail || ""} ${activity || ""}`;

        if (/مراجعة ليلة الاختبار|اختبار تدريبي|اختبار زمني|حل نموذج|مراجعة نهائية|مراجعة قبل اختبار|اختبار حفظ|اختبار تلاوة/.test(text)) {
            return { difficulty: 5, priority: 5, minutes: 120, repeat: "يوميًا", note: "خطة مقترحة: مراجعة مركزة، حل أسئلة، تحليل الأخطاء، ثم إعادة حل النقاط الضعيفة." };
        }
        if (/حل مسائل صعبة|مسائل صعبة|تقرير|بحث قصير|مشروع|عرض|تحليل تجربة|مختبر|تجربة/.test(text)) {
            return { difficulty: 4, priority: 5, minutes: 90, repeat: "أسبوعيًا", note: "خطة مقترحة: حدّد المطلوب، نفّذ المهمة خطوة خطوة، ثم راجع الأخطاء أو الملاحظات قبل الحفظ النهائي." };
        }
        if (/حفظ مقطع|تكرار الآيات|حفظ الحديث|حفظ دليل|حفظ كلمات|حفظ قوانين|حفظ مصطلحات|مراجعة محفوظ|تسميع|إملاء|تثبيت الحفظ/.test(text)) {
            return { difficulty: 3, priority: 5, minutes: 35, repeat: "يوميًا", note: "خطة مقترحة: استخدم التكرار القصير والمراجعة المتباعدة، وسجّل الأخطاء التي تحتاج إلى تثبيت." };
        }
        if (/حل تمارين|حل واجب|حل أسئلة|حل مسائل|تطبيق قانون|إعراب|قواعد|تدريبات|تمرين/.test(text)) {
            return { difficulty: 3, priority: 4, minutes: 60, repeat: "أيام محددة", note: "خطة مقترحة: ابدأ بمثال محلول، ثم تمارين سهلة، ثم تمارين متوسطة، ثم راجع الأخطاء." };
        }
        if (/دراسة درس|دراسة وحدة|دراسة قاعدة|قراءة|تلخيص|فهم مثال|مراجعة درس سابق/.test(text)) {
            return { difficulty: 3, priority: 4, minutes: 50, repeat: "أسبوعيًا", note: "خطة مقترحة: اكتب ملخصاً قصيراً في نهاية المهمة وحدد ثلاث نقاط تحتاج إلى مراجعة لاحقة." };
        }
        if (/تنظيم جدول|مراجعة يومية|بطاقات|خريطة ذهنية|إدارة وقت|ترتيب جدول/.test(text)) {
            return { difficulty: 2, priority: 4, minutes: 30, repeat: "يوميًا", note: "خطة مقترحة: اجعل المهمة قصيرة ومنتظمة، وراجع الإنجاز في نهاية اليوم." };
        }

        return { difficulty: 3, priority: 4, minutes: 45, repeat: "أسبوعيًا", note: "خطة مقترحة: نفّذ مهمة واحدة واضحة، ثم اكتب ملاحظة قصيرة عن مستوى الفهم أو الأخطاء." };
    }

    function setSuggestionValues() {
        const subject = byId("skillSelect")?.value || OTHER;
        const detail = byId("detailedTopicSelect")?.value || OTHER;
        const activity = byId("trainingTypeSelect")?.value || OTHER;
        const suggested = suggestion(subject, detail, activity);

        const difficulty = document.querySelector('input[name="difficulty"]');
        const priority = document.querySelector('input[name="priority"]');
        const minutes = document.querySelector('input[name="estimated_minutes"]');
        const repeat = byId("repeatTypeSelect");
        const notes = byId("notesInput");
        const source = byId("sourceInput");

        if (difficulty) difficulty.value = suggested.difficulty;
        if (priority) priority.value = suggested.priority;
        if (minutes) minutes.value = suggested.minutes;

        if (repeat) {
            const values = optionValues(repeat);
            if (values.includes(suggested.repeat)) {
                repeat.value = suggested.repeat;
            }
            if (typeof updateRepeatDaysVisibility === "function") updateRepeatDaysVisibility();
        }

        if (notes && (!notes.value || notes.value.startsWith("خطة مقترحة:"))) {
            notes.value = suggested.note;
        }

        if (source) {
            source.placeholder = "الكتاب المدرسي، دفتر الطالب، ملخص المعلم، شرائح الدرس، فيديو تعليمي، موقع تعليمي، ملف PDF، مصدر إثرائي، أطلس أو خريطة، نموذج اختبار، أسئلة سابقة، مصحف، كتاب تفسير، تسجيل صوتي، أوراق عمل، أو أخرى";
        }
    }

    function toggleOtherBoxes() {
        const topicSelect = byId("topicSelect");
        const skillSelect = byId("skillSelect");
        const detailSelect = byId("detailedTopicSelect");
        const trainingSelect = byId("trainingTypeSelect");

        const customTopicBox = byId("customTopicBox");
        const customSkillBox = byId("customSkillBox");
        const customDetailedTopicBox = byId("customDetailedTopicBox");
        const customTrainingTypeBox = byId("customTrainingTypeBox");

        if (customTopicBox) customTopicBox.style.display = topicSelect && topicSelect.value === OTHER ? "block" : "none";
        if (customSkillBox) customSkillBox.style.display = skillSelect && skillSelect.value === OTHER ? "block" : "none";
        if (customDetailedTopicBox) customDetailedTopicBox.style.display = detailSelect && detailSelect.value === OTHER ? "block" : "none";
        if (customTrainingTypeBox) customTrainingTypeBox.style.display = trainingSelect && trainingSelect.value === OTHER ? "block" : "none";
    }

    function restoreDefaultLabelsWhenNotSecondary() {
        if (isSecondary()) return;
        setText("topicLabel", "الفئة الرئيسية");
        setText("skillLabel", "الفئة الفرعية");
        setText("detailLabel", "الموضوع التفصيلي");
        setText("trainingLabel", "نوع النشاط");
    }

    function applySecondaryBank() {
        ensureSecondaryBank();

        if (!isSecondary()) {
            restoreDefaultLabelsWhenNotSecondary();
            return false;
        }

        const gradeSelect = byId("topicSelect");
        const subjectSelect = byId("skillSelect");
        const detailSelect = byId("detailedTopicSelect");
        const activitySelect = byId("trainingTypeSelect");

        if (!gradeSelect || !subjectSelect || !detailSelect || !activitySelect) return false;

        setText("topicLabel", "الصف الدراسي أو السنة الدراسية");
        setText("skillLabel", "المادة الدراسية");
        setText("detailLabel", "الوحدة أو الدرس أو المقرر حسب المادة");
        setText("trainingLabel", "ماذا سيفعل الطالب فعلياً؟");
        setText("sourceLabel", "المصدر أو الرابط");
        setText("difficultyLabel", "مستوى الصعوبة من ١ إلى ٥");
        setText("priorityLabel", "الأولوية من ١ إلى ٥");
        setText("expectedTimeLabel", "الوقت المتوقع بالدقائق");

        if (!GRADES.includes(gradeSelect.value) || optionValues(gradeSelect).join("|") !== GRADES.join("|")) {
            fillSelect(gradeSelect, GRADES, gradeSelect.value);
        }

        if (!SUBJECTS.includes(subjectSelect.value) || optionValues(subjectSelect).join("|") !== SUBJECTS.join("|")) {
            fillSelect(subjectSelect, SUBJECTS, subjectSelect.value);
        }

        const subject = subjectSelect.value || OTHER;
        const details = DETAILS[subject] || DETAILS[OTHER];
        if (!details.includes(detailSelect.value) || optionValues(detailSelect).join("|") !== details.join("|")) {
            fillSelect(detailSelect, details, detailSelect.value);
        }

        const activities = activityList(subjectSelect.value, detailSelect.value);
        if (!activities.includes(activitySelect.value) || optionValues(activitySelect).join("|") !== activities.join("|")) {
            fillSelect(activitySelect, activities, activitySelect.value);
        }

        setSuggestionValues();
        toggleOtherBoxes();
        return true;
    }

    const originalUpdateSmartTaskFields = (typeof updateSmartTaskFields === "function") ? updateSmartTaskFields : null;

    function patchedUpdateSmartTaskFields() {
        ensureSecondaryBank();

        if (isSecondary()) {
            applySecondaryBank();
            return;
        }

        if (originalUpdateSmartTaskFields) {
            originalUpdateSmartTaskFields();
        }

        restoreDefaultLabelsWhenNotSecondary();
    }

    try {
        window.updateSmartTaskFields = patchedUpdateSmartTaskFields;
        updateSmartTaskFields = patchedUpdateSmartTaskFields;
    } catch (error) {
        window.updateSmartTaskFields = patchedUpdateSmartTaskFields;
    }

    function wireSecondaryEvents() {
        ensureSecondaryBank();

        const run = () => {
            setTimeout(applySecondaryBank, 0);
            setTimeout(applySecondaryBank, 60);
            setTimeout(applySecondaryBank, 180);
        };

        document.addEventListener("click", (event) => {
            if (event.target.closest(".task-type-card")) {
                run();
            }
        }, true);

        ["categorySelect", "topicSelect", "skillSelect", "detailedTopicSelect", "trainingTypeSelect"].forEach((id) => {
            const el = byId(id);
            if (el) {
                el.addEventListener("change", () => {
                    if (id === "skillSelect") {
                        const detailSelect = byId("detailedTopicSelect");
                        const activitySelect = byId("trainingTypeSelect");
                        if (detailSelect) detailSelect.dataset.current = "";
                        if (activitySelect) activitySelect.dataset.current = "";
                    }
                    if (id === "detailedTopicSelect") {
                        const activitySelect = byId("trainingTypeSelect");
                        if (activitySelect) activitySelect.dataset.current = "";
                    }
                    run();
                }, true);
            }
        });

        if (typeof renderTaskTypeCards === "function") {
            try {
                renderTaskTypeCards();
            } catch (error) {
                console.warn("Secondary school task bank card refresh skipped", error);
            }
        }

        run();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", wireSecondaryEvents);
    } else {
        wireSecondaryEvents();
    }

    window.edupathSecondarySchoolTaskBankV55139 = {
        grades: GRADES,
        subjects: SUBJECTS,
        details: DETAILS,
        activities: ACTIVITIES,
        islamicActivities: ISLAMIC_ACTIVITIES,
        apply: applySecondaryBank
    };
})();
