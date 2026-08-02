"""Regenerate `real-mission-payloads.json` from the REAL backend contracts.

This file exists because the mission DTO was once written by hand against an
invented shape, and the frontend shipped a mapper that could not read a single
real response. Hand-written fixtures agreed with the hand-written DTO, so the
tests passed and Home was still broken.

Nothing here describes the API. Every payload is produced by importing the
backend's own pydantic response models and its reviewed catalog, then dumping
them exactly as FastAPI serializes a `response_model` (`model_dump(mode="json")`).
If the backend contract changes, re-running this file changes the fixture and the
frontend tests fail — which is the entire point.

Run from the backend checkout so `app` is importable:

    cd ../ufc-picks-backend
    ./.venv/Scripts/python.exe \
        ../ufc-picks-frontend/tests/fixtures/generate-real-mission-payloads.py
"""

from __future__ import annotations

import json
from pathlib import Path

from pydantic import ValidationError

from app.modules.missions.application.read_models import MissionReadService
from app.modules.missions.catalog import load_card_catalog
from app.modules.missions.contracts import (
    HomeMissionsResponse,
    MissionCapabilitiesResponse,
    MissionOfferView,
    MissionSlotView,
    MonthlyMissionView,
    ProfileMissionsResponse,
    SelectMissionRequest,
)
from app.modules.missions.application.read_models import _milestone_label
from app.modules.missions.domain.offers import _opaque_id

OUTPUT = Path(__file__).with_name("real-mission-payloads.json")

SECRET = b"mission-offer-secret-for-fixture-generation-only"
EVENT_ID = 999
USER_ID = "fixture-user"

#: Real catalog rows, chosen so every interaction AND every selection_spec
#: variant a picker has to open is represented by reviewed content.
COVERAGE = {
    1: [
        "CARD-V2-E-004",  # AUTO, selection_spec is null
        "CARD-V2-E-001",  # TARGET_FIGHTER, WINNER only
        "CARD-V2-H-003",  # TARGET_FIGHTER, WINNER+METHOD+ROUND
    ],
    2: [
        "CARD-V2-M-001",  # TARGET_FIGHT, FINISH
        "CARD-V2-H-007",  # COMBO_BUILDER, 3 fighter legs with FIXED methods
        "CARD-V2-M-013",  # COMBO_BUILDER, 2 fighter legs with SELECTABLE methods
    ],
    3: [
        "CARD-V2-M-012",  # COMBO_BUILDER, 2 FIGHT legs (no corner, no method)
        "CARD-V2-E-012",  # CARD_PROP, ACCEPT
        "CARD-V3-E-008",  # CARD_PROP, CHOICE
        "CARD-V2-H-019",  # CARD_PROP, EXACT_COUNT
    ],
}


