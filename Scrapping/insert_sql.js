const mysql = require("mysql2/promise");
const recipes = require("./recipes.json")
const ingredientsList = require("./ingredients.json");
require('dotenv').config()

async function main() {
  // Créer une connexion à la base de données MySQL
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  // Vérifier si les ingrédients existent déjà en base de données
  const existingIngredients = new Set();
  const [rows, fields] = await connection.execute(
    "SELECT name FROM ingredients"
  );
  for (const row of rows) {
    existingIngredients.add(row.name.toLowerCase());
  }

  // Insérer les ingrédients dans la table 'ingredients'
  for (const ingredient of ingredientsList) {
    if (!existingIngredients.has(ingredient.toLowerCase())) {
      console.log(`Ingrédient : ${ingredient}`);
      const [rows, fields] = await connection.execute(
        "INSERT INTO ingredients (name) VALUES (?)",
        [ingredient]
      );
      const ingredientId = rows.insertId;
      console.log(`Ingrédient inséré : ${ingredient}, ID : ${ingredientId}`);
    }
  }

  // Vérifier si les recettes existent déjà en base de données
  const existingRecipes = new Set();
  const [rows2, fields2] = await connection.execute(
    "SELECT title FROM recipes"
  );
  for (const row of rows2) {
    existingRecipes.add(row.title.toLowerCase());
  }

  // Insérer les recettes dans la table 'recipes'
  for (const recipe of recipes) {
    if (!existingRecipes.has(recipe.title.toLowerCase())) {
      const [rows, fields] = await connection.execute(
        "INSERT INTO recipes (title, img, description) VALUES (?, ?, ?)",
        [recipe.title, recipe.img, recipe.desc]
      );
      const recipeId = rows.insertId; // Récupérer l'ID de la recette insérée
      console.log(`Recette insérée : ${recipe.title}, ID : ${recipeId}`);

      // Insérer les ingrédients de la recette dans la table 'recipe_ingredients'
      for (const ingredient of recipe.ingredients) {
        const [rows, fields] = await connection.execute(
          "SELECT id FROM ingredients WHERE name = ?",
          [ingredient.name]
        );
        const ingredientId = rows[0].id; // Récupérer l'ID de l'ingrédient dans la table 'ingredients'
        const [rows2, fields2] = await connection.execute(
          "INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES (?, ?, ?, ?)",
          [recipeId, ingredientId, ingredient.qt, ingredient.unit]
        );
        console.log(`Ingrédient de recette inséré : ${ingredient.name}`);
      }
    }
  }

  // Fermer la connexion à la base de données MySQL
  await connection.end();
}

main();