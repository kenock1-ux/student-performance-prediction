import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
import joblib

def create_synthetic_data(n=400):
    np.random.seed(42)
    # Generate synthetic categorical
    schools = np.random.choice(['GP', 'MS'], n)
    sexes = np.random.choice(['F', 'M'], n)
    addresses = np.random.choice(['U', 'R'], n)
    famsizes = np.random.choice(['LE3', 'GT3'], n)
    Pstatuses = np.random.choice(['T', 'A'], n)
    jobs = ['teacher', 'health', 'services', 'at_home', 'other']
    Mjobs = np.random.choice(jobs, n)
    Fjobs = np.random.choice(jobs, n)
    reasons = np.random.choice(['home', 'reputation', 'course', 'other'], n)
    guardians = np.random.choice(['mother', 'father', 'other'], n)
    
    yes_no = ['yes', 'no']
    schoolsups = np.random.choice(yes_no, n)
    famsups = np.random.choice(yes_no, n)
    paids = np.random.choice(yes_no, n)
    activities = np.random.choice(yes_no, n)
    nurseries = np.random.choice(yes_no, n)
    highers = np.random.choice(yes_no, n)
    internets = np.random.choice(yes_no, n)
    romantics = np.random.choice(yes_no, n)
    
    # Generate synthetic numerical
    ages = np.random.randint(15, 23, n)
    Medus = np.random.randint(0, 5, n)
    Fedus = np.random.randint(0, 5, n)
    traveltimes = np.random.randint(1, 5, n)
    studytimes = np.random.randint(1, 5, n)
    failures = np.random.randint(0, 4, n)
    famrels = np.random.randint(1, 6, n)
    freetimes = np.random.randint(1, 6, n)
    goouts = np.random.randint(1, 6, n)
    Dalcs = np.random.randint(1, 6, n)
    Walcs = np.random.randint(1, 6, n)
    healths = np.random.randint(1, 6, n)
    absences = np.random.randint(0, 76, n)
    G1s = np.random.randint(0, 21, n)
    G2s = np.random.randint(0, 21, n)
    
    # Target G3 (synthetic relation to G1 and G2)
    G3s = np.clip(np.round(G1s * 0.4 + G2s * 0.5 + np.random.normal(0, 2, n)), 0, 20).astype(int)
    
    df = pd.DataFrame({
        'school': schools, 'sex': sexes, 'age': ages, 'address': addresses, 'famsize': famsizes,
        'Pstatus': Pstatuses, 'Medu': Medus, 'Fedu': Fedus, 'Mjob': Mjobs, 'Fjob': Fjobs,
        'reason': reasons, 'guardian': guardians, 'traveltime': traveltimes, 'studytime': studytimes,
        'failures': failures, 'schoolsup': schoolsups, 'famsup': famsups, 'paid': paids,
        'activities': activities, 'nursery': nurseries, 'higher': highers, 'internet': internets,
        'romantic': romantics, 'famrel': famrels, 'freetime': freetimes, 'goout': goouts,
        'Dalc': Dalcs, 'Walc': Walcs, 'health': healths, 'absences': absences, 'G1': G1s, 'G2': G2s, 'G3': G3s
    })
    return df

def train_and_save_model():
    csv_path = '../performance/student_data.csv'
    if os.path.exists(csv_path):
        print(f"Loading real data from {csv_path}...")
        df = pd.read_csv(csv_path, encoding='ISO-8859-1')
    else:
        print("Real data not found. Generating synthetic data for model training...")
        df = create_synthetic_data()

    target = "G3"
    X = df.drop(columns=[target])
    y = df[target]

    cat_cols = X.select_dtypes(include=["object"]).columns.tolist()
    num_cols = X.select_dtypes(exclude=["object"]).columns.tolist()

    preprocess = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
            ("num", "passthrough", num_cols)
        ]
    )

    model = Pipeline([
        ('preprocess', preprocess),
        ('model', RandomForestRegressor(random_state=42))
    ])

    model.fit(X, y)
    
    # Save the model
    joblib.dump(model, 'model.pkl')
    print("Model trained and saved as 'model.pkl'.")

if __name__ == "__main__":
    train_and_save_model()
