(function () {
    const clone = (obj) => JSON.parse(JSON.stringify(obj || {}));
    const normalize = (value) => String(value == null ? "" : value).trim();
    const unique = (items) => {
        const out = [];
        (items || []).forEach((item) => {
            const text = normalize(item);
            if (text && !out.includes(text)) out.push(text);
        });
        return out.length ? out : ["أخرى"];
    };


    const TASK_TYPE_FIELD_LABELS = {
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

    const DEFAULT_FIELD_LABELS = {topic: "الفئة الرئيسية", main: "الفئة الرئيسية", skill: "الفئة الفرعية", sub: "الفئة الفرعية", detail: "الموضوع التفصيلي", training: "نوع النشاط"};

    const TASK_TYPE_LABEL_ALIASES = {
        "Quran Memorization": "حفظ القرآن الكريم",
        "Secondary School": "المرحلة الثانوية",
        "University": "المرحلة الجامعية",
        "University Study": "المرحلة الجامعية",
        "Languages": "اللغات",
        "Programming & Technology": "البرمجة والتكنولوجيا",
        "Programming and Technology": "البرمجة والتكنولوجيا",
        "البرمجة والتقنية": "البرمجة والتكنولوجيا",
        "Artificial Intelligence": "الذكاء الاصطناعي",
        "AI": "الذكاء الاصطناعي",
        "Mathematics": "الرياضيات",
        "Math": "الرياضيات",
        "Scholarships": "المنح الدراسية",
        "Exams & Certificates": "الاختبارات الدولية",
        "Exams and Certificates": "الاختبارات الدولية",
        "International Exams": "الاختبارات الدولية",
        "Exam / Certificate": "الاختبارات الدولية",
        "Daily Life": "الحياة اليومية",
        "Projects": "المشاريع",
        "Reading & Research": "القراءة والبحث",
        "Reading and Research": "القراءة والبحث",
        "General": "عام",
        "Other": "أخرى"
    };

    function fixedLabelsForType(typeName) {
        return Object.assign({}, DEFAULT_FIELD_LABELS, TASK_TYPE_FIELD_LABELS[TASK_TYPE_LABEL_ALIASES[normalize(typeName)] || normalize(typeName)] || {});
    }

    // Labels are display-only. Never write fixed labels into the task-bank config.
    function labelsForDisplay(typeName, config) {
        return Object.assign({}, DEFAULT_FIELD_LABELS, (config && config.labels) || {}, fixedLabelsForType(typeName));
    }

    function getData() {
        window.EDUPATH_TASKS_AR_DATA = window.EDUPATH_TASKS_AR_DATA || {};
        return window.EDUPATH_TASKS_AR_DATA;
    }

    function getConfig(typeName) {
        const data = getData();
        const type = normalize(typeName || (document.getElementById("categorySelect") || {}).value || "عام");
        const cfg = data[type] || data["عام"] || {};
        return ensureShape(cfg);
    }

    function mergeLists(baseList, overrideList, repairMode) {
        const next = unique(overrideList || []);
        if (!repairMode) return next;
        return unique([...(Array.isArray(baseList) ? baseList : []), ...next]);
    }

    function deepMerge(base, override, repairMode) {
        if (Array.isArray(override)) return mergeLists(Array.isArray(base) ? base : [], override, repairMode);
        if (!override || typeof override !== "object") return override;
        const output = (base && typeof base === "object" && !Array.isArray(base)) ? clone(base) : {};
        Object.keys(override).forEach((key) => {
            if (key === "__edupathAdminFullConfig") return;
            const next = override[key];
            if (Array.isArray(next)) output[key] = mergeLists(output[key], next, repairMode);
            else if (next && typeof next === "object") output[key] = deepMerge(output[key], next, repairMode);
            else output[key] = next;
        });
        return output;
    }

    function ensureShape(config) {
        const cfg = config || {};
        cfg.icon = cfg.icon || cfg.typeIcon || "✨";
        cfg.main = Array.isArray(cfg.main) ? unique(cfg.main) : ["أخرى"];
        cfg.sub = cfg.sub && typeof cfg.sub === "object" ? cfg.sub : {};
        cfg.detail = cfg.detail && typeof cfg.detail === "object" ? cfg.detail : {};
        cfg.training = Array.isArray(cfg.training) ? unique(cfg.training) : ["أخرى"];
        cfg.trainingByDetail = cfg.trainingByDetail && typeof cfg.trainingByDetail === "object" ? cfg.trainingByDetail : {};
        cfg.subByPath = cfg.subByPath && typeof cfg.subByPath === "object" ? cfg.subByPath : {};
        cfg.detailByPath = cfg.detailByPath && typeof cfg.detailByPath === "object" ? cfg.detailByPath : {};
        cfg.trainingByPath = cfg.trainingByPath && typeof cfg.trainingByPath === "object" ? cfg.trainingByPath : {};
        cfg.recommendationsByPath = cfg.recommendationsByPath && typeof cfg.recommendationsByPath === "object" ? cfg.recommendationsByPath : {};
        cfg.sourceSuggestionsByPath = cfg.sourceSuggestionsByPath && typeof cfg.sourceSuggestionsByPath === "object" ? cfg.sourceSuggestionsByPath : {};
        cfg.hidden = cfg.hidden && typeof cfg.hidden === "object" ? cfg.hidden : {};
        cfg.hiddenByPath = cfg.hiddenByPath && typeof cfg.hiddenByPath === "object" ? cfg.hiddenByPath : {};
        ["main", "sub", "detail", "training"].forEach((level) => {
            if (!Array.isArray(cfg.hidden[level])) cfg.hidden[level] = [];
        });
        return cfg;
    }

    function mergeTaskBankOverrides(baseData, overrides) {
        const data = baseData || getData();
        Object.keys(overrides || {}).forEach((typeName) => {
            const override = overrides[typeName];
            if (!override || typeof override !== "object") return;
            const base = (window.EDUPATH_TASK_BANK_BASE_DATA && window.EDUPATH_TASK_BANK_BASE_DATA[typeName]) || data[typeName] || {};
            const repairMode = true; // v5.6.12: always protect the original full bank; Admin overrides are merged over the base, never allowed to erase existing adaptive options by omission.
            data[typeName] = ensureShape(deepMerge(base, override, repairMode));
        });
        Object.keys(data || {}).forEach((typeName) => {
            data[typeName] = ensureShape(data[typeName]);
        });
        return data;
    }

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el && value) el.textContent = value;
    }

    function activeType() {
        const input = document.getElementById("categorySelect");
        return normalize(input && input.value) || "عام";
    }

    function applyTaskBankLabels() {
        const type = activeType();
        const cfg = getConfig(type);
        const labels = labelsForDisplay(type, cfg);
        setText("taskNameLabel", labels.taskName || labels.title);
        setText("topicLabel", labels.topic || labels.main);
        setText("skillLabel", labels.skill || labels.sub);
        setText("detailLabel", labels.detail);
        setText("trainingLabel", labels.training);
        setText("sourceLabel", labels.source);
        setText("difficultyLabel", labels.difficulty);
        setText("priorityLabel", labels.priority);
        setText("expectedTimeLabel", labels.expectedTime);
        setText("startDateLabel", labels.startDate);
        setText("endDateLabel", labels.endDate);
        setText("reminderLabel", labels.reminder);
        setText("repeatLabel", labels.repeat);
        setText("repeatDaysLabel", labels.repeatDays);
        setText("notesLabel", labels.notes);
    }

    function applyTaskBankOverrides() {
        const overrides = window.EDUPATH_TASK_BANK_OVERRIDES || window.EDUPATH_TASKS_BANK_OVERRIDES || {};
        mergeTaskBankOverrides(getData(), overrides);
    }

    function bootTaskBank() {
        applyTaskBankOverrides();
        if (window.EDUPATH_NATIVE_TASKS_INIT) window.EDUPATH_NATIVE_TASKS_INIT();
        applyTaskBankLabels();
        if (window.EDUPATH_APPLY_FIELD_LABELS_ONLY_V565) window.EDUPATH_APPLY_FIELD_LABELS_ONLY_V565();
        document.dispatchEvent(new CustomEvent("edupath:task-bank-ready"));
    }

    function installBindings() {
        ["categorySelect", "topicSelect", "skillSelect", "detailedTopicSelect", "trainingTypeSelect"].forEach((id) => {
            const el = document.getElementById(id);
            if (el && !el.dataset.bankRuntimeBound) {
                el.dataset.bankRuntimeBound = "1";
                el.addEventListener("change", applyTaskBankLabels);
                el.addEventListener("input", applyTaskBankLabels);
            }
        });
    }

    window.EDUPATH_MERGE_TASK_BANK_OVERRIDES = mergeTaskBankOverrides;
    window.EDUPATH_APPLY_TASK_BANK_OVERRIDES = applyTaskBankOverrides;
    window.EDUPATH_APPLY_TASK_BANK_RUNTIME = function () { applyTaskBankOverrides(); applyTaskBankLabels(); if (window.EDUPATH_APPLY_FIELD_LABELS_ONLY_V565) window.EDUPATH_APPLY_FIELD_LABELS_ONLY_V565(); };
    window.EDUPATH_TASK_BANK_BOOT = function () { bootTaskBank(); installBindings(); };
    window.EDUPATH_TASK_TYPE_FIELD_LABELS = TASK_TYPE_FIELD_LABELS;
    window.EDUPATH_GET_TASK_TYPE_FIELD_LABELS = fixedLabelsForType;
    window.EDUPATH_GET_TASK_BANK_CONFIG = getConfig;
    window.EDUPATH_CLONE_TASK_BANK_CONFIG = function (typeName) { return clone(getConfig(typeName)); };
})();
