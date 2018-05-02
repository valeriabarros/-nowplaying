var Twitter = require('twitter');
const APP_KEY = 'AIzaSyBg6WmUtEwm2MoPiKPzwpwbktvKRhvXUgE';
var client = new Twitter({
    consumer_key: 'CXVNsTDohsJaIxl0cjpuLKXYr',
    consumer_secret: 'Y49dNi2NPN9vJaPS95QnRLslOqisEuC7v934lHOfN05cVjbtDB',
    access_token_key: '2834545563-QYQqm8hnLPiU3eFyAD8SGtKhfIYW7gMp8fGh8Xd',
    access_token_secret: 'SUquQt3XC2ve3IIa8JbwMa4bsRCpZSJuCVKYAXLUTDBBT'
});

var app = require('express')();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var getYoutubeTitle = require('get-youtube-title');
const fetch = require('node-fetch');

// create a socket.io connection with the client
io.on('connection', function (socket) {
    console.log('User connected. Socket id %s', socket.id);
    var stream;


    socket.on('geolocation', function (location) {
        var mapsUrl = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + location + "&key=" + APP_KEY;
        fetch(mapsUrl)
            .then(res => res.json())
            .then(json => {
                if (json.status == 'OK') {
                    var area = json.results.find(data => {
                        return data.types.includes('administrative_area_level_2');
                    });
                    var locations = [area.geometry.bounds.southwest.lat, area.geometry.bounds.southwest.lng,
                        area.geometry.bounds.northeast.lat, area.geometry.bounds.northeast.lng].join(',');
                    var city = area.address_components[0].long_name;
                    socket.emit('city', city);
                    stream = startStream(locations);
                }
            });
      
    });
    socket.on('disconnect', function () {
        console.log('User disconnected. %s. Socket id %s', socket.id);
        if (stream) stream.destroy();
    });
});

function startStream(locations) {
    var stream = client.stream('statuses/filter', 
    { track: '#nowplaying youtube com,#nowplaying youtu be', 
    locations: locations,
    filter_level: 'low' });
    stream.on('data', function (data) {
        console.log(data);
        function getYoutubeId(data) {
            var sources = {
                root: data,
                retweet: data.retweeted_status,
                extended: data.extended_tweet,
                quoted_status: data.quoted_status,
            };

            if (data.retweeted_status && data.retweeted_status.extended_tweet) {
                sources.extended_retweet = data.retweeted_status.extended_tweet;
            }

            function getId(entities) {
                return entities.urls.reduce((acc, link) => {
                    var idMatch = link.expanded_url.match(/.*(?:youtu.be|youtube).*?\/(?!results)(?:watch\?v=)?([\w-]*)/);
                    return (acc === '' && idMatch && idMatch[1]) || acc;
                }, '');
            }
            for (let source in sources) {
                if (!sources[source]) {
                    continue;
                }
                const youtubeId = getId(sources[source].entities);
                if (youtubeId) {
                    return youtubeId;
                }
            }
            return null;
        }

        var youtubeId = getYoutubeId(data);
        if (youtubeId) {
            var tweet = {
                id: data.id_str,
                youtubeLink: 'https://www.youtube.com/embed/' + youtubeId
            };

            getYoutubeTitle(youtubeId, (err, title) => {
                tweet.youtubeTitle = title;
                io.sockets.emit('tweet', tweet);
            });
        }
    });
    return stream;
}


// listen to the twitter stream and tweet comes in send it to the client real time





var path = require('path');
var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended : false})); 

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});



server.listen(3000);
console.log('server running at 3000');

