const twitter = require('twitter');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const getYoutubeTitle = require('get-youtube-title');
const fetch = require('node-fetch');
const config = require("./config.json");
const bodyParser = require('body-parser');
const twitterClient = new twitter(config.twitter);

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/api/tweet', (req, res) => {
    twitterClient.post('statuses/update', { status: req.body.tweet })
        .then(tweet => res.json(tweet))
        .catch(error => res.status(500).json(error));
});

//
io.on('connection', function (socket) {
    console.log('User connected. Socket id', socket.id);
    let stream;

    socket.on('get tweets', geocode => {
        twitterClient.get('search/tweets', {
                q: '#nowplaying url:youtube filter:media',
                result_type: 'recent',
                count: 10,
                geocode: geocode + ',100km',
                include_entities: true
            })
            .then(function (response) {
                response.statuses.forEach(data => sendTweet(data));
            })
            .catch(error => {
                console.log('error', error);
            });
    });

    socket.on('geolocation', location => {
        fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${location}&key=${config.google_maps.api_key}`)
            .then(res => res.json())
            .then(json => {
                if (json.status === 'OK') {
                    const area = json.results.find(data => data.types.includes('administrative_area_level_2'));
                    const locations = [
                        area.geometry.bounds.southwest.lat, area.geometry.bounds.southwest.lng,
                        area.geometry.bounds.northeast.lat, area.geometry.bounds.northeast.lng
                    ].join(',');

                    socket.emit('city', area.address_components[0].long_name);
                    stream = startStream(locations);
                }
            });
    });

    socket.on('disconnect', function () {
        console.log('User disconnected', socket.id);
        if (stream) stream.destroy();
    });
});

function sendTweet(data) {
    const youtubeId = getYoutubeId(data);
    if (!youtubeId) return null;

    getYoutubeTitle(youtubeId, (err, title) => {
        io.sockets.emit('tweet', {
            id: data.id_str,
            youtubeLink: `https://www.youtube.com/embed/${youtubeId}?feature=oembed&showinfo=0`,
            youtubeTitle: title
        });
    });
}

function startStream(locations) {
    const stream = twitterClient.stream('statuses/filter', { 
        locations,
        track: '#nowplaying youtube com,#nowplaying youtu be', 
        filter_level: 'low' 
    });

    stream.on('data', data => sendTweet(data));
    return stream;
}

function getYoutubeId(tweet) {
    const sources = {
        root: tweet,
        retweet: tweet.retweeted_status,
        extended: tweet.extended_tweet,
        quoted_status: tweet.quoted_status,
        extended_retweet: (tweet.retweeted_status && tweet.retweeted_status.extended_tweet) ? tweet.retweeted_status.extended_tweet : null
    };

    function getId(entities) {
        return entities.urls.reduce((acc, link) => {
            const idMatch = link.expanded_url.match(/.+(?:www)?youtu(?:\.?be)(?:\.com)?\/(?:watch\?v=)?([\w-]+)(?:&|$)/);
            return (acc === '' && idMatch && idMatch[1]) || acc;
        }, '');
    }

    let youtubeId = null;
    for (let source in sources) {
        if (!sources[source]) continue;

        youtubeId = getId(sources[source].entities);
        if (youtubeId) break;
    }
    return youtubeId;
}

server.listen(3000);
console.log('server running at http://localhost:3000');

