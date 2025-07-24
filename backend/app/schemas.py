from pydantic import BaseModel, Field, EmailStr
from typing import Optional

class PatientDataInput(BaseModel):
    age: int = Field(..., example=52)
    sex: str = Field(..., example='male')
    cp: str = Field(..., example='asymptomatic')
    trestbps: int = Field(..., example=125)
    chol: int = Field(..., example=212)
    fbs: bool = Field(..., example=True)
    restecg: str = Field(..., example='normal')
    thalch: int = Field(..., example=168)
    exang: bool = Field(..., example=False)
    oldpeak: float = Field(..., example=1.0)
    slope: str = Field(..., example='upsloping')
    ca: int = Field(..., example=2)
    thal: str = Field(..., example='reversable defect')
    patient_name: Optional[str] = Field("Anonymous", example="John Doe")
    symptom_chest_pain: int = Field(0, example=1)
    symptom_shortness_of_breath: int = Field(0, example=1)
    symptom_dizziness: int = Field(0, example=0)
    symptom_fatigue: int = Field(0, example=1)

class PredictionResponse(BaseModel):
    risk_score: float
    outcome: str
    follow_up: str

    class Config:
        # Use the new Pydantic v2 config key
        from_attributes = True

class SymptomInput(BaseModel):
    symptom_chest_pain: bool
    symptom_shortness_of_breath: bool
    symptom_dizziness: bool
    symptom_fatigue: bool

class ResendEmailRequest(BaseModel):
    prediction_id: str
    clinician_email: EmailStr