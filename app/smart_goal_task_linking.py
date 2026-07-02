"""Lightweight precise task-goal matching for EduPath AI.

Backend-only logic. No UI, CSS, HTML, database schema, or adaptive bank changes.
The matcher is deterministic, local, and fast. It is designed to prevent broad
keyword matches from incorrectly increasing goal progress.
"""

from __future__ import annotations

import math
import re
from datetime import date, datetime
from typing import Any, Dict, Iterable, List, Set, Tuple


ARABIC_DIACRITICS_RE = re.compile(r"[\u064B-\u065F\u0670\u06D6-\u06ED]")
NON_WORD_RE = re.compile(r"[^0-9a-zA-Z\u0600-\u06FF+#.]+")
TOKEN_RE = re.compile(r"[a-z0-9+#.]{2,}|[\u0600-\u06FF]{2,}")


COMMON_WEAK_TERMS = {
    "study", "learn", "review", "practice", "task", "lesson", "unit", "project", "reading", "writing",
    "دراسه", "تعلم", "مراجعه", "حل", "تلخيص", "تدريب", "اختبار", "قراءه", "كتابه",
    "محاضره", "وحده", "درس", "مشروع", "بحث", "لغه", "ماده", "اتقان", "عام", "عامه",
}

EXAM_DOMAINS = {"ielts", "toefl", "duolingo", "csca", "sat", "gre", "gmat", "hsk"}
LANGUAGE_GENERAL_DOMAINS = {"english_general", "arabic_language", "languages_general"}
QURAN_DOMAINS = {"quran_memorization"}
ISLAMIC_DOMAINS = {"islamic_studies"}
SECONDARY_PREFIX = "secondary_"
UNIVERSITY_PREFIX = "university_"
PROGRAMMING_DOMAINS = {
    "python_basics", "flask", "django", "nodejs", "javascript", "html_css", "react", "backend",
    "api", "sql", "databases", "git", "linux", "networking", "docker", "devops",
    "data_structures", "algorithms", "system_design", "secure_coding", "programming_general",
}
AI_DOMAINS = {
    "ai_general", "machine_learning", "regression", "classification", "clustering", "data_preparation",
    "feature_engineering", "model_evaluation", "deep_learning", "computer_vision", "nlp", "transformers",
    "llms", "prompt_engineering", "generative_ai", "embeddings", "vector_search", "rag", "fine_tuning",
    "ai_agents", "multimodal_ai", "ai_deployment", "ai_safety",
}


