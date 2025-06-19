import { Router } from "express";
import { authenticateToken } from "./authMiddleware";

const router = Router();

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
      "INSERT INTO orders (user_id,product_id, quantity) VALUES ($1, $2, $3) RETURNING *",
      [req.user.id, productId, quantity]
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

export default router;