def build() -> dict:
    catalog = load_card_catalog()
    # `selected_view` only reads `self.catalog`, so no database is touched.
    reader = MissionReadService.__new__(MissionReadService)
    reader.catalog = catalog

    context = (USER_ID, EVENT_ID, 1, catalog.version)
    offer_set_id = _opaque_id("offer_set", SECRET, *context)

    def offer_view(mission_id: str, slot: int, index: int) -> MissionOfferView:
        definition = catalog.get(mission_id)
        # Mint the id with the backend's own helper so the fixture carries the
        # real `offer_<hex>` format the select command validates against.
        return MissionOfferView(
            offer_id=_opaque_id("offer", SECRET, *context, slot, index, mission_id),
            mission_id=definition.mission_id,
            name=definition.ui.name,
            description=definition.ui.description,
            difficulty=definition.difficulty.value,
            xp=definition.xp,
            interaction=definition.interaction.value,
            pick_effect=definition.pick_effect.value,
            selection_prompt=definition.ui.selection_prompt,
            selection_spec=(
                definition.selection.model_dump(mode="json")
                if definition.selection is not None
                else None
            ),
        )

    open_slots = tuple(
        MissionSlotView(
            slot=slot,
            selected=None,
            options=tuple(
                offer_view(mission_id, slot, index)
                for index, mission_id in enumerate(mission_ids)
            ),
        )
        for slot, mission_ids in COVERAGE.items()
    )

    monthly = MonthlyMissionView(
        month_key="2026-08",
        mission_id="MONTH-V2-001",
        name="WIN TARGET",
        description="Hit the monthly winner target.",
        xp=15,
        status="ACTIVE",
        progress_text="3 / 4 winners",
        progress_percent=75,
    )

    home_open = HomeMissionsResponse(
        event_id=EVENT_ID,
        card_state="OPEN",
        offer_set_id=offer_set_id,
        card_revision=1,
        monthly=monthly,
        slots=open_slots,
        locked=False,
        lock_reason=None,
    )

    # A locked card, using the lock reasons `MissionReadService._lock` actually
    # emits (ADMIN_CLOSED / RESULTS_STARTED / PICKS_CLOSED), not invented ones.
    home_locked = home_open.model_copy(
        update={"card_state": "CLOSED", "locked": True, "lock_reason": "PICKS_CLOSED"}
    )
    home_results_started = home_open.model_copy(
        update={"locked": True, "lock_reason": "RESULTS_STARTED"}
    )
    home_card_not_found = HomeMissionsResponse(
        event_id=EVENT_ID,
        card_state="VOID",
        locked=True,
        lock_reason="CARD_NOT_FOUND",
    )

    def assignment(mission_id: str, slot: int, status: str, **extra) -> dict:
        return {
            "_id": f"assignment_{mission_id.lower().replace('-', '_')}",
            "event_id": EVENT_ID,
            "slot": slot,
            "mission_id": mission_id,
            "status": status,
            "progress": {
                "progress": extra.pop("progress", {"text": "2 / 3 winners", "percent": 67}),
                "observation": extra.pop("observation", {}),
            },
            "selection": extra.pop("selection", {}),
            **extra,
        }

    settled_slots = (
        MissionSlotView(
            slot=1,
            selected=reader.selected_view(
                assignment(
                    "CARD-V2-E-004",
                    1,
                    "COMPLETED",
                    progress={"text": "3 / 3 winners", "percent": 100},
                )
            ),
            options=(),
        ),
        MissionSlotView(
            slot=2,
            selected=reader.selected_view(
                assignment(
                    "CARD-V2-H-003",
                    2,
                    "FAILED",
                    progress={"text": "0 / 1 exact script", "percent": 0},
                    selection={
                        "legs": [
                            {
                                "key": "winner",
                                "fighter_name": "Uros Medic",
                                "method": "KO_TKO",
                                "round": 2,
                            }
                        ]
                    },
                )
            ),
            options=(),
        ),
        MissionSlotView(
            slot=3,
            selected=reader.selected_view(
                assignment(
                    "CARD-V2-M-001",
                    3,
                    "VOID",
                    progress={"text": "Bout cancelled", "percent": 0},
                    observation={"void_reason": "Bout cancelled - no XP charged."},
                )
            ),
            options=(),
        ),
    )

    home_settled = home_open.model_copy(
        update={
            "card_state": "CLOSED",
            "slots": settled_slots,
            "locked": True,
            "lock_reason": "ADMIN_CLOSED",
            "monthly": monthly.model_copy(
                update={"status": "COMPLETED", "progress_percent": 100}
            ),
        }
    )

    home_no_offers = home_open.model_copy(
        update={
            "monthly": None,
            "slots": tuple(
                MissionSlotView(slot=slot, selected=None, options=())
                for slot in (1, 2, 3)
            ),
        }
    )

    home_month_closed = home_open.model_copy(
        update={
            "monthly": monthly.model_copy(
                update={"status": "FAILED", "progress_text": "2 / 4 winners"}
            )
        }
    )

    profile = ProfileMissionsResponse(
        lifetime_xp=42,
        level=5,
        title="PROSPECT",
        xp_into_level=2,
        xp_for_next_level=13,
        level_progress_pct=15,
        next_title="RANKED",
        next_title_level=10,
        current_streak=3,
        best_streak=7,
        next_streak_milestone_label=_milestone_label(3),
        streak_just_broke=False,
        active=(
            reader.selected_view(
                assignment(
                    "CARD-V2-E-001",
                    1,
                    "ACTIVE",
                    progress={"text": "1 / 1 winner", "percent": 50},
                )
            ),
        ),
        history=(
            reader.selected_view(
                assignment(
                    "CARD-V2-E-004",
                    1,
                    "COMPLETED",
                    progress={"text": "3 / 3 winners", "percent": 100},
                )
            ),
        ),
        streak_history=(
            {
                "event_id": EVENT_ID,
                "event_label": "UFC 999: Fixture Night",
                "outcome": "ADVANCED",
                "picked": 9,
                "denominator": 12,
                "coverage_percent": 75,
                "streak_after": 3,
                "milestone": 3,
                "xp_earned": 3,
            },
        ),
        celebrations=(
            {
                "id": "celebration_1",
                "kind": "MISSION_COMPLETED",
                "presentation": "TOAST",
                "heading": "Mission complete",
                "message": "PERFECT MAIN CARD - +3 XP",
                "metadata": {"name": "PERFECT MAIN CARD", "xp": 3},
            },
            {
                "id": "celebration_2",
                "kind": "STREAK_MILESTONE",
                "presentation": "FULL_SCREEN",
                "heading": "3 card streak",
                "message": "Streak milestone reached - +2 XP",
                "metadata": {"event_id": EVENT_ID, "streak": 3, "bonus_xp": 2},
            },
        ),
    )

    selected_201 = reader.selected_view(
        assignment(
            "CARD-V2-E-004",
            1,
            "ACTIVE",
            progress={"text": "Awaiting first result", "percent": 0},
        )
    )

    # A REAL FastAPI 422. Generated by validating the payload the broken
    # frontend used to send, so the regression cannot come back unnoticed.
    broken_legacy_body = {
        "event_id": EVENT_ID,
        "slot_index": 0,
        "mission_id": "CARD-V2-E-004",
        "selection": None,
    }
    try:
        SelectMissionRequest.model_validate(broken_legacy_body)
        raise SystemExit("expected the legacy body to be rejected")
    except ValidationError as error:
        validation_422 = {"detail": json.loads(error.json())}

    return {
        "_generated_by": "tests/fixtures/generate-real-mission-payloads.py",
        "_source": "ufc-picks-backend app.modules.missions.contracts",
        "catalog_version": catalog.version,
        "capabilities": MissionCapabilitiesResponse().model_dump(mode="json"),
        "home": {
            "open": home_open.model_dump(mode="json"),
            "locked": home_locked.model_dump(mode="json"),
            "results-started": home_results_started.model_dump(mode="json"),
            "card-not-found": home_card_not_found.model_dump(mode="json"),
            "settled": home_settled.model_dump(mode="json"),
            "no-offers": home_no_offers.model_dump(mode="json"),
            "month-closed": home_month_closed.model_dump(mode="json"),
        },
        "profile": profile.model_dump(mode="json"),
        "select_201": selected_201.model_dump(mode="json"),
        "errors": {
            # Exactly the envelopes app/modules/missions/router.py raises.
            "slot_locked_409": {
                "detail": {"code": "SLOT_LOCKED", "message": "Card missions are locked"}
            },
            "offer_not_found_409": {
                "detail": {
                    "code": "OFFER_NOT_FOUND",
                    "message": "That offer is not available in this slot",
                }
            },
            "already_selected_409": {
                "detail": {
                    "code": "ALREADY_SELECTED",
                    "message": "This mission slot already has an irreversible selection",
                }
            },
            "idempotency_conflict_409": {
                "detail": {
                    "code": "IDEMPOTENCY_CONFLICT",
                    "message": "Idempotency key was already used with another request",
                }
            },
            "invalid_selection_409": {
                "detail": {
                    "code": "INVALID_SELECTION",
                    "message": "Selected method is not allowed by this mission",
                }
            },
            "card_not_found_404": {
                "detail": {
                    "code": "CARD_NOT_FOUND",
                    "message": "Event has no mission offers",
                }
            },
            "unauthenticated_401": {"detail": "Not authenticated"},
            "legacy_frontend_body_422": validation_422,
        },
    }


if __name__ == "__main__":
    OUTPUT.write_text(json.dumps(build(), indent=2, sort_keys=False), encoding="utf-8")
    print(f"wrote {OUTPUT}")
