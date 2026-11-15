/**
 * lib/providers.js
 *
 * Cada função abaixo coleta animes dublados em PT‑BR de uma fonte oficial.
 * O retorno é um array de objetos no formato exigido pelo Stremio:
 * {
 *   id, name, poster, background, type, genres,
 *   description, behaviorHints
 * }
 *
 * Todas as requisições têm retry (3 tentativas) e tratamento de erro
 * com mensagens específicas.
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { normalizeTitle } = require('./utils');

/* ------------------------------------------------------------------
 *  Auxiliar: retry de requisição HTTP
 * ------------------------------------------------------------------ */
async function fetchWithRetry(url, options = {}, retries = 3, backoff = 1000) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, options);
      return response;
    } catch (err) {
      if (attempt === retries) {
        throw new Error(`Falha ao acessar ${url} após ${retries + 1} tentativas: ${err.message}`);
      }
      await new Promise(r => setTimeout(r, backoff * Math.pow(2, attempt)));
    }
  }
}

/* ------------------------------------------------------------------
 *  1. Crunchyroll Brasil
 * ------------------------------------------------------------------ */
async function fetchCrunchyroll() {
  const url = 'https://www.crunchyroll.com/pt-br/anime';
  const { data } = await fetchWithRetry(url);

  const $ = cheerio.load(data);
  const animes = [];

  /* Cada bloco de anime tem a classe 'airing' */
  $('div.airing').each((i, el) => {
    const name = $(el).find('a').text().trim();
    const href = $(el).find('a').attr('href');
    const img = $(el).find('img').attr('src');

    if (!name || !href) return; // ignora se faltar informação

    animes.push({
      id: `crunchyroll-${normalizeTitle(name)}`,
      name,
      poster: img,
      background: img,
      type: 'series',
      genres: ['Anime', 'Dublado', 'PT-BR'],
      description: `Anime dublado em português no Crunchyroll: ${name}`,
      behaviorHints: { defaultVideoId: '1' }
    });
  });

  if (animes.length === 0) {
    throw new Error('Nenhum anime encontrado em Crunchyroll');
  }

  return animes.slice(0, 20); // limite para não sobrecarregar
}

/* ------------------------------------------------------------------
 *  2. HIDIVE
 * ------------------------------------------------------------------ */
async function fetchHIDIVE() {
  const url = 'https://hidive.com/anime';
  const { data } = await fetchWithRetry(url);

  const $ = cheerio.load(data);
  const animes = [];

  /* Cada cartão tem a classe 'AnimeCard' */
  $('div.AnimeCard').each((i, el) => {
    const title = $(el).find('h3').text().trim();
    const href = $(el).find('a').attr('href');
    const img = $(el).find('img').attr('src');

    if (!title || !href) return;

    animes.push({
      id: `hidive-${normalizeTitle(title)}`,
      name: title,
      poster: img,
      background: img,
      type: 'series',
      genres: ['Anime', 'Dublado', 'PT-BR'],
      description: `Anime dublado em português no HIDIVE: ${title}`,
      behaviorHints: { defaultVideoId: '1' }
    });
  });

  if (animes.length === 0) {
    throw new Error('Nenhum anime encontrado em HIDIVE');
  }

  return animes.slice(0, 20);
}

/* ------------------------------------------------------------------
 *  3. Netflix (JustWatch)
 * ------------------------------------------------------------------ */
async function fetchNetflix() {
  const url = 'https://api.justwatch.com/content/titles/region/BR?title_type=series&page_size=20&providers=netflix';
  const options = { headers: { 'Accept': 'application/json' } };

  const { data } = await fetchWithRetry(url, options);
  const items = data.items || [];

  if (!items.length) {
    throw new Error('Nenhum anime encontrado no Netflix');
  }

  return items.map(item => ({
    id: `netflix-${item.original_title_slug}`,
    name: item.original_title,
    poster: item.original_title_poster,
    background: item.original_title_background,
    type: 'series',
    genres: ['Anime', 'Dublado', 'PT-BR'],
    description: `Anime dublado em português no Netflix: ${item.original_title}`,
    behaviorHints: { defaultVideoId: '1' }
  }));
}

/* ------------------------------------------------------------------
 *  4. Prime Video (JustWatch)
 * ------------------------------------------------------------------ */
async function fetchPrimeVideo() {
  const url = 'https://api.justwatch.com/content/titles/region/BR?title_type=series&page_size=20&providers=primevideo';
  const options = { headers: { 'Accept': 'application/json' } };

  const { data } = await fetchWithRetry(url, options);
  const items = data.items || [];

  if (!items.length) {
    throw new Error('Nenhum anime encontrado no Prime Video');
  }

  return items.map(item => ({
    id: `primevideo-${item.original_title_slug}`,
    name: item.original_title,
    poster: item.original_title_poster,
    background: item.original_title_background,
    type: 'series',
    genres: ['Anime', 'Dublado', 'PT-BR'],
    description: `Anime dublado em português no Prime Video: ${item.original_title}`,
    behaviorHints: { defaultVideoId: '1' }
  }));
}

/* ------------------------------------------------------------------
 *  5. Anime‑Planet
 * ------------------------------------------------------------------ */
async function fetchAnimePlanet() {
  const url = 'https://www.anime-planet.com/anime/tags/streaming';
  const { data } = await fetchWithRetry(url);

  const $ = cheerio.load(data);
  const animes = [];

  /* Cada cartão tem a classe 'anime-card' */
  $('div.anime-card').each((i, el) => {
    const title = $(el).find('h3').text().trim();
    const href = $(el).find('a').attr('href');
    const img = $(el).find('img').attr('src');

    if (!title || !href) return;

    animes.push({
      id: `animeplanet-${normalizeTitle(title)}`,
      name: title,
      poster: img,
      background: img,
      type: 'series',
      genres: ['Anime', 'Dublado', 'PT-BR'],
      description: `Anime dublado em português no Anime‑Planet: ${title}`,
      behaviorHints: { defaultVideoId: '1' }
    });
  });

  if (animes.length === 0) {
    throw new Error('Nenhum anime encontrado no Anime‑Planet');
  }

  return animes.slice(0, 20);
}

/* ------------------------------------------------------------------
 *  6. Mapeamento de fontes
 * ------------------------------------------------------------------ */
const providers = {
  crunchyroll: fetchCrunchyroll,
  hidive: fetchHIDIVE,
  netflix: fetchNetflix,
  primevideo: fetchPrimeVideo,
  animeplanet: fetchAnimePlanet
};

/**
 * Exporta a função que o addon chama para obter o catálogo.
 * @param {string} source - nome da fonte (ex.: 'crunchyroll')
 * @returns {Promise<Array>} - array de objetos de anime
 */
async function fetchCatalog(source) {
  const provider = providers[source];
  if (!provider) {
    throw new Error(`Fonte "${source}" não suportada`);   
  }
  return await provider();
}   

module.exports = { fetchCatalog };