const mainUrl = "https://net22.cc";

const commonHeaders = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Referer": mainUrl + "/",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache"
};

const apiHeaders = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Referer": mainUrl + "/",
    "X-Requested-With": "XMLHttpRequest"
};

function getManifest() {
    return {
        name: "Net22 Sources",
        id: "com.rheno911.net22",
        version: 1,
        baseUrl: mainUrl,
        type: "Movie",
        language: "en"
    };
}

function parseWpPosts(jsonStr) {
    var results = [];
    try {
        var posts = JSON.parse(jsonStr);
        if (!Array.isArray(posts)) return results;
        for (var i = 0; i < posts.length; i++) {
            var post = posts[i];
            var title = post.title ? (post.title.rendered || "") : "";
            var url   = post.link || "";
            var img   = "";
            if (post._embedded && post._embedded["wp:featuredmedia"]) {
                var media = post._embedded["wp:featuredmedia"][0];
                if (media && media.source_url) img = media.source_url;
            }
            if (title && url) results.push({ title: title, url: url, posterUrl: img });
        }
    } catch(e) {}
    return results;
}

function parseHtmlItems(html) {
    var results = [];
    var delimiters = ["flw-item", "item-film", "movie-item", "film-item", "post-item", "entry-item"];
    var blocks = [];
    for (var d = 0; d < delimiters.length; d++) {
        if (html.indexOf(delimiters[d]) !== -1) { blocks = html.split(delimiters[d]); break; }
    }
    if (blocks.length === 0) blocks = html.split("<article");
    for (var i = 1; i < blocks.length; i++) {
        var block = blocks[i];
        var hrefMatch = block.match(/href="(https?:[^"]+)"/);
        if (!hrefMatch) hrefMatch = block.match(/href="(/[^"]+)"/);
        var imgMatch  = block.match(/data-src="(https?:[^"]+)"/);
        if (!imgMatch) imgMatch = block.match(/src="(https?:[^"]+.(?:jpg|jpeg|png|webp)[^"]*)"/);
        var nameMatch = block.match(/title="([^"]{2,80})"/);
        if (!nameMatch) nameMatch = block.match(/<h[1-4][^>]*>s*(?:<a[^>]*>)?([^<]{2,80})</);
        if (hrefMatch && nameMatch) {
            var href = hrefMatch[1];
            if (href.indexOf("http") === -1) href = mainUrl + href;
            results.push({ title: nameMatch[1].trim(), url: href, posterUrl: imgMatch ? imgMatch[1] : "" });
        }
    }
    return results;
}

function getHome(callback) {
    var wpUrl = mainUrl + "/wp-json/wp/v2/posts?per_page=20&page=1&_embed=true";
    http_get(wpUrl, apiHeaders, function(status, data) {
        var items = parseWpPosts(data);
        if (items.length > 0) { callback(JSON.stringify({ "Latest": items })); return; }
        http_get(mainUrl, commonHeaders, function(s2, html) {
            var htmlItems = parseHtmlItems(html);
            callback(JSON.stringify({ "Latest": htmlItems }));
        });
    });
}

function search(query, callback) {
    var wpSearch = mainUrl + "/wp-json/wp/v2/posts?search=" + encodeURIComponent(query) + "&per_page=20&_embed=true";
    http_get(wpSearch, apiHeaders, function(status, data) {
        var items = parseWpPosts(data);
        if (items.length > 0) { callback(JSON.stringify(items)); return; }
        http_get(mainUrl + "/?s=" + encodeURIComponent(query), commonHeaders, function(s2, html) {
            callback(JSON.stringify(parseHtmlItems(html)));
        });
    });
}

function load(url, callback) {
    http_get(url, commonHeaders, function(status, html) {
        var titleMatch = html.match(/property="og:title"s+content="([^"]+)"/);
        if (!titleMatch) titleMatch = html.match(/<h1[^>]*>([^<]+)</h1>/);
        var descMatch  = html.match(/property="og:description"s+content="([^"]+)"/);
        var imgMatch   = html.match(/property="og:image"s+content="([^"]+)"/);
        if (!imgMatch) imgMatch = html.match(/name="twitter:image"s+content="([^"]+)"/);
        var yearMatch  = html.match(/([12][0-9]{3})</span>/);
        var idMatch    = html.match(/data-id="([0-9]+)"/);
        if (!idMatch) idMatch = html.match(/data-post="([0-9]+)"/);
        if (!idMatch) idMatch = html.match(/postid-([0-9]+)/);
        var iframeMatch = html.match(/<iframe[^>]+src="([^"]+)"/);
        callback(JSON.stringify({
            url: url,
            data: idMatch ? idMatch[1] : (iframeMatch ? iframeMatch[1] : url),
            title: titleMatch ? titleMatch[1].trim() : "",
            description: descMatch ? descMatch[1].trim() : "",
            posterUrl: imgMatch ? imgMatch[1] : "",
            year: yearMatch ? parseInt(yearMatch[1]) : 0
        }));
    });
}

function loadStreams(url, callback) {
    http_get(url, commonHeaders, function(status, html) {
        var streams = [];
        var directM3u8 = html.match(/["'](https?:[^"']+.m3u8[^"']*)["']/);
        if (directM3u8) {
            callback(JSON.stringify([{ name: "Direct", url: directM3u8[1], headers: commonHeaders }]));
            return;
        }
        var embedUrls = [];
        var iframeReg = /iframe[^>]+src="([^"]+)"/g;
        var match;
        while ((match = iframeReg.exec(html)) !== null) {
            if (match[1].indexOf("google") === -1 && match[1].indexOf("facebook") === -1) {
                embedUrls.push(match[1].indexOf("http") === -1 ? mainUrl + match[1] : match[1]);
            }
        }
        var dataReg = /data-(?:embed|src|video)="([^"]+)"/g;
        while ((match = dataReg.exec(html)) !== null) {
            if (match[1].indexOf(".") !== -1) {
                embedUrls.push(match[1].indexOf("http") === -1 ? mainUrl + match[1] : match[1]);
            }
        }
        if (embedUrls.length === 0) { callback(JSON.stringify(streams)); return; }
        var pending = embedUrls.length;
        embedUrls.forEach(function(embedUrl) {
            http_get(embedUrl, { "User-Agent": commonHeaders["User-Agent"], "Referer": url, "Accept": "*/*" }, function(s, embedHtml) {
                var m3u8 = embedHtml.match(/file:s*["']([^"']+.m3u8[^"']*)["']/);
                if (!m3u8) m3u8 = embedHtml.match(/["'](https?:[^"'s]+.m3u8[^"'s]*)["']/);
                var mp4 = embedHtml.match(/file:s*["']([^"']+.mp4[^"']*)["']/);
                if (!mp4) mp4 = embedHtml.match(/["'](https?:[^"'s]+.mp4[^"'s]*)["']/);
                if (m3u8) streams.push({ name: "HLS", url: m3u8[1], headers: { "User-Agent": commonHeaders["User-Agent"], "Referer": embedUrl } });
                else if (mp4) streams.push({ name: "MP4", url: mp4[1], headers: { "User-Agent": commonHeaders["User-Agent"], "Referer": embedUrl } });
                pending--;
                if (pending === 0) callback(JSON.stringify(streams));
            });
        });
    });
}
