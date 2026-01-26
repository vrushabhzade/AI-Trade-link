"""
User Profile Data Models
Pydantic models for user profile management with validation
"""

from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, validator
from enum import Enum


class Gender(str, Enum):
    """Gender enumeration"""
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class Caste(str, Enum):
    """Caste category enumeration"""
    GENERAL = "General"
    OBC = "OBC"
    SC = "SC"
    ST = "ST"


class MaritalStatus(str, Enum):
    """Marital status enumeration"""
    SINGLE = "single"
    MARRIED = "married"
    WIDOWED = "widowed"
    DIVORCED = "divorced"


class EmploymentStatus(str, Enum):
    """Employment status enumeration"""
    FARMER = "farmer"
    LABORER = "laborer"
    SELF_EMPLOYED = "self-employed"
    UNEMPLOYED = "unemployed"
    GOVERNMENT_EMPLOYEE = "government-employee"
    PRIVATE_EMPLOYEE = "private-employee"


class Demographics(BaseModel):
    """User demographic information"""
    age: int = Field(..., ge=0, le=150, description="Age in years")
    gender: Gender = Field(..., description="Gender")
    caste: Caste = Field(..., description="Caste category")
    marital_status: MaritalStatus = Field(..., description="Marital status")
    
    @validator('age')
    def validate_age(cls, v):
        if v < 0 or v > 150:
            raise ValueError('Age must be between 0 and 150')
        return v


class Economic(BaseModel):
    """User economic information"""
    annual_income: int = Field(..., ge=0, description="Annual income in INR")
    land_ownership: float = Field(..., ge=0, description="Land ownership in acres")
    employment_status: EmploymentStatus = Field(..., description="Employment status")
    
    @validator('annual_income')
    def validate_income(cls, v):
        if v < 0:
            raise ValueError('Annual income cannot be negative')
        return v
    
    @validator('land_ownership')
    def validate_land(cls, v):
        if v < 0:
            raise ValueError('Land ownership cannot be negative')
        return v


class Location(BaseModel):
    """User location information"""
    state: str = Field(..., min_length=2, max_length=50, description="State name")
    district: str = Field(..., min_length=2, max_length=50, description="District name")
    block: str = Field(..., min_length=2, max_length=50, description="Block name")
    village: str = Field(..., min_length=2, max_length=50, description="Village name")
    pincode: Optional[str] = Field(None, pattern=r'^\d{6}$', description="6-digit pincode")


class Family(BaseModel):
    """User family information"""
    size: int = Field(..., ge=1, le=20, description="Family size")
    dependents: int = Field(..., ge=0, description="Number of dependents")
    
    @validator('dependents')
    def validate_dependents(cls, v, values):
        if 'size' in values and v >= values['size']:
            raise ValueError('Dependents cannot be greater than or equal to family size')
        return v


class UserProfile(BaseModel):
    """Complete user profile model"""
    profile_id: Optional[str] = Field(None, description="Unique profile identifier")
    demographics: Demographics = Field(..., description="Demographic information")
    economic: Economic = Field(..., description="Economic information")
    location: Location = Field(..., description="Location information")
    family: Family = Field(..., description="Family information")
    
    # Metadata
    created_at: Optional[datetime] = Field(None, description="Profile creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Profile update timestamp")
    version: int = Field(default=1, description="Profile version for audit trail")
    
    class Config:
        """Pydantic configuration"""
        use_enum_values = True
        validate_assignment = True
        extra = "forbid"  # Prevent extra fields
        schema_extra = {
            "example": {
                "demographics": {
                    "age": 35,
                    "gender": "female",
                    "caste": "SC",
                    "marital_status": "married"
                },
                "economic": {
                    "annual_income": 120000,
                    "land_ownership": 2.5,
                    "employment_status": "farmer"
                },
                "location": {
                    "state": "Maharashtra",
                    "district": "Pune",
                    "block": "Haveli",
                    "village": "Pirangut",
                    "pincode": "412108"
                },
                "family": {
                    "size": 4,
                    "dependents": 2
                }
            }
        }


class UserProfileCreate(BaseModel):
    """Model for creating a new user profile"""
    demographics: Demographics
    economic: Economic
    location: Location
    family: Family


class UserProfileUpdate(BaseModel):
    """Model for updating user profile (partial updates allowed)"""
    demographics: Optional[Demographics] = None
    economic: Optional[Economic] = None
    location: Optional[Location] = None
    family: Optional[Family] = None


class UserProfileResponse(BaseModel):
    """Model for user profile API responses"""
    profile_id: str
    demographics: Demographics
    economic: Economic
    location: Location
    family: Family
    created_at: datetime
    updated_at: datetime
    version: int