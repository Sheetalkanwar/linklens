import re
import secrets
import string
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from ..auth import get_current_user
from ..config import settings
from ..database import get_db
from ..models import ClickEvent, Link, User
from ..schemas import LinkCreate, LinkOut, LinkUpdate

router = APIRouter(prefix="/api/links", tags=["links"])
CODE_RE = re.compile(r"^[a-z0-9_-]{3,40}$")
ALPHABET = string.ascii_lowercase + string.digits

def make_code():
    return "".join(secrets.choice(ALPHABET) for _ in range(7))

def serialize(link: Link, clicks: int) -> LinkOut:
    return LinkOut(id=link.id, short_code=link.short_code, destination_url=link.destination_url, title=link.title, status=link.status, created_at=link.created_at, clicks=clicks, short_url=f"{settings.short_base_url.rstrip('/')}/{link.short_code}")

@router.post("", response_model=LinkOut, status_code=201)
def create_link(data: LinkCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    code = data.short_code.strip().lower() if data.short_code else make_code()
    if not CODE_RE.fullmatch(code):
        raise HTTPException(422, "Short code may contain lowercase letters, numbers, _ and - only")
    if db.scalar(select(Link).where(Link.short_code == code)):
        raise HTTPException(409, "That short code is already taken")
    link = Link(owner_id=user.id, short_code=code, destination_url=str(data.destination_url), title=data.title.strip() if data.title else None)
    db.add(link)
    db.commit()
    db.refresh(link)
    return serialize(link, 0)

@router.get("", response_model=list[LinkOut])
def list_links(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    links = db.scalars(select(Link).where(Link.owner_id == user.id).order_by(Link.created_at.desc())).all()
    if not links:
        return []
    counts = dict(db.execute(select(ClickEvent.link_id, func.count(ClickEvent.id)).where(ClickEvent.link_id.in_([x.id for x in links])).group_by(ClickEvent.link_id)).all())
    return [serialize(x, counts.get(x.id, 0)) for x in links]

@router.get("/{link_id}", response_model=LinkOut)
def get_link(link_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    link = db.scalar(select(Link).where(Link.id == link_id, Link.owner_id == user.id))
    if not link:
        raise HTTPException(404, "Link not found")
    clicks = db.scalar(select(func.count(ClickEvent.id)).where(ClickEvent.link_id == link.id)) or 0
    return serialize(link, clicks)

@router.patch("/{link_id}", response_model=LinkOut)
def update_link(link_id: int, data: LinkUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    link = db.scalar(select(Link).where(Link.id == link_id, Link.owner_id == user.id))
    if not link:
        raise HTTPException(404, "Link not found")
    if data.destination_url is not None:
        link.destination_url = str(data.destination_url)
    if data.title is not None:
        link.title = data.title.strip() or None
    if data.status is not None:
        link.status = data.status
    db.commit()
    db.refresh(link)
    clicks = db.scalar(select(func.count(ClickEvent.id)).where(ClickEvent.link_id == link.id)) or 0
    return serialize(link, clicks)

@router.delete("/{link_id}", status_code=204)
def delete_link(link_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    link = db.scalar(select(Link).where(Link.id == link_id, Link.owner_id == user.id))
    if not link:
        raise HTTPException(404, "Link not found")
    db.delete(link)
    db.commit()
    return None
