import os
import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "ml", "data", "recipes.csv")
MODEL_DIR = os.path.join(BASE_DIR, "ml", "model")
VECTORIZER_PATH = os.path.join(MODEL_DIR, "tfidf_vectorizer.pkl")
MATRIX_PATH = os.path.join(MODEL_DIR, "recipe_matrix.pkl")
RECIPES_PATH = os.path.join(MODEL_DIR, "recipes_cleaned.pkl")

os.makedirs(MODEL_DIR, exist_ok=True)

df = pd.read_csv(DATA_PATH)

df = df.dropna(subset=["name", "ingredients"]).copy()
df["ingredients"] = df["ingredients"].astype(str).str.lower()

vectorizer = TfidfVectorizer()
recipe_matrix = vectorizer.fit_transform(df["ingredients"])

joblib.dump(vectorizer, VECTORIZER_PATH)
joblib.dump(recipe_matrix, MATRIX_PATH)
joblib.dump(df, RECIPES_PATH)

print("Training complete.")
print(f"Saved vectorizer to: {VECTORIZER_PATH}")
print(f"Saved matrix to: {MATRIX_PATH}")
print(f"Saved recipes to: {RECIPES_PATH}")