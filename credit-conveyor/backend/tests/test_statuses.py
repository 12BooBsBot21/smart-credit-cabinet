import pytest

from app.domain.statuses import (
    IN_PROGRESS,
    Action,
    Actor,
    Status,
    TransitionError,
    available_actions,
    can_transition,
    ensure_transition,
    to_mermaid,
)


def test_client_submits_draft():
    assert can_transition(Status.DRAFT, Status.SUBMITTED, Actor.CLIENT)


def test_system_cannot_act_for_client():
    assert not can_transition(Status.DRAFT, Status.SUBMITTED, Actor.SYSTEM)


def test_underwriter_decides_only_in_manual_review():
    assert can_transition(Status.MANUAL_REVIEW, Status.APPROVED, Actor.UNDERWRITER)
    assert not can_transition(Status.SCORING, Status.APPROVED, Actor.UNDERWRITER)


def test_final_statuses_have_no_exits():
    final = {Status.ISSUED, Status.REJECTED, Status.WITHDRAWN, Status.OFFER_DECLINED}
    for status in final:
        for target in Status:
            for actor in Actor:
                assert not can_transition(status, target, actor)


def test_every_in_progress_status_can_fall_back_to_manual_review():
    for status in IN_PROGRESS:
        assert can_transition(status, Status.MANUAL_REVIEW, Actor.SYSTEM)


def test_ensure_transition_raises_conflict():
    with pytest.raises(TransitionError):
        ensure_transition(Status.ISSUED, Status.DRAFT, Actor.CLIENT)


def test_available_actions_by_role():
    assert available_actions(Status.COUNTER_OFFER, Actor.CLIENT) == [Action.ACCEPT_OFFER, Action.DECLINE_OFFER]
    assert available_actions(Status.MANUAL_REVIEW, Actor.CLIENT) == []
    assert available_actions(Status.MANUAL_REVIEW, Actor.UNDERWRITER) == [Action.DECIDE]


def test_mermaid_is_generated_from_transitions():
    diagram = to_mermaid()
    assert diagram.startswith("stateDiagram-v2")
    assert "MANUAL_REVIEW --> COUNTER_OFFER : андеррайтер" in diagram
