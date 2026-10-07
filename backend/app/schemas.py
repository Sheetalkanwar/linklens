from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, HttpUrl, ConfigDict


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)


class LinkCreate(BaseModel):
    destination_url: HttpUrl
    short_code: str | None = Field(default=None, min_length=3, max_length=40)
    title: str | None = Field(default=None, max_length=200)


class LinkUpdate(BaseModel):
    destination_url: HttpUrl | None = None
    title: str | None = Field(default=None, max_length=200)
    status: str | None = Field(default=None, pattern="^(active|paused)$")


class LinkOut(BaseModel):
    id: int
    short_code: str
    destination_url: str
    title: str | None
    status: str
    created_at: datetime
    clicks: int
    short_url: str


class ClickOut(BaseModel):
    id: int
    clicked_at: datetime
    device: str
    browser: str
    os: str
    referrer: str | None


class TimeSeriesPoint(BaseModel):
    date: str
    clicks: int


class BreakdownItem(BaseModel):
    name: str
    clicks: int


class LinkAnalyticsOut(BaseModel):
    link_id: int
    short_code: str
    title: str | None
    total_clicks: int
    unique_clicks: int


class AnalyticsOut(BaseModel):
    total_clicks: int
    unique_clicks: int
    active_links: int
    total_links: int

    clicks_over_time: list[TimeSeriesPoint]
    device_breakdown: list[BreakdownItem]
    referrer_breakdown: list[BreakdownItem]
    top_links: list[LinkAnalyticsOut]

    recent_clicks: list[ClickOut]