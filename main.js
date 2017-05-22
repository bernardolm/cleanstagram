'use strict';

var _       = require('lodash');
var express = require('express');
var fs      = require('fs');
var request = require('request-promise');
var url     = require('url');
var yaml    = require('js-yaml');

var app     = express();

/**********************************************************************/

try {
  console.log('searching config.yml...');
  var file = fs.readFileSync('config.yml', 'utf8');
  if (!_.isUndefined(file)) {
    console.log('config.yml founded\n', file);
    yaml.loadAll(file, function (doc) {
      console.log('yaml loadAll doc\n', doc);
      if (!_.isUndefined(doc)) {
        app.config = doc
        console.log('config.yml loaded\nclient.id', app.config.instagram.client.id);
      }
    });
  }
} catch (e) {
  console.log(e);
  process.exit(1);
}

/**********************************************************************/

app.get('/', function (req, res) {
  console.log('responsing index.html...');
  res.sendFile('index.html', { root: '.' });
});

/**********************************************************************/

var authorize_user = function (req, res) {
  console.log('requesting authorize_user...');
  res.redirect('https://api.instagram.com/oauth/authorize/?client_id=' + app.config.instagram.client.id + '&redirect_uri=' + app.config.instagram.redirect_uri + '&response_type=code&scope=basic+public_content+follower_list+comments+relationships+likes');
};

/**********************************************************************/

var handleauth = function (req, res) {
  console.log('responsing handleauth...');
  var url_parts = url.parse(req.url, true);
  console.log('url_parts.query.code', url_parts.query.code);
  app.access_token code url_parts.query.code;
  console.log('setting access_token', app.code;

  if (!_.isUndefined(url_parts.query.error)) {
    console.log(url_parts.query);
    process.exit(1);
  }
  else {
    res.redirect('/');
  }
};

/**********************************************************************/

var followed_by = function (req, res) {
  console.log('requesting followed-by...');
  console.log('using access_token', app.code;

  var options = {
    uri: 'https://api.instagram.com/v1/users/self/followed-by',
    qs: {
      client_id: app.config.instagram.client.id,
      access_token: app.access_tokencode
    },
    headers: {
      'User-Agent': 'Request-Promise'
    },
    json: true
  };

  console.log('using this options', options);

  return request(options)
    .then(function (response) {
      return response;
    })
    .catch(function (response) {
      console.log('followed-by response',
        response.name,
        response.statusCode,
        response.error,
        response.statusMessage
        // response.req._header,
        // response.request.href
      );
      process.exit(1);
    });
};

/**********************************************************************/

var block_followers = function (req, res) {
  followed_by(req, res)
    .then(function (followers) {
      console.log('iterating followers...', followers);

      _(followers).forEach(function (n) {
        console.log('blocking id', n.id);

        var options = {
          method: 'POST',
          uri: 'https://api.instagram.com/v1/users/' + n.id + '/relationship',
          qs: {
            access_token: app.access_tokencode
          },
          body: {
            action: 'unfollow'
          },
          json: true // Automatically stringifies the body to JSON
        };

        console.log('using this options', options);

        request(options)
          .then(function (body) {
            console.log('relationship body', body);
          })
          .catch(function (response) {
            console.log('relationship response',
              response.name,
              response.statusCode,
              response.error,
              response.statusMessage
              // response.req._header,
              // response.request.href
            );
            process.exit(1);
          });

      }).value();
    });
};

/**********************************************************************/

var users_media_recent = function (req, res) {
  console.log('requesting users-media-recent...');
  console.log('using access_token', app.code;

  var options = {
    uri: 'https://api.instagram.com/v1/users/' + app.config.instagram.user.id + '/media/recent/',
    qs: {
      access_token: app.access_tokencode
    },
    headers: {
      'User-Agent': 'Request-Promise'
    },
    json: true
  };

  console.log('using this options', options);

  return request(options)
    .then(function (response) {
      return response;
    })
    .catch(function (response) {
      console.log('users-media-recent response',
        response
        // response.name,
        // response.statusCode,
        // response.error,
        // response.statusMessage
        // response.req._header,
        // response.request.href
      );
      process.exit(1);
    });
};

/**********************************************************************/

app.get('/authorize_user', authorize_user);
app.get('/handleauth', handleauth);
app.get('/followed_by', followed_by);
app.get('/block_followers', block_followers);
app.get('/users_media_recent', users_media_recent);

var server = app.listen(8881, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('example app listening at http://%s:%s', host, port);
});

/**********************************************************************/
