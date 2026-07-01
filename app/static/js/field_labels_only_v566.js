(function () {
    const DEFAULT_FIELD_LABELS_V566 = {
        topic: "الفئة الرئيسية",
        main: "الفئة الرئيسية",
        skill: "الفئة الفرعية",
        sub: "الفئة الفرعية",
        detail: "الموضوع التفصيلي",
        training: "نوع النشاط"
    };

    const TASK_TYPE_FIELD_LABELS_V566 = {
        "حفظ القرآن الكريم": {topic: "نوع المتابعة القرآنية", main: "نوع المتابعة القرآنية", skill: "السورة أو مجال المتابعة", sub: "السورة أو مجال المتابعة", detail: "المقطع أو الآيات المحددة", training: "ماذا ستفعل فعلياً؟"},
        "المرحلة الثانوية": {topic: "الصف الدراسي أو السنة الدراسية", main: "الصف الدراسي أو السنة الدراسية", skill: "المادة الدراسية", sub: "المادة الدراسية", detail: "الوحدة أو الدرس أو المقرر حسب المادة", training: "ماذا سيفعل الطالب فعلياً؟"},
        "المرحلة الجامعية": {topic: "التخصص أو المجال الجامعي", main: "التخصص أو المجال الجامعي", skill: "نوع المهمة الجامعية", sub: "نوع المهمة الجامعية", detail: "المادة أو الموضوع الجامعي", training: "ماذا ستفعل فعلياً؟"},
        "اللغات": {topic: "اللغة", main: "اللغة", skill: "المهارة اللغوية", sub: "المهارة اللغوية", detail: "الموضوع أو الجانب اللغوي", training: "نوع التدريب"},
        "البرمجة والتكنولوجيا": {topic: "المجال التقني", main: "المجال التقني", skill: "المسار أو التقنية", sub: "المسار أو التقنية", detail: "الموضوع البرمجي أو المهارة التقنية", training: "نوع التطبيق أو التدريب"},
        "الذكاء الاصطناعي": {topic: "مجال الذكاء الاصطناعي", main: "مجال الذكاء الاصطناعي", skill: "المسار أو التقنية", sub: "المسار أو التقنية", detail: "الموضوع أو النموذج أو المفهوم", training: "نوع التطبيق أو التدريب"},
        "الرياضيات": {topic: "فرع الرياضيات", main: "فرع الرياضيات", skill: "الموضوع الرياضي", sub: "الموضوع الرياضي", detail: "الدرس أو المهارة الرياضية", training: "نوع التمرين أو المراجعة"},
        "المنح الدراسية": {topic: "نوع المنحة أو المرحلة", main: "نوع المنحة أو المرحلة", skill: "جزء التقديم أو المتطلب", sub: "جزء التقديم أو المتطلب", detail: "المستند أو الخطوة التفصيلية", training: "نوع العمل المطلوب"},
        "الاختبارات الدولية": {topic: "اسم الاختبار", main: "اسم الاختبار", skill: "قسم الاختبار", sub: "قسم الاختبار", detail: "نوع السؤال أو المهارة", training: "نوع التدريب أو المحاكاة"},
        "الحياة اليومية": {topic: "مجال الحياة اليومية", main: "مجال الحياة اليومية", skill: "نوع الروتين أو المسؤولية", sub: "نوع الروتين أو المسؤولية", detail: "المهمة أو العادة المحددة", training: "طريقة التنفيذ"},
        "المشاريع": {topic: "نوع المشروع", main: "نوع المشروع", skill: "مرحلة المشروع", sub: "مرحلة المشروع", detail: "الجزء أو المهمة داخل المشروع", training: "نوع التنفيذ"},
        "القراءة والبحث": {topic: "مجال القراءة أو البحث", main: "مجال القراءة أو البحث", skill: "نوع المصدر أو البحث", sub: "نوع المصدر أو البحث", detail: "الموضوع أو السؤال البحثي", training: "نوع القراءة أو المعالجة"},
        "عام": {topic: "المجال العام", main: "المجال العام", skill: "نوع المهمة", sub: "نوع المهمة", detail: "تفاصيل المهمة", training: "نوع النشاط"},
        "أخرى": {topic: "التصنيف المخصص", main: "التصنيف المخصص", skill: "النوع المخصص", sub: "النوع المخصص", detail: "التفاصيل المخصصة", training: "النشاط المخصص"}
    };

    const TASK_TYPE_ALIASES_V566 = {
        "Quran Memorization": "حفظ القرآن الكريم",
        "Quran": "حفظ القرآن الكريم",
        "Secondary School": "المرحلة الثانوية",
        "University": "المرحلة الجامعية",
        "University Study": "المرحلة الجامعية",
        "Languages": "اللغات",
        "Language": "اللغات",
        "Programming & Technology": "البرمجة والتكنولوجيا",
        "Programming and Technology": "البرمجة والتكنولوجيا",
        "البرمجة والتقنية": "البرمجة والتكنولوجيا",
        "Technology": "البرمجة والتكنولوجيا",
        "Artificial Intelligence": "الذكاء الاصطناعي",
        "AI": "الذكاء الاصطناعي",
        "Mathematics": "الرياضيات",
        "Math": "الرياضيات",
        "Scholarships": "المنح الدراسية",
        "Scholarship": "المنح الدراسية",
        "Exams & Certificates": "الاختبارات الدولية",
        "Exams and Certificates": "الاختبارات الدولية",
        "International Exams": "الاختبارات الدولية",
        "Exam / Certificate": "الاختبارات الدولية",
        "Exam": "الاختبارات الدولية",
        "Daily Life": "الحياة اليومية",
        "Projects": "المشاريع",
        "Reading & Research": "القراءة والبحث",
        "Reading and Research": "القراءة والبحث",
        "General": "عام",
        "Other": "أخرى"
    };

    function normalizeV566(value) {
        return String(value == null ? "" : value).trim();
    }

    function canonicalTypeV566(typeName) {
        const raw = normalizeV566(typeName);
        return TASK_TYPE_ALIASES_V566[raw] || raw;
    }

    function currentTaskTypeV566() {
        const categoryInput = document.getElementById("categorySelect");
        const raw = normalizeV566(categoryInput && categoryInput.value) || "عام";
        return canonicalTypeV566(raw);
    }

    function labelsForTypeV566(typeName) {
        const type = canonicalTypeV566(typeName);
        return Object.assign({}, DEFAULT_FIELD_LABELS_V566, TASK_TYPE_FIELD_LABELS_V566[type] || {});
    }

    function setLabelV566(id, text) {
        const el = document.getElementById(id);
        if (el && text && el.textContent !== text) el.textContent = text;
    }

    function applyFieldLabelsOnlyV566() {
        const labels = labelsForTypeV566(currentTaskTypeV566());
        setLabelV566("topicLabel", labels.topic || labels.main);
        setLabelV566("skillLabel", labels.skill || labels.sub);
        setLabelV566("detailLabel", labels.detail);
        setLabelV566("trainingLabel", labels.training);
    }

    window.EDUPATH_TASK_TYPE_FIELD_LABELS = Object.assign({}, window.EDUPATH_TASK_TYPE_FIELD_LABELS || {}, TASK_TYPE_FIELD_LABELS_V566);
    window.EDUPATH_GET_TASK_TYPE_FIELD_LABELS = labelsForTypeV566;
    window.EDUPATH_APPLY_FIELD_LABELS_ONLY_V566 = applyFieldLabelsOnlyV566;

    document.addEventListener("DOMContentLoaded", function () {
        applyFieldLabelsOnlyV566();
        [0, 30, 80, 160, 300, 600, 1000, 1600, 2400].forEach(function (delay) {
            setTimeout(applyFieldLabelsOnlyV566, delay);
        });

        ["categorySelect", "topicSelect", "skillSelect", "detailedTopicSelect", "trainingTypeSelect"].forEach(function (id) {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener("change", function () { setTimeout(applyFieldLabelsOnlyV566, 0); });
                el.addEventListener("input", function () { setTimeout(applyFieldLabelsOnlyV566, 0); });
            }
        });

        const labels = ["topicLabel", "skillLabel", "detailLabel", "trainingLabel"]
            .map(function (id) { return document.getElementById(id); })
            .filter(Boolean);
        if (labels.length && window.MutationObserver) {
            let locked = false;
            const observer = new MutationObserver(function () {
                if (locked) return;
                locked = true;
                setTimeout(function () {
                    applyFieldLabelsOnlyV566();
                    locked = false;
                }, 0);
            });
            labels.forEach(function (el) { observer.observe(el, {childList: true, characterData: true, subtree: true}); });
        }
    });
})();
