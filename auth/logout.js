import { pool } from "../db.js";

function parseCookies(req) {
  const raw = req.headers?.cookie;
  if (!raw) return {};
  return Object.fromEntries(raw.split(';').map(c => {
    const [k, v] = c.trim().split('=');
    return [k, decodeURIComponent(v)];
  }));
}

export async function logout(req, res) {
  try {
    const cookies = parseCookies(req);
    const refreshToken = cookies.refreshToken;
    if (refreshToken) {
      await pool.query("UPDATE refresh_tokens SET revoked = true WHERE token = $1", [refreshToken]);
    }

    // Borrar cookie
    res.cookie("refreshToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
    });

    res.json({ message: "Logged out" });
  } catch (err) {
    console.error("❌ Error en logout:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
}
