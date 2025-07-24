import os
import io
import re
import joblib
import pandas as pd
import smtplib
import random
import fitz # PyMuPDF
from email.mime.text import MIMEText
from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from pydantic import EmailStr, BaseModel

# --- Pydantic Schemas ---
class PatientDataInput(BaseModel):
    age: int; sex: str; cp: str; trestbps: int; chol: int; fbs: bool; restecg: str
    thalch: int; exang: bool; oldpeak: float; slope: str; ca: int; thal: str
    patient_name: str; symptom_chest_pain: int; symptom_shortness_of_breath: int
    symptom_dizziness: int; symptom_fatigue: int

class PredictionResponse(BaseModel):
    risk_score: float; outcome: str; follow_up: str

class SymptomInput(BaseModel):
    symptom_chest_pain: bool; symptom_shortness_of_breath: bool
    symptom_dizziness: bool; symptom_fatigue: bool

class ResendEmailRequest(BaseModel):
    prediction_id: str; clinician_email: EmailStr

# --- Load Environment Variables ---
load_dotenv()

from .database import init_db
from .models import Patient, Prediction

# --- App Setup ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="Advanced Patient Risk Prediction API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
pipeline = joblib.load("../ml_models/saved_models/heart_disease_pipeline.joblib")

# --- Helper Functions ---
def get_follow_up(risk_score: float) -> str:
    if risk_score > 0.80: return "CRITICAL: Immediate attention required."
    if risk_score > 0.70: return "Urgent follow-up needed within 3 days."
    elif risk_score > 0.45: return "Follow-up recommended within 2 weeks."
    else: return "Routine check-up in 6 months."

def send_alert_email(recipient_email: str, patient_name: str, risk_score: float):
    sender_email = os.getenv("SENDER_EMAIL")
    sender_password = os.getenv("SENDER_PASSWORD")
    if not sender_email or not sender_password:
        print("ERROR: Email credentials not set.")
        return False
    
    msg = MIMEText(f"Dear Clinician,\n\nThis is an automated alert. The patient '{patient_name}' has been identified as high-risk with a score of {risk_score:.2%}.\n\nPlease review their case.")
    msg['Subject'] = f"High-Risk Alert for Patient: {patient_name}"
    msg['From'] = sender_email
    msg['To'] = recipient_email
    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp_server:
            smtp_server.login(sender_email, sender_password)
            smtp_server.sendmail(sender_email, recipient_email, msg.as_string())
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

# --- NEW: Robust PDF Parsing Function ---
def parse_pdf_report(contents: bytes) -> pd.DataFrame:
    """
    Intelligently extracts key-value data from a PDF report.
    This version is more flexible and handles complex layouts.
    """
    text = ""
    with fitz.open(stream=contents, filetype="pdf") as doc:
        for page in doc:
            text += page.get_text()

    # Normalize text for easier parsing
    text = text.lower()

    # Define patterns to look for. This makes the search more flexible.
    patterns = {
        'patient_name': r"patient name\s*[:\-\s]\s*([a-z\s]+)",
        'age': r"age\s*[:\-\s]\s*(\d+)",
        'sex': r"sex\s*[:\-\s]\s*(male|female)",
        'cp': r"chest pain type\s*[:\-\s]\s*(\w+)",
        'trestbps': r"resting bp\s*[:\-\s]\s*(\d+)",
        'chol': r"cholesterol\s*[:\-\s]\s*(\d+)",
        'fbs': r"fasting blood sugar > 120\s*[:\-\s]\s*(true|false|1|0)",
        'thalch': r"max heart rate\s*[:\-\s]\s*(\d+)",
        'exang': r"exercise angina\s*[:\-\s]\s*(true|false|1|0)",
        'clinician_email': r"clinician email\s*[:\-\s]\s*([\w\.\-]+@[\w\.\-]+)"
    }
    
    patient_data = {}
    for key, pattern in patterns.items():
        match = re.search(pattern, text)
        if match:
            value = match.group(1).strip()
            # Convert boolean-like strings to 0 or 1
            if key in ['fbs', 'exang']:
                patient_data[key] = 1 if value.lower() in ['true', '1'] else 0
            else:
                patient_data[key] = value
        else:
            patient_data[key] = None # Set to None if not found

    # Add default values for keys that are often missing from reports but needed by the model
    # This prevents the model from failing.
    defaults = {
        'restecg': 'normal', 'oldpeak': 1.0, 'slope': 'flat', 'ca': 0, 'thal': 'normal',
        'symptom_chest_pain': 0, 'symptom_shortness_of_breath': 0, 'symptom_dizziness': 0, 'symptom_fatigue': 0
    }
    for key, default_value in defaults.items():
        if key not in patient_data or patient_data[key] is None:
            patient_data[key] = default_value

    if patient_data.get('age') is None:
        raise ValueError("Could not parse 'age' from the PDF. Please check the file format.")

    return pd.DataFrame([patient_data])


# --- API Endpoints ---
# (Endpoints 1 and 2 for manual form and symptoms remain the same)
@app.post("/predict-from-form")
async def predict_from_form(patient_data: PatientDataInput):
    # ... (code is the same)
    pass
@app.post("/predict-from-symptoms", response_model=PredictionResponse)
async def predict_from_symptoms(symptoms: SymptomInput):
    # ... (code is the same)
    pass

# ENDPOINT 3: /predict-with-report (UPDATED to use new PDF parser)
@app.post("/predict-with-report")
async def predict_with_report(report_file: UploadFile = File(...)):
    if report_file.content_type not in ["text/csv", "application/pdf"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV or PDF.")
    try:
        contents = await report_file.read()
        input_df = None

        if report_file.content_type == "text/csv":
            input_df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        elif report_file.content_type == "application/pdf":
            # Use the new, robust parsing function
            input_df = parse_pdf_report(contents)
        
        patient_name = input_df.iloc[0].get('patient_name', 'Unnamed Patient')
        clinician_email = input_df.iloc[0].get('clinician_email', None)
        
        # Ensure all required symptom columns exist, defaulting to 0
        for symp in ['symptom_chest_pain', 'symptom_shortness_of_breath', 'symptom_dizziness', 'symptom_fatigue']:
            if symp not in input_df.columns or pd.isna(input_df.iloc[0][symp]):
                input_df[symp] = 0
        
        prediction_proba = pipeline.predict_proba(input_df)[:, 1]
        risk_score = float(prediction_proba[0])
        outcome = "High Risk" if risk_score > 0.5 else "Low Risk"
        follow_up = get_follow_up(risk_score)
        email_sent = False
        
        if clinician_email and risk_score > 0.70:
            email_sent = send_alert_email(clinician_email, patient_name, risk_score)
        
        patient_age = int(input_df.iloc[0].get('age', 50)) # Default age if not found
        patient = await Patient.find_one(Patient.name == patient_name)
        if not patient: patient = Patient(name=patient_name, age=patient_age)
        prediction_record = Prediction(risk_score=risk_score, outcome=outcome, follow_up=follow_up)
        await prediction_record.insert()
        patient.predictions.append(prediction_record)
        await patient.save()

        return {
            "risk_score": risk_score, "outcome": outcome, "follow_up": follow_up,
            "prediction_id": str(prediction_record.id), "email_found_and_sent": email_sent,
            "patient_name": patient_name,
            "message": f"Alert sent to {clinician_email}" if email_sent else "No alert sent."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {e}")

# (Endpoint 4 for sending alerts remains the same)
@app.post("/send-alert")
async def send_alert(request: ResendEmailRequest):
    # ... (code is the same)
    pass