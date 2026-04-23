from __future__ import annotations

import sys
from pathlib import Path

if __package__ in (None, ""):
    project_root = Path(__file__).resolve().parents[1]
    sys.path.append(str(project_root))

from backend.app.database import initialize_database


def main() -> None:
    db_path = initialize_database()
    print(f"SQLite database initialized at: {db_path}")


if __name__ == "__main__":
    main()