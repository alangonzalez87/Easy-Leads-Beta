import jwt from "jsonwebtoken";
import crypto from "crypto";
import { pool } from "../db.js";

const ACCESS_TOKEN_EXPIRES_IN = "8h";
const REFRESH_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function parseCookies(req) {
  const raw = req.headers?.cookie;
  if (!raw) return {};
  return Object.fromEntries(raw.split(';').map(c => {
    const [k, v] = c.trim().split('=');
    return [k, decodeURIComponent(v)];
  }));
}

export async function refresh(req, res) {
  try {
    const cookies = parseCookies(req);
    const refreshToken = cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ error: "Refresh token requerido" });

    const result = await pool.query("SELECT * FROM refresh_tokens WHERE token = $1", [refreshToken]);
    if (result.rows.length === 0) return res.status(403).json({ error: "Refresh token inválido" });

    const tokenRow = result.rows[0];
    if (tokenRow.revoked) return res.status(403).json({ error: "Refresh token revocado" });
    if (new Date(tokenRow.expires_at) < new Date()) return res.status(403).json({ error: "Refresh token expirado" });

    // Rotación: revocar token usado y crear uno nuevo
    await pool.query("UPDATE refresh_tokens SET revoked = true WHERE id = $1", [tokenRow.id]);

    const newRefreshToken = crypto.randomBytes(64).toString("hex");
    const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS); // 30 días
    await pool.query(
      "INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)",
      [newRefreshToken, tokenRow.user_id, newExpiresAt]
    );

    const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [tokenRow.user_id]);
    if (userResult.rows.length === 0) return res.status(403).json({ error: "Usuario no encontrado" });

    const user = userResult.rows[0];
    const tokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
      ...(user.email ? { email: user.email } : {}),
    };

    const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });

    res.json({ token: accessToken });
  } catch (err) {
    console.error("❌ Error en refresh:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
}
