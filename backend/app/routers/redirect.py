import hashlib

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..database import SessionLocal, get_db
from ..models import ClickEvent, Link


router = APIRouter(tags=["redirect"])


def classify(ua: str):
    low = ua.lower()

    # Device
    if "tablet" in low or "ipad" in low:
        device = "Tablet"
    elif "mobile" in low or "android" in low or "iphone" in low:
        device = "Mobile"
    else:
        device = "Desktop"

    # Browser
    if "edg/" in low:
        browser = "Edge"
    elif "chrome/" in low:
        browser = "Chrome"
    elif "firefox/" in low:
        browser = "Firefox"
    elif "safari/" in low:
        browser = "Safari"
    else:
        browser = "Other"

    # Operating system
    if "windows" in low:
        os = "Windows"
    elif "mac os" in low or "macintosh" in low:
        os = "macOS"
    elif "android" in low:
        os = "Android"
    elif "iphone" in low or "ipad" in low or "ios" in low:
        os = "iOS"
    elif "linux" in low:
        os = "Linux"
    else:
        os = "Other"

    return device, browser, os


def hash_ip(ip: str | None) -> str | None:
    if not ip:
        return None

    value = f"{ip}:{settings.ip_hash_salt}"
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def record_click(
    link_id: int,
    ua: str,
    referrer: str | None,
    ip: str | None,
):
    db = SessionLocal()

    try:
        device, browser, os = classify(ua)

        db.add(
            ClickEvent(
                link_id=link_id,
                device=device,
                browser=browser,
                os=os,
                referrer=referrer,
                ip_hash=hash_ip(ip),
                user_agent=ua[:1000],
            )
        )

        db.commit()

    finally:
        db.close()


@router.get("/{short_code}")
def redirect(
    short_code: str,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    code = short_code.strip().lower()

    link = db.scalar(
        select(Link).where(
            Link.short_code == code,
            Link.status == "active",
        )
    )

    if not link:
        raise HTTPException(
            status_code=404,
            detail="Short link not found",
        )

    user_agent = request.headers.get("user-agent", "")
    referrer = request.headers.get("referer")

    ip = request.client.host if request.client else None

    background_tasks.add_task(
        record_click,
        link.id,
        user_agent,
        referrer,
        ip,
    )

    return RedirectResponse(
        url=link.destination_url,
        status_code=302,
    )