import express from "express";
import { supabase } from "../lib/supabase.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Registrar egreso (permite fecha opcional)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { category, amount, note, expense_date } = req.body;

    const { data, error } = await supabase
      .from("expenses") 
      .insert([{
        user_id: userId,
        category,
        amount,
        note,
        expense_date: expense_date || new Date().toISOString(), // Si no viene, usa hoy
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("❌ Error creando egreso:", err.message);
    res.status(500).json({ error: "Error creando egreso" });
  }
});

// Borrar egreso
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const expenseId = req.params.id;

    // Solo permite borrar gastos de ese usuario
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", expenseId)
      .eq("user_id", userId);

    if (error) throw error;
    res.status(200).json({ message: "Gasto eliminado" });
  } catch (err) {
    console.error("❌ Error eliminando egreso:", err.message);
    res.status(500).json({ error: "Error eliminando egreso" });
  }
});


// Listar egresos (permite filtros)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { from, to, category } = req.query;

    let query = supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId);

    if (from && to) {
      query = query.gte("expense_date", from).lte("expense_date", to);
    }

    if (category) {
      query = query.eq("category", category);
    }

    query = query.order("expense_date", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("❌ Error obteniendo egresos:", err.message);
    res.status(500).json({ error: "Error obteniendo egresos" });
  }
});

export default router;
