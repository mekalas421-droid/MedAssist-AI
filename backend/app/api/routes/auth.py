"""
Authentication routes: /register, /login, /me, /refresh
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.patient import PatientProfile
from app.models.user import User, UserRole
from app.schemas.auth import TokenResponse, UserLogin, UserOut, UserRegister

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


from app.core.rate_limit import limiter
from app.models.doctor import AdminProfile, DoctorProfile, HealthcareProviderProfile


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(request: Request, payload: UserRegister, db: AsyncSession = Depends(get_db)):
    from app.models.diagnostics import AuditLog

    existing = await db.execute(select(User).where(User.email == payload.email))
    existing_user = existing.scalar_one_or_none()
    
    is_dev_update = False
    if existing_user:
        from app.core.config import settings
        if settings.ENV == "development":
            is_dev_update = True
            existing_user.hashed_password = hash_password(payload.password)
            existing_user.full_name = payload.full_name
            existing_user.role = payload.role
            existing_user.phone_number = payload.phone_number
            db.add(existing_user)
            await db.flush()
            user = existing_user
        else:
            db.add(AuditLog(
                action="REGISTER_FAILED_DUPLICATE",
                resource_type="USER",
                log_metadata={"email": payload.email}
            ))
            await db.commit()
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered.")
    else:
        user = User(
            email=payload.email,
            hashed_password=hash_password(payload.password),
            full_name=payload.full_name,
            role=payload.role,
            phone_number=payload.phone_number,
        )
        db.add(user)
        await db.flush()  # get user.id before commit
    
    db.add(AuditLog(
        user_id=user.id,
        action="REGISTER_SUCCESS_DEV_UPDATE" if is_dev_update else "REGISTER_SUCCESS",
        resource_type="USER",
        resource_id=user.id,
        log_metadata={"email": user.email, "role": user.role.value}
    ))

    # Handle role-specific profiles
    if is_dev_update:
        # Clean up any existing profiles across roles so we can insert the new one
        from sqlalchemy import delete
        await db.execute(delete(PatientProfile).where(PatientProfile.user_id == user.id))
        await db.execute(delete(DoctorProfile).where(DoctorProfile.user_id == user.id))
        await db.execute(delete(HealthcareProviderProfile).where(HealthcareProviderProfile.user_id == user.id))
        await db.execute(delete(AdminProfile).where(AdminProfile.user_id == user.id))
        await db.flush()

    if payload.role == UserRole.PATIENT:
        dob = None
        if payload.date_of_birth:
            try:
                dob = datetime.strptime(payload.date_of_birth, "%Y-%m-%d").date()
            except ValueError:
                pass
        
        # Gender conversion
        from app.models.patient import GenderType
        gender_enum = None
        if payload.gender:
            try:
                gender_enum = GenderType(payload.gender.lower())
            except ValueError:
                pass

        profile = PatientProfile(
            user_id=user.id,
            date_of_birth=dob,
            gender=gender_enum,
            blood_group=payload.blood_group,
            address=payload.address,
            emergency_contact_name=payload.emergency_contact_name,
            emergency_contact_phone=payload.emergency_contact_phone
        )
        db.add(profile)
    elif payload.role == UserRole.DOCTOR:
        db.add(DoctorProfile(
            user_id=user.id,
            specialty=payload.specialty,
            clinic_address=payload.clinic_address
        ))
    elif payload.role == UserRole.CLINIC:
        db.add(HealthcareProviderProfile(
            user_id=user.id,
            facility_name=payload.facility_name,
            address=payload.address
        ))
    elif payload.role == UserRole.ADMIN:
        db.add(AdminProfile(user_id=user.id))

    await db.commit()
    await db.refresh(user)
    
    out = UserOut.model_validate(user)
    out.is_dev_update = is_dev_update
    return out


@router.post("/forgot-password")
async def forgot_password(email: str):
    # Mock forgot password functionality (e.g. log reset link)
    print(f"Password reset link requested for email: {email}")
    return {"message": "If this email is registered, a password reset link has been sent."}


@router.post("/reset-password")
async def reset_password(token: str, new_password: str):
    # Mock reset password functionality
    return {"message": "Password has been reset successfully."}


@router.post("/verify-email")
async def verify_email(token: str):
    # Mock email verification functionality
    return {"message": "Email verified successfully."}



@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(request: Request, payload: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password."
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated.")

    user.last_login_at = datetime.now(timezone.utc)
    await db.commit()

    access_token = create_access_token(subject=str(user.id), role=user.role.value)
    refresh_token = create_refresh_token(subject=str(user.id))
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh_token: str, db: AsyncSession = Depends(get_db)):
    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise ValueError("Invalid token type")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token.")

    result = await db.execute(select(User).where(User.id == payload["sub"]))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive.")

    new_access = create_access_token(subject=str(user.id), role=user.role.value)
    new_refresh = create_refresh_token(subject=str(user.id))
    return TokenResponse(access_token=new_access, refresh_token=new_refresh)


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
