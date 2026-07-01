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
        "حفظ القرآن الكريم": {topic: "نوع المتابعة القرآنية", skill: "السورة أو مجال المتابعة", detail: "المقطع أو الآيات المحددة", training: "ماذا ستفعل فعلياً؟"},
        "المرحلة الثانوية": {topic: "الصف الدراسي أو السنة الدراسية", skill: "المادة الدراسية", detail: "الوحدة أو الدرس أو المقرر حسب المادة", training: "ماذا سيفعل الطالب فعلياً؟"},
        "المرحلة الجامعية": {topic: "التخصص أو المجال الجامعي", skill: "نوع المهمة الجامعية", detail: "المادة أو الموضوع الجامعي", training: "ماذا ستفعل فعلياً؟"},
        "اللغات": {topic: "اللغة", skill: "المهارة اللغوية", detail: "الموضوع أو الجانب اللغوي", training: "نوع التدريب"},
        "البرمجة والتكنولوجيا": {topic: "المجال التقني", skill: "المسار أو التقنية", detail: "الموضوع البرمجي أو المهارة التقنية", training: "نوع التطبيق أو التدريب"},
        "الذكاء الاصطناعي": {topic: "مجال الذكاء الاصطناعي", skill: "المسار أو التقنية", detail: "الموضوع أو النموذج أو المفهوم", training: "نوع التطبيق أو التدريب"},
        "الرياضيات": {topic: "فرع الرياضيات", skill: "الموضوع الرياضي", detail: "الدرس أو المهارة الرياضية", training: "نوع التمرين أو المراجعة"},
        "المنح الدراسية": {topic: "نوع المنحة أو المرحلة", skill: "جزء التقديم أو المتطلب", detail: "المستند أو الخطوة التفصيلية", training: "نوع العمل المطلوب"},
        "الاختبارات الدولية": {topic: "اسم الاختبار", skill: "قسم الاختبار", detail: "نوع السؤال أو المهارة", training: "نوع التدريب أو المحاكاة"},
        "الحياة اليومية": {topic: "مجال الحياة اليومية", skill: "نوع الروتين أو المسؤولية", detail: "المهمة أو العادة المحددة", training: "طريقة التنفيذ"},
        "المشاريع": {topic: "نوع المشروع", skill: "مرحلة المشروع", detail: "الجزء أو المهمة داخل المشروع", training: "نوع التنفيذ"},
        "القراءة والبحث": {topic: "مجال القراءة أو البحث", skill: "نوع المصدر أو البحث", detail: "الموضوع أو السؤال البحثي", training: "نوع القراءة أو المعالجة"},
        "عام": {topic: "المجال العام", skill: "نوع المهمة", detail: "تفاصيل المهمة", training: "نوع النشاط"},
        "أخرى": {topic: "التصنيف المخصص", skill: "النوع المخصص", detail: "التفاصيل المخصصة", training: "النشاط المخصص"}
    };

    const DEFAULT_FIELD_LABELS = {topic: "الفئة الرئيسية", skill: "الفئة الفرعية", detail: "الموضوع التفصيلي", training: "نوع النشاط"};

    function fixedLabelsForType(typeName) {
        return Object.assign({}, DEFAULT_FIELD_LABELS, TASK_TYPE_FIELD_LABELS[normalize(typeName)] || {});
    }

    function mergeFixedLabels(typeName, config) {
        const cfg = config || {};
        cfg.labels = Object.assign({}, fixedLabelsForType(typeName), cfg.labels || {});
        return cfg;
    }

    function getData() {
        window.EDUPATH_TASKS_AR_DATA = window.EDUPATH_TASKS_AR_DATA || {};
        return window.EDUPATH_TASKS_AR_DATA;
    }

    function getConfig(typeName) {
        const data = getData();
        const type = normalize(typeName || (document.getElementById("categorySelect") || {}).value || "عام");
        const cfg = data[type] || data["عام"] || {};
        return mergeFixedLabels(type, ensureShape(cfg));
    }

    function deepMerge(base, override) {
        if (Array.isArray(override)) return unique(override);
        if (!override || typeof override !== "object") return override;
        const output = (base && typeof base === "object" && !Array.isArray(base)) ? clone(base) : {};
        Object.keys(override).forEach((key) => {
            const next = override[key];
            if (Array.isArray(next)) output[key] = unique(next);
            else if (next && typeof next === "object") output[key] = deepMerge(output[key], next);
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
            data[typeName] = ensureShape(deepMerge(data[typeName] || {}, override));
        });
        Object.keys(data || {}).forEach((typeName) => {
            data[typeName] = mergeFixedLabels(typeName, ensureShape(data[typeName]));
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
        const labels = Object.assign({}, fixedLabelsForType(type), cfg.labels || {});
        setText("taskNameLabel", labels.taskName || labels.title);
        setText("topicLabel", labels.topic);
        setText("skillLabel", labels.skill);
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
    window.EDUPATH_APPLY_TASK_BANK_RUNTIME = function () { applyTaskBankOverrides(); applyTaskBankLabels(); };
    window.EDUPATH_TASK_BANK_BOOT = function () { bootTaskBank(); installBindings(); };
    window.EDUPATH_TASK_TYPE_FIELD_LABELS = TASK_TYPE_FIELD_LABELS;
    window.EDUPATH_GET_TASK_TYPE_FIELD_LABELS = fixedLabelsForType;
    window.EDUPATH_GET_TASK_BANK_CONFIG = getConfig;
    window.EDUPATH_CLONE_TASK_BANK_CONFIG = function (typeName) { return clone(getConfig(typeName)); };
})();