DOMAIN_ALIASES: Dict[str, List[str]] = {
    # Exams
    "ielts": ["ielts", "ايلتس", "آيلتس", "academic ielts", "ielts reading", "reading ielts", "ielts listening", "listening ielts", "ielts writing", "ielts speaking", "writing task 1", "writing task 2", "speaking part 1", "speaking part 2", "speaking part 3", "band score", "band descriptors", "mock test", "نموذج ايلتس", "اختبار ايلتس", "قراءة ايلتس", "استماع ايلتس", "كتابة ايلتس", "محادثة ايلتس"],
    "toefl": ["toefl", "توفل", "reading toefl", "listening toefl", "speaking toefl", "writing toefl", "academic discussion", "integrated writing", "toefl mock"],
    "duolingo": ["duolingo english test", "duolingo", "det", "دولينجو", "interactive reading", "interactive listening", "interactive writing", "interactive speaking", "read and select", "listen and type", "writing sample", "speaking sample"],
    "csca": ["csca", "cs ca", "اختبار csca", "csca physics", "csca chemistry", "csca mathematics", "csca math"],
    "sat": ["sat", "digital sat"],
    "gre": ["gre"],
    "gmat": ["gmat"],
    "hsk": ["hsk"],

    # Languages
    "english_general": ["english", "الانجليزيه", "اللغة الانجليزية", "اللغة الإنجليزية", "انجليزي", "grammar", "vocabulary", "reading", "writing", "listening", "speaking", "pronunciation", "translation", "القواعد", "المفردات", "القراءه", "القراءة", "الكتابه", "الكتابة", "الاستماع", "المحادثه", "المحادثة", "النطق", "الترجمه", "الترجمة", "المهارة اللغوية"],
    "arabic_language": ["العربيه", "اللغة العربية", "نحو", "صرف", "بلاغه", "ادب", "قراءه", "تعبير", "املاء"],

    # Quran / Islamic
    "quran_memorization": ["قران", "قرآن", "القران", "القرآن", "نوع المتابعة القرآنية", "السورة أو مجال المتابعة", "المقطع أو الآيات المحددة", "حفظ", "حفظ جديد", "مراجعة", "تسميع", "تجويد", "تلاوه", "تلاوة", "سوره", "سورة", "السورة كاملة", "ايات", "آيات", "آيات محددة", "ايه", "آية", "جزء", "مصحف", "تفسير", "تفسير مبسط", "المتشابهات", "الوقف والابتداء", "مراجعة محفوظ", "اختبار حفظ"],
    "islamic_studies": ["التربيه الاسلاميه", "اسلاميه", "ايمان", "حديث", "فقه", "سيره"],

    # Secondary school subjects and topics
    "secondary_general": ["المرحله الثانويه", "الصف الاول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي", "ثانوي"],
    "secondary_math": ["رياضيات", "الرياضيات", "المادة الدراسية", "فرع الرياضيات", "جبر", "هندسه", "هندسة", "دوال", "معادلات", "حل مسائل", "حل تمارين", "احتمالات", "احصاء", "إحصاء"],
    "secondary_calculus": ["تفاضل", "تكامل", "مشتقه", "مشتقة", "المشتقه", "المشتقة", "نهايات", "اتصال", "قواعد الاشتقاق", "تطبيقات المشتقه", "تطبيقات المشتقة", "المساحه تحت المنحني", "المساحة تحت المنحنى"],
    "secondary_statistics": ["احصاء", "إحصاء", "الاحصاء", "الإحصاء", "احتمالات", "المتوسط", "الوسيط", "المنوال", "انحراف معياري", "تباين", "تباديل", "توافيق"],
    "secondary_physics": ["فيزياء", "الفيزياء", "قوانين نيوتن", "حركه", "قوي", "شغل", "طاقه", "زخم", "كهرباء", "دوائر كهربائيه", "مغناطيسيه", "موجات", "صوت", "ضوء", "عدسات", "مرايا"],
    "secondary_chemistry": ["كيمياء", "الكيمياء", "المعادلات الكيميائيه", "المول", "المحاليل", "احماض", "قواعد", "اكسده", "اختزال", "اتزان كيميائي", "الكيمياء العضويه"],
    "secondary_biology": ["احياء", "الاحياء", "الخليه", "الانسجه", "التغذيه", "التنفس", "الدوران", "الاخراج", "الجهاز العصبي", "الوراثه", "dna", "الجينات", "المناعه"],
    "secondary_arabic": ["اللغة العربية", "اللغه العربيه", "نحو", "صرف", "بلاغه", "ادب", "تعبير", "املاء", "نصوص", "محفوظات"],
    "secondary_english": ["اللغة الانجليزية", "اللغه الانجليزيه", "انجليزي", "قواعد", "مفردات", "نص قراءة", "تدريب اختبار", "تدريب استماع", "تدريب تحدث"],
    "secondary_history": ["تاريخ", "التاريخ", "الدوله الامويه", "الدوله العباسيه", "الاندلس", "الحروب العالميه", "تسلسل زمني"],
    "secondary_geography": ["جغرافيا", "الجغرافيا", "خرائط", "مناخ", "تضاريس", "سكان", "عمران", "موارد طبيعيه"],
    "secondary_earth_environment": ["علوم الارض", "بيئه", "الصخور", "المعادن", "البراكين", "الزلازل", "الصفائح التكتونيه", "التغير المناخي"],
    "secondary_computer": ["الحاسوب", "تقنية المعلومات", "اساسيات الحاسوب", "نظم التشغيل", "الجداول الالكترونيه", "مبادئ البرمجه"],

    # University examples
    "university_anatomy": ["تشريح", "التشريح", "anatomy", "اطلس تشريحي", "atlas"],
    "university_pharmacology": ["علم الادويه", "ادويه", "pharmacology", "ادوية القلب", "cardio drugs"],
    "university_medicine": ["طب", "الطب", "طب بشري", "medicine", "medical"],

    # Programming
    "python_basics": ["python", "بايثون", "syntax", "variables", "functions", "loops", "oop", "اساسيات بايثون", "أساسيات بايثون", "المجال التقني", "المسار أو التقنية"],
    "flask": ["flask", "فلاسك", "routes", "templates", "jinja", "sqlalchemy", "web backend"],
    "django": ["django"],
    "nodejs": ["node.js", "nodejs", "express"],
    "javascript": ["javascript", "جافاسكريبت", "dom"],
    "html_css": ["html", "css", "responsive design"],
    "react": ["react", "jsx", "components", "hooks"],
    "backend": ["backend", "back-end", "api", "server", "routes"],
    "api": ["api", "apis", "rest", "graphql"],
    "sql": ["sql", "queries", "joins"],
    "databases": ["database", "databases", "sqlite", "postgresql", "mysql", "قواعد البيانات"],
    "git": ["git", "github"],
    "linux": ["linux", "لينكس", "bash", "shell"],
    "networking": ["network", "networking", "tcp", "ip", "dns"],
    "docker": ["docker", "containers", "container"],
    "devops": ["devops", "ci/cd", "deployment pipeline"],
    "data_structures": ["data structures", "arrays", "linked list", "stack", "queue", "tree", "graph", "hash"],
    "algorithms": ["algorithms", "sorting", "searching", "dynamic programming", "greedy", "recursion", "binary search"],
    "system_design": ["system design", "scalability", "architecture"],
    "secure_coding": ["secure coding", "security", "owasp"],

    # AI
    "ai_general": ["artificial intelligence", "الذكاء الاصطناعي", "مجال الذكاء الاصطناعي", "ai fundamentals", "prompt engineering", "هندسة الأوامر"],
    "machine_learning": ["machine learning", "تعلم الاله", "تعلم الآلة", "ml", "scikit-learn", "model training", "تدريب النموذج"],
    "regression": ["regression", "linear regression", "logistic regression", "الانحدار"],
    "classification": ["classification", "classification metrics", "تصنيف", "confusion matrix", "precision", "recall", "f1"],
    "clustering": ["clustering", "k-means"],
    "data_preparation": ["data preparation", "dataset", "cleaning", "preprocessing"],
    "feature_engineering": ["feature engineering"],
    "model_evaluation": ["model evaluation", "metrics", "cross validation"],
    "deep_learning": ["deep learning", "neural networks", "cnn", "rnn"],
    "computer_vision": ["computer vision", "cv", "images", "opencv"],
    "nlp": ["nlp", "natural language processing", "معالجة اللغه"],
    "transformers": ["transformers", "bert", "attention"],
    "llms": ["llm", "llms", "large language model", "language models"],
    "prompt_engineering": ["prompt engineering", "prompts"],
    "generative_ai": ["generative ai", "text generation", "image generation"],
    "embeddings": ["embeddings", "embedding", "vectors", "تضمينات"],
    "vector_search": ["vector search", "semantic search", "vector database", "بحث متجهي"],
    "rag": ["rag", "retrieval augmented generation", "retrieval", "retrieved context", "مصادر", "استرجاع", "vector search", "embeddings", "توليد معزز بالاسترجاع"],
    "fine_tuning": ["fine-tuning", "finetuning", "fine tuning"],
    "ai_agents": ["ai agents", "agents", "tools"],
    "multimodal_ai": ["multimodal", "vision language"],
    "ai_deployment": ["ai deployment", "model serving", "deploy model"],
    "ai_safety": ["ai safety", "alignment", "safety"],
}

