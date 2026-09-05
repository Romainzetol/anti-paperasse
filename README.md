# Anti-paperasse — MVP

"Prends ton courrier en photo. Je te dis ce que c'est, ce que tu dois faire et pour quand."

## Structure

- `backend/` — serveur Node/Express. Reçoit une photo, appelle Claude (vision) pour extraire
  et résumer l'information, sert 3 routes : `/analyze`, `/ask`, `/draft-reply`. C'est ici que
  vit la clé API Anthropic (jamais dans l'app mobile).
- `mobile/` — app Expo (React Native). 4 écrans : Accueil/Scanner, Analyse, Résultat, Question.
  Pas de librairie de navigation ni de backend BDD pour ce MVP : navigation par état React,
  historique stocké en local sur le téléphone (AsyncStorage).

## 1. Lancer le backend

```bash
cd backend
npm install          # déjà fait si tu viens de créer le projet
cp .env.example .env
```

Édite `.env` et remplace `ANTHROPIC_API_KEY` par ta propre clé (créée sur
https://console.anthropic.com/settings/keys).

```bash
npm run dev
```

Le serveur écoute sur `http://localhost:3000`. Vérifie avec :

```bash
curl http://localhost:3000/health
```

## 2. Lancer l'app mobile

Le téléphone (via l'app Expo Go) doit pouvoir joindre ton ordinateur sur le réseau local —
`localhost` ne fonctionne pas depuis un vrai téléphone.

1. Trouve l'adresse IP locale de ton ordinateur (Windows) :
   ```powershell
   ipconfig
   ```
   Cherche "Adresse IPv4" sous ta connexion Wi-Fi (ex: `192.168.1.23`).

2. Ouvre `mobile/src/config.js` et remplace l'IP par la tienne :
   ```js
   export const API_BASE_URL = "http://TON_IP:3000";
   ```

3. Assure-toi que ton téléphone est sur le **même réseau Wi-Fi** que ton ordinateur.

4. Lance l'app :
   ```bash
   cd mobile
   npm install       # déjà fait si tu viens de créer le projet
   npx expo start
   ```

5. Installe l'app **Expo Go** sur ton téléphone (App Store / Play Store), puis scanne le QR
   code affiché dans le terminal.

## 3. Déployer le backend en production (Render)

Le backend a besoin d'être accessible en permanence (pas juste sur ton PC) pour que
l'app publiée fonctionne. `backend/render.yaml` décrit le service pour un déploiement
en un clic sur Render (plan gratuit par défaut, 0€/mois — voir les contreparties dans
le fichier).

1. **Mettre le projet sur GitHub** (nécessaire pour que Render puisse déployer) :
   ```bash
   cd "D:\Claude AP"
   git init
   git add .
   git commit -m "Initial commit"
   gh repo create anti-paperasse --private --source=. --push
   ```
   (ou crée le repo à la main sur github.com puis `git remote add origin <url>` + `git push -u origin main`)

2. Crée un compte sur [render.com](https://render.com) (gratuit, carte bancaire pas
   obligatoire pour le plan free).

3. **New +** → **Blueprint** → connecte ton compte GitHub → sélectionne le repo
   `anti-paperasse`. Render détecte `backend/render.yaml` et propose la config.

4. Avant de valider, renseigne les variables marquées secrètes : `ANTHROPIC_API_KEY`,
   `ANTHROPIC_WORKSPACE_ID` (si besoin), `APP_SHARED_SECRET` (génère une valeur avec
   `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`).

5. Une fois déployé, Render donne une URL du type `https://anti-paperasse-backend.onrender.com`.
   Vérifie avec `https://.../health`, puis reporte cette URL et le même
   `APP_SHARED_SECRET` dans `mobile/src/config.js`.

6. Si le plan gratuit (service qui s'endort après 15 min d'inactivité) devient gênant
   une fois de vrais utilisateurs dessus, passe sur le plan payant (7$/mois, toujours
   actif) directement dans le dashboard Render — rien à changer côté code.

## Coûts

Le backend utilise par défaut **Claude Haiku** plutôt que Sonnet (`ANTHROPIC_MODEL` dans
`.env`, voir `.env.example`) : environ 3x moins cher en entrée comme en sortie, ce qui
devrait suffire pour de l'extraction de champs courts (type, date, montant) sur un
document assez structuré. **À valider sur 5-10 vrais documents avant de s'y fier en
prod** — si la précision ne suit pas, repasse sur un modèle Sonnet via cette même
variable, sans toucher au code.

Deux caches sont activés côté serveur (`backend/src/claude.js`) : le schéma de l'outil
d'analyse (identique à chaque scan) et la photo sur l'écran "poser une question"
(réutilisée d'une question à l'autre). Un cache lu coûte 10% du tarif normal.

`MAX_DAILY_CLAUDE_CALLS` (`.env`) plafonne le nombre d'appels à Claude par jour, tous
utilisateurs confondus — un filet de sécurité en attendant de vrais quotas par
utilisateur, pas une vraie limite par personne.

Redimensionner les photos avant envoi n'a pas d'effet sur ce coût : Claude redimensionne
déjà en interne les images trop grandes avant de les tarifer.

## Limites connues du MVP

- Pas de compte utilisateur, pas de synchronisation cloud — tout est local au téléphone.
- Pas de paiement / abonnement intégré (à ajouter avec RevenueCat ou Stripe plus tard).
- Les rappels sont des notifications locales programmées sur l'appareil (pas de serveur de
  notifications push).
- Avant tout lancement public : faire valider la conformité RGPD (données personnelles
  sensibles transitant par l'API Claude) par un professionnel du droit.

## Prochaines étapes suggérées

1. Tester avec 5-10 vrais documents (factures, assurances, courriers admin) et ajuster le
   prompt d'analyse dans `backend/src/claude.js` si les résultats manquent de précision.
2. Ajouter l'écran "Poser une question" en pièce jointe multi-tours si besoin (actuellement
   chaque question repart de zéro sans mémoire des échanges précédents côté serveur).
3. Ajouter le compteur freemium (3 documents/mois gratuits) une fois le concept validé.
