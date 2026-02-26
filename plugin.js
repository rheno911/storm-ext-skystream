const mainUrl = "https://sflix.to";

const commonHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": mainUrl + "/"
};

function getManifest() {
    return {
        name: "StormExt All Sources",
        id: "com.rheno911.stormext",
        version: 6,
        baseUrl: mainUrl,
        type: "Movie",
        language: "en"
    };
}

function parseSection(html) {
    var results = [];
    var blocks = html.split("flw-item");
    for (var i = 1; i < blocks.length; i++) {
        var block = blocks[i];
        var hrefMatch = block.match(/href="(/(?:movie|tv-show)[^"]+)"/);
        var imgMatch  = block.match(/data-src="([^"]+)"/);
        var nameMatch = block.match(/title="([^"]+)"/);
        if (hrefMatch && nameMatch) {
            results.push({
                title: nameMatch[1].trim(),
                url: mainUrl + hrefMatch[1],
                posterUrl: imgMatch ? imgMatch[1] : ""
            });
        }
    }
    return results;
}

function getHome(callback) {
    http_get(mainUrl + "/home", commonHeaders, function(status, html) {
        var resultMap = {};
        var chunks = html.split("block_area-content");
        if (chunks.length > 1) {
            var titles = ["Trending", "Latest Movies", "Latest TV Shows", "Coming Soon"];
            for (var i = 1; i < chunks.length && i - 1 < titles.length; i++) {
                var items = parseSection(chunks[i]);
                if (items.length > 0) resultMap[titles[i - 1]] = items;
            }
        }
        if (Object.keys(resultMap).length === 0) {
            resultMap["All"] = parseSection(html);
        }
        callback(JSON.stringify(resultMap));
    });
}

function search(query, callback) {
    http_get(mainUrl + "/search/" + encodeURIComponent(query), commonHeaders, function(status, html) {
        callback(JSON.stringify(parseSection(html)));
    });
}

function load(url, callback) {
    http_get(url, commonHeaders, function(status, html) {
        var titleMatch = html.match(/property="og:title"[^>]*content="([^"]+)"/);
        var descMatch  = html.match(/class="description"[sS]*?<p[^>]*>([^<]+)</);
        var imgMatch   = html.match(/property="og:image"[^>]*content="([^"]+)"/);
        if (!imgMatch) imgMatch = html.match(/film-poster-img[^>]+data-src="([^"]+)"/);
        var yearMatch  = html.match(/class="[^"]*year[^"]*"[^>]*>s*([0-9]{4})/);
        var idMatch    = html.match(/data-id="([0-9]+)"/);
        callback(JSON.stringify({
            url: url,
            data: idMatch ? idMatch[1] : url.split("-").pop().replace(/[^0-9]/g, ""),
            title: titleMatch ? titleMatch[1].trim() : "",
            description: descMatch ? descMatch[1].trim() : "",
            posterUrl: imgMatch ? imgMatch[1] : "",
            year: yearMatch ? parseInt(yearMatch[1]) : 0
        }));
    });
}

function loadStreams(url, callback) {
    var id = url.split("-").pop().replace(/[^0-9]/g, "");
    http_get(mainUrl + "/ajax/movie/episodes/" + id, commonHeaders, function(status, epData) {
        var streams = [];
        var embedUrls = [];
        try {
            var epJson = JSON.parse(epData);
            var epHtml = epJson.html || "";
            var parts = epHtml.split("eps-item");
            for (var i = 1; i < parts.length; i++) {
                var sidMatch = parts[i].match(/data-id="([0-9]+)"/);
                if (sidMatch) embedUrls.push(mainUrl + "/ajax/movie/episode/servers/" + sidMatch[1]);
            }
        } catch(e) {}
        if (embedUrls.length === 0) { callback(JSON.stringify(streams)); return; }
        var pending = embedUrls.length;
        embedUrls.forEach(function(serverUrl) {
            http_get(serverUrl, commonHeaders, function(s, serverData) {
                try {
                    var sJson = JSON.parse(serverData);
                    var link = sJson.link || sJson.url || "";
                    if (link) {
                        http_get(link, { "User-Agent": commonHeaders["User-Agent"], "Referer": mainUrl + "/" }, function(es, embedHtml) {
                            var m3u8 = embedHtml.match(/file:s*["']([^"']+.m3u8[^"']*)["']/);
                            if (m3u8) streams.push({ name: "Auto", url: m3u8[1], headers: { "User-Agent": commonHeaders["User-Agent"], "Referer": link } });
                            pending--;
                            if (pending === 0) callback(JSON.stringify(streams));
                        });
                        return;
                    }
                } catch(e) {}
                pending--;
                if (pending === 0) callback(JSON.stringify(streams));
            });
        });
    });
}
