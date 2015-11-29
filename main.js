'use strict';

var fs      = require('fs');
var yaml    = require('js-yaml');
var express = require('express');
var app     = express();
var request = require('request-promise');
var url     = require('url');
var _       = require('lodash');

/**********************************************************************/

var config,
    access_token;

try {
  console.log('loading config.yml...');
  config = yaml.safeLoad(fs.readFileSync('config.yml', 'utf8')).config;
  if (!_.isUndefined(config)) {
    console.log('config.yml loaded');
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
  res.redirect('https://api.instagram.com/oauth/authorize/?client_id=' + config.instagram.client.id + '&redirect_uri=' + config.instagram.redirect_uri + '&response_type=code&scope=basic+public_content+follower_list+relationships');
};

app.get('/authorize_user', authorize_user);

/**********************************************************************/

var handleauth = function (req, res) {
  console.log('responsing handleauth...');
  var url_parts = url.parse(req.url, true);
  access_token = url_parts.query.code;
  console.log('setting access_token:', access_token);

  if (!_.isUndefined(url_parts.query.error)) {
    console.log(url_parts.query);
    process.exit(1);
  }
  else {
    res.redirect('/');
  }
};

app.get('/handleauth', handleauth);

/**********************************************************************/

var followed_by = function (req, res) {
  console.log('requesting followed-by...');
  console.log('using access_token:', access_token);

  var options = {
    uri: 'https://api.instagram.com/v1/users/self/followed-by',
    qs: {
      client_id: config.instagram.client.id,
      access_token: access_token
    },
    headers: {
      'User-Agent': 'Request-Promise'
    },
    json: true
  };

  return request(options)
    .then(function (response) {
      return response;
    })
    .catch(function (response) {
      console.log('followed-by response:',
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

var block_followers = function (req, res) {
  followed_by(req, res)
    .then(function (followers) {
      console.log('iterating followers...', followers);

      _(followers).forEach(function (n) {
        console.log('blocking id:', n.id);

        var options = {
          method: 'POST',
          uri: 'https://api.instagram.com/v1/users/' + n.id + '/relationship',
          qs: {
            access_token: access_token
          },
          body: {
            action: 'unfollow'
          },
          json: true // Automatically stringifies the body to JSON
        };

        request(options)
          .then(function (body) {
            console.log('relationship body:', body);
          })
          .catch(function (response) {
            console.log('relationship response:',
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

app.get('/block_followers', block_followers);

/**********************************************************************/

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('example app listening at http://%s:%s', host, port);
});

/**********************************************************************/