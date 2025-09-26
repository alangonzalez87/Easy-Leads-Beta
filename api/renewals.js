import express from "express";
import { supabase } from "../lib/supabase.js";

const router = express.Router();

// Configuración de la ventana (se puede ajustar más adelante o mover a config)
const DIAS_PASADOS = 5;
const DIAS_ADELANTE = 5;

router.get("/", async (req, res) => {
  try {
    const hoy = new Date();

    // Fechas límite
    const fechaInicio = new Date(hoy);
    fechaInicio.setDate(hoy.getDate() - DIAS_PASADOS);

    const fechaFin = new Date(hoy);
    fechaFin.setDate(hoy.getDate() + DIAS_ADELANTE);

    // Traemos leads desde Supabase
    const { data, error } = await supabase
      .from("leads")
      .select(
        "id, user_id, nombre, email, tel, tablero, estado, tiempo, fecha_finalizacion, vendedor"
      )
      .gte("fecha_finalizacion", fechaInicio.toISOString().split("T")[0]) // >= fechaInicio
      .lte("fecha_finalizacion", fechaFin.toISOString().split("T")[0]);   // <= fechaFin

    if (error) {
      console.error("❌ Error en Supabase:", error);
      return res.status(500).json({ error: "Error al consultar Supabase", details: error.message });
    }

    return res.json({ leads: data });
  } catch (err) {
    console.error("❌ Error en renewals API:", err);
    res.status(500).json({ error: "Error en el servidor", details: err.message });
  }
});

export default router;
