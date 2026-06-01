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


/* EduPath AI v4.0 Smart Adaptive Task System */
const SMART_TASK_DATA = {
  "Secondary School": {
    icon: "🏫",
    main: ["Quran","Islamic Studies","Arabic Language","English Language","Mathematics","Physics","Chemistry","Biology","History","Geography","Society / Social Studies","Computer Science","General Review","Exams","Homework","Other"],
    sub: {
      "Quran": ["Memorization","Revision","Recitation","Tajweed","Interpretation","Other"],
      "English Language": ["Reading","Writing","Listening","Speaking","Grammar","Vocabulary","Translation","Exam Questions","Other"],
      "Mathematics": ["Algebra","Geometry","Trigonometry","Calculus Basics","Probability","Statistics","Equations","Functions","Past Exams","Other"],
      "Computer Science": ["Programming Basics","Algorithms","Computer Basics","Internet","Office Programs","Projects","Other"],
      "Exams": ["Past Exams","Mock Test","Timed Practice","Final Review","Other"],
      "Homework": ["Daily Homework","Assignment","Worksheet","Review","Other"],
      "Other": ["General Study","Review","Practice","Other"]
    },
    detail: {
      "Quran": ["Surah Review","Daily Portion","New Memorization","Old Memorization","Tajweed Rule","Mistake Correction","Other"],
      "Mathematics": ["Lesson Review","Formula Review","Past Questions","Difficult Problems","Other"],
      "English Language": ["Paragraph","Vocabulary Set","Grammar Rule","Listening File","Reading Passage","Other"]
    },
    training: ["Study Lesson","Solve Exercises","Review Mistakes","Timed Practice","Prepare for Exam","Memorize Formulas","Memorize","Review","Listen","Recite","Correct Mistakes","Write Paragraph","Listen and Repeat","Other"]
  },

  "University": {
    icon: "🎓",
    main: ["Computer Science","Information Technology","Computer Engineering","Software Engineering","Artificial Intelligence","Data Science","Cybersecurity","Engineering","Medicine","Pharmacy","Dentistry","Nursing","Business Administration","Accounting","Finance","Economics","Marketing","Management","Law","Sharia and Law","Islamic Studies","Education","English Language","Arabic Language","Translation","Media","Political Science","Psychology","Sociology","Mathematics","Physics","Chemistry","Biology","Architecture","Agriculture","Other"],
    sub: {
      "Computer Science": ["Programming","Algorithms","Data Structures","Databases","Operating Systems","Computer Networks","Software Engineering","Web Development","AI","Cybersecurity","Discrete Mathematics","Computer Architecture","Graduation Project","Other"],
      "Accounting": ["Financial Accounting","Managerial Accounting","Cost Accounting","Auditing","Tax Accounting","Accounting Systems","Reports","Budgeting","Other"],
      "Law": ["Civil Law","Criminal Law","Commercial Law","International Law","Legal Writing","Case Analysis","Legal Research","Other"],
      "Sharia and Law": ["Civil Law","Criminal Law","Commercial Law","International Law","Islamic Jurisprudence","Legal Writing","Case Analysis","Legal Research","Other"],
      "Business Administration": ["Management","Marketing","Finance","HR","Operations","Reports","Presentations","Other"],
      "Engineering": ["Calculus","Physics","Drawing","Mechanics","Labs","Projects","Other"],
      "Medicine": ["Anatomy","Physiology","Biochemistry","Pathology","Clinical Skills","Revision","Other"],
      "Other": ["Lecture","Assignment","Research","Project","Exam Review","Other"]
    },
    detail: {
      "Computer Science": ["Lecture Topic","Lab Task","Assignment Question","Project Feature","Exam Chapter","Other"],
      "Accounting": ["Exercise Set","Report","Chapter","Terms","Other"],
      "Law": ["Case","Legal Text","Research Question","Summary","Other"]
    },
    training: ["Lecture Study","Assignment","Lab Practice","Project Work","Exam Review","Research","Presentation","Problem Solving","Study Lecture","Solve Exercises","Prepare Report","Review Terms","Practice Problems","Analyze Case","Memorize Terms","Other"]
  },

  "Languages": {
    icon: "🌍",
    main: ["English","Turkish","Russian","Chinese","Indonesian","Romanian","Arabic","French","German","Other"],
    sub: {
      "English": ["General Language","IELTS","TOEFL","Duolingo English Test","Grammar","Vocabulary","Pronunciation","Reading","Writing","Listening","Speaking","Translation","Academic Language","Mock Test","Other"],
      "Chinese": ["General Language","HSK","Grammar","Vocabulary","Pronunciation","Reading","Writing","Listening","Speaking","Characters","Translation","Mock Test","Other"],
      "Turkish": ["General Language","Grammar","Vocabulary","Pronunciation","Reading","Writing","Listening","Speaking","Translation","Other"],
      "Russian": ["General Language","Grammar","Vocabulary","Pronunciation","Reading","Writing","Listening","Speaking","Translation","Other"],
      "Indonesian": ["General Language","Grammar","Vocabulary","Pronunciation","Reading","Writing","Listening","Speaking","Translation","Other"],
      "Romanian": ["General Language","Grammar","Vocabulary","Pronunciation","Reading","Writing","Listening","Speaking","Translation","Other"],
      "Other": ["General Language","Grammar","Vocabulary","Reading","Writing","Listening","Speaking","Other"]
    },
    detail: {
      "English": ["ELSA","IELTS Reading","IELTS Listening","TOEFL Speaking","TOEFL Writing","Vocabulary List","Grammar Rule","Other"],
      "Chinese": ["HSK Vocabulary","Characters","Pinyin","Listening Audio","Reading Text","Other"]
    },
    training: ["Reading Practice","Writing Practice","Listening Practice","Speaking Practice","Vocabulary Review","Grammar Practice","Pronunciation Practice","Dictation","Shadowing","Mock Test","Mistake Review","Other"]
  },

  "Programming & Technology": {
    icon: "💻",
    main: ["Python","C","C++","Java","JavaScript","TypeScript","HTML","CSS","SQL","Flask","Django","React","Node.js","PHP","C#","Go","Rust","Kotlin","Swift","Bash / Linux Shell","Git / GitHub","Web Development","Frontend Development","Backend Development","Full Stack Development","Mobile App Development","Desktop App Development","Databases","Algorithms","Data Structures","Problem Solving","Debugging","Software Engineering","Software Testing","Operating Systems","Computer Networks","Cybersecurity","Information Technology","IT Security","Cloud Computing","DevOps","APIs","Memory Management","Hardware","Computer Architecture","Embedded Systems","Artificial Intelligence","Machine Learning","Data Science","Projects","Documentation","Other"],
    sub: {
      "Python": ["Syntax","Variables","Data Types","Conditions","Loops","Functions","Lists","Tuples","Dictionaries","Sets","Files","OOP","Modules","Libraries","Virtual Environment","APIs","Flask","Data Analysis","Automation","Web Scraping","Machine Learning","Projects","Debugging","Other"],
      "Web Development": ["HTML","CSS","JavaScript","Frontend","Backend","Full Stack","Responsive Design","Forms","Authentication","APIs","Databases","Deployment","Performance","Security","Other"],
      "Algorithms": ["Searching","Sorting","Recursion","Greedy Algorithms","Dynamic Programming","Graph Algorithms","Tree Algorithms","Backtracking","Divide and Conquer","Complexity Analysis","Other"],
      "Cybersecurity": ["Security Basics","Network Security","Web Security","Linux Security","Cryptography","Ethical Hacking Basics","Vulnerabilities","Authentication","OWASP Basics","Malware Basics","Digital Forensics Basics","Other"],
      "JavaScript": ["Syntax","DOM","Events","APIs","Async/Await","Frontend","Debugging","Projects","Other"],
      "Databases": ["SQL","SQLite","PostgreSQL","MySQL","Schema Design","Queries","Joins","Indexes","Other"],
      "Data Structures": ["Arrays","Linked Lists","Stacks","Queues","Trees","Graphs","Hash Tables","Heaps","Other"],
      "Git / GitHub": ["Git Basics","Commits","Branches","Pull Requests","GitHub Pages","Collaboration","Other"],
      "Other": ["Concepts","Practice","Project","Debugging","Review","Other"]
    },
    detail: {
      "Python": ["Classes and Objects","Inheritance","File Handling","List Practice","Dictionary Practice","API Request","Flask Route","DataFrame","Other"],
      "Web Development": ["Landing Page","Login Form","Dashboard UI","API Integration","Responsive Navbar","Deployment Fix","Other"],
      "Algorithms": ["Problem Set","Time Complexity","Code Implementation","Mistake Review","Other"],
      "Cybersecurity": ["OWASP Top 10","Authentication Flow","Vulnerability Note","Linux Command","Other"]
    },
    training: ["Study Concept","Write Code","Solve Exercises","Build Mini Project","Debug Code","Read Documentation","Review Mistakes","Refactor Code","Practice Syntax","Build App","Build Page","Design Layout","Fix Bug","Connect Backend","Create Form","Make Responsive","Deploy Website","Improve UI","Practice Project","Understand Concept","Solve Problem","Analyze Time Complexity","Timed Practice","Code Implementation","Study Theory","Practice Lab","Read Article","Analyze Case","Secure App","Review Vulnerability","Other"]
  },

  "Artificial Intelligence": {
    icon: "🤖",
    main: ["Artificial Intelligence","Machine Learning","Deep Learning","Data Science","NLP","Computer Vision","Reinforcement Learning","AI Projects","Other"],
    sub: {
      "Machine Learning": ["Data Cleaning","Feature Engineering","Models","Training","Evaluation","Scikit-learn","Projects","Other"],
      "Deep Learning": ["Neural Networks","CNN","RNN","Transformers","Training","Evaluation","Other"],
      "Data Science": ["Pandas","Visualization","Statistics","Reports","Cleaning","Analysis","Other"],
      "NLP": ["Text Cleaning","Tokenization","Embeddings","Classification","Chatbots","Other"],
      "Computer Vision": ["Images","CNN","Object Detection","Classification","Other"],
      "Other": ["Study","Practice","Project","Review","Other"]
    },
    detail: {
      "Machine Learning": ["Dataset","Model Comparison","Accuracy","Feature Selection","Other"],
      "AI Projects": ["Idea","Dataset","Model","Evaluation","Deployment","Other"]
    },
    training: ["Study Concept","Code Implementation","Experiment","Evaluate Model","Build Project","Read Paper","Review Mistakes","Other"]
  },

  "Mathematics": {
    icon: "🧮",
    main: ["Algebra","Geometry","Trigonometry","Calculus","Probability","Statistics","Linear Algebra","Discrete Mathematics","Equations","Functions","Past Exams","Other"],
    sub: {
      "Algebra": ["Equations","Inequalities","Functions","Word Problems","Polynomials","Other"],
      "Geometry": ["Triangles","Circles","Coordinate Geometry","Proofs","Theorems","Other"],
      "Calculus": ["Limits","Derivatives","Integrals","Applications","Other"],
      "Probability": ["Basic Probability","Conditional Probability","Counting","Random Variables","Other"],
      "Statistics": ["Mean","Variance","Charts","Distributions","Inference","Other"],
      "Other": ["Concepts","Examples","Exercises","Review","Other"]
    },
    detail: {
      "Algebra": ["Exercise Set","Formula","Past Question","Difficult Topic","Other"],
      "Calculus": ["Derivative Rules","Integral Practice","Limit Problems","Other"]
    },
    training: ["Study Lesson","Solve Exercises","Review Mistakes","Timed Practice","Prepare for Exam","Memorize Formulas","Other"]
  },

  "Scholarships": {
    icon: "🎓",
    main: ["Scholarship Search","University Research","Application Form","Documents","CV","Motivation Letter","Personal Statement","Recommendation Letter","Interview","Language Test","Portfolio","Email Communication","Visa","Travel Preparation","Follow-up","Other"],
    sub: {
      "Scholarship Search": ["Requirements","Deadline","Eligibility","Funding","Major Selection","University Selection","Other"],
      "Motivation Letter": ["Bachelor Scholarship","Computer Science","Draft","Edit","Personalize","Final Review","Other"],
      "CV": ["Academic CV","Activities","Projects","Certificates","Formatting","Other"],
      "Interview": ["Self Introduction","Why Major","Why Scholarship","Future Plans","Mock Interview","Other"],
      "Documents": ["Preparation","Translation","Review","Upload","Final Check","Other"],
      "Visa": ["Requirements","Documents","Appointment","Travel Plan","Other"],
      "Other": ["Search","Prepare","Review","Submit","Other"]
    },
    detail: {
      "Motivation Letter": ["Opening Paragraph","Achievements","Projects","Future Goals","University Fit","Other"],
      "Interview": ["Question Practice","Answer Improvement","Mock Interview","Feedback","Other"],
      "Documents": ["Passport","Transcript","Certificate","Bank Statement","Recommendation","Other"]
    },
    training: ["Search","Compare","Prepare","Write","Edit","Review","Upload","Submit","Follow Up","Practice Interview","Final Check","Other"]
  },

  "Daily Life": {
    icon: "🌱",
    main: ["Health","Exercise","Sleep","Food","Water","Personal Routine","Family","Finance","Cleaning","Shopping","Time Management","Reading","Religious Routine","Appointments","Other"],
    sub: {
      "Health": ["Daily Habit","Weekly Routine","Self-care","Appointment","Other"],
      "Exercise": ["Workout","Walking","Stretching","Routine","Other"],
      "Religious Routine": ["Prayer","Quran","Dhikr","Reading","Other"],
      "Time Management": ["Plan Day","Review Progress","Weekly Plan","Other"],
      "Other": ["Daily Habit","Weekly Routine","Reminder","Personal Task","Important Appointment","Self-care","Other"]
    },
    detail: {
      "Health": ["Habit Check","Medicine Reminder","Routine Improvement","Other"],
      "Reading": ["Book Chapter","Summary","Reflection","Other"]
    },
    training: ["Do Task","Review Progress","Repeat Habit","Prepare","Check","Improve Routine","Other"]
  },

  "Projects": {
    icon: "🚀",
    main: ["Programming Project","AI Project","Web Project","Mobile App","Research Project","School Project","University Project","Scholarship Portfolio","Personal Project","Other"],
    sub: {
      "Programming Project": ["Idea","Planning","Design","Frontend","Backend","Database","Testing","Debugging","Deployment","Documentation","Presentation","Other"],
      "AI Project": ["Idea","Dataset","AI Model","Training","Testing","Deployment","Documentation","Other"],
      "Web Project": ["Frontend","Backend","Database","Authentication","Deployment","UI","Other"],
      "Other": ["Idea","Planning","Build","Test","Improve","Other"]
    },
    detail: {
      "Programming Project": ["Feature","Bug","Page","API","Database Table","Other"],
      "AI Project": ["Dataset","Model","Evaluation","Demo","Other"]
    },
    training: ["Brainstorm","Build","Code","Test","Improve","Deploy","Write Documentation","Review","Other"]
  },

  "Exams & Certificates": {
    icon: "📜",
    main: ["IELTS","TOEFL","Duolingo English Test","HSK","SAT","ACT","University Exam","School Exam","Programming Certificate","Online Course","Other"],
    sub: {
      "IELTS": ["Reading","Listening","Writing","Speaking","Vocabulary","Mock Test","Other"],
      "TOEFL": ["Reading","Listening","Speaking","Writing","Mock Test","Other"],
      "HSK": ["Vocabulary","Characters","Listening","Reading","Mock Test","Other"],
      "Programming Certificate": ["Course Videos","Exercises","Project","Final Exam","Other"],
      "Other": ["Study","Practice","Mock Test","Review","Other"]
    },
    detail: {
      "IELTS": ["Cambridge Test","Task 1","Task 2","Speaking Part 2","Other"],
      "TOEFL": ["Integrated Writing","Speaking Question","Reading Passage","Other"]
    },
    training: ["Study","Practice","Mock Test","Review Mistakes","Timed Practice","Final Review","Other"]
  },

  "Reading & Research": {
    icon: "📚",
    main: ["Book Reading","Article Reading","Research Paper","Summary","Notes","Literature Review","Critical Thinking","Other"],
    sub: {
      "Book Reading": ["Chapter","Summary","Reflection","Vocabulary","Other"],
      "Research Paper": ["Abstract","Introduction","Methodology","Results","Discussion","References","Other"],
      "Other": ["Read","Summarize","Analyze","Take Notes","Other"]
    },
    detail: {
      "Research Paper": ["Key Ideas","Methods","Limitations","Findings","Other"]
    },
    training: ["Read","Summarize","Analyze","Take Notes","Review","Discuss","Other"]
  },

  "General": {
    icon: "⭐",
    main: ["Study","Planning","Review","Reminder","Personal Task","Other"],
    sub: {
      "Study": ["Learning","Practice","Review","Application","Other"],
      "Planning": ["Daily Plan","Weekly Plan","Progress Check","Other"],
      "Other": ["General","Other"]
    },
    detail: {"Other": ["General","Other"]},
    training: ["Do Task","Study","Practice","Review","Prepare","Other"]
  },

  "Other": {
    icon: "➕",
    main: ["Other"],
    sub: {"Other": ["Other"]},
    detail: {"Other": ["Other"]},
    training: ["Other"]
  }
};

