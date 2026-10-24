"""Сквозные сценарии через API — по одной демо-персоне на каждый исход.

Конвейер выполняется синхронно (run_pipeline), внешние источники — моки в том же процессе.
"""

from fastapi.testclient import TestClient


def login(api: TestClient, user: str) -> dict[str, str]:
    response = api.post("/api/auth/login", json={"login": user, "password": "demo"})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def submit_application(api: TestClient, headers: dict, **fields) -> int:
    payload = {"product_code": "working-capital", "purpose": "Пополнение оборотных средств", **fields}
    created = api.post("/api/applications", json=payload, headers=headers)
    assert created.status_code == 201, created.text
    app_id = created.json()["id"]
    submitted = api.post(f"/api/applications/{app_id}/submit", headers=headers)
    assert submitted.json()["status"] == "SUBMITTED"
    return app_id


def get(api: TestClient, headers: dict, app_id: int) -> dict:
    return api.get(f"/api/applications/{app_id}", headers=headers).json()


def test_auto_approval_then_signing_and_issue(api, run_pipeline):
    headers = login(api, "bakery")
    app_id = submit_application(api, headers, amount=2_000_000, term_months=24)
    run_pipeline()

    app = get(api, headers, app_id)
    assert app["status"] == "APPROVED"
    assert app["available_actions"] == ["ACCEPT_OFFER", "DECLINE_OFFER"]
    [offer] = app["offers"]

    app = api.post(f"/api/applications/{app_id}/offers/{offer['id']}/accept", headers=headers).json()
    assert app["status"] == "SIGNING" and app["sign_code"]

    wrong = api.post(f"/api/applications/{app_id}/sign", json={"code": "0000"}, headers=headers)
    assert wrong.status_code == 422

    app = api.post(f"/api/applications/{app_id}/sign", json={"code": app["sign_code"]}, headers=headers).json()
    assert app["status"] == "ISSUED"
    statuses = [e["to_status"] for e in app["events"] if e["to_status"]]
    assert statuses == ["SUBMITTED", "VALIDATION", "ENRICHMENT", "SCORING", "DECISION", "APPROVED", "SIGNING", "ISSUED"]


def test_seasonal_business_gets_counter_offer(api, run_pipeline):
    headers = login(api, "sokolova")
    app_id = submit_application(api, headers, amount=2_500_000, term_months=12)
    run_pipeline()

    app = get(api, headers, app_id)
    assert app["status"] == "COUNTER_OFFER"
    assert len(app["offers"]) == 2
    assert app["decision"]["reasons"]


def test_revenue_mismatch_requests_info_and_correction_leads_to_approval(api, run_pipeline):
    headers = login(api, "stroy")
    app_id = submit_application(api, headers, amount=4_000_000, term_months=24, declared_revenue_12m=50_000_000)
    run_pipeline()

    app = get(api, headers, app_id)
    assert app["status"] == "NEEDS_INFO"
    assert app["info_request"]["items"][0]["code"] == "REVENUE_CONFIRM"

    answer = {"comment": "Ошибся в анкете, верная выручка — 36 млн ₽", "declared_revenue_12m": 36_000_000}
    api.post(f"/api/applications/{app_id}/info-response", json=answer, headers=headers)
    run_pipeline()
    assert get(api, headers, app_id)["status"] == "APPROVED"


def test_confirmed_mismatch_goes_to_underwriter(api, run_pipeline):
    headers = login(api, "stroy")
    app_id = submit_application(api, headers, amount=4_000_000, term_months=24, declared_revenue_12m=50_000_000)
    run_pipeline()

    answer = {"comment": "Часть выручки проходит через счёт в другом банке"}
    api.post(f"/api/applications/{app_id}/info-response", json=answer, headers=headers)
    run_pipeline()
    assert get(api, headers, app_id)["status"] == "MANUAL_REVIEW"


