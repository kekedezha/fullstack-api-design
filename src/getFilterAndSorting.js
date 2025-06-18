/**
 * Mini Challenge: GET products with filtering and sorting
 * Objective:
 *      Build a GET /products endpoint with the following features:
 *          - Return all products that are in stock (quantity > 0)
 *          - Allow optional query parameters:
 *              - category: to filter by category
 *              - sort: to sort by price, can be asc or desc
 *          - Return results in proper JSON format
 */
import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
  let { category, sort } = req.query; //get query params
  try {
    if (category && sort) {
      const result = await pool.query(
        `
            SELECT * 
            FROM products 
            WHERE category = $1 
            ORDER BY $2`,
        [category.toLowerCase, sort.toUpperCase]
      );
      return res.status(200).json(result.rows);
    } else if (category && !sort) {
      const result = await pool.query(
        `
            SELECT * 
            FROM products 
            WHERE category = $1`,
        [category.toLowerCase]
      );
      return res.status(200).json(result.rows);
    } else if (!category && sort) {
      const result = await pool.query(
        `
            SELECT * 
            FROM products 
            ORDER BY $1`,
        [sort.toUpperCase]
      );
      return res.status(200).json(result.rows);
    } else {
      const result = await pool.query(`
            SELECT * 
            FROM products`);
      return res.status(200).json(result.rows);
    }
  } catch (err) {
    console.log("Error retrieving products.");
    res.status(500).json({ error: err });
  }
});

export default router;