EXACT_EXAM_HINTS = {
    "ielts": {"ielts", "ايلتس", "آيلتس", "task 1", "task 2", "speaking part", "band", "mock test", "نموذج ايلتس"},
    "toefl": {"toefl", "توفل", "integrated writing", "academic discussion", "toefl mock"},
    "duolingo": {"duolingo", "det", "دولينجو", "interactive", "read and select", "listen and type"},
    "csca": {"csca"},
}


ALLOWED_RELATIONS = {
    ("rag", "embeddings"), ("rag", "vector_search"), ("rag", "llms"), ("rag", "data_preparation"),
    ("machine_learning", "data_preparation"), ("machine_learning", "feature_engineering"), ("machine_learning", "model_evaluation"),
    ("flask", "python_basics"), ("backend", "api"), ("backend", "databases"),
    ("university_anatomy", "university_medicine"),
}

REJECTED_PAIRS = {
    ("ielts", "toefl"), ("toefl", "ielts"),
    ("ielts", "duolingo"), ("duolingo", "ielts"),
    ("toefl", "duolingo"), ("duolingo", "toefl"),
    ("rag", "python_basics"), ("rag", "prompt_engineering"),
    ("deep_learning", "python_basics"), ("machine_learning", "python_basics"),
    ("secondary_calculus", "secondary_statistics"), ("secondary_statistics", "secondary_calculus"),
    ("university_anatomy", "university_pharmacology"), ("university_pharmacology", "university_anatomy"),
    ("quran_memorization", "islamic_studies"), ("islamic_studies", "quran_memorization"),
}