function fillSmartSelect(select, values, selectedValue) {
    if (!select) return;
    select.innerHTML = "";
    const unique = [...new Set(values && values.length ? values : ["Other"])];
    unique.forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        if (selectedValue && value === selectedValue) option.selected = true;
        select.appendChild(option);
    });
}

function getSmartConfig(type) {
    return SMART_TASK_DATA[type] || SMART_TASK_DATA["General"];
}

function selectedOrFirst(values, selected) {
    if (selected && values && values.includes(selected)) return selected;
    return values && values.length ? values[0] : "Other";
}

function renderTaskTypeCards() {
    const grid = document.getElementById("taskTypeCards");
    const categoryInput = document.getElementById("categorySelect");
    if (!grid || !categoryInput) return;

    grid.innerHTML = "";
    const current = categoryInput.value || "General";

    Object.entries(SMART_TASK_DATA).forEach(([type, config]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "task-type-card" + (type === current ? " active" : "");
        button.dataset.type = type;
        button.innerHTML = `<span>${config.icon || "⭐"}</span><strong>${type}</strong>`;
        button.addEventListener("click", () => {
            categoryInput.value = type;
            document.querySelectorAll(".task-type-card").forEach(card => card.classList.remove("active"));
            button.classList.add("active");
            const topicSelect = document.getElementById("topicSelect");
            const skillSelect = document.getElementById("skillSelect");
            const detailSelect = document.getElementById("detailedTopicSelect");
            const trainingSelect = document.getElementById("trainingTypeSelect");
            if (topicSelect) topicSelect.dataset.current = "";
            if (skillSelect) skillSelect.dataset.current = "";
            if (detailSelect) detailSelect.dataset.current = "";
            if (trainingSelect) trainingSelect.dataset.current = "";
            updateSmartTaskFields();
            document.getElementById("taskDetailsArea")?.scrollIntoView({behavior: "smooth", block: "start"});
        });
        grid.appendChild(button);
    });
}

