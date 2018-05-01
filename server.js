var Twitter = require('twitter');

var client = new Twitter({
    consumer_key: 'CXVNsTDohsJaIxl0cjpuLKXYr',
    consumer_secret: 'Y49dNi2NPN9vJaPS95QnRLslOqisEuC7v934lHOfN05cVjbtDB',
    access_token_key: '2834545563-QYQqm8hnLPiU3eFyAD8SGtKhfIYW7gMp8fGh8Xd',
    access_token_secret: 'SUquQt3XC2ve3IIa8JbwMa4bsRCpZSJuCVKYAXLUTDBBT'
});

var express = require('express');
var app = express();
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

app.get('/search', (req, res) => {
    client.get('search/tweets', { q: '#nowplaying', result_type: 'recent', count: 5, geocode: req.query.geocode })
        .then(function (tweets) {
            res.send(tweets);
        })
        .catch(function (error) {
            res.status(500).json(error);
        });
})

app.listen(3000);
console.log('Listening on localhost:3000');