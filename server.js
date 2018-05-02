var Twitter = require('twitter');

var client = new Twitter({
    consumer_key: 'CXVNsTDohsJaIxl0cjpuLKXYr',
    consumer_secret: 'Y49dNi2NPN9vJaPS95QnRLslOqisEuC7v934lHOfN05cVjbtDB',
    access_token_key: '2834545563-QYQqm8hnLPiU3eFyAD8SGtKhfIYW7gMp8fGh8Xd',
    access_token_secret: 'SUquQt3XC2ve3IIa8JbwMa4bsRCpZSJuCVKYAXLUTDBBT'
});

var express = require('express');
var app = express();

// const https = require('https')
// const fs = require('fs')
// const port = 3000

// const httpsOptions = {
//     key: fs.readFileSync(__dirname + '/key.pem'),
//     cert: fs.readFileSync(__dirname + '/cert.pem')
// }

var path = require('path');
var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended : false})); 

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.post('/tweet', function(req, res) {
    client.post('statuses/update', { status: req.body.tweet })
        .then(function (tweet) {
            res.json(tweet);
        })
        .catch(function (error) {
            res.status(500).json(error);
        });
});

var getYoutubeTitle = require('get-youtube-title');
var lastTweetId = 0;
// var olderTweetId = 0;
app.get('/search', (req, res) => {
    client.get('search/tweets', {
            q: '#nowplaying url:youtube', 
            result_type: 'recent', 
            count: 5, 
            geocode: req.query.geocode,
            include_entities: true,
            since_id: lastTweetId,
            max_id: olderTweetId
        })
        .then(function (response) {
            lastTweetId =  response.search_metadata.since_id;
            // olderTweetId = response.search_metadata.max_id;


            var tweets = response.statuses.map(function (tweet) {
                var youtubeId = tweet.entities.urls.reduce((acc, link) => {
                    var idMatch = link.expanded_url.match(/.*(?:youtu.be|youtube).*?\/(?:watch\?v=)?(.*)/);
                    return (acc === '' && idMatch && idMatch[1]) || acc;
                }, '');

                return {
                    id: tweet.id_str,
                    youtubeId: (youtubeId || 'dQw4w9WgXcQ')
                }
            });
            var total = tweets.length;
            var requestsCompleted = 0;

            function onRequestComplete(youtubeTitle, index) {
                tweets[index]['youtubeTitle'] = youtubeTitle;
                requestsCompleted++;
                if (requestsCompleted === total) {
                    // lastTweetId = tweets[0].id;
                    // console.log(lastTweetId);
                    res.send(tweets);
                }
            }

            tweets.forEach((tweet, index) => {
                getYoutubeTitle(tweet.youtubeId, (err, title) => {
                    onRequestComplete(title, index);
                });
            });
        })
        .catch(function (error) {
            res.status(500).json(error);
        });
})
app.listen(3000);

console.log('server running at 3000');