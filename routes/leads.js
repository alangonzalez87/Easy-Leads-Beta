import express from "express";
import { supabase } from "../lib/supabase.js";
import jwt from "jsonwebtoken";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();



// ----------------------------------------------------------------------
// GET /api/leads → listar todos los leads del usuario autenticado
// ----------------------------------------------------------------------
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.user;

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

// ----------------------------------------------------------------------
// POST /api/leads → agregar un lead nuevo
// ----------------------------------------------------------------------
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { nombre, email, tel, tablero, estado, tiempo, fecha_finalizacion, vendedor } = req.body;

    if (!email || !tablero || !tiempo || !fecha_finalizacion) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    const { data, error } = await supabase
      .from("leads")
      .insert([
        {
          user_id: userId,
          nombre,
          email,
          tel,
          tablero,
          estado,
          tiempo,
          fecha_finalizacion,
          vendedor,
          pipeline_stage: "leads", // default al crear
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("❌ Error insertando lead:", error);
      return res.status(500).json({ error: "Error insertando lead" });
    }

    res.json(data);
  } catch (err) {
    console.error("❌ Error general al agregar lead:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// ----------------------------------------------------------------------
// PUT /api/leads/:id → editar un lead existente
// ----------------------------------------------------------------------
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user;
    const { nombre, email, tel, tablero, estado, tiempo, fecha_finalizacion, vendedor, pipeline_stage } = req.body;

    const { data, error } = await supabase
      .from("leads")
      .update({
        nombre,
        email,
        tel,
        tablero,
        estado,
        tiempo,
        fecha_finalizacion,
        vendedor,
        pipeline_stage,
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("❌ Error actualizando lead:", error);
      return res.status(500).json({ error: "Error actualizando lead" });
    }

    res.json(data);
  } catch (err) {
    console.error("❌ Error general al actualizar lead:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// ----------------------------------------------------------------------
// DELETE /api/leads/:id → eliminar un lead
// ----------------------------------------------------------------------
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user;

    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("❌ Error eliminando lead:", error);
      return res.status(500).json({ error: "Error eliminando lead" });
    }

    res.json({ message: "Lead eliminado ✅" });
  } catch (err) {
    console.error("❌ Error general al eliminar lead:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

export default router;
