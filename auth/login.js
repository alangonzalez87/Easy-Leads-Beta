import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

export async function login(req, res) {
  const { username, password } = req.body;
  console.log("🟢 [Console 1] login.js recibe:", { username, password });

  if (!username || !password) {
    return res.status(400).json({ error: "Usuario y contraseña son requeridos" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );
    console.log("🟢 [Console 2] Resultado query:", result.rows);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    console.log("🟢 [Console 3] Usuario encontrado:", user);

    if (!isValid) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const responsePayload = {
      token,
      userProfile: {
        id: user.id, // 👈 aseguramos que se mande
        username: user.username,
        display_name: user.display_name,
        role: user.role,
        is_first_login: user.is_first_login,
      },
    };

    console.log("🟢 [Console 4] login.js responde con:", responsePayload);

    res.json(responsePayload);
  } catch (err) {
    console.error("❌ Error en login:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
}
