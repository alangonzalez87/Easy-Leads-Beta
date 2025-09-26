import express from "express";
import { pool } from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();

// Middleware para validar JWT (cualquier usuario)
function isAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "Token requerido" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token inválido" });
    req.user = user; // contiene id, username, role
    next();
  });
}

// Middleware para validar JWT y rol admin
function isAdmin(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "Token requerido" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token inválido" });
    if (user.role !== "admin") return res.status(403).json({ error: "Solo admin" });
    req.user = user;
    next();
  });
}

// ----------------------------------------------------------------------
// 🔹 GET /users → listar todos los usuarios (solo admin)
// ----------------------------------------------------------------------
router.get("/", isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, display_name, role, is_first_login, created_at FROM users ORDER BY id ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error listando usuarios:", err);
    res.status(500).json({ error: "Error listando usuarios" });
  }
});

// ----------------------------------------------------------------------
// 🔹 DELETE /users/:id → eliminar usuario (solo admin)
// ----------------------------------------------------------------------
router.delete("/:id", isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    res.json({ message: "Usuario eliminado ✅" });
  } catch (err) {
    console.error("Error eliminando usuario:", err);
    res.status(500).json({ error: "Error eliminando usuario" });
  }
});

// ----------------------------------------------------------------------
// 🔹 POST /users/reset-password → resetear contraseña (solo admin)
// ----------------------------------------------------------------------
router.post("/reset-password", isAdmin, async (req, res) => {
  const { username, tempPassword } = req.body;

  if (!username || !tempPassword) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  try {
    const password_hash = await bcrypt.hash(tempPassword, 10);

    await pool.query(
      "UPDATE users SET password_hash = $1, is_first_login = true WHERE username = $2",
      [password_hash, username]
    );

    res.json({ message: "Contraseña reseteada ✅" });
  } catch (err) {
    console.error("Error reseteando contraseña:", err);
    res.status(500).json({ error: "Error reseteando contraseña" });
  }
});

// ----------------------------------------------------------------------
// 🔹 PUT /users/change-password → usuario cambia su propia contraseña
// ----------------------------------------------------------------------
router.put("/change-password", isAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    // 1. Buscar hash actual
    const userResult = await pool.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [userId]
    );
    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // 2. Comparar contraseñas
    const valid = await bcrypt.compare(oldPassword, userResult.rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Contraseña actual incorrecta" });
    }

    // 3. Hashear nueva contraseña
    const password_hash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      "UPDATE users SET password_hash = $1, is_first_login = false WHERE id = $2",
      [password_hash, userId]
    );

    res.json({ message: "✅ Contraseña cambiada con éxito" });
  } catch (err) {
    console.error("Error cambiando contraseña:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

export default router;
