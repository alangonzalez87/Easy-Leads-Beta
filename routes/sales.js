import express from "express";
import { supabase } from "../lib/supabase.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Registrar nueva venta
// Endpoint para registrar la venta con el precio correspondiente al plan


router.post("/", authMiddleware, async (req, res) => {
  try {
    
    let { lead_id, plan, kind, amount } = req.body;  // Recibimos el plan y el tipo de venta
    const { id: userId } = req.user;
    

    // Convertimos el plan de 30, 90, 365 a monthly, quarterly, annual
    if (plan === "30") plan = "monthly";
    if (plan === "90") plan = "quarterly";
    if (plan === "365") plan = "annual";

    te

    let category = kind === "new" ? "new" : "renewal";  // Si 'kind' es 'new', la categoría es 'new', sino 'renewal'
    
    // Verificamos si el plan es válido
    if (!["monthly", "quarterly", "annual"].includes(plan)) {
      return res.status(400).json({ error: "Plan inválido" });
    }

    // Obtener el precio del plan seleccionado desde la tabla 'prices'
    const { data: priceData, error: priceError } = await supabase
      .from("prices")
      .select("price")
      .eq("plan", plan)  // Aquí buscamos el plan 'monthly', 'quarterly', 'annual'
      .eq("category", category)
      .limit(1) 
      .single();

    // Si no se encuentra el precio, respondemos con un error
    if (priceError || !priceData) {
      
      return res.status(400).json({ error: "Plan no encontrado en precios" });
    }

    const price = priceData.price;  // El precio del plan
    

    // Insertamos la venta en la tabla 'sales' con el precio obtenido
    const { data, error } = await supabase
      .from("sales")
      .insert([{
        user_id: userId,
        lead_id,
        plan,
        kind,
        amount: price,  // Usamos el precio del plan
        created_at: new Date().toISOString(),
        sale_date: new Date().toISOString(),  // Fecha de la venta
      }])
      .select()
      .single();

    if (error) {
      
      throw error;
    }

    res.json(data);  // Retornamos los datos de la venta registrada

  } catch (err) {
    console.error("❌ Error creando venta:", err.message);
    res.status(500).json({ error: "Error creando venta" });
  }
});


// Métricas de ventas
router.get("/metrics", authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const range = req.query.range || "month"; // day | week | month

    let since = new Date();
    if (range === "day") since.setDate(since.getDate() - 1);
    if (range === "week") since.setDate(since.getDate() - 7);
    if (range === "month") since.setMonth(since.getMonth() - 1);

    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", since.toISOString());

    if (error) throw error;

    // Agregados simples
    const total = data.reduce((sum, s) => sum + s.amount, 0);
    const byPlan = { monthly: 0, quarterly: 0, annual: 0 };
    const byKind = { new: 0, renewal: 0 };

    data.forEach((s) => {
      if (byPlan[s.plan] !== undefined) byPlan[s.plan] += s.amount;
      if (byKind[s.kind] !== undefined) byKind[s.kind] += s.amount;
    });

    res.json({ total, count: data.length, byPlan, byKind });
  } catch (err) {
    console.error("❌ Error obteniendo métricas de ventas:", err.message);
    res.status(500).json({ error: "Error obteniendo métricas" });
  }
});

export default router;
