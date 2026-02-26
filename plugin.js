// ─── MANIFEST ────────────────────────────────────────────────────────────────
function getManifest() {
    return {
        name: "StormExt All Sources",
        id: "com.rheno911.stormext",
        version: 1,
        baseUrl: "https://sflix.to",
        type: "Movie",
        language: "en"
    };
}

const commonHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9"
};

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function getHome(callback) {
    var categories = [
        { title: "Trending Movies", url: "https://sflix.to/home" },
        { title: "Latest Series",   url: "https://sflix.to/tv-show" },
        { title: "Anime",           url: "https://gogoanime.sk/popular.html" },
        { title: "Spanish Movies",  url: "https://cuevana3.me/peliculas" },
        { title: "KDrama",          url: "https://dramasee.net/home" }
    ];

    var results = [];
    var pending = categories.length;

    categories.forEach(function(cat) {
        http_get(cat.url, commonHeaders, function(status, html) {
            var items = [];
            // FLW-style sites (sflix, dopebox etc)
            var flwReg = /class="flw-item"[sS]*?href="([^"]+)"[sS]*?data-src="([^"]+)"[sS]*?class="film-name[^"]*"[^>]*>([^<]+)</g;
            var m;
            while ((m = flwReg.exec(html)) !== null) {
                items.push({ name: m[3].trim(), link: m[1], image: m[2], description: "" });
            }
            // WordPress/TPost style (cuevana, pelisplus etc)
            if (items.length === 0) {
                var wpReg = /class="TPost[^"]*"[sS]*?href="([^"]+)"[sS]*?src="([^"]+)"[sS]*?class="Title"[^>]*>([^<]+)</g;
                while ((m = wpReg.exec(html)) !== null) {
                    items.push({ name: m[3].trim(), link: m[1], image: m[2], description: "" });
                }
            }
            // GogoAnime style
            if (items.length === 0) {
                var gogoReg = /<li>[sS]*?<a href="([^"]+)"[sS]*?<img src="([^"]+)"[sS]*?<p class="name">[sS]*?<a[^>]+>([^<]+)</g;
                while ((m = gogoReg.exec(html)) !== null) {
                    items.push({ name: m[3].trim(), link: m[1], image: m[2], description: "" });
                }
            }
            results.push({ title: cat.title, Data: items });
            pending--;
            if (pending === 0) {
                callback(JSON.stringify(results));
            }
        });
    });
}

// ─── SEARCH ───────────────────────────────────────────────────────────────────
function search(query, callback) {
    var providers = [
        { name: "Sflix",       url: "https://sflix.to/search?keyword="          + encodeURIComponent(query), type: "flw"      },
        { name: "Cuevana3",    url: "https://cuevana3.me/?s="                   + encodeURIComponent(query), type: "wp"       },
        { name: "Cinecalidad", url: "https://cinecalidad.lol/?s="               + encodeURIComponent(query), type: "wp"       },
        { name: "Pelisplus",   url: "https://pelisplus.icu/search?s="           + encodeURIComponent(query), type: "card"     },
        { name: "GogoAnime",   url: "https://gogoanime.sk/search.html?keyword=" + encodeURIComponent(query), type: "gogo"     },
        { name: "AnimeFlv",    url: "https://www3.animeflv.net/browse?q="       + encodeURIComponent(query), type: "animeflv" },
        { name: "DramaSee",    url: "https://dramasee.net/?s="                  + encodeURIComponent(query), type: "flw"      },
        { name: "Akwam",       url: "https://akwam.to/search?q="                + encodeURIComponent(query), type: "akwam"   },
        { name: "MyCima",      url: "https://mycima.tv/?s="                     + encodeURIComponent(query), type: "mycima"  },
        { name: "Yomovies",    url: "https://yomovies.vip/?s="                  + encodeURIComponent(query), type: "wp"       },
        { name: "WCO",         url: "https://wcostream.cc/search-by-letter/?search=" + encodeURIComponent(query), type: "wco" },
        { name: "PelisplusHD", url: "https://pelisplushd.net/search?s="        + encodeURIComponent(query), type: "card"     },
        { name: "Seriesflix",  url: "https://seriesflix.video/?s="              + encodeURIComponent(query), type: "wp"       },
        { name: "AsianLoad",   url: "https://asianembed.io/?s="                 + encodeURIComponent(query), type: "asian"    },
        { name: "KDramaHood",  url: "https://kdramahood.com/?s="                + encodeURIComponent(query), type: "wp"       }
    ];

    var allResults = [];
    var pending = providers.length;

    providers.forEach(function(p) {
        http_get(p.url, commonHeaders, function(status, html) {
            var items = parseResults(html, p.type, p.name);
            items.forEach(function(i) { allResults.push(i); });
            pending--;
            if (pending === 0) {
                callback(JSON.stringify([{ title: "Search Results", Data: allResults }]));
            }
        });
    });
}

