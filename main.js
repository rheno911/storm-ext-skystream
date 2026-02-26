const axios = require("axios");
const cheerio = require("cheerio");

// ─── ALL STORM-EXT PROVIDERS ──────────────────────────────────────────────────
const PROVIDERS = [
  // ── ENGLISH MOVIES & SERIES ──
  { id: "sflix",         name: "Sflix",          url: "https://sflix.to",               type: "flw",    lang: "en" },
  { id: "dopebox",       name: "Dopebox",        url: "https://dopebox.to",             type: "flw",    lang: "en" },
  { id: "solarmovie",    name: "Solarmovie",     url: "https://solarmovie.pe",          type: "flw",    lang: "en" },
  { id: "theflixto",     name: "TheFlix",        url: "https://theflix.to",             type: "flw",    lang: "en" },
  { id: "2embed",        name: "2Embed",         url: "https://www.2embed.to",          type: "embed",  lang: "en" },
  { id: "vmovee",        name: "VMovee",         url: "https://www.vmovee.watch",       type: "flw",    lang: "en" },
  { id: "vidembed",      name: "VidEmbed",       url: "https://vidembed.cc",            type: "vidembed", lang: "en" },
  { id: "allmovies",     name: "AllMoviesForYou",url: "https://allmoviesforyou.net",    type: "allmovies", lang: "en" },
  { id: "yomovies",      name: "Yomovies",       url: "https://yomovies.vip",           type: "yomovies", lang: "en" },
  { id: "lookmovie",     name: "LookMovie",      url: "https://lookmovie.io",           type: "lookmovie", lang: "en" },
  { id: "trailers",      name: "Trailers.to",    url: "https://trailers.to",            type: "flw",    lang: "en" },
  { id: "ihavenotv",     name: "IHaveNoTV",      url: "https://ihavenotv.com",          type: "ihavenotv", lang: "en" },

  // ── SPANISH ──
  { id: "cuevana",       name: "Cuevana3",       url: "https://cuevana3.me",            type: "cuevana",  lang: "es" },
  { id: "cinecalidad",   name: "Cinecalidad",    url: "https://cinecalidad.lol",        type: "cinecalidad", lang: "es" },
  { id: "pelisflix",     name: "Pelisflix",      url: "https://pelisflix.li",           type: "pelisflix", lang: "es" },
  { id: "pelisplushd",   name: "PelisplusHD",    url: "https://pelisplushd.net",        type: "pelisplus", lang: "es" },
  { id: "pelisplus",     name: "Pelisplus",      url: "https://pelisplus.icu",          type: "pelisplus", lang: "es" },
  { id: "pelismart",     name: "PeliSmart",      url: "https://pelismart.com",          type: "pelismart", lang: "es" },
  { id: "seriesflix",    name: "Seriesflix",     url: "https://seriesflix.video",       type: "seriesflix", lang: "es" },
  { id: "entrepeli",     name: "EntrePeliculas", url: "https://entrepeliculasyseries.nu", type: "entrepeli", lang: "es" },

  // ── ARABIC ──
  { id: "akwam",         name: "Akwam",          url: "https://akwam.to",               type: "akwam",  lang: "ar" },
  { id: "mycima",        name: "MyCima",         url: "https://mycima.tv",              type: "mycima", lang: "ar" },

  // ── ANIME ──
  { id: "gogoanime",     name: "GogoAnime",      url: "https://gogoanime.sk",           type: "gogo",   lang: "jp" },
  { id: "allanime",      name: "AllAnime",       url: "https://allanime.site",          type: "allanime", lang: "jp" },
  { id: "animeflv",      name: "AnimeFlv",       url: "https://www3.animeflv.net",      type: "animeflv", lang: "es" },
  { id: "animeflick",    name: "AnimeFlick",     url: "https://animeflick.net",         type: "animeflick", lang: "jp" },
  { id: "animeworld",    name: "AnimeWorld",     url: "https://www.animeworld.tv",      type: "animeworld", lang: "it" },
  { id: "animekisa",     name: "AnimeKisa",      url: "https://animekisa.in",           type: "animekisa", lang: "jp" },
  { id: "animepahe",     name: "AnimePahe",      url: "https://animepahe.com",          type: "animepahe", lang: "jp" },
  { id: "kawaiifu",      name: "Kawaiifu",       url: "https://kawaiifu.com",           type: "kawaiifu", lang: "jp" },
  { id: "tenshi",        name: "Tenshi.moe",     url: "https://tenshi.moe",             type: "tenshi", lang: "jp" },
  { id: "monoschinos",   name: "Monoschinos",    url: "https://monoschinos2.com",       type: "monoschinos", lang: "es" },
  { id: "dubbedanime",   name: "DubbedAnime",    url: "https://bestdubbedanime.com",    type: "dubbedanime", lang: "en" },

  // ── ASIAN / KDRAMA ──
  { id: "asianload",     name: "AsianLoad",      url: "https://asianembed.io",          type: "asianload", lang: "ko" },
  { id: "dramasee",      name: "DramaSee",       url: "https://dramasee.net",           type: "dramasee",  lang: "ko" },
  { id: "doramasyt",     name: "DoramasYT",      url: "https://doramasyt.com",          type: "doramas",   lang: "ko" },
  { id: "kdramahood",    name: "KDramaHood",     url: "https://kdramahood.com",         type: "kdrama",    lang: "ko" },
  { id: "watchasian",    name: "WatchAsian",     url: "https://watchasian.cx",          type: "watchasian", lang: "ko" },

  // ── PINOY ──
  { id: "pinoyhd",       name: "PinoyHD",        url: "https://www.pinoy-hd.xyz",       type: "pinoyhd",   lang: "tl" },
  { id: "pinoymovie",    name: "PinoyMoviePedia",url: "https://pinoymoviepedia.ru",     type: "pinoyhd",   lang: "tl" },
  { id: "pinoymovies",   name: "PinoyMovies",    url: "https://pinoymovies.es",         type: "pinoyhd",   lang: "tl" },

  // ── FRENCH ──
  { id: "frenchstream",  name: "FrenchStream",   url: "https://french-stream.re",       type: "frenchstream", lang: "fr" },
  { id: "vffilm",        name: "VF-Film",        url: "https://vf-film.me",             type: "vffr",  lang: "fr" },
  { id: "vfserie",       name: "VF-Serie",       url: "https://vf-serie.org",           type: "vffr",  lang: "fr" },

  // ── POLISH ──
  { id: "filman",        name: "Filman.cc",      url: "https://filman.cc",              type: "filman", lang: "pl" },

  // ── CARTOONS ──
  { id: "wcotv",         name: "WCO Stream",     url: "https://wcostream.cc",           type: "wco",    lang: "en" },
  { id: "watchcartoon",  name: "WatchCartoonOnline", url: "https://www.wcostream.com",  type: "wco",    lang: "en" },
];

