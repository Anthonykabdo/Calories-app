import pandas as pd
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

DATA_PATH = "recipes_dataset.csv"

def recommend_recipes(user_ingredients: str, target_calories: int, top_n: int = 10):
    df = pd.read_csv(DATA_PATH)

    # make sure needed columns exist
    required_columns = [
        "name", "ingredients", "calories", "meal_type",
        "protein_g", "carbs_g", "fat_g"
    ]
    for col in required_columns:
        if col not in df.columns:
            if col in ["protein_g", "carbs_g", "fat_g"]:
                df[col] = None
            elif col == "meal_type":
                df[col] = "unknown"
            else:
                raise ValueError(f"Missing required column: {col}")

    # clean calories
    df["calories"] = pd.to_numeric(df["calories"], errors="coerce")
    df = df.dropna(subset=["calories", "ingredients", "name"]).copy()

    # calorie filter: keep recipes near target
    tolerance = 150
    filtered_df = df[
        (df["calories"] >= target_calories - tolerance) &
        (df["calories"] <= target_calories + tolerance)
    ].copy()

    # fallback if too few results
    if len(filtered_df) < top_n:
        filtered_df = df.copy()

    # ingredient similarity
    vectorizer = CountVectorizer(token_pattern=r"[^,]+")
    ingredient_matrix = vectorizer.fit_transform(
        filtered_df["ingredients"].astype(str).str.lower()
    )
    user_vector = vectorizer.transform([user_ingredients.lower()])

    similarity_scores = cosine_similarity(user_vector, ingredient_matrix).flatten()
    filtered_df["ingredient_score"] = similarity_scores

    # calorie closeness score
    filtered_df["calorie_score"] = 1 - (
        (filtered_df["calories"] - target_calories).abs() /
        filtered_df["calories"].sub(target_calories).abs().max()
        if filtered_df["calories"].sub(target_calories).abs().max() != 0 else 1
    )

    # final score
    filtered_df["score"] = (
        0.7 * filtered_df["ingredient_score"] +
        0.3 * filtered_df["calorie_score"]
    )

    results = filtered_df.sort_values("score", ascending=False).head(top_n)

    output = []
    for _, row in results.iterrows():
        output.append({
            "name": str(row["name"]),
            "ingredients": str(row["ingredients"]),
            "calories": int(row["calories"]),
            "meal_type": str(row["meal_type"]),
            "protein_g": None if pd.isna(row["protein_g"]) else float(row["protein_g"]),
            "carbs_g": None if pd.isna(row["carbs_g"]) else float(row["carbs_g"]),
            "fat_g": None if pd.isna(row["fat_g"]) else float(row["fat_g"]),
            "score": float(row["score"]),
        })

    return output