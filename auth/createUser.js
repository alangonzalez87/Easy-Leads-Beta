// src/server/auth/createUser.js
import bcrypt from "bcrypt";
import { pool } from "../db.js";

export async function createUser(req, res) {
  const { username, tempPassword, role, display_name } = req.body;

  try {
    if (!username || !tempPassword) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    const password_hash = await bcrypt.hash(tempPassword, 10);

    const result = await pool.query(
      `INSERT INTO users (username, password_hash, role, display_name) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, username, display_name, role, is_first_login`,
      [username, password_hash, role || "user", display_name || username]
    );

    res.json({
      ...result.rows[0],
      tempPassword,
    });
  } catch (err) {
    
    res.status(500).json({ error: "No se pudo crear el usuario" });
  }
}
