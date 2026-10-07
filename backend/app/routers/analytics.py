from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import ClickEvent, Link, User
from ..schemas import (
    AnalyticsOut,
    BreakdownItem,
    ClickOut,
    LinkAnalyticsOut,
    TimeSeriesPoint,
)

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def click_out(c: ClickEvent) -> ClickOut:
    return ClickOut(
        id=c.id,
        clicked_at=c.clicked_at,
        device=c.device,
        browser=c.browser,
        os=c.os,
        referrer=c.referrer,
    )


@router.get("", response_model=AnalyticsOut)
def analytics(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # ---------------------------------------------------------
    # User's links
    # ---------------------------------------------------------
    link_ids = select(Link.id).where(Link.owner_id == user.id)

    # ---------------------------------------------------------
    # Basic totals
    # ---------------------------------------------------------
    total_clicks = (
        db.scalar(
            select(func.count(ClickEvent.id)).where(
                ClickEvent.link_id.in_(link_ids)
            )
        )
        or 0
    )

    unique_clicks = (
        db.scalar(
            select(func.count(func.distinct(ClickEvent.ip_hash))).where(
                ClickEvent.link_id.in_(link_ids),
                ClickEvent.ip_hash.is_not(None),
            )
        )
        or 0
    )

    total_links = (
        db.scalar(
            select(func.count(Link.id)).where(
                Link.owner_id == user.id
            )
        )
        or 0
    )

    active_links = (
        db.scalar(
            select(func.count(Link.id)).where(
                Link.owner_id == user.id,
                Link.status == "active",
            )
        )
        or 0
    )

    # ---------------------------------------------------------
    # Clicks over time - last 14 days
    # ---------------------------------------------------------
    now = datetime.now(timezone.utc)
    start_date = now.date() - timedelta(days=13)

    rows = db.execute(
        select(
            func.date(ClickEvent.clicked_at).label("day"),
            func.count(ClickEvent.id).label("clicks"),
        )
        .where(
            ClickEvent.link_id.in_(link_ids),
            ClickEvent.clicked_at >= datetime.combine(
                start_date,
                datetime.min.time(),
                tzinfo=timezone.utc,
            ),
        )
        .group_by(func.date(ClickEvent.clicked_at))
        .order_by(func.date(ClickEvent.clicked_at))
    ).all()

    clicks_by_day = {
        str(row.day): row.clicks
        for row in rows
    }

    clicks_over_time = []

    for i in range(14):
        day = start_date + timedelta(days=i)

        clicks_over_time.append(
            TimeSeriesPoint(
                date=day.isoformat(),
                clicks=clicks_by_day.get(day.isoformat(), 0),
            )
        )

    # ---------------------------------------------------------
    # Device breakdown
    # ---------------------------------------------------------
    device_rows = db.execute(
        select(
            ClickEvent.device,
            func.count(ClickEvent.id).label("clicks"),
        )
        .where(ClickEvent.link_id.in_(link_ids))
        .group_by(ClickEvent.device)
        .order_by(func.count(ClickEvent.id).desc())
    ).all()

    device_breakdown = [
        BreakdownItem(
            name=device or "Unknown",
            clicks=clicks,
        )
        for device, clicks in device_rows
    ]

    # ---------------------------------------------------------
    # Referrer breakdown
    # ---------------------------------------------------------
    referrer_rows = db.execute(
        select(
            ClickEvent.referrer,
            func.count(ClickEvent.id).label("clicks"),
        )
        .where(ClickEvent.link_id.in_(link_ids))
        .group_by(ClickEvent.referrer)
        .order_by(func.count(ClickEvent.id).desc())
        .limit(10)
    ).all()

    referrer_breakdown = [
        BreakdownItem(
            name=referrer or "Direct",
            clicks=clicks,
        )
        for referrer, clicks in referrer_rows
    ]

    # ---------------------------------------------------------
    # Top links
    # ---------------------------------------------------------
    top_link_rows = db.execute(
        select(
            Link.id,
            Link.short_code,
            Link.title,
            func.count(ClickEvent.id).label("clicks"),
        )
        .outerjoin(ClickEvent, ClickEvent.link_id == Link.id)
        .where(Link.owner_id == user.id)
        .group_by(
            Link.id,
            Link.short_code,
            Link.title,
        )
        .order_by(func.count(ClickEvent.id).desc())
        .limit(10)
    ).all()

    top_links = []

    for row in top_link_rows:
        unique_for_link = (
            db.scalar(
                select(func.count(func.distinct(ClickEvent.ip_hash))).where(
                    ClickEvent.link_id == row.id,
                    ClickEvent.ip_hash.is_not(None),
                )
            )
            or 0
        )

        top_links.append(
            LinkAnalyticsOut(
                link_id=row.id,
                short_code=row.short_code,
                title=row.title,
                total_clicks=row.clicks,
                unique_clicks=unique_for_link,
            )
        )

    # ---------------------------------------------------------
    # Recent clicks
    # ---------------------------------------------------------
    recent = db.scalars(
        select(ClickEvent)
        .join(Link)
        .where(Link.owner_id == user.id)
        .order_by(ClickEvent.clicked_at.desc())
        .limit(50)
    ).all()

    return AnalyticsOut(
        total_clicks=total_clicks,
        unique_clicks=unique_clicks,
        active_links=active_links,
        total_links=total_links,
        clicks_over_time=clicks_over_time,
        device_breakdown=device_breakdown,
        referrer_breakdown=referrer_breakdown,
        top_links=top_links,
        recent_clicks=[click_out(c) for c in recent],
    )


@router.get("/links/{link_id}", response_model=list[ClickOut])
def link_analytics(
    link_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not db.scalar(
        select(Link.id).where(
            Link.id == link_id,
            Link.owner_id == user.id,
        )
    ):
        raise HTTPException(404, "Link not found")

    events = db.scalars(
        select(ClickEvent)
        .where(ClickEvent.link_id == link_id)
        .order_by(ClickEvent.clicked_at.desc())
        .limit(500)
    ).all()

    return [click_out(c) for c in events]