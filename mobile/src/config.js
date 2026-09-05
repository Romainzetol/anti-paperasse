// Backend hébergé sur Render (voir backend/render.yaml et README, section
// "Déploiement"). Plan gratuit : peut mettre 30-50s à répondre après une période
// d'inactivité (voir IMAGE_REQUEST_TIMEOUT_MS dans api.js) — passe sur le plan payant
// Render si ça devient gênant, sans avoir à retoucher cette valeur.
export const API_BASE_URL = "https://anti-paperasse.onrender.com";

// Doit correspondre à APP_SHARED_SECRET dans backend/.env. Protection basique contre
// l'abus de l'API (voir le commentaire dans backend/.env.example) — pas une vraie
// authentification, juste un filtre contre les appels directs non ciblés.
export const APP_SHARED_SECRET = "f0534c502d2f3548f43168c8e837811a5ec82c0155174850";
