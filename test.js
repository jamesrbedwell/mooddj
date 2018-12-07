let emotions = {
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
console.log(randomEntry(emotions.anger))