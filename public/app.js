var app = (function() {
    var twitter;
    var socket = io('http://localhost:3000');

    function init() {
        document.getElementById('js-form-post-tweet').addEventListener('submit', postTweet);
        loadTwitterClient(bindSockets);
    }

    function loadTwitterClient(onReady) {
        window.twttr = (function (d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0],
                t = window.twttr || {};
            if (d.getElementById(id)) return t;
            js = d.createElement(s);
            js.id = id;
            js.src = 'https://platform.twitter.com/widgets.js';
            fjs.parentNode.insertBefore(js, fjs);

            t._e = [];
            t.ready = function (f) {
                t._e.push(f);
            };

            return t;
        }(document, 'script', 'twitter-wjs'));

        window.twttr.ready(onReady);
        twitter = window.twttr;
    }

    function bindSockets() {
        socket.on('connect', getLocation);
        socket.on('tweet', renderTweet);
        socket.on('city', updateCity);
    }

    function getLocation() {
        navigator.geolocation.getCurrentPosition(onGetLocationComplete);
    }

    function onGetLocationComplete(position) {
        var geocode = position.coords.latitude + ',' + position.coords.longitude;
        sendGeocode(geocode);
        getTweets(geocode);
    }

    function sendGeocode(geocode) {
        socket.emit('geolocation', geocode);
    }

    function getTweets(geocode) {
        socket.emit('get tweets', geocode);
    }

    function updateCity(city) {
        Array.from(document.getElementsByClassName('js-display-city'))
            .forEach(function(element) {
                element.innerText = city;
            });
    }

    function postTweet(event) {
        event.preventDefault();
        var request = new XMLHttpRequest();
        request.open('POST', '/api/tweet', true);
        request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        request.send(`tweet=${document.getElementById('js-tweet-content').value} ${document.getElementById('js-tweet-video-url').value}`);
    }

    function renderTweet(tweet) {
        var feed = document.getElementById('js-twitter-feed');
        var feedItemTemplate = document.getElementById('js-tweet-template');
        var feedItem = feedItemTemplate.cloneNode(true);
        var embeddedPlayer = (feedItem.getElementsByClassName('twitter-card__video-player')[0]).getElementsByTagName('iframe')[0];
        
        feedItem.getElementsByTagName('h3')[0].innerText = tweet.youtubeTitle;
        feedItem.style.display = 'block';
        embeddedPlayer.getAttributeNode('src').value = tweet.youtubeLink;
        
        feed.insertBefore(feedItem, feed.childNodes[0]);

        twitter.widgets.createTweet(
            tweet.id,
            feedItem.getElementsByClassName('twitter-card__tweet')[0],
            { theme: 'dark', conversation: 'none', cards: 'hidden' }
        );
    }

    return {
        init: init
    }
})();

app.init();