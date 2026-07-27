import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db.js";
import verifyRoutes from "./routes/verify.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Basic rate limiting since each request triggers paid LLM/API calls
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api", limiter);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api", verifyRoutes);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});