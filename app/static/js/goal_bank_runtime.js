(function () {
    "use strict";
    function applyPublishedGoalOverrides() {
        if (window.EDUPATH_GOAL_BANK_OVERRIDES && window.EDUPATH_APPLY_GOAL_BANK_OVERRIDES) {
            window.EDUPATH_APPLY_GOAL_BANK_OVERRIDES(window.EDUPATH_GOAL_BANK_OVERRIDES);
            return Promise.resolve(window.EDUPATH_GOAL_BANK_OVERRIDES);
        }
        return fetch("/api/goal-bank-overrides", { credentials: "same-origin" })
            .then(function (res) { return res.ok ? res.json() : {}; })
            .then(function (data) {
                window.EDUPATH_GOAL_BANK_OVERRIDES = data || {};
                if (window.EDUPATH_APPLY_GOAL_BANK_OVERRIDES) window.EDUPATH_APPLY_GOAL_BANK_OVERRIDES(data || {});
                return data || {};
            })
            .catch(function () { return {}; });
    }
    window.EDUPATH_GOAL_BANK_BOOT = applyPublishedGoalOverrides;
    document.addEventListener("DOMContentLoaded", function () {
        if (document.getElementById("goalTypeSelect")) applyPublishedGoalOverrides();
    });
})();
