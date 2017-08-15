'use strict';

var _               = require('lodash');
var express         = require('express');
var fs              = require('fs');
var Promise         = require('promise');
var readline        = require('readline')
var readlinePromise = require('readline-promise')
var request         = require('request-promise');
var url             = require('url');
var yaml            = require('js-yaml');

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
  console.log('\n\n\n\nrequesting authorize_user...');
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
  console.log('\n\n\n\nrequesting access_token...');
  console.log('using code', app.code);

  var options = {
    method: 'POST',
    uri: 'https://api.instagram.com/oauth/access_token',
    form: {
      client_id: app.config.instagram.client.id,
      client_secret: app.config.instagram.client.secret,
      code: app.code,
      grant_type: 'authorization_code',
      redirect_uri: app.config.instagram.redirect_uri,
    },
    headers: {
      'User-Agent': 'Request-Promise'
    },
    json: true
  };

  console.log('\nusing this options', options);

  return request(options)
    .then(function (response) {
      console.log('access_token OK', response);
      return response;
    })
    .catch(function (err) {
      console.log('access_token response', err.error);
      res.send(err)
    });
};

/**********************************************************************/

var get_followed_by = function (req, res) {
  followed_by()
    .then(function (response) {
      console.log('get_followed_by OK', response);
      res.send(response)
    })
    .catch(function (err) {
      console.log('get_followed_by response', err.error);
      res.send(err)
    });
}

var followed_by = function () {
  console.log('\n\n\n\nrequesting followed_by...');
  console.log('using token', app.token);

  var options = {
    uri: 'https://api.instagram.com/v1/users/self/followed-by',
    qs: {
      access_token: app.token.access_token
    },
    headers: {
      'User-Agent': 'Request-Promise'
    },
    json: true
  };

  console.log('\nusing this options', options);

  return request(options)
    .then(function (response) {
      console.log('followed_by OK', response);
      return response;
    })
    .catch(function (err) {
      console.log('followed_by response', err.error);
      return err;
    });
};

/**********************************************************************/

var block_followers = function (req, res) {
  followed_by()
    .then(function (response) {
      console.log('iterating followers...', response.data.length);

      var response_list = [];
      var promises = [];

      _(response.data).forEach(function (n) {
        console.log('\n\n\n\nblocking id', n.id);

        var options = {
          method: 'POST',
          uri: 'https://api.instagram.com/v1/users/' + n.id + '/relationship',
          qs: {
            access_token: app.token.access_token
          },
          form: {
            action: 'block'
          },
          json: true
        };

        console.log('\nusing this options', options);

        var reqLocal = request(options)
          .then(function (response) {
            console.log('block_followers OK', n.id, response);
            response_list.push(response);
          })
          .catch(function (err) {
            console.log('block_followers response', n.id, err);
            response_list.push(err);
          });

        promises.push(reqLocal);

      });

      Promise.all(promises)
        .then(function () {
          res.send(response_list);
        })

    });
};

/**********************************************************************/

var get_users_search = function (req, res) {
  users_search()
    .then(function (response) {
      console.log('get_users_search OK', response);
      res.send(response)
    })
    .catch(function (err) {
      console.log('get_users_search response', err.error);
      res.send(err)
    });
}

var users_search = function (req, res) {
  console.log('\n\n\n\nrequesting users_search...');
  console.log('using token', app.token);

  var options = {
    uri: 'https://api.instagram.com/v1/users/search',
    qs: {
      access_token: app.token.access_token,
      count: 1,
      q: app.config.instagram.user.username,
    },
    headers: {
      'User-Agent': 'Request-Promise'
    },
    json: true
  };

  console.log('\nusing this options', options);

  return request(options)
    .then(function (response) {
      console.log('users_search OK', response);
      return response;
    })
    .catch(function (err) {
      console.log('users_search response', err.error);
      return err;
    });
};

var users_search_in_list = function (req, res) {
  console.log('\n\n\n\nrequesting users_search_in_list...');
  console.log('using token', app.token);

  var result = 'result:\n\n';

  readlinePromise.createInterface({
    input: fs.createReadStream('users.txt')
  })
  .each(function (line) {
    console.log('line from file:', line);

    var options = {
      uri: 'https://api.instagram.com/v1/users/search',
      qs: {
        access_token: app.token.access_token,
        count: 1,
        q: line,
      },
      headers: {
        'User-Agent': 'Request-Promise'
      },
      json: true
    };

    console.log('\nusing this options', options);
    console.log('');

    return request(options)
      .then(function (response) {
        console.log('users_search_in_list OK', response);
        result += response.data[0].username + ', ' + response.data[0].id + '\n';
        return response;
      })
      .catch(function (err) {
        console.log('users_search_in_list response', err.error);
        return err;
      });

  })
  .then(function(count) {
    console.log('result');
    res.send(result);
  });

}

/**********************************************************************/

var users_media_recent = function (req, res) {
  console.log('\n\n\n\nrequesting users_media_recent...');
  console.log('using token', app.token);

  users_search(req, res)
    .then(function (response) {
      if (response.data.length > 0) {

        var options = {
          uri: 'https://api.instagram.com/v1/users/' + response.data[0].id + '/media/recent',
          qs: {
            access_token: app.token.access_token
          },
          headers: {
            'User-Agent': 'Request-Promise'
          },
          json: true
        };

        console.log('\nusing this options', options);

        return request(options)
          .then(function (response) {
            console.log('users_media_recent OK', response);
            res.send(response)
          })
          .catch(function (err) {
            console.log('users_media_recent response', err.error);
            res.send(err)
          });

      }
    });
};

/**********************************************************************/

var users_self_media_liked = function (req, res) {
  console.log('\n\n\n\nrequesting users_self_media_liked...');
  console.log('using token', app.token);

  var options = {
    uri: 'https://api.instagram.com/v1/users/self/media/liked',
    qs: {
      access_token: app.token.access_token,
      // count: 10,
      // max_like_id: 999999999
    },
    headers: {
      'User-Agent': 'Request-Promise'
    },
    json: true
  };

  console.log('\nusing this options', options);

  return request(options)
    .then(function (response) {
      console.log('users_self_media_liked OK', response);
      res.send(response)
    })
    .catch(function (err) {
      console.log('users_self_media_liked response', err.error);
      res.send(err)
    });

};

/**********************************************************************/

app.get('/authorize_user', authorize_user);
app.get('/block_followers', block_followers);
app.get('/followed_by', get_followed_by);
app.get('/handleauth', handleauth);
app.get('/users_media_recent', users_media_recent);
app.get('/users_search', get_users_search);
app.get('/users_search_in_list', users_search_in_list);
app.get('/users_self_media_liked', users_self_media_liked);

app.set('json spaces', 2);

var server = app.listen(8881, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('example app listening at http://%s:%s', host, port);
});

/**********************************************************************/
