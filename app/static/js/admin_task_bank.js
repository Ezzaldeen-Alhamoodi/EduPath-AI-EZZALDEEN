(function () {
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
        draftMode: true
    };

    const $ = (id) => document.getElementById(id);
    const clone = (obj) => JSON.parse(JSON.stringify(obj || {}));
    const normalize = (value) => String(value || "").trim();
    const esc = (value) => String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    const LEVELS = [
        {key: "main", selectId: "topicSelect", labelId: "topicLabel", defaultLabel: "الفئة الرئيسية"},
        {key: "sub", selectId: "skillSelect", labelId: "skillLabel", defaultLabel: "الفئة الفرعية"},
        {key: "detail", selectId: "detailedTopicSelect", labelId: "detailLabel", defaultLabel: "الموضوع التفصيلي"},
        {key: "training", selectId: "trainingTypeSelect", labelId: "trainingLabel", defaultLabel: "نوع النشاط"}
    ];

    function toast(message) {
        const box = document.createElement("div");
        box.className = "admin-bank-toast-v5600";
        box.textContent = message;
        document.body.appendChild(box);
        setTimeout(() => box.remove(), 2800);
    }

    function getTaskData() {
        window.EDUPATH_TASKS_AR_DATA = window.EDUPATH_TASKS_AR_DATA || {};
        return window.EDUPATH_TASKS_AR_DATA;
    }

    function getTypeFromForm() {
        const input = $("categorySelect");
        return normalize(input && input.value) || "عام";
    }

    function ensureConfig(config) {
        const c = clone(config);
        c.icon = c.icon || "✨";
        c.main = Array.isArray(c.main) ? c.main : ["أخرى"];
        c.sub = c.sub && typeof c.sub === "object" ? c.sub : {};
        c.detail = c.detail && typeof c.detail === "object" ? c.detail : {};
        c.training = Array.isArray(c.training) ? c.training : ["أخرى"];
        c.trainingByDetail = c.trainingByDetail && typeof c.trainingByDetail === "object" ? c.trainingByDetail : c.trainingByDetail;
        c.labels = c.labels && typeof c.labels === "object" ? c.labels : {};
        c.hidden = c.hidden && typeof c.hidden === "object" ? c.hidden : {main: [], sub: [], detail: [], training: []};
        ["main", "sub", "detail", "training"].forEach((level) => {
            if (!Array.isArray(c.hidden[level])) c.hidden[level] = [];
        });
        return c;
    }

    function uniqueList(items) {
        const out = [];
        (items || []).forEach((item) => {
            const text = normalize(item);
            if (text && !out.includes(text)) out.push(text);
        });
        if (!out.length) out.push("أخرى");
        return out;
    }

    async function fetchJson(url, options) {
        const response = await fetch(url, options || {});
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.ok === false) throw new Error(data.message || "حدث خطأ غير متوقع.");
        return data;
    }

    function refreshNativeForm() {
        getTaskData()[state.currentType] = clone(state.config);
        if (window.EDUPATH_NATIVE_TASKS_INIT) window.EDUPATH_NATIVE_TASKS_INIT();
        if (window.EDUPATH_APPLY_TASK_BANK_RUNTIME) window.EDUPATH_APPLY_TASK_BANK_RUNTIME();
        setTimeout(() => {
            if (window.EDUPATH_APPLY_TASK_BANK_RUNTIME) window.EDUPATH_APPLY_TASK_BANK_RUNTIME();
            renderEditor();
        }, 50);
    }

    async function syncSelectedType() {
        const typeName = getTypeFromForm();
        if (!typeName) return;
        if (state.dirty && state.currentType && state.currentType !== typeName) {
            if (!confirm("لديك تعديلات غير محفوظة. هل تريد الانتقال دون حفظ؟")) {
                const input = $("categorySelect");
                if (input) input.value = state.currentType;
                refreshNativeForm();
                return;
            }
        }
        state.currentType = typeName;
        const currentRuntime = ensureConfig(getTaskData()[typeName] || {});
        state.baseConfig = clone((window.EDUPATH_TASK_BANK_BASE_DATA || {})[typeName] || currentRuntime);
        state.config = clone(currentRuntime);
        try {
            const api = await fetchJson(`/api/admin/task-bank/${encodeURIComponent(typeName)}`);
            state.publishedConfig = api.config ? ensureConfig(api.config) : null;
            state.draftConfig = api.draft_config ? ensureConfig(api.draft_config) : null;
            state.revisions = api.revisions || [];
            if (state.draftConfig) {
                state.config = clone(state.draftConfig);
                getTaskData()[typeName] = clone(state.config);
                state.draftMode = true;
            } else if (state.publishedConfig) {
                state.config = clone(state.publishedConfig);
                getTaskData()[typeName] = clone(state.config);
                state.draftMode = false;
            }
        } catch (error) {
            toast(error.message || "تعذر تحميل بيانات الإدارة لهذا النوع.");
        }
        state.dirty = false;
        renderEditor();
        renderRevisions();
        refreshNativeForm();
        updateStatus();
    }

    function selectedMain() { return normalize($("topicSelect") && $("topicSelect").value); }
    function selectedSub() { return normalize($("skillSelect") && $("skillSelect").value); }
    function selectedDetail() { return normalize($("detailedTopicSelect") && $("detailedTopicSelect").value); }

    function currentLabel(level) {
        const meta = LEVELS.find((item) => item.key === level);
        const el = meta && $(meta.labelId);
        return normalize(el && el.textContent) || (meta && meta.defaultLabel) || level;
    }

    function getList(level) {
        if (!state.config) return [];
        if (level === "main") return state.config.main || [];
        if (level === "sub") {
            const main = selectedMain();
            state.config.sub[main] = uniqueList(state.config.sub[main] || state.config.sub["أخرى"] || ["أخرى"]);
            return state.config.sub[main];
        }
        if (level === "detail") {
            const sub = selectedSub();
            const main = selectedMain();
            state.config.detail[sub] = uniqueList(state.config.detail[sub] || state.config.detail[main] || state.config.detail["أخرى"] || ["أخرى"]);
            return state.config.detail[sub];
        }
        if (level === "training") {
            if (state.config.trainingByDetail) {
                const detail = selectedDetail();
                const sub = selectedSub();
                const main = selectedMain();
                const key = state.config.trainingByDetail[detail] ? detail : (state.config.trainingByDetail[sub] ? sub : (state.config.trainingByDetail[main] ? main : null));
                if (key) return uniqueList(state.config.trainingByDetail[key]);
            }
            state.config.training = uniqueList(state.config.training || ["أخرى"]);
            return state.config.training;
        }
        return [];
    }

    function setList(level, list) {
        const safe = uniqueList(list);
        if (level === "main") state.config.main = safe;
        if (level === "sub") state.config.sub[selectedMain()] = safe;
        if (level === "detail") state.config.detail[selectedSub()] = safe;
        if (level === "training") {
            if (state.config.trainingByDetail) {
                const detail = selectedDetail();
                if (detail && state.config.trainingByDetail[detail]) {
                    state.config.trainingByDetail[detail] = safe;
                } else {
                    state.config.training = safe;
                }
            } else {
                state.config.training = safe;
            }
        }
        markDirty();
        refreshNativeForm();
    }

    function markDirty() {
        state.dirty = true;
        updateStatus();
    }

    function updateStatus() {
        const box = $("adminTaskBankStatus");
        if (!box) return;
        const mode = state.draftConfig || state.draftMode ? "مسودة" : "منشور";
        box.textContent = state.currentType ? `النوع الحالي: ${state.currentType} · الوضع: ${mode}${state.dirty ? " · توجد تعديلات غير محفوظة" : ""}` : "اختر نوع مهمة من البطاقات كما في صفحة المهام.";
    }

    function renameKey(obj, oldKey, newKey) {
        if (!obj || oldKey === newKey || !Object.prototype.hasOwnProperty.call(obj, oldKey)) return;
        obj[newKey] = obj[oldKey];
        delete obj[oldKey];
    }

    function renameOption(level, index, newValue) {
        newValue = normalize(newValue);
        if (!newValue) return renderEditor();
        const list = getList(level).slice();
        const oldValue = list[index];
        if (oldValue === newValue) return;
        if (!confirm("الوضع الافتراضي سيحافظ على التفرعات التكيفية التابعة لهذا الخيار. هل تريد المتابعة؟")) return renderEditor();
        list[index] = newValue;
        if (level === "main") {
            renameKey(state.config.sub, oldValue, newValue);
            renameKey(state.config.detail, oldValue, newValue);
            if (state.config.trainingByDetail) renameKey(state.config.trainingByDetail, oldValue, newValue);
        }
        if (level === "sub") {
            renameKey(state.config.detail, oldValue, newValue);
            if (state.config.trainingByDetail) renameKey(state.config.trainingByDetail, oldValue, newValue);
        }
        if (level === "detail" && state.config.trainingByDetail) renameKey(state.config.trainingByDetail, oldValue, newValue);
        setList(level, list);
    }

    function moveOption(level, index, direction) {
        const list = getList(level).slice();
        const next = index + direction;
        if (next < 0 || next >= list.length) return;
        [list[index], list[next]] = [list[next], list[index]];
        setList(level, list);
    }

    function addOption(level) {
        if (!state.config) return;
        const value = normalize(prompt("اكتب اسم الخيار الجديد كما تريد أن يظهر للمستخدم:", ""));
        if (!value) return;
        const list = getList(level).slice();
        if (list.includes(value)) return toast("هذا الخيار موجود بالفعل.");
        const mode = prompt("طريقة إنشاء التفرعات التابعة:\n1 = تفرعات فارغة\n2 = نسخ تفرعات من خيار موجود\nاكتب 1 أو 2", "1");
        list.push(value);
        if (level === "main") {
            state.config.sub[value] = ["أخرى"];
            if (mode === "2") copyBranches("main", value);
        }
        if (level === "sub") {
            state.config.detail[value] = ["أخرى"];
            if (mode === "2") copyBranches("sub", value);
        }
        if (level === "detail" && state.config.trainingByDetail) state.config.trainingByDetail[value] = uniqueList(state.config.training || ["أخرى"]);
        setList(level, list);
    }

    function copyBranches(level, newValue) {
        const source = normalize(prompt("اكتب اسم الخيار الذي تريد نسخ تفرعاته منه:", ""));
        if (!source) return;
        if (level === "main" && state.config.sub[source]) state.config.sub[newValue] = clone(state.config.sub[source]);
        if (level === "sub" && state.config.detail[source]) state.config.detail[newValue] = clone(state.config.detail[source]);
        if (state.config.trainingByDetail && state.config.trainingByDetail[source]) state.config.trainingByDetail[newValue] = clone(state.config.trainingByDetail[source]);
    }

    function hideOption(level, index) {
        const list = getList(level);
        const value = list[index];
        state.config.hidden[level] = uniqueList([...(state.config.hidden[level] || []), value]);
        markDirty();
        refreshNativeForm();
        toast("تم إخفاء الخيار مع الحفاظ على تفرعاته.");
    }

    function unhideOption(level, value) {
        state.config.hidden[level] = (state.config.hidden[level] || []).filter((item) => item !== value);
        markDirty();
        refreshNativeForm();
    }

    function deleteOption(level, index) {
        const list = getList(level).slice();
        const value = list[index];
        const confirmText = prompt(`الحذف النهائي سيحذف الخيار وقد يحذف تفرعاته. لتأكيد الحذف النهائي اكتب اسم الخيار بالضبط:\n${value}`);
        if (confirmText !== value) return toast("تم إلغاء الحذف النهائي.");
        list.splice(index, 1);
        if (level === "main") {
            delete state.config.sub[value];
            delete state.config.detail[value];
            if (state.config.trainingByDetail) delete state.config.trainingByDetail[value];
        }
        if (level === "sub") {
            delete state.config.detail[value];
            if (state.config.trainingByDetail) delete state.config.trainingByDetail[value];
        }
        if (level === "detail" && state.config.trainingByDetail) delete state.config.trainingByDetail[value];
        setList(level, list);
    }

    function openManualOrder(level) {
        state.manualLevel = level;
        const modal = $("bankManualOrderModal");
        const textarea = $("manualOrderTextarea");
        if (textarea) textarea.value = getList(level).join("\n");
        if (modal) modal.hidden = false;
    }

    function closeManualOrder() {
        const modal = $("bankManualOrderModal");
        if (modal) modal.hidden = true;
        state.manualLevel = null;
    }

    function applyManualOrder() {
        if (!state.manualLevel) return;
        const lines = ($("manualOrderTextarea").value || "").split(/\n+/).map(normalize).filter(Boolean);
        setList(state.manualLevel, lines);
        closeManualOrder();
    }

    function editFieldLabel(level) {
        const current = currentLabel(level);
        const labels = state.config.labels || {};
        const next = normalize(prompt("اكتب اسم الخانة كما تريد أن يظهر في صفحة المهام:", current));
        if (!next) return;
        labels[level === "main" ? "topic" : level === "sub" ? "skill" : level] = next;
        state.config.labels = labels;
        markDirty();
        refreshNativeForm();
    }

    function renderEditor() {
        if (!state.config) return;
        const tabs = $("adminAdaptiveLevelTabs");
        if (tabs) {
            tabs.innerHTML = LEVELS.map((level) => `<button type="button" class="small-button ${state.selectedLevel === level.key ? "success" : ""}" data-level="${level.key}">${esc(currentLabel(level.key))}</button>`).join("");
            tabs.querySelectorAll("[data-level]").forEach((btn) => btn.addEventListener("click", () => { state.selectedLevel = btn.dataset.level; renderEditor(); }));
        }
        const labelTitle = $("adminCurrentFieldTitle");
        if (labelTitle) labelTitle.textContent = currentLabel(state.selectedLevel);
        const pathBox = $("adminAdaptivePathSummary");
        if (pathBox) pathBox.textContent = `المسار الحالي: ${state.currentType || "—"} → ${selectedMain() || "—"} → ${selectedSub() || "—"} → ${selectedDetail() || "—"}`;
        renderOptions();
        renderHidden();
        updateStatus();
    }

    function renderOptions() {
        const listBox = $("adminCurrentOptionsList");
        if (!listBox) return;
        const list = getList(state.selectedLevel);
        listBox.innerHTML = "";
        list.forEach((value, index) => {
            const row = document.createElement("div");
            row.className = "bank-option-row-v5600 admin-real-option-row-v5610";
            row.innerHTML = `
                <span class="option-order-v5600">${index + 1}</span>
                <input value="${esc(value)}" aria-label="اسم الخيار">
                <button type="button" class="small-button" data-act="up">↑ للأعلى</button>
                <button type="button" class="small-button" data-act="down">↓ للأسفل</button>
                <button type="button" class="small-button warning" data-act="hide">إخفاء آمن</button>
                <button type="button" class="small-button danger" data-act="delete">حذف نهائي</button>
            `;
            row.querySelector("input").addEventListener("change", (e) => renameOption(state.selectedLevel, index, e.target.value));
            row.querySelector('[data-act="up"]').addEventListener("click", () => moveOption(state.selectedLevel, index, -1));
            row.querySelector('[data-act="down"]').addEventListener("click", () => moveOption(state.selectedLevel, index, 1));
            row.querySelector('[data-act="hide"]').addEventListener("click", () => hideOption(state.selectedLevel, index));
            row.querySelector('[data-act="delete"]').addEventListener("click", () => deleteOption(state.selectedLevel, index));
            listBox.appendChild(row);
        });
    }

    function renderHidden() {
        const box = $("adminHiddenOptionsList");
        if (!box) return;
        const hidden = (state.config.hidden && state.config.hidden[state.selectedLevel]) || [];
        if (!hidden.length) {
            box.innerHTML = '<p class="muted">لا توجد خيارات مخفية في هذه الخانة.</p>';
            return;
        }
        box.innerHTML = hidden.map((value) => `<div class="bank-revision-item-v5600"><strong>${esc(value)}</strong><button type="button" class="small-button cancel" data-value="${esc(value)}">استعادة</button></div>`).join("");
        box.querySelectorAll("[data-value]").forEach((btn) => btn.addEventListener("click", () => unhideOption(state.selectedLevel, btn.dataset.value)));
    }

    function renderRevisions() {
        const box = $("bankRevisionsList");
        if (!box) return;
        if (!state.revisions.length) {
            box.innerHTML = '<p class="muted">لا توجد تعديلات منشورة بعد لهذا النوع.</p>';
            return;
        }
        box.innerHTML = "";
        state.revisions.forEach((rev) => {
            const item = document.createElement("div");
            item.className = "bank-revision-item-v5600";
            const date = rev.created_at ? new Date(rev.created_at).toLocaleString("ar") : "وقت غير محدد";
            item.innerHTML = `<strong>${esc(rev.action)}</strong><span>${esc(date)}</span><button type="button" class="small-button cancel">استعادة هذه النسخة</button>`;
            item.querySelector("button").addEventListener("click", () => rollback(rev.id));
            box.appendChild(item);
        });
    }

    async function saveDraft() {
        if (!state.currentType || !state.config) return toast("اختر نوع مهمة أولًا.");
        const data = await fetchJson(`/api/admin/task-bank/${encodeURIComponent(state.currentType)}/draft`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({config: state.config})
        });
        state.dirty = false;
        state.draftMode = true;
        toast(data.message || "تم حفظ المسودة.");
        await syncSelectedType();
    }

    async function publish() {
        if (!state.currentType || !state.config) return toast("اختر نوع مهمة أولًا.");
        if (!confirm("سيتم نشر التعديلات لتظهر في صفحة المهام العادية. هل أنت متأكد؟")) return;
        const data = await fetchJson(`/api/admin/task-bank/${encodeURIComponent(state.currentType)}`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({config: state.config, action: "publish_from_admin_editor", clear_draft: true})
        });
        state.dirty = false;
        state.draftMode = false;
        toast(data.message || "تم النشر.");
        await syncSelectedType();
    }

    async function rollback(revisionId) {
        if (!state.currentType) return;
        if (!confirm("هل تريد استعادة النسخة السابقة لهذا النوع فقط؟")) return;
        const data = await fetchJson(`/api/admin/task-bank/${encodeURIComponent(state.currentType)}/rollback`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({revision_id: revisionId || null})
        });
        toast(data.message || "تمت الاستعادة.");
        await syncSelectedType();
    }

    async function restoreRuntimeDefault() {
        if (!state.currentType || !state.baseConfig) return;
        if (!confirm("سيتم استعادة الافتراضي لهذا النوع فقط حسب بيانات صفحة المهام الأصلية. هل أنت متأكد؟")) return;
        state.config = clone(state.baseConfig);
        getTaskData()[state.currentType] = clone(state.config);
        markDirty();
        refreshNativeForm();
        toast("تم تجهيز الافتراضي كمسودة. اضغط نشر التعديلات إذا أردت تطبيقه للمستخدمين.");
    }

    function previewAsStudent() {
        const box = $("studentPreviewFrame");
        if (!box) return;
        box.hidden = !box.hidden;
        if (!box.hidden) box.scrollIntoView({behavior: "smooth", block: "start"});
    }

    function bind() {
        document.addEventListener("click", (event) => {
            const typeCard = event.target.closest("#taskTypeCards .task-type-card");
            if (typeCard) setTimeout(syncSelectedType, 80);
        });
        ["topicSelect", "skillSelect", "detailedTopicSelect", "trainingTypeSelect"].forEach((id) => {
            const el = $(id);
            if (el) el.addEventListener("change", () => setTimeout(renderEditor, 80));
        });
        $("saveDraftTaskBankBtn") && $("saveDraftTaskBankBtn").addEventListener("click", saveDraft);
        $("publishTaskBankBtn") && $("publishTaskBankBtn").addEventListener("click", publish);
        $("rollbackTaskBankBtn") && $("rollbackTaskBankBtn").addEventListener("click", () => rollback(null));
        $("restoreDefaultTaskBankBtn") && $("restoreDefaultTaskBankBtn").addEventListener("click", restoreRuntimeDefault);
        $("previewTaskBankBtn") && $("previewTaskBankBtn").addEventListener("click", previewAsStudent);
        $("addOptionBtn") && $("addOptionBtn").addEventListener("click", () => addOption(state.selectedLevel));
        $("manualOrderBtn") && $("manualOrderBtn").addEventListener("click", () => openManualOrder(state.selectedLevel));
        $("editFieldLabelBtn") && $("editFieldLabelBtn").addEventListener("click", () => editFieldLabel(state.selectedLevel));
        $("closeManualOrderBtn") && $("closeManualOrderBtn").addEventListener("click", closeManualOrder);
        $("applyManualOrderBtn") && $("applyManualOrderBtn").addEventListener("click", applyManualOrder);
        setTimeout(syncSelectedType, 500);
        setTimeout(syncSelectedType, 1200);
    }

    document.addEventListener("DOMContentLoaded", bind);
})();
