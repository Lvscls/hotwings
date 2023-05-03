// Importation des dépendances
const express = require("express");
const mysql = require("mysql2/promise");
const bodyParser = require("body-parser");
const swaggerUi = require("swagger-ui-express");
require("dotenv").config();

// Création de l'application Express
const app = express();

// Middleware pour parser les requêtes HTTP avec JSON
app.use(bodyParser.json());

app.use("/doc", swaggerUi.serve, swaggerUi.setup(require("./swagger.json")));

// Configuration de la connexion à la base de données MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

// Route pour récupérer toutes les recettes
app.get("/recipes", async (req, res) => {
  const query = "SELECT * FROM recipes";
  try {
    const [results] = await pool.execute(query);
    res.json(results);
  } catch (error) {
    throw error;
  }
});

// Route pour récupérer une recette par son nom
app.get("/recipes/title/:name", async (req, res) => {
  const encodedName = req.params.name; // Nom de recette encodé avec %20
  const name = decodeURIComponent(encodedName); // Décoder le nom de recette
  const query = `
        SELECT *
        FROM recipes
        WHERE title = ?
    `;
  try {
    const [results] = await pool.execute(query, [name]);
    res.json(results);
  } catch (error) {
    throw error;
  }
});

// Route pour récupérer une seule recette par son identifiant
app.get("/recipes/:id", async (req, res) => {
  const id = req.params.id;
  const query = "SELECT * FROM recipes WHERE id = ?";
  try {
    const [results] = await pool.execute(query, [id]);
    res.json(results);
  } catch (error) {
    throw error;
  }
});
// Route pour récupérer les recettes pour un ingrédient donné
app.get("/recipes/ingredient/:ingredient", async (req, res) => {
  const encodedIngredient = req.params.ingredient; // Nom d'ingrédient encodé avec %20
  const ingredient = decodeURIComponent(encodedIngredient); // Décoder le nom d'ingrédient
  const query = `
        SELECT r.*
        FROM recipes r
        INNER JOIN recipe_ingredients ri ON r.id = ri.recipe_id
        INNER JOIN ingredients i ON ri.ingredient_id = i.id
        WHERE i.name = ?
    `;
  try {
    const [results] = await pool.execute(query, [ingredient]);
    res.json(results);
  } catch (error) {
    throw error;
  }
});

// Route pour récupérer les ingrédients d'une recette avec leur quantité et unité
app.get("/recipes/:id/ingredients", async (req, res) => {
  const id = req.params.id;
  const query = `
      SELECT ri.quantity, ri.unit, i.name AS ingredient_name
      FROM recipe_ingredients ri
      INNER JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE ri.recipe_id = ?`;
  try {
    const [results] = await pool.execute(query, [id]);
    res.json(results);
  } catch (error) {
    throw error;
  }
});
app.get("/recipes/:id_recette/details", async (req, res) => {
  const id_recette = req.params.id_recette;
  const query = `
        SELECT r.title, r.description, r.img, GROUP_CONCAT(i.name) AS ingredients
        FROM recipes r
        INNER JOIN recipe_ingredients ri ON r.id = ri.recipe_id
        INNER JOIN ingredients i ON ri.ingredient_id = i.id
        WHERE r.id = ?
        GROUP BY r.title, r.description, r.img`;
  try {
    const [results] = await pool.execute(query, [id_recette]);
    res.json(results);
  } catch (error) {
    throw error;
  }
});

// Route pour récupérer tous les ingrédients
app.get("/ingredients", async (req, res) => {
  const query = "SELECT * FROM ingredients";
  try {
    const [results] = await pool.execute(query);
    res.json(results);
  } catch (error) {
    throw error;
  }
});

// Port d'écoute de l'API
const port = 3000; // Remplacez par le port de votre choix
app.listen(port, () => {
  console.log(`API écoute sur le port ${port}`);
});
