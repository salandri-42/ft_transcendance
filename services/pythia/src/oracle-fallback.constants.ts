export const ORACLE_FALLBACK_RESPONSES = [
    "Les étoiles murmurent, mais leurs voix sont trop faibles pour l'instant...",
    "Le destin est flou, les esprits sont fatigués. Reviens bientôt.",
    "L'Oracle se repose. Même les dieux ont besoin de silence.",
    "Les voiles du temps sont épais aujourd'hui. Patiente, voyageur.",
    "Le vent cosmique perturbe ma vision. Réessaie dans un instant.",
    "Les constellations sont en déplacement. Je ne peux lire clairement.",
    "L'éther vibre trop fort. Mes paroles seraient confuses.",
    "Le sanctuaire est en méditation. Reviens quand les astres s'aligneront.",
];

export function getRandomOracleResponse(): string
{
    const randomNb = Math.floor(Math.random() * ORACLE_FALLBACK_RESPONSES.length);
    return ORACLE_FALLBACK_RESPONSES[randomNb];
}