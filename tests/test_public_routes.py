import base64

import pytest


@pytest.mark.parametrize("path", ["/firebase", "/keys", "/geteid", "/code"])
def test_retired_get_paths_return_404(client, path):
    assert client.get(path).status_code == 404


def test_retired_code_post_returns_404(client):
    assert client.post("/code").status_code == 404


def test_admin_route_requires_api_key(client):
    assert client.get("/users").status_code == 401


def test_landing_renders(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "Học ít nhiễu hơn" in response.text
    assert "Learning Trajectory Architect" in response.text
    assert "Đang xây dựng MVP" in response.text
    assert "32 Hai Bà Trưng" in response.text
    assert 'href="tel:+84387578730"' in response.text
    assert "8408941671" in response.text
    assert '<html lang="en">' in response.text
    assert 'data-language="en"' in response.text
    assert 'id="architecture"' in response.text
    assert 'data-agent="reflection"' in response.text
    assert "Phase 2 · Outside the MVP" in response.text
    assert response.text.index('id="architecture"') < response.text.index(
        'id="products"'
    )


@pytest.mark.parametrize("image", ["ai-neural-network", "ai-learning-path"])
def test_local_ai_artwork_is_available(client, image):
    response = client.get(f"/static/images/{image}.webp")
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/webp"


def test_flagship_project_is_a_page_not_a_lesson_lookup(client, monkeypatch):
    def unexpected_lookup(*args):
        pytest.fail("Project reading must not query the lesson service")

    monkeypatch.setattr(
        client.app.state.lesson_service, "by_short_id", unexpected_lookup
    )
    response = client.get("/projects/learning-trajectory-architect")
    assert response.status_code == 200
    assert "MVP đang được xây dựng" in response.text
    assert "Orchestrator Agent" in response.text
    assert 'id="risks"' in response.text
    assert 'id="research-lead"' in response.text
    assert 'href="#research-lead"' in response.text
    assert (
        "Research Group Lead at Thay Binh EdTech since February 2026" in response.text
    )
    assert "is the lead implementer of Learning Trajectory Architect" in response.text
    assert (
        "experimental results have not yet been reported on this page" in response.text
    )
    assert 'href="/#pi-profile"' in response.text
    source = client.get("/static/documents/learning-trajectory-architect.md")
    assert source.status_code == 200
    assert "## 6. Rủi ro" in source.text


def test_share_short_id_renders_workspace(client):
    response = client.get("/share?id=demo&c=3&p=5")
    assert response.status_code == 200
    assert "Lesson demo" in response.text
    assert "Phonetic rail" in response.text
    assert 'data-action="start-study"' in response.text
    assert 'data-action="download-pdf"' in response.text
    assert "nhấn hai lần để in phiếu bài tập kèm đáp án" in response.text
    assert 'id="pdf-options-dialog"' in response.text
    assert 'id="shortcut-dialog"' in response.text
    assert "Sao chép Tên Lesson, Link" in response.text
    assert "Sao chép Tên Group, Tên Lesson, Link" in response.text
    assert 'id="lesson-tools"' not in response.text
    assert 'id="study-workspace"' in response.text
    assert 'class="lesson-mobile-list"' in response.text
    assert "is-screen-hidden" in response.text
    assert "is-print-hidden" in response.text
    assert 'data-print-hidden-columns="5"' in response.text


def test_worksheet_print_styles_are_available(client):
    response = client.get("/static/css/worksheet.css")
    assert response.status_code == 200
    assert "text/css" in response.headers["content-type"]
    assert "size: A4" in response.text
    assert ".answers { break-before: page; }" in response.text


def test_legacy_lesson_url_keeps_base64_column_contract(client):
    columns = base64.urlsafe_b64encode(b"1,3").decode().rstrip("=")
    response = client.get(f"/?lessonid=legacy-lesson&column={columns}&print={columns}")
    assert response.status_code == 200
    assert response.text.count("is-screen-hidden") >= 2
    assert response.text.count("is-print-hidden") >= 2
