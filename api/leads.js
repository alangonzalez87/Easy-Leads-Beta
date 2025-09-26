/*import express from "express";
import { supabase } from "../lib/supabase.js";
import jwt from "jsonwebtoken";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ error: "Token requerido" });

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(403).json({ error: "Token inválido o expirado" });
    }

    const userId = decoded.id;

    // Traer todos los leads del usuario
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error en Supabase:", error);
      return res.status(500).json({ error: "Error al obtener leads" });
    }

    res.json(data);
  } catch (err) {
    console.error("❌ Error general en /leads:", err);
    res.status(500).json({ error: "Error en el servidor", details: err.message });
  }
});

export default router;*/
