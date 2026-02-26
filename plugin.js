var mainUrl = "https://net22.cc";
var ua = "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
var ch = { "User-Agent": ua, "Referer": mainUrl + "/", "Accept": "text/html,*/*;q=0.8" };
var ah = { "User-Agent": ua, "Accept": "application/json,*/*", "Referer": mainUrl + "/", "X-Requested-With": "XMLHttpRequest" };

function getManifest() {
    return {
        name: "Net22 Sources",
        id: "com.rheno911.net22",
        version: 3,
        baseUrl: mainUrl,
        type: "Movie",
        language: "en"
    };
}

function parseWp(data) {
    var out = [];
    try {
        var arr = JSON.parse(data);
        if (!Array.isArray(arr)) return out;
        for (var i = 0; i < arr.length; i++) {
            var p = arr[i];
            var t = (p.title && p.title.rendered) ? p.title.rendered : "";
            var u = p.link || "";
            var img = "";
            try { img = p._embedded["wp:featuredmedia"][0].source_url || ""; } catch(e) {}
            if (t && u) out.push({ title: t, url: u, posterUrl: img });
        }
    } catch(e) {}
    return out;
}

function parseHtml(html) {
    var out = [];
    var splits = ["flw-item", "item-film", "movie-item", "film-item", "post-item", "<article"];
    var blocks = [];
    for (var s = 0; s < splits.length; s++) {
        if (html.indexOf(splits[s]) > -1) { blocks = html.split(splits[s]); break; }
    }
    for (var i = 1; i < blocks.length; i++) {
        var b = blocks[i];
        var hm = b.match(/href="(https?:[^"]{5,200})"/);
        if (!hm) hm = b.match(/href="(\/[^"]{2,200})"/);
        var im = b.match(/data-src="(https?:[^"]{5,200})"/);
        if (!im) im = b.match(/src="(https?:[^"]{5,200}\.(jpg|png|webp)[^"]*)"/);
        var nm = b.match(/title="([^"]{2,80})"/);
        if (!nm) nm = b.match(/<h[1-4][^>]*>([^<]{2,80})</);
        if (hm && nm) {
            var href = (hm[1].charAt(0) === "/") ? mainUrl + hm[1] : hm[1];
            var title = nm[1].trim();
            if (title.length > 1) out.push({ title: title, url: href, posterUrl: im ? im[1] : "" });
        }
    }
    return out;
}

function getHome(callback) {
    http_get(mainUrl + "/wp-json/wp/v2/posts?per_page=20&_embed=true", ah, function(s, d) {
        var items = parseWp(d);
        if (items.length > 0) { callback(JSON.stringify({ "Latest": items })); return; }
        http_get(mainUrl, ch, function(s2, html) {
            callback(JSON.stringify({ "Latest": parseHtml(html) }));
        });
    });
}

function search(query, callback) {
    http_get(mainUrl + "/wp-json/wp/v2/posts?search=" + encodeURIComponent(query) + "&per_page=20&_embed=true", ah, function(s, d) {
        var items = parseWp(d);
        if (items.length > 0) { callback(JSON.stringify(items)); return; }
        http_get(mainUrl + "/?s=" + encodeURIComponent(query), ch, function(s2, html) {
            callback(JSON.stringify(parseHtml(html)));
        });
    });
}

function load(url, callback) {
    http_get(url, ch, function(s, html) {
        var tm = html.match(/property="og:title"[^>]*content="([^"]+)"/);
        if (!tm) tm = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
        var dm = html.match(/property="og:description"[^>]*content="([^"]+)"/);
        var im = html.match(/property="og:image"[^>]*content="([^"]+)"/);
        var ym = html.match(/([12][0-9]{3})<\/span>/);
        var idm = html.match(/data-id="([0-9]+)"/);
        if (!idm) idm = html.match(/data-post="([0-9]+)"/);
        if (!idm) idm = html.match(/postid-([0-9]+)/);
        var ifm = html.match(/<iframe[^>]+src="([^"]+)"/);
        callback(JSON.stringify({
            url: url,
            data: idm ? idm[1] : (ifm ? ifm[1] : url),
            title: tm ? tm[1].trim() : "",
            description: dm ? dm[1].trim() : "",
            posterUrl: im ? im[1] : "",
            year: ym ? parseInt(ym[1]) : 0
        }));
    });
}

function loadStreams(url, callback) {
    http_get(url, ch, function(s, html) {
        var streams = [];
        var dm = html.match(/["'](https?:[^"']+\.m3u8[^"']*)["']/);
        if (dm) { callback(JSON.stringify([{ name: "Direct", url: dm[1], headers: ch }])); return; }
        var embeds = [];
        var iparts = html.split("iframe");
        for (var i = 1; i < iparts.length; i++) {
            var sm = iparts[i].match(/src="([^"]+)"/);
            if (sm && sm[1].indexOf("google") < 0 && sm[1].indexOf("facebook") < 0) {
                var eu = (sm[1].charAt(0) === "/") ? mainUrl + sm[1] : sm[1];
                embeds.push(eu);
            }
        }
        var dparts = html.split('data-embed="');
        for (var j = 1; j < dparts.length; j++) {
            var ev = dparts[j].split('"')[0];
            if (ev.indexOf(".") > -1) embeds.push((ev.charAt(0) === "/") ? mainUrl + ev : ev);
        }
        if (embeds.length === 0) { callback(JSON.stringify(streams)); return; }
        var pending = embeds.length;
        for (var k = 0; k < embeds.length; k++) {
            (function(eu) {
                http_get(eu, { "User-Agent": ua, "Referer": url }, function(es, eh) {
                    var vm = eh.match(/file:\s*["']([^"']+\.m3u8[^"']*)["']/);
                    if (!vm) vm = eh.match(/["'](https?:[^"'\s]+\.m3u8[^"'\s]*)["']/);
                    var mp = eh.match(/file:\s*["']([^"']+\.mp4[^"']*)["']/);
                    if (!mp) mp = eh.match(/["'](https?:[^"'\s]+\.mp4[^"'\s]*)["']/);
                    if (vm) streams.push({ name: "HLS", url: vm[1], headers: { "User-Agent": ua, "Referer": eu } });
                    else if (mp) streams.push({ name: "MP4", url: mp[1], headers: { "User-Agent": ua, "Referer": eu } });
                    pending--;
                    if (pending === 0) callback(JSON.stringify(streams));
                });
            })(embeds[k]);
        }
    });
}
