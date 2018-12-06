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
        'name': 'moodDJ Playlist',
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
      },
      json: true
    }).then(res => res.json())
      .catch(err => console.log(err))    
  },

  addTracksToPlaylist(req, tracks, method) {
    return fetch(`https://api.spotify.com/v1/playlists/${req.session.playlist_id}/tracks?uris=${tracks}`, {
      method,
      headers: {
        'Authorization': 'Bearer ' + req.session.access_token,
        'Content-Type': 'application/json'
      },
      json: true
    }).then(res => res.json())
      .catch(err => console.log(err))         
  },

  getTracksInMoodDJPlaylist(req) {
    return fetch(`https://api.spotify.com/v1/playlists/${req.session.playlist_id}/tracks`, {
      method: 'get',
      headers: {
        'Authorization': 'Bearer ' + req.session.access_token,
        'Content-Type': 'application/json'
      },
      json: true
    }).then(res => res.json())
      .catch(err => console.log(err)) 
  },

  deleteTracksFromPlaylist(req, tracks) {
    return fetch(`https://api.spotify.com/v1/playlists/${req.session.playlist_id}/tracks`, {
      method: 'delete',
      headers: {
        'Authorization': 'Bearer ' + req.session.access_token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "tracks": tracks
      }),
      json: true
    }).then(res => res.json())
    .catch(err => console.log(err))
  },

  playMoodDJ(req) {
    return fetch("https://api.spotify.com/v1/me/player/play", {
      method: 'put',
      headers: {
        'Authorization': 'Bearer ' + req.session.access_token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "context_uri": `spotify:playlist:${req.session.playlist_id}`
      }),
      json: true
    })
  },

  playNextTrack(req) {
    return fetch("https://api.spotify.com/v1/me/player/next", {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + req.session.access_token,
      },
      json: true
    })
  },

  getCurrentTrack(req) {
    return fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      method: 'get',
      headers: {
        'Authorization': 'Bearer ' + req.session.access_token,
      }
    }).then(res => res.json())
    .catch(err => console.log(err))
  }

}