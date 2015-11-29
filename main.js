'use strict';

var yaml    = require('js-yaml');
var fs      = require('fs');
var http    = require('http');
var express = require('express');
var request = require('request');
var _       = require('lodash');
var api     = require('instagram-node').instagram();
var app     = express();

/**********************************************************************/

var config,
    access_token;

try {
  config = yaml.safeLoad(fs.readFileSync('config.yml', 'utf8')).config;
  console.log(JSON.stringify(config));
} catch (e) {
  console.log(e);
  process.exit(1);
}

/**********************************************************************/

var port = 3000;

app.listen(port);

app.get('/', function (req, res) {
  res.sendFile('index.html', { root: '.' });
});

/**********************************************************************/

var setClient = function () {
  console.log('client_id: ', config.instagram.client.id);
  console.log('client_secret: ', config.instagram.client.secret);
  console.log('access_token: ', access_token);

  api.use({
    client_id: config.instagram.client.id,
    client_secret: config.instagram.client.secret,
    access_token: access_token
  });
};

/**********************************************************************/

var block_followers = function (req, res) {
  console.log('requesting followed-by...');

  request('https://api.instagram.com/v1/users/self/followed-by?access_token=' + access_token, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        // console.log(body); // Show the HTML for the Google homepage.
        body = JSON.parse(body);

        _(body.data).forEach(function (n) {
          console.log(n.id);

          request.post({uri: 'https://api.instagram.com/v1/users/' + n.id + '/relationship?access_token=' + access_token, form: { action: 'unfollow' }}, function (error, response, body) {

            console.log(response.statusCode, response.statusMessage, response.body);

            if (!error && response.statusCode === 200) {
              console.log('success: ', body); // Show the HTML for the Google homepage.
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

setClient();

var redirect_uri = 'http://localhost:3000/handleauth';

exports.authorize_user = function (req, res) {
  access_token = undefined;
  res.redirect(api.get_authorization_url(redirect_uri, { scope: ['basic', 'public_content', 'follower_list', 'relationships'], state: 'a state' }));
};

exports.handleauth = function (req, res) {
  api.authorize_user(req.query.code, redirect_uri, function (err, result) {
    if (err) {
      console.log(err.body);
      res.send('Didn\'t work');
    } else {
      console.log('Yay! Access token is ' + result.access_token);
      config.instagram.access.token = result.access_token;
      // res.send('You made it!!');
      res.redirect('/block_followers');
    }
  });
};

// This is where you would initially send users to authorize
app.get('/authorize_user', exports.authorize_user);

// This is your redirect URI
app.get('/handleauth', exports.handleauth);

http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + port);
});

/**********************************************************************/
