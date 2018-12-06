// const constraints = {
//   audio: false,
//   video: true{ width: 480, height: 320 }
// }
const webcam = document.querySelector('.webcam'),
      canvas = document.querySelector('#canvas'),
      context = canvas.getContext('2d'),
      photo = document.querySelector('.photo'),
      takePhotoBtn = document.querySelector('.take-photo-btn'),
      startMusicBtn = document.querySelector('.start-music-btn'),
      emotion = document.querySelector('.emotion')


navigator.mediaDevices.getUserMedia({
  video: true,
  audio: false
})
  .then(function(mediaStream) {
    webcam.srcObject = mediaStream;
  })
  .catch(function(err) {
    // handle error
  });

// FOR USING INTERVALS
// setInterval(function() {
//   context.drawImage(video, 0, 0, 480, 320)
//   photo.src = canvas.toDataURL('image/png')
// }, 10000)

function takePhoto() {
  context.drawImage(webcam, 0, 0, 480, 360)
  photo.src = canvas.toDataURL('image/png')
  axios.post('/api/receivephoto', {
    data: {
      image: photo.src
    }
  }).then(response => {
    emotion.innerHTML = `It looks like your current mood is, <span>${response.data.emotion}!</span>`
    axios.post('/api/startmusic', {
      data: {
        startMusic: true
      }
    }).then(response => response)
  })
}

function startMusic() {
  axios.post('/api/startmusic', {
    data: {
      startMusic: true
    }
  }).then(response => response)
}
startMusicBtn.addEventListener('click', startMusic)
takePhotoBtn.addEventListener('click', takePhoto)