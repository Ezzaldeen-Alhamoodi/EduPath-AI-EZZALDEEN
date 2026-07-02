(function () {
    "use strict";

    const state = {
        currentType: "",
        config: null,
        baseConfig: null,
        draftConfig: null,
        publishedConfig: null,
        revisions: [],
        dirty: false,
        selectedLevel: "main",
        manualLevel: null,
        lastSnapshot: "",
        syncLock: false,
        lastClickedType: ""
    };

    const $ = (id) => document.getElementById(id);
    const normalize = (v) => String(v == null ? "" : v).trim();
    const clone = (obj) => JSON.parse(JSON.stringify(obj || {}));
    const esc = (v) => String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const pathKey = (...parts) => parts.map(normalize).filter(Boolean).join("::");

    const DEFAULT_LABELS = {main: "الفئة الرئيسية", sub: "الفئة الفرعية", detail: "الموضوع التفصيلي", training: "نوع النشاط"};
    const LEVELS = [
        {key: "main", selectId: "topicSelect", labelId: "topicLabel", defaultLabel: "الفئة الرئيسية"},
        {key: "sub", selectId: "skillSelect", labelId: "skillLabel", defaultLabel: "الفئة الفرعية"},
        {key: "detail", selectId: "detailedTopicSelect", labelId: "detailLabel", defaultLabel: "الموضوع التفصيلي"},
        {key: "training", selectId: "trainingTypeSelect", labelId: "trainingLabel", defaultLabel: "نوع النشاط"}
    ];

    function toast(message) {
        let box = document.createElement("div");
        box.className = "admin-bank-toast-v5600";
        box.textContent = message;
        document.body.appendChild(box);
        setTimeout(() => box.remove(), 3000);
    }

    function data() {
        window.EDUPATH_TASKS_AR_DATA = window.EDUPATH_TASKS_AR_DATA || {};
        return window.EDUPATH_TASKS_AR_DATA;
    }

    function unique(items) {
        const guard = window.EDUPATH_ENSURE_OTHER_OPTION;
        if (typeof guard === "function") return guard(items || []);
        const out = [];
        (items || []).forEach((item) => {
            let v = normalize(item);
            if (["Other", "other", "اخرى", "أُخرى"].includes(v)) v = "أخرى";
            if (v && v !== "أخرى" && !out.includes(v)) out.push(v);
        });
        out.push("أخرى");
        return out;
    }
    function isProtectedOther(value) {
        return (window.EDUPATH_IS_OTHER_OPTION && window.EDUPATH_IS_OTHER_OPTION(value)) || normalize(value) === "أخرى";
    }
    function normalizeConfigOther(cfg) {
        if (window.EDUPATH_NORMALIZE_ADAPTIVE_CONFIG) window.EDUPATH_NORMALIZE_ADAPTIVE_CONFIG(cfg);
        return cfg;
    }

    function ensureObj(v) { return v && typeof v === "object" && !Array.isArray(v) ? v : {}; }
    function ensureConfig(cfg) {
        const c = clone(cfg || {});
        c.icon = c.icon || c.typeIcon || "✨";
        c.typeIcon = c.typeIcon || c.icon || "✨";
        c.main = Array.isArray(c.main) ? unique(c.main) : ["أخرى"];
        c.sub = ensureObj(c.sub);
        c.detail = ensureObj(c.detail);
        c.training = Array.isArray(c.training) ? unique(c.training) : ["أخرى"];
        c.trainingByDetail = ensureObj(c.trainingByDetail);
        c.subByPath = ensureObj(c.subByPath);
        c.detailByPath = ensureObj(c.detailByPath);
        c.trainingByPath = ensureObj(c.trainingByPath);
        c.recommendations = ensureObj(c.recommendations);
        c.recommendationsByPath = ensureObj(c.recommendationsByPath);
        c.sourceSuggestions = Array.isArray(c.sourceSuggestions) ? unique(c.sourceSuggestions) : (c.sourceSuggestions || []);
        c.sourceSuggestionsByPath = ensureObj(c.sourceSuggestionsByPath);
        c.hidden = ensureObj(c.hidden);
        c.hiddenByPath = ensureObj(c.hiddenByPath);
        c.labels = ensureObj(c.labels);
        ["main", "sub", "detail", "training"].forEach((level) => {
            if (!Array.isArray(c.hidden[level])) c.hidden[level] = [];
        });
        return normalizeConfigOther(c);
    }

    function mergeLists(baseList, overrideList, repair) {
        const override = unique(overrideList || []);
        if (!repair) return override;
        return unique([...(Array.isArray(baseList) ? baseList : []), ...override]);
    }

    function deepMerge(base, override, repair) {
        if (Array.isArray(override)) return mergeLists(base, override, repair);
        if (!override || typeof override !== "object") return clone(base || {});
        const out = base && typeof base === "object" && !Array.isArray(base) ? clone(base) : {};
        Object.keys(override).forEach((key) => {
            if (key === "__edupathAdminFullConfig") return;
            const val = override[key];
            if (Array.isArray(val)) out[key] = mergeLists(out[key], val, repair);
            else if (val && typeof val === "object") out[key] = deepMerge(out[key], val, repair);
            else out[key] = val;
        });
        return out;
    }

    function buildMergedAdminConfig(baseConfig, publishedConfig, draftConfig) {
        const base = ensureConfig(baseConfig || {});
        if (draftConfig) return ensureConfig(deepMerge(base, draftConfig, true));
        if (publishedConfig) return ensureConfig(deepMerge(base, publishedConfig, true));
        return base;
    }

    function activeCardType() {
        const active = document.querySelector("#taskTypeCards .task-type-card.active");
        return normalize(active && active.dataset && active.dataset.type);
    }

    function typeFromForm() {
        const input = $("categorySelect");
        return normalize(state.lastClickedType) || activeCardType() || normalize(input && input.value) || "عام";
    }

    function resolveTypeKey(typeName) {
        const raw = normalize(typeName) || "عام";
        const all = data();
        if (all[raw]) return raw;
        const aliases = {
            "General": "عام", "Other": "أخرى", "Languages": "اللغات", "Projects": "المشاريع",
            "Programming & Technology": "البرمجة والتكنولوجيا", "AI": "الذكاء الاصطناعي",
            "Artificial Intelligence": "الذكاء الاصطناعي", "Secondary School": "المرحلة الثانوية",
            "University": "المرحلة الجامعية", "Scholarships": "المنح الدراسية",
            "Exams & Certificates": "الاختبارات الدولية", "Exam / Certificate": "الاختبارات الدولية",
            "International Exams": "الاختبارات الدولية", "Daily Life": "الحياة اليومية",
            "Reading & Research": "القراءة والبحث", "Mathematics": "الرياضيات",
            "Quran Memorization": "حفظ القرآن الكريم"
        };
        if (aliases[raw] && all[aliases[raw]]) return aliases[raw];
        const found = Object.keys(all).find((key) => normalize((all[key] || {}).displayName) === raw);
        return found || aliases[raw] || raw;
    }

    function selectedMain() { return normalize($("topicSelect") && $("topicSelect").value); }
    function selectedSub() { return normalize($("skillSelect") && $("skillSelect").value); }
    function selectedDetail() { return normalize($("detailedTopicSelect") && $("detailedTopicSelect").value); }
    function selectedTraining() { return normalize($("trainingTypeSelect") && $("trainingTypeSelect").value); }

    function levelMeta(level) { return LEVELS.find((l) => l.key === level) || LEVELS[0]; }
    function levelPath(level) {
        if (level === "main") return "";
        if (level === "sub") return pathKey(selectedMain());
        if (level === "detail") return pathKey(selectedMain(), selectedSub());
        if (level === "training") return pathKey(selectedMain(), selectedSub(), selectedDetail());
        return "";
    }
    function hiddenKey(level) { const p = levelPath(level); return level + (p ? "::" + p : ""); }

    function fixedLabels() {
        if (typeof window.EDUPATH_GET_TASK_TYPE_FIELD_LABELS === "function") {
            const l = window.EDUPATH_GET_TASK_TYPE_FIELD_LABELS(state.currentType || typeFromForm()) || {};
            return {main: l.main || l.topic, sub: l.sub || l.skill, detail: l.detail, training: l.training};
        }
        return DEFAULT_LABELS;
    }

    function currentLabel(level) {
        const cfg = state.config || {};
        const labels = cfg.labels || {};
        const custom = level === "main" ? (labels.main || labels.topic) : level === "sub" ? (labels.sub || labels.skill) : labels[level];
        const fixed = fixedLabels();
        const dom = $(levelMeta(level).labelId);
        return normalize(custom || fixed[level] || (dom && dom.textContent) || levelMeta(level).defaultLabel);
    }

    function selectOptions(level) {
        const el = $(levelMeta(level).selectId);
        if (!el) return [];
        return unique(Array.from(el.options || []).map((o) => normalize(o.value || o.textContent)).filter(Boolean));
    }

    function examData() { return window.SMART_EXAM_DATA || {}; }
    function isExam() { return normalize(state.currentType || typeFromForm()) === "الاختبارات الدولية"; }
    function listOrNull(v) { return Array.isArray(v) ? v : null; }

    function examList(level) {
        if (!isExam()) return null;
        const exams = examData();
        const main = selectedMain(), sub = selectedSub(), detail = selectedDetail();
        if (level === "main") return Object.keys(exams || {});
        const ex = exams[main];
        if (!ex) return null;
        if (level === "sub") return ex.sections || null;
        if (level === "detail") return ex.details && ex.details[sub] || null;
        if (level === "training") return ex.activities && (ex.activities[detail] || ex.activities[sub]) || null;
        return null;
    }

    function sourceForLevel(level) {
        const cfg = state.config;
        if (!cfg) return {list: ["أخرى"], source: "empty", pathSpecific: false, path: levelPath(level)};

        // القاعدة الحاسمة: اقرأ أولاً ما يراه النموذج العلوي فعلياً.
        const fromSelect = selectOptions(level);
        if (fromSelect.length && !(fromSelect.length === 1 && fromSelect[0] === "أخرى")) {
            return {list: fromSelect, source: "native-select", pathSpecific: true, path: levelPath(level)};
        }

        if (level === "main") {
            return {list: unique(listOrNull(cfg.main) || examList("main") || ["أخرى"]), source: "main", pathSpecific: true, path: ""};
        }
        if (level === "sub") {
            const main = selectedMain();
            const k = pathKey(main);
            if (listOrNull(cfg.subByPath[k])) return {list: unique(cfg.subByPath[k]), source: "subByPath", pathSpecific: true, path: k};
            if (listOrNull(cfg.sub[main])) return {list: unique(cfg.sub[main]), source: "sub", pathSpecific: false, path: k};
            const ex = examList("sub"); if (ex) return {list: unique(ex), source: "SMART_EXAM_DATA", pathSpecific: false, path: k};
            if (listOrNull(cfg.sub["أخرى"])) return {list: unique(cfg.sub["أخرى"]), source: "sub.default", pathSpecific: false, path: k};
            return {list: ["أخرى"], source: "fallback", pathSpecific: false, path: k};
        }
        if (level === "detail") {
            const main = selectedMain(), sub = selectedSub();
            const k = pathKey(main, sub);
            if (listOrNull(cfg.detailByPath[k])) return {list: unique(cfg.detailByPath[k]), source: "detailByPath", pathSpecific: true, path: k};
            const ex = examList("detail"); if (ex) return {list: unique(ex), source: "SMART_EXAM_DATA", pathSpecific: false, path: k};
            if (listOrNull(cfg.detail[sub])) return {list: unique(cfg.detail[sub]), source: "detail.sub", pathSpecific: false, path: k};
            if (listOrNull(cfg.detail[main])) return {list: unique(cfg.detail[main]), source: "detail.main", pathSpecific: false, path: k};
            if (listOrNull(cfg.detail["أخرى"])) return {list: unique(cfg.detail["أخرى"]), source: "detail.default", pathSpecific: false, path: k};
            return {list: ["أخرى"], source: "fallback", pathSpecific: false, path: k};
        }
        const main = selectedMain(), sub = selectedSub(), detail = selectedDetail();
        const k = pathKey(main, sub, detail);
        if (listOrNull(cfg.trainingByPath[k])) return {list: unique(cfg.trainingByPath[k]), source: "trainingByPath", pathSpecific: true, path: k};
        const ex = examList("training"); if (ex) return {list: unique(ex), source: "SMART_EXAM_DATA", pathSpecific: false, path: k};
        const by = cfg.trainingByDetail || {};
        if (listOrNull(by[detail])) return {list: unique(by[detail]), source: "trainingByDetail.detail", pathSpecific: false, path: k};
        if (listOrNull(by[sub])) return {list: unique(by[sub]), source: "trainingByDetail.sub", pathSpecific: false, path: k};
        if (listOrNull(by[main])) return {list: unique(by[main]), source: "trainingByDetail.main", pathSpecific: false, path: k};
        if (listOrNull(by["أخرى"])) return {list: unique(by["أخرى"]), source: "trainingByDetail.default", pathSpecific: false, path: k};
        if (listOrNull(cfg.training)) return {list: unique(cfg.training), source: "training.default", pathSpecific: false, path: k};
        return {list: ["أخرى"], source: "fallback", pathSpecific: false, path: k};
    }

    function hiddenFor(level) {
        const key = hiddenKey(level);
        const cfg = state.config || {};
        const specific = cfg.hiddenByPath && cfg.hiddenByPath[key];
        const general = level === "main" ? cfg.hidden && cfg.hidden.main : [];
        return unique([...(Array.isArray(specific) ? specific : []), ...(Array.isArray(general) ? general : [])]).filter((v) => v !== "أخرى" || (specific || general || []).includes("أخرى"));
    }

    function getRawList(level) { return unique(sourceForLevel(level).list); }
    function getList(level) {
        const hidden = hiddenFor(level);
        const list = getRawList(level).filter((v) => !hidden.includes(v));
        return list.length ? list : ["أخرى"];
    }

    function writeList(level, list, preferredValue) {
        const safe = unique(list);
        const cfg = state.config;
        if (!cfg) return;
        if (level === "main") cfg.main = safe;
        if (level === "sub") cfg.subByPath[pathKey(selectedMain())] = safe;
        if (level === "detail") cfg.detailByPath[pathKey(selectedMain(), selectedSub())] = safe;
        if (level === "training") cfg.trainingByPath[pathKey(selectedMain(), selectedSub(), selectedDetail())] = safe;
        markDirty();
        refreshNativeForm(preferredValue ? valuesWithPreferred(level, preferredValue) : null);
    }

    function childLevel(level) {
        if (level === "main") return "sub";
        if (level === "sub") return "detail";
        if (level === "detail") return "training";
        return null;
    }
    function childPathFor(level, option) {
        if (level === "main") return pathKey(option);
        if (level === "sub") return pathKey(selectedMain(), option);
        if (level === "detail") return pathKey(selectedMain(), selectedSub(), option);
        return "";
    }
    function setChildList(level, option, children) {
        const child = childLevel(level);
        const safe = unique(children && children.length ? children : ["أخرى"]);
        if (child === "sub") state.config.subByPath[childPathFor(level, option)] = safe;
        if (child === "detail") state.config.detailByPath[childPathFor(level, option)] = safe;
        if (child === "training") state.config.trainingByPath[childPathFor(level, option)] = safe;
    }

    function linesFrom(id) {
        const el = $(id);
        return unique(((el && el.value) || "").split(/\n+/));
    }

    function parseManualBranches() {
        const mode = ($("addOptionBranchMode") && $("addOptionBranchMode").value) || "empty";
        if (mode === "copy") return getChildList(state.selectedLevel, ($("addOptionCopySource") && $("addOptionCopySource").value) || "");
        if (mode === "manual") return linesFrom("addOptionChildrenTextarea");
        const count = Math.max(0, parseInt(($("addOptionChildrenCountInput") && $("addOptionChildrenCountInput").value) || "1", 10));
        return count ? Array.from({length: count}, (_, i) => i === 0 ? "أخرى" : `تفرع ${i + 1}`) : ["أخرى"];
    }

    function applyGuidedBranches(level, value) {
        const next = childLevel(level);
        if (!next) return;
        const children = parseManualBranches();
        setChildList(level, value, children);

        const second = linesFrom("addOptionGrandChildrenTextarea");
        const third = linesFrom("addOptionGreatGrandChildrenTextarea");
        if (level === "main") {
            children.forEach((subValue) => {
                if (second.length) state.config.detailByPath[pathKey(value, subValue)] = second;
                if (third.length) second.forEach((detailValue) => {
                    state.config.trainingByPath[pathKey(value, subValue, detailValue)] = third;
                });
            });
        }
        if (level === "sub") {
            const main = selectedMain();
            children.forEach((detailValue) => {
                if (second.length) state.config.trainingByPath[pathKey(main, value, detailValue)] = second;
            });
        }
    }

    function pickAddedOptionInNativeForm(level, value) {
        const meta = levelMeta(level);
        const el = $(meta.selectId);
        if (el) {
            el.dataset.current = value;
            setTimeout(() => {
                const fresh = $(meta.selectId);
                if (fresh) {
                    fresh.value = value;
                    fresh.dataset.current = value;
                    fresh.dispatchEvent(new Event("change", {bubbles: true}));
                }
            }, 90);
        }
    }
    function getChildList(level, option) {
        const child = childLevel(level);
        if (!child) return ["أخرى"];
        const cfg = state.config || {};
        const main = selectedMain(), sub = selectedSub();
        if (level === "main") {
            const ex = isExam() && examData()[option];
            return unique(cfg.subByPath[pathKey(option)] || cfg.sub[option] || (ex && ex.sections) || cfg.sub["أخرى"] || ["أخرى"]);
        }
        if (level === "sub") {
            const ex = isExam() && examData()[main];
            return unique(cfg.detailByPath[pathKey(main, option)] || (ex && ex.details && ex.details[option]) || cfg.detail[option] || cfg.detail[main] || cfg.detail["أخرى"] || ["أخرى"]);
        }
        if (level === "detail") {
            const ex = isExam() && examData()[main];
            return unique(cfg.trainingByPath[pathKey(main, sub, option)] || (ex && ex.activities && (ex.activities[option] || ex.activities[sub])) || cfg.trainingByDetail[option] || cfg.trainingByDetail[sub] || cfg.trainingByDetail[main] || cfg.training || ["أخرى"]);
        }
        return ["أخرى"];
    }

    function fetchJson(url, options) {
        const opts = Object.assign({ credentials: "same-origin" }, options || {});
        opts.headers = Object.assign({ "X-Requested-With": "XMLHttpRequest" }, opts.headers || {});
        return fetch(url, opts).then(async (res) => {
            const body = await res.json().catch(() => ({}));
            if (!res.ok || body.ok === false) throw new Error(body.message || `فشل الاتصال بالخادم (${res.status}).`);
            return body;
        });
    }

    function applyConfigToRuntime() {
        if (!state.currentType || !state.config) return;
        data()[state.currentType] = ensureConfig(state.config);
        const input = $("categorySelect");
        if (input) input.value = state.currentType;
    }

    function preserveSelectValues() {
        return {main: selectedMain(), sub: selectedSub(), detail: selectedDetail(), training: selectedTraining()};
    }

    function restoreSelectDatasets(vals) {
        const map = {topicSelect: vals.main, skillSelect: vals.sub, detailedTopicSelect: vals.detail, trainingTypeSelect: vals.training};
        Object.keys(map).forEach((id) => {
            const el = $(id);
            if (el) el.dataset.current = map[id] || "";
        });
    }

    function levelSelectId(level) { return levelMeta(level).selectId; }
    function forceSelectValue(level, value) {
        const el = $(levelSelectId(level));
        if (!el || !value) return;
        const exists = Array.from(el.options || []).some((o) => normalize(o.value || o.textContent) === value);
        if (!exists) el.add(new Option(value, value));
        el.dataset.current = value;
        el.value = value;
    }
    function valuesWithPreferred(level, value) {
        const vals = preserveSelectValues();
        if (level === "main") { vals.main = value; vals.sub = ""; vals.detail = ""; vals.training = ""; }
        if (level === "sub") { vals.sub = value; vals.detail = ""; vals.training = ""; }
        if (level === "detail") { vals.detail = value; vals.training = ""; }
        if (level === "training") vals.training = value;
        return vals;
    }

    function refreshNativeForm(preferred) {
        const vals = preferred || preserveSelectValues();
        applyConfigToRuntime();
        restoreSelectDatasets(vals);
        if (typeof window.EDUPATH_NATIVE_TASKS_INIT === "function") window.EDUPATH_NATIVE_TASKS_INIT();
        if (preferred) Object.keys({main:1,sub:1,detail:1,training:1}).forEach((level) => forceSelectValue(level, preferred[level]));
        setTimeout(() => { restoreSelectDatasets(vals); if (preferred) Object.keys({main:1,sub:1,detail:1,training:1}).forEach((level) => forceSelectValue(level, preferred[level])); renderEditor(); }, 60);
        setTimeout(() => { if (preferred) Object.keys({main:1,sub:1,detail:1,training:1}).forEach((level) => forceSelectValue(level, preferred[level])); renderEditor(); }, 180);
    }

    async function syncSelectedType(force) {
        if (state.syncLock) return;
        const requested = resolveTypeKey(typeFromForm());
        if (!requested) return;
        if (!force && requested === state.currentType && state.config) return renderEditor();
        state.syncLock = true;
        try {
            state.currentType = requested;
            const input = $("categorySelect");
            if (input) input.value = requested;
            const runtimeConfig = ensureConfig(data()[requested] || {});
            const baseBank = window.EDUPATH_TASK_BANK_BASE_DATA || {};
            state.baseConfig = ensureConfig(baseBank[requested] || runtimeConfig);
            state.publishedConfig = null;
            state.draftConfig = null;
            state.revisions = [];
            try {
                const api = await fetchJson(`/api/admin/task-bank/${encodeURIComponent(requested)}`);
                state.publishedConfig = api.customized && api.config ? ensureConfig(api.config) : null;
                state.draftConfig = api.draft_config ? ensureConfig(api.draft_config) : null;
                state.revisions = api.revisions || [];
            } catch (e) {
                toast(e.message || "تعذر تحميل إعدادات الإدارة.");
            }
            state.config = buildMergedAdminConfig(state.baseConfig, state.publishedConfig, state.draftConfig);
            state.dirty = false;
            applyConfigToRuntime();
            renderRevisions();
            updateStatus();
            if (typeof window.EDUPATH_NATIVE_TASKS_INIT === "function") window.EDUPATH_NATIVE_TASKS_INIT();
            setTimeout(renderEditor, 80);
            setTimeout(renderEditor, 250);
        } finally {
            state.lastClickedType = "";
            state.syncLock = false;
        }
    }

    function markDirty() { state.dirty = true; updateStatus(); }
    function updateStatus() {
        const box = $("adminTaskBankStatus");
        if (box) box.textContent = state.currentType ? `النوع الحالي: ${state.currentType}${state.dirty ? " · توجد تعديلات غير محفوظة" : ""}` : "اختر نوع مهمة من البطاقات كما في صفحة المهام.";
    }

    function snapshot() {
        return [typeFromForm(), selectedMain(), selectedSub(), selectedDetail(), selectedTraining(), state.selectedLevel].join("||");
    }

    function renderEditor() {
        if (!state.config) return;
        const actualType = resolveTypeKey(typeFromForm());
        if (actualType && actualType !== state.currentType && !state.syncLock) { syncSelectedType(true); return; }
        const tabs = $("adminAdaptiveLevelTabs");
        if (tabs) {
            tabs.innerHTML = LEVELS.map((l) => `<button type="button" class="small-button ${state.selectedLevel === l.key ? "success" : ""}" data-level="${l.key}">${esc(currentLabel(l.key))}</button>`).join("");
            tabs.querySelectorAll("[data-level]").forEach((btn) => btn.addEventListener("click", () => { state.selectedLevel = btn.dataset.level; renderEditor(); }));
        }
        const title = $("adminCurrentFieldTitle");
        if (title) title.textContent = currentLabel(state.selectedLevel);
        const path = $("adminAdaptivePathSummary");
        if (path) path.textContent = `المسار الحالي: ${state.currentType || "—"} → ${selectedMain() || "—"} → ${selectedSub() || "—"} → ${selectedDetail() || "—"}`;
        renderHint();
        renderOptions();
        renderHidden();
        updateStatus();
        state.lastSnapshot = snapshot();
    }

    function renderHint() {
        const listBox = $("adminCurrentOptionsList");
        if (!listBox) return;
        let hint = $("adminAdaptiveSourceHint");
        if (!hint) {
            hint = document.createElement("p");
            hint.id = "adminAdaptiveSourceHint";
            hint.className = "muted admin-adaptive-source-hint-v5681";
            listBox.parentNode.insertBefore(hint, listBox);
        }
        const info = sourceForLevel(state.selectedLevel);
        hint.textContent = info.pathSpecific || state.selectedLevel === "main"
            ? `القائمة الحالية تقرأ من نفس النموذج العلوي. المصدر: ${info.source}.`
            : `هذه القائمة ظهرت من fallback عام/بيانات أصلية. أي تعديل سيُنشئ تخصيصاً لهذا المسار فقط ولن يغيّر بقية المسارات. المصدر: ${info.source}.`;
    }

    function renderOptions() {
        const box = $("adminCurrentOptionsList");
        if (!box) return;
        const list = getList(state.selectedLevel);
        box.innerHTML = "";
        list.forEach((value, index) => {
            const row = document.createElement("div");
            const protectedOther = isProtectedOther(value);
            row.className = "bank-option-row-v5600 admin-real-option-row-v5610";
            row.innerHTML = `
                <span class="option-order-v5600">${index + 1}</span>
                <input value="${esc(value)}" aria-label="اسم الخيار" ${protectedOther ? "disabled" : ""}>
                <button type="button" class="small-button" data-act="up" ${protectedOther ? "disabled" : ""}>↑ للأعلى</button>
                <button type="button" class="small-button" data-act="down" ${protectedOther ? "disabled" : ""}>↓ للأسفل</button>
                <button type="button" class="small-button" data-act="branches">إدارة التفرعات</button>
                <button type="button" class="small-button" data-act="copy">نسخ التفرعات</button>
                <button type="button" class="small-button warning" data-act="hide" ${protectedOther ? "disabled" : ""}>إخفاء آمن</button>
                <button type="button" class="small-button danger" data-act="delete" ${protectedOther ? "disabled" : ""}>حذف نهائي</button>
                ${protectedOther ? '<small class="muted">خيار ثابت يفتح خانة مخصصة ولا يمكن حذفه أو إخفاؤه.</small>' : ''}`;
            row.querySelector("input").addEventListener("change", (e) => renameOption(state.selectedLevel, value, e.target.value));
            row.querySelector('[data-act="up"]').addEventListener("click", () => moveOption(state.selectedLevel, value, -1));
            row.querySelector('[data-act="down"]').addEventListener("click", () => moveOption(state.selectedLevel, value, 1));
            row.querySelector('[data-act="branches"]').addEventListener("click", () => openBranchesModal(state.selectedLevel, value));
            row.querySelector('[data-act="copy"]').addEventListener("click", () => copyBranches(state.selectedLevel, value));
            row.querySelector('[data-act="hide"]').addEventListener("click", () => hideOption(state.selectedLevel, value));
            row.querySelector('[data-act="delete"]').addEventListener("click", () => deleteOption(state.selectedLevel, value));
            box.appendChild(row);
        });
    }

    function renamePathObject(obj, oldPrefix, newPrefix) {
        Object.keys(obj || {}).forEach((k) => {
            if (k === oldPrefix || k.startsWith(oldPrefix + "::")) {
                obj[newPrefix + k.slice(oldPrefix.length)] = obj[k];
                delete obj[k];
            }
        });
    }
    function deletePathObject(obj, prefix) {
        Object.keys(obj || {}).forEach((k) => { if (k === prefix || k.startsWith(prefix + "::")) delete obj[k]; });
    }
    function renamePlainKey(obj, oldKey, newKey) {
        if (obj && Object.prototype.hasOwnProperty.call(obj, oldKey) && oldKey !== newKey) { obj[newKey] = obj[oldKey]; delete obj[oldKey]; }
    }

    function renameOption(level, oldValue, nextValue) {
        if (isProtectedOther(oldValue)) { toast('لا يمكن تغيير اسم خيار "أخرى" لأنه خيار ثابت في النظام.'); return renderEditor(); }
        const next = normalize(nextValue);
        if (isProtectedOther(next)) { toast('لا يمكن استخدام اسم "أخرى" إلا للخيار الثابت في آخر القائمة.'); return renderEditor(); }
        if (!next || next === oldValue) return renderEditor();
        const raw = getRawList(level).slice();
        const idx = raw.indexOf(oldValue);
        if (idx < 0) return renderEditor();
        if (!confirm("سيتم نقل كل التفرعات التابعة إلى الاسم الجديد. هل تريد المتابعة؟")) return renderEditor();
        raw[idx] = next;
        if (level === "main") {
            renamePathObject(state.config.subByPath, pathKey(oldValue), pathKey(next));
            renamePathObject(state.config.detailByPath, pathKey(oldValue), pathKey(next));
            renamePathObject(state.config.trainingByPath, pathKey(oldValue), pathKey(next));
            renamePlainKey(state.config.sub, oldValue, next);
            renamePlainKey(state.config.detail, oldValue, next);
            renamePlainKey(state.config.trainingByDetail, oldValue, next);
        }
        if (level === "sub") {
            const main = selectedMain();
            renamePathObject(state.config.detailByPath, pathKey(main, oldValue), pathKey(main, next));
            renamePathObject(state.config.trainingByPath, pathKey(main, oldValue), pathKey(main, next));
            renamePlainKey(state.config.detail, oldValue, next);
            renamePlainKey(state.config.trainingByDetail, oldValue, next);
        }
        if (level === "detail") {
            renamePathObject(state.config.trainingByPath, pathKey(selectedMain(), selectedSub(), oldValue), pathKey(selectedMain(), selectedSub(), next));
            renamePlainKey(state.config.trainingByDetail, oldValue, next);
        }
        writeList(level, raw);
    }

    function moveOption(level, value, dir) {
        if (isProtectedOther(value)) { toast('خيار "أخرى" ثابت في آخر القائمة ولا يمكن تحريكه.'); return; }
        const raw = getRawList(level).slice();
        const i = raw.indexOf(value);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= raw.length) return;
        [raw[i], raw[j]] = [raw[j], raw[i]];
        writeList(level, raw);
    }

    function hideOption(level, value) {
        if (isProtectedOther(value)) { toast('لا يمكن إخفاء خيار "أخرى" لأنه يجب أن يبقى متاحاً دائماً في آخر القائمة.'); return; }
        const key = hiddenKey(level);
        state.config.hiddenByPath[key] = unique([...(state.config.hiddenByPath[key] || []), value]);
        markDirty();
        refreshNativeForm();
    }

    function unhideOption(level, value) {
        const key = hiddenKey(level);
        state.config.hiddenByPath[key] = (state.config.hiddenByPath[key] || []).filter((v) => v !== value);
        if (level === "main") state.config.hidden.main = (state.config.hidden.main || []).filter((v) => v !== value);
        markDirty();
        refreshNativeForm();
    }

    function deleteOption(level, value) {
        const check = prompt(`هذا حذف نهائي من المسار الحالي فقط. اكتب اسم الخيار للتأكيد:\n${value}`);
        if (check !== value) return toast("تم إلغاء الحذف.");
        const raw = getRawList(level).filter((v) => v !== value);
        if (level === "main") {
            delete state.config.subByPath[pathKey(value)];
            deletePathObject(state.config.detailByPath, pathKey(value));
            deletePathObject(state.config.trainingByPath, pathKey(value));
        }
        if (level === "sub") {
            delete state.config.detailByPath[pathKey(selectedMain(), value)];
            deletePathObject(state.config.trainingByPath, pathKey(selectedMain(), value));
        }
        if (level === "detail") delete state.config.trainingByPath[pathKey(selectedMain(), selectedSub(), value)];
        writeList(level, raw);
    }

    function renderHidden() {
        const box = $("adminHiddenOptionsList");
        if (!box) return;
        const hidden = hiddenFor(state.selectedLevel);
        if (!hidden.length) { box.innerHTML = '<p class="muted">لا توجد خيارات مخفية في هذا المسار.</p>'; return; }
        box.innerHTML = hidden.map((v) => `<div class="bank-revision-item-v5600"><strong>${esc(v)}</strong><button type="button" class="small-button cancel" data-v="${esc(v)}">استعادة</button></div>`).join("");
        box.querySelectorAll("[data-v]").forEach((btn) => btn.addEventListener("click", () => unhideOption(state.selectedLevel, btn.dataset.v)));
    }

    function ensureAddModal() {
        let modal = $("adminAddOptionModal");
        if (modal) return modal;
        modal = document.createElement("div");
        modal.id = "adminAddOptionModal";
        modal.className = "admin-bank-modal-v5600";
        modal.hidden = true;
        modal.innerHTML = `
        <div class="admin-bank-modal-card-v5600 admin-add-option-card-v5681 admin-add-option-card-v5612">
            <h2>إضافة خيار تكيفي جديد</h2>
            <p class="muted" id="addOptionPathHint">—</p>
            <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;padding:12px;margin:10px 0">
                <strong id="addOptionLevelHint">الخانة الحالية: —</strong>
                <p class="muted" id="addOptionChildHint" style="margin:.35rem 0 0">—</p>
            </div>
            <label>اسم الخيار الجديد الذي سيظهر للمستخدم</label>
            <input id="addOptionNameInput" placeholder="مثال: مشروع برمجي / القراءة / التفاضل">
            <label>مكان الإضافة داخل القائمة الحالية</label>
            <select id="addOptionPositionSelect"><option value="end">في النهاية</option><option value="start">في البداية</option><option value="after">بعد خيار محدد</option></select>
            <select id="addOptionAfterSelect" style="margin-top:8px"></select>
            <div id="addOptionAdaptiveBox" style="border:1px solid #e5e7eb;border-radius:14px;padding:12px;margin-top:14px">
                <label style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><input id="addOptionHasBranchesCheckbox" type="checkbox" checked> هذا الخيار تكيفي وله تفرعات في الخانة التالية</label>
                <p class="muted" id="addOptionBranchMeaning">—</p>
                <div id="addOptionBranchPanel">
                    <label>طريقة إنشاء التفرعات التابعة</label>
                    <select id="addOptionBranchMode"><option value="manual">إضافة تفرعات الآن</option><option value="copy">نسخ تفرعات من خيار موجود</option><option value="empty">إنشاء تفرع افتراضي مؤقت</option></select>
                    <select id="addOptionCopySource" style="margin-top:8px"></select>
                    <label id="addOptionChildrenLabel">التفرعات التابعة، كل خيار في سطر</label>
                    <textarea id="addOptionChildrenTextarea" rows="4" placeholder="اكتب كل تفرع في سطر مستقل"></textarea>
                    <p class="muted" id="addOptionChildrenHelp">هذه التفرعات ستُحفظ لهذا الخيار فقط، ولن تغيّر بقية المسارات.</p>
                    <label id="addOptionChildrenCountLabel">عدد التفرعات المؤقتة</label>
                    <input id="addOptionChildrenCountInput" type="number" min="0" value="1">
                    <div id="addOptionDeepBranchPanel" style="border-top:1px dashed #d1d5db;margin-top:12px;padding-top:12px">
                        <p class="muted">اختياري: يمكنك تجهيز تفرعات أعمق الآن لتصبح الخانة الجديدة جاهزة فوراً.</p>
                        <label id="addOptionGrandChildrenLabel">تفرعات المستوى التالي لكل تفرع تضيفه</label>
                        <textarea id="addOptionGrandChildrenTextarea" rows="3" placeholder="اختياري — كل خيار في سطر"></textarea>
                        <label id="addOptionGreatGrandChildrenLabel">أنشطة/تفرعات المستوى الأخير</label>
                        <textarea id="addOptionGreatGrandChildrenTextarea" rows="3" placeholder="اختياري — كل خيار في سطر"></textarea>
                    </div>
                </div>
            </div>
            <div class="actions"><button type="button" id="confirmAddOptionBtn">حفظ الخيار والتفرعات</button><button type="button" class="small-button cancel" id="cancelAddOptionBtn">إلغاء</button></div>
        </div>`;
        document.body.appendChild(modal);
        $("cancelAddOptionBtn").addEventListener("click", () => modal.hidden = true);
        $("confirmAddOptionBtn").addEventListener("click", confirmAddOption);
        $("addOptionBranchMode").addEventListener("change", refreshAddModalMode);
        $("addOptionHasBranchesCheckbox").addEventListener("change", refreshAddModalMode);
        $("addOptionPositionSelect").addEventListener("change", refreshAddModalMode);
        return modal;
    }

    function refreshAddModalMode() {
        const child = childLevel(state.selectedLevel);
        const adaptive = !!child && (! $("addOptionHasBranchesCheckbox") || $("addOptionHasBranchesCheckbox").checked);
        const mode = ($("addOptionBranchMode") && $("addOptionBranchMode").value) || "manual";
        const pos = ($("addOptionPositionSelect") && $("addOptionPositionSelect").value) || "end";
        if ($("addOptionAfterSelect")) $("addOptionAfterSelect").style.display = pos === "after" ? "block" : "none";
        if ($("addOptionBranchPanel")) $("addOptionBranchPanel").style.display = adaptive && child ? "block" : "none";
        if ($("addOptionCopySource")) $("addOptionCopySource").style.display = mode === "copy" ? "block" : "none";
        if ($("addOptionChildrenTextarea")) $("addOptionChildrenTextarea").style.display = mode === "manual" ? "block" : "none";
        if ($("addOptionChildrenCountInput")) $("addOptionChildrenCountInput").style.display = mode === "empty" ? "block" : "none";
        const deep = $("addOptionDeepBranchPanel");
        if (deep) deep.style.display = adaptive && child && state.selectedLevel !== "detail" ? "block" : "none";
        if ($("addOptionNextLabel")) $("addOptionNextLabel").textContent = child ? `ماذا تريد أن يظهر في خانة: ${currentLabel(child)}؟` : "هذا المستوى الأخير ولا يحتاج تفرعات";
        if ($("addOptionGrandChildrenLabel")) {
            const grand = childLevel(child);
            $("addOptionGrandChildrenLabel").textContent = grand ? `اختياري: عناصر خانة ${currentLabel(grand)} لكل تفرع تضيفه` : "";
        }
        if ($("addOptionGreatGrandChildrenLabel")) {
            const grand = childLevel(child);
            const great = childLevel(grand);
            $("addOptionGreatGrandChildrenLabel").textContent = great ? `اختياري: عناصر خانة ${currentLabel(great)} لكل عنصر من الخانة السابقة` : "";
        }
    }

    function openAddOption() {
        if (!state.config) return syncSelectedType(true).then(openAddOption);
        const modal = ensureAddModal();
        modal.dataset.level = state.selectedLevel;
        const list = getList(state.selectedLevel);
        const parts = [state.currentType, selectedMain(), selectedSub(), selectedDetail()].filter(Boolean);
        $("addOptionPathHint").textContent = `الخانة الحالية: ${currentLabel(state.selectedLevel)} · المسار الحالي: ${parts.join(" → ") || "—"}`;
        $("addOptionNameInput").value = "";
        $("addOptionAfterSelect").innerHTML = list.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
        $("addOptionCopySource").innerHTML = list.map((v) => `<option value="${esc(v)}">نسخ تفرعات: ${esc(v)}</option>`).join("");
        $("addOptionChildrenTextarea").value = "أخرى";
        if ($("addOptionGrandChildrenTextarea")) $("addOptionGrandChildrenTextarea").value = "";
        if ($("addOptionGreatGrandChildrenTextarea")) $("addOptionGreatGrandChildrenTextarea").value = "";
        $("addOptionChildrenCountInput").value = childLevel(state.selectedLevel) ? "1" : "0";
        $("addOptionBranchMode").value = childLevel(state.selectedLevel) ? "manual" : "empty";
        if ($("addOptionHasBranchesCheckbox")) {
            $("addOptionHasBranchesCheckbox").checked = !!childLevel(state.selectedLevel);
            $("addOptionHasBranchesCheckbox").disabled = !childLevel(state.selectedLevel);
        }
        $("addOptionPositionSelect").value = "end";
        if ($("addOptionLevelHint")) $("addOptionLevelHint").textContent = `الخانة الحالية: ${currentLabel(state.selectedLevel)}`;
        if ($("addOptionChildHint")) $("addOptionChildHint").textContent = childLevel(state.selectedLevel) ? `الخانة التالية التي ستبني تفرعاتها: ${currentLabel(childLevel(state.selectedLevel))}` : "هذا المستوى الأخير؛ سيُحفظ الخيار في المسار الحالي فقط.";
        if ($("addOptionBranchMeaning")) $("addOptionBranchMeaning").textContent = childLevel(state.selectedLevel) ? `عند اختيار "${currentLabel(state.selectedLevel)}" الجديد، ستظهر هذه التفرعات في خانة "${currentLabel(childLevel(state.selectedLevel))}".` : "لا توجد تفرعات بعد هذا المستوى.";
        refreshAddModalMode();
        modal.hidden = false;
        setTimeout(() => $("addOptionNameInput") && $("addOptionNameInput").focus(), 20);
    }

    function confirmAddOption() {
        const modal = $("adminAddOptionModal");
        const level = modal.dataset.level || state.selectedLevel;
        const value = normalize($("addOptionNameInput").value);
        if (!value) return toast("اكتب اسم الخيار الجديد أولاً.");
        const raw = getRawList(level).slice();
        if (raw.includes(value)) return toast("هذا الخيار موجود بالفعل.");
        const pos = $("addOptionPositionSelect").value;
        if (pos === "start") raw.unshift(value);
        else if (pos === "after") {
            const after = $("addOptionAfterSelect").value;
            const i = raw.indexOf(after);
            raw.splice(i >= 0 ? i + 1 : raw.length, 0, value);
        } else raw.push(value);

        const adaptive = !!childLevel(level) && (! $("addOptionHasBranchesCheckbox") || $("addOptionHasBranchesCheckbox").checked);
        if (adaptive && childLevel(level)) applyGuidedBranches(level, value);
        else if (childLevel(level)) setChildList(level, value, ["أخرى"]);

        modal.hidden = true;
        writeList(level, raw);
        pickAddedOptionInNativeForm(level, value);
        toast("تمت إضافة الخيار والتفرعات داخل المسار الحالي. اضغط حفظ كمسودة أو نشر التعديلات للاحتفاظ بها نهائياً.");
    }

    function ensureBranchesModal() {
        let modal = $("adminBranchesModal");
        if (modal) return modal;
        modal = document.createElement("div");
        modal.id = "adminBranchesModal";
        modal.className = "admin-bank-modal-v5600";
        modal.hidden = true;
        modal.innerHTML = `
        <div class="admin-bank-modal-card-v5600 admin-branches-card-v5681">
            <h2>إدارة التفرعات التكيفية</h2>
            <p class="muted" id="branchesPathHint">—</p>
            <label id="branchesChildLabel">التفرعات التابعة</label>
            <textarea id="branchesTextarea" rows="10"></textarea>
            <div class="actions">
                <button type="button" class="small-button success" id="addBranchLineBtn">إضافة تفرع</button>
                <button type="button" class="small-button warning" id="sortBranchesBtn">ترتيب يدوي أبجدي</button>
                <select id="branchesCopySourceSelect"></select>
                <button type="button" class="small-button" id="copyBranchesBtn">نسخ تفرعات</button>
            </div>
            <div class="actions"><button type="button" id="saveBranchesBtn">حفظ التفرعات</button><button type="button" class="small-button cancel" id="cancelBranchesBtn">إلغاء</button></div>
        </div>`;
        document.body.appendChild(modal);
        $("cancelBranchesBtn").addEventListener("click", () => modal.hidden = true);
        $("saveBranchesBtn").addEventListener("click", () => {
            setChildList(modal.dataset.level, modal.dataset.value, unique(($("branchesTextarea").value || "").split(/\n+/)));
            modal.hidden = true;
            markDirty();
            refreshNativeForm();
        });
        $("addBranchLineBtn").addEventListener("click", () => { const ta = $("branchesTextarea"); ta.value = (ta.value ? ta.value + "\n" : "") + "أخرى"; ta.focus(); });
        $("sortBranchesBtn").addEventListener("click", () => { const ta = $("branchesTextarea"); ta.value = unique(ta.value.split(/\n+/)).sort((a,b)=>a.localeCompare(b,"ar")).join("\n"); });
        $("copyBranchesBtn").addEventListener("click", () => { const src = $("branchesCopySourceSelect").value; if (src) $("branchesTextarea").value = getChildList(modal.dataset.level, src).join("\n"); });
        return modal;
    }

    function openBranchesModal(level, value) {
        if (!childLevel(level)) return toast("هذا هو المستوى الأخير ولا يحتوي على تفرعات تابعة.");
        const modal = ensureBranchesModal();
        modal.dataset.level = level;
        modal.dataset.value = value;
        $("branchesPathHint").textContent = `الخيار الحالي: ${value} · المسار: ${state.currentType || "—"} → ${selectedMain() || "—"} → ${selectedSub() || "—"} → ${selectedDetail() || "—"}`;
        $("branchesChildLabel").textContent = `قائمة ${currentLabel(childLevel(level))}`;
        $("branchesTextarea").value = getChildList(level, value).join("\n");
        const siblings = getList(level).filter((v) => v !== value);
        $("branchesCopySourceSelect").innerHTML = siblings.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
        modal.hidden = false;
    }

    function copyBranches(level, value) {
        const siblings = getList(level).filter((v) => v !== value);
        if (!siblings.length) return toast("لا يوجد خيار آخر للنسخ منه.");
        const src = normalize(prompt("اكتب اسم الخيار الذي تريد نسخ تفرعاته:", siblings[0]));
        if (!src || !siblings.includes(src)) return toast("لم يتم اختيار مصدر صحيح.");
        setChildList(level, value, getChildList(level, src));
        markDirty();
        refreshNativeForm();
    }

    function openManualOrder() {
        state.manualLevel = state.selectedLevel;
        const m = $("bankManualOrderModal");
        const ta = $("manualOrderTextarea");
        if (ta) ta.value = getList(state.selectedLevel).join("\n");
        if (m) m.hidden = false;
    }
    function applyManualOrder() {
        if (!state.manualLevel) return;
        const visible = unique(($("manualOrderTextarea").value || "").split(/\n+/));
        writeList(state.manualLevel, visible);
        const m = $("bankManualOrderModal"); if (m) m.hidden = true;
        state.manualLevel = null;
    }

    function editFieldLabel() {
        const level = state.selectedLevel;
        const next = normalize(prompt("اكتب اسم الخانة لهذا النوع فقط:", currentLabel(level)));
        if (!next) return;
        const key = level === "main" ? "topic" : level === "sub" ? "skill" : level;
        state.config.labels[key] = next;
        markDirty();
        refreshNativeForm();
    }

    function renderRevisions() {
        const box = $("bankRevisionsList");
        if (!box) return;
        if (!state.revisions.length) { box.innerHTML = '<p class="muted">لا توجد تعديلات منشورة بعد لهذا النوع.</p>'; return; }
        box.innerHTML = state.revisions.map((r) => `<div class="bank-revision-item-v5600"><strong>${esc(r.action || "تعديل")}</strong><span>${esc(r.created_at || "")}</span><button type="button" class="small-button cancel" data-id="${esc(r.id)}">استعادة هذه النسخة</button></div>`).join("");
        box.querySelectorAll("[data-id]").forEach((b) => b.addEventListener("click", () => rollback(b.dataset.id)));
    }

    function configForSave() {
        state.config = ensureConfig(state.config || {});
        normalizeConfigOther(state.config);
        applyConfigToRuntime();
        return Object.assign({}, clone(state.config), {__edupathAdminFullConfig: true});
    }

    async function saveDraft() {
        if (!state.currentType || !state.config) return toast("اختر نوع مهمة أولاً.");
        const btn = $("saveDraftTaskBankBtn");
        if (btn) { btn.disabled = true; btn.dataset.oldText = btn.textContent; btn.textContent = "جارٍ حفظ المسودة..."; }
        try {
            const res = await fetchJson(`/api/admin/task-bank/${encodeURIComponent(state.currentType)}/draft`, {
                method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({config: configForSave()})
            });
            state.dirty = false;
            toast(res.message || "تم حفظ المسودة مع الخيارات والتفرعات الجديدة.");
            await syncSelectedType(true);
        } catch (e) {
            toast(e.message || "فشل حفظ المسودة. راجع الاتصال أو صلاحيات المشرف.");
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = btn.dataset.oldText || "💾 حفظ كمسودة"; }
        }
    }
    async function publish() {
        if (!state.currentType || !state.config) return toast("اختر نوع مهمة أولاً.");
        if (!confirm("سيتم نشر التعديلات لتظهر في صفحة المهام العادية. هل تريد المتابعة؟")) return;
        const btn = $("publishTaskBankBtn");
        if (btn) { btn.disabled = true; btn.dataset.oldText = btn.textContent; btn.textContent = "جارٍ النشر..."; }
        try {
            const res = await fetchJson(`/api/admin/task-bank/${encodeURIComponent(state.currentType)}`, {
                method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({config: configForSave(), action: "v5.6.12_final_admin_editor_no_option_loss", clear_draft: true})
            });
            state.dirty = false;
            toast(res.message || "تم النشر مع الخيارات والتفرعات الجديدة.");
            await syncSelectedType(true);
        } catch (e) {
            toast(e.message || "فشل نشر التعديلات. راجع الاتصال أو صلاحيات المشرف.");
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = btn.dataset.oldText || "🚀 نشر التعديلات"; }
        }
    }
    async function rollback(id) {
        if (!state.currentType) return;
        const res = await fetchJson(`/api/admin/task-bank/${encodeURIComponent(state.currentType)}/rollback`, {
            method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({revision_id: id || null})
        });
        toast(res.message || "تمت الاستعادة.");
        await syncSelectedType(true);
    }
    function restoreDefault() {
        if (!state.currentType || !state.baseConfig) return toast("لا يوجد نوع محدد.");
        if (!confirm("سيتم تجهيز الافتراضي الحقيقي الكامل لهذا النوع كمسودة. هل تريد المتابعة؟")) return;
        state.config = ensureConfig(state.baseConfig);
        applyConfigToRuntime();
        markDirty();
        refreshNativeForm();
    }
    function preview() { const box = $("studentPreviewFrame"); if (box) box.hidden = !box.hidden; }

    function installObservers() {
        document.addEventListener("click", (e) => {
            const card = e.target.closest && e.target.closest("#taskTypeCards .task-type-card");
            if (card && card.dataset.type) {
                state.lastClickedType = card.dataset.type;
                const input = $("categorySelect");
                if (input) input.value = card.dataset.type;
                setTimeout(() => syncSelectedType(true), 0);
                setTimeout(() => syncSelectedType(true), 120);
                setTimeout(renderEditor, 300);
            }
        }, true);
        document.addEventListener("change", (e) => {
            if (["categorySelect", "topicSelect", "skillSelect", "detailedTopicSelect", "trainingTypeSelect"].includes(e.target && e.target.id)) {
                setTimeout(() => {
                    const t = resolveTypeKey(typeFromForm());
                    if (t !== state.currentType) syncSelectedType(true); else renderEditor();
                }, 0);
                setTimeout(renderEditor, 120);
                setTimeout(renderEditor, 350);
            }
        }, true);
        const form = $("adminRealTaskFormCard") || document.body;
        if (window.MutationObserver && form) {
            new MutationObserver(() => {
                const s = snapshot();
                if (s !== state.lastSnapshot) setTimeout(() => {
                    const t = resolveTypeKey(typeFromForm());
                    if (t !== state.currentType) syncSelectedType(true); else renderEditor();
                }, 30);
            }).observe(form, {childList: true, subtree: true, attributes: true, attributeFilter: ["class", "value", "data-current"]});
        }
        setInterval(() => {
            const s = snapshot();
            if (s !== state.lastSnapshot) {
                const t = resolveTypeKey(typeFromForm());
                if (t !== state.currentType) syncSelectedType(true); else renderEditor();
            }
        }, 350);
    }

    function bind() {
        if (window.__EDUPATH_ADMIN_TASK_BANK_REAL_FIX_BOUND__) return;
        window.__EDUPATH_ADMIN_TASK_BANK_REAL_FIX_BOUND__ = true;
        $("saveDraftTaskBankBtn") && $("saveDraftTaskBankBtn").addEventListener("click", saveDraft);
        $("publishTaskBankBtn") && $("publishTaskBankBtn").addEventListener("click", publish);
        $("rollbackTaskBankBtn") && $("rollbackTaskBankBtn").addEventListener("click", () => rollback(null));
        $("restoreDefaultTaskBankBtn") && $("restoreDefaultTaskBankBtn").addEventListener("click", restoreDefault);
        $("previewTaskBankBtn") && $("previewTaskBankBtn").addEventListener("click", preview);
        $("addOptionBtn") && $("addOptionBtn").addEventListener("click", openAddOption);
        $("manualOrderBtn") && $("manualOrderBtn").addEventListener("click", openManualOrder);
        $("editFieldLabelBtn") && $("editFieldLabelBtn").addEventListener("click", editFieldLabel);
        $("closeManualOrderBtn") && $("closeManualOrderBtn").addEventListener("click", () => { const m = $("bankManualOrderModal"); if (m) m.hidden = true; state.manualLevel = null; });
        $("applyManualOrderBtn") && $("applyManualOrderBtn").addEventListener("click", applyManualOrder);
        installObservers();
        setTimeout(() => syncSelectedType(true), 0);
        setTimeout(() => syncSelectedType(true), 500);
        setTimeout(renderEditor, 900);
    }

    document.addEventListener("DOMContentLoaded", bind);
    if (document.readyState !== "loading") bind();
})();
