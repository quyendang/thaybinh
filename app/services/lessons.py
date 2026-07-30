from dataclasses import dataclass
from hashlib import sha256
from typing import Any

from supabase import Client

WORD_FIELDS = (
    "word, type, pronunciation, meaning, translate, example, "
    "word_voice, eg_voice, trans_voice, df_voice"
)


class LessonNotFoundError(Exception):
    """Raised when a requested public lesson is not available."""


@dataclass(frozen=True)
class LessonPayload:
    lesson_id: str
    lesson_name: str
    group_name: str | None
    words: list[dict[str, Any]]


class LessonService:
    def __init__(self, client: Client):
        self.client = client

    def by_id(self, lesson_id: str) -> LessonPayload:
        lesson_response = (
            self.client.table("lessons")
            .select("id, name")
            .eq("id", lesson_id)
            .single()
            .execute()
        )
        lesson = lesson_response.data
        if not lesson:
            raise LessonNotFoundError("Lesson does not exist")

        return LessonPayload(
            lesson_id=lesson_id,
            lesson_name=lesson.get("name") or "Bài học",
            group_name=None,
            words=self._words_for_lesson(lesson["id"]),
        )

    def by_short_id(self, short_id: str) -> LessonPayload:
        lesson_response = (
            self.client.table("lessons")
            .select(
                """
                id,
                name,
                group:groups!lessons_group_id_fkey (
                    name
                )
                """
            )
            .eq("short_id", short_id)
            .single()
            .execute()
        )
        lesson = lesson_response.data
        if not lesson:
            raise LessonNotFoundError("Lesson does not exist")

        group_name = (lesson.get("group") or {}).get("name")
        lesson_name = lesson.get("name") or f"Lesson {short_id}"
        return LessonPayload(
            lesson_id=short_id,
            lesson_name=lesson_name,
            group_name=group_name,
            words=self._words_for_lesson(lesson["id"]),
        )

    def _words_for_lesson(self, lesson_id: str) -> list[dict[str, Any]]:
        response = (
            self.client.table("words")
            .select(WORD_FIELDS)
            .eq("lesson_id", lesson_id)
            .order("latest_update", desc=False)
            .execute()
        )
        return [self._present_word(row) for row in response.data or []]

    @staticmethod
    def _present_word(row: dict[str, Any]) -> dict[str, Any]:
        word = {
            field.strip(): row.get(field.strip())
            for field in WORD_FIELDS.split(",")
        }
        fingerprint = "\u241f".join(str(word.get(field) or "") for field in word)
        word["row_key"] = sha256(fingerprint.encode("utf-8")).hexdigest()[:24]
        return word
