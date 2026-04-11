from recommender import recommend_recipes

if __name__ == "__main__":
    query = "eggs, cheese, bread"
    results = recommend_recipes(query, top_n=3)

    print("Recommendations:")
    for recipe in results:
        print(recipe)