// ─── CSS SELECTOR MAP PER TYPE ────────────────────────────────────────────────
const SELECTORS = {
  flw: {
    searchUrl:   (base, q) => `${base}/search?keyword=${encodeURIComponent(q)}`,
    item:        ".flw-item",
    title:       ".film-name",
    poster:      "img[data-src]",
    link:        "a.film-poster-ahref",
    type:        ".fdi-type",
    serverBlock: ".ps_-block .nav-item a",
    serverId:    "data-id",
    serverAjax:  (base, id) => `${base}/ajax/sources/${id}`,
    episodeList: ".ss-list a.ep-item",
    episodeSeason: "data-season",
    episodeNum:  "data-episode",
    imdbLink:    'a[href*="imdb.com/title"]',
    plot:        ".description",
    heading:     ".heading-name",
    year:        ".item.year",
  },
  cuevana: {
    searchUrl:   (base, q) => `${base}/?s=${encodeURIComponent(q)}`,
    item:        ".TPost.C",
    title:       ".Title",
    poster:      "img.CoverLazy",
    link:        "a",
    type:        ".genre",
    serverBlock: ".AABox .AA-cont",
    serverId:    "data-id",
    serverAjax:  (base, id) => `${base}/api/source/${id}`,
    episodeList: ".episodios li a",
    episodeSeason: "data-season",
    episodeNum:  "data-number",
    imdbLink:    'a[href*="imdb.com"]',
    plot:        ".Description p",
    heading:     "h1.Title",
    year:        ".Date",
  },
  cinecalidad: {
    searchUrl:   (base, q) => `${base}/?s=${encodeURIComponent(q)}`,
    item:        ".TPost.C",
    title:       ".Title",
    poster:      "img",
    link:        "a",
    type:        ".genre",
    serverBlock: ".opt-server",
    serverId:    "data-link",
    serverAjax:  null,
    episodeList: ".episodios li a",
    episodeSeason: "data-season",
    episodeNum:  "data-number",
    imdbLink:    'a[href*="imdb.com"]',
    plot:        ".Description p",
    heading:     "h1.Title",
    year:        ".Date",
  },
  pelisplus: {
    searchUrl:   (base, q) => `${base}/search?s=${encodeURIComponent(q)}`,
    item:        ".card-movie",
    title:       ".card-title",
    poster:      "img.card-img",
    link:        "a.card-link",
    type:        ".card-type",
    serverBlock: ".server-item",
    serverId:    "data-id",
    serverAjax:  (base, id) => `${base}/api/source/${id}`,
    episodeList: ".episode-item a",
    episodeSeason: "data-season",
    episodeNum:  "data-ep",
    imdbLink:    'a[href*="imdb.com"]',
    plot:        ".sinopsis p",
    heading:     "h1.movie-title",
    year:        ".year-label",
  },
  pelismart: {
    searchUrl:   (base, q) => `${base}/?s=${encodeURIComponent(q)}`,
    item:        ".result-item",
    title:       ".title a",
    poster:      "img",
    link:        ".title a",
    type:        ".meta span",
    serverBlock: ".dooplay_player_option",
    serverId:    "data-post",
    serverAjax:  (base, id) => `${base}/wp-admin/admin-ajax.php`,
    episodeList: ".episodios li a",
    episodeSeason: "data-season",
    episodeNum:  "data-number",
    imdbLink:    'a[href*="imdb.com"]',
    plot:        ".wp-content p",
    heading:     "h1.entry-title",
    year:        ".date",
  },
  seriesflix: {
    searchUrl:   (base, q) => `${base}/?s=${encodeURIComponent(q)}`,
    item:        ".TPost.B",
    title:       ".Title",
    poster:      "img",
    link:        "a",
    type:        ".genre",
    serverBlock: ".dooplay_player_option",
    serverId:    "data-post",
    serverAjax:  (base, id) => `${base}/wp-admin/admin-ajax.php`,
    episodeList: ".episodios li a",
    episodeSeason: "data-season",
    episodeNum:  "data-number",
    imdbLink:    'a[href*="imdb.com"]',
    plot:        ".Description p",
    heading:     "h1.Title",
    year:        ".Date",
  },
  entrepeli: {
    searchUrl:   (base, q) => `${base}/?s=${encodeURIComponent(q)}`,
    item:        ".result-item",
    title:       ".title a",
    poster:      "img",
    link:        ".title a",
    type:        "span.Qlty",
    serverBlock: ".dooplay_player_option",
    serverId:    "data-post",
    serverAjax:  (base, id) => `${base}/wp-admin/admin-ajax.php`,
    episodeList: ".episodios li a",
    episodeSeason: "data-season",
    episodeNum:  "data-number",
    imdbLink:    'a[href*="imdb.com"]',
    plot:        ".wp-content p",
    heading:     "h1.entry-title",
    year:        ".date",
  },
  akwam: {
    searchUrl:   (base, q) => `${base}/search?q=${encodeURIComponent(q)}`,
    item:        ".entry-box",
    title:       ".entry-title",
    poster:      "img.thumbnail",
    link:        "a.entry-image-link",
    type:        ".entry-category",
    serverBlock: ".download-links-title",
    serverId:    "data-url",
    serverAjax:  null,
    episodeList: ".episodes-list a",
    episodeSeason: "data-season",
    episodeNum:  "data-episode",
    imdbLink:    'a[href*="imdb.com"]',
    plot:        ".entry-description",
    heading:     "h1.entry-title",
    year:        ".entry-date",
  },
  mycima: {
    searchUrl:   (base, q) => `${base}/?s=${encodeURIComponent(q)}`,
    item:        ".GridItem",
    title:       "strong.hasyear",
    poster:      "img",
    link:        "a",
    type:        ".GridItem .Label",
    serverBlock: "ul.Servers li",
    serverId:    "data-url",
    serverAjax:  null,
    episodeList: "ul.Episodes li a",
    episodeSeason: "data-season",
    episodeNum:  "data-episode",
    imdbLink:    'a[href*="imdb.com"]',
    plot:        ".StoryLine",
    heading:     "h1.Title",
    year:        "span.year",
  },
  gogo: {
    searchUrl:   (base, q) => `${base}/search.html?keyword=${encodeURIComponent(q)}`,
    item:        ".items li",
    title:       "p.name a",
    poster:      "div.img-block img",
    link:        "div.img-block a",
    type:        "span.type",
    serverBlock: "#load_ep li",
    serverId:    "data-video",
    serverAjax:  null,
    episodeList: "#episode_page a",
    episodeSeason: null,
    episodeNum:  "ep_end",
    imdbLink:    null,
    plot:        ".description",
    heading:     "h1",
    year:        ".released",
  },
  allanime: {
    searchUrl:   (base, q) => `${base}/search?name=${encodeURIComponent(q)}`,
    item:        ".show-card",
    title:       ".show-name",
    poster:      "img.show-thumbnail",
    link:        "a",
    type:        ".show-type",
    serverBlock: ".server-link",
    serverId:    "data-src",
    serverAjax:  null,
    episodeList: ".episode-link",
    episodeSeason: null,
    episodeNum:  "data-episode",
    imdbLink:    null,
    plot:        ".description",
    heading:     "h1.show-title",
    year:        ".year",
  },
  animeflv: {
    searchUrl:   (base, q) => `${base}/browse?q=${encodeURIComponent(q)}`,
    item:        "ul.ListAnimes li",
    title:       "h3.Title",
    poster:      "figure img",
    link:        "a",
    type:        "span.Type",
    serverBlock: "ul.ListServers li",
    serverId:    "data-url",
    serverAjax:  null,
    episodeList: "ul.ListCaps li a",
    episodeSeason: null,
    episodeNum:  "data-episode",
    imdbLink:    null,
    plot:        ".Description p",
    heading:     "h1.Title",
    year:        "span.Date",
  },
  asianload: {
    searchUrl:   (base, q) => `${base}/?s=${encodeURIComponent(q)}`,
    item:        ".video-block",
    title:       ".title",
    poster:      "img",
    link:        "a",
    type:        ".type",
    serverBlock: ".anime_muti_link ul li",
    serverId:    "data-video",
    serverAjax:  null,
    episodeList: "#episode_page a",
    episodeSeason: null,
    episodeNum:  "ep_end",
    imdbLink:    null,
    plot:        ".post-entry p",
    heading:     "h2.title",
    year:        ".release-time",
  },
  dramasee: {
    searchUrl:   (base, q) => `${base}/?s=${encodeURIComponent(q)}`,
    item:        ".films-wraps .film-item",
    title:       ".film-name",
    poster:      "img.film-poster-img",
    link:        "a.film-poster-ahref",
    type:        ".fdi-type",
    serverBlock: ".server-item",
    serverId:    "data-id",
    serverAjax:  (base, id) => `${base}/ajax/server/${id}`,
    episodeList: ".ss-list a.ep-item",
    episodeSeason: "data-season",
    episodeNum:  "data-episode",
    imdbLink:    'a[href*="imdb.com"]',
    plot:        ".description",
    heading:     ".heading-name",
    year:        ".item.year",
  },
  doramas: {
    searchUrl:   (base, q) => `${base}/?s=${encodeURIComponent(q)}`,
    item:        ".col-xs-6 .TPost",
    title:       ".Title",
    poster:      "img",
    link:        "a",
    type:        ".genre",
    serverBlock: ".dooplay_player_option",
    serverId:    "data-post",
    serverAjax:  (base, id) => `${base}/wp-admin/admin-ajax.php`,
    episodeList: ".episodios li a",
    episodeSeason: "data-season",
    episodeNum:  "data-number",
    imdbLink:    null,
    plot:        ".Description p",
    heading:     "h1.Title",
    year:        ".Date",
  },
  kdrama: {
    searchUrl:   (base, q) => `${base}/?s=${encodeURIComponent(q)}`,
    item:        ".recent-movies .item",
    title:       "h2",
    poster:      "img",
    link:        "a",
    type:        ".type",
    serverBlock: ".tab-video a",
    serverId:    "data-embed",
    serverAjax:  null,
    episodeList: ".list-eps a",
    episodeSeason: null,
    episodeNum:  "data-ep",
    imdbLink:    null,
    plot:        ".entry-content p",
    heading:     "h1.entry-title",
    year:        ".year",
  },
  watchasian: {
    searchUrl:   (base, q) => `${base}/?s=${encodeURIComponent(q)}`,
    item:        ".video-block",
    title:       ".title",
    poster:      "img",
    link:        "a",
    type:        ".type",
    serverBlock: ".anime_muti_link ul li",
    serverId:    "data-video",
    serverAjax:  null,
    episodeList: "ul.listing.items li a",
    episodeSeason: null,
    episodeNum:  "data-episode",
    imdbLink:    null,
    plot:        ".post-entry p",
    heading:     "h2.video-title",
    year:        ".date-released",
  },
  pinoyhd: {
    searchUrl:   (base, q) => `${base}/?s=${encodeURIComponent(q)}`,
    item:        ".TPost",
    title:       ".Title",
    poster:      "img",
    link:        "a",
    type:        ".genre",
    serverBlock: ".dooplay_player_option",
    serverId:    "data-post",
    serverAjax:  (base, id) => `${base}/wp-admin/admin-ajax.php`,
    episodeList: ".episodios li a",
    episodeSeason: "data-season",
    episodeNum:  "data-number",
    imdbLink:    null,
    plot:        ".Description p",
    heading:     "h1.Title",
    year:        ".Date",
  },
  frenchstream: {
    searchUrl:   (base, q) => `${base}/?s=${encodeURIComponent(q)}`,
    item:        ".card.mb-3",
    title:       ".card-title",
    poster:      "img.card-img-top",
    link:        "a",
    type:        ".card-body small",
    serverBlock: ".embed-responsive iframe",
    serverId:    "src",
    serverAjax:  null,
    episodeList: ".season-episodes a",
    episodeSeason: "data-season",
    episodeNum:  "data-episode",
    imdbLink:    'a[href*="imdb.com"]',
    plot:        ".card-text",
    heading:     "h1",
    year:        ".date",
  },
  vffr: {
    searchUrl:   (base, q) => `${base}/?s=${encodeURIComponent(q)}`,
    item:        ".result-item",
    title:       ".title a",
    poster:      "img",
    link:        ".title a",
    type:        "span.Qlty",
    serverBlock: ".dooplay_player_option",
    serverId:    "data-post",
    serverAjax:  (base, id) => `${base}/wp-admin/admin-ajax.php`,
    episodeList: ".episodios li a",
    episodeSeason: "data-season",
    episodeNum:  "data-number",
    imdbLink:    null,
    plot:        ".wp-content p",
    heading:     "h1.entry-title",
    year:        ".date",
  },
  filman: {
    searchUrl:   (base, q) => `${base}/search?query=${encodeURIComponent(q)}`,
    item:        ".poster.tip",
    title:       "img[title]",
    poster:      "img",
    link:        "a",
    type:        ".film-type",
    serverBlock: ".server-item",
    serverId:    "data-url",
    serverAjax:  null,
    episodeList: ".episode-list a",
    episodeSeason: "data-season",
    episodeNum:  "data-episode",
    imdbLink:    null,
    plot:        ".plot",
    heading:     "h2.title",
    year:        ".year",
  },
  wco: {
    searchUrl:   (base, q) => `${base}/search-by-letter/?search=${encodeURIComponent(q)}`,
    item:        ".video-block",
    title:       ".name",
    poster:      "img",
    link:        "a",
    type:        ".status",
    serverBlock: ".server-item",
    serverId:    "data-video",
    serverAjax:  null,
    episodeList: ".cat-eps a",
    episodeSeason: null,
    episodeNum:  "data-episode",
    imdbLink:    null,
    plot:        "#series-description p",
    heading:     "h2.video-title",
    year:        ".year",
  },
  yomovies: {
    searchUrl:   (base, q) => `${base}/?s=${encodeURIComponent(q)}`,
    item:        ".movies-list .ml-item",
    title:       ".mli-info h2",
    poster:      "img.mli-thumb",
    link:        "a",
    type:        ".mli-quality",
    serverBlock: ".movieplay iframe",
    serverId:    "src",
    serverAjax:  null,
    episodeList: ".se-c .se-a li a",
    episodeSeason: "data-season",
    episodeNum:  "data-episode",
    imdbLink:    'a[href*="imdb.com"]',
    plot:        ".mvici-left p",
    heading:     "h3",
    year:        ".mvici-right p",
  },
  ihavenotv: {
    searchUrl:   (base, q) => `${base}/search/?q=${encodeURIComponent(q)}`,
    item:        ".content-item",
    title:       ".title",
    poster:      "img.thumbnail",
    link:        "a",
    type:        ".tag",
    serverBlock: ".video-wrap iframe",
    serverId:    "src",
    serverAjax:  null,
    episodeList: ".episodes a",
    episodeSeason: null,
    episodeNum:  "data-episode",
    imdbLink:    null,
    plot:        ".description",
    heading:     "h1.title",
    year:        ".year",
  },
  vidembed: {
    searchUrl:   (base, q) => `${base}/search?s=${encodeURIComponent(q)}`,
    item:        ".film_list-wrap .flw-item",
    title:       ".film-name",
    poster:      "img[data-src]",
    link:        "a.film-poster-ahref",
    type:        ".fdi-type",
    serverBlock: ".ps_-block .nav-item a",
    serverId:    "data-id",
    serverAjax:  (base, id) => `${base}/ajax/sources/${id}`,
    episodeList: ".ss-list a.ep-item",
    episodeSeason: "data-season",
    episodeNum:  "data-episode",
    imdbLink:    'a[href*="imdb.com"]',
    plot:        ".description",
    heading:     ".heading-name",
    year:        ".item.year",
  },
  embed: {
    searchUrl:   (base, q) => `${base}/search?keyword=${encodeURIComponent(q)}`,
    item:        ".flw-item",
    title:       ".film-name",
    poster:      "img[data-src]",
    link:        "a",
    type:        ".fdi-type",
    serverBlock: "li[data-id]",
    serverId:    "data-id",
    serverAjax:  (base, id) => `${base}/ajax/sources/${id}`,
    episodeList: ".ep-item",
    episodeSeason: "data-season",
    episodeNum:  "data-episode",
    imdbLink:    'a[href*="imdb.com"]',
    plot:        ".description",
    heading:     ".heading-name",
    year:        ".item.year",
  },
};

