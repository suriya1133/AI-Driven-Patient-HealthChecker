import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import joblib
import os

print("🚀 Starting the model training script...")

# --- 1. Robust File Path Loading ---
print("\nStep 1: Locating and loading the dataset...")
try:
    # Get the absolute directory of the current script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Build the path to the project root (which is two levels up from this script)
    project_root = os.path.dirname(os.path.dirname(script_dir))
    
    # Build the full, reliable path to the data file
    DATA_PATH = os.path.join(project_root, 'data', 'raw', 'heart.csv')
    
    print(f"Attempting to load data from: {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)
    print("✅ Dataset loaded successfully.")
    
except FileNotFoundError:
    print(f"❌ FATAL ERROR: The file was not found at the constructed path: {DATA_PATH}")
    print("Please ensure your project structure is correct and the file 'heart.csv' exists.")
    exit()


# --- 2. Data Cleaning & Feature Engineering ---
print("\nStep 2: Cleaning data and creating features...")
df.replace('?', np.nan, inplace=True)
if 'id' in df.columns: df.drop(['id', 'dataset'], axis=1, inplace=True)
df['target'] = (df['num'] > 0).astype(int)
df.drop('num', axis=1, inplace=True)

for col in ['trestbps', 'chol', 'thalch', 'oldpeak', 'ca']:
    df[col] = pd.to_numeric(df[col], errors='coerce')


# --- 3. Simulate Symptom Data ---
print("\nStep 3: Simulating new symptom features for the model...")
np.random.seed(42)
df['symptom_chest_pain'] = np.random.randint(0, 2, df.shape[0])
df['symptom_shortness_of_breath'] = np.random.randint(0, 2, df.shape[0])
df['symptom_dizziness'] = np.random.randint(0, 2, df.shape[0])
df['symptom_fatigue'] = np.random.randint(0, 2, df.shape[0])
print("Simulated symptom columns added.")


# --- 4. Preprocessing Pipeline Definition ---
print("\nStep 4: Defining preprocessing pipelines...")
categorical_features = ['sex', 'cp', 'restecg', 'slope', 'thal']
numerical_features = ['age', 'trestbps', 'chol', 'thalch', 'oldpeak', 'ca']
boolean_features = ['fbs', 'exang']
symptom_features = ['symptom_chest_pain', 'symptom_shortness_of_breath', 'symptom_dizziness', 'symptom_fatigue']

numerical_transformer = Pipeline(steps=[('imputer', SimpleImputer(strategy='median')), ('scaler', StandardScaler())])
categorical_transformer = Pipeline(steps=[('imputer', SimpleImputer(strategy='most_frequent')), ('onehot', OneHotEncoder(handle_unknown='ignore'))])

preprocessor = ColumnTransformer(
    transformers=[
        ('num', numerical_transformer, numerical_features),
        ('cat', categorical_transformer, categorical_features),
        ('bool', 'passthrough', boolean_features),
        ('symp', 'passthrough', symptom_features)
    ],
    remainder='drop'
)


# --- 5. Model Training ---
print("\nStep 5: Training the XGBoost model...")
X = df.drop('target', axis=1)
y = df['target']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

model_pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('classifier', xgb.XGBClassifier(use_label_encoder=False, eval_metric='logloss', random_state=42))
])
model_pipeline.fit(X_train, y_train)
print("✅ Model training complete.")


# --- 6. Save the Final Pipeline ---
print("\nStep 6: Saving the new pipeline...")
# The output path is also built relative to the project root
output_dir = os.path.join(project_root, 'ml_models', 'saved_models')
os.makedirs(output_dir, exist_ok=True)
pipeline_path = os.path.join(output_dir, 'heart_disease_pipeline.joblib')
joblib.dump(model_pipeline, pipeline_path)
print(f"\n🎉 Success! New model saved to '{pipeline_path}'.")