const { Addon } = require('stremio-addon-sdk');
const { fetchCatalog } = require('./lib/providers');
const manifest = require('./manifest.json');

const addon = new Addon(manifest);

/* ------------------------------------------------------------------
 *  1. Catalogo
 * ------------------------------------------------------------------ */
addon.on('catalog', async (args) => {
  const { type, id, extra } = args;

  if (type !== 'series' || id !== 'ptbr-dubbed') return null;

  const source = extra?.source;
  if (!source) {
    return { metas: [] };
  }

  try {
    const metas = await fetchCatalog(source);
    return { metas };
  } catch (err) {
    console.error('Erro ao gerar catálogo:', err.message);
    return { metas: [] };
  }
});

/* ------------------------------------------------------------------
 *  2. Meta (informações detalhadas)
 * ------------------------------------------------------------------ */
addon.on('meta', async (args) => {
  const { type, id } = args;

  if (type !== 'series') return null;

  // Em produção, busque detalhes reais da fonte.
  // Aqui devolvemos dados fictícios baseados no id.
  return {
    id,
    name: id.replace(/-/g, ' '),
    type: 'series',
    poster: `https://i.imgur.com/poster_${id}.jpg`,
    background: `https://i.imgur.com/bg_${id}.jpg`,
    description: `Detalhes do anime ${id}`,
    genres: ['Anime', 'Dublado', 'PT-BR'],
    episodes: [] // será preenchido em stream
  };
});

/* ------------------------------------------------------------------
 *  3. Stream (link de vídeo)
 * ------------------------------------------------------------------ */
addon.on('stream', async (args) => {
  const { type, id, videoID } = args;

  if (type !== 'series') return null;

  // Em produção, a função deveria buscar a URL real do vídeo.
  // Para fins de demonstração, devolvemos um link fictício.
  return {
    streams: [
      {
        name: `Episódio 1 - Dublado PT-BR`,
        description: `Assista ao episódio 1 dublado em português do Brasil`,
        infoHash: null,
        videoID: videoID,
        ytid: null,
        url: `https://example.com/stream/${id}/${videoID}`,
        behaviorHints: {
          proxyHeaders: { request: { geoBypass: true } },
          notWebReady: false
        }
      }
    ]
  };
});

/* ------------------------------------------------------------------
 *  4. Iniciar o servidor
 * ------------------------------------------------------------------ */
const PORT = process.env.PORT || 7000;
addon.listen(PORT).then(() => {
  console.log(`Addon "${manifest.name}" está rodando em http://localhost:${PORT}/manifest.json`);
});