import re
import uuid
from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.user import UserRole


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=255)
    role: UserRole = UserRole.PATIENT
    phone_number: str | None = None
    
    # Patient specific fields
    date_of_birth: str | None = None
    gender: str | None = None
    blood_group: str | None = None
    address: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    
    # Doctor specific fields
    specialty: str | None = None
    clinic_address: str | None = None
    
    # Healthcare provider specific fields
    facility_name: str | None = None

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not re.match(r"^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$", v):
            raise ValueError('Password must contain at least one letter and one number')
        return v

    @field_validator('phone_number')
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        if v and not re.match(r"^\+?[1-9]\d{1,14}$", v.replace("-", "").replace(" ", "")):
            raise ValueError('Invalid phone number format')
        return v

    @field_validator('date_of_birth')
    @classmethod
    def validate_age(cls, v: str | None) -> str | None:
        if v:
            try:
                dob = datetime.strptime(v, "%Y-%m-%d").date()
                age = (date.today() - dob).days / 365.25
                if age < 0 or age > 150:
                    raise ValueError("Invalid age")
            except ValueError as e:
                if "Invalid age" in str(e):
                    raise e
                raise ValueError("date_of_birth must be in YYYY-MM-DD format")
        return v



class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    role: UserRole
    phone_number: str | None
    is_active: bool
    is_verified: bool
    is_dev_update: bool = False

    class Config:
        from_attributes = True