function parseResults(html, type, sourceName) {
    var items = [];
    var m;
    if (type === "flw") {
        var r = /href="([^"]+)"[^>]*class="film-poster-ahref[sS]*?data-src="([^"]+)"[sS]*?class="film-name[^"]*"[^>]*>([^<]+)</g;
        while ((m = r.exec(html)) !== null) {
            items.push({ name: "[" + sourceName + "] " + m[3].trim(), link: m[1], image: m[2], description: sourceName });
        }
    } else if (type === "wp") {
        var r2 = /class="TPost[^"]*"[sS]*?href="([^"]+)"[sS]*?src="([^"]+)"[sS]*?class="Title"[^>]*>([^<]+)</g;
        while ((m = r2.exec(html)) !== null) {
            items.push({ name: "[" + sourceName + "] " + m[3].trim(), link: m[1], image: m[2], description: sourceName });
        }
        if (items.length === 0) {
            var r3 = /class="result-item"[sS]*?href="([^"]+)"[sS]*?src="([^"]+)"[sS]*?class="title"[^>]*><a[^>]+>([^<]+)</g;
            while ((m = r3.exec(html)) !== null) {
                items.push({ name: "[" + sourceName + "] " + m[3].trim(), link: m[1], image: m[2], description: sourceName });
            }
        }
    } else if (type === "card") {
        var r4 = /class="card-movie"[sS]*?href="([^"]+)"[sS]*?src="([^"]+)"[sS]*?class="card-title"[^>]*>([^<]+)</g;
        while ((m = r4.exec(html)) !== null) {
            items.push({ name: "[" + sourceName + "] " + m[3].trim(), link: m[1], image: m[2], description: sourceName });
        }
    } else if (type === "gogo") {
        var r5 = /<li>[sS]*?<a href="([^"]+)"[sS]*?<img src="([^"]+)"[sS]*?<p class="name">[sS]*?<a[^>]+>([^<]+)</g;
        while ((m = r5.exec(html)) !== null) {
            items.push({ name: "[" + sourceName + "] " + m[3].trim(), link: "https://gogoanime.sk" + m[1], image: m[2], description: sourceName });
        }
    } else if (type === "animeflv") {
        var r6 = /class="ListAnimes"[sS]*?href="([^"]+)"[sS]*?src="([^"]+)"[sS]*?class="Title"[^>]*>([^<]+)</g;
        while ((m = r6.exec(html)) !== null) {
            items.push({ name: "[" + sourceName + "] " + m[3].trim(), link: "https://www3.animeflv.net" + m[1], image: m[2], description: sourceName });
        }
    } else if (type === "akwam") {
        var r7 = /class="entry-box"[sS]*?href="([^"]+)"[sS]*?src="([^"]+)"[sS]*?class="entry-title"[^>]*>([^<]+)</g;
        while ((m = r7.exec(html)) !== null) {
            items.push({ name: "[" + sourceName + "] " + m[3].trim(), link: m[1], image: m[2], description: sourceName });
        }
    } else if (type === "mycima") {
        var r8 = /class="GridItem"[sS]*?href="([^"]+)"[sS]*?src="([^"]+)"[sS]*?class="hasyear"[^>]*>([^<]+)</g;
        while ((m = r8.exec(html)) !== null) {
            items.push({ name: "[" + sourceName + "] " + m[3].trim(), link: m[1], image: m[2], description: sourceName });
        }
    } else if (type === "asian") {
        var r9 = /class="video-block"[sS]*?href="([^"]+)"[sS]*?src="([^"]+)"[sS]*?class="title"[^>]*>([^<]+)</g;
        while ((m = r9.exec(html)) !== null) {
            items.push({ name: "[" + sourceName + "] " + m[3].trim(), link: m[1], image: m[2], description: sourceName });
        }
    } else if (type === "wco") {
        var r10 = /class="video-block"[sS]*?href="([^"]+)"[sS]*?src="([^"]+)"[sS]*?class="name"[^>]*>([^<]+)</g;
        while ((m = r10.exec(html)) !== null) {
            items.push({ name: "[" + sourceName + "] " + m[3].trim(), link: m[1], image: m[2], description: sourceName });
        }
    }
    return items;
}

