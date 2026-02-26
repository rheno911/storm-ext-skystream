const mainUrl = "https://sflix.to";

const commonHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": mainUrl + "/"
};

function getManifest() {
    return {
        name: "StormExt All Sources",
        id: "com.rheno911.stormext",
        version: 4,
        baseUrl: mainUrl,
        type: "Movie",
        language: "en"
    };
}

function parseItems(html) {
    var results = [];
    var blocks = html.split("flw-item");
    for (var i = 1; i < blocks.length; i++) {
        var block = blocks[i];
        var linkMatch = block.match(/href="([^"]+)"/);
        var imgMatch  = block.match(/data-src="([^"]+)"/);
        if (!imgMatch) imgMatch = block.match(/src="(https:[^"]+.(?:jpg|png|webp)[^"]*)"/);
        var nameMatch = block.match(/film-name[^>]*>[^<]*<a[^>]*>([^<]+)</);
        if (linkMatch && nameMatch) {
            var href = linkMatch[1];
            var fullUrl = href.indexOf("http") === 0 ? href : mainUrl + href;
            results.push({
                title: nameMatch[1].trim(),
                url: fullUrl,
                posterUrl: imgMatch ? imgMatch[1] : "",
                headers: commonHeaders
            });
        }
    }
    return results;
}

function getHome(callback) {
    var sections = [
        { title: "Trending",      url: mainUrl + "/home" },
        { title: "Latest Movies", url: mainUrl + "/movie" },
        { title: "Latest TV",     url: mainUrl + "/tv-show" }
    ];
    var resultMap = {};
    var pending = sections.length;
    sections.forEach(function(section) {
        http_get(section.url, commonHeaders, function(status, html) {
            resultMap[section.title] = parseItems(html);
            pending--;
            if (pending === 0) { callback(JSON.stringify(resultMap)); }
        });
    });
}

function search(query, callback) {
    var url = mainUrl + "/search/" + encodeURIComponent(query);
    http_get(url, commonHeaders, function(status, html) {
        callback(JSON.stringify(parseItems(html)));
    });
}

function load(url, callback) {
    http_get(url, commonHeaders, function(status, html) {
        var titleMatch = html.match(/heading-name[^>]*>[^<]*<a[^>]*>([^<]+)</);
        var descMatch  = html.match(/class="description"[^>]*>[^<]*<p[^>]*>([^<]+)</);
        var imgMatch   = html.match(/film-poster-img[^>]+data-src="([^"]+)"/);
        if (!imgMatch) imgMatch = html.match(/film-poster-img[^>]+src="([^"]+)"/);
        var yearMatch  = html.match(/class="[^"]*year[^"]*"[^>]*>([^<]+)</);
        callback(JSON.stringify({
            url: url,
            data: html,
            title: titleMatch ? titleMatch[1].trim() : "",
            description: descMatch ? descMatch[1].trim() : "",
            posterUrl: imgMatch ? imgMatch[1] : "",
            year: yearMatch ? parseInt(yearMatch[1]) : 0
        }));
    });
}

function loadStreams(url, callback) {
    var id = url.split("/").pop().split("-").pop();
    var ajaxUrl = mainUrl + "/ajax/movie/episodes/" + id;
    http_get(ajaxUrl, commonHeaders, function(status, data) {
        var streams = [];
        var iframeUrls = [];
        try {
            var parsed = JSON.parse(data);
            var html = parsed.html || parsed.content || "";
            var serverBlocks = html.split("server-item");
            for (var i = 1; i < serverBlocks.length; i++) {
                var srcMatch = serverBlocks[i].match(/data-url="([^"]+)"/);
                if (!srcMatch) srcMatch = serverBlocks[i].match(/href="([^"]+)"/);
                if (srcMatch) iframeUrls.push(srcMatch[1]);
            }
        } catch(e) {}
        if (iframeUrls.length === 0) {
            var raw = data.match(/data-url="([^"]+)"/g) || [];
            for (var j = 0; j < raw.length; j++) {
                var m = raw[j].match(/data-url="([^"]+)"/);
                if (m) iframeUrls.push(m[1]);
            }
        }
        if (iframeUrls.length === 0) { callback(JSON.stringify(streams)); return; }
        var pending = iframeUrls.length;
        iframeUrls.forEach(function(embedUrl) {
            http_get(embedUrl, { "User-Agent": commonHeaders["User-Agent"], "Referer": mainUrl + "/" }, function(s, embedHtml) {
                var v = embedHtml.match(/file:s*"([^"]+.m3u8[^"]*)"/);
                if (!v) v = embedHtml.match(/"([^"]+.m3u8[^"]*)"/);
                if (v) {
                    streams.push({ name: "Auto", url: v[1], headers: { "User-Agent": commonHeaders["User-Agent"], "Referer": embedUrl } });
                }
                pending--;
                if (pending === 0) { callback(JSON.stringify(streams)); }
            });
        });
    });
}