def test_overdue_is_a_stop_factor(api, run_pipeline):
    headers = login(api, "petrov")
    app_id = submit_application(api, headers, amount=500_000, term_months=12)
    run_pipeline()

    app = get(api, headers, app_id)
    assert app["status"] == "REJECTED"
    assert app["available_actions"] == []


def test_manual_review_and_underwriter_decision(api, run_pipeline):
    client = login(api, "vector")
    app_id = submit_application(
        api,
        client,
        product_code="secured-loan",
        amount=8_000_000,
        term_months=36,
        collateral_description="Склад 1 200 м², г. Подольск",
        collateral_value=12_000_000,
    )
    run_pipeline()
    assert get(api, client, app_id)["status"] == "MANUAL_REVIEW"

    bank = login(api, "underwriter")
    queue = api.get("/api/bank/applications", params={"status": "MANUAL_REVIEW"}, headers=bank).json()
    assert app_id in [a["id"] for a in queue]

    card = api.get(f"/api/bank/applications/{app_id}", headers=bank).json()
    assert card["score"]["grade"] in "ABC"
    assert card["decisions"][-1]["recommendation"]["outcome"] == "APPROVED"
    assert card["available_actions"] == ["DECIDE"]

    decision = {"outcome": "COUNTER_OFFER", "amount": 6_000_000, "term_months": 36, "comment": "Массовый адрес — снижаем сумму"}
    card = api.post(f"/api/bank/applications/{app_id}/decision", json=decision, headers=bank).json()
    assert card["status"] == "COUNTER_OFFER"

    app = get(api, client, app_id)
    assert app["offers"][0]["amount"] == 6_000_000
    # Клиент видит понятные причины, но не баллы и не внутренние комментарии
    assert "Массовый адрес" not in str(app)


def test_new_client_without_revenue_then_bureau_unavailable(api, run_pipeline):
    headers = login(api, "techno")
    app_id = submit_application(api, headers, amount=1_500_000, term_months=24)
    run_pipeline()

    app = get(api, headers, app_id)
    assert app["status"] == "NEEDS_INFO"
    assert app["info_request"]["items"][0]["code"] == "REVENUE"

    answer = {"comment": "Выручка за год", "declared_revenue_12m": 18_000_000}
    api.post(f"/api/applications/{app_id}/info-response", json=answer, headers=headers)
    run_pipeline()
    assert get(api, headers, app_id)["status"] == "MANUAL_REVIEW"

    card = api.get(f"/api/bank/applications/{app_id}", headers=login(api, "underwriter")).json()
    bki = next(c for c in card["external_checks"] if c["source"] == "BKI")
    assert bki["status"] == "ERROR" and bki["attempts"] == 3


def test_client_cannot_see_other_company_application(api, run_pipeline):
    owner = login(api, "bakery")
    app_id = submit_application(api, owner, amount=1_000_000, term_months=12)
    stranger = login(api, "sokolova")
    assert api.get(f"/api/applications/{app_id}", headers=stranger).status_code == 404


def test_action_not_allowed_in_current_status_returns_409(api):
    headers = login(api, "bakery")
    created = api.post(
        "/api/applications",
        json={"product_code": "working-capital", "amount": 1_000_000, "term_months": 12, "purpose": "Закупка"},
        headers=headers,
    ).json()
    response = api.post(f"/api/applications/{created['id']}/sign", json={"code": "1234"}, headers=headers)
    assert response.status_code == 409


def test_roles_are_enforced(api):
    client = login(api, "bakery")
    assert api.get("/api/bank/applications", headers=client).status_code == 403
    assert api.get("/api/applications").status_code == 401


def test_amount_outside_product_limits_is_rejected(api):
    headers = login(api, "bakery")
    payload = {"product_code": "working-capital", "amount": 50_000_000, "term_months": 12, "purpose": "Закупка"}
    assert api.post("/api/applications", json=payload, headers=headers).status_code == 422
