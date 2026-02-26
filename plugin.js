const mainUrl = "https://sflix.to";

const commonHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": mainUrl + "/"
};

function getManifest() {
    return {
        name: "StormExt All Sources",
        id: "com.rheno911.stormext",
        version: 3,
        baseUrl: mainUrl,
        type: "Movie",
        language: "en"
    };
}

function parseMovies(html, base) {
    var results = [];
    var parts = html.split("flw-item");
    for (var i = 1; i < parts.length; i++) {
        var block = parts[i];
        var linkMatch  = block.match(/href="([^"]+)"/);
        var imgMatch   = block.match(/(?:data-src|src)="(https:[^"]+.(?:jpg|png|webp)[^"]*)"/);
        var nameMatch  = block.match(/film-name[^>]*>[^<]*<a[^>]*>([^<]+)</);
        if (linkMatch && nameMatch) {
            var link = linkMatch[1].indexOf("http") === 0 ? linkMatch[1] : base + linkMatch[1];
            results.push({
                name: nameMatch[1].trim(),
                link: link,
                image: imgMatch ? imgMatch[1] : "",
                description: ""
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
    var finalResult = [];
    var pending = sections.length;
    sections.forEach(function(section) {
        http_get(section.url, commonHeaders, function(status, html) {
            var items = parseMovies(html, mainUrl);
            finalResult.push({ title: section.title, Data: items });
            pending--;
            if (pending === 0) {
                callback(JSON.stringify(finalResult));
            }
        });
    });
}

function search(query, callback) {
    var url = mainUrl + "/search/" + encodeURIComponent(query);
    http_get(url, commonHeaders, function(status, html) {
        var items = parseMovies(html, mainUrl);
        callback(JSON.stringify([{ title: "Search Results", Data: items }]));
    });
}

function load(url, callback) {
    http_get(url, commonHeaders, function(status, html) {
        var titleMatch  = html.match(/heading-name[^>]*>[^<]*<a[^>]*>([^<]+)</);
        var descMatch   = html.match(/class="description"[^>]*>[^<]*<p[^>]*>([^<]+)</);
        var imgMatch    = html.match(/film-poster-img[^>]+(?:src|data-src)="([^"]+)"/);
        var serverMatch = html.match(/data-id="([^"]+)"[^>]*class="[^"]*btn-play/);
        callback(JSON.stringify({
            url: url,
            data: serverMatch ? serverMatch[1] : url,
            title: titleMatch ? titleMatch[1].trim() : "",
            description: descMatch ? descMatch[1].trim() : "",
            image: imgMatch ? imgMatch[1] : ""
        }));
    });
}

function loadStreams(url, callback) {
    var id = url.split("/").pop().split("-").pop();
    var sourcesUrl = mainUrl + "/ajax/movie/episodes/" + id;
    http_get(sourcesUrl, commonHeaders, function(status, data) {
        var streams = [];
        try {
            var parsed = JSON.parse(data);
            var content = parsed.html || parsed.link || data;
            var parts = content.split(".m3u8");
            for (var i = 0; i < parts.length - 1; i++) {
                var chunk = parts[i];
                var start = chunk.lastIndexOf('"');
                if (start === -1) start = chunk.lastIndexOf("'");
                if (start !== -1) {
                    var streamUrl = chunk.substring(start + 1) + ".m3u8";
                    streams.push({ name: "Auto " + (i + 1), url: streamUrl, headers: commonHeaders });
                }
            }
        } catch(e) {}
        callback(JSON.stringify(streams));
    });
}
