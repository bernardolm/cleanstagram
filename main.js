'use strict';

var http = require('http');
var express = require('express');
var request = require('request');
var _ = require('lodash');
var api = require('instagram-node').instagram();
var app = express();

/**********************************************************************/

var access_token = process.env.INSTAGRAM_ACCESS_TOKEN;
var port = 3000;

app.listen(port);

app.get('/', function (req, res) {
  res.sendFile('index.html', { root: '.' });
});

/**********************************************************************/

var setClient = function () {
  console.log('client_id: ', process.env.INSTAGRAM_CLIENT_ID);
  console.log('client_secret: ', process.env.INSTAGRAM_CLIENT_SECRET);
  console.log('access_token: ', access_token);

  api.use({
    client_id: process.env.INSTAGRAM_CLIENT_ID,
    client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
    access_token: access_token
  });
};

var doWork = function (req, res) {
  // setClient();

  // api.user(process.env.INSTAGRAM_USER_ID, function (err, result, remaining, limit) {
  //   console.log('err:', err);
  //   console.log('result:', result);
  //   console.log('remaining:', remaining);
  //   console.log('limit:', limit);
  // });

  // api.user_followers(process.env.INSTAGRAM_USER_ID, function (err, users, pagination, remaining, limit) {
  //   if (err) {
  //     console.log('err:', err);
  //     res.redirect('/authorize_user');
  //   }
  //   else {
  //     console.log('users:', users);
  //     console.log('pagination:', pagination);
  //     console.log('remaining:', remaining);
  //     console.log('limit:', limit);
  //   }
  // });

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

app.get('/doWork', doWork);

/**********************************************************************/

setClient();

var redirect_uri = 'http://localhost:3000/handleauth';

exports.authorize_user = function (req, res) {
  res.redirect(api.get_authorization_url(redirect_uri, { scope: ['basic', 'public_content', 'follower_list', 'relationships'], state: 'a state' }));
};

exports.handleauth = function (req, res) {
  api.authorize_user(req.query.code, redirect_uri, function (err, result) {
    if (err) {
      console.log(err.body);
      res.send('Didn\'t work');
    } else {
      console.log('Yay! Access token is ' + result.access_token);
      access_token = result.access_token;
      // res.send('You made it!!');
      res.redirect('/dowork');
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
