import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

app.use(express.json());

// Serve Supabase settings before static files.
app.get("/config.js", (_req, res) => {
  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "";
  res.type("application/javascript").send(
    `window.QM_CONFIG=${JSON.stringify({ url, key })};`
  );
});

app.use(express.static(PUBLIC_DIR));

// Express 5 compatible fallback.
app.use((_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Quick Marketplace running on port ${PORT}`);
});
