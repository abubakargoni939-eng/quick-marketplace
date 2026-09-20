import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve everything inside public
app.use(express.static(path.join(__dirname, "public")));

// Home page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Admin page
app.get("/admin.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// Shop page
app.get("/shop.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "shop.html"));
});

// Profile page
app.get("/profile.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "profile.html"));
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    app: "Quick Marketplace"
  });
});

app.listen(PORT, () => {
  console.log(`Quick Marketplace running on port ${PORT}`);
});
