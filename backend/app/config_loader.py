from __future__ import annotations

import json
from pathlib import Path
from typing import Any


REQUIRED_CONFIG_FILES = (
    "industry-categories.json",
    "domain-categories.json",
    "position-categories.json",
    "competency-dictionary.json",
    "skill-dictionary.json",
    "synonym-map.json",
)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CONFIG_DIR = PROJECT_ROOT / "config"


class ConfigLoadError(RuntimeError):
    """Raised when required JSON config data cannot be loaded."""


def load_config_file(filename: str, config_dir: Path | str = DEFAULT_CONFIG_DIR) -> Any:
    config_path = Path(config_dir) / filename

    try:
        with config_path.open("r", encoding="utf-8") as config_file:
            return json.load(config_file)
    except FileNotFoundError as exc:
        raise ConfigLoadError(f"Required config file not found: {config_path}") from exc
    except json.JSONDecodeError as exc:
        raise ConfigLoadError(f"Invalid JSON in config file: {config_path}") from exc


def load_all_configs(config_dir: Path | str = DEFAULT_CONFIG_DIR) -> dict[str, Any]:
    return {
        filename: load_config_file(filename, config_dir)
        for filename in REQUIRED_CONFIG_FILES
    }
