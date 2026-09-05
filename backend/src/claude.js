import Anthropic from "@anthropic-ai/sdk";

// Certaines clés API (liées à un compte avec plusieurs espaces de travail) exigent
// de préciser dans quel workspace la requête doit s'exécuter.
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  ...(process.env.ANTHROPIC_WORKSPACE_ID
    ? { defaultHeaders: { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID } }
    : {}),
});

// Modèle configurable via l'env (voir .env.example) pour pouvoir arbitrer précision
// vs coût sans redéployer. Haiku par défaut : ~3x moins cher que du Sonnet en entrée
// comme en sortie, largement suffisant a priori pour de l'extraction de champs courts
// (type, date, montant) sur un document assez structuré. À valider sur de vrais
// documents (voir README, section "Coûts") avant de s'y fier en prod ; repasse sur
// un Sonnet via ANTHROPIC_MODEL si la précision ne suit pas.
const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

const ANALYZE_TOOL = {
  name: "record_document_analysis",
  description: "Enregistre l'analyse structurée d'un document administratif.",
  // Le schéma ci-dessous est identique à chaque appel (tous utilisateurs, tous
  // scans confondus). Le marquer en cache évite de repayer plein tarif ces tokens
  // à chaque scan : 0.1x le prix normal tant que le cache reste chaud (5 min
  // glissantes, donc quasi toujours chaud dès qu'il y a un peu de trafic).
  cache_control: { type: "ephemeral" },
  input_schema: {
    type: "object",
    properties: {
      document_type: {
        type: "string",
        description: "Type de document, ex: 'Assurance habitation', 'Facture électricité', 'Avis d'imposition'",
      },
      urgency: {
        type: "string",
        enum: ["aucune_action", "a_surveiller", "action_necessaire"],
        description: "Niveau d'urgence : aucune_action (🟢), a_surveiller (🟠), action_necessaire (🔴)",
      },
      summary: {
        type: "string",
        description: "Résumé en langage simple et humain de ce que dit le document, 2-3 phrases maximum",
      },
      deadline: {
        type: ["string", "null"],
        description: "Date limite ou d'échéance au format JJ/MM/AAAA si présente, sinon null",
      },
      amount_eur: {
        type: ["number", "null"],
        description: "Montant en euros mentionné dans le document si applicable, sinon null",
      },
      recommended_action: {
        type: ["string", "null"],
        description: "Action recommandée à l'utilisateur en une phrase courte, sinon null si aucune action requise",
      },
      sender: {
        type: ["string", "null"],
        description: "Nom de l'expéditeur/organisme si identifiable",
      },
    },
    required: ["document_type", "urgency", "summary", "deadline", "amount_eur", "recommended_action", "sender"],
  },
};

export async function analyzeDocument({ base64Image, mediaType }) {
  const response = await client.messages.create({
    model: MODEL,
    // La sortie est un JSON structuré à 7 champs courts : 400 tokens couvrent
    // large. On n'est jamais facturé pour le maximum, seulement pour ce qui est
    // réellement généré, mais un plafond bas évite une facture qui déraperait en
    // cas de sortie anormalement longue.
    max_tokens: 400,
    tools: [ANALYZE_TOOL],
    tool_choice: { type: "tool", name: "record_document_analysis" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64Image },
          },
          {
            type: "text",
            text: "Analyse ce document administratif/courrier français. Extrais les informations demandées via l'outil record_document_analysis. Sois précis sur les dates et montants, et écris le résumé comme si tu expliquais à quelqu'un qui n'aime pas lire de paperasse.",
          },
        ],
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse) throw new Error("Aucune analyse structurée retournée par le modèle");
  return toolUse.input;
}

export async function askAboutDocument({ base64Image, mediaType, question, previousAnalysis }) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64Image },
            // Sur l'écran "Poser une question", la même photo peut être renvoyée
            // pour 2-3 questions d'affilée. La mettre en cache évite de repayer les
            // tokens image en entier à chaque question posée dans les 5 minutes.
            cache_control: { type: "ephemeral" },
          },
          {
            type: "text",
            text: `Voici le contexte déjà extrait de ce document : ${JSON.stringify(previousAnalysis)}.\n\nQuestion de l'utilisateur : ${question}\n\nRéponds en français, de façon simple et directe, en te basant sur le contenu du document.`,
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.text ?? "";
}

// Contrairement à analyzeDocument/askAboutDocument, on n'a pas besoin de renvoyer
// l'image ici : le résumé déjà extrait par /analyze suffit pour rédiger une réponse.
// Ça évite de re-uploader une photo à chaque fois (plus rapide, moins de risque de
// timeout sur une connexion faible, et moins cher en tokens vision).
export async function draftReply({ previousAnalysis, intent }) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 700,
    messages: [
      {
        role: "user",
        content: `Voici les informations déjà extraites de ce document administratif : ${JSON.stringify(previousAnalysis)}.\n\nRédige une lettre/email de réponse courte et professionnelle en français pour ce document, en te basant sur ces informations. Intention de l'utilisateur : ${intent || "répondre de façon appropriée à ce courrier"}.\n\nDonne uniquement le texte de la réponse, prêt à être copié.`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.text ?? "";
}
