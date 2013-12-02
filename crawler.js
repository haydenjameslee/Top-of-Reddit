var Crawler = require("crawler").Crawler;
var googl = require('goo.gl');
var fs = require('fs');
var request = require('request');
var keys = require('./keys');
var qs = require('qs');

var oldLinks = [];
var redditUrl = keys.redditUrl;
var fbAccessToken = keys.fbAccessToken;
var fbFeedUrl = 'https://graph.facebook.com/'+ keys.fbAppId +'/feed/';
googl.setKey(keys.googKey);

var crawlCallback = function (error, result, $) {
  if (error) { console.log("Error: ", error); return; }

  var firstPost = $('#siteTable > div:first-child div.entry a.title');
  var link = firstPost.attr('href');
  var title = firstPost.text();
  var commentsLink = $('#siteTable > div:first-child div.entry a.comments').attr('href');

  if (link.indexOf('/r/') == 0) { link = addRedditStem(link); }

  console.log('Title: ', title);
  console.log('Link: ', link);
  console.log('CommentsLink: ', commentsLink);

  if (oldLinks.indexOf(link) == -1) {
    console.log('new link');

    oldLinks.push(link);
    postLink(title, link, commentsLink);
    writeData(oldLinks);
  } else {
    console.log('same link');
  }
};

var postLink = function (title, link, commentsLink) {
  // Shorten a long url and output the result
  googl.shorten(commentsLink, function (shortCommentsUrl) {
    console.log("Short comments: ", shortCommentsUrl.id);

    //post to facebook page
    var postData = {
      message: title + '\n (Comments - ' + shortCommentsUrl.id + ')',
      link: link,
      access_token: fbAccessToken
    };

    var options = {
      uri: fbFeedUrl,
      body: qs.stringify(postData),
      encoding: "utf-8"
    }

    console.log(options);

    request.post(
      options,
      function (err, res, body) {
        if (err) { console.log("Error posting to fb: ", err); return; }

        console.log('Added to facebook: ', body);

        console.log('-----------------------------------------');
      }
    );

  });
};

var addRedditStem = function (link) {
  return 'http://www.reddit.com' + link;
};

var writeData = function (data) {
  fs.writeFile('data.txt', JSON.stringify(data), function (err) {
    if (err) throw err;
    console.log('It\'s saved!');
  });
}


var c = new Crawler({
  "maxConnections":10,

  // This will be called for each crawled page
  "callback": crawlCallback
});

c.queue(redditUrl);
setInterval(function () {
  c.queue(redditUrl);
}, 300000);