STRONG_ACTIVITY_TERMS = {
    "حل نموذج", "اختبار ذاتي", "مراجعة اخطاء", "مشروع عملي", "تطبيق عملي", "تسميع", "تقييم نموذج",
    "تقرير نهائي", "محاكاة اختبار", "mock", "mock test", "model evaluation", "training model",
}
MEDIUM_ACTIVITY_TERMS = {
    "دراسة درس", "تلخيص", "حل تمارين", "مراجعة وحدة", "قراءة مصدر", "practice", "review", "درس", "محاضرة",
}
LIGHT_ACTIVITY_TERMS = {
    "قراءة خفيفة", "ترتيب ملاحظات", "مشاهدة فيديو", "حفظ كلمات", "قراءة", "فيديو",
}


def normalize_text(text: Any) -> str:
    text = str(text or "").lower()
    text = ARABIC_DIACRITICS_RE.sub("", text)
    text = text.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا")
    text = text.replace("ى", "ي")
    # Keep ة and ه both searchable by adding normalized variant later through tokens.
    text = text.replace("ؤ", "و").replace("ئ", "ي")
    text = text.replace("ـ", "")
    text = NON_WORD_RE.sub(" ", text)
    return re.sub(r"\s+", " ", text).strip()


def tokens(text: Any) -> Set[str]:
    normalized = normalize_text(text)
    base = set(TOKEN_RE.findall(normalized))
    # Add common ta marbuta variant without destroying original text.
    expanded = set(base)
    for token in base:
        if "ة" in token:
            expanded.add(token.replace("ة", "ه"))
    return {t for t in expanded if len(t) >= 2 and t not in COMMON_WEAK_TERMS}


def contains_phrase(text: str, phrase: str) -> bool:
    return normalize_text(phrase) in text


def get_attr(obj: Any, name: str) -> str:
    return str(getattr(obj, name, "") or "")


def parse_plan_from_notes(notes: str) -> Dict[str, str]:
    data: Dict[str, str] = {}
    for line in str(notes or "").splitlines():
        if ":" in line:
            key, value = line.split(":", 1)
            data[key.strip()] = value.strip()
    return data


