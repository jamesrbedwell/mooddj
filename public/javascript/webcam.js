  // const constraints = {
  //   audio: false,
  //   video: true{ width: 480, height: 320 }
  // }
  const webcam = document.querySelector('.webcam')
  const canvas = document.querySelector('#canvas')
  const context = canvas.getContext('2d')
  const photo = document.querySelector('.photo')
  const takePhotoBtn = document.querySelector('.take-photo-btn')
  
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
    context.drawImage(webcam, 0, 0, 480, 320)
    photo.src = canvas.toDataURL('image/png')
    axios.post('/api/receivephoto', {
      data: {
        image: photo.src
      }
    }).then(response => console.log(response))
  }
  takePhotoBtn.addEventListener('click', takePhoto)