function updateSmartTaskFields() {
    const categoryInput = document.getElementById("categorySelect");
    const topicSelect = document.getElementById("topicSelect");
    const skillSelect = document.getElementById("skillSelect");
    const detailSelect = document.getElementById("detailedTopicSelect");
    const trainingSelect = document.getElementById("trainingTypeSelect");

    if (!categoryInput || !topicSelect || !skillSelect || !detailSelect || !trainingSelect) return;

    const type = categoryInput.value || "General";
    const config = getSmartConfig(type);

    const currentTopic = topicSelect.dataset.current || "";
    const topicValues = config.main || ["Other"];
    fillSmartSelect(topicSelect, topicValues, selectedOrFirst(topicValues, currentTopic));

    function refreshSubFields() {
        const selectedTopic = topicSelect.value;
        const subValues = (config.sub && (config.sub[selectedTopic] || config.sub["Other"])) || ["Other"];
        const currentSkill = skillSelect.dataset.current || "";
        fillSmartSelect(skillSelect, subValues, selectedOrFirst(subValues, currentSkill));
        refreshDetails();
        toggleOtherBoxes();
    }

    function refreshDetails() {
        const selectedTopic = topicSelect.value;
        const selectedSkill = skillSelect.value;
        const detailValues = (config.detail && (config.detail[selectedSkill] || config.detail[selectedTopic] || config.detail["Other"])) || ["General Topic", "Other"];
        const currentDetail = detailSelect.dataset.current || "";
        fillSmartSelect(detailSelect, detailValues, selectedOrFirst(detailValues, currentDetail));

        const trainingValues = config.training || ["Study", "Practice", "Review", "Other"];
        const currentTraining = trainingSelect.dataset.current || "";
        fillSmartSelect(trainingSelect, trainingValues, selectedOrFirst(trainingValues, currentTraining));

        toggleOtherBoxes();
    }

    function toggleOtherBoxes() {
        const customCategoryBox = document.getElementById("customCategoryBox");
        const customTopicBox = document.getElementById("customTopicBox");
        const customSkillBox = document.getElementById("customSkillBox");
        const customDetailedTopicBox = document.getElementById("customDetailedTopicBox");
        const customTrainingTypeBox = document.getElementById("customTrainingTypeBox");

        if (customCategoryBox) customCategoryBox.style.display = type === "Other" ? "block" : "none";
        if (customTopicBox) customTopicBox.style.display = topicSelect.value === "Other" ? "block" : "none";
        if (customSkillBox) customSkillBox.style.display = skillSelect.value === "Other" ? "block" : "none";
        if (customDetailedTopicBox) customDetailedTopicBox.style.display = detailSelect.value === "Other" ? "block" : "none";
        if (customTrainingTypeBox) customTrainingTypeBox.style.display = trainingSelect.value === "Other" ? "block" : "none";
    }

    topicSelect.onchange = () => {
        topicSelect.dataset.current = "";
        skillSelect.dataset.current = "";
        detailSelect.dataset.current = "";
        trainingSelect.dataset.current = "";
        refreshSubFields();
    };

    skillSelect.onchange = () => {
        skillSelect.dataset.current = "";
        detailSelect.dataset.current = "";
        refreshDetails();
    };

    detailSelect.onchange = toggleOtherBoxes;
    trainingSelect.onchange = toggleOtherBoxes;

    refreshSubFields();
}

function updateRepeatDaysVisibility() {
    const repeatSelect = document.getElementById("repeatTypeSelect");
    const box = document.getElementById("repeatDaysBox");
    if (!repeatSelect || !box) return;
    box.style.display = repeatSelect.value === "selected_days" ? "block" : "none";
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("taskTypeCards")) {
        const categoryInput = document.getElementById("categorySelect");
        if (categoryInput && !categoryInput.value) categoryInput.value = "General";
        renderTaskTypeCards();
        updateSmartTaskFields();
    }

    const repeatSelect = document.getElementById("repeatTypeSelect");
    if (repeatSelect) {
        updateRepeatDaysVisibility();
        repeatSelect.addEventListener("change", updateRepeatDaysVisibility);
    }
});
