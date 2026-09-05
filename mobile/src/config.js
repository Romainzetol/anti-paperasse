// En dev avec Expo Go sur un vrai téléphone, "localhost" pointe vers le téléphone
// lui-même, pas vers ton ordinateur. Remplace par l'adresse IP locale de ta machine
// (ex: 192.168.1.23), trouvable avec `ipconfig` (Windows) sur le même réseau Wi-Fi
// que ton téléphone. Garde le port 3000 (celui du backend).
export const API_BASE_URL = "https://merchandise-columns-msie-sustainability.trycloudflare.com";

// Doit correspondre à APP_SHARED_SECRET dans backend/.env. Protection basique contre
// l'abus de l'API (voir le commentaire dans backend/.env.example) — pas une vraie
// authentification, juste un filtre contre les appels directs non ciblés.
export const APP_SHARED_SECRET = "f0534c502d2f3548f43168c8e837811a5ec82c0155174850";
