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
  app.code = url_parts.query.code;
  console.log('setting app.code', app.code);

  if (!_.isUndefined(url_parts.query.error)) {
    console.log('error', url_parts);
    process.exit(1);
  }
  else {
    if (_.isUndefined(app.token)) {
      access_token(req, res)
        .then(function (response) {
          console.log('handleauth->access_token OK', response);
          app.token = response;
        });
    }
    res.redirect('/');
  }
};

/**********************************************************************/

var access_token = function (req, res) {
  console.log('requesting access_token...');
  console.log('using code', app.code);

  var options = {
    method: 'POST',
    uri: 'https://api.instagram.com/oauth/access_token',
    form: {
      client_id: app.config.instagram.client.id,
      client_secret: app.config.instagram.client.secret,
      grant_type: 'authorization_code',
      redirect_uri: app.config.instagram.redirect_uri,
      code: app.code
    },
    headers: {
      'User-Agent': 'Request-Promise'
    }
  };

  console.log('using this options', options);

  return request(options)
    .then(function (response) {
      console.log('access_token OK', response);
      return JSON.parse(response);
    })
    .catch(function (err) {
      console.log('access_token response', err);
      process.exit(1);
    });
};

/**********************************************************************/

var followed_by = function (req, res) {
  console.log('requesting followed_by...');
  console.log('using token', app.token);

  var options = {
    uri: 'https://api.instagram.com/v1/users/self/followed-by',
    qs: {
      client_id: app.config.instagram.client.id,
      access_token: app.token.access_token
    },
    headers: {
      'User-Agent': 'Request-Promise'
    },
    json: true
  };

  console.log('using this options', options);

  return request(options)
    .then(function (response) {
      console.log('followed_by OK', response);
      return response;
    })
    .catch(function (err) {
      console.log('followed_by response', err);
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
            access_token: app.token.access_token
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
          .catch(function (err) {
            console.log('block_followers response', err);
            process.exit(1);
          });

      }).value();
    });
};

/**********************************************************************/

var users_search = function (req, res) {
  console.log('requesting users_search...');
  console.log('using token', app.token);

  var options = {
    uri: 'https://api.instagram.com/v1/users/search',
    qs: {
      q: app.config.instagram.user.id,
      access_token: app.token.access_token
    },
    headers: {
      'User-Agent': 'Request-Promise'
    },
    json: true
  };

  console.log('using this options', options);

  return request(options)
    .then(function (response) {
      console.log('users_search OK', response);
      return response;
    })
    .catch(function (err) {
      console.log('users_search response', err);
      process.exit(1);
    });
};

/**********************************************************************/

var users_media_recent = function (req, res) {
  console.log('requesting users_media_recent...');
  console.log('using token', app.token);

  var options = {
    uri: 'https://api.instagram.com/v1/users/' + app.config.instagram.user.id + '/media/recent',
    qs: {
      access_token: app.token.access_token
    },
    headers: {
      'User-Agent': 'Request-Promise'
    },
    json: true
  };

  console.log('using this options', options);

  return request(options)
    .then(function (response) {
      console.log('users_media_recent OK', response);
      return response;
    })
    .catch(function (err) {
      console.log('users_media_recent response', err);
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