// ─── LOAD DETAILS + IMDb METADATA ────────────────────────────────────────────
function load(url, callback) {
    http_get(url, commonHeaders, function(status, html) {
        // Extract title
        var titleM = html.match(/<h1[^>]*class="[^"]*(?:Title|heading-name|film-name|entry-title)[^"]*"[^>]*>([^<]+)</) ||
                     html.match(/<title>([^<|–-]+)/);
        var title = titleM ? titleM[1].trim() : "Unknown Title";

        // Extract description
        var plotM = html.match(/class="[^"]*(?:description|Description|StoryLine|synopsis|wp-content)[^"]*"[^>]*>s*<p[^>]*>([^<]+)</) ||
                    html.match(/class="[^"]*(?:description|Description)[^"]*"[^>]*>([^<]+)</);
        var plot = plotM ? plotM[1].trim() : "";

        // Extract year
        var yearM = html.match(/class="[^"]*(?:year|Date|item year)[^"]*"[^>]*>([^<]+)</) ||
                    html.match(/(\b20[0-2][0-9]\b)/);
        var year = yearM ? parseInt(yearM[1]) : 0;

        // Extract poster
        var posterM = html.match(/property="og:image"s+content="([^"]+)"/) ||
                      html.match(/class="[^"]*(?:film-poster-img|CoverLazy)[^"]*"[^>]*src="([^"]+)"/);
        var poster = posterM ? posterM[1] : "";

        // Extract IMDb ID and fetch metadata
        var imdbM = html.match(/imdb.com/title/(ttd+)/);
        var imdbId = imdbM ? imdbM[1] : null;

        if (imdbId) {
            var omdbUrl = "https://www.omdbapi.com/?i=" + imdbId + "&apikey=5276c879";
            http_get(omdbUrl, {}, function(s2, omdbRaw) {
                try {
                    var omdb = JSON.parse(omdbRaw);
                    callback(JSON.stringify({
                        url: url,
                        data: html,
                        title: omdb.Title || title,
                        description: omdb.Plot || plot,
                        year: parseInt(omdb.Year) || year,
                        subtitle: "⭐ " + (omdb.imdbRating || "N/A") + " | " + (omdb.Genre || "") + " | " + (omdb.Runtime || ""),
                        image: omdb.Poster !== "N/A" ? omdb.Poster : poster
                    }));
                } catch(e) {
                    callback(JSON.stringify({ url: url, data: html, title: title, description: plot, year: year }));
                }
            });
        } else {
            callback(JSON.stringify({ url: url, data: html, title: title, description: plot, year: year, image: poster }));
        }
    });
}

