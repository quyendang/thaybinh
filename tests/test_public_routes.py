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


def test_share_short_id_renders_workspace(client):
    response = client.get("/share?id=demo&c=3&p=5")
    assert response.status_code == 200
    assert "Lesson demo" in response.text
    assert "Phonetic rail" in response.text
    assert "is-screen-hidden" in response.text
    assert "is-print-hidden" in response.text


def test_legacy_lesson_url_keeps_base64_column_contract(client):
    columns = base64.urlsafe_b64encode(b"1,3").decode().rstrip("=")
    response = client.get(f"/?lessonid=legacy-lesson&column={columns}&print={columns}")
    assert response.status_code == 200
    assert response.text.count("is-screen-hidden") >= 2
    assert response.text.count("is-print-hidden") >= 2
