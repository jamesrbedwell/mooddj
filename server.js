const express = require('express')
const app = express()
const PORT = process.env.PORT || 8888
const axios = require('axios')
const session = require('express-session')

app.set('view engine', 'ejs')

app.use(express.static('public'))


//SPOTIFY OAUTH
let redirect_uri = 
  process.env.REDIRECT_URI || 
  'http://localhost:8888/callback'

app.get('/login', function(req, res) {
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: process.env.SPOTIFY_ID,
      scope: 'user-read-private user-read-email playlist-modify-private playlist-read-private playlist-modify-public playlist-read-public',
      redirect_uri
    }))
})

app.get('/callback', function(req, res) {
  let code = req.query.code || null
  let authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + (new Buffer(
        process.env.SPOTIFY_ID + ':' + process.env.SPOTIFY_SECRET
      ).toString('base64'))
    },
    json: true
  }
  request.post(authOptions, function(error, response, body) {
    var access_token = body.access_token
    let uri = process.env.FRONTEND_URI || 'http://localhost:8888'
    res.redirect(uri + '?access_token=' + access_token)
  })
})

app.get('/', (req, res) => {
  res.render('index')
})

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`)
})