/* <script src="https://sdk.scdn.co/spotify-player.js"></script>
<script src="/javascript/spotifyWP.js"></script> */

// let player = window.player
//       let currentTrack;
//       player.getCurrentState().then(state => {
//         if (!state) {
//           console.error('User is not playing music through the Web Playback SDK');
//           return;
//         }
//         let {
//           current_track,
//         } = state.track_window;
//         console.log(current_track)
//         currentTrack = current_track ? current_track : {"id": 0}

window.onSpotifyWebPlaybackSDKReady = () => {
  let accessToken;
  fetch('/api/access_token', {
    method: 'get'
  }).then(res => res.json())
    .catch(err => console.log(err))
    .then(data => {
      console.log(data)
      accessToken = data.accessToken
    })
  
  const player = new Spotify.Player({
    name: 'MooDJ Device',
    getOAuthToken: cb => { cb(accessToken); }
  });

  window.player = player

  // Error handling
  player.addListener('initialization_error', ({ message }) => { console.error(message); });
  player.addListener('authentication_error', ({ message }) => { console.error(message); });
  player.addListener('account_error', ({ message }) => { console.error(message); });
  player.addListener('playback_error', ({ message }) => { console.error(message); });

  // Playback status updates
  // player.addListener('player_state_changed', state => { console.log(state); });

  // Ready
  player.addListener('ready', ({ device_id }) => {
    console.log('Ready with Device ID', device_id);
  });

  // Not Ready
  player.addListener('not_ready', ({ device_id }) => {
    console.log('Device ID has gone offline', device_id);
  });

  // Connect to the player!
  player.connect();
};