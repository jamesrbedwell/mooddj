const express = require("express"),
  app = express(),
  PORT = process.env.PORT || 8888,
  session = require("express-session"),
  cookieParser = require("cookie-parser"),
  bodyParser = require("body-parser"),
  spotify = require("./api_calls/spotify"),
  spotifyOauth = require("./api_calls/spotifyOAuth"),
  awsS3 = require("./api_calls/awsS3"),
  azure = require("./api_calls/azure.js"),
  funcs = require("./funcs"),
  emotions = {
    "anger": ["angry", "fierce", "furious", "enraged"],
    "contempt": ["contempt", "despite","hatred"],
    "disgust": ["disgust", "hate", "dislike"],
    "fear": ["scary", "despair", "dread", "horror"],
    "happiness": ["happy", "lively", "upbeat", "party"],
    "neutral": ["neutral", "calm", "cool", "easy"],
    "sadness": ["sad", "somber", "sorry", "glum"],
    "surprise": ["surpise", "startled", "stunned"]
  }

function randomEntry(arr) {
  let rand = Math.floor(Math.randon() * arr.length)
  return arr[rand]
}

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
let redirectUri = process.env.REDIRECT_URI;
let redirectUrl = process.env.REDIRECT_URL

app.get("/login", function(req, res) {
  res.redirect(spotifyOauth.authorizeClientAccessURL(redirectUri));
});

app.get("/callback", function(req, res) {
  let authCode = req.query.code || null;
  spotifyOauth.callbackAfterClientReceivesAccess(req, authCode, redirectUrl, (uri) => {
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
          // get back a list of users playlists and see if "MoodDJ Playlist" exists, assign the id to session if it does
          spotify.retrievePlaylists(req, userID)
            .then(playlistRes => playlistRes.items.filter(playlist => playlist.name === "moodDJ Playlist"))
            .then(moodDJPlaylistArr => {
              return {
                id: moodDJPlaylistArr.length > 0 ? moodDJPlaylistArr[0].id : null,
                length: moodDJPlaylistArr.length > 0 ? moodDJPlaylistArr[0].tracks.total : 0
              }
            })
            .then(moodDJPlaylist => {
              req.session.playlist_length = moodDJPlaylist.length
              if (moodDJPlaylist.id) {
                req.session.playlist_id = moodDJPlaylist.id
                req.session.playlistCreated = false
                return
              } else {
                // create instance of mooddj playlist on user profile and get playlist id back
              return spotify.createPlaylist(req, userID)
                  .then(data => {
                    req.session.playlist_id = data.id
                    req.session.playlistCreated = false
                    return 
                  })
              }
            }).then(() => {
              let theTrack = "spotify:track:4w3tQBXhn5345eUXDGBWZG"
              return spotify.addTracksToPlaylist(req, theTrack, 'PUT')
                .then(trackAdded => trackAdded)
            }).then(() => {
              res.render("index-si", {
                name: req.session.user_details.display_name
              })
            })
        })      
    };  
  }
})

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
          let trackQuery = `${emotions[randomEntry(emotion)]}`
          spotify.getTracks(req, trackQuery)
            .then(songRes => {
              let songsQuery = songRes.tracks.items.map(track => track.uri).join(',')
              return spotify.addTracksToPlaylist(req, songsQuery, 'PUT')
            })
            .then(songsAdded => {
              req.session.playlist_length === 0 ? req.session.playlist_length = 20 : null
              res.json({
                emotion
              })
            })
            .catch(err => console.log(`Songs to Playlist Error: ${err}`))
          // spotify.getTracksInMoodDJPlaylist(req)
            // .then(moodDJPlaylistTracks => {
            //   console.log(req.session.currentTrack)
            //   if (req.session.currentTrack !== 0) {
            //     return moodDJPlaylistTracks['items'].reduce((acc, cur) => {
            //         cur['track']['id'] === req.session.currentTrack['track']['id'] ? acc : acc.push({"uri": cur['track']['uri']})
            //         return acc
            //       },[])
            //   }
            // })
            // .catch(err => console.log(`Current Playlist Track Error: ${err}`))
            // .then(songsToDelete => {
            //   console.log(songsToDelete)
            //   return spotify.deleteTracksFromPlaylist(req, songsToDelete)
            // })
            // .catch(err => `Delete Error: ${err}`)
            // .then(songsDeleted => {
        })
        .catch(err => console.log(err)) 
      })
})

app.get('/api/access_token', (req, res) => {
    res.json({
      accessToken: req.session.access_token
    })
  }
)

app.post('/api/startmusic', (req, res) => {
  spotify.playMoodDJ(req)
    .then(data => {
      res.json({
        songStarted: data
      })
    })
    .catch(err => console.log(err))
  
})

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
})
