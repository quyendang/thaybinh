import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

os.environ["SUPABASE_URL"] = "https://example.supabase.co"
os.environ["SUPABASE_KEY"] = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4YW1wbGUiLCJyb2xlIjoiYW5vbiJ9."
    "test-signature"
)
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4YW1wbGUiLCJyb2xlIjoic2VydmljZV9yb2xlIn0."
    "test-signature"
)
os.environ["ADMIN_API_KEY"] = "test-admin-key"

from app.services.lessons import LessonPayload
from main import app


class StubLessonService:
    def _payload(self, lesson_id: str) -> LessonPayload:
        return LessonPayload(
            lesson_id=lesson_id,
            lesson_name="Lesson demo",
            group_name="Nhóm demo",
            words=[
                {
                    "row_key": "demo-word",
                    "word": "articulate",
                    "type": "verb",
                    "pronunciation": "/ɑːˈtɪkjələt/",
                    "meaning": "express clearly",
                    "translate": "diễn đạt rõ ràng",
                    "example": "She articulates ideas clearly.",
                    "word_voice": "",
                    "eg_voice": "",
                    "trans_voice": "",
                    "df_voice": "",
                }
            ],
        )

    def by_id(self, lesson_id: str) -> LessonPayload:
        return self._payload(lesson_id)

    def by_short_id(self, short_id: str) -> LessonPayload:
        return self._payload(short_id)


@pytest.fixture(autouse=True)
def replace_lesson_service():
    original = app.state.lesson_service
    app.state.lesson_service = StubLessonService()
    yield
    app.state.lesson_service = original


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client
