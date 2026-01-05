import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import crypto from "crypto";

export async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Usuario y contraseña son requeridos" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }
    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // Access token (corto) y refresh token (largo)
    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" } // token corto
    );

    // Refresh token como string aleatorio almacenado en BD
    const refreshToken = crypto.randomBytes(64).toString("hex");
    const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días

    await pool.query(
      "INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)",
      [refreshToken, user.id, refreshExpiresAt]
    );

    // Enviamos refresh token como cookie httpOnly y devolvemos access token en la respuesta
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
    });

    const responsePayload = {
      token: accessToken, // compatibilidad con cliente existente
      userProfile: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        role: user.role,
        is_first_login: user.is_first_login,
      },
    };
    res.json(responsePayload);
  } catch (err) {
    console.error("❌ Error en login:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
}
