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
    const normalize = (value) => String(value == null ? "" : value).trim();
    const esc = (value) => String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const pathKey = (...parts) => parts.map(normalize).filter(Boolean).join("::");


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
    function fixedLabelsForType(typeName) {
        const fromRuntime = window.EDUPATH_GET_TASK_TYPE_FIELD_LABELS;
        if (typeof fromRuntime === "function") return fromRuntime(typeName);
        return Object.assign({}, DEFAULT_FIELD_LABELS, TASK_TYPE_FIELD_LABELS[normalize(typeName)] || {});
    }

    const LEVELS = [
        {key: "main", selectId: "topicSelect", labelId: "topicLabel", defaultLabel: "الفئة الرئيسية", path: () => ""},
        {key: "sub", selectId: "skillSelect", labelId: "skillLabel", defaultLabel: "الفئة الفرعية", path: () => pathKey(selectedMain())},
        {key: "detail", selectId: "detailedTopicSelect", labelId: "detailLabel", defaultLabel: "الموضوع التفصيلي", path: () => pathKey(selectedMain(), selectedSub())},
        {key: "training", selectId: "trainingTypeSelect", labelId: "trainingLabel", defaultLabel: "نوع النشاط", path: () => pathKey(selectedMain(), selectedSub(), selectedDetail())}
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

    function uniqueList(items) {
        const out = [];
        (items || []).forEach((item) => {
            const text = normalize(item);
            if (text && !out.includes(text)) out.push(text);
        });
        if (!out.length) out.push("أخرى");
        return out;
    }

    function ensureObject(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }

    function ensureConfig(config) {
        const c = clone(config);
        c.icon = c.icon || c.typeIcon || "✨";
        c.main = Array.isArray(c.main) ? uniqueList(c.main) : ["أخرى"];
        c.sub = ensureObject(c.sub);
        c.detail = ensureObject(c.detail);
        c.training = Array.isArray(c.training) ? uniqueList(c.training) : ["أخرى"];
        c.trainingByDetail = ensureObject(c.trainingByDetail);
        c.subByPath = ensureObject(c.subByPath);
        c.detailByPath = ensureObject(c.detailByPath);
        c.trainingByPath = ensureObject(c.trainingByPath);
        c.recommendations = ensureObject(c.recommendations);
        c.recommendationsByPath = ensureObject(c.recommendationsByPath);
        c.sourceSuggestionsByPath = ensureObject(c.sourceSuggestionsByPath);
        c.labels = ensureObject(c.labels);
        c.hidden = ensureObject(c.hidden);
        c.hiddenByPath = ensureObject(c.hiddenByPath);
        ["main", "sub", "detail", "training"].forEach((level) => {
            if (!Array.isArray(c.hidden[level])) c.hidden[level] = [];
        });
        return c;
    }

    async function fetchJson(url, options) {
        const response = await fetch(url, options || {});
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.ok === false) throw new Error(data.message || "حدث خطأ غير متوقع.");
        return data;
    }

    function selectedMain() { return normalize($("topicSelect") && $("topicSelect").value); }
    function selectedSub() { return normalize($("skillSelect") && $("skillSelect").value); }
    function selectedDetail() { return normalize($("detailedTopicSelect") && $("detailedTopicSelect").value); }

    function levelMeta(level) { return LEVELS.find((item) => item.key === level) || LEVELS[0]; }
    function currentPath(level) { return levelMeta(level).path(); }
    function hiddenKey(level, path) { return level + (path ? "::" + path : ""); }

    function currentLabel(level) {
        const meta = levelMeta(level);
        const fixed = fixedLabelsForType(state.currentType || getTypeFromForm());
        const labels = (state.config && state.config.labels) || {};
        const custom = level === "main" ? labels.topic : level === "sub" ? labels.skill : labels[level];
        const mapped = level === "main" ? fixed.topic : level === "sub" ? fixed.skill : fixed[level];
        const el = meta && $(meta.labelId);
        return normalize(mapped || custom || (el && el.textContent)) || meta.defaultLabel || level;
    }

    function getHidden(level) {
        const key = hiddenKey(level, currentPath(level));
        const list = (state.config.hiddenByPath && state.config.hiddenByPath[key]) || (level === "main" ? (state.config.hidden.main || []) : []);
        return uniqueList(list).filter((v) => v !== "أخرى" || (list || []).includes("أخرى"));
    }

    function isHidden(level, value) {
        return getHidden(level).includes(normalize(value));
    }

    function showList(list, level) {
        const hidden = getHidden(level);
        const out = uniqueList(list).filter((item) => !hidden.includes(item));
        return out.length ? out : ["أخرى"];
    }

    function getRawList(level) {
        if (!state.config) return [];
        if (level === "main") return uniqueList(state.config.main || ["أخرى"]);
        if (level === "sub") {
            const main = selectedMain();
            const key = pathKey(main);
            return uniqueList(state.config.subByPath[key] || state.config.sub[main] || state.config.sub["أخرى"] || ["أخرى"]);
        }
        if (level === "detail") {
            const main = selectedMain();
            const sub = selectedSub();
            const key = pathKey(main, sub);
            return uniqueList(state.config.detailByPath[key] || state.config.detail[sub] || state.config.detail[main] || state.config.detail["أخرى"] || ["أخرى"]);
        }
        if (level === "training") {
            const main = selectedMain();
            const sub = selectedSub();
            const detail = selectedDetail();
            const key = pathKey(main, sub, detail);
            return uniqueList(
                state.config.trainingByPath[key] ||
                state.config.trainingByDetail[detail] ||
                state.config.trainingByDetail[sub] ||
                state.config.trainingByDetail[main] ||
                state.config.trainingByDetail["أخرى"] ||
                state.config.training ||
                ["أخرى"]
            );
        }
        return ["أخرى"];
    }

    function getList(level) { return showList(getRawList(level), level); }

    function setRawList(level, list) {
        const safe = uniqueList(list);
        if (level === "main") state.config.main = safe;
        if (level === "sub") state.config.subByPath[pathKey(selectedMain())] = safe;
        if (level === "detail") state.config.detailByPath[pathKey(selectedMain(), selectedSub())] = safe;
        if (level === "training") state.config.trainingByPath[pathKey(selectedMain(), selectedSub(), selectedDetail())] = safe;
    }

    function setList(level, list) {
        setRawList(level, list);
        markDirty();
        refreshNativeForm();
    }

    function migratePathObject(obj, oldPrefix, newPrefix) {
        if (!obj) return;
        Object.keys(obj).forEach((key) => {
            if (key === oldPrefix || key.startsWith(oldPrefix + "::")) {
                const next = newPrefix + key.slice(oldPrefix.length);
                obj[next] = obj[key];
                delete obj[key];
            }
        });
    }

    function deletePathPrefix(obj, prefix) {
        if (!obj || !prefix) return;
        Object.keys(obj).forEach((key) => {
            if (key === prefix || key.startsWith(prefix + "::")) delete obj[key];
        });
    }

    function renameKey(obj, oldKey, newKey) {
        if (!obj || oldKey === newKey || !Object.prototype.hasOwnProperty.call(obj, oldKey)) return;
        obj[newKey] = obj[oldKey];
        delete obj[oldKey];
    }

    function renameHiddenValue(level, oldValue, newValue) {
        const key = hiddenKey(level, currentPath(level));
        const lists = [];
        if (level === "main") lists.push(state.config.hidden.main);
        if (state.config.hiddenByPath[key]) lists.push(state.config.hiddenByPath[key]);
        lists.forEach((list) => {
            const idx = list.indexOf(oldValue);
            if (idx >= 0) list[idx] = newValue;
        });
    }

    function renameOption(level, index, newValue) {
        newValue = normalize(newValue);
        if (!newValue) return renderEditor();
        const raw = getRawList(level).slice();
        const visible = getList(level);
        const oldValue = visible[index];
        const rawIndex = raw.indexOf(oldValue);
        if (rawIndex < 0 || oldValue === newValue) return renderEditor();
        if (!confirm("سيتم الحفاظ على التفرعات التكيفية التابعة لهذا الخيار ونقلها إلى الاسم الجديد. هل تريد المتابعة؟")) return renderEditor();
        raw[rawIndex] = newValue;
        if (level === "main") {
            migratePathObject(state.config.subByPath, pathKey(oldValue), pathKey(newValue));
            migratePathObject(state.config.detailByPath, pathKey(oldValue), pathKey(newValue));
            migratePathObject(state.config.trainingByPath, pathKey(oldValue), pathKey(newValue));
            migratePathObject(state.config.hiddenByPath, "sub::" + pathKey(oldValue), "sub::" + pathKey(newValue));
            migratePathObject(state.config.hiddenByPath, "detail::" + pathKey(oldValue), "detail::" + pathKey(newValue));
            migratePathObject(state.config.hiddenByPath, "training::" + pathKey(oldValue), "training::" + pathKey(newValue));
            renameKey(state.config.sub, oldValue, newValue);
            renameKey(state.config.detail, oldValue, newValue);
            renameKey(state.config.trainingByDetail, oldValue, newValue);
        }
        if (level === "sub") {
            const main = selectedMain();
            migratePathObject(state.config.detailByPath, pathKey(main, oldValue), pathKey(main, newValue));
            migratePathObject(state.config.trainingByPath, pathKey(main, oldValue), pathKey(main, newValue));
            migratePathObject(state.config.hiddenByPath, "detail::" + pathKey(main, oldValue), "detail::" + pathKey(main, newValue));
            migratePathObject(state.config.hiddenByPath, "training::" + pathKey(main, oldValue), "training::" + pathKey(main, newValue));
            renameKey(state.config.detail, oldValue, newValue);
            renameKey(state.config.trainingByDetail, oldValue, newValue);
        }
        if (level === "detail") {
            const main = selectedMain();
            const sub = selectedSub();
            migratePathObject(state.config.trainingByPath, pathKey(main, sub, oldValue), pathKey(main, sub, newValue));
            migratePathObject(state.config.hiddenByPath, "training::" + pathKey(main, sub, oldValue), "training::" + pathKey(main, sub, newValue));
            renameKey(state.config.trainingByDetail, oldValue, newValue);
        }
        renameHiddenValue(level, oldValue, newValue);
        setList(level, raw);
    }

    function moveOption(level, index, direction) {
        const raw = getRawList(level).slice();
        const visible = getList(level);
        const value = visible[index];
        const rawIndex = raw.indexOf(value);
        const nextVisible = visible[index + direction];
        const nextRawIndex = raw.indexOf(nextVisible);
        if (rawIndex < 0 || nextRawIndex < 0) return;
        [raw[rawIndex], raw[nextRawIndex]] = [raw[nextRawIndex], raw[rawIndex]];
        setList(level, raw);
    }

    function getChildrenLevel(level) {
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

    function setChildListFor(level, option, children) {
        const child = getChildrenLevel(level);
        if (!child) return;
        const safe = uniqueList(children && children.length ? children : ["أخرى"]);
        if (child === "sub") state.config.subByPath[childPathFor(level, option)] = safe;
        if (child === "detail") state.config.detailByPath[childPathFor(level, option)] = safe;
        if (child === "training") state.config.trainingByPath[childPathFor(level, option)] = safe;
    }

    function getChildListFromSource(level, source) {
        const child = getChildrenLevel(level);
        if (!child || !source) return ["أخرى"];
        const oldCurrent = {main: selectedMain(), sub: selectedSub(), detail: selectedDetail()};
        if (level === "main") return uniqueList(state.config.subByPath[pathKey(source)] || state.config.sub[source] || ["أخرى"]);
        if (level === "sub") return uniqueList(state.config.detailByPath[pathKey(oldCurrent.main, source)] || state.config.detail[source] || ["أخرى"]);
        if (level === "detail") return uniqueList(state.config.trainingByPath[pathKey(oldCurrent.main, oldCurrent.sub, source)] || state.config.trainingByDetail[source] || state.config.training || ["أخرى"]);
        return ["أخرى"];
    }

    function ensureAddModal() {
        let modal = $("adminAddOptionModal");
        if (modal) return modal;
        modal = document.createElement("div");
        modal.id = "adminAddOptionModal";
        modal.className = "admin-bank-modal-v5600";
        modal.hidden = true;
        modal.innerHTML = `
            <div class="admin-bank-modal-card-v5600 admin-add-option-card-v5620">
                <h2>إضافة خيار تكيفي جديد</h2>
                <p class="muted" id="addOptionPathHint">—</p>
                <label>اسم الخيار الجديد</label>
                <input id="addOptionNameInput" placeholder="اكتب الاسم كما سيظهر للمستخدم">
                <label>مكان الإضافة</label>
                <select id="addOptionPositionSelect"><option value="end">في نهاية القائمة</option><option value="start">في بداية القائمة</option><option value="after">بعد خيار محدد</option></select>
                <select id="addOptionAfterSelect"></select>
                <label>طريقة إنشاء التفرعات التابعة</label>
                <select id="addOptionBranchMode"><option value="empty">تفرعات فارغة</option><option value="copy">نسخ تفرعات من خيار موجود</option><option value="manual">إضافة تفرعات الآن</option></select>
                <select id="addOptionCopySource"></select>
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
    }

    function addOption(level) {
        if (!state.config) return;
        const modal = ensureAddModal();
        modal.dataset.level = level;
        $("addOptionPathHint").textContent = `الخانة: ${currentLabel(level)} · المسار: ${state.currentType || "—"} → ${selectedMain() || "—"} → ${selectedSub() || "—"} → ${selectedDetail() || "—"}`;
        $("addOptionNameInput").value = "";
        const list = getList(level);
        $("addOptionAfterSelect").innerHTML = list.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
        $("addOptionCopySource").innerHTML = list.map((v) => `<option value="${esc(v)}">نسخ من: ${esc(v)}</option>`).join("");
        $("addOptionChildrenTextarea").value = "أخرى";
        $("addOptionBranchMode").value = "empty";
        refreshAddModalMode();
        modal.hidden = false;
    }

    function confirmAddOption() {
        const modal = $("adminAddOptionModal");
        const level = modal.dataset.level;
        const value = normalize($("addOptionNameInput").value);
        if (!value) return toast("اكتب اسم الخيار أولًا.");
        const raw = getRawList(level).slice();
        if (raw.includes(value)) return toast("هذا الخيار موجود بالفعل.");
        const position = $("addOptionPositionSelect").value;
        if (position === "start") raw.unshift(value);
        else if (position === "after") {
            const after = $("addOptionAfterSelect").value;
            const idx = raw.indexOf(after);
            raw.splice(idx >= 0 ? idx + 1 : raw.length, 0, value);
        } else raw.push(value);
        const child = getChildrenLevel(level);
        if (child) {
            const mode = $("addOptionBranchMode").value;
            let children = ["أخرى"];
            if (mode === "copy") children = getChildListFromSource(level, $("addOptionCopySource").value);
            if (mode === "manual") children = uniqueList($("addOptionChildrenTextarea").value.split(/\n+/));
            setChildListFor(level, value, children);
        }
        modal.hidden = true;
        setList(level, raw);
    }

    function hideOption(level, index) {
        const value = getList(level)[index];
        const key = hiddenKey(level, currentPath(level));
        state.config.hiddenByPath[key] = uniqueList([...(state.config.hiddenByPath[key] || []), value]);
        markDirty();
        refreshNativeForm();
        toast("تم إخفاء الخيار في هذا المسار فقط مع الحفاظ على تفرعاته.");
    }

    function unhideOption(level, value) {
        const key = hiddenKey(level, currentPath(level));
        if (state.config.hiddenByPath[key]) state.config.hiddenByPath[key] = state.config.hiddenByPath[key].filter((item) => item !== value);
        if (level === "main") state.config.hidden.main = (state.config.hidden.main || []).filter((item) => item !== value);
        markDirty();
        refreshNativeForm();
    }

    function deleteOption(level, index) {
        const raw = getRawList(level).slice();
        const value = getList(level)[index];
        const rawIndex = raw.indexOf(value);
        const confirmText = prompt(`الحذف النهائي سيحذف هذا الخيار من المسار الحالي فقط وقد يحذف تفرعاته التابعة لهذا المسار. لتأكيد الحذف اكتب اسم الخيار بالضبط:\n${value}`);
        if (confirmText !== value) return toast("تم إلغاء الحذف النهائي.");
        if (rawIndex >= 0) raw.splice(rawIndex, 1);
        if (level === "main") {
            delete state.config.subByPath[pathKey(value)];
            deletePathPrefix(state.config.detailByPath, pathKey(value));
            deletePathPrefix(state.config.trainingByPath, pathKey(value));
        }
        if (level === "sub") {
            const main = selectedMain();
            delete state.config.detailByPath[pathKey(main, value)];
            deletePathPrefix(state.config.trainingByPath, pathKey(main, value));
        }
        if (level === "detail") delete state.config.trainingByPath[pathKey(selectedMain(), selectedSub(), value)];
        setList(level, raw);
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
        const newVisible = uniqueList(($("manualOrderTextarea").value || "").split(/\n+/));
        const hidden = getHidden(state.manualLevel);
        setList(state.manualLevel, [...newVisible, ...hidden.filter((item) => !newVisible.includes(item))]);
        closeManualOrder();
    }

    function editFieldLabel(level) {
        const current = currentLabel(level);
        const labels = state.config.labels || {};
        const next = normalize(prompt("اكتب اسم الخانة كما تريد أن يظهر في صفحة المهام لهذا النوع فقط:", current));
        if (!next) return;
        labels[level === "main" ? "topic" : level === "sub" ? "skill" : level] = next;
        state.config.labels = labels;
        markDirty();
        refreshNativeForm();
    }

    function editTypeIdentity() {
        if (!state.config) return;
        const displayName = normalize(prompt("اكتب الاسم الظاهر لنوع المهمة فقط، بدون تغيير المفتاح الداخلي:", state.config.displayName || state.currentType));
        if (displayName) state.config.displayName = displayName;
        const icon = normalize(prompt("اكتب الأيقونة الجديدة لهذا النوع:", state.config.typeIcon || state.config.icon || "✨"));
        if (icon) { state.config.typeIcon = icon; state.config.icon = icon; }
        markDirty();
        refreshNativeForm();
    }

    function refreshNativeForm() {
        if (!state.currentType || !state.config) return;
        getTaskData()[state.currentType] = ensureConfig(state.config);
        if (window.EDUPATH_APPLY_TASK_BANK_OVERRIDES) window.EDUPATH_APPLY_TASK_BANK_OVERRIDES();
        if (window.EDUPATH_NATIVE_TASKS_INIT) window.EDUPATH_NATIVE_TASKS_INIT();
        renderEditor();
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
        const runtimeConfig = ensureConfig(getTaskData()[typeName] || {});
        state.baseConfig = ensureConfig((window.EDUPATH_TASK_BANK_BASE_DATA || {})[typeName] || runtimeConfig);
        state.config = clone(runtimeConfig);
        try {
            const api = await fetchJson(`/api/admin/task-bank/${encodeURIComponent(typeName)}`);
            state.publishedConfig = api.customized && api.config ? ensureConfig(api.config) : null;
            state.draftConfig = api.draft_config ? ensureConfig(api.draft_config) : null;
            state.revisions = api.revisions || [];
            if (state.draftConfig) {
                state.config = clone(state.draftConfig);
                state.draftMode = true;
            } else if (state.publishedConfig) {
                state.config = clone(state.publishedConfig);
                state.draftMode = false;
            } else {
                state.config = clone(state.baseConfig);
                state.draftMode = false;
            }
        } catch (error) {
            toast(error.message || "تعذر تحميل بيانات الإدارة لهذا النوع.");
        }
        state.dirty = false;
        getTaskData()[typeName] = ensureConfig(state.config);
        if (window.EDUPATH_NATIVE_TASKS_INIT) window.EDUPATH_NATIVE_TASKS_INIT();
        renderEditor();
        renderRevisions();
        updateStatus();
    }

    function markDirty() { state.dirty = true; updateStatus(); }

    function updateStatus() {
        const box = $("adminTaskBankStatus");
        if (!box) return;
        const mode = state.draftConfig || state.draftMode ? "مسودة/تحرير" : "منشور";
        box.textContent = state.currentType ? `النوع الحالي: ${state.currentType} · الوضع: ${mode}${state.dirty ? " · توجد تعديلات غير محفوظة" : ""}` : "اختر نوع مهمة من البطاقات كما في صفحة المهام.";
    }

    function renderEditor() {
        if (!state.config) return;
        const tabs = $("adminAdaptiveLevelTabs");
        if (tabs) {
            tabs.innerHTML = LEVELS.map((level) => `<button type="button" class="small-button ${state.selectedLevel === level.key ? "success" : ""}" data-level="${level.key}">${esc(currentLabel(level.key))}</button>`).join("") + `<button type="button" class="small-button warning" data-level="__type">اسم وأيقونة النوع</button>`;
            tabs.querySelectorAll("[data-level]").forEach((btn) => btn.addEventListener("click", () => {
                if (btn.dataset.level === "__type") return editTypeIdentity();
                state.selectedLevel = btn.dataset.level;
                renderEditor();
            }));
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
                <button type="button" class="small-button" data-act="branches">إدارة التفرعات</button>
                <button type="button" class="small-button warning" data-act="hide">إخفاء آمن</button>
                <button type="button" class="small-button danger" data-act="delete">حذف نهائي</button>`;
            row.querySelector("input").addEventListener("change", (e) => renameOption(state.selectedLevel, index, e.target.value));
            row.querySelector('[data-act="up"]').addEventListener("click", () => moveOption(state.selectedLevel, index, -1));
            row.querySelector('[data-act="down"]').addEventListener("click", () => moveOption(state.selectedLevel, index, 1));
            row.querySelector('[data-act="branches"]').addEventListener("click", () => manageBranches(state.selectedLevel, value));
            row.querySelector('[data-act="hide"]').addEventListener("click", () => hideOption(state.selectedLevel, index));
            row.querySelector('[data-act="delete"]').addEventListener("click", () => deleteOption(state.selectedLevel, index));
            listBox.appendChild(row);
        });
    }

    function manageBranches(level, value) {
        const child = getChildrenLevel(level);
        if (!child) return toast("هذا هو المستوى الأخير، لا توجد تفرعات بعده.");
        const existing = getChildListFromSource(level, value);
        const next = prompt(`اكتب التفرعات التابعة للخيار (${value})، كل خيار في سطر:`, existing.join("\n"));
        if (next == null) return;
        setChildListFor(level, value, uniqueList(next.split(/\n+/)));
        markDirty();
        refreshNativeForm();
    }

    function renderHidden() {
        const box = $("adminHiddenOptionsList");
        if (!box) return;
        const hidden = getHidden(state.selectedLevel);
        if (!hidden.length) {
            box.innerHTML = '<p class="muted">لا توجد خيارات مخفية في هذا المسار.</p>';
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
            method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({config: state.config})
        });
        state.dirty = false; state.draftMode = true; toast(data.message || "تم حفظ المسودة."); await syncSelectedType();
    }

    async function publish() {
        if (!state.currentType || !state.config) return toast("اختر نوع مهمة أولًا.");
        if (!confirm("سيتم نشر التعديلات لتظهر في صفحة المهام العادية. هل أنت متأكد؟")) return;
        const data = await fetchJson(`/api/admin/task-bank/${encodeURIComponent(state.currentType)}`, {
            method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({config: state.config, action: "publish_path_aware_admin_editor", clear_draft: true})
        });
        state.dirty = false; state.draftMode = false; toast(data.message || "تم النشر."); await syncSelectedType();
    }

    async function rollback(revisionId) {
        if (!state.currentType) return;
        if (!confirm("هل تريد استعادة النسخة السابقة لهذا النوع فقط؟")) return;
        const data = await fetchJson(`/api/admin/task-bank/${encodeURIComponent(state.currentType)}/rollback`, {
            method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({revision_id: revisionId || null})
        });
        toast(data.message || "تمت الاستعادة."); await syncSelectedType();
    }

    function restoreRuntimeDefault() {
        if (!state.currentType || !state.baseConfig) return;
        if (!confirm("سيتم استعادة الافتراضي الحقيقي لهذا النوع حسب بيانات صفحة المهام الأصلية بعد تحميل كل ملفات البنك. هل أنت متأكد؟")) return;
        state.config = ensureConfig(state.baseConfig);
        getTaskData()[state.currentType] = clone(state.config);
        markDirty(); refreshNativeForm(); toast("تم تجهيز الافتراضي كمسودة. اضغط نشر التعديلات لتطبيقه للمستخدمين.");
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
            if (typeCard) requestAnimationFrame(syncSelectedType);
        });
        ["topicSelect", "skillSelect", "detailedTopicSelect", "trainingTypeSelect"].forEach((id) => {
            const el = $(id);
            if (el) el.addEventListener("change", () => requestAnimationFrame(renderEditor));
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
        syncSelectedType();
    }

    document.addEventListener("DOMContentLoaded", bind);
    if (document.readyState !== "loading") bind();
})();
