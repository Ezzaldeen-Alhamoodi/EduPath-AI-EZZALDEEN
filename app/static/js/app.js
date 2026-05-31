if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/static/js/service-worker.js")
        .catch(() => {});
}

async function askNotificationPermission() {
    if (!("Notification" in window)) {
        alert("Notifications are not supported in this browser.");
        return;
    }

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
        new Notification("EduPath AI reminders enabled ✅", {
            body: "You will receive browser reminders while the app is active or installed.",
        });
    } else {
        alert("Notification permission was not granted.");
    }
}

function sameMinute(timeString) {
    if (!timeString) return false;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}` === timeString;
}

function taskShouldNotifyToday(task) {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const jsDay = now.getDay();
    const mondayBasedDay = String((jsDay + 6) % 7);

    if (task.due_date && task.due_date < today) return false;

    if (task.repeat_type === "once") {
        return !task.due_date || task.due_date === today;
    }

    if (task.repeat_type === "weekly") {
        if (!task.due_date) return true;
        const due = new Date(task.due_date);
        return due.getDay() === jsDay;
    }

    if (task.repeat_type === "selected_days") {
        const days = (task.repeat_days || "").split(",").filter(Boolean);
        return days.includes(mondayBasedDay);
    }

    return true;
}

let alreadyNotified = new Set();

async function checkTaskReminders() {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    try {
        const response = await fetch("/api/tasks");
        const tasks = await response.json();
        const today = new Date().toISOString().slice(0, 10);

        tasks.forEach(task => {
            if (!task.reminder_time) return;

            const key = `${today}-${task.id}-${task.reminder_time}`;

            if (taskShouldNotifyToday(task) && sameMinute(task.reminder_time) && !alreadyNotified.has(key)) {
                alreadyNotified.add(key);

                new Notification("EduPath AI Reminder 🔔", {
                    body: `${task.title} — ${task.minutes} minutes`,
                    tag: key,
                });
            }
        });
    } catch (error) {
        console.log("Reminder check failed", error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("enableNotifications");
    if (btn) btn.addEventListener("click", askNotificationPermission);

    setInterval(checkTaskReminders, 30000);
    checkTaskReminders();
});


const TASK_OPTIONS={"Language":{topics:["English","Turkish","Russian","Indonesian","Romanian","Arabic","Other"],skills:{"English":["Reading","Writing","Listening","Speaking","Grammar","Vocabulary","Pronunciation","Mock Test","Other"],"Turkish":["Reading","Writing","Listening","Speaking","Grammar","Vocabulary","Pronunciation","Other"],"Russian":["Reading","Writing","Listening","Speaking","Grammar","Vocabulary","Pronunciation","Other"],"Indonesian":["Reading","Writing","Listening","Speaking","Grammar","Vocabulary","Pronunciation","Other"],"Romanian":["Reading","Writing","Listening","Speaking","Grammar","Vocabulary","Pronunciation","Other"],"Arabic":["Reading","Writing","Speaking","Grammar","Vocabulary","Other"],"Other":["Reading","Writing","Listening","Speaking","Grammar","Vocabulary","Other"]}},"Programming":{topics:["Python","JavaScript","C","Web Development","Algorithms","Data Structures","Databases","Debugging","AI / Machine Learning","Other"],skills:{"Python":["Syntax","Functions","OOP","Files","Libraries","Projects","Debugging","Other"],"JavaScript":["Syntax","DOM","Events","APIs","Frontend Practice","Debugging","Other"],"C":["Syntax","Pointers","Memory","Arrays","Functions","Debugging","Other"],"Web Development":["HTML","CSS","JavaScript","Flask","React","Responsive Design","Deployment","Other"],"Algorithms":["Problem Solving","Sorting","Searching","Recursion","Dynamic Programming","Greedy","Other"],"Data Structures":["Arrays","Linked Lists","Stacks","Queues","Trees","Graphs","Hash Tables","Other"],"Databases":["SQL","SQLite","PostgreSQL","Schema Design","Queries","Joins","Other"],"Debugging":["Read Errors","Print Debugging","Breakpoints","Testing","Refactoring","Other"],"AI / Machine Learning":["Data Cleaning","Models","Evaluation","Feature Engineering","Projects","Other"],"Other":["Concepts","Practice","Project","Debugging","Review","Other"]}},"Mathematics":{topics:["Algebra","Geometry","Calculus","Probability","Statistics","Trigonometry","Linear Algebra","Discrete Mathematics","Other"],skills:{"Algebra":["Concepts","Equations","Inequalities","Functions","Word Problems","Exercises","Other"],"Geometry":["Theorems","Proofs","Triangles","Circles","Coordinate Geometry","Exercises","Other"],"Calculus":["Limits","Derivatives","Integrals","Applications","Exercises","Other"],"Probability":["Basic Probability","Conditional Probability","Counting","Random Variables","Exercises","Other"],"Statistics":["Mean/Variance","Distributions","Charts","Inference","Exercises","Other"],"Trigonometry":["Identities","Unit Circle","Equations","Graphs","Exercises","Other"],"Linear Algebra":["Vectors","Matrices","Systems","Eigenvalues","Applications","Other"],"Discrete Mathematics":["Logic","Sets","Combinatorics","Graphs","Proofs","Other"],"Other":["Concepts","Solved Examples","Exercises","Timed Practice","Review","Other"]}},"Scholarship":{topics:["Application","Documents","Motivation Letter","Interview","Test Preparation","Travel Planning","University Research","Other"],skills:{"Application":["Search","Check Requirements","Fill Form","Review","Submit","Follow-up","Other"],"Documents":["CV","Transcript","Passport","Recommendation","Financial Documents","Translation","Other"],"Motivation Letter":["Brainstorm","Draft","Edit","Personalize","Final Review","Other"],"Interview":["Self Introduction","Why Major","Why Scholarship","Future Plans","Mock Interview","Other"],"Test Preparation":["Plan","Practice","Review Mistakes","Mock Test","Other"],"Travel Planning":["Visa","Accommodation","Budget","Flight","Packing","Other"],"University Research":["Program Research","Faculty Research","Scholarship Fit","Requirements","Other"],"Other":["Plan","Prepare","Review","Practice","Submit","Other"]}},"AI":{topics:["Machine Learning","Deep Learning","Data Science","NLP","Computer Vision","Projects","Other"],skills:{"Machine Learning":["Data","Models","Training","Evaluation","Scikit-learn","Project","Other"],"Deep Learning":["Neural Networks","CNN","RNN","Training","Evaluation","Other"],"Data Science":["Cleaning","Visualization","Pandas","Statistics","Reports","Other"],"NLP":["Text Cleaning","Tokenization","Embeddings","Classification","Chatbots","Other"],"Computer Vision":["Images","CNN","Object Detection","Classification","Other"],"Projects":["Idea","Dataset","Build","Evaluate","Deploy","Other"],"Other":["Study","Practice","Project","Review","Other"]}},"General":{topics:["Study","Planning","Review","Project","Health","Other"],skills:{"Study":["Learning","Practice","Review","Application","Other"],"Planning":["Weekly Plan","Daily Plan","Progress Check","Other"],"Review":["Summary","Mistakes","Flashcards","Other"],"Project":["Research","Build","Test","Improve","Other"],"Health":["Exercise","Sleep","Routine","Other"],"Other":["Learning","Practice","Review","Other"]}},"Other":{topics:["Other"],skills:{"Other":["Other"]}}};
function fillSelect(select,values,selectedValue){if(!select)return;select.innerHTML="";values.forEach(value=>{const option=document.createElement("option");option.value=value;option.textContent=value;if(value===selectedValue)option.selected=true;select.appendChild(option);});}
function updateDynamicTaskFields(){const categorySelect=document.getElementById("categorySelect"),topicSelect=document.getElementById("topicSelect"),skillSelect=document.getElementById("skillSelect"),customCategoryBox=document.getElementById("customCategoryBox"),customTopicBox=document.getElementById("customTopicBox"),customSkillBox=document.getElementById("customSkillBox");if(!categorySelect||!topicSelect||!skillSelect)return;const category=categorySelect.value||"General",config=TASK_OPTIONS[category]||TASK_OPTIONS.General,currentTopic=topicSelect.dataset.current||"",currentSkill=skillSelect.dataset.current||"";fillSelect(topicSelect,config.topics,currentTopic&&config.topics.includes(currentTopic)?currentTopic:config.topics[0]);function refreshSkills(){const selectedTopic=topicSelect.value,skills=config.skills[selectedTopic]||config.skills.Other||["Other"];fillSelect(skillSelect,skills,currentSkill&&skills.includes(currentSkill)?currentSkill:skills[0]);customTopicBox.style.display=selectedTopic==="Other"?"block":"none";customSkillBox.style.display=skillSelect.value==="Other"?"block":"none";}customCategoryBox.style.display=category==="Other"?"block":"none";refreshSkills();topicSelect.onchange=()=>{topicSelect.dataset.current="";skillSelect.dataset.current="";refreshSkills();};skillSelect.onchange=()=>{customSkillBox.style.display=skillSelect.value==="Other"?"block":"none";};}
document.addEventListener("DOMContentLoaded",()=>{const categorySelect=document.getElementById("categorySelect");if(categorySelect){updateDynamicTaskFields();categorySelect.addEventListener("change",()=>{const topicSelect=document.getElementById("topicSelect"),skillSelect=document.getElementById("skillSelect");if(topicSelect)topicSelect.dataset.current="";if(skillSelect)skillSelect.dataset.current="";updateDynamicTaskFields();});}});

/* Dark mode v2.1 */
function applyStoredTheme() {
    const storedTheme = localStorage.getItem("edupath-theme");
    if (storedTheme === "dark") {
        document.body.classList.add("dark-mode");
    } else {
        document.body.classList.remove("dark-mode");
    }
    const btn = document.getElementById("themeToggle");
    if (btn) {
        btn.textContent = document.body.classList.contains("dark-mode") ? "☀️ Light Mode" : "🌙 Dark Mode";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    applyStoredTheme();
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");
            localStorage.setItem("edupath-theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
            applyStoredTheme();
        });
    }
});
