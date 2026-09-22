from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from ..schemas import DeleteResponse, SavedSegment, SavedSegmentsResponse

from ..services.saved_segment_service import (
    DEFAULT_USER_ID,
    create_saved_segment,
    delete_saved_segment,
    list_saved_segments,
    refresh_saved_segment_count,
    touch_saved_segment,
    update_saved_segment,
)


router = APIRouter()


class SavedSegmentCreate(BaseModel):
    name: str
    description: str | None = None
    filters: dict[str, Any] = Field(default_factory=dict)
    sort: dict[str, Any] = Field(default_factory=dict)
    visibility: str = "private"
    match_profile_id: UUID | None = None
    source: str = "manual"
    result_count: int | None = None


@router.get("/saved-segments", response_model=SavedSegmentsResponse)
def saved_segments(user_id: UUID = DEFAULT_USER_ID):
    return {"items": list_saved_segments(user_id=user_id)}


@router.post("/saved-segments", response_model=SavedSegment)
def create_segment(payload: SavedSegmentCreate, user_id: UUID = DEFAULT_USER_ID):
    return create_saved_segment(payload.model_dump(), user_id=user_id)


@router.put("/saved-segments/{segment_id}", response_model=SavedSegment)
def update_segment(
    segment_id: UUID,
    payload: SavedSegmentCreate,
    user_id: UUID = DEFAULT_USER_ID,
):
    row = update_saved_segment(segment_id, payload.model_dump(), user_id=user_id)
    if not row:
        raise HTTPException(status_code=404, detail="saved_segment_not_found")
    return row


@router.delete("/saved-segments/{segment_id}", response_model=DeleteResponse)
def delete_segment(segment_id: UUID, user_id: UUID = DEFAULT_USER_ID):
    row = delete_saved_segment(segment_id, user_id=user_id)
    if not row:
        raise HTTPException(status_code=404, detail="saved_segment_not_found")
    return {"ok": True, "id": str(row["id"])}


@router.post(
    "/saved-segments/{segment_id}/refresh-count",
    response_model=SavedSegment,
)
def refresh_segment_count(segment_id: UUID, user_id: UUID = DEFAULT_USER_ID):
    row = refresh_saved_segment_count(segment_id, user_id=user_id)
    if not row:
        raise HTTPException(status_code=404, detail="saved_segment_not_found")
    return row


@router.post("/saved-segments/{segment_id}/touch", response_model=SavedSegment)
def touch_segment(segment_id: UUID, user_id: UUID = DEFAULT_USER_ID):
    row = touch_saved_segment(segment_id, user_id=user_id)
    if not row:
        raise HTTPException(status_code=404, detail="saved_segment_not_found")
    return row
