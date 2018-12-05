const express = require("express"),
  app = express(),
  PORT = process.env.PORT || 8888,
  axios = require("axios"),
  session = require("express-session"),
  querystring = require("querystring"),
  request = require("request"),
  cookieParser = require("cookie-parser"),
  bodyParser = require("body-parser"),
  aws = require("aws-sdk"),
  fetch = require("node-fetch")

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
let redirect_uri = process.env.REDIRECT_URI || "http://localhost:8888/callback";

app.get("/login", function(req, res) {
  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: process.env.SPOTIFY_ID,
        scope:
          "user-read-private user-read-email playlist-modify-private playlist-read-private playlist-modify-public",
        redirect_uri
      })
  );
});

app.get("/callback", function(req, res) {
  let code = req.query.code || null;
  let authOptions = {
    url: "https://accounts.spotify.com/api/token",
    form: {
      code: code,
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
    var access_token = body.access_token;
    req.session.access_token = access_token;
    let uri = process.env.FRONTEND_URI || "http://localhost:8888";
    res.redirect(uri);
  });
});

// INDEX PAGE
app.get("/", (req, res) => {
  if (!req.session.access_token) {
    res.render("index");
  } else {
    // Get user details from spotify and save to session if not there
    if (!req.session.user_details) {
      axios
        .get("https://api.spotify.com/v1/me", {
          headers: {
            Authorization: "Bearer " + req.session.access_token
          }
        })
        .then(response => {
          req.session.user_details = response.data;
          let userID = response.data.id
          // get back a list of users playlists and see if "MooDJ Playlist" exists, assign the id to session if it does
          // fetch(`https://api.spotify.com/v1/users/${userID}/playlists`, {
          //   method: 'get',
          //   headers: {
          //     'Authorization': 'Bearer ' + req.session.access_token,
          //     'Content-Type': 'application/json'
          //   },
          //   json: true
          // }).then(res => res.json())
          //   .catch(err => console.log(err))
          //   .then(data => console.log(data))
          // })

          // create instance of moodj playlist on user profile and get playlist id back
          fetch(`https://api.spotify.com/v1/users/${userID}/playlists`, {
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
            .then(data => {
              req.session.playlist_id = data.id
              console.log("Playlist created with Playlist ID: " + data.id + ". Saved to Session Playlist ID: " + req.session.playlist_id)
            
            // render index page with webcam
            res.render("index-si", {
              name: req.session.user_details.display_name
            });
          });  
        })
    };
  }
})

// AWS SETUP
aws.config.update({
  secretAccessKey: process.env.AWS_SECRET_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  region: "us-east-1"
});

//AZURE SETUP
const subscriptionKey = process.env.AZURE_SUB_KEY;
const uriBase =
  "https://westcentralus.api.cognitive.microsoft.com/face/v1.0/detect";
const azureParams = {
  returnFaceId: "false",
  returnFaceLandmarks: "false",
  returnFaceAttributes: "emotion"
};

// API POST REQUEST FROM FRONT END
app.post("/api/receivephoto", (req, res) => {
  // req.body.image is base64
  let dataImage = req.body.data.image
  // new aws request
  let s3 = new aws.S3();
  //create a blob from base64
  let base64Data = new Buffer(
    dataImage.replace(/^data:image\/\w+;base64,/, ""),
    "base64"
  );
  let imageType = dataImage.split(";")[0].split("/")[1];
  let awsParams = {
    Bucket: "moodjpics",
    Key: `${Date.now().toString()}.${imageType}`, // type is not required
    Body: base64Data,
    ACL: "public-read",
    ContentEncoding: "base64", // required
    ContentType: `image/${imageType}` // required. Notice the back ticks
  };
  //upload to S3, returns JSON to get the URL location
  s3.upload(awsParams, (err, data) => {
    if (err) {
      return console.log("S3 Error");
    }
    req.session.image_location = data.Location;
    // set up for sending to Microsoft Azure Face API
    let imageUrl = req.session.image_location;
    let options = {
      uri: uriBase,
      qs: azureParams,
      body: '{"url": ' + '"' + imageUrl + '"}',
      headers: {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": subscriptionKey
      }
    };
    request.post(options, (error, response, body) => {
      if (error) {
        console.log("Azure Error: ", error);
        return;
      }
      let faceAPIRes = JSON.parse(body)      
      const emotions = ["anger", "contempt", "disgust", "fear", "happiness", "neutral", "sadness", "surprise"]
      let highestEmotion = emotions.map(emotion => {
        let average = faceAPIRes.reduce((accum, object) => {
          accum += object["faceAttributes"]["emotion"][emotion]
          return accum
        },0) / faceAPIRes.length
        return [emotion, average]
      }).reduce((accum, mood) => {
        mood[1] > accum[1] ? accum = mood : accum
        return accum
      })[0]

      // GET TIME OF DAY
      let currentHour = new Date().getHours()
      let timeOfDay;
      if (currentHour > 3 && currentHour < 12) {
        timeOfDay = "morning"
      } else if (currentHour < 17) {
        timeOfDay = "afternoon"
      } else {
        timeOfDay = "night"
      }
      let songsForPlaylist;
      // HIGHEST EMOTION AND TIME OF DAY INTO SONG QUERY TO SPOTIFY
      console.log(req.session.access_token)
      fetch(`https://api.spotify.com/v1/search?q=${highestEmotion}&type=track`, {
        method: 'get',
        headers: {
          'Authorization': 'Bearer ' + req.session.access_token,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }).then(res => res.json())
        .catch(err => console.log(err))
        .then(songRes => {
          songsForPlaylist = songRes.tracks.items.map(track => track.uri)
          // ADD QUERIED SONGS TO CREATED PLAYLIST
          let query = songsForPlaylist.join(',')
          console.log(query)
          console.log(req.session.playlist_id)
          fetch(`https://api.spotify.com/v1/playlists/${req.session.playlist_id}/tracks?uris=${query}`, {
            method: 'post',
            headers: {
              'Authorization': 'Bearer ' + req.session.access_token,
              'Content-Type': 'application/json'
            },
            json: true
          }).then(res => res.json())
            .catch(err => console.log(err))
            .then(addSongsRes => console.log("Songs Added"))
            .catch(err => console.log("Songs to Playlist Error"))
      })
      .catch(err => console.log(err)) 
    });
  });
});

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
})
