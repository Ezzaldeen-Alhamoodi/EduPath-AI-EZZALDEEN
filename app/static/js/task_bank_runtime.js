(function () {
    const clone = (obj) => JSON.parse(JSON.stringify(obj || {}));
    const normalize = (value) => String(value || "").trim();

    function getData() {
        window.EDUPATH_TASKS_AR_DATA = window.EDUPATH_TASKS_AR_DATA || {};
        return window.EDUPATH_TASKS_AR_DATA;
    }

    function getConfig(typeName) {
        const data = getData();
        const type = normalize(typeName || (document.getElementById("categorySelect") || {}).value || "عام");
        return data[type] || data["عام"] || {};
    }

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el && value) el.textContent = value;
    }

    function activeType() {
        const input = document.getElementById("categorySelect");
        return normalize(input && input.value) || "عام";
    }

    function applyTaskBankOverrides() {
        const overrides = window.EDUPATH_TASK_BANK_OVERRIDES || window.EDUPATH_TASKS_BANK_OVERRIDES || {};
        const data = getData();
        Object.keys(overrides || {}).forEach((typeName) => {
            if (overrides[typeName] && typeof overrides[typeName] === "object") {
                data[typeName] = clone(overrides[typeName]);
            }
        });
    }

    function filterHiddenOptions() {
        const type = activeType();
        const config = getConfig(type);
        const hidden = config.hidden || {};
        const selectors = [
            ["topicSelect", hidden.main || []],
            ["skillSelect", hidden.sub || []],
            ["detailedTopicSelect", hidden.detail || []],
            ["trainingTypeSelect", hidden.training || []]
        ];
        selectors.forEach(([id, hiddenValues]) => {
            const select = document.getElementById(id);
            if (!select || !Array.isArray(hiddenValues) || !hiddenValues.length) return;
            Array.from(select.options).forEach((option) => {
                if (hiddenValues.includes(option.value)) option.remove();
            });
        });
    }

    function applyTaskBankLabels() {
        const cfg = getConfig(activeType());
        const labels = cfg.labels || {};
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

    function applyAll() {
        applyTaskBankOverrides();
        filterHiddenOptions();
        applyTaskBankLabels();
    }

    function install() {
        applyTaskBankOverrides();
        if (window.EDUPATH_NATIVE_TASKS_INIT && !window.EDUPATH_TASK_BANK_RUNTIME_RERENDERED) {
            window.EDUPATH_TASK_BANK_RUNTIME_RERENDERED = true;
            window.EDUPATH_NATIVE_TASKS_INIT();
        }
        applyAll();
        ["categorySelect", "topicSelect", "skillSelect", "detailedTopicSelect", "trainingTypeSelect"].forEach((id) => {
            const el = document.getElementById(id);
            if (el && !el.dataset.bankRuntimeBound) {
                el.dataset.bankRuntimeBound = "1";
                el.addEventListener("change", () => setTimeout(applyAll, 0));
                el.addEventListener("input", () => setTimeout(applyAll, 0));
            }
        });
        [80, 250, 700, 1200].forEach((delay) => setTimeout(applyAll, delay));
    }

    window.EDUPATH_APPLY_TASK_BANK_RUNTIME = applyAll;
    window.EDUPATH_GET_TASK_BANK_CONFIG = getConfig;
    window.EDUPATH_CLONE_TASK_BANK_CONFIG = function (typeName) { return clone(getConfig(typeName)); };
    document.addEventListener("DOMContentLoaded", install);
    if (document.readyState !== "loading") install();
})();
