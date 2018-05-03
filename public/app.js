var app = (function() {
    var twitter;
    var socket;

    function init(_socket) {
        socket = _socket;
        document.getElementById('js-form-post-tweet').addEventListener('submit', postTweet);
        loadTwitterClient();
    }
    // Instantiate twitter-widget element
    function loadTwitterClient() {
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

        window.twttr.ready();
        twitter = window.twttr;
    }
    // Start closure to get location
    function getLocation() {
        navigator.geolocation.getCurrentPosition(onGetLocationComplete);
    }
    // Once the location is available on browser, get the data.
    function onGetLocationComplete(position) {
        var geocode = position.coords.latitude + ',' + position.coords.longitude;
        sendGeocode(geocode);
        getTweets(geocode);
    }
    // send to server
    function sendGeocode(geocode) {
        socket.emit('geolocation', geocode);
    }
    // send request to return tweets
    function getTweets(geocode) {
        socket.emit('get tweets', geocode);
    }
    // once the city is available, include the name on layout
    function updateCity(city) {
        Array.from(document.getElementsByClassName('js-display-city'))
            .forEach(function(element) {
                element.innerText = city;
            });
    }
    // post tweet 
    function postTweet(event) {
        event.preventDefault();
        var request = new XMLHttpRequest();
        request.open('POST', '/api/tweet', true);
        request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        request.send(`tweet=#nowplaying ${document.getElementById('js-tweet-content').value} ${document.getElementById('js-tweet-video-url').value}`);
    }
    // create a tweet widget for each one available 
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
            { conversation: 'none', cards: 'hidden' }
        );
    }

    return {
        init: init,
        getLocation: getLocation,
        renderTweet: renderTweet,
        updateCity: updateCity
    }
})();
// Add listeners and initiate app
var socket = io();
socket.on('connect', app.getLocation);
socket.on('tweet', app.renderTweet);
socket.on('city', app.updateCity);

app.init(socket);