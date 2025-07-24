from beanie import Document, Link
from pydantic import BaseModel
from typing import List, Optional
import datetime

class Prediction(Document):
    risk_score: float
    outcome: str
    follow_up: str
    created_at: datetime.datetime = datetime.datetime.now()

    class Settings:
        name = "predictions" # This is the collection name in MongoDB

class Patient(Document):
    name: str
    age: int
    predictions: List[Link[Prediction]] = [] # A list of links to related predictions

    class Settings:
        name = "patients" # The collection name