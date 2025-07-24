import motor.motor_asyncio
from beanie import init_beanie
from .models import Patient, Prediction # Import your Beanie models

async def init_db():
    """
    Initializes the local MongoDB database connection and Beanie ODM.
    """
    # 1. Your local connection string with the database name specified
    connection_string = "mongodb://localhost:27017/patientdb"

    # 2. Create a Motor client for the asynchronous connection.
    # This is the driver that allows your app to talk to MongoDB
    client = motor.motor_asyncio.AsyncIOMotorClient(connection_string)

    # 3. Initialize Beanie with the database and document models
    # This links your Pydantic-style models to MongoDB collections
    await init_beanie(
        database=client.patientdb, # Use the database name from your string
        document_models=[Patient, Prediction]
    )
    print("✅ Successfully connected to local MongoDB database.")