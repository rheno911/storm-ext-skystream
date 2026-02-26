const mainUrl = "https://sflix.to";

const commonHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": mainUrl + "/"
};

function getManifest() {
    return {
        name: "StormExt All Sources",
        id: "com.rheno911.stormext",
        version: 1,
        baseUrl: mainUrl,
        type: "Movie",
        language: "en"
    };
}

function getHome(callback) {
    var inputs = [
        { title: "Trending Movies", url: mainUrl + "/home" },
        { title: "Latest Movies",   url: mainUrl + "/movie" },
        { title: "TV Series",       url: mainUrl + "/tv-show" }
    ];
    var finalResult = [];
    var pending = inputs.length;
    inputs.forEach(function(item) {
        http_get(item.url, commonHeaders, function(status, html) {
            var movies = [];
            var regex = /href="(/movie/[^"]+)"[^>]*>[sS]*?<img[^>]+src="([^"]+)"[^>]*>[sS]*?class="[^"]*title[^"]*"[^>]*>([^<]+)</g;
            var match;
            while ((match = regex.exec(html)) !== null) {
                movies.push({ name: match[3].trim(), link: mainUrl + match[1], image: match[2], description: "" });
            }
            finalResult.push({ title: item.title, Data: movies });
            pending--;
            if (pending === 0) { callback(JSON.stringify(finalResult)); }
        });
    });
}

function search(query, callback) {
    var searchUrl = mainUrl + "/search/" + encodeURIComponent(query);
    http_get(searchUrl, commonHeaders, function(status, html) {
        var movies = [];
        var regex = /href="(/movie/[^"]+)"[^>]*>[sS]*?<img[^>]+src="([^"]+)"[^>]*>[sS]*?class="[^"]*title[^"]*"[^>]*>([^<]+)</g;
        var match;
        while ((match = regex.exec(html)) !== null) {
            movies.push({ name: match[3].trim(), link: mainUrl + match[1], image: match[2], description: "" });
        }
        callback(JSON.stringify([{ title: "Search Results", Data: movies }]));
    });
}

function load(url, callback) {
    http_get(url, commonHeaders, function(status, html) {
        var titleMatch = /<h2[^>]*class="[^"]*heading-name[^"]*"[^>]*><a[^>]*>([^<]+)</.exec(html);
        var descMatch  = /<div[^>]*class="[^"]*description[^"]*"[^>]*><p[^>]*>([^<]+)</.exec(html);
        var imgMatch   = /<img[^>]*class="[^"]*film-poster-img[^"]*"[^>]+src="([^"]+)"/.exec(html);
        callback(JSON.stringify({
            url: url,
            data: html,
            title: titleMatch ? titleMatch[1].trim() : "",
            description: descMatch ? descMatch[1].trim() : "",
            image: imgMatch ? imgMatch[1] : ""
        }));
    });
}

function loadStreams(url, callback) {
    http_get(url, commonHeaders, function(status, html) {
        var streams = [];
        var srcRegex = /files*:s*"([^"]+.m3u8[^"]*)"/g;
        var match;
        while ((match = srcRegex.exec(html)) !== null) {
            streams.push({ name: "Auto", url: match[1], headers: commonHeaders });
        }
        callback(JSON.stringify(streams));
    });
}
