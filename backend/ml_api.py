import sys
import json
from recommender import recommend_recipes

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python ml_api.py \"ingredients\" targetCalories"}))
        sys.exit(1)

    ingredients = sys.argv[1]
    target_calories = int(sys.argv[2])

    recipes = recommend_recipes(ingredients, target_calories)

    print(json.dumps({"recipes": recipes}, indent=2))