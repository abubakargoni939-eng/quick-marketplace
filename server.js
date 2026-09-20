import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/admin.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/shop.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "shop.html"));
});

app.get("/profile.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "profile.html"));
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    app: "Quick Marketplace"
  });
});

app.listen(PORT, () => {
  console.log(`Quick Marketplace running on port ${PORT}`);
});
