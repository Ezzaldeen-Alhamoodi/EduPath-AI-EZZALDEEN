
import json
from functools import lru_cache
from pathlib import Path
from flask import session, request

SUPPORTED_LOCALES = ("en", "ar")
DEFAULT_LOCALE = "en"

BASE_DIR = Path(__file__).resolve().parent
TRANSLATION_DIR = BASE_DIR / "translations_json"

@lru_cache(maxsize=8)
def load_catalog(locale):
    locale = locale if locale in SUPPORTED_LOCALES else DEFAULT_LOCALE
    path = TRANSLATION_DIR / f"{locale}.json"
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))

def get_locale():
    selected = session.get("language")
    if selected in SUPPORTED_LOCALES:
        return selected
    best = request.accept_languages.best_match(SUPPORTED_LOCALES)
    return best or DEFAULT_LOCALE

def gettext(key, default=None):
    catalog = load_catalog(get_locale())
    return catalog.get(key, default if default is not None else key)

def text_dir():
    return "rtl" if get_locale() == "ar" else "ltr"

def label(value, fallback=None):
    if value is None:
        return fallback or ""
    value = str(value)
    key = f"label.{value}"
    return gettext(key, fallback or value)

def resource_name(resource):
    if get_locale() == "ar":
        return getattr(resource, "name_ar", None) or label(getattr(resource, "name", ""), getattr(resource, "name", ""))
    return getattr(resource, "name", "")

def resource_description(resource):
    if get_locale() == "ar":
        return getattr(resource, "description_ar", None) or getattr(resource, "description", "")
    return getattr(resource, "description", "")
