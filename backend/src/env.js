import dotenv from "dotenv";

// override: true car cet environnement définit déjà une variable ANTHROPIC_API_KEY
// vide au niveau système, qui bloquerait sinon la vraie valeur du fichier .env.
// Ce fichier doit être importé en tout premier dans server.js (avant claude.js)
// pour que process.env soit rempli avant que le client Anthropic ne soit créé.
dotenv.config({ override: true });
