const mainUrl = "https://sflix.to";

const commonHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": mainUrl + "/"
};

function getManifest() {
    return {
        name: "StormExt All Sources",
        id: "com.rheno911.stormext",
        version: 2,
        baseUrl: mainUrl,
        type: "Movie",
        language: "en"
    };
}

function parseMovies(html, base) {
    var results = [];
    var cardRegex = /<div[^>]*class="[^"]*flw-item[^"]*"[sS]*?href="([^"]+)"[sS]*?(?:data-src|src)="(https://[^"]+.(?:jpg|png|webp)[^"]*)"[sS]*?class="[^"]*film-name[^"]*"[^>]*>s*<a[^>]*>([^<]+)</a>/g;
    var match;
    while ((match = cardRegex.exec(html)) !== null) {
        var link = match[1].indexOf("http") === 0 ? match[1] : base + match[1];
        results.push({
            name: match[3].trim(),
            link: link,
            image: match[2],
            description: ""
        });
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
        var titleMatch  = /<h2[^>]*class="[^"]*heading-name[^"]*"[^>]*>s*<a[^>]*>([^<]+)</.exec(html);
        var descMatch   = /<div[^>]*class="[^"]*description[^"]*"[^>]*>s*<p[^>]*>([^<]+)</.exec(html);
        var imgMatch    = /<img[^>]*class="[^"]*film-poster-img[^"]*"[^>]+(?:src|data-src)="([^"]+)"/.exec(html);
        var serverMatch = /data-id="([^"]+)"[^>]*class="[^"]*btn-play[^"]*"/.exec(html);
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
            var json = JSON.parse(data);
            var html = json.html || json.link || data;
            var m3u8Regex = /["']?(https?://[^"'s]+.m3u8[^"'s]*)["']?/g;
            var match;
            while ((match = m3u8Regex.exec(html)) !== null) {
                streams.push({ name: "Auto", url: match[1], headers: commonHeaders });
            }
        } catch(e) {}
        if (streams.length === 0) {
            var m3u8Regex2 = /["']?(https?://[^"'s]+.m3u8[^"'s]*)["']?/g;
            var match2;
            while ((match2 = m3u8Regex2.exec(data)) !== null) {
                streams.push({ name: "Auto", url: match2[1], headers: commonHeaders });
            }
        }
        callback(JSON.stringify(streams));
    });
}
