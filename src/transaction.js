/**
 * TRANSACTION CHALLENGE
 * Part 2 - Transactional Order Placement (POST /orders)
 *      Modify your existing order placement route to:
 *          - Full wrap the stock-check and stock-update logic inside a single transaction
 *          - Prevent race conditions (stock overselling)
 *          - Use BEGIN, COMMIT, ROLLBACK
 */
import { Router } from "express"; // import Router class from express package
import pool from "./db.js"; // insert pool connection from db config file
const router = Router();

// authenticate middleware to check logged in user
router.post("/", authenticateToken, async (req, res) => {
  const client = await pool.connect();
  const productId = parseInt(req.body.product_id, 10);
  const quantity = parseInt(req.body.quantity, 10);

  try {
    // Begin transaction for creating an order
    await client.query("BEGIN");
    // Check to see if the product exists
    const doesProductExit = await client.query(
      "SELECT * FROM products WHERE id = $1",
      [productId]
    );
    if (doesProductExit.rows.length == 0) {
      await client.query("ROLLBACK"); // Rollback transaction on error
      return res.status(404).json({ error: "Product not found." });
    }
    // Check to see if product has enough stock
    if (doesProductExit.rows[0].stock < quantity) {
      await client.query("ROLLBACK"); // Rollback transaction on error
      return res.status(400).json({
        error: "Bad Request. Insufficient stock. Please try again.",
      });
    }
    const updatedStock = parseInt(doesProductExit.rows[0].stock, 10) - quantity;

    await client.query("UPDATE products SET stock = $1 WHERE id = $2", [
      updatedStock,
      productId,
    ]);
    const result = await client.query(
      "INSERT INTO orders (product_id, quantity) VALUES ($1, $2) RETURNING *",
      [productId, quantity]
    );

    //Complete transaction
    await client.query("COMMIT");
    res.status(201).json({
      message: "Order successfully created.",
      newOrder: result.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK"); // Rollback transaction on error
    console.log("Error: ", err);
    res.status(500).json({ error: "Internal Service Error" });
  } finally {
    client.release();
  }
});
