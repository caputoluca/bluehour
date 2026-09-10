"""FE exam scorecard: reads the drill log and prints pass rates per topic."""

from __future__ import annotations

import json
import re
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from typing import Iterator

PASS_LINE = 70.0
LOG_PATTERN = re.compile(r"^(?P<day>\d{4}-\d{2}-\d{2})\s+(?P<topic>[\w-]+)\s+(?P<score>\d+)/(?P<total>\d+)$")


@dataclass(frozen=True)
class Attempt:
    day: date
    topic: str
    correct: int
    total: int

    @property
    def rate(self) -> float:
        """Calculate the percentage of correct answers."""
        return 100.0 * self.correct / self.total if self.total else 0.0

    def __str__(self) -> str:
        return f"{self.day:%b %d} {self.topic:<24} {self.rate:5.1f}%"


@dataclass
class Scorecard:
    attempts: list[Attempt] = field(default_factory=list)

    @classmethod
    def load(cls, path: Path) -> "Scorecard":
        card = cls()
        with path.open(encoding="utf-8") as fh:
            for line in fh:
                if (m := LOG_PATTERN.match(line.strip())) is None:
                    continue  # blank or comment
                card.attempts.append(
                    Attempt(
                        day=date.fromisoformat(m["day"]),
                        topic=m["topic"],
                        correct=int(m["score"]),
                        total=int(m["total"]),
                    )
                )
        return card

    def by_topic(self) -> dict[str, float]:
        buckets: dict[str, list[Attempt]] = defaultdict(list)
        for a in self.attempts:
            buckets[a.topic].append(a)
        return {t: sum(x.correct for x in xs) / max(1, sum(x.total for x in xs)) * 100 for t, xs in buckets.items()}

    def weak(self, floor: float = PASS_LINE) -> Iterator[str]:
        yield from (topic for topic, rate in sorted(self.by_topic().items()) if rate < floor)


def main(argv: list[str] | None = None) -> int:
    path = Path(argv[0]) if argv else Path("drill/log.txt")
    try:
        card = Scorecard.load(path)
    except FileNotFoundError as exc:
        print(f"no log at {path}: {exc}")
        return 1
    print(json.dumps(card.by_topic(), indent=2, sort_keys=True))
    weak = list(card.weak())
    print("weak:", ", ".join(weak) or "none", "| attempts:", len(card.attempts), "| line:", PASS_LINE)
    return 0 if not weak else 2


if __name__ == "__main__":
    raise SystemExit(main())
