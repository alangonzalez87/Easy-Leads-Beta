// server/auth/deleteUser.js
import { pool } from "../db.js";
import { supabase } from "../lib/supabase.js";


export async function deleteUser(req, res) {
  const { userId } = req.params;

  try {
    if (!userId) {
      return res.status(400).json({ error: "Falta userId" });
    }

    // 1) Eliminar leads en Supabase
    const { error: leadsError } = await supabase
      .from("leads")
      .delete()
      .eq("user_id", userId);

    if (leadsError) {
      console.error("❌ Error al eliminar leads en Supabase:", leadsError);
      return res
        .status(500)
        .json({ error: "No se pudieron eliminar los leads del usuario" });
    }

    // 2) Eliminar usuario en Postgres
    const result = await pool.query(
      `DELETE FROM users WHERE id = $1 RETURNING id, username`,
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error("❌ Error al eliminar usuario y leads:", err);
    res
      .status(500)
      .json({ error: "Error interno al eliminar usuario y sus leads" });
  }
}
