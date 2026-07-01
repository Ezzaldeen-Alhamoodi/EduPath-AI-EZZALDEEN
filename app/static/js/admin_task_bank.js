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
        const out = [];
        (items || []).forEach((item) => {
            const v = normalize(item);
            if (v && !out.includes(v)) out.push(v);
        });
        return out.length ? out : ["أخرى"];
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
        return c;
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
        if (draftConfig) return ensureConfig(deepMerge(base, draftConfig, !draftConfig.__edupathAdminFullConfig));
        if (publishedConfig) return ensureConfig(deepMerge(base, publishedConfig, !publishedConfig.__edupathAdminFullConfig));
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

    function writeList(level, list) {
        const safe = unique(list);
        const cfg = state.config;
        if (!cfg) return;
        if (level === "main") cfg.main = safe;
        if (level === "sub") cfg.subByPath[pathKey(selectedMain())] = safe;
        if (level === "detail") cfg.detailByPath[pathKey(selectedMain(), selectedSub())] = safe;
        if (level === "training") cfg.trainingByPath[pathKey(selectedMain(), selectedSub(), selectedDetail())] = safe;
        markDirty();
        refreshNativeForm();
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
        return fetch(url, options || {}).then(async (res) => {
            const body = await res.json().catch(() => ({}));
            if (!res.ok || body.ok === false) throw new Error(body.message || "فشل الاتصال بالخادم.");
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

    function refreshNativeForm() {
        const vals = preserveSelectValues();
        applyConfigToRuntime();
        restoreSelectDatasets(vals);
        if (typeof window.EDUPATH_NATIVE_TASKS_INIT === "function") window.EDUPATH_NATIVE_TASKS_INIT();
        setTimeout(() => { restoreSelectDatasets(vals); renderEditor(); }, 60);
        setTimeout(renderEditor, 180);
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
            row.className = "bank-option-row-v5600 admin-real-option-row-v5610";
            row.innerHTML = `
                <span class="option-order-v5600">${index + 1}</span>
                <input value="${esc(value)}" aria-label="اسم الخيار">
                <button type="button" class="small-button" data-act="up">↑ للأعلى</button>
                <button type="button" class="small-button" data-act="down">↓ للأسفل</button>
                <button type="button" class="small-button" data-act="branches">إدارة التفرعات</button>
                <button type="button" class="small-button" data-act="copy">نسخ التفرعات</button>
                <button type="button" class="small-button warning" data-act="hide">إخفاء آمن</button>
                <button type="button" class="small-button danger" data-act="delete">حذف نهائي</button>`;
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
        const next = normalize(nextValue);
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
        const raw = getRawList(level).slice();
        const i = raw.indexOf(value);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= raw.length) return;
        [raw[i], raw[j]] = [raw[j], raw[i]];
        writeList(level, raw);
    }

    function hideOption(level, value) {
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
        <div class="admin-bank-modal-card-v5600 admin-add-option-card-v5681">
            <h2>إضافة خيار تكيفي جديد</h2>
            <p class="muted" id="addOptionPathHint">—</p>
            <label>اسم الخيار الجديد</label>
            <input id="addOptionNameInput" placeholder="اكتب الاسم كما سيظهر للمستخدم">
            <label>مكان الإضافة</label>
            <select id="addOptionPositionSelect"><option value="end">في النهاية</option><option value="start">في البداية</option><option value="after">بعد خيار محدد</option></select>
            <select id="addOptionAfterSelect"></select>
            <label>طريقة إنشاء التفرعات التابعة</label>
            <select id="addOptionBranchMode"><option value="empty">تفرعات فارغة</option><option value="copy">نسخ تفرعات من خيار موجود</option><option value="manual">إضافة تفرعات الآن</option></select>
            <select id="addOptionCopySource"></select>
            <label>عدد التفرعات التابعة</label>
            <input id="addOptionChildrenCountInput" type="number" min="0" value="1">
            <label>التفرعات التابعة، كل خيار في سطر</label>
            <textarea id="addOptionChildrenTextarea" rows="8" placeholder="أخرى"></textarea>
            <div class="actions"><button type="button" id="confirmAddOptionBtn">حفظ الخيار</button><button type="button" class="small-button cancel" id="cancelAddOptionBtn">إلغاء</button></div>
        </div>`;
        document.body.appendChild(modal);
        $("cancelAddOptionBtn").addEventListener("click", () => modal.hidden = true);
        $("confirmAddOptionBtn").addEventListener("click", confirmAddOption);
        $("addOptionBranchMode").addEventListener("change", refreshAddModalMode);
        return modal;
    }

    function refreshAddModalMode() {
        const mode = $("addOptionBranchMode").value;
        $("addOptionCopySource").style.display = mode === "copy" ? "block" : "none";
        $("addOptionChildrenTextarea").style.display = mode === "manual" ? "block" : "none";
        $("addOptionChildrenCountInput").style.display = mode === "empty" ? "block" : "none";
    }

    function openAddOption() {
        if (!state.config) return syncSelectedType(true).then(openAddOption);
        const modal = ensureAddModal();
        modal.dataset.level = state.selectedLevel;
        const list = getList(state.selectedLevel);
        $("addOptionPathHint").textContent = `الخانة: ${currentLabel(state.selectedLevel)} · المسار: ${state.currentType || "—"} → ${selectedMain() || "—"} → ${selectedSub() || "—"} → ${selectedDetail() || "—"}`;
        $("addOptionNameInput").value = "";
        $("addOptionAfterSelect").innerHTML = list.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
        $("addOptionCopySource").innerHTML = list.map((v) => `<option value="${esc(v)}">نسخ من: ${esc(v)}</option>`).join("");
        $("addOptionChildrenTextarea").value = "أخرى";
        $("addOptionChildrenCountInput").value = childLevel(state.selectedLevel) ? "1" : "0";
        $("addOptionBranchMode").value = "empty";
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
        if (childLevel(level)) {
            const mode = $("addOptionBranchMode").value;
            let children = ["أخرى"];
            if (mode === "copy") children = getChildList(level, $("addOptionCopySource").value);
            if (mode === "manual") children = unique(($("addOptionChildrenTextarea").value || "").split(/\n+/));
            if (mode === "empty") {
                const count = Math.max(0, parseInt($("addOptionChildrenCountInput").value || "1", 10));
                children = count ? Array.from({length: count}, (_, i) => i === 0 ? "أخرى" : `تفرع ${i + 1}`) : ["أخرى"];
            }
            setChildList(level, value, children);
        }
        modal.hidden = true;
        writeList(level, raw);
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

    async function saveDraft() {
        if (!state.currentType || !state.config) return toast("اختر نوع مهمة أولاً.");
        const res = await fetchJson(`/api/admin/task-bank/${encodeURIComponent(state.currentType)}/draft`, {
            method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({config: Object.assign({}, ensureConfig(state.config), {__edupathAdminFullConfig: true})})
        });
        state.dirty = false;
        toast(res.message || "تم حفظ المسودة.");
        await syncSelectedType(true);
    }
    async function publish() {
        if (!state.currentType || !state.config) return toast("اختر نوع مهمة أولاً.");
        if (!confirm("سيتم نشر التعديلات لتظهر في صفحة المهام العادية. هل تريد المتابعة؟")) return;
        const res = await fetchJson(`/api/admin/task-bank/${encodeURIComponent(state.currentType)}`, {
            method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({config: Object.assign({}, ensureConfig(state.config), {__edupathAdminFullConfig: true}), action: "v5.6.9_fix_real_adaptive_admin_editor", clear_draft: true})
        });
        state.dirty = false;
        toast(res.message || "تم النشر.");
        await syncSelectedType(true);
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
