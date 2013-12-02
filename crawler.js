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
var fbPhotosUrl = 'https://graph.facebook.com/'+ keys.fbAppId +'/photos/';
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
    writeData(oldLinks);

    googl.shorten(commentsLink, function (shortCommentsLink) {
      var shortCommentsLink = shortCommentsLink.id;
      console.log("Short comments: ", shortCommentsLink);

      if (isImagePost(link)) {
        var options = createPhotoOptions(title, link, shortCommentsLink);
      } else {
        var options = createLinkOptions(title, link, shortCommentsLink);
      }
      console.log(options);

      request.post(options, postCallback);
    });
  } else {
    console.log('same link');
  }
};

var createPhotoOptions = function (title, link, shortCommentsLink) {
  var postData = {
    message: title + '\n (Comments - ' + shortCommentsLink + ')',
    url: link,
    access_token: fbAccessToken
  };

  return {
    uri: fbPhotosUrl,
    body: qs.stringify(postData),
    encoding: "utf-8"
  };
};

var createLinkOptions = function (title, link, shortCommentsLink) {
  var postData = {
    message: title + '\n (Comments - ' + shortCommentsLink + ')',
    link: link,
    access_token: fbAccessToken
  };

  return {
    uri: fbFeedUrl,
    body: qs.stringify(postData),
    encoding: "utf-8"
  };
};

var postCallback = function (err, res, body) {
  if (err) { console.log("Error posting to fb: ", err); return; }
  console.log('Added to facebook: ', body);
  console.log('-----------------------------------------');
};

var addRedditStem = function (link) {
  return 'http://www.reddit.com' + link;
};

var isImagePost = function (link) {
  if (link.indexOf('imgur.com') != -1 && (link.indexOf('.jpg') != -1 || link.indexOf('.png'))) {
    return true;
  }
  return false;
};

var writeData = function (data) {
  fs.writeFile('data.txt', JSON.stringify(data), function (err) {
    if (err) throw err;
    console.log('It\'s saved!');
  });
};


var c = new Crawler({
  "maxConnections":10,

  // This will be called for each crawled page
  "callback": crawlCallback
});

c.queue(redditUrl);
setInterval(function () {
  c.queue(redditUrl);
}, 300000);