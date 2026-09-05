import "./env.js";
import express from "express";
import cors from "cors";
import multer from "multer";
import rateLimit from "express-rate-limit";
import { analyzeDocument, askAboutDocument, draftReply } from "./claude.js";

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

// Nécessaire derrière un reverse proxy (Render, Railway, Cloudflare...) pour que
// express-rate-limit voie la vraie IP du client via X-Forwarded-For plutôt que
// celle du proxy (sinon tout le monde partage la même limite, ou pire, aucune IP
// fiable n'est disponible et le rate-limiter refuse de démarrer).
app.set("trust proxy", 1);

app.use(cors());
app.use(express.json({ limit: "20mb" }));

// Filet de sécurité basique contre l'abus de l'API Claude (qui coûte de l'argent à
// chaque appel) : un secret partagé embarqué dans l'appli mobile, + une limite de
// débit par IP. Ce n'est pas une vraie authentification (voir .env.example) — juste
// de quoi bloquer les abus non ciblés en attendant un vrai système de comptes/quotas.
const appSecret = process.env.APP_SHARED_SECRET;
if (!appSecret) {
  console.warn("⚠️  APP_SHARED_SECRET n'est pas défini : l'API est ouverte à tout le monde sans protection.");
}

function requireAppSecret(req, res, next) {
  if (!appSecret) return next();
  if (req.get("X-App-Secret") !== appSecret) {
    return res.status(401).json({ error: "Non autorisé" });
  }
  next();
}

const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de requêtes, réessaie plus tard." },
});

// Coupe-circuit temporaire contre une facture Claude qui déraperait (bug, boucle,
// clé/secret qui aurait fuité) tant qu'il n'y a pas de vrais comptes + quotas par
// utilisateur. Compteur en mémoire remis à zéro chaque jour : ce n'est pas une
// vraie protection long terme (perdu au redémarrage, partagé entre tous les
// utilisateurs), juste un filet de sécurité en attendant mieux.
const MAX_DAILY_CLAUDE_CALLS = Number(process.env.MAX_DAILY_CLAUDE_CALLS) || 200;
let dailyCallCount = 0;
let dailyResetAt = nextMidnight();

function nextMidnight() {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

function checkDailyBudget(_req, res, next) {
  if (Date.now() >= dailyResetAt) {
    dailyCallCount = 0;
    dailyResetAt = nextMidnight();
  }
  if (dailyCallCount >= MAX_DAILY_CLAUDE_CALLS) {
    return res.status(429).json({ error: "Limite quotidienne d'appels à Claude atteinte, réessaie demain." });
  }
  dailyCallCount += 1;
  next();
}

app.use(["/analyze", "/ask", "/draft-reply"], requireAppSecret, apiLimiter, checkDailyBudget);

function imageFromRequest(req) {
  const base64Image = req.file.buffer.toString("base64");
  const mediaType = req.file.mimetype;
  return { base64Image, mediaType };
}

app.post("/analyze", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Aucune image reçue" });
    const analysis = await analyzeDocument(imageFromRequest(req));
    res.json(analysis);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Échec de l'analyse", details: err.message });
  }
});

app.post("/ask", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Aucune image reçue" });
    const { question, previousAnalysis } = req.body;
    if (!question) return res.status(400).json({ error: "Question manquante" });
    const answer = await askAboutDocument({
      ...imageFromRequest(req),
      question,
      previousAnalysis: previousAnalysis ? JSON.parse(previousAnalysis) : null,
    });
    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Échec de la réponse", details: err.message });
  }
});

// Pas de multer ici : contrairement à /analyze et /ask, cette route n'a pas besoin
// d'une image, juste du résumé déjà extrait (JSON léger via express.json()).
app.post("/draft-reply", async (req, res) => {
  try {
    const { intent, previousAnalysis } = req.body;
    const reply = await draftReply({ intent, previousAnalysis: previousAnalysis || null });
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Échec de la rédaction", details: err.message });
  }
});

app.get("/health", (_req, res) => res.json({ ok: true }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Backend anti-paperasse en écoute sur http://localhost:${port}`));
