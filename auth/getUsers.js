// server/auth/getUsers.js
import { pool } from "../db.js";

export async function getUsers(req, res) {
  try {
    const result = await pool.query("SELECT id, username, display_name, role, is_first_login, created_at FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error("Error en getUsers:", err);
    res.status(500).json({ error: "No se pudieron obtener los usuarios" });
  }
}
export default getUsers;