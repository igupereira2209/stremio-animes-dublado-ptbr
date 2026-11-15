/**
 * lib/utils.js
 *
 * Função utilitária para transformar títulos em slugs
 * compatíveis com IDs do Stremio.
 */
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')   // substitui caracteres não alfanuméricos por hífen
    .replace(/-+/g, '-')         // elimina hífens repetidos
    .replace(/^-|-$/g, '');      // remove hífens no início/fim
}

module.exports = { normalizeTitle };