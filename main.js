'use strict';

var http = require('http');
var express = require('express');
var api = require('instagram-node').instagram();
var app = express();

/**********************************************************************/

var server = app.listen(3000, function () {
  var host = server.address().address || 'localhost';
  var port = server.address().port || 3000;

  console.log('Example app listening at http://%s:%s', host, port);
});

/**********************************************************************/

app.get('/doWork', function (req, res) {
  doWork();
});

var setClient = function () {
  console.log('client_id: ', process.env.INSTAGRAM_CLIENT_ID);
  console.log('client_secret: ', process.env.INSTAGRAM_CLIENT_SECRET);

  api.use({ client_id: process.env.INSTAGRAM_CLIENT_ID,
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET });
};

var doWork = function () {
  // Every call to `api.use()` overrides the `client_id/client_secret`
  // or `access_token` previously entered if they exist.

  setClient();

  api.user('217326961', function (err, result, remaining, limit) {
    console.log('err:', err);
    console.log('result:', result);
    console.log('remaining:', remaining);
    console.log('limit:', limit);
  });

};

// doWork();

/**********************************************************************/

setClient();

var redirect_uri = 'http://localhost:3000/handleauth';

exports.authorize_user = function (req, res) {
  res.redirect(api.get_authorization_url(redirect_uri, { scope: ['likes', 'basic', 'follower_list', 'relationships'], state: 'a state' }));
};

exports.handleauth = function (req, res) {
  api.authorize_user(req.query.code, redirect_uri, function (err, result) {
    if (err) {
      console.log(err.body);
      res.send("Didn't work");
    } else {
      console.log('Yay! Access token is ' + result.access_token);
      res.send('You made it!!');

      api.use({ access_token: result.access_token });

      api.user(process.env.INSTAGRAM_USER_ID, function (err, result, remaining, limit) {

        res.send(err);

        // console.log('err:', err);

        console.log('result:', result);
        console.log('remaining:', remaining);
        console.log('limit:', limit);
      });
    }
  });
};

// This is where you would initially send users to authorize
app.get('/authorize_user', exports.authorize_user);
// This is your redirect URI
app.get('/handleauth', exports.handleauth);

http.createServer(app).listen(app.get('port'), function (){
  console.log("Express server listening on port " + app.get('port'));
});

/**********************************************************************/
