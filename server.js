const express = require("express"),
  app = express(),
  PORT = process.env.PORT || 8888,
  session = require("express-session"),
  cookieParser = require("cookie-parser"),
  bodyParser = require("body-parser"),
  spotify = require("./api_calls/spotify"),
  spotifyOauth = require("./api_calls/spotifyOAuth"),
  awsS3 = require("./api_calls/awsS3"),
  azure = require("./api_calls/azure.js")
  funcs = require("./funcs")

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(cookieParser());
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
  })
);
app.use(bodyParser.json({ limit: "1000kb" }));

//SPOTIFY OAUTH
let redirectUri = process.env.REDIRECT_URI || "http://localhost:8888/callback";

app.get("/login", function(req, res) {
  res.redirect(spotifyOauth.authorizeClientAccessURL(redirectUri));
});

app.get("/callback", function(req, res) {
  let authCode = req.query.code || null;
  spotifyOauth.callbackAfterClientReceivesAccess(req, authCode, redirectUri, (uri) => {
    res.redirect(uri);
  })
});

app.get("/", (req, res) => {
  if (!req.session.access_token) {
    res.render("index");
  } else {
    // Get user details from spotify and save to session if not there
    if (!req.session.user_details) {
      spotify.getUserDetails(req)
        .then(userDetails => {
          req.session.user_details = userDetails.data;
          let userID = userDetails.data.id
          // get back a list of users playlists and see if "MooDJ Playlist" exists, assign the id to session if it does
          spotify.retrievePlaylists(req, userID)
            .then(playlistRes => playlistRes.items.filter(playlist => playlist.name === "MooDJ Playlist"))
            .then(mooDJPlaylistArr => {
              return {
                id: mooDJPlaylistArr.length > 0 ? mooDJPlaylistArr[0].id : null,
                length: mooDJPlaylistArr.length > 0 ? mooDJPlaylistArr[0].tracks.total : 0
              }
            })
            .then(mooDJPlaylist => {
              req.session.playlist_length = mooDJPlaylist.length
              if (mooDJPlaylist.id) {
                req.session.playlist_id = mooDJPlaylist.id
                req.session.playlistCreated = false
                console.log("Playlist existed Playlist ID: " + mooDJPlaylist.id + ". Saved to Session Playlist ID: " + req.session.playlist_id)
              } else {
                // create instance of moodj playlist on user profile and get playlist id back
                spotify.createPlaylist(req, userID)
                  .then(data => {
                    req.session.playlist_id = data.id
                    req.session.playlistCreated = false
                    console.log("Playlist created with Playlist ID: " + data.id + ". Saved to Session Playlist ID: " + req.session.playlist_id)
                  })
              }
            }).then(() => {
              // render index page with webcam
              res.render("index-si", {
                name: req.session.user_details.display_name
              });
            })
        })      
    };  
  }
});

// API POST REQUEST FROM FRONT END
app.post("/api/receivephoto", (req, res) => {
  let dataImage = req.body.data.image
  // new aws request
  awsS3.upload(dataImage, "moodjpics")
    .then(awsRes => {
      req.session.image_location = awsRes.Location
    })
    .catch(err => console.log(`S3 Error ${err}`))
    .then(() => {
      azure.getFaces(req)
        .then(faces => {
          faces = JSON.parse(faces)
          return Object.keys(faces[0]["faceAttributes"]["emotion"])
            .map(emotion => {
              let average = faces.reduce((accum, object) => {
                    accum += object["faceAttributes"]["emotion"][emotion];
                    return accum;
                  }, 0) / faces.length;
              return [emotion, average];
            })
            .reduce((accum, mood) => {
              mood[1] > accum[1] ? (accum = mood) : accum;
              return accum;
            })[0];
          }) 
        .catch(err => console.log(`Auzure Error ${err}`))
        .then(emotion => {
          console.log(emotion)
          let trackQuery = `${emotion}+${funcs.getTimeOfDay()}`
          spotify.getTracks(req, trackQuery)
            .then(songRes => {
              let songsQuery = songRes.tracks.items.map(track => track.uri).join(',')
              let songMethod = req.session.playlistCreated || req.session.playlist_length === 0 ? 'POST' : 'PUT'
              return spotify.addTracksToPlaylist(req, req.session.playlist_id, songsQuery, songMethod)
            })
            .then(songsAdded => {
              req.session.playlist_length === 0 ? req.session.playlist_length = 20 : null
              console.log("Songs Added")
            })
            .catch(err => console.log(`Songs to Playlist Error: ${err}`))
        })
        .catch(err => console.log(err)) 
    })
})

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
})
