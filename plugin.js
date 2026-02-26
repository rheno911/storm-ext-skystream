const mainUrl = "https://sflix.to";

const commonHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": mainUrl + "/",
    "X-Requested-With": "XMLHttpRequest"
};

function getManifest() {
    return {
        name: "StormExt All Sources",
        id: "com.rheno911.stormext",
        version: 5,
        baseUrl: mainUrl,
        type: "Movie",
        language: "en"
    };
}

function parseItemsFromHtml(html) {
    var results = [];
    var blocks = html.split("flw-item");
    for (var i = 1; i < blocks.length; i++) {
        var block = blocks[i];
        var linkMatch = block.match(/href="([^"]*(?:movie|tv-show|film)[^"]*)"/);
        var imgMatch  = block.match(/data-src="([^"]+)"/);
        if (!imgMatch) imgMatch = block.match(/src="(https:[^"]+)"/);
        var nameMatch = block.match(/film-name[^>]*>[^<]*<a[^>]*>([^<]+)</);
        if (!nameMatch) nameMatch = block.match(/<a[^>]+title="([^"]+)"/);
        if (linkMatch && nameMatch) {
            var href = linkMatch[1];
            results.push({
                title: nameMatch[1].trim(),
                url: href.indexOf("http") === 0 ? href : mainUrl + href,
                posterUrl: imgMatch ? imgMatch[1] : ""
            });
        }
    }
    return results;
}

function parseItemsFromJson(jsonStr) {
    var results = [];
    try {
        var data = JSON.parse(jsonStr);
        var list = data.data || data.movies || data.results || data;
        if (!Array.isArray(list)) return results;
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            results.push({
                title: item.title || item.name || "",
                url: mainUrl + (item.link || item.url || "/movie/" + item.slug + "-" + item.id),
                posterUrl: item.poster_path ? "https://image.tmdb.org/t/p/w300" + item.poster_path : (item.poster || item.img || "")
            });
        }
    } catch(e) {}
    return results;
}

function getHome(callback) {
    var ajaxUrls = [
        { title: "Trending",      url: mainUrl + "/ajax/movie/list/trending?type=movie&page=1" },
        { title: "Latest Movies", url: mainUrl + "/ajax/movie/list/latest?type=movie&page=1" },
        { title: "Latest TV",     url: mainUrl + "/ajax/movie/list/latest?type=tv&page=1" }
    ];
    var resultMap = {};
    var pending = ajaxUrls.length;
    ajaxUrls.forEach(function(section) {
        http_get(section.url, commonHeaders, function(status, data) {
            var items = parseItemsFromJson(data);
            if (items.length === 0) items = parseItemsFromHtml(data);
            resultMap[section.title] = items;
            pending--;
            if (pending === 0) { callback(JSON.stringify(resultMap)); }
        });
    });
}

function search(query, callback) {
    var url = mainUrl + "/ajax/search?keyword=" + encodeURIComponent(query);
    http_get(url, commonHeaders, function(status, data) {
        var items = parseItemsFromJson(data);
        if (items.length === 0) {
            http_get(mainUrl + "/search/" + encodeURIComponent(query), commonHeaders, function(s, html) {
                callback(JSON.stringify(parseItemsFromHtml(html)));
            });
            return;
        }
        callback(JSON.stringify(items));
    });
}

function load(url, callback) {
    http_get(url, commonHeaders, function(status, html) {
        var titleMatch = html.match(/heading-name[^>]*>[^<]*<a[^>]*>([^<]+)</);
        var descMatch  = html.match(/class="description"[^>]*>[^<]*<p[^>]*>([^<]+)</);
        var imgMatch   = html.match(/film-poster-img[^>]+data-src="([^"]+)"/);
        if (!imgMatch) imgMatch = html.match(/og:image[^>]+content="([^"]+)"/);
        var yearMatch  = html.match(/class="[^"]*year[^"]*"[^>]*>([0-9]{4})/);
        var idMatch    = html.match(/data-id="([0-9]+)"/);
        callback(JSON.stringify({
            url: url,
            data: idMatch ? idMatch[1] : url,
            title: titleMatch ? titleMatch[1].trim() : "",
            description: descMatch ? descMatch[1].trim() : "",
            posterUrl: imgMatch ? imgMatch[1] : "",
            year: yearMatch ? parseInt(yearMatch[1]) : 0
        }));
    });
}

function loadStreams(url, callback) {
    var id = url.split("-").pop().replace(/[^0-9]/g, "");
    var serverUrl = mainUrl + "/ajax/movie/episodes/" + id;
    http_get(serverUrl, commonHeaders, function(status, data) {
        var streams = [];
        var embedUrls = [];
        try {
            var parsed = JSON.parse(data);
            var html = parsed.html || parsed.content || "";
            var parts = html.split("eps-item");
            for (var i = 1; i < parts.length; i++) {
                var linkMatch = parts[i].match(/data-id="([0-9]+)"/);
                if (linkMatch) embedUrls.push(mainUrl + "/ajax/movie/episode/servers/" + linkMatch[1]);
            }
        } catch(e) {}
        if (embedUrls.length === 0) {
            var iframeMatch = data.match(/iframe[^>]+src="([^"]+)"/);
            if (iframeMatch) embedUrls.push(iframeMatch[1]);
        }
        if (embedUrls.length === 0) { callback(JSON.stringify(streams)); return; }
        var pending = embedUrls.length;
        embedUrls.forEach(function(embedUrl) {
            http_get(embedUrl, { "User-Agent": commonHeaders["User-Agent"], "Referer": mainUrl + "/" }, function(s, embedHtml) {
                var m3u8 = embedHtml.match(/file:s*["']([^"']+.m3u8[^"']*)["']/);
                if (!m3u8) m3u8 = embedHtml.match(/["']([^"']+.m3u8[^"']*)["']/);
                if (m3u8) streams.push({ name: "Auto", url: m3u8[1], headers: { "User-Agent": commonHeaders["User-Agent"], "Referer": embedUrl } });
                pending--;
                if (pending === 0) { callback(JSON.stringify(streams)); }
            });
        });
    });
}
