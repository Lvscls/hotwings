const fs = require("fs");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

(async () => {
  try {
    await client.connect();

    const db = client.db("restaurant");

    await db.createCollection("recettes");
    await db.createCollection("ingredients");
    await db.createCollection("ingredients_recettes");

    const jsonFilePathRecipes = "recipes.json";

    const data = await fs.promises.readFile(jsonFilePathRecipes, "utf8");
    const recipes = JSON.parse(data);

    for (const recipe of recipes) {
      const existingRecipe = await db
        .collection("recettes")
        .findOne({ titre: recipe.title });
      let recetteId;
      if (!existingRecipe) {
        // Si la recette n'existe pas, on l'insère
        const result = await db.collection("recettes").insertOne({
          titre: recipe.title,
          description: recipe.desc,
          image: recipe.img,
        });
        recetteId = result.insertedId;
      } else {
        // Sinon, on récupère l'ID de la recette existante
        recetteId = existingRecipe._id;
      }
      for (const ingredient of recipe.ingredients) {
        const existingIngredient = await db
          .collection("ingredients")
          .findOne({ nom: ingredient.name });
        let ingredientId;
        if (!existingIngredient) {
          // Si l'ingrédient n'existe pas, on l'insère
          const ingredientResult = await db
            .collection("ingredients")
            .insertOne({ nom: ingredient.name });
          ingredientId = ingredientResult.insertedId;
        } else {
          // Sinon, on récupère l'ID de l'ingrédient existant
          ingredientId = existingIngredient._id;
        }

        // INSERTION DE LA LIAISON ENTRE LA RECETTE ET L'INGREDIENT
        await db
          .collection("ingredients_recettes")
          .insertOne({ recette_id: recetteId, ingredient_id: ingredientId });
      }
    }

    console.log(
      "Les recettes et les ingrédients ont été insérés avec succès dans la base de données!"
    );
  } catch (err) {
    console.error(`Erreur lors de la lecture du fichier JSON: ${err}`);
 
  } finally {
    await client.close();
  }
})();