var manifest = {
    name: "StormExt All Sources",
    id: "com.rheno911.stormext",
    version: 1,
    language: "en",
    type: "Movie",
    baseUrl: "https://sflix.to"
};

function getManifest(callback) {
    callback(JSON.stringify(manifest));
}

function getHome(callback) {
    callback(JSON.stringify([]));
}

function search(query, callback) {
    callback(JSON.stringify([]));
}

function load(url, callback) {
    callback(JSON.stringify({}));
}

function loadStreams(url, callback) {
    callback(JSON.stringify([]));
}
