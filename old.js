
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
