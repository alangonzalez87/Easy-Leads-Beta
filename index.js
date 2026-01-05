import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { login } from "./auth/login.js";
import { createUser } from "./auth/createUser.js";
import userRouter from "./routes/user.js";
import multer from 'multer';
import { getUsers } from './auth/getUsers.js';
import leadsRouter from "./routes/leads.js";
import uploadCsvRouter from './api/upload-csv.js';
import renewalsRoutes from "./api/renewals.js";
import { resetPassword } from "./auth/resetPassword.js";
import { deleteUser } from "./auth/deleteUser.js";
import pricesRouter from "./routes/prices.js";
import salesRouter from "./routes/sales.js";
import expensesRouter from "./routes/expenses.js";
import { pool } from "./db.js";
import { refresh } from "./auth/refresh.js";
import { logout } from "./auth/logout.js";





dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173",  // URL de tu frontend local
  credentials: true,                // Si estás usando cookies o sesiones
}));
app.use("/api/user", userRouter);
// 🔹 Leads (todo centralizado en routes/leads.js)
app.use("/api/leads", leadsRouter);

// 🔹 Renovaciones
app.use("/api/renewals", renewalsRoutes);

// 🔹 Upload CSV
app.use('/api/upload-csv', uploadCsvRouter);

app.use("/api/prices", pricesRouter);
app.use("/api/sales", salesRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/prices", pricesRouter);


// 🔹 Auth
app.post("/auth/login", login);
app.post("/auth/create-user", createUser);
app.post("/auth/resetPassword", resetPassword);
app.delete("/auth/deleteUser/:userId", deleteUser);
app.post('/auth/refresh', refresh);
app.post('/auth/logout', logout);

// 🔹 Admin
app.get('/auth/getUsers', getUsers);

// Asegurarse de que la tabla de refresh tokens exista
const createRefreshTokensTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        token TEXT NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMP NOT NULL,
        revoked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ refresh_tokens table OK');
  } catch (err) {
    console.error('❌ Error creando refresh_tokens table', err);
  }
};
createRefreshTokensTable();


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Backend corriendo en puerto ${PORT}`);
});

