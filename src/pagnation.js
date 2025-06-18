/**
 * PAGINATION CHALLENGE
 * Part 1 - Pagination (GET /products)
 *      Update your GET /products endpoint to support:
 *          - pagination using page and limit query params
 *          - always return:
 *              - data: array of products
 *              - pagination: total count, current page, total pages
 *      *TIP: you'll need to calculate OFFSET and LIMIT in SQL
 */
import { Router } from "express";
import pool from "./db.js";

const router = Router();

router.get("/", async (req, res) => {
  const { category, sort, page, limit } = req.query;
  const sortOrder =
    sort.toLowerCase() === "asc" || sort.toLowerCase() === "desc"
      ? sort.toLowerCase()
      : "asc";
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  try {
    const totalProducts = await pool.query("SELECT COUNT(*) FROM products");
    const totalItems = totalProducts.rows[0].count;
    const totalPages = Math.ceil(totalItems / limit);

    let dynQuery = "SELECT * FROM products WHERE stock > 0";

    // Filter by category if query param exists
    if (category) {
      dynQuery += ` AND category = ${category.toLowerCase()}`;
    }

    // Add sorting to query
    dynQuery += ` ORDER BY price ${sortOrder}`;

    // Limit results if query param exists
    if (limit) {
      limitInt = parseInt(limit, 10);
      dynQuery += ` LIMIT ${limitInt}`;
    }

    // Offset results if query param exists
    if (page) {
      dynQuery += ` OFFSET ${offset}`;
    }
    const result = await pool.query(dynQuery);
    res.status(200).json({
      products: result.rows,
      currentPage: page,
      totalPages,
      totalItems,
    });
  } catch (err) {
    console.log("Error retrieving products", err);
    res.status(500).json({ error: err });
  }
});

export default router;
