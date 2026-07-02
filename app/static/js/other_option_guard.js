/* EduPath AI v5.6.14 - protected Arabic "Other" option guard */
(function () {
    "use strict";
    const OTHER = "أخرى";
    const OTHER_ALIASES = new Set(["أخرى", "أُخرى", "اخرى", "Other", "other", "OTHER"]);
    function cleanText(value) {
        const text = String(value == null ? "" : value).trim();
        return OTHER_ALIASES.has(text) ? OTHER : text;
    }
    function ensureOtherOption(list) {
        const input = Array.isArray(list) ? list : [];
        const out = [];
        const seen = new Set();
        input.forEach(function (item) {
            const value = cleanText(item);
            if (!value || value === OTHER) return;
            if (seen.has(value)) return;
            seen.add(value);
            out.push(value);
        });
        out.push(OTHER);
        return out;
    }
    function isOtherOption(value) { return cleanText(value) === OTHER; }
    function normalizeSelectOther(select) {
        if (!select || !select.options) return;
        const previous = cleanText(select.value || "");
        const values = Array.from(select.options).map(function (opt) { return cleanText(opt.value || opt.textContent); });
        const fixed = ensureOtherOption(values);
        if (values.length === fixed.length && values.every(function (v, i) { return v === fixed[i]; })) return;
        select.innerHTML = "";
        fixed.forEach(function (value) {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        });
        if (fixed.includes(previous)) select.value = previous;
    }
    const ADAPTIVE_SELECT_IDS = new Set([
        "categorySelect", "topicSelect", "skillSelect", "detailedTopicSelect", "trainingTypeSelect",
        "goalTypeSelect", "goalCategorySelect", "goalPathSelect", "currentStateSelect", "targetStateSelect", "commitmentSelect"
    ]);
    function normalizeAdaptiveSelects(root) {
        const base = root && root.querySelectorAll ? root : document;
        base.querySelectorAll("select").forEach(function (select) {
            if (ADAPTIVE_SELECT_IDS.has(select.id) || select.closest("#adminRealTaskFormCard,#adminGoalBankPage,#adaptiveTaskFields,#adaptiveGoalBox")) {
                normalizeSelectOther(select);
            }
        });
    }
    function normalizeAdaptiveConfig(config, seen) {
        if (!config || typeof config !== "object") return config;
        seen = seen || new WeakSet();
        if (seen.has(config)) return config;
        seen.add(config);
        Object.keys(config).forEach(function (key) {
            const value = config[key];
            if (Array.isArray(value)) {
                if (/hidden/i.test(key)) config[key] = value.map(cleanText).filter(function (v) { return v && v !== OTHER; });
                else config[key] = ensureOtherOption(value);
            } else if (value && typeof value === "object") {
                normalizeAdaptiveConfig(value, seen);
            }
        });
        return config;
    }
    function installObserver() {
        normalizeAdaptiveSelects(document);
        if (window.MutationObserver) {
            new MutationObserver(function (mutations) {
                mutations.forEach(function (m) { normalizeAdaptiveSelects(m.target); });
            }).observe(document.documentElement, { childList: true, subtree: true });
        }
        document.addEventListener("change", function (e) {
            if (e.target && e.target.tagName === "SELECT") setTimeout(function () { normalizeAdaptiveSelects(document); }, 0);
        }, true);
    }
    window.EDUPATH_OTHER_OPTION = OTHER;
    window.EDUPATH_CLEAN_OTHER_VALUE = cleanText;
    window.EDUPATH_IS_OTHER_OPTION = isOtherOption;
    window.EDUPATH_ENSURE_OTHER_OPTION = ensureOtherOption;
    window.EDUPATH_NORMALIZE_ADAPTIVE_SELECTS = normalizeAdaptiveSelects;
    window.EDUPATH_NORMALIZE_ADAPTIVE_CONFIG = normalizeAdaptiveConfig;
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", installObserver);
    else installObserver();
})();