// ─── MAIN PLUGIN CLASS ────────────────────────────────────────────────────────
class StormExtAll extends Plugin {
  constructor() {
    super();
    this.name = "StormExt All Sources";
  }

  // ── SEARCH ALL PROVIDERS ──────────────────────────────────
  async search(query) {
    const results = [];
    for (const provider of PROVIDERS) {
      try {
        const sel = SELECTORS[provider.type];
        if (!sel) continue;
        const searchUrl = sel.searchUrl(provider.url, query);
        const res = await axios.get(searchUrl, {
          headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "en-US,en;q=0.9" },
          timeout: 8000,
        });
        const $ = cheerio.load(res.data);
        $(sel.item).each((i, el) => {
          const href = $(el).find(sel.link).attr("href") || $(el).find("a").attr("href");
          const title = $(el).find(sel.title).text().trim() ||
                        $(el).find("img").attr("alt") || "";
          const poster = $(el).find(sel.poster).attr("data-src") ||
                         $(el).find(sel.poster).attr("src") || "";
          const type = ($(el).find(sel.type).text().trim().toLowerCase().includes("movie")) ? "movie" : "series";
          if (href && title) {
            results.push({
              id: href,
              title,
              poster,
              type,
              provider: provider.id,
              providerName: provider.name,
              baseUrl: provider.url,
              selectorType: provider.type,
              lang: provider.lang,
            });
          }
        });
      } catch (e) {
        console.warn(`[${provider.name}] Search failed: ${e.message}`);
      }
    }
    return results;
  }

  // ── FULL METADATA (IMDb + MongoDB-ready) ──────────────────
  async getMetadata(item) {
    const sel = SELECTORS[item.selectorType];
    const url = item.id.startsWith("http") ? item.id : `${item.baseUrl}${item.id}`;
    const res = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }, timeout: 10000,
    });
    const $ = cheerio.load(res.data);

    const imdbLink = sel.imdbLink ? $(sel.imdbLink).attr("href") || "" : "";
    const imdbId = (imdbLink.match(/ttd+/) || [])[0] || null;

    let imdbData = {};
    if (imdbId) {
      try {
        const omdb = await axios.get(
          `https://www.omdbapi.com/?i=${imdbId}&apikey=YOUR_OMDB_KEY`
        );
        imdbData = omdb.data;
      } catch (e) { console.warn("OMDb failed:", e.message); }
    }

    const title = $(sel.heading).first().text().trim() || imdbData.Title || item.title;
    const plot  = sel.plot ? $(sel.plot).first().text().trim() : (imdbData.Plot || "");
    const year  = sel.year ? $(sel.year).first().text().trim() : (imdbData.Year || "");

    // MongoDB-compatible document
    return {
      _id:          imdbId || `${item.provider}_${encodeURIComponent(item.id)}`,
      title,
      originalTitle: imdbData.Title || title,
      year:          imdbData.Year || year,
      type:          item.type,
      plot:          imdbData.Plot || plot,
      imdbRating:    imdbData.imdbRating || null,
      imdbId,
      genres:        (imdbData.Genre || "").split(", ").filter(Boolean),
      cast:          (imdbData.Actors || "").split(", ").filter(Boolean),
      director:      imdbData.Director || null,
      language:      imdbData.Language || item.lang,
      country:       imdbData.Country || null,
      poster:        imdbData.Poster || item.poster,
      runtime:       imdbData.Runtime || null,
      rated:         imdbData.Rated || null,
      awards:        imdbData.Awards || null,
      provider:      item.providerName,
      sourceUrl:     url,
      fetchedAt:     new Date().toISOString(),
      episodes:      item.type === "series" ? await this.getEpisodes(item, $, sel) : [],
    };
  }

  // ── EPISODES ──────────────────────────────────────────────
  async getEpisodes(item, $, sel) {
    const eps = [];
    $(sel.episodeList).each((i, el) => {
      const season  = sel.episodeSeason
        ? parseInt($(el).attr(sel.episodeSeason) || "1") : 1;
      const episode = sel.episodeNum
        ? parseInt($(el).attr(sel.episodeNum) || i + 1) : i + 1;
      const href = $(el).attr("href") || "";
      const epTitle = $(el).text().trim() || `Episode ${episode}`;
      eps.push({
        season,
        episode,
        title: epTitle,
        url: href.startsWith("http") ? href : `${item.baseUrl}${href}`,
      });
    });
    return eps;
  }

  // ── SOURCES + MULTI-AUDIO ─────────────────────────────────
  async getSources(item, episode = null) {
    const sel = SELECTORS[item.selectorType];
    const targetUrl = episode ? episode.url : (item.id.startsWith("http") ? item.id : `${item.baseUrl}${item.id}`);
    const res = await axios.get(targetUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }, timeout: 10000,
    });
    const $ = cheerio.load(res.data);
    const sources = [];
    const servers = [];

    $(sel.serverBlock).each((i, el) => {
      const sid  = $(el).attr(sel.serverId) || $(el).find("a").attr(sel.serverId);
      const name = $(el).text().trim() || `Server ${i + 1}`;
      if (sid) servers.push({ name, serverId: sid });
    });

    for (const server of servers) {
      try {
        let embedUrl = server.serverId;

        // Ajax-based servers
        if (sel.serverAjax && !server.serverId.startsWith("http")) {
          const ajaxUrl = sel.serverAjax(item.baseUrl, server.serverId);
          const ajaxRes = await axios.get(ajaxUrl, {
            headers: {
              "X-Requested-With": "XMLHttpRequest",
              Referer: item.baseUrl,
            },
          });
          embedUrl = ajaxRes.data?.link || ajaxRes.data?.url || null;
        }

        if (!embedUrl) continue;
        const manifest = await this.extractManifest(embedUrl, item.baseUrl);
        if (manifest.url) {
          sources.push({
            server:      server.name,
            url:         manifest.url,
            quality:     manifest.quality || "auto",
            isM3U8:      manifest.isM3U8,
            audioTracks: manifest.audioTracks,
            subtitles:   manifest.subtitles,
            headers:     { Referer: item.baseUrl },
          });
        }
      } catch (e) {
        console.warn(`[${server.name}] source failed: ${e.message}`);
      }
    }
    return sources;
  }

  // ── MANIFEST + MULTI-AUDIO PARSER ─────────────────────────
  async extractManifest(embedUrl, referer) {
    const res = await axios.get(embedUrl, {
      headers: { Referer: referer, "User-Agent": "Mozilla/5.0" },
      timeout: 8000,
    });
    const $ = cheerio.load(res.data);
    const scripts = $("script").map((i, el) => $(el).html()).get().join("
");

    // Match M3U8 or MP4
    const m3u8Match = scripts.match(/https?://[^"'s\\]+.m3u8[^"'s\\]*/);
    const mp4Match  = scripts.match(/https?://[^"'s\\]+.mp4[^"'s\\]*/);
    const streamUrl = m3u8Match?.[0] || mp4Match?.[0] || null;
    const isM3U8    = !!m3u8Match;

    // Parse audio tracks from HLS master manifest
    const audioTracks = [];
    if (isM3U8 && streamUrl) {
      try {
        const m3u8Res = await axios.get(streamUrl, {
          headers: { Referer: embedUrl }, timeout: 6000,
        });
        const lines = m3u8Res.data.split("
");
        // Quality streams
        const qualityMap = [];
        lines.forEach(line => {
          if (line.includes("#EXT-X-STREAM-INF")) {
            const bw = (line.match(/BANDWIDTH=(d+)/) || [])[1];
            const res = (line.match(/RESOLUTION=([^s,]+)/) || [])[1];
            if (bw) qualityMap.push({ bandwidth: parseInt(bw), resolution: res || "auto" });
          }
          // Audio track extraction
          if (line.startsWith("#EXT-X-MEDIA") && line.includes("TYPE=AUDIO")) {
            const lang  = (line.match(/LANGUAGE="([^"]+)"/) || [])[1] || "und";
            const name  = (line.match(/NAME="([^"]+)"/)     || [])[1] || lang;
            const uri   = (line.match(/URI="([^"]+)"/)       || [])[1] || null;
            const isDefault = line.includes("DEFAULT=YES");
            audioTracks.push({ lang, name, uri, default: isDefault });
          }
        });
      } catch (e) { console.warn("M3U8 parse error:", e.message); }
    }

    return {
      url:         streamUrl,
      isM3U8,
      quality:     "auto",
      audioTracks, // [{lang:"en",name:"English"},{lang:"es",name:"Spanish"}]
      subtitles:   this.extractSubtitles($),
    };
  }

  // ── SUBTITLES ─────────────────────────────────────────────
  extractSubtitles($) {
    const subs = [];
    $("track[kind='subtitles'], track[kind='captions']").each((i, el) => {
      subs.push({
        lang:  $(el).attr("srclang") || "en",
        label: $(el).attr("label")   || "Subtitle",
        url:   $(el).attr("src"),
      });
    });
    return subs;
  }
}

module.exports = StormExtAll;
