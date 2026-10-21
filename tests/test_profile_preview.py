from fastapi.testclient import TestClient

from scripts.preview_research_profile import app as preview_app


def test_profile_draft_cannot_be_enabled_on_public_homepage(client):
    for url in ("/", "/?profile_preview=true", "/?preview=1"):
        response = client.get(url)
        assert response.status_code == 200
        assert 'id="pi-profile"' not in response.text
        assert "research-profile.css" not in response.text
        assert "noindex" not in response.text


def test_local_review_is_bilingual_and_not_indexable(monkeypatch, client):
    def unexpected_lookup(*args):
        raise AssertionError("Profile preview must not query Supabase")

    monkeypatch.setattr(
        client.app.state.lesson_service, "by_short_id", unexpected_lookup
    )
    monkeypatch.setattr(client.app.state.lesson_service, "by_id", unexpected_lookup)
    with TestClient(preview_app) as preview:
        response = preview.get("/")
        assert response.status_code == 200
        assert response.headers["x-robots-tag"] == "noindex, nofollow, noarchive"
        assert response.headers["cache-control"] == "no-store"
        assert 'name="robots" content="noindex, nofollow, noarchive"' in response.text
        assert 'id="pi-profile"' in response.text
        assert "Draft for content review." in response.text
        assert "Bản nháp để duyệt nội dung." in response.text
        assert "eligibility is not established" in response.text
        assert "Individual project roles have not been confirmed" in response.text
        assert 'alt="Portrait of Đặng Ngọc Quyên"' in response.text
        portrait = preview.get("/static/images/dang-ngoc-quyen-portrait.webp")
        assert portrait.status_code == 200
        assert portrait.headers["content-type"] == "image/webp"
        assert 'href="#"' not in response.text
        assert preview.get("/static/css/research-profile.css").status_code == 200
        assert preview.get("/projects/learning-trajectory-architect").status_code == 200
