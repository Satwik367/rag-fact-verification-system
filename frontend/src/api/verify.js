import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export async function verifyClaim(text, mode = "hybrid") {
  const res = await api.post("/verify", { text, mode });
  return res.data;
}

export async function verifyArticle(text, mode = "hybrid") {
  const res = await api.post("/verify-article", { text, mode });
  return res.data;
}

export async function getHistory() {
  const res = await api.get("/history");
  return res.data;
}
