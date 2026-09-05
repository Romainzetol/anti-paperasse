import { API_BASE_URL, APP_SHARED_SECRET } from "./config";

function buildImageFormData(imageUri, extraFields = {}) {
  const form = new FormData();
  const filename = imageUri.split("/").pop() || "document.jpg";
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1] === "jpg" ? "jpeg" : match[1]}` : "image/jpeg";

  form.append("image", { uri: imageUri, name: filename, type });
  for (const [key, value] of Object.entries(extraFields)) {
    form.append(key, value);
  }
  return form;
}

// Sans timeout, un fetch qui ne reçoit jamais de réponse laisse l'appli bloquée sur
// "chargement..." indéfiniment. On force donc un échec propre après un délai pour que
// l'utilisateur voie une erreur claire plutôt qu'un spinner mort.
// Les requêtes avec image ont plus de marge que les requêtes texte pur (quelques
// centaines d'octets, ne devraient jamais traîner) : upload potentiellement lent,
// + le backend hébergé sur le plan gratuit de Render s'endort après 15 min sans
// trafic et met 30-50s à se réveiller sur la requête suivante (voir backend/render.yaml).
// Si ça arrive trop souvent une fois lancé, passer sur le plan payant de Render
// (toujours actif) réglera ça sans avoir à retoucher ce délai.
const IMAGE_REQUEST_TIMEOUT_MS = 60000;
const TEXT_REQUEST_TIMEOUT_MS = 20000;

async function timedFetch(path, options, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, signal: controller.signal });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Le serveur ne répond pas (délai dépassé). Vérifie ta connexion et réessaie.");
    }
    throw new Error("Impossible de contacter le serveur. Vérifie ta connexion et réessaie.");
  } finally {
    clearTimeout(timeoutId);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Réponse invalide du serveur.");
  }
  if (!response.ok) {
    throw new Error(data.error || "Erreur serveur");
  }
  return data;
}

function postForm(path, form) {
  return timedFetch(
    path,
    { method: "POST", body: form, headers: { "Content-Type": "multipart/form-data", "X-App-Secret": APP_SHARED_SECRET } },
    IMAGE_REQUEST_TIMEOUT_MS
  );
}

function postJson(path, body) {
  return timedFetch(
    path,
    { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json", "X-App-Secret": APP_SHARED_SECRET } },
    TEXT_REQUEST_TIMEOUT_MS
  );
}

export function analyzeDocument(imageUri) {
  return postForm("/analyze", buildImageFormData(imageUri));
}

export function askAboutDocument(imageUri, question, previousAnalysis) {
  return postForm(
    "/ask",
    buildImageFormData(imageUri, {
      question,
      previousAnalysis: JSON.stringify(previousAnalysis || {}),
    })
  );
}

// Contrairement à /analyze et /ask, la rédaction de réponse n'a pas besoin de revoir
// l'image : le résumé déjà extrait suffit. On envoie donc juste du texte (JSON léger),
// ce qui évite de re-uploader une photo de 1-3 Mo et rend cette action quasi instantanée
// même sur une connexion faible.
export function draftReply(intent, previousAnalysis) {
  return postJson("/draft-reply", { intent: intent || "", previousAnalysis: previousAnalysis || {} });
}
