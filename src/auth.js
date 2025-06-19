// auth.js
import { Router } from "express";
import pool from "./db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(`SELECT * FROM users WHERE username = $1`, [
      username,
    ]);
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "User/username not found. Please try again." });
    }
    user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const payload = {
      id: user.id,
      username: user.username,
    };
    const secret = process.env.JWT_SECRET;
    const options = { expiresIn: "30m" };
    token = jwt.sign(payload, secret, options);
    res.status(200).json({ token });
  } catch (err) {
    console.log("Error logging in user.", err);
    res.status(500).json({ error: "Internal Server Error." });
  }
});

export default router;
