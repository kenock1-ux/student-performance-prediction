from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import pandas as pd

app = FastAPI(title="Student Performance API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the model
try:
    model = joblib.load('model.pkl')
except Exception as e:
    model = None
    print("Warning: model.pkl not found. Please run train.py first.")

class StudentFeatures(BaseModel):
    school: str = Field(..., description="student's school (binary: 'GP' or 'MS')")
    sex: str = Field(..., description="student's sex (binary: 'F' or 'M')")
    age: int = Field(..., description="student's age (numeric: 15 to 22)")
    address: str = Field(..., description="student's home address type (binary: 'U' or 'R')")
    famsize: str = Field(..., description="family size (binary: 'LE3' or 'GT3')")
    Pstatus: str = Field(..., description="parent's cohabitation status (binary: 'T' or 'A')")
    Medu: int = Field(..., description="mother's education (numeric: 0 to 4)")
    Fedu: int = Field(..., description="father's education (numeric: 0 to 4)")
    Mjob: str = Field(..., description="mother's job (nominal)")
    Fjob: str = Field(..., description="father's job (nominal)")
    reason: str = Field(..., description="reason to choose this school (nominal)")
    guardian: str = Field(..., description="student's guardian (nominal)")
    traveltime: int = Field(..., description="home to school travel time (numeric: 1 to 4)")
    studytime: int = Field(..., description="weekly study time (numeric: 1 to 4)")
    failures: int = Field(..., description="number of past class failures (numeric: 0 to 4)")
    schoolsup: str = Field(..., description="extra educational support (binary: yes or no)")
    famsup: str = Field(..., description="family educational support (binary: yes or no)")
    paid: str = Field(..., description="extra paid classes (binary: yes or no)")
    activities: str = Field(..., description="extra-curricular activities (binary: yes or no)")
    nursery: str = Field(..., description="attended nursery school (binary: yes or no)")
    higher: str = Field(..., description="wants to take higher education (binary: yes or no)")
    internet: str = Field(..., description="Internet access at home (binary: yes or no)")
    romantic: str = Field(..., description="with a romantic relationship (binary: yes or no)")
    famrel: int = Field(..., description="quality of family relationships (numeric: 1 to 5)")
    freetime: int = Field(..., description="free time after school (numeric: 1 to 5)")
    goout: int = Field(..., description="going out with friends (numeric: 1 to 5)")
    Dalc: int = Field(..., description="workday alcohol consumption (numeric: 1 to 5)")
    Walc: int = Field(..., description="weekend alcohol consumption (numeric: 1 to 5)")
    health: int = Field(..., description="current health status (numeric: 1 to 5)")
    absences: int = Field(..., description="number of school absences (numeric: 0 to 93)")
    G1: int = Field(..., description="first period grade (numeric: 0 to 20)")
    G2: int = Field(..., description="second period grade (numeric: 0 to 20)")

@app.post("/predict")
def predict_score(features: StudentFeatures):
    if not model:
        return {"error": "Model not loaded. Please train the model first."}
    
    # Convert Pydantic object to dict, then to DataFrame (1 row)
    input_data = pd.DataFrame([features.model_dump()])
    
    # Predict
    prediction = model.predict(input_data)
    
    # Return as float
    return {"predicted_G3": float(prediction[0])}

class LoginRequest(BaseModel):
    username: str
    password: str
    role: str

@app.post("/login")
def login(req: LoginRequest):
    # Mock login logic
    return {
        "user": {
            "name": req.username,
            "role": req.role
        },
        "token": "mock-jwt-token"
    }

class AdviceRequest(BaseModel):
    predicted_G3: float
    role: str

@app.post("/advice")
def get_advice(req: AdviceRequest):
    score = req.predicted_G3
    role = req.role

    if role == "student":
        if score >= 15:
            advice = "Excellent work! You are on track for top-tier university programs. Consider taking advanced placement courses and looking into STEM or Pre-Med tracks."
        elif score >= 10:
            advice = "Good job staying above average! Keep consistent with study habits. If you're interested in business or arts, focus on extracurricular leadership."
        else:
            advice = "You are currently facing some academic challenges. Consider enrolling in after-school tutoring, focusing on core subjects, and utilizing teacher office hours."
    elif role == "parent":
        if score >= 15:
            advice = "Your child is performing exceptionally. Support them by discussing college savings plans and encouraging them to take on leadership roles."
        elif score >= 10:
            advice = "Your child is doing well. Provide a quiet study environment at home and encourage them to explore their interests."
        else:
            advice = "Your child may need extra support. Consider discussing their challenges with teachers, reviewing homework daily, and considering a tutor."
    else:  # teacher
        if score >= 15:
            advice = f"This student's predicted score is {score:.1f}. They are a candidate for advanced programs. Encourage them to mentor other students."
        elif score >= 10:
            advice = f"This student's predicted score is {score:.1f}. They are performing adequately. Monitor their engagement in class."
        else:
            advice = f"This student's predicted score is {score:.1f}. They require intervention. Please schedule a meeting to discuss supportive strategies."
        
    return {"advice": advice}