// ─── LOAD STREAMS + MULTI-AUDIO ──────────────────────────────────────────────
function loadStreams(url, callback) {
    http_get(url, commonHeaders, function(status, html) {
        var streams = [];

        // 1. Direct M3U8 in page scripts
        var m3u8Matches = html.match(/https?://[^s"'\\]+.m3u8[^s"'\\]*/g);
        if (m3u8Matches) {
            m3u8Matches.forEach(function(m3u8Url, i) {
                streams.push({
                    name: "HLS Stream " + (i + 1),
                    url: m3u8Url,
                    headers: commonHeaders,
                    subtitles: []
                });
            });
        }

        // 2. Direct MP4 links
        var mp4Matches = html.match(/https?://[^s"'\\]+.mp4[^s"'\\]*/g);
        if (mp4Matches) {
            mp4Matches.forEach(function(mp4Url, i) {
                streams.push({
                    name: "MP4 Stream " + (i + 1),
                    url: mp4Url,
                    headers: commonHeaders,
                    subtitles: []
                });
            });
        }

        // 3. FLW Ajax server extraction (sflix, dopebox, dramasee etc.)
        var serverIds = [];
        var serverReg = /data-id="(d+)"[^>]*class="[^"]*nav-item/g;
        var sm;
        while ((sm = serverReg.exec(html)) !== null) {
            serverIds.push(sm[1]);
        }

        if (serverIds.length > 0) {
            var pending = serverIds.length;
            serverIds.forEach(function(sid) {
                var ajaxUrl = url.split("/").slice(0, 3).join("/") + "/ajax/sources/" + sid;
                http_get(ajaxUrl, {
                    "X-Requested-With": "XMLHttpRequest",
                    "Referer": url,
                    "User-Agent": commonHeaders["User-Agent"]
                }, function(s2, ajaxRaw) {
                    try {
                        var ajaxData = JSON.parse(ajaxRaw);
                        var embedUrl = ajaxData.link || ajaxData.url || null;
                        if (embedUrl) {
                            http_get(embedUrl, { "Referer": url, "User-Agent": commonHeaders["User-Agent"] }, function(s3, embedHtml) {
                                var em3u8 = embedHtml.match(/https?://[^s"'\\]+.m3u8[^s"'\\]*/);
                                if (em3u8) {
                                    streams.push({
                                        name: "Server " + sid,
                                        url: em3u8[0],
                                        headers: { "Referer": embedUrl, "User-Agent": commonHeaders["User-Agent"] },
                                        subtitles: extractSubtitles(embedHtml)
                                    });
                                }
                                pending--;
                                if (pending === 0) callback(JSON.stringify(streams));
                            });
                        } else {
                            pending--;
                            if (pending === 0) callback(JSON.stringify(streams));
                        }
                    } catch(e) {
                        pending--;
                        if (pending === 0) callback(JSON.stringify(streams));
                    }
                });
            });
        } else {
            // 4. WordPress dooplay player (cuevana, pelismart, seriesflix etc.)
            var dooReg = /class="dooplay_player_option"[^>]*data-post="(d+)"[^>]*data-type="([^"]+)"/g;
            var dooIds = [];
            var dm;
            while ((dm = dooReg.exec(html)) !== null) {
                dooIds.push({ post: dm[1], type: dm[2] });
            }

            if (dooIds.length > 0) {
                var base = url.split("/").slice(0, 3).join("/");
                var p2 = dooIds.length;
                dooIds.forEach(function(d) {
                    http_get(base + "/wp-admin/admin-ajax.php", {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "X-Requested-With": "XMLHttpRequest",
                        "Referer": url,
                        "User-Agent": commonHeaders["User-Agent"]
                    }, function(s2, dooRaw) {
                        try {
                            var dooData = JSON.parse(dooRaw);
                            var embedUrl = dooData.embed_url || dooData.url || null;
                            if (embedUrl) {
                                var m3u8 = embedUrl.match(/https?://[^s"'\\]+.m3u8[^s"'\\]*/);
                                if (m3u8) {
                                    streams.push({
                                        name: "WP Server " + d.post,
                                        url: m3u8[0],
                                        headers: { "Referer": base, "User-Agent": commonHeaders["User-Agent"] },
                                        subtitles: []
                                    });
                                }
                            }
                        } catch(e) {}
                        p2--;
                        if (p2 === 0) callback(JSON.stringify(streams));
                    });
                });
            } else {
                // If no streams found, return empty
                if (streams.length === 0) {
                    streams.push({ name: "No streams found", url: "", headers: {}, subtitles: [] });
                }
                callback(JSON.stringify(streams));
            }
        }
    });
}

// ─── SUBTITLE HELPER ─────────────────────────────────────────────────────────
function extractSubtitles(html) {
    var subs = [];
    var subReg = /kind="(?:subtitles|captions)"[^>]*srclang="([^"]+)"[^>]*label="([^"]+)"[^>]*src="([^"]+)"/g;
    var m;
    while ((m = subReg.exec(html)) !== null) {
        subs.push({ label: m[2], url: m[3] });
    }
    return subs;
}
