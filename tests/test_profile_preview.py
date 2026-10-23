from fastapi.testclient import TestClient

from scripts.preview_research_profile import app as preview_app


def test_public_profile_is_visible_without_preview_or_indexing_restrictions(
    monkeypatch, client
):
    def unexpected_lookup(*args):
        raise AssertionError("Public profile must not query Supabase")

    monkeypatch.setattr(
        client.app.state.lesson_service, "by_short_id", unexpected_lookup
    )
    monkeypatch.setattr(client.app.state.lesson_service, "by_id", unexpected_lookup)
    for url in (
        "/",
        "/?profile_preview=true",
        "/?preview=1",
        "/?show_research_profile=false",
    ):
        response = client.get(url)
        assert response.status_code == 200
        assert 'id="pi-profile"' in response.text
        assert 'href="#pi-profile"' in response.text
        assert "research-profile.css" in response.text
        assert "X-Robots-Tag" not in response.headers
        assert "noindex" not in response.text
        assert 'rel="canonical" href="https://thaybinh.vn/"' in response.text
        assert 'id="profile-review"' not in response.text
        assert "Draft for content review." not in response.text
        assert "Bản nháp để duyệt nội dung." not in response.text
        assert "Claude Team for Scientists" not in response.text
        assert "Individual project roles have not been confirmed" not in response.text
        assert 'alt="Portrait of Đặng Ngọc Quyên"' in response.text
        assert 'data-alt-vi="Ảnh chân dung Đặng Ngọc Quyên"' in response.text
        assert "Master’s degree in Information Technology" in response.text
        assert 'datetime="2026-02"' in response.text
        assert "Graduated in 2017" in response.text
        assert 'href="https://fce.uit.edu.vn/"' in response.text
        assert "Current organization" in response.text
        assert "Self-published on the same Thay Binh EdTech website" in response.text
        assert (
            "experimental data or learning-outcome evaluation results" in response.text
        )
        assert 'id="profile-research-title"' in response.text
        assert 'id="profile-outputs-title"' in response.text


def test_public_profile_does_not_appear_on_lessons_or_project_page(client):
    for url in (
        "/?lessonid=legacy-lesson",
        "/share?id=demo",
        "/demo",
        "/projects/learning-trajectory-architect",
    ):
        response = client.get(url)
        assert response.status_code == 200
        assert 'id="pi-profile"' not in response.text
        assert "research-profile.css" not in response.text


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
        assert "The profile owner has confirmed" in response.text
        assert "No evidence of a current university" in response.text
        assert 'alt="Portrait of Đặng Ngọc Quyên"' in response.text
        portrait = preview.get("/static/images/dang-ngoc-quyen-portrait.webp")
        assert portrait.status_code == 200
        assert portrait.headers["content-type"] == "image/webp"
        assert 'href="#"' not in response.text
        assert preview.get("/static/css/research-profile.css").status_code == 200
        assert preview.get("/projects/learning-trajectory-architect").status_code == 200
