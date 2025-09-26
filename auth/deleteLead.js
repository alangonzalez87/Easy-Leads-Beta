import { supabase } from "../lib/supabase.js";

export async function deleteLead(req, res) {
  const { id } = req.params; // 👈 id del lead

  try {
    if (!id) {
      return res.status(400).json({ error: "Falta id del lead" });
    }

    // 🔹 Eliminar en Supabase
    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("❌ Error al eliminar lead:", error);
      return res.status(500).json({ error: "No se pudo eliminar el lead" });
    }

    res.json({ success: true, id });
  } catch (err) {
    console.error("❌ Error interno al eliminar lead:", err);
    res.status(500).json({ error: "Error interno" });
  }
}
