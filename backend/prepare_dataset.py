import pandas as pd
import ast

INPUT_FILE = "RAW_recipes.csv"
OUTPUT_FILE = "recipes_dataset.csv"

def safe_eval_list(value):
    try:
        parsed = ast.literal_eval(value)
        if isinstance(parsed, list):
            return ", ".join(str(x) for x in parsed)
        return ""
    except Exception:
        return ""

def safe_eval_nutrition(value):
    try:
        parsed = ast.literal_eval(value)
        if isinstance(parsed, list) and len(parsed) >= 4:
            return {
                "calories": parsed[0],
                "fat_g": parsed[1],
                "carbs_g": parsed[2],
                "protein_g": parsed[3],
            }
        return {
            "calories": None,
            "fat_g": None,
            "carbs_g": None,
            "protein_g": None,
        }
    except Exception:
        return {
            "calories": None,
            "fat_g": None,
            "carbs_g": None,
            "protein_g": None,
        }

def infer_meal_type(tags_text):
    tags_text = str(tags_text).lower()

    if "breakfast" in tags_text:
        return "breakfast"
    if "lunch" in tags_text:
        return "lunch"
    if "dinner" in tags_text:
        return "dinner"
    if "dessert" in tags_text:
        return "dessert"
    return "unknown"

def main():
    df = pd.read_csv(INPUT_FILE)

    # keep only needed columns if they exist
    needed = ["name", "ingredients", "nutrition", "tags"]
    missing = [col for col in needed if col not in df.columns]
    if missing:
        raise ValueError(f"Missing columns in dataset: {missing}")

    output_rows = []

    for _, row in df.iterrows():
        ingredients_text = safe_eval_list(row["ingredients"])
        nutrition = safe_eval_nutrition(row["nutrition"])
        meal_type = infer_meal_type(row["tags"])

        output_rows.append({
            "name": row["name"],
            "ingredients": ingredients_text,
            "calories": nutrition["calories"],
            "meal_type": meal_type,
            "protein_g": nutrition["protein_g"],
            "carbs_g": nutrition["carbs_g"],
            "fat_g": nutrition["fat_g"],
        })

    out_df = pd.DataFrame(output_rows)

    # clean bad rows
    out_df = out_df.dropna(subset=["name", "ingredients", "calories"])
    out_df = out_df[out_df["ingredients"].str.strip() != ""]
    out_df = out_df[out_df["name"].astype(str).str.strip() != ""]

    # optional: keep dataset lighter for testing
    out_df = out_df.head(5000)

    out_df.to_csv(OUTPUT_FILE, index=False)
    print(f"Saved cleaned dataset to {OUTPUT_FILE}")
    print(out_df.head())

if __name__ == "__main__":
    main()