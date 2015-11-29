'use strict';

var fs      = require('fs');
var yaml    = require('js-yaml');
var express = require('express');
var app     = express();
var request = require('request');
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
  res.send(url_parts.query);

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

var block_followers = function (req, res) {
  console.log('requesting followed-by...');

  request('https://api.instagram.com/v1/users/self/followed-by?access_token=' + access_token, function (error, response, body) {
      console.log('followed-by body: ', body);

      if (!error && response.statusCode === 200) {
        body = JSON.parse(body);

        _(body.data).forEach(function (n) {
          console.log(n.id);

          request.post({uri: 'https://api.instagram.com/v1/users/' + n.id + '/relationship?access_token=' + access_token, form: { action: 'unfollow' }}, function (error, response, body) {

            console.log(response.statusCode, response.statusMessage, response.body);

            if (!error && response.statusCode === 200) {
              console.log('success: ', body);
            }
            else {
              console.log('error: ', error);
            }
          });
        }).value();
      }
      else {
        console.log(error);
        res.redirect('/authorize_user');
      }
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