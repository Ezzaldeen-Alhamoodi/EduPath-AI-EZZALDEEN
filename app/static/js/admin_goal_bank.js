(function () {
    "use strict";

    const state = {
        type: "التعليم",
        baseConfig: {},
        publishedConfig: {},
        draftConfig: null,
        config: {},
        level: "category",
        revisions: [],
        dirty: false
    };

    const LEVELS = [
        { key: "type", label: "نوع الهدف" },
        { key: "category", label: "تصنيف الهدف" },
        { key: "path", label: "مسار الهدف" },
        { key: "current", label: "الحالة الحالية" },
        { key: "target", label: "الحالة المستهدفة" },
        { key: "commitment", label: "الالتزام اليومي أو الأسبوعي" }
    ];
    const EDITABLE_LEVELS = ["type", "category", "path", "current", "target", "commitment"];

    function $(id) { return document.getElementById(id); }
    function clone(obj) { try { return JSON.parse(JSON.stringify(obj || {})); } catch (e) { return {}; } }
    function esc(v) { return String(v == null ? "" : v).replace(/[&<>'"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch])); }
    function normalize(v) { return String(v == null ? "" : v).trim(); }
    function otherGuard(list) { return window.EDUPATH_ENSURE_OTHER_OPTION ? window.EDUPATH_ENSURE_OTHER_OPTION(list || []) : unique(list || []); }
    function unique(list) {
        const out = [];
        (Array.isArray(list) ? list : []).forEach(function (item) {
            let v = normalize(item);
            if (["Other", "other", "اخرى", "أُخرى"].includes(v)) v = "أخرى";
            if (!v || v === "أخرى" || out.includes(v)) return;
            out.push(v);
        });
        out.push("أخرى");
        return out;
    }
    function isProtectedOther(value) { return (window.EDUPATH_IS_OTHER_OPTION && window.EDUPATH_IS_OTHER_OPTION(value)) || normalize(value) === "أخرى"; }
    function normalizeConfigOther(cfg) { if (window.EDUPATH_NORMALIZE_ADAPTIVE_CONFIG) window.EDUPATH_NORMALIZE_ADAPTIVE_CONFIG(cfg); return cfg; }
    function label(v) { return (window.EDUPATH_GOAL_LABEL && window.EDUPATH_GOAL_LABEL(v)) || v; }
    function merge(base, override) {
        if (window.EDUPATH_GOAL_BANK_DEEP_MERGE) return normalizeConfigOther(window.EDUPATH_GOAL_BANK_DEEP_MERGE(base || {}, override || {}));
        const out = clone(base);
        Object.keys(override || {}).forEach(k => {
            const val = override[k];
            if (Array.isArray(val)) out[k] = otherGuard([...(Array.isArray(out[k]) ? out[k] : []), ...val]);
            else if (val && typeof val === "object") out[k] = merge(out[k] || {}, val);
            else out[k] = val;
        });
        return normalizeConfigOther(out);
    }
    function baseAll() { return clone(window.EDUPATH_GOAL_BANK_BASE_DATA || window.EDUPATH_GET_GOAL_BANK_CONFIG?.() || {}); }
    function allTypeNames() {
        const fromSelect = selectValues("goalTypeSelect").filter(Boolean);
        const fromBase = Object.keys(baseAll() || {});
        return fromSelect.length ? fromSelect : fromBase;
    }
    function selectValues(id) { const el = $(id); return el ? Array.from(el.options).map(o => o.value).filter(Boolean) : []; }
    function selectedPath() {
        return {
            category: ($("goalCategorySelect") || {}).value || "",
            path: ($("goalPathSelect") || {}).value || "",
            current: ($("currentStateSelect") || {}).value || "",
            target: ($("targetStateSelect") || {}).value || "",
            commitment: ($("commitmentSelect") || {}).value || ""
        };
    }
    function stateKeysFor(cat, path) {
        const keys = [];
        if (cat && path) keys.push(`${cat}::${path}`);
        if (path) keys.push(path);
        if (cat) keys.push(cat);
        keys.push("أخرى");
        return keys;
    }
    function stateBox(config, create, catArg, pathArg) {
        if (create && !config.states) config.states = {};
        const states = config.states || {};
        const p = selectedPath();
        const cat = catArg || p.category || "أخرى";
        const path = pathArg || p.path || "أخرى";
        for (const key of stateKeysFor(cat, path)) if (states[key]) return states[key];
        if (create) {
            const key = cat && path ? `${cat}::${path}` : path || cat || "أخرى";
            states[key] = { current: ["أخرى"], target: ["أخرى"], commitment: ["أخرى"] };
            return states[key];
        }
        return { current: ["أخرى"], target: ["أخرى"], commitment: ["أخرى"] };
    }
    function getListForLevel(level) {
        if (level === "type") return otherGuard((state.config && state.config.typeOrder && state.config.typeOrder.length ? state.config.typeOrder : allTypeNames()));
        if (level === "category") return otherGuard(selectValues("goalCategorySelect").length ? selectValues("goalCategorySelect") : (state.config.categories || ["أخرى"]));
        if (level === "path") {
            const p = selectedPath();
            const paths = state.config.paths || {};
            return otherGuard(selectValues("goalPathSelect").length ? selectValues("goalPathSelect") : (paths[p.category] || paths["أخرى"] || ["أخرى"]));
        }
        if (level === "current") return otherGuard(selectValues("currentStateSelect").length ? selectValues("currentStateSelect") : (stateBox(state.config).current || ["أخرى"]));
        if (level === "target") return otherGuard(selectValues("targetStateSelect").length ? selectValues("targetStateSelect") : (stateBox(state.config).target || ["أخرى"]));
        if (level === "commitment") return otherGuard(selectValues("commitmentSelect").length ? selectValues("commitmentSelect") : (stateBox(state.config).commitment || ["أخرى"]));
        return ["أخرى"];
    }
    function getRawList(level) {
        if (level === "type") return otherGuard((state.config && state.config.typeOrder && state.config.typeOrder.length ? state.config.typeOrder : allTypeNames()));
        if (level === "category") return otherGuard(state.config.categories || selectValues("goalCategorySelect"));
        if (level === "path") {
            const cat = selectedPath().category || "أخرى";
            if (!state.config.paths) state.config.paths = {};
            if (!state.config.paths[cat]) state.config.paths[cat] = getListForLevel("path");
            return otherGuard(state.config.paths[cat]);
        }
        if (["current", "target", "commitment"].includes(level)) {
            const box = stateBox(state.config, true);
            if (!box[level] || !box[level].length) box[level] = getListForLevel(level);
            return otherGuard(box[level]);
        }
        return ["أخرى"];
    }
    function setListForLevel(level, list) {
        if (level === "type") {
            state.config.typeOrder = otherGuard(list).filter(v => !isProtectedOther(v));
            markDirty();
            return renderEditor();
        }
        list = otherGuard(list);
        if (level === "category") state.config.categories = list;
        else if (level === "path") {
            const cat = selectedPath().category || "أخرى";
            if (!state.config.paths) state.config.paths = {};
            state.config.paths[cat] = list;
        } else if (["current", "target", "commitment"].includes(level)) {
            const box = stateBox(state.config, true);
            box[level] = list;
        }
        markDirty();
        refreshNative(level);
        renderEditor();
    }
    function childLevel(level) {
        if (level === "type") return "category";
        if (level === "category") return "path";
        if (level === "path") return "current";
        return null;
    }
    function currentLabel(level) {
        const custom = state.config && state.config.labels && state.config.labels[level];
        return custom || (LEVELS.find(x => x.key === level) || {}).label || level;
    }
    function parseLines(text) { return otherGuard(String(text || "").split(/\n|،|,/).map(x => x.trim()).filter(Boolean)); }
    function setStateTriplet(cat, path, currentList, targetList, commitmentList) {
        if (!state.config.states) state.config.states = {};
        const key = `${cat || "أخرى"}::${path || "أخرى"}`;
        state.config.states[key] = {
            current: otherGuard(currentList && currentList.length ? currentList : ["أخرى"]),
            target: otherGuard(targetList && targetList.length ? targetList : ["أخرى"]),
            commitment: otherGuard(commitmentList && commitmentList.length ? commitmentList : ["أخرى"])
        };
    }
    function setChildBranches(parentLevel, parentName, branches, extra) {
        branches = otherGuard(branches || []);
        const p = selectedPath();
        if (parentLevel === "type") {
            if (parentName !== state.type) { toast("يمكن إدارة تفرعات نوع الهدف الحالي فقط من هذه الصفحة."); return; }
            state.config.categories = branches;
            return;
        }
        if (parentLevel === "category") {
            if (!state.config.paths) state.config.paths = {};
            state.config.paths[parentName] = branches;
            branches.filter(x => !isProtectedOther(x)).forEach(branch => {
                setStateTriplet(parentName, branch, extra?.current, extra?.target, extra?.commitment);
            });
        } else if (parentLevel === "path") {
            setStateTriplet(p.category || "أخرى", parentName, extra?.current || branches, extra?.target, extra?.commitment);
        }
    }
    function childList(level, value) {
        if (level === "type") return otherGuard((value === state.type ? state.config.categories : baseAll()[value]?.categories) || ["أخرى"]);
        if (level === "category") return otherGuard((state.config.paths || {})[value] || ["أخرى"]);
        if (level === "path") {
            const cat = selectedPath().category || "أخرى";
            return otherGuard(stateBox(state.config, false, cat, value).current || ["أخرى"]);
        }
        return ["أخرى"];
    }
    function markDirty() { state.dirty = true; setStatus(`توجد تعديلات غير محفوظة في نوع الهدف: ${label(state.type)}`); }
    function buildConfig() {
        state.baseConfig = normalizeConfigOther(clone(baseAll()[state.type] || {}));
        state.config = normalizeConfigOther(merge(state.baseConfig, state.draftConfig || state.publishedConfig || {}));
    }
    function fillTypeSelect() {
        const typeEl = $("goalTypeSelect"); if (!typeEl) return;
        const names = allTypeNames().filter(v => !isProtectedOther(v));
        const old = typeEl.value || state.type;
        typeEl.innerHTML = "";
        names.forEach(name => { const opt = document.createElement("option"); opt.value = name; opt.textContent = label(name); typeEl.appendChild(opt); });
        if (names.includes(old)) typeEl.value = old;
        else if (names.length) { typeEl.value = names[0]; state.type = names[0]; }
    }
    function refreshNative(changed) {
        try {
            const all = window.EDUPATH_GET_GOAL_BANK_CONFIG?.();
            if (all && state.type) {
                // state.config is already the effective full config shown in Admin.
                // Do not union it back with base here, because union-style merging keeps the old order
                // and makes published/admin ordering look as if it did not apply.
                all[state.type] = normalizeConfigOther(clone(state.config));
            }
            const typeSelect = $("goalTypeSelect");
            if (typeSelect && changed === "type") delete typeSelect.dataset.v524Ready;
            window.EDUPATH_REFRESH_GOALS_ADAPTIVE?.(changed === "category" ? "goalTypeSelect" : changed === "path" ? "goalCategorySelect" : changed === "type" ? "goalTypeSelect" : "goalPathSelect");
        } catch (e) {}
    }
    function loadType(type) {
        state.type = type || state.type;
        if (!state.type) state.type = allTypeNames()[0] || "التعليم";
        fetch(`/api/admin/goal-bank/${encodeURIComponent(state.type)}`, { credentials: "same-origin" })
            .then(r => r.ok ? r.json() : {})
            .then(data => {
                state.publishedConfig = data.config || (window.EDUPATH_GOAL_BANK_OVERRIDES || {})[state.type] || {};
                state.draftConfig = data.draft_config || null;
                state.revisions = data.revisions || [];
                state.dirty = false;
                buildConfig(); fillTypeSelect(); refreshNative("goalTypeSelect"); renderEditor(); renderRevisions();
                setStatus(data.has_draft ? "توجد مسودة محفوظة لهذا النوع." : "جاهز للتعديل.");
            })
            .catch(() => { state.publishedConfig = (window.EDUPATH_GOAL_BANK_OVERRIDES || {})[state.type] || {}; state.draftConfig = null; buildConfig(); fillTypeSelect(); refreshNative("goalTypeSelect"); renderEditor(); });
    }
    function setStatus(text) { const el = $("adminGoalBankStatus"); if (el) el.textContent = text; }
    function toast(text) { setStatus(text); try { console.log(text); } catch(e){} }
    function syncTypeFromForm() {
        const typeEl = $("goalTypeSelect");
        const newType = typeEl?.value || state.type || allTypeNames()[0] || "التعليم";
        if (newType !== state.type) { state.type = newType; loadType(newType); return; }
        renderEditor();
    }
    function renderTabs() {
        const box = $("adminGoalLevelTabs"); if (!box) return;
        box.innerHTML = "";
        LEVELS.forEach(l => {
            const b = document.createElement("button");
            b.type = "button"; b.className = `small-button ${l.key === state.level ? "success" : ""}`; b.textContent = l.label;
            b.addEventListener("click", () => { state.level = l.key; renderEditor(); });
            box.appendChild(b);
        });
    }
    function renderEditor() {
        renderTabs();
        const p = selectedPath();
        const summary = $("adminGoalPathSummary");
        if (summary) summary.textContent = `المسار الحالي: ${label(state.type)}${p.category ? " ← " + label(p.category) : ""}${p.path ? " ← " + label(p.path) : ""}`;
        const title = $("adminGoalCurrentFieldTitle"); if (title) title.textContent = currentLabel(state.level);
        renderHint(); renderOptions(); renderHidden();
    }
    function renderHint() {
        let hint = $("adminGoalAdaptiveSourceHint");
        const listBox = $("adminGoalOptionsList");
        if (!listBox) return;
        if (!hint) { hint = document.createElement("p"); hint.id = "adminGoalAdaptiveSourceHint"; hint.className = "muted admin-adaptive-source-hint-v5681"; listBox.parentNode.insertBefore(hint, listBox); }
        hint.textContent = state.level === "type" ? "هذا التبويب يعرض أنواع الأهداف كما تظهر في النموذج العلوي. لا يتم حذف أو تغيير البنك الأصلي." : "القائمة الحالية تقرأ من نفس النموذج العلوي. أي تعديل يُحفظ لهذا النوع/المسار فقط بعد حفظ المسودة أو النشر.";
    }
    function renderOptions() {
        const box = $("adminGoalOptionsList"); if (!box) return;
        const list = getListForLevel(state.level);
        box.innerHTML = "";
        list.forEach((value, index) => {
            const row = document.createElement("div");
            const protectedOther = isProtectedOther(value);
            row.className = "bank-option-row-v5600 admin-real-option-row-v5610 admin-goal-option-row-v5615";
            row.dataset.value = value;
            row.dataset.index = String(index);
            const canEdit = EDITABLE_LEVELS.includes(state.level) && !protectedOther;
            const canRenameDelete = canEdit && state.level !== "type";
            const canBranch = canEdit && !["commitment", "current", "target"].includes(state.level);
            row.innerHTML = `
                <span class="option-order-v5600">${index + 1}</span>
                <input value="${esc(value)}" aria-label="اسم الخيار" ${canRenameDelete ? "" : "disabled"}>
                <div class="admin-goal-row-actions-v5616">
                    <button type="button" class="small-button" data-act="up" ${canEdit ? "" : "disabled"}>↑ للأعلى</button>
                    <button type="button" class="small-button" data-act="down" ${canEdit ? "" : "disabled"}>↓ للأسفل</button>
                    <button type="button" class="small-button" data-act="branches" ${canBranch ? "" : "disabled"}>إدارة التفرعات</button>
                    <button type="button" class="small-button" data-act="copy" ${canBranch ? "" : "disabled"}>نسخ التفرعات</button>
                    <button type="button" class="small-button warning" data-act="hide" ${canEdit ? "" : "disabled"}>إخفاء آمن</button>
                    <button type="button" class="small-button danger" data-act="delete" ${canRenameDelete ? "" : "disabled"}>حذف نهائي</button>
                </div>
                ${protectedOther ? '<small class="muted">خيار ثابت يفتح خانة مخصصة ولا يمكن حذفه أو إخفاؤه.</small>' : ''}
                ${state.level === "type" ? '<small class="muted">يمكن ترتيب/إخفاء نوع الهدف من هنا، ولا يتم حذف أو إعادة تسمية البنك الأصلي.</small>' : ''}`;
            row.querySelector("input").addEventListener("change", e => renameOption(value, e.target.value));
            row.querySelectorAll("button[data-act]").forEach(function (btn) {
                btn.addEventListener("click", function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    runOptionAction(btn.dataset.act, value, index);
                });
            });
            box.appendChild(row);
        });
    }
    function renameOption(oldName, nextValue) {
        if (!EDITABLE_LEVELS.includes(state.level)) return renderEditor();
        if (isProtectedOther(oldName)) { alert('لا يمكن تغيير اسم خيار "أخرى" لأنه خيار ثابت في النظام.'); return renderEditor(); }
        const next = normalize(nextValue);
        if (!next || next === oldName) return renderEditor();
        if (isProtectedOther(next)) { alert('لا يمكن استخدام اسم "أخرى" إلا للخيار الثابت في آخر القائمة.'); return renderEditor(); }
        const list = getRawList(state.level).map(x => x === oldName ? next : x);
        if (!confirm("سيتم نقل التفرعات التابعة إلى الاسم الجديد. هل تريد المتابعة؟")) return renderEditor();
        if (state.level === "category" && state.config.paths) { state.config.paths[next] = state.config.paths[oldName] || state.config.paths[next] || ["أخرى"]; delete state.config.paths[oldName]; }
        if (state.level === "path" && state.config.states) {
            const cat = selectedPath().category || "أخرى";
            const oldKey = `${cat}::${oldName}`, newKey = `${cat}::${next}`;
            state.config.states[newKey] = state.config.states[oldKey] || state.config.states[oldName] || state.config.states[next] || { current:["أخرى"], target:["أخرى"], commitment:["أخرى"] };
            delete state.config.states[oldKey]; delete state.config.states[oldName];
        }
        setListForLevel(state.level, list);
    }
    function hideOption(item) {
        if (!EDITABLE_LEVELS.includes(state.level)) return toast("هذا المستوى غير قابل للإخفاء.");
        if (isProtectedOther(item)) { alert('لا يمكن إخفاء خيار "أخرى" لأنه يجب أن يبقى متاحاً دائماً في آخر القائمة.'); return; }
        if (!confirm(`إخفاء آمن للخيار: ${item}؟`)) return;
        if (!state.config.hiddenByPath) state.config.hiddenByPath = {};
        const key = `${state.level}::${state.type}::${selectedPath().category || ""}::${selectedPath().path || ""}`;
        state.config.hiddenByPath[key] = otherGuard([...(state.config.hiddenByPath[key] || []), item]);
        setListForLevel(state.level, getRawList(state.level).filter(x => x !== item));
        renderHidden();
    }
    function deleteOption(item) {
        if (!EDITABLE_LEVELS.includes(state.level)) return toast("لا يتم حذف أنواع الأهداف من هنا حفاظاً على البنك الأصلي.");
        if (isProtectedOther(item)) { alert('لا يمكن حذف خيار "أخرى" لأنه خيار ثابت يتيح إدخال قيمة مخصصة.'); return; }
        const typed = prompt(`هذا حذف نهائي من المسار الحالي فقط. اكتب اسم الخيار للتأكيد:\n${item}`);
        if (typed !== item) return;
        setListForLevel(state.level, getRawList(state.level).filter(x => x !== item));
    }
    function moveOption(index, dir) {
        if (!EDITABLE_LEVELS.includes(state.level)) return toast("هذا المستوى غير قابل للترتيب.");
        const list = getRawList(state.level);
        if (isProtectedOther(list[index])) { alert('خيار "أخرى" ثابت في آخر القائمة ولا يمكن تحريكه.'); return; }
        const target = index + dir;
        if (target < 0 || target >= list.length - 1) return;
        [list[index], list[target]] = [list[target], list[index]];
        setListForLevel(state.level, list);
    }
    function copyBranches(item) {
        const siblings = getListForLevel(state.level).filter(x => x !== item && !isProtectedOther(x));
        if (!siblings.length) return toast("لا يوجد خيار آخر للنسخ منه.");
        const src = normalize(prompt("اكتب اسم الخيار الذي تريد نسخ تفرعاته:", siblings[0]));
        if (!src || !siblings.includes(src)) return toast("لم يتم اختيار مصدر صحيح.");
        setChildBranches(state.level, item, childList(state.level, src), { current: stateBox(state.config, false, selectedPath().category, src).current, target: stateBox(state.config, false, selectedPath().category, src).target, commitment: stateBox(state.config, false, selectedPath().category, src).commitment });
        markDirty(); refreshNative(state.level); renderEditor();
    }

    function runOptionAction(act, value, index) {
        if (!act) return;
        if (act === "up") return moveOption(index, -1);
        if (act === "down") return moveOption(index, 1);
        if (act === "branches") return openBranchesModal(value);
        if (act === "copy") return copyBranches(value);
        if (act === "hide") return hideOption(value);
        if (act === "delete") return deleteOption(value);
    }
    function handleOptionAction(evt) {
        const btn = evt.target.closest && evt.target.closest("button[data-act]");
        if (!btn || btn.disabled) return;
        evt.preventDefault();
        const row = btn.closest(".admin-goal-option-row-v5615");
        if (!row) return;
        runOptionAction(btn.dataset.act, row.dataset.value || "", parseInt(row.dataset.index || "0", 10));
    }
    function renderHidden() {
        const box = $("adminGoalHiddenList"); if (!box) return;
        const hidden = state.config.hiddenByPath || {};
        const keys = Object.keys(hidden);
        box.innerHTML = keys.length ? keys.map(k => `<div class="bank-revision-item-v5600"><strong>${esc(k)}</strong><span>${esc((hidden[k]||[]).join("، "))}</span></div>`).join("") : '<p class="muted">لا توجد خيارات مخفية.</p>';
    }
    function refreshAddModalMode() {
        const child = childLevel(state.level);
        const mode = $("goalNewOptionBranchMode")?.value || "manual";
        const pos = $("goalNewOptionPosition")?.value || "end";
        if ($("goalNewOptionAfterSelect")) $("goalNewOptionAfterSelect").style.display = pos === "after" ? "block" : "none";
        if ($("goalAddBranchPanel")) $("goalAddBranchPanel").style.display = child ? "block" : "none";
        if ($("goalNewOptionCopySource")) $("goalNewOptionCopySource").style.display = mode === "copy" ? "block" : "none";
        if ($("goalNewOptionBranches")) $("goalNewOptionBranches").style.display = mode === "manual" ? "block" : "none";
        if ($("goalNewOptionEmptyCount")) $("goalNewOptionEmptyCount").style.display = mode === "empty" ? "block" : "none";
        const trip = $("goalAddStateTripletPanel");
        if (trip) trip.style.display = (state.level === "category" || state.level === "path") && child ? "grid" : "none";
        refreshGoalPerBranchDesigner();
    }

    function ensureGoalPerBranchDesigner() {
        let box = $("goalPerBranchDesigner");
        const panel = $("goalAddStateTripletPanel");
        if (!panel) return null;
        if (!box) {
            box = document.createElement("div");
            box.id = "goalPerBranchDesigner";
            box.className = "admin-goal-per-branch-v5616";
            box.innerHTML = `<h3>تفصيل تكيفي لكل تفرع</h3><p class="muted">اختياري: اكتب الحالات الحالية والمستهدفة والالتزامات لكل تفرع بشكل مستقل. إذا تركت حقلاً فارغاً سيستخدم القيم العامة أعلاه.</p><div id="goalPerBranchRows"></div>`;
            panel.parentNode.insertBefore(box, panel.nextSibling);
        }
        return box;
    }
    function manualBranchNamesForDesigner() {
        const mode = $("goalNewOptionBranchMode")?.value || "manual";
        if (mode === "manual") return parseLines($("goalNewOptionBranches")?.value || "").filter(v => !isProtectedOther(v));
        if (mode === "empty") {
            const count = Math.max(0, parseInt($("goalNewOptionEmptyCount")?.value || "0", 10));
            return Array.from({ length: count }, (_, i) => `تفرع جديد ${i + 1}`);
        }
        if (mode === "copy") return childList(state.level, $("goalNewOptionCopySource")?.value || "").filter(v => !isProtectedOther(v));
        return [];
    }
    function buildGoalPerBranchDesigner(names) {
        const box = ensureGoalPerBranchDesigner();
        if (!box) return;
        const rows = $("goalPerBranchRows");
        if (!rows) return;
        if (!(state.level === "category" || state.level === "path") || !childLevel(state.level)) { box.style.display = "none"; return; }
        box.style.display = "block";
        const existing = {};
        rows.querySelectorAll("[data-branch]").forEach(row => {
            existing[row.dataset.branch] = {
                current: row.querySelector('[data-kind="current"]')?.value || "",
                target: row.querySelector('[data-kind="target"]')?.value || "",
                commitment: row.querySelector('[data-kind="commitment"]')?.value || ""
            };
        });
        rows.innerHTML = "";
        (names || []).forEach(name => {
            const old = existing[name] || {};
            const row = document.createElement("div");
            row.className = "admin-goal-branch-row-v5616";
            row.dataset.branch = name;
            row.innerHTML = `<strong>${esc(name)}</strong>
                <label>الحالة الحالية لهذا التفرع</label><textarea data-kind="current" rows="2" placeholder="كل خيار في سطر">${esc(old.current || "")}</textarea>
                <label>الحالة المستهدفة لهذا التفرع</label><textarea data-kind="target" rows="2" placeholder="كل خيار في سطر">${esc(old.target || "")}</textarea>
                <label>الالتزام لهذا التفرع</label><textarea data-kind="commitment" rows="2" placeholder="كل خيار في سطر">${esc(old.commitment || "")}</textarea>`;
            rows.appendChild(row);
        });
        if (!names.length) rows.innerHTML = '<p class="muted">اكتب التفرعات أولاً ليظهر لكل تفرع إعداداته الخاصة.</p>';
    }
    function refreshGoalPerBranchDesigner() { buildGoalPerBranchDesigner(manualBranchNamesForDesigner()); }
    function perBranchTriplets() {
        const out = {};
        const rows = $("goalPerBranchRows");
        if (!rows) return out;
        rows.querySelectorAll("[data-branch]").forEach(row => {
            const name = row.dataset.branch;
            out[name] = {
                current: parseLines(row.querySelector('[data-kind="current"]')?.value || ""),
                target: parseLines(row.querySelector('[data-kind="target"]')?.value || ""),
                commitment: parseLines(row.querySelector('[data-kind="commitment"]')?.value || "")
            };
        });
        return out;
    }
    function openAddModal() {
        if (!EDITABLE_LEVELS.includes(state.level)) { toast("إضافة نوع هدف جديد تحتاج تحديثاً عاماً للبنك، لذلك أضف الخيارات داخل نوع هدف محدد من التبويبات الأخرى."); return; }
        const modal = $("goalAddOptionModal"); if (!modal) return;
        const list = getListForLevel(state.level);
        const child = childLevel(state.level);
        $("goalAddOptionTitle").textContent = `إضافة خيار في: ${currentLabel(state.level)}`;
        $("goalAddOptionPathHint").textContent = `المسار الحالي: ${label(state.type)} → ${selectedPath().category || "—"} → ${selectedPath().path || "—"}`;
        $("goalNewOptionName").value = "";
        $("goalNewOptionAfterSelect").innerHTML = list.map(v => `<option value="${esc(v)}">${esc(label(v))}</option>`).join("");
        $("goalNewOptionCopySource").innerHTML = list.filter(v => !isProtectedOther(v)).map(v => `<option value="${esc(v)}">نسخ من: ${esc(label(v))}</option>`).join("");
        $("goalNewOptionBranchesLabel").textContent = child ? `ماذا يظهر في خانة: ${currentLabel(child)}؟` : "هذا المستوى الأخير ولا يحتاج تفرعات";
        $("goalNewOptionBranches").value = child ? "أخرى" : "";
        $("goalNewOptionCurrentBranches").value = "أخرى";
        $("goalNewOptionTargetBranches").value = "أخرى";
        $("goalNewOptionCommitmentBranches").value = "أخرى";
        buildGoalPerBranchDesigner([]);
        $("goalNewOptionPosition").value = "end";
        $("goalNewOptionBranchMode").value = child ? "manual" : "empty";
        $("goalNewOptionEmptyCount").value = child ? "1" : "0";
        refreshAddModalMode();
        modal.hidden = false;
        setTimeout(() => $("goalNewOptionName")?.focus(), 20);
    }
    function closeAddModal() { const modal = $("goalAddOptionModal"); if (modal) modal.hidden = true; }
    function applyAddOption() {
        const name = normalize($("goalNewOptionName")?.value);
        if (!name) { alert("اكتب اسم الخيار أولاً."); return; }
        if (isProtectedOther(name)) { alert('لا يمكن إضافة "أخرى" يدوياً لأنها تُضاف تلقائياً في آخر كل قائمة.'); return; }
        const level = state.level;
        const position = $("goalNewOptionPosition")?.value || "end";
        const after = $("goalNewOptionAfterSelect")?.value || "";
        const list = getRawList(level).filter(x => x !== name);
        if (position === "start") list.unshift(name);
        else if (position === "after" && after && list.includes(after)) list.splice(list.indexOf(after) + 1, 0, name);
        else list.push(name);
        const child = childLevel(level);
        const mode = $("goalNewOptionBranchMode")?.value || "manual";
        let branches = ["أخرى"];
        if (child) {
            if (mode === "copy") branches = childList(level, $("goalNewOptionCopySource")?.value || "");
            else if (mode === "empty") {
                const count = Math.max(0, parseInt($("goalNewOptionEmptyCount")?.value || "0", 10));
                branches = Array.from({ length: count }, (_, i) => `تفرع جديد ${i + 1}`);
            } else branches = parseLines($("goalNewOptionBranches")?.value || "");
            const common = {
                current: parseLines($("goalNewOptionCurrentBranches")?.value || ""),
                target: parseLines($("goalNewOptionTargetBranches")?.value || ""),
                commitment: parseLines($("goalNewOptionCommitmentBranches")?.value || "")
            };
            setChildBranches(level, name, branches, common);
            const detailed = perBranchTriplets();
            if (level === "category") {
                branches.filter(x => !isProtectedOther(x)).forEach(branch => {
                    const d = detailed[branch] || {};
                    setStateTriplet(name, branch, d.current && d.current.length ? d.current : common.current, d.target && d.target.length ? d.target : common.target, d.commitment && d.commitment.length ? d.commitment : common.commitment);
                });
            } else if (level === "path") {
                const d = detailed[name] || {};
                setStateTriplet(selectedPath().category || "أخرى", name, d.current && d.current.length ? d.current : common.current, d.target && d.target.length ? d.target : common.target, d.commitment && d.commitment.length ? d.commitment : common.commitment);
            }
        }
        setListForLevel(level, list);
        closeAddModal();
        setStatus("تمت إضافة الخيار وتفرعاته. احفظ كمسودة أو انشر التعديلات لتثبيتها.");
    }
    function ensureBranchesModal() {
        let modal = $("goalBranchesModal");
        if (modal) return modal;
        modal = document.createElement("div");
        modal.id = "goalBranchesModal";
        modal.className = "admin-bank-modal-v5600 admin-goal-add-modal-v5613";
        modal.hidden = true;
        modal.innerHTML = `<div class="admin-bank-modal-card-v5600 admin-goal-add-card-v5613 admin-add-option-card-v5612">
            <h2>إدارة التفرعات التكيفية</h2>
            <p class="muted" id="goalBranchesPathHint">—</p>
            <label id="goalBranchesChildLabel">التفرعات التابعة</label>
            <textarea id="goalBranchesTextarea" rows="8"></textarea>
            <div id="goalBranchesStateTriplet" class="admin-goal-triplet-v5615">
                <label>الحالات الحالية الافتراضية للمسار</label><textarea id="goalBranchesCurrent" rows="3"></textarea>
                <label>الحالات المستهدفة الافتراضية للمسار</label><textarea id="goalBranchesTarget" rows="3"></textarea>
                <label>الالتزام اليومي أو الأسبوعي الافتراضي</label><textarea id="goalBranchesCommitment" rows="3"></textarea>
            </div>
            <div class="actions"><button type="button" class="small-button success" id="goalAddBranchLineBtn">إضافة تفرع</button><select id="goalBranchesCopySourceSelect"></select><button type="button" class="small-button" id="goalCopyBranchesBtn">نسخ تفرعات</button></div>
            <div class="actions"><button type="button" id="goalSaveBranchesBtn">حفظ التفرعات</button><button type="button" class="small-button cancel" id="goalCancelBranchesBtn">إلغاء</button></div>
        </div>`;
        document.body.appendChild(modal);
        $("goalCancelBranchesBtn").addEventListener("click", () => modal.hidden = true);
        $("goalAddBranchLineBtn").addEventListener("click", () => { const ta = $("goalBranchesTextarea"); ta.value = (ta.value ? ta.value + "\n" : "") + "أخرى"; ta.focus(); });
        $("goalCopyBranchesBtn").addEventListener("click", () => { const src = $("goalBranchesCopySourceSelect").value; if (src) $("goalBranchesTextarea").value = childList(modal.dataset.level, src).join("\n"); });
        $("goalSaveBranchesBtn").addEventListener("click", () => {
            setChildBranches(modal.dataset.level, modal.dataset.value, parseLines($("goalBranchesTextarea").value), {
                current: parseLines($("goalBranchesCurrent").value), target: parseLines($("goalBranchesTarget").value), commitment: parseLines($("goalBranchesCommitment").value)
            });
            modal.hidden = true; markDirty(); refreshNative(state.level); renderEditor();
        });
        return modal;
    }
    function openBranchesModal(item) {
        const child = childLevel(state.level);
        if (!child) { toast("هذا المستوى لا يحتوي تفرعات تابعة مباشرة."); return; }
        const modal = ensureBranchesModal();
        modal.dataset.level = state.level; modal.dataset.value = item;
        $("goalBranchesPathHint").textContent = `الخيار الحالي: ${item} · المسار: ${label(state.type)} → ${selectedPath().category || "—"} → ${selectedPath().path || "—"}`;
        $("goalBranchesChildLabel").textContent = `قائمة ${currentLabel(child)}`;
        $("goalBranchesTextarea").value = childList(state.level, item).join("\n");
        const st = state.level === "path" ? stateBox(state.config, false, selectedPath().category, item) : { current:["أخرى"], target:["أخرى"], commitment:["أخرى"] };
        $("goalBranchesCurrent").value = otherGuard(st.current || ["أخرى"]).join("\n");
        $("goalBranchesTarget").value = otherGuard(st.target || ["أخرى"]).join("\n");
        $("goalBranchesCommitment").value = otherGuard(st.commitment || ["أخرى"]).join("\n");
        $("goalBranchesStateTriplet").style.display = state.level === "path" || state.level === "category" ? "grid" : "none";
        $("goalBranchesCopySourceSelect").innerHTML = getListForLevel(state.level).filter(v => v !== item && !isProtectedOther(v)).map(v => `<option value="${esc(v)}">${esc(label(v))}</option>`).join("");
        modal.hidden = false;
    }
    function ensureSimpleModal(id, title) {
        let modal = $(id);
        if (modal) return modal;
        modal = document.createElement("div");
        modal.id = id;
        modal.className = "admin-bank-modal-v5600 admin-goal-action-modal-v5617";
        modal.hidden = true;
        modal.innerHTML = `<div class="admin-bank-modal-card-v5600 admin-goal-action-card-v5617">
            <h2>${esc(title)}</h2>
            <p class="muted" data-role="hint"></p>
            <div data-role="body"></div>
            <div class="actions">
                <button type="button" class="success" data-role="apply">حفظ</button>
                <button type="button" class="small-button cancel" data-role="cancel">إلغاء</button>
            </div>
        </div>`;
        document.body.appendChild(modal);
        modal.querySelector('[data-role="cancel"]').addEventListener("click", () => modal.hidden = true);
        return modal;
    }
    function manualOrder() {
        if (!EDITABLE_LEVELS.includes(state.level)) return toast("هذا المستوى غير قابل للترتيب.");
        const modal = ensureSimpleModal("goalManualOrderModal", "ترتيب يدوي");
        modal.querySelector('[data-role="hint"]').textContent = `اكتب كل خيار في سطر مستقل لخانة: ${currentLabel(state.level)}. سيبقى خيار أخرى في النهاية تلقائياً.`;
        modal.querySelector('[data-role="body"]').innerHTML = `<textarea id="goalManualOrderTextarea" rows="12"></textarea>`;
        $("goalManualOrderTextarea").value = getListForLevel(state.level).join("\n");
        modal.querySelector('[data-role="apply"]').onclick = function () {
            setListForLevel(state.level, ($("goalManualOrderTextarea").value || "").split(/\n+/).map(x => x.trim()).filter(Boolean));
            modal.hidden = true;
        };
        modal.hidden = false;
        setTimeout(() => $("goalManualOrderTextarea")?.focus(), 20);
    }
    function editFieldLabel() {
        if (state.level === "type") return alert("اسم خانة نوع الهدف ثابت في النموذج حتى لا يختلط مع أنواع الأهداف الأصلية.");
        const current = currentLabel(state.level);
        const modal = ensureSimpleModal("goalFieldLabelModal", "تعديل اسم الخانة");
        modal.querySelector('[data-role="hint"]').textContent = `هذا التغيير يخص نوع الهدف الحالي فقط: ${label(state.type)}.`;
        modal.querySelector('[data-role="body"]').innerHTML = `<label>اسم الخانة الجديد</label><input id="goalFieldLabelInput" value="${esc(current)}">`;
        modal.querySelector('[data-role="apply"]').onclick = function () {
            const next = normalize($("goalFieldLabelInput")?.value);
            if (!next || next === current) { modal.hidden = true; return; }
            if (!state.config.labels) state.config.labels = {};
            state.config.labels[state.level] = next;
            modal.hidden = true;
            markDirty();
            renderEditor();
        };
        modal.hidden = false;
        setTimeout(() => $("goalFieldLabelInput")?.focus(), 20);
    }
    function configForSave() { state.config = normalizeConfigOther(state.config || {}); return Object.assign({}, clone(state.config), { __edupathAdminFullConfig: true }); }
    function save(mode) {
        if (!state.type) return toast("اختر نوع هدف أولاً.");
        const url = `/api/admin/goal-bank/${encodeURIComponent(state.type)}${mode === "draft" ? "/draft" : ""}`;
        fetch(url, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ config: configForSave(), action: mode === "draft" ? "draft" : "publish", clear_draft: mode === "publish" }) })
            .then(r => r.json().then(data => ({ ok: r.ok, data })))
            .then(({ok, data}) => { if (!ok || !data.ok) throw new Error(data.message || "تعذر الحفظ"); state.dirty = false; setStatus(data.message || "تم الحفظ"); if (mode === "publish") window.EDUPATH_GOAL_BANK_OVERRIDES = Object.assign(window.EDUPATH_GOAL_BANK_OVERRIDES || {}, { [state.type]: state.config }); loadType(state.type); })
            .catch(err => alert(err.message || "تعذر الحفظ"));
    }
    function restoreDefault() {
        if (!confirm("استعادة الافتراضي لهذا النوع فقط؟")) return;
        fetch(`/api/admin/goal-bank/${encodeURIComponent(state.type)}/restore-default`, { method: "POST", credentials: "same-origin" }).then(r => r.json()).then(data => { setStatus(data.message || "تمت الاستعادة"); state.draftConfig = null; state.publishedConfig = {}; loadType(state.type); });
    }
    function rollback(revisionId) {
        if (!confirm("استعادة تعديل سابق لهذا النوع فقط؟")) return;
        fetch(`/api/admin/goal-bank/${encodeURIComponent(state.type)}/rollback`, { method: "POST", credentials: "same-origin", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ revision_id: revisionId || null }) }).then(r => r.json()).then(data => { if (!data.ok) alert(data.message || "تعذر الاستعادة"); else { setStatus(data.message); loadType(state.type); } });
    }
    function renderRevisions() {
        const box = $("goalBankRevisionsList"); if (!box) return;
        box.innerHTML = state.revisions.length ? state.revisions.map(r => `<div class="bank-revision-item-v5600"><strong>${esc(r.action || "تعديل")}</strong><span>${esc(r.created_at || "")}</span><button type="button" class="small-button cancel" data-rev="${esc(r.id)}">استعادة هذه النسخة</button></div>`).join("") : '<p class="muted">لا توجد نسخ بعد.</p>';
        box.querySelectorAll("[data-rev]").forEach(btn => btn.addEventListener("click", () => rollback(btn.dataset.rev)));
    }
    function attach() {
        ["goalTypeSelect", "goalCategorySelect", "goalPathSelect", "currentStateSelect", "targetStateSelect", "commitmentSelect"].forEach(id => { const el = $(id); if (el) el.addEventListener("change", () => setTimeout(syncTypeFromForm, 50)); });
        $("adminGoalOptionsList")?.addEventListener("click", handleOptionAction);
        $("addGoalOptionBtn")?.addEventListener("click", openAddModal);
        $("closeGoalAddOptionBtn")?.addEventListener("click", closeAddModal);
        $("applyGoalAddOptionBtn")?.addEventListener("click", applyAddOption);
        $("goalNewOptionBranchMode")?.addEventListener("change", refreshAddModalMode);
        $("goalNewOptionPosition")?.addEventListener("change", refreshAddModalMode);
        $("goalNewOptionBranches")?.addEventListener("input", refreshGoalPerBranchDesigner);
        $("goalNewOptionEmptyCount")?.addEventListener("input", refreshGoalPerBranchDesigner);
        $("goalNewOptionCopySource")?.addEventListener("change", refreshGoalPerBranchDesigner);
        $("manualOrderGoalBtn")?.addEventListener("click", manualOrder);
        $("editGoalFieldLabelBtn")?.addEventListener("click", editFieldLabel);
        $("saveDraftGoalBankBtn")?.addEventListener("click", () => save("draft"));
        $("publishGoalBankBtn")?.addEventListener("click", () => save("publish"));
        $("restoreDefaultGoalBankBtn")?.addEventListener("click", restoreDefault);
        $("rollbackGoalBankBtn")?.addEventListener("click", () => rollback());
        $("previewGoalBankBtn")?.addEventListener("click", () => alert("النموذج العلوي هو المعاينة المطابقة لصفحة الأهداف."));
        const observerTarget = $("adaptiveGoalBox");
        if (observerTarget && window.MutationObserver) new MutationObserver(() => setTimeout(renderEditor, 40)).observe(observerTarget, { childList: true, subtree: true, attributes: true });
        setInterval(syncTypeFromForm, 1500);
    }
    document.addEventListener("DOMContentLoaded", function () {
        if (!$("adminGoalBankPage")) return;
        fillTypeSelect();
        state.type = $("goalTypeSelect")?.value || state.type;
        attach();
        if (window.EDUPATH_GOAL_BANK_BOOT) window.EDUPATH_GOAL_BANK_BOOT().then(() => loadType(state.type)); else loadType(state.type);
    });
})();
