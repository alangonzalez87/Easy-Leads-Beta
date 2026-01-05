import express from "express";
import { supabase } from "../lib/supabase.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Obtener precios configurados
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.user;
    console.log('Obteniendo precios para el usuario:', userId);

    const { data, error } = await supabase
      .from("prices")
      .select("*")
      .eq("user_id", userId);  // Filtro por usuario

    console.log('Datos obtenidos de Supabase:', data);
    if (error) {
      console.error("❌ Error obteniendo precios:", error);
      return res.status(500).json({ error: error.message });
    }
    res.json(data || []);
  } catch (err) {
    console.error("❌ Error obteniendo precios:", err.message);
    res.status(500).json({ error: "Error obteniendo precios" });
  }
});

// Actualizar precios - Ruta modificada a /api/update-prices
router.put("/update-prices", authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { items } = req.body;

    console.log('Datos recibidos para actualizar precios:', items);

    // Verificación: si items no es un array o está vacío, responde con error
    if (!Array.isArray(items) || items.length === 0) {
      console.log('Error: El array de precios está vacío o no es un array');
      return res.status(400).json({ error: "Debe enviar un array de precios." });
    }

    // Transformar los items
    const updatedItems = items.map((i) => ({
      user_id: userId,
      category: i.category,     // 'new' | 'renewal'
      plan: i.plan,             // 'monthly' | 'quarterly' | 'annual'
      price: Number(i.price),
      currency: i.currency || "ARS",
      updated_at: new Date().toISOString(),
    }));

    console.log('Items transformados para actualizar en Supabase:', updatedItems);

    // Realizar el upsert en Supabase
    const { data, error } = await supabase
      .from("prices")
      .upsert(updatedItems, { onConflict: ["user_id", "category", "plan"] })
      .select();

    if (error) {
      console.error("❌ Error al actualizar precios:", error);
      return res.status(500).json({ error: "Error actualizando precios" });
    }

    console.log('Precios actualizados correctamente:', data);
    res.json({ message: "Precios actualizados correctamente", data });
  } catch (err) {
    console.error("❌ Error actualizando precios:", err.message);
    res.status(500).json({ error: "Error actualizando precios" });
  }
});

export default router;
