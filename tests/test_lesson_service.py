from app.services.lessons import LessonService


def test_word_presenter_allowlists_ui_fields_and_generates_stable_key():
    row = {
        "word": "articulate",
        "type": "verb",
        "pronunciation": "/ɑː/",
        "meaning": "express",
        "translate": "diễn đạt",
        "example": "Example",
        "word_voice": "audio",
        "eg_voice": "extra",
        "trans_voice": "extra",
        "df_voice": "extra",
        "private_column": "must not be rendered",
    }
    presented = LessonService._present_word(row)
    assert "private_column" not in presented
    assert presented["word"] == "articulate"
    assert presented["row_key"] == LessonService._present_word(row)["row_key"]
