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
function getHome(callback) { callback(JSON.stringify([])); }
function search(query, callback) { callback(JSON.stringify([])); }
function load(url, callback) { callback(JSON.stringify({})); }
function loadStreams(url, callback) { callback(JSON.stringify([])); }
