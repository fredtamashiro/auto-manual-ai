import json
from pathlib import Path
from typing import Any

THEMES_FILE = Path("app/storage/themes/themes.json")


def load_themes() -> list[dict[str, Any]]:
    if not THEMES_FILE.exists():
        return []

    with THEMES_FILE.open("r", encoding="utf-8") as file:
        return json.load(file)


def list_themes() -> list[dict[str, Any]]:
    return load_themes()


def find_theme_by_id(theme_id: str) -> dict[str, Any] | None:
    themes = load_themes()

    for theme in themes:
        if theme.get("theme_id") == theme_id:
            return theme

    return None


def get_theme_or_default(theme_id: str | None) -> dict[str, Any]:
    if theme_id:
        theme = find_theme_by_id(theme_id)

        if theme:
            return theme

    default_theme = find_theme_by_id("generic_pdf")

    if default_theme:
        return default_theme

    return {
        "theme_id": "generic_pdf",
        "name": "PDF genérico",
        "description": "Tema padrão.",
        "enrichment_rules": [],
        "query_rules": [],
        "answer_rules": [],
    }


def format_theme_rules(theme: dict[str, Any], rule_key: str) -> str:
    rules = theme.get(rule_key, [])

    if not rules:
        return "Nenhuma regra específica de tema foi configurada."

    return "\n".join(f"- {rule}" for rule in rules)