def goal_text_parts(goal: Any) -> List[str]:
    plan = parse_plan_from_notes(get_attr(goal, "notes"))
    return [
        get_attr(goal, "title"), get_attr(goal, "category"), get_attr(goal, "current_level"), get_attr(goal, "notes"),
        plan.get("Goal Type", ""), plan.get("Goal Category", ""), plan.get("Goal Path", ""),
        plan.get("Current State", ""), plan.get("Target State", ""), plan.get("Goal Outcome", ""),
        plan.get("Milestones", ""), plan.get("Keywords", ""),
    ]


def task_text_parts(task: Any) -> List[str]:
    return [
        get_attr(task, "title"), get_attr(task, "category"), get_attr(task, "custom_category"), get_attr(task, "topic"),
        get_attr(task, "custom_topic"), get_attr(task, "skill"), get_attr(task, "custom_skill"), get_attr(task, "language"),
        get_attr(task, "practice_type"), get_attr(task, "source"), get_attr(task, "notes"),
    ]


def detect_domains(text: str) -> Set[str]:
    found: Set[str] = set()
    normalized = normalize_text(text)
    for domain, aliases in DOMAIN_ALIASES.items():
        for alias in aliases:
            if contains_phrase(normalized, alias):
                found.add(domain)
                break

    # Group-level inference with careful specificity.
    if "المرحله الثانويه" in normalized or "ثانوي" in normalized:
        found.add("secondary_general")
    if "المرحله الجامعيه" in normalized or "جامعي" in normalized:
        found.add("university_general")
    if "برمجه" in normalized or "programming" in normalized:
        found.add("programming_general")
    if "ذكاء اصطناعي" in normalized or "ai" in tokens(normalized):
        found.add("ai_general")
    return found


def detect_type(obj: Any, text: str, is_goal: bool) -> str:
    category = normalize_text(get_attr(obj, "category"))
    combined = normalize_text(text)
    domains = detect_domains(combined)

    if contains_phrase(combined, "المرحلة الثانوية") or contains_phrase(category, "الثانوية") or "secondary" in category or "secondary_general" in domains:
        return "secondary"
    if contains_phrase(combined, "المرحلة الجامعية") or contains_phrase(category, "جامعي") or "university" in category or any(d.startswith("university_") for d in domains):
        return "university"
    if "اختبارات" in category or any(d in domains for d in EXAM_DOMAINS):
        return "exam"
    if "لغات" in category or "لغه" in category or "لغة" in category or any(d in domains for d in LANGUAGE_GENERAL_DOMAINS):
        return "language"
    if "قران" in combined or "حفظ القران" in combined or "quran_memorization" in domains:
        return "quran"
    if "برمجه" in category or "برمجة" in category or "تكنولوجيا" in category or any(d in domains for d in PROGRAMMING_DOMAINS):
        return "programming"
    if "ذكاء" in category or any(d in domains for d in AI_DOMAINS):
        return "ai"
    if "منح" in category or "منحه" in combined or "منحة" in combined or "scholarship" in combined:
        return "scholarship"
    if "مشاريع" in category or "project" in combined:
        return "projects"
    return "general"


def signature_for_goal(goal: Any) -> Dict[str, Any]:
    text = " ".join(goal_text_parts(goal))
    normalized = normalize_text(text)
    domain_set = detect_domains(normalized)
    return {
        "type": detect_type(goal, normalized, True),
        "text": normalized,
        "tokens": tokens(normalized),
        "domains": domain_set,
        "raw": text,
    }


def signature_for_task(task: Any) -> Dict[str, Any]:
    text = " ".join(task_text_parts(task))
    normalized = normalize_text(text)
    domain_set = detect_domains(normalized)
    return {
        "type": detect_type(task, normalized, False),
        "text": normalized,
        "tokens": tokens(normalized),
        "domains": domain_set,
        "raw": text,
        "activity": normalize_text(get_attr(task, "practice_type") + " " + get_attr(task, "title")),
    }


