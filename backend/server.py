from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import secrets
import io
import csv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION = 24  # hours

security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============= MODELS =============

class UserRole(str):
    ADMIN = "admin"
    STUDENT = "student"
    FACULTY = "faculty"

class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str
    department: Optional[str] = None
    student_id: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    interests: List[str] = Field(default_factory=list)
    points: int = 0
    badges: List[str] = Field(default_factory=list)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    token: str
    user: User

class EventBase(BaseModel):
    title: str
    description: str
    category: str
    date: str
    time: str
    venue: str
    max_participants: int
    image_url: Optional[str] = None
    organizer: str
    department: Optional[str] = None

class Event(EventBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "upcoming"  # upcoming, ongoing, completed, cancelled
    registered_count: int = 0
    tags: List[str] = Field(default_factory=list)

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    venue: Optional[str] = None
    max_participants: Optional[int] = None
    image_url: Optional[str] = None
    status: Optional[str] = None
    department: Optional[str] = None

class RegistrationBase(BaseModel):
    event_id: str
    user_id: str
    user_name: str
    user_email: str

class Registration(RegistrationBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    registered_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "registered"  # registered, attended, cancelled
    referred_by: Optional[str] = None
    invite_code: Optional[str] = None

class RegistrationCreate(BaseModel):
    event_id: str
    invite_code: Optional[str] = None

class UserInterestsUpdate(BaseModel):
    interests: List[str]

class CheckInCodeRequest(BaseModel):
    code: str

class EventCheckinCode(BaseModel):
    event_id: str
    code: str
    expires_at: datetime

class EventFeedbackCreate(BaseModel):
    event_id: str
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None

class LeaderboardUser(BaseModel):
    user_id: str
    name: str
    department: Optional[str] = None
    points: int

class NotificationBase(BaseModel):
    user_id: str
    title: str
    message: str
    type: str  # info, success, warning, error

class Notification(NotificationBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    read: bool = False

class DashboardStats(BaseModel):
    total_events: int
    upcoming_events: int
    total_registrations: int
    total_users: int

class VenueConflictResult(BaseModel):
    has_conflict: bool
    conflicting_event_id: Optional[str] = None
    conflicting_event_title: Optional[str] = None

class AnnouncementCreate(BaseModel):
    title: str
    message: str
    target_roles: List[str] = Field(default_factory=list)
    target_departments: List[str] = Field(default_factory=list)

class Announcement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    message: str
    created_by: str
    created_by_role: str
    target_roles: List[str] = Field(default_factory=list)
    target_departments: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AttendanceInsight(BaseModel):
    event_id: str
    event_title: str
    total_registered: int
    attended: int
    late_entries: int
    no_show: int
    attendance_rate: float
    no_show_rate: float

class DashboardAnalytics(BaseModel):
    department_participation: List[Dict[str, Any]]
    trend_by_month: List[Dict[str, Any]]
    top_categories: List[Dict[str, Any]]

POINTS = {
    "register": 10,
    "attended": 20,
    "feedback": 5,
    "referral": 15,
}

# ============= HELPER FUNCTIONS =============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

def normalize_tags(category: str, department: Optional[str]) -> List[str]:
    tags = [category.lower()]
    if department:
        tags.append(department.lower())
    return list(set(tags))

async def add_points(user_id: str, points: int):
    await db.users.update_one({"id": user_id}, {"$inc": {"points": points}})

async def maybe_grant_badges(user_id: str):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "points": 1, "badges": 1})
    if not user:
        return

    badges = set(user.get("badges", []))
    points = user.get("points", 0)

    if points >= 50:
        badges.add("Rising Star")
    if points >= 150:
        badges.add("Campus Champion")
    if points >= 300:
        badges.add("Legend")

    await db.users.update_one({"id": user_id}, {"$set": {"badges": list(badges)}})

def ensure_roles(current_user: dict, allowed_roles: List[str], message: str = "Not authorized"):
    if current_user.get("role") not in allowed_roles:
        raise HTTPException(status_code=403, detail=message)

def parse_event_datetime(date_str: str, time_str: str) -> Optional[datetime]:
    normalized_time = time_str.strip()
    fmt_list = ["%H:%M", "%I:%M %p", "%H:%M:%S"]
    for fmt in fmt_list:
        try:
            dt = datetime.strptime(f"{date_str} {normalized_time}", f"%Y-%m-%d {fmt}")
            return dt.replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return None

async def find_venue_conflict(venue: str, date: str, time: str, exclude_event_id: Optional[str] = None) -> Optional[dict]:
    query: Dict[str, Any] = {
        "venue": {"$regex": f"^{venue}$", "$options": "i"},
        "date": date,
        "time": time,
        "status": {"$ne": "cancelled"},
    }
    if exclude_event_id:
        query["id"] = {"$ne": exclude_event_id}
    return await db.events.find_one(query, {"_id": 0, "id": 1, "title": 1})

async def can_manage_event_or_403(event: dict, current_user: dict):
    ensure_roles(current_user, ["admin", "faculty"])
    if current_user["role"] == "faculty" and event.get("created_by") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Faculty can manage only their own events")

def build_simple_pdf(lines: List[str]) -> bytes:
    sanitized = [line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)") for line in lines]
    y_start = 760
    content_lines = ["BT /F1 14 Tf 72 800 Td (CampusHub Certificate) Tj ET"]
    for idx, line in enumerate(sanitized):
        y = y_start - (idx * 22)
        content_lines.append(f"BT /F1 12 Tf 72 {y} Td ({line}) Tj ET")
    stream_data = "\n".join(content_lines).encode("latin-1", errors="replace")

    objects = []
    objects.append(b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n")
    objects.append(b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n")
    objects.append(b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n")
    objects.append(b"4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n")
    objects.append(f"5 0 obj << /Length {len(stream_data)} >> stream\n".encode("latin-1") + stream_data + b"\nendstream endobj\n")

    output = bytearray(b"%PDF-1.4\n")
    xref_positions = [0]
    for obj in objects:
        xref_positions.append(len(output))
        output.extend(obj)
    xref_offset = len(output)
    output.extend(f"xref\n0 {len(xref_positions)}\n".encode("latin-1"))
    output.extend(b"0000000000 65535 f \n")
    for pos in xref_positions[1:]:
        output.extend(f"{pos:010d} 00000 n \n".encode("latin-1"))
    output.extend(f"trailer << /Size {len(xref_positions)} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF".encode("latin-1"))
    return bytes(output)

def csv_response(rows: List[Dict[str, Any]], filename: str) -> Response:
    if not rows:
        rows = [{"message": "No data"}]
    headers = list(rows[0].keys())
    stream = io.StringIO()
    writer = csv.DictWriter(stream, fieldnames=headers)
    writer.writeheader()
    writer.writerows(rows)
    return Response(
        content=stream.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

# ============= AUTH ROUTES =============

@api_router.post("/auth/register", response_model=User)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Create user
    user_dict = user_data.model_dump()
    user_dict.pop('password')
    user_obj = User(**user_dict)
    doc = user_obj.model_dump()
    doc['password'] = hashed_password
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    return user_obj

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Convert timestamp
    if isinstance(user['created_at'], str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    user.pop('password')
    user_obj = User(**user)
    token = create_token(user_obj.id, user_obj.email, user_obj.role)
    
    return TokenResponse(token=token, user=user_obj)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user['user_id']}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if isinstance(user['created_at'], str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    return User(**user)

@api_router.put("/users/interests", response_model=User)
async def update_my_interests(interests_data: UserInterestsUpdate, current_user: dict = Depends(get_current_user)):
    normalized = [i.strip().lower() for i in interests_data.interests if i and i.strip()]
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {"$set": {"interests": list(dict.fromkeys(normalized))}}
    )
    user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if isinstance(user['created_at'], str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    return User(**user)

# ============= EVENT ROUTES =============

@api_router.post("/events", response_model=Event)
async def create_event(event_data: EventCreate, current_user: dict = Depends(get_current_user)):
    ensure_roles(current_user, ["admin", "faculty"], "Only admin and faculty can create events")

    conflict = await find_venue_conflict(event_data.venue, event_data.date, event_data.time)
    if conflict:
        raise HTTPException(
            status_code=409,
            detail=f"Venue conflict: '{conflict['title']}' already booked for this date/time"
        )
    
    event_dict = event_data.model_dump()
    event_dict['created_by'] = current_user['user_id']
    event_dict['tags'] = normalize_tags(event_data.category, event_data.department)
    event_obj = Event(**event_dict)
    doc = event_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.events.insert_one(doc)
    
    # Create notification for all students
    students = await db.users.find({"role": "student"}, {"_id": 0}).to_list(1000)
    notifications = []
    for student in students:
        notif = Notification(
            user_id=student['id'],
            title="New Event Created",
            message=f"New event '{event_obj.title}' has been created. Check it out!",
            type="info"
        )
        notif_doc = notif.model_dump()
        notif_doc['created_at'] = notif_doc['created_at'].isoformat()
        notifications.append(notif_doc)
    
    if notifications:
        await db.notifications.insert_many(notifications)
    
    return event_obj

@api_router.get("/events", response_model=List[Event])
async def get_events(category: Optional[str] = None, status: Optional[str] = None):
    query = {}
    if category:
        query['category'] = category
    if status:
        query['status'] = status
    
    events = await db.events.find(query, {"_id": 0}).to_list(1000)
    
    for event in events:
        if isinstance(event['created_at'], str):
            event['created_at'] = datetime.fromisoformat(event['created_at'])
    
    return events

@api_router.get("/events/recommended", response_model=List[Event])
async def get_recommended_events(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0, "interests": 1, "department": 1})
    interests = set((user or {}).get("interests", []))
    if user and user.get("department"):
        interests.add(user["department"].lower())

    events = await db.events.find({"status": "upcoming"}, {"_id": 0}).to_list(1000)
    for event in events:
        if isinstance(event['created_at'], str):
            event['created_at'] = datetime.fromisoformat(event['created_at'])

    def score(event: dict) -> int:
        score_value = 0
        tags = set(event.get("tags", []))
        category = event.get("category", "").lower()
        if category in interests:
            score_value += 3
        if tags.intersection(interests):
            score_value += 4
        if event.get("registered_count", 0) > 0:
            score_value += 1
        return score_value

    ranked = sorted(events, key=lambda e: (score(e), e.get("registered_count", 0)), reverse=True)
    return [Event(**event) for event in ranked]

@api_router.get("/events/{event_id}", response_model=Event)
async def get_event(event_id: str):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if isinstance(event['created_at'], str):
        event['created_at'] = datetime.fromisoformat(event['created_at'])
    
    return Event(**event)

@api_router.put("/events/{event_id}", response_model=Event)
async def update_event(event_id: str, event_data: EventUpdate, current_user: dict = Depends(get_current_user)):
    ensure_roles(current_user, ["admin", "faculty"], "Only admin and faculty can update events")
    
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    await can_manage_event_or_403(event, current_user)
    
    update_data = {k: v for k, v in event_data.model_dump().items() if v is not None}
    next_venue = update_data.get("venue", event.get("venue"))
    next_date = update_data.get("date", event.get("date"))
    next_time = update_data.get("time", event.get("time"))
    if next_venue and next_date and next_time:
        conflict = await find_venue_conflict(next_venue, next_date, next_time, exclude_event_id=event_id)
        if conflict:
            raise HTTPException(
                status_code=409,
                detail=f"Venue conflict: '{conflict['title']}' already booked for this date/time"
            )
    if 'category' in update_data or 'department' in update_data:
        next_category = update_data.get('category', event.get('category', 'other'))
        next_department = update_data.get('department', event.get('department'))
        update_data['tags'] = normalize_tags(next_category, next_department)
    if update_data:
        await db.events.update_one({"id": event_id}, {"$set": update_data})
    
    updated_event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if isinstance(updated_event['created_at'], str):
        updated_event['created_at'] = datetime.fromisoformat(updated_event['created_at'])
    
    return Event(**updated_event)

@api_router.delete("/events/{event_id}")
async def delete_event(event_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Only admin can delete events")
    
    result = await db.events.delete_one({"id": event_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Delete all registrations for this event
    await db.registrations.delete_many({"event_id": event_id})
    
    return {"message": "Event deleted successfully"}

# ============= REGISTRATION ROUTES =============

@api_router.post("/registrations", response_model=Registration)
async def register_for_event(reg_data: RegistrationCreate, current_user: dict = Depends(get_current_user)):
    # Get event
    event = await db.events.find_one({"id": reg_data.event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if already registered
    existing = await db.registrations.find_one({
        "event_id": reg_data.event_id,
        "user_id": current_user['user_id']
    }, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Already registered for this event")
    
    # Check capacity
    if event['registered_count'] >= event['max_participants']:
        raise HTTPException(status_code=400, detail="Event is full")
    
    # Get user details
    user = await db.users.find_one({"id": current_user['user_id']}, {"_id": 0})
    
    referred_by = None
    if reg_data.invite_code:
        inviter_registration = await db.registrations.find_one(
            {"invite_code": reg_data.invite_code, "event_id": reg_data.event_id},
            {"_id": 0}
        )
        if inviter_registration and inviter_registration["user_id"] != current_user["user_id"]:
            referred_by = inviter_registration["user_id"]

    # Create registration
    registration = Registration(
        event_id=reg_data.event_id,
        user_id=current_user['user_id'],
        user_name=user['name'],
        user_email=user['email'],
        referred_by=referred_by
    )
    doc = registration.model_dump()
    doc['registered_at'] = doc['registered_at'].isoformat()
    doc['invite_code'] = secrets.token_urlsafe(6)
    
    await db.registrations.insert_one(doc)
    
    # Update event registered count
    await db.events.update_one(
        {"id": reg_data.event_id},
        {"$inc": {"registered_count": 1}}
    )

    await add_points(current_user['user_id'], POINTS["register"])
    await maybe_grant_badges(current_user['user_id'])

    if referred_by:
        await add_points(referred_by, POINTS["referral"])
        await maybe_grant_badges(referred_by)
    
    # Create notification
    notif = Notification(
        user_id=current_user['user_id'],
        title="Registration Successful",
        message=f"You have successfully registered for '{event['title']}'",
        type="success"
    )
    notif_doc = notif.model_dump()
    notif_doc['created_at'] = notif_doc['created_at'].isoformat()
    await db.notifications.insert_one(notif_doc)
    
    return Registration(**doc)

@api_router.get("/registrations/my", response_model=List[Registration])
async def get_my_registrations(current_user: dict = Depends(get_current_user)):
    registrations = await db.registrations.find(
        {"user_id": current_user['user_id']},
        {"_id": 0}
    ).to_list(1000)
    
    for reg in registrations:
        if isinstance(reg['registered_at'], str):
            reg['registered_at'] = datetime.fromisoformat(reg['registered_at'])
    
    return registrations

@api_router.get("/registrations/event/{event_id}", response_model=List[Registration])
async def get_event_registrations(event_id: str, current_user: dict = Depends(get_current_user)):
    ensure_roles(current_user, ["admin", "faculty"], "Only admin and faculty can view registrations")
    event = await db.events.find_one({"id": event_id}, {"_id": 0, "id": 1, "created_by": 1})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    await can_manage_event_or_403(event, current_user)
    
    registrations = await db.registrations.find(
        {"event_id": event_id},
        {"_id": 0}
    ).to_list(1000)
    
    for reg in registrations:
        if isinstance(reg['registered_at'], str):
            reg['registered_at'] = datetime.fromisoformat(reg['registered_at'])
    
    return registrations

@api_router.delete("/registrations/{registration_id}")
async def cancel_registration(registration_id: str, current_user: dict = Depends(get_current_user)):
    registration = await db.registrations.find_one({"id": registration_id}, {"_id": 0})
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    if registration['user_id'] != current_user['user_id'] and current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.registrations.delete_one({"id": registration_id})
    
    # Update event registered count
    await db.events.update_one(
        {"id": registration['event_id']},
        {"$inc": {"registered_count": -1}}
    )
    
    return {"message": "Registration cancelled successfully"}

@api_router.get("/registrations/{registration_id}/invite")
async def get_invite_code(registration_id: str, current_user: dict = Depends(get_current_user)):
    registration = await db.registrations.find_one({"id": registration_id}, {"_id": 0})
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    if registration["user_id"] != current_user["user_id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    invite_code = registration.get("invite_code")
    if not invite_code:
        invite_code = secrets.token_urlsafe(6)
        await db.registrations.update_one({"id": registration_id}, {"$set": {"invite_code": invite_code}})

    return {"invite_code": invite_code, "event_id": registration["event_id"]}

@api_router.post("/registrations/invite/{invite_code}", response_model=Registration)
async def register_with_invite(invite_code: str, current_user: dict = Depends(get_current_user)):
    invite_registration = await db.registrations.find_one({"invite_code": invite_code}, {"_id": 0, "event_id": 1})
    if not invite_registration:
        raise HTTPException(status_code=404, detail="Invalid invite code")
    return await register_for_event(
        RegistrationCreate(event_id=invite_registration["event_id"], invite_code=invite_code),
        current_user
    )

# ============= NOTIFICATION ROUTES =============

@api_router.get("/notifications", response_model=List[Notification])
async def get_notifications(current_user: dict = Depends(get_current_user)):
    notifications = await db.notifications.find(
        {"user_id": current_user['user_id']},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    for notif in notifications:
        if isinstance(notif['created_at'], str):
            notif['created_at'] = datetime.fromisoformat(notif['created_at'])
    
    return notifications

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user['user_id']},
        {"$set": {"read": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification marked as read"}

@api_router.put("/notifications/read-all")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    await db.notifications.update_many(
        {"user_id": current_user['user_id'], "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "All notifications marked as read"}

# ============= ENGAGEMENT ROUTES =============

@api_router.post("/events/{event_id}/checkin-code", response_model=EventCheckinCode)
async def generate_checkin_code(event_id: str, current_user: dict = Depends(get_current_user)):
    ensure_roles(current_user, ["admin", "faculty"], "Only admin and faculty can generate check-in codes")

    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    await can_manage_event_or_403(event, current_user)

    code = secrets.token_hex(3).upper()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=3)
    event_dt = parse_event_datetime(event.get("date", ""), event.get("time", ""))
    late_cutoff_at = None
    if event_dt:
        late_cutoff_at = (event_dt + timedelta(minutes=20)).isoformat()
    payload = {
        "event_id": event_id,
        "code": code,
        "expires_at": expires_at.isoformat(),
        "late_cutoff_at": late_cutoff_at,
        "qr_payload": f"campushub://checkin?code={code}",
        "created_by": current_user["user_id"],
    }
    await db.event_checkins.update_one({"event_id": event_id}, {"$set": payload}, upsert=True)
    return EventCheckinCode(event_id=event_id, code=code, expires_at=expires_at)

@api_router.post("/registrations/checkin")
async def checkin_for_event(data: CheckInCodeRequest, current_user: dict = Depends(get_current_user)):
    checkin = await db.event_checkins.find_one({"code": data.code}, {"_id": 0})
    if not checkin:
        raise HTTPException(status_code=404, detail="Invalid check-in code")

    expires_at = datetime.fromisoformat(checkin["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Check-in code expired")
    late_cutoff_at_raw = checkin.get("late_cutoff_at")
    is_late = False
    if late_cutoff_at_raw:
        late_cutoff_at = datetime.fromisoformat(late_cutoff_at_raw)
        if datetime.now(timezone.utc) > late_cutoff_at:
            raise HTTPException(status_code=400, detail="Late entry cutoff reached")
        event_dt = await db.events.find_one({"id": checkin["event_id"]}, {"_id": 0, "date": 1, "time": 1})
        parsed = parse_event_datetime(event_dt.get("date", ""), event_dt.get("time", "")) if event_dt else None
        if parsed and datetime.now(timezone.utc) > parsed:
            is_late = True

    registration = await db.registrations.find_one(
        {"event_id": checkin["event_id"], "user_id": current_user["user_id"]},
        {"_id": 0}
    )
    if not registration:
        raise HTTPException(status_code=404, detail="You are not registered for this event")

    if registration.get("status") == "attended":
        return {"message": "Already checked in"}

    await db.registrations.update_one(
        {"id": registration["id"]},
        {"$set": {"status": "attended", "checked_in_at": datetime.now(timezone.utc).isoformat(), "is_late": is_late}}
    )
    await add_points(current_user["user_id"], POINTS["attended"])
    await maybe_grant_badges(current_user["user_id"])
    return {"message": "Check-in successful", "event_id": checkin["event_id"]}

@api_router.get("/leaderboard", response_model=List[LeaderboardUser])
async def get_leaderboard(limit: int = 10):
    users = await db.users.find(
        {"role": "student"},
        {"_id": 0, "id": 1, "name": 1, "department": 1, "points": 1}
    ).sort("points", -1).to_list(limit)
    return [
        LeaderboardUser(
            user_id=user["id"],
            name=user["name"],
            department=user.get("department"),
            points=user.get("points", 0),
        )
        for user in users
    ]

@api_router.post("/feedback")
async def submit_event_feedback(feedback: EventFeedbackCreate, current_user: dict = Depends(get_current_user)):
    event = await db.events.find_one({"id": feedback.event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    registration = await db.registrations.find_one(
        {"event_id": feedback.event_id, "user_id": current_user["user_id"]},
        {"_id": 0}
    )
    if not registration:
        raise HTTPException(status_code=403, detail="Register for event before feedback")

    existing_feedback = await db.feedback.find_one(
        {"event_id": feedback.event_id, "user_id": current_user["user_id"]},
        {"_id": 0}
    )
    if existing_feedback:
        raise HTTPException(status_code=400, detail="Feedback already submitted")

    feedback_doc = {
        "id": str(uuid.uuid4()),
        "event_id": feedback.event_id,
        "user_id": current_user["user_id"],
        "rating": feedback.rating,
        "comment": feedback.comment,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.feedback.insert_one(feedback_doc)
    await add_points(current_user["user_id"], POINTS["feedback"])
    await maybe_grant_badges(current_user["user_id"])

    recommendations = await get_recommended_events(current_user)
    return {
        "message": "Feedback submitted",
        "next_recommended_events": recommendations[:3],
    }

# ============= DASHBOARD & STATS =============

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    if current_user['role'] == 'admin':
        total_events = await db.events.count_documents({})
        upcoming_events = await db.events.count_documents({"status": "upcoming"})
        total_registrations = await db.registrations.count_documents({})
        total_users = await db.users.count_documents({})
    elif current_user['role'] == 'faculty':
        total_events = await db.events.count_documents({"created_by": current_user['user_id']})
        upcoming_events = await db.events.count_documents({
            "created_by": current_user['user_id'],
            "status": "upcoming"
        })
        # Get registrations for faculty's events
        faculty_events = await db.events.find({"created_by": current_user['user_id']}, {"_id": 0, "id": 1}).to_list(1000)
        event_ids = [e['id'] for e in faculty_events]
        total_registrations = await db.registrations.count_documents({"event_id": {"$in": event_ids}})
        total_users = await db.users.count_documents({})
    else:  # student
        total_events = await db.events.count_documents({"status": "upcoming"})
        upcoming_events = total_events
        total_registrations = await db.registrations.count_documents({"user_id": current_user['user_id']})
        total_users = await db.users.count_documents({})
    
    return DashboardStats(
        total_events=total_events,
        upcoming_events=upcoming_events,
        total_registrations=total_registrations,
        total_users=total_users
    )

@api_router.get("/users", response_model=List[User])
async def get_users(current_user: dict = Depends(get_current_user)):
    ensure_roles(current_user, ["admin"], "Only admin can view all users")
    
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    
    for user in users:
        if isinstance(user['created_at'], str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    return users

@api_router.get("/events/{event_id}/venue-conflict", response_model=VenueConflictResult)
async def check_venue_conflict(event_id: str):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    conflict = await find_venue_conflict(event["venue"], event["date"], event["time"], exclude_event_id=event_id)
    if not conflict:
        return VenueConflictResult(has_conflict=False)
    return VenueConflictResult(
        has_conflict=True,
        conflicting_event_id=conflict["id"],
        conflicting_event_title=conflict["title"],
    )

# ============= ANNOUNCEMENTS =============

@api_router.post("/announcements", response_model=Announcement)
async def publish_announcement(data: AnnouncementCreate, current_user: dict = Depends(get_current_user)):
    ensure_roles(current_user, ["admin", "faculty"], "Only admin/faculty can publish announcements")
    normalized_roles = [r.lower().strip() for r in data.target_roles if r and r.strip()]
    normalized_departments = [d.strip() for d in data.target_departments if d and d.strip()]
    ann = Announcement(
        title=data.title.strip(),
        message=data.message.strip(),
        created_by=current_user["user_id"],
        created_by_role=current_user["role"],
        target_roles=list(dict.fromkeys(normalized_roles)),
        target_departments=list(dict.fromkeys(normalized_departments)),
    )
    doc = ann.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.announcements.insert_one(doc)

    audience_query: Dict[str, Any] = {}
    if ann.target_roles:
        audience_query["role"] = {"$in": ann.target_roles}
    if ann.target_departments:
        audience_query["department"] = {"$in": ann.target_departments}
    users = await db.users.find(audience_query or {}, {"_id": 0, "id": 1}).to_list(2000)
    notifications = []
    for u in users:
        notif = Notification(
            user_id=u["id"],
            title=f"Announcement: {ann.title}",
            message=ann.message,
            type="info",
        )
        notif_doc = notif.model_dump()
        notif_doc["created_at"] = notif_doc["created_at"].isoformat()
        notifications.append(notif_doc)
    if notifications:
        await db.notifications.insert_many(notifications)
    return ann

@api_router.get("/announcements", response_model=List[Announcement])
async def list_announcements(current_user: dict = Depends(get_current_user)):
    role = current_user.get("role")
    user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0, "department": 1})
    department = (user or {}).get("department")

    query = {
        "$or": [
            {"target_roles": {"$size": 0}, "target_departments": {"$size": 0}},
            {"target_roles": role},
            {"target_departments": department} if department else {"target_departments": "__none__"},
        ]
    }
    announcements = await db.announcements.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    for item in announcements:
        if isinstance(item.get("created_at"), str):
            item["created_at"] = datetime.fromisoformat(item["created_at"])
    return [Announcement(**item) for item in announcements]

# ============= ATTENDANCE INTELLIGENCE =============

@api_router.get("/attendance/insights", response_model=List[AttendanceInsight])
async def attendance_insights(current_user: dict = Depends(get_current_user)):
    ensure_roles(current_user, ["admin", "faculty"], "Only admin/faculty can view attendance insights")
    event_query: Dict[str, Any] = {}
    if current_user["role"] == "faculty":
        event_query["created_by"] = current_user["user_id"]
    events = await db.events.find(event_query, {"_id": 0, "id": 1, "title": 1}).to_list(1000)

    insights: List[AttendanceInsight] = []
    for event in events:
        regs = await db.registrations.find({"event_id": event["id"]}, {"_id": 0, "status": 1, "is_late": 1}).to_list(2000)
        total = len(regs)
        attended = len([r for r in regs if r.get("status") == "attended"])
        late_entries = len([r for r in regs if r.get("status") == "attended" and r.get("is_late")])
        no_show = max(total - attended, 0)
        attendance_rate = round((attended / total) * 100, 2) if total else 0.0
        no_show_rate = round((no_show / total) * 100, 2) if total else 0.0
        insights.append(
            AttendanceInsight(
                event_id=event["id"],
                event_title=event["title"],
                total_registered=total,
                attended=attended,
                late_entries=late_entries,
                no_show=no_show,
                attendance_rate=attendance_rate,
                no_show_rate=no_show_rate,
            )
        )
    return insights

# ============= CERTIFICATES =============

@api_router.get("/certificates/{event_id}/download")
async def download_certificate(event_id: str, format: str = Query(default="pdf"), current_user: dict = Depends(get_current_user)):
    registration = await db.registrations.find_one(
        {"event_id": event_id, "user_id": current_user["user_id"]},
        {"_id": 0}
    )
    if not registration or registration.get("status") != "attended":
        raise HTTPException(status_code=403, detail="Certificate available only after attendance confirmation")

    event = await db.events.find_one({"id": event_id}, {"_id": 0, "title": 1, "date": 1, "organizer": 1})
    user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0, "name": 1, "department": 1})
    if not event or not user:
        raise HTTPException(status_code=404, detail="Certificate context not found")

    lines = [
        f"This certifies that {user['name']}",
        f"Department: {user.get('department', 'N/A')}",
        f"has successfully attended {event['title']}",
        f"on {event.get('date', 'N/A')}",
        f"organized by {event.get('organizer', 'CampusHub')}",
        f"Issued at: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
    ]
    safe_event_title = event["title"].replace(" ", "_")
    if format.lower() == "txt":
        content = "\n".join(["CampusHub Attendance Certificate", ""] + lines)
        return Response(
            content=content,
            media_type="text/plain",
            headers={"Content-Disposition": f'attachment; filename="certificate_{safe_event_title}.txt"'},
        )

    pdf_bytes = build_simple_pdf(lines)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="certificate_{safe_event_title}.pdf"'},
    )

# ============= ANALYTICS =============

@api_router.get("/dashboard/analytics", response_model=DashboardAnalytics)
async def dashboard_analytics(current_user: dict = Depends(get_current_user)):
    ensure_roles(current_user, ["admin", "faculty"], "Only admin/faculty can view dashboard analytics")
    event_query: Dict[str, Any] = {}
    if current_user["role"] == "faculty":
        event_query["created_by"] = current_user["user_id"]
    events = await db.events.find(event_query, {"_id": 0}).to_list(2000)
    event_ids = [e["id"] for e in events]

    regs = await db.registrations.find({"event_id": {"$in": event_ids}}, {"_id": 0, "event_id": 1, "user_id": 1}).to_list(5000)
    users = await db.users.find({}, {"_id": 0, "id": 1, "department": 1}).to_list(5000)
    user_department = {u["id"]: (u.get("department") or "Unknown") for u in users}

    dept_counts: Dict[str, int] = {}
    for r in regs:
        dept = user_department.get(r["user_id"], "Unknown")
        dept_counts[dept] = dept_counts.get(dept, 0) + 1
    department_participation = [{"department": d, "participants": c} for d, c in sorted(dept_counts.items(), key=lambda x: x[1], reverse=True)]

    month_counts: Dict[str, int] = {}
    for e in events:
        month_key = "Unknown"
        if e.get("date"):
            try:
                month_key = datetime.strptime(e["date"], "%Y-%m-%d").strftime("%Y-%m")
            except ValueError:
                month_key = "Unknown"
        month_counts[month_key] = month_counts.get(month_key, 0) + 1
    trend_by_month = [{"month": m, "events": c} for m, c in sorted(month_counts.items())]

    cat_counts: Dict[str, int] = {}
    for e in events:
        category = (e.get("category") or "other").lower()
        cat_counts[category] = cat_counts.get(category, 0) + e.get("registered_count", 0)
    top_categories = [{"category": c, "registrations": n} for c, n in sorted(cat_counts.items(), key=lambda x: x[1], reverse=True)[:10]]

    return DashboardAnalytics(
        department_participation=department_participation,
        trend_by_month=trend_by_month,
        top_categories=top_categories,
    )

# ============= SEARCH =============

@api_router.get("/search")
async def global_search(
    q: str = Query(default=""),
    scope: str = Query(default="all"),
    department: Optional[str] = None,
    category: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    term = q.strip()
    regex = {"$regex": term, "$options": "i"} if term else None
    result: Dict[str, Any] = {}

    if scope in ["all", "events"]:
        eq: Dict[str, Any] = {}
        if regex:
            eq["$or"] = [{"title": regex}, {"description": regex}, {"venue": regex}, {"organizer": regex}]
        if department:
            eq["department"] = department
        if category:
            eq["category"] = category
        result["events"] = await db.events.find(eq, {"_id": 0}).limit(100).to_list(100)

    if scope in ["all", "users"]:
        ensure_roles(current_user, ["admin", "faculty"], "Only admin/faculty can search users")
        uq: Dict[str, Any] = {}
        if regex:
            uq["$or"] = [{"name": regex}, {"email": regex}, {"department": regex}]
        if department:
            uq["department"] = department
        result["users"] = await db.users.find(uq, {"_id": 0, "password": 0}).limit(100).to_list(100)

    if scope in ["all", "instructors"]:
        iq: Dict[str, Any] = {"role": "faculty"}
        if regex:
            iq["$or"] = [{"name": regex}, {"email": regex}, {"department": regex}]
        if department:
            iq["department"] = department
        result["instructors"] = await db.users.find(iq, {"_id": 0, "password": 0}).limit(100).to_list(100)

    if scope in ["all", "workshops"]:
        wq: Dict[str, Any] = {"category": {"$in": ["workshop", "seminar", "training"]}}
        if regex:
            wq["$or"] = [{"title": regex}, {"description": regex}]
        result["workshops"] = await db.events.find(wq, {"_id": 0}).limit(100).to_list(100)

    return result

# ============= EXPORT CENTER =============

@api_router.get("/exports/events")
async def export_events(format: str = Query(default="csv"), current_user: dict = Depends(get_current_user)):
    ensure_roles(current_user, ["admin", "faculty"], "Only admin/faculty can export events")
    query = {"created_by": current_user["user_id"]} if current_user["role"] == "faculty" else {}
    events = await db.events.find(query, {"_id": 0}).to_list(2000)
    rows = [{
        "event_id": e.get("id"),
        "title": e.get("title"),
        "category": e.get("category"),
        "date": e.get("date"),
        "time": e.get("time"),
        "venue": e.get("venue"),
        "department": e.get("department"),
        "status": e.get("status"),
        "registered_count": e.get("registered_count", 0),
    } for e in events]
    if format.lower() == "pdf":
        lines = [f"{r['date']} {r['time']} | {r['title']} | {r['venue']} | regs:{r['registered_count']}" for r in rows[:60]]
        return Response(
            content=build_simple_pdf(lines or ["No events found"]),
            media_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="events_export.pdf"'},
        )
    return csv_response(rows, "events_export.csv")

@api_router.get("/exports/attendance")
async def export_attendance(format: str = Query(default="csv"), current_user: dict = Depends(get_current_user)):
    ensure_roles(current_user, ["admin", "faculty"], "Only admin/faculty can export attendance")
    event_query = {"created_by": current_user["user_id"]} if current_user["role"] == "faculty" else {}
    events = await db.events.find(event_query, {"_id": 0, "id": 1, "title": 1}).to_list(2000)
    event_map = {e["id"]: e["title"] for e in events}
    regs = await db.registrations.find({"event_id": {"$in": list(event_map.keys())}}, {"_id": 0}).to_list(5000)
    rows = [{
        "registration_id": r.get("id"),
        "event_id": r.get("event_id"),
        "event_title": event_map.get(r.get("event_id"), "Unknown"),
        "user_id": r.get("user_id"),
        "user_name": r.get("user_name"),
        "user_email": r.get("user_email"),
        "status": r.get("status"),
        "is_late": r.get("is_late", False),
        "registered_at": r.get("registered_at"),
    } for r in regs]
    if format.lower() == "pdf":
        lines = [f"{row['event_title']} | {row['user_name']} | {row['status']}" for row in rows[:80]]
        return Response(
            content=build_simple_pdf(lines or ["No attendance records found"]),
            media_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="attendance_export.pdf"'},
        )
    return csv_response(rows, "attendance_export.csv")

@api_router.get("/exports/participation")
async def export_participation(format: str = Query(default="csv"), current_user: dict = Depends(get_current_user)):
    ensure_roles(current_user, ["admin", "faculty", "student"], "Not authorized")
    if current_user["role"] == "student":
        query = {"id": current_user["user_id"]}
    else:
        query = {}
    users = await db.users.find(query, {"_id": 0, "password": 0}).to_list(3000)
    user_ids = [u["id"] for u in users]
    regs = await db.registrations.find({"user_id": {"$in": user_ids}}, {"_id": 0, "user_id": 1, "event_id": 1, "status": 1}).to_list(10000)

    reg_by_user: Dict[str, Dict[str, int]] = {}
    for r in regs:
        bucket = reg_by_user.setdefault(r["user_id"], {"total": 0, "attended": 0})
        bucket["total"] += 1
        if r.get("status") == "attended":
            bucket["attended"] += 1
    rows = []
    for u in users:
        stat = reg_by_user.get(u["id"], {"total": 0, "attended": 0})
        rows.append({
            "user_id": u["id"],
            "name": u.get("name"),
            "email": u.get("email"),
            "role": u.get("role"),
            "department": u.get("department"),
            "events_registered": stat["total"],
            "events_attended": stat["attended"],
        })
    if format.lower() == "pdf":
        lines = [f"{r['name']} ({r['role']}) | regs:{r['events_registered']} | attended:{r['events_attended']}" for r in rows[:80]]
        return Response(
            content=build_simple_pdf(lines or ["No participation records found"]),
            media_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="participation_export.pdf"'},
        )
    return csv_response(rows, "participation_export.csv")

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

DEFAULT_DEMO_USERS = [
    {
        "email": "admin@university.edu",
        "password": "admin123",
        "name": "System Admin",
        "role": "admin",
        "department": "Administration",
        "student_id": None,
    },
    {
        "email": "faculty@university.edu",
        "password": "faculty123",
        "name": "Faculty User",
        "role": "faculty",
        "department": "Computer Science",
        "student_id": None,
    },
    {
        "email": "student@university.edu",
        "password": "student123",
        "name": "Student User",
        "role": "student",
        "department": "Computer Science",
        "student_id": "STU001",
    },
]

@app.on_event("startup")
async def ensure_default_users():
    for demo_user in DEFAULT_DEMO_USERS:
        existing_user = await db.users.find_one({"email": demo_user["email"]}, {"_id": 0, "id": 1})
        if existing_user:
            continue

        user_obj = User(
            email=demo_user["email"],
            name=demo_user["name"],
            role=demo_user["role"],
            department=demo_user["department"],
            student_id=demo_user["student_id"],
        )
        doc = user_obj.model_dump()
        doc["password"] = hash_password(demo_user["password"])
        doc["created_at"] = doc["created_at"].isoformat()
        await db.users.insert_one(doc)
        logger.info("Created default user: %s", demo_user["email"])

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
