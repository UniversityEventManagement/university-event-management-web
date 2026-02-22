from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import secrets

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
    if current_user['role'] not in ['admin', 'faculty']:
        raise HTTPException(status_code=403, detail="Only admin and faculty can create events")
    
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
    if current_user['role'] not in ['admin', 'faculty']:
        raise HTTPException(status_code=403, detail="Only admin and faculty can update events")
    
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    update_data = {k: v for k, v in event_data.model_dump().items() if v is not None}
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
    if current_user['role'] not in ['admin', 'faculty']:
        raise HTTPException(status_code=403, detail="Only admin and faculty can view registrations")
    
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
    if current_user['role'] not in ['admin', 'faculty']:
        raise HTTPException(status_code=403, detail="Only admin and faculty can generate check-in codes")

    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if current_user['role'] == 'faculty' and event.get("created_by") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized for this event")

    code = secrets.token_hex(3).upper()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=3)
    payload = {
        "event_id": event_id,
        "code": code,
        "expires_at": expires_at.isoformat(),
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
        {"$set": {"status": "attended"}}
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
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Only admin can view all users")
    
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    
    for user in users:
        if isinstance(user['created_at'], str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    return users

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
