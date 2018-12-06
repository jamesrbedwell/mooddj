const requestPromise = require('request-promise')

//AZURE SETUP
const subscriptionKey = process.env.AZURE_SUB_KEY;
const uriBase =
  "https://westcentralus.api.cognitive.microsoft.com/face/v1.0/detect";
const azureParams = {
  returnFaceId: "false",
  returnFaceLandmarks: "false",
  returnFaceAttributes: "emotion"
};

module.exports = {
  getFaces(req) {
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
    return requestPromise.post(options)  
  } 
}
