import express from "express";
import multer from "multer";
import { parse } from "csv-parse";
import { supabase } from "../lib/supabase.js";
import fs from "fs";
import jwt from "jsonwebtoken";
import validator from "validator"; // 👈 usamos validator

function parseFecha(fechaStr) {
  if (!fechaStr) return null;

  const clean = fechaStr.trim();

  if (clean.toUpperCase() === "N/A" || clean === "") {
    return null;
  }

  const partes = clean.includes("/") ? clean.split("/") : clean.split("-");
  if (partes.length === 3) {
    let [dd, mm, yyyy] = partes;
    dd = dd.padStart(2, "0");
    mm = mm.padStart(2, "0");

    if (yyyy && yyyy.length === 4) {
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  return null;
}

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("csv"), async (req, res) => {
  try {
    // 1. Validar token
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

    if (!req.file)
      return res.status(400).json({ error: "No se recibió ningún archivo CSV." });

    const filePath = req.file.path;
    const results = [];
    const invalidRows = []; // 👈 acumulamos errores

    fs.createReadStream(filePath)
      .pipe(parse({ columns: true, trim: true }))
      .on("data", (row) => {
        const email = row["Email"] || row["email"] || null;
        const fecha_finalizacion = parseFecha(row["Finaliza Dia"]);

        // Validamos email
        if (!email || !validator.isEmail(email.trim())) {
          invalidRows.push({
            row,
            reason: "Email inválido o faltante",
          });
          return;
        }

        // Validamos fecha
        if (!fecha_finalizacion) {
          invalidRows.push({
            row,
            reason: "Fecha inválida o faltante",
          });
          return;
        }

        // Si pasa validaciones → lo guardamos
        results.push({
          user_id: userId,
          nombre: row["Nombre"] || row["nombre"] || null,
          email: email.trim().toLowerCase(),
          tel: row["Tel (Si aplica)"] || row["Tel"] || null,
          estado: row["estado"] || row["Estado"] || null,
          vendedor: row["vendedor"] || row["Vendedor"] || null,
          tablero: row["Tablero"] || row["tablero"] || null,
          tiempo: row["Tiempo"] || row["tiempo"] || null,
          fecha_finalizacion,
        });
      })
      .on("end", async () => {
        fs.unlinkSync(filePath);

        if (results.length === 0) {
          return res.status(400).json({
            error: "No se pudo cargar ningún lead válido.",
            invalidRows,
          });
        }

        // Insertar en Supabase
        const { data, error } = await supabase.from("leads").insert(results);

        if (error) {
          console.error("❌ Error al insertar en Supabase:", error);
          return res.status(500).json({
            error: "Error al guardar en Supabase",
            details: error,
          });
        }

        console.log(`✅ ${results.length} leads insertados con user_id=${userId}`);
        res.json({
          message: "Carga finalizada",
          inserted: results.length,
          invalid: invalidRows.length,
          invalidRows,
        });
      })
      .on("error", (err) => {
        fs.unlinkSync(filePath);
        res
          .status(500)
          .json({ error: "Error al procesar el archivo CSV", details: err.message });
      });
  } catch (err) {
    console.error("❌ Error general en upload-csv:", err);
    res
      .status(500)
      .json({ error: "Error en el servidor", details: err.message });
  }
});

export default router;
