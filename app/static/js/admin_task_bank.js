(function () {
    const state = {
        typeName: "",
        config: null,
        dirty: false,
        manualLevel: null,
        revisions: []
    };

    const $ = (id) => document.getElementById(id);
    const clone = (obj) => JSON.parse(JSON.stringify(obj || {}));
    const normalize = (value) => String(value || "").trim();

    function toast(message) {
        const box = document.createElement("div");
        box.className = "admin-bank-toast-v5600";
        box.textContent = message;
        document.body.appendChild(box);
        setTimeout(() => box.remove(), 2600);
    }

    function ensureConfig(config) {
        const c = clone(config);
        c.icon = c.icon || "✨";
        c.main = Array.isArray(c.main) ? c.main : ["أخرى"];
        c.sub = c.sub && typeof c.sub === "object" ? c.sub : {};
        c.detail = c.detail && typeof c.detail === "object" ? c.detail : {};
        c.training = Array.isArray(c.training) ? c.training : ["أخرى"];
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

    function setSelectOptions(select, values, current) {
        if (!select) return;
        const safe = uniqueList(values);
        const previous = normalize(current || select.value);
        select.innerHTML = "";
        safe.forEach((value) => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            if (previous === value) option.selected = true;
            select.appendChild(option);
        });
        if (!select.value && safe.length) select.value = safe[0];
    }

    async function fetchJson(url, options) {
        const response = await fetch(url, options || {});
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.ok === false) throw new Error(data.message || "حدث خطأ غير متوقع.");
        return data;
    }

    async function loadType(typeName) {
        if (!typeName) return;
        if (state.dirty && !confirm("لديك تعديلات غير محفوظة. هل تريد الانتقال دون حفظ؟")) return;
        const data = await fetchJson(`/api/admin/task-bank/${encodeURIComponent(typeName)}`);
        state.typeName = data.type_name;
        state.config = ensureConfig(data.config);
        state.dirty = false;
        state.revisions = data.revisions || [];
        document.querySelectorAll(".admin-task-type-card-v5600").forEach((btn) => {
            btn.classList.toggle("active", btn.dataset.type === state.typeName);
        });
        renderAll();
        toast("تم تحميل نوع المهمة المحدد فقط.");
    }

    function selectedMain() { return normalize($("bankMainSelect") && $("bankMainSelect").value); }
    function selectedSub() { return normalize($("bankSubSelect") && $("bankSubSelect").value); }
    function selectedDetail() { return normalize($("bankDetailSelect") && $("bankDetailSelect").value); }

    function markDirty() {
        state.dirty = true;
        const box = $("bankStatusBox");
        if (box) box.textContent = `النوع الحالي: ${state.typeName} · توجد تعديلات غير محفوظة`;
    }

    function renderPathSelectors() {
        if (!state.config) return;
        setSelectOptions($("bankMainSelect"), state.config.main, selectedMain());
        const main = selectedMain();
        setSelectOptions($("bankSubSelect"), state.config.sub[main] || state.config.sub["أخرى"] || ["أخرى"], selectedSub());
        const sub = selectedSub();
        const details = state.config.detail[sub] || state.config.detail[main] || state.config.detail["أخرى"] || ["أخرى"];
        setSelectOptions($("bankDetailSelect"), details, selectedDetail());
        const box = $("bankStatusBox");
        if (box) box.textContent = state.dirty ? `النوع الحالي: ${state.typeName} · توجد تعديلات غير محفوظة` : `النوع الحالي: ${state.typeName} · محفوظ`;
    }

    function getListForLevel(level) {
        if (!state.config) return [];
        if (level === "main") return state.config.main;
        if (level === "sub") {
            const main = selectedMain();
            state.config.sub[main] = uniqueList(state.config.sub[main] || ["أخرى"]);
            return state.config.sub[main];
        }
        if (level === "detail") {
            const sub = selectedSub();
            state.config.detail[sub] = uniqueList(state.config.detail[sub] || state.config.detail["أخرى"] || ["أخرى"]);
            return state.config.detail[sub];
        }
        if (level === "training") return state.config.training;
        return [];
    }

    function setListForLevel(level, list) {
        const safe = uniqueList(list);
        if (level === "main") state.config.main = safe;
        if (level === "sub") state.config.sub[selectedMain()] = safe;
        if (level === "detail") state.config.detail[selectedSub()] = safe;
        if (level === "training") state.config.training = safe;
        markDirty();
        renderAll();
    }

    function renderOptionList(level, containerId) {
        const container = $(containerId);
        if (!container) return;
        const list = getListForLevel(level);
        container.innerHTML = "";
        list.forEach((value, index) => {
            const row = document.createElement("div");
            row.className = "bank-option-row-v5600";
            row.innerHTML = `
                <span class="option-order-v5600">${index + 1}</span>
                <input value="${String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;")}" aria-label="اسم الخيار">
                <button type="button" class="small-button" data-act="up">↑ للأعلى</button>
                <button type="button" class="small-button" data-act="down">↓ للأسفل</button>
                <button type="button" class="small-button warning" data-act="manual">ترتيب يدوي</button>
                <button type="button" class="small-button danger" data-act="hide">إخفاء/حذف</button>
            `;
            const input = row.querySelector("input");
            input.addEventListener("change", () => renameOption(level, index, input.value));
            row.querySelector('[data-act="up"]').addEventListener("click", () => moveOption(level, index, -1));
            row.querySelector('[data-act="down"]').addEventListener("click", () => moveOption(level, index, 1));
            row.querySelector('[data-act="manual"]').addEventListener("click", () => openManualOrder(level));
            row.querySelector('[data-act="hide"]').addEventListener("click", () => removeOption(level, index));
            container.appendChild(row);
        });
    }

    function renameKey(obj, oldKey, newKey) {
        if (!obj || oldKey === newKey || !Object.prototype.hasOwnProperty.call(obj, oldKey)) return;
        obj[newKey] = obj[oldKey];
        delete obj[oldKey];
    }

    function renameOption(level, index, newValue) {
        newValue = normalize(newValue);
        if (!newValue) return renderAll();
        const list = getListForLevel(level);
        const oldValue = list[index];
        if (oldValue === newValue) return;
        list[index] = newValue;
        if (level === "main") {
            renameKey(state.config.sub, oldValue, newValue);
            renameKey(state.config.detail, oldValue, newValue);
        }
        if (level === "sub") renameKey(state.config.detail, oldValue, newValue);
        setListForLevel(level, list);
    }

    function moveOption(level, index, direction) {
        const list = getListForLevel(level).slice();
        const next = index + direction;
        if (next < 0 || next >= list.length) return;
        [list[index], list[next]] = [list[next], list[index]];
        setListForLevel(level, list);
    }

    function removeOption(level, index) {
        const list = getListForLevel(level).slice();
        const value = list[index];
        if (!confirm(`هل تريد إخفاء/حذف الخيار: ${value}؟`)) return;
        list.splice(index, 1);
        if (!list.length) list.push("أخرى");
        setListForLevel(level, list);
    }

    function addOption(level) {
        if (!state.config) return;
        const value = normalize(prompt("اكتب اسم الخيار الجديد كما تريد أن يظهر للمستخدم:"));
        if (!value) return;
        const list = getListForLevel(level).slice();
        if (!list.includes(value)) list.push(value);
        if (level === "main") state.config.sub[value] = state.config.sub[value] || ["أخرى"];
        if (level === "sub") state.config.detail[value] = state.config.detail[value] || ["أخرى"];
        setListForLevel(level, list);
    }

    function openManualOrder(level) {
        state.manualLevel = level;
        const modal = $("bankManualOrderModal");
        const textarea = $("manualOrderTextarea");
        if (textarea) textarea.value = getListForLevel(level).join("\n");
        if (modal) modal.hidden = false;
    }

    function closeManualOrder() {
        const modal = $("bankManualOrderModal");
        if (modal) modal.hidden = true;
        state.manualLevel = null;
    }

    function applyManualOrder() {
        const level = state.manualLevel;
        if (!level) return;
        const lines = ($("manualOrderTextarea").value || "").split(/\n+/).map(normalize).filter(Boolean);
        setListForLevel(level, lines);
        closeManualOrder();
    }

    function renderRevisions() {
        const box = $("bankRevisionsList");
        if (!box) return;
        box.innerHTML = "";
        if (!state.revisions.length) {
            box.innerHTML = '<p class="muted">لا توجد تعديلات محفوظة بعد لهذا النوع.</p>';
            return;
        }
        state.revisions.forEach((rev) => {
            const item = document.createElement("div");
            item.className = "bank-revision-item-v5600";
            const date = rev.created_at ? new Date(rev.created_at).toLocaleString("ar") : "وقت غير محدد";
            item.innerHTML = `<strong>${rev.action}</strong><span>${date}</span><button type="button" class="small-button cancel">استعادة هذه النسخة</button>`;
            item.querySelector("button").addEventListener("click", () => rollback(rev.id));
            box.appendChild(item);
        });
    }

    function renderPreview() {
        if (!state.config) return;
        $("previewType").value = state.typeName;
        setSelectOptions($("previewMain"), state.config.main, selectedMain());
        const refreshSub = () => {
            const main = normalize($("previewMain").value);
            setSelectOptions($("previewSub"), state.config.sub[main] || state.config.sub["أخرى"] || ["أخرى"]);
            refreshDetail();
        };
        const refreshDetail = () => {
            const main = normalize($("previewMain").value);
            const sub = normalize($("previewSub").value);
            setSelectOptions($("previewDetail"), state.config.detail[sub] || state.config.detail[main] || state.config.detail["أخرى"] || ["أخرى"]);
            setSelectOptions($("previewTraining"), state.config.training || ["أخرى"]);
        };
        $("previewMain").onchange = refreshSub;
        $("previewSub").onchange = refreshDetail;
        refreshSub();
    }

    function renderAll() {
        renderPathSelectors();
        renderOptionList("main", "mainOptionsList");
        renderOptionList("sub", "subOptionsList");
        renderOptionList("detail", "detailOptionsList");
        renderOptionList("training", "trainingOptionsList");
        renderRevisions();
        renderPreview();
    }

    async function save() {
        if (!state.typeName || !state.config) return toast("اختر نوع مهمة أولًا.");
        const data = await fetchJson(`/api/admin/task-bank/${encodeURIComponent(state.typeName)}`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({config: state.config, action: "update"})
        });
        state.dirty = false;
        toast(data.message || "تم الحفظ.");
        await loadType(state.typeName);
    }

    async function rollback(revisionId) {
        if (!state.typeName) return;
        if (!confirm("هل تريد استعادة النسخة السابقة؟")) return;
        const data = await fetchJson(`/api/admin/task-bank/${encodeURIComponent(state.typeName)}/rollback`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({revision_id: revisionId || null})
        });
        toast(data.message || "تمت الاستعادة.");
        await loadType(state.typeName);
    }

    async function restoreDefault() {
        if (!state.typeName) return;
        if (!confirm("سيتم حذف تعديلات هذا النوع والرجوع للنسخة الافتراضية. هل أنت متأكد؟")) return;
        const data = await fetchJson(`/api/admin/task-bank/${encodeURIComponent(state.typeName)}/restore-default`, {method: "POST"});
        toast(data.message || "تمت استعادة الافتراضي.");
        await loadType(state.typeName);
    }

    document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll(".admin-task-type-card-v5600").forEach((btn) => btn.addEventListener("click", () => loadType(btn.dataset.type)));
        ["bankMainSelect", "bankSubSelect", "bankDetailSelect"].forEach((id) => {
            const el = $(id);
            if (el) el.addEventListener("change", renderAll);
        });
        document.querySelectorAll("[data-add-level]").forEach((btn) => btn.addEventListener("click", () => addOption(btn.dataset.addLevel)));
        $("saveTaskBankBtn").addEventListener("click", save);
        $("rollbackTaskBankBtn").addEventListener("click", () => rollback(null));
        $("restoreDefaultTaskBankBtn").addEventListener("click", restoreDefault);
        $("previewTaskBankBtn").addEventListener("click", () => {
            const box = $("bankPreviewBox");
            if (box) box.hidden = !box.hidden;
            renderPreview();
        });
        $("closeManualOrderBtn").addEventListener("click", closeManualOrder);
        $("applyManualOrderBtn").addEventListener("click", applyManualOrder);
        const first = document.querySelector(".admin-task-type-card-v5600");
        if (first) loadType(first.dataset.type);
    });
})();