def has_exact_exam_hint(sig: Dict[str, Any], exam: str) -> bool:
    text = sig["text"]
    for hint in EXACT_EXAM_HINTS.get(exam, set()):
        if contains_phrase(text, hint):
            return True
    return False


def type_compatible(goal_sig: Dict[str, Any], task_sig: Dict[str, Any]) -> Tuple[bool, int, str]:
    gt, tt = goal_sig["type"], task_sig["type"]
    if gt == tt:
        return True, 25, f"Type matched: {gt}"

    # Explicit safe relations.
    if gt == "exam" and tt == "language":
        goal_exams = goal_sig["domains"] & EXAM_DOMAINS
        if any(has_exact_exam_hint(task_sig, exam) for exam in goal_exams):
            return True, 15, "Allowed language task because exact exam terms are present"
        return False, 0, "Rejected broad language-only task for exam goal"

    if gt == "language" and tt == "exam":
        return False, 0, "Rejected exam-specific task for general language goal"

    if gt == "ai" and tt == "programming":
        if (goal_sig["domains"] & {"ai_deployment"}) and (task_sig["domains"] & {"docker", "api", "backend"}):
            return True, 8, "Allowed deployment/tooling relation for AI deployment"
        return False, 0, "Rejected broad programming task for AI goal"

    if gt == "programming" and tt == "ai":
        return False, 0, "Rejected AI task for programming goal unless explicit programming domain matches"

    if gt == "secondary" and tt != "secondary":
        return False, 0, "Rejected non-secondary task for secondary goal"
    if gt == "university" and tt != "university":
        return False, 0, "Rejected non-university task for university goal"
    if gt == "quran" and tt in {"general", "secondary"}:
        # Quran text may have been saved under a general or secondary task type.
        if task_sig["domains"] & {"quran_memorization"}:
            return True, 12, f"Allowed Quran task saved under {tt} type"
        return False, 0, f"Rejected {tt} task for Quran goal"

    return False, 0, f"Rejected type mismatch: {gt} vs {tt}"


def domain_relation(goal_domain: str, task_domain: str) -> str:
    if goal_domain == task_domain:
        return "same"
    if (goal_domain, task_domain) in REJECTED_PAIRS:
        return "reject"
    if (goal_domain, task_domain) in ALLOWED_RELATIONS:
        return "allowed"
    # Same groups but different exact tracks are often not enough.
    if goal_domain.startswith("secondary_") and task_domain.startswith("secondary_"):
        return "group_different"
    if goal_domain in PROGRAMMING_DOMAINS and task_domain in PROGRAMMING_DOMAINS:
        return "group_different"
    if goal_domain in AI_DOMAINS and task_domain in AI_DOMAINS:
        return "group_different"
    if goal_domain.startswith("university_") and task_domain.startswith("university_"):
        return "group_different"
    return "different"


def score_domain_match(goal_sig: Dict[str, Any], task_sig: Dict[str, Any]) -> Tuple[int, List[str], bool]:
    score = 0
    reasons: List[str] = []
    rejected = False

    goal_domains = set(goal_sig["domains"])
    task_domains = set(task_sig["domains"])

    # If the goal is an exam, require exact exam identity. Broad English is not enough.
    goal_exams = goal_domains & EXAM_DOMAINS
    if goal_exams:
        if not (goal_exams & task_domains) and not any(has_exact_exam_hint(task_sig, exam) for exam in goal_exams):
            return 0, ["Rejected broad non-exam task for exam goal"], True

    # If the task is exam-specific but goal is general language, avoid strong general-language inflation.
    task_exams = task_domains & EXAM_DOMAINS
    if task_exams and not goal_exams:
        if goal_sig["type"] == "language":
            return 0, ["Rejected exam-specific task for general language goal"], True

    # Quran vs Islamic separation.
    if "quran_memorization" in goal_domains and "islamic_studies" in task_domains and "quran_memorization" not in task_domains:
        return 0, ["Rejected Islamic-studies task for Quran memorization goal"], True

    if not goal_domains or not task_domains:
        return 0, ["No precise domain detected"], False

    for gd in goal_domains:
        for td in task_domains:
            relation = domain_relation(gd, td)
            if relation == "reject":
                return 0, [f"Rejected same broad area but different precise domain: {gd} vs {td}"], True
            if relation == "same":
                score = max(score, 35)
                reasons.append(f"Exact domain matched: {gd}")
            elif relation == "allowed":
                score = max(score, 35)
                reasons.append(f"Allowed supporting domain: {td} for {gd}")
            elif relation == "group_different":
                # Different topic in same broad domain is weak and should not be enough alone.
                score = max(score, 8)
                reasons.append(f"Same broad domain but different precise topic: {gd} vs {td}")

    return score, reasons, rejected


