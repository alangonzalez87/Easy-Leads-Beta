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

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/user", userRouter);
// 🔹 Leads (todo centralizado en routes/leads.js)
app.use("/api/leads", leadsRouter);

// 🔹 Renovaciones
app.use("/api/renewals", renewalsRoutes);

// 🔹 Upload CSV
app.use('/api/upload-csv', uploadCsvRouter);

// 🔹 Auth
app.post("/auth/login", login);
app.post("/auth/create-user", createUser);
app.post("/auth/resetPassword", resetPassword);
app.delete("/auth/deleteUser/:userId", deleteUser);

// 🔹 Admin
app.get('/auth/getUsers', getUsers);
git commit -

app.listen(process.env.PORT || 3000, () => {
  console.log("✅ Backend corriendo en http://localhost:3000");
});
