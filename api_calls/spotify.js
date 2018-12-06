const fetch = require('node-fetch')
const axios = require('axios')

module.exports = {
  getUserDetails(req) {
    return axios.get("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: "Bearer " + req.session.access_token
      }
    })
  },
  retrievePlaylists(req, userID) {
    return fetch(`https://api.spotify.com/v1/users/${userID}/playlists`, {
      method: 'get',
      headers: {
        'Authorization': 'Bearer ' + req.session.access_token,
        'Content-Type': 'application/json'
      },
      json: true
    }).then(res => res.json())
      .catch(err => console.log(err))
  },

  createPlaylist(req, userID) {
    return fetch(`https://api.spotify.com/v1/users/${userID}/playlists`, {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + req.session.access_token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        'name': 'MooDJ Playlist',
        'public': 'false',
        'description': 'A playlist for your mood'
      }),
      json: true
    }).then(res => res.json())
      .catch(err => console.log(err))
  },

  getTracks(req, query) {
    return fetch(`https://api.spotify.com/v1/search?q=${query}&type=track`, {
      method: 'get',
      headers: {
        'Authorization': 'Bearer ' + req.session.access_token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }).then(res => res.json())
      .catch(err => console.log(err))    
  },

  addTracksToPlaylist(req, playlist, tracks, method) {
    return fetch(`https://api.spotify.com/v1/playlists/${playlist}/tracks?uris=${tracks}`, {
      method,
      headers: {
        'Authorization': 'Bearer ' + req.session.access_token,
        'Content-Type': 'application/json'
      },
      json: true
    }).then(res => res.json())
      .catch(err => console.log(err))
            
  }

}