def score_topic_activity(goal_sig: Dict[str, Any], task_sig: Dict[str, Any]) -> Tuple[int, List[str]]:
    score = 0
    reasons: List[str] = []

    overlap = (goal_sig["tokens"] & task_sig["tokens"]) - COMMON_WEAK_TERMS
    if overlap:
        # Only non-common overlap matters.
        score += min(20, len(overlap) * 4)
        reasons.append("Shared precise tokens: " + ", ".join(sorted(overlap)[:6]))

    activity = task_sig["activity"]
    if any(contains_phrase(activity, term) for term in STRONG_ACTIVITY_TERMS):
        score += 18
        reasons.append("Strong activity matched")
    elif any(contains_phrase(activity, term) for term in MEDIUM_ACTIVITY_TERMS):
        score += 10
        reasons.append("Medium activity matched")
    elif any(contains_phrase(activity, term) for term in LIGHT_ACTIVITY_TERMS):
        score += 4
        reasons.append("Light activity matched")

    # Quran nuance: interpretation helps, memorization/tasmee is stronger.
    if "quran_memorization" in goal_sig["domains"] and "quran_memorization" in task_sig["domains"]:
        if any(contains_phrase(task_sig["text"], term) for term in ["تسميع", "حفظ", "مراجعة محفوظ", "تثبيت", "اختبار حفظ"]):
            score += 18
            reasons.append("Quran memorization core activity")
        elif any(contains_phrase(task_sig["text"], term) for term in ["تفسير", "معاني", "فوائد", "هدايات"]):
            score += 13
            reasons.append("Quran supportive interpretation activity")

    if (goal_sig["domains"] & EXAM_DOMAINS) and (task_sig["domains"] & EXAM_DOMAINS):
        if any(contains_phrase(task_sig["text"], hint) for hints in EXACT_EXAM_HINTS.values() for hint in hints):
            score += 12
            reasons.append("Exact exam activity/topic matched")

    return min(score, 35), reasons


def precise_context_score(goal: Any, task: Any, legacy_score: int = 0, legacy_reason: str = "") -> Tuple[int, str]:
    goal_sig = signature_for_goal(goal)
    task_sig = signature_for_task(task)

    type_ok, type_score, type_reason = type_compatible(goal_sig, task_sig)
    reasons = [type_reason]
    if not type_ok:
        return 0, type_reason

    domain_score, domain_reasons, rejected = score_domain_match(goal_sig, task_sig)
    reasons.extend(domain_reasons)
    if rejected:
        return 0, "; ".join(reasons)

    topic_score, topic_reasons = score_topic_activity(goal_sig, task_sig)
    reasons.extend(topic_reasons)

    # Precise score is decisive. Legacy only helps after no precise rejection and after enough context exists.
    precise_score = type_score + domain_score + topic_score

    # Two-of-three rule: type + domain or type + topic must be meaningful.
    meaningful_domain = domain_score >= 25
    meaningful_topic = topic_score >= 12
    if not (meaningful_domain or meaningful_topic):
        return min(39, precise_score), "; ".join(reasons + ["Rejected: only broad or weak context matched"])

    # Allow legacy to add a small amount only if precise layer did not reject.
    if legacy_score >= 80 and precise_score >= 55:
        precise_score += 8
        reasons.append("Legacy keyword system supported precise match")
    elif legacy_score >= 60 and precise_score >= 50:
        precise_score += 4
        reasons.append("Legacy keyword system lightly supported precise match")

    if "quran_memorization" in goal_sig["domains"] and "quran_memorization" in task_sig["domains"]:
        has_core_quran_activity = any(contains_phrase(task_sig["text"], term) for term in ["تسميع", "حفظ", "مراجعة محفوظ", "تثبيت", "اختبار حفظ"])
        has_support_quran_activity = any(contains_phrase(task_sig["text"], term) for term in ["تفسير", "معاني", "فوائد", "هدايات"])
        if has_support_quran_activity and not has_core_quran_activity:
            precise_score = min(precise_score, 74)
            reasons.append("Capped Quran interpretation as supportive medium link, not core memorization")

    final = max(0, min(100, precise_score))
    return final, "; ".join(reasons)


def calculate_progress_added_precise(task: Any, match_score: int, goal: Any = None) -> float:
    """Return direct percentage-like progress points for one completed linked task.

    Time remaining never creates progress by itself; it only adjusts the weight of a
    real completed task whose match_score is at least 60. The caps keep long-term
    goals from reaching 100 too quickly while ensuring real linked work is visible.
    """
    if match_score < 60:
        return 0.0

    try:
        minutes = int(get_attr(task, "estimated_minutes") or 30)
    except Exception:
        minutes = 30

    if minutes < 20:
        time_weight = 0.5
    elif minutes < 45:
        time_weight = 0.8
    elif minutes < 90:
        time_weight = 1.1
    elif minutes < 150:
        time_weight = 1.4
    else:
        time_weight = 1.7

    if match_score >= 90:
        match_multiplier = 1.25
    elif match_score >= 80:
        match_multiplier = 1.0
    elif match_score >= 70:
        match_multiplier = 0.75
    else:
        match_multiplier = 0.55

    activity_text = normalize_text(" ".join([
        get_attr(task, "practice_type"),
        get_attr(task, "title"),
        get_attr(task, "skill"),
        get_attr(task, "topic"),
        get_attr(task, "notes"),
    ]))
    if any(contains_phrase(activity_text, term) for term in STRONG_ACTIVITY_TERMS):
        activity_multiplier = 1.45
        max_add = 10.0
        base_points = 4.0
    elif any(contains_phrase(activity_text, term) for term in MEDIUM_ACTIVITY_TERMS):
        activity_multiplier = 1.0
        max_add = 6.0
        base_points = 3.0
    elif any(contains_phrase(activity_text, term) for term in LIGHT_ACTIVITY_TERMS):
        activity_multiplier = 0.65
        max_add = 3.0
        base_points = 2.0
    else:
        activity_multiplier = 0.9
        max_add = 6.0
        base_points = 2.8

    deadline_factor = 0.85
    if goal is not None:
        deadline = get_attr(goal, "deadline")
        if deadline:
            try:
                days_left = (datetime.strptime(deadline[:10], "%Y-%m-%d").date() - date.today()).days
                if days_left < 0:
                    deadline_factor = 1.40
                elif days_left <= 7:
                    deadline_factor = 1.35
                elif days_left <= 14:
                    deadline_factor = 1.25
                elif days_left <= 30:
                    deadline_factor = 1.10
                elif days_left <= 60:
                    deadline_factor = 1.00
                elif days_left <= 120:
                    deadline_factor = 0.85
                else:
                    deadline_factor = 0.70
            except Exception:
                deadline_factor = 0.85

    points = base_points * time_weight * match_multiplier * activity_multiplier * deadline_factor
    points = max(1.0, min(max_add, points))
    return round(points, 2)
