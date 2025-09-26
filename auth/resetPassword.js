// src/server/auth/resetPassword.js
import bcrypt from "bcrypt";
import { pool } from "../db.js";

export async function resetPassword(req, res) {
  const { userId } = req.body;

  try {
    if (!userId) {
      return res.status(400).json({ error: "Falta userId" });
    }

    const tempPassword = Math.random().toString(36).slice(-8);
    const password_hash = await bcrypt.hash(tempPassword, 10);

    const result = await pool.query(
      `UPDATE users 
       SET password_hash = $1, is_first_login = true
       WHERE id = $2
       RETURNING id, username, display_name, role, is_first_login`,
      [password_hash, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({
      ...result.rows[0],
      tempPassword, // 👉 devolvemos la nueva contraseña temporal
    });
  } catch (err) {
    console.error("Error en resetPassword:", err);
    res.status(500).json({ error: "No se pudo resetear la contraseña" });
  }
}
