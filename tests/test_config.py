import pytest

from api import config


def test_development_cors_defaults_to_local_browser_origins(monkeypatch):
    monkeypatch.delenv("CORS_ORIGINS", raising=False)
    monkeypatch.setattr(config, "APP_ENV", "development")
    assert config._cors_origins() == [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]


def test_production_cors_requires_explicit_non_local_origins(monkeypatch):
    monkeypatch.delenv("CORS_ORIGINS", raising=False)
    monkeypatch.setattr(config, "APP_ENV", "production")
    with pytest.raises(RuntimeError, match="must be set explicitly"):
        config._cors_origins()

    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:3000")
    with pytest.raises(RuntimeError, match="Localhost"):
        config._cors_origins()


def test_production_cors_accepts_deployed_frontend_origin(monkeypatch):
    monkeypatch.setattr(config, "APP_ENV", "production")
    monkeypatch.setenv("CORS_ORIGINS", "https://app.example.se/")
    assert config._cors_origins() == ["https://app.example.se"]
