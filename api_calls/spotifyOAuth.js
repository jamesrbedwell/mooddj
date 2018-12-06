const querystring = require("querystring"),
      request = require("request")

module.exports = {
  authorizeClientAccessURL(redirect_uri) {
    return "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: process.env.SPOTIFY_ID,
        scope:
          "user-read-private user-read-email playlist-modify-private playlist-read-private playlist-modify-public user-read-playback-state user-modify-playback-state streaming user-read-birthdate user-read-currently-playing",
        redirect_uri
      })
  },
  callbackAfterClientReceivesAccess(req, authCode, redirect_uri, redirectFunc) {
    let authOptions = {
      url: "https://accounts.spotify.com/api/token",
      form: {
        code: authCode,
        redirect_uri,
        grant_type: "authorization_code"
      },
      headers: {
        Authorization:
          "Basic " +
          new Buffer(
            process.env.SPOTIFY_ID + ":" + process.env.SPOTIFY_SECRET
          ).toString("base64")
      },
      json: true
    };
    request.post(authOptions, function(error, response, body) {
      let access_token = body.access_token;
      req.session.access_token = access_token;
      let uri = process.env.FRONTEND_URI;
      redirectFunc(uri)
    });
  }
}