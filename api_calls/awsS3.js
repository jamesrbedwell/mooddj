const aws = require('aws-sdk')

// AWS SETUP
aws.config.update({
  secretAccessKey: process.env.AWS_SECRET_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  region: "us-east-1"
});

function convertToBase64(dataImage) {
  return new Buffer(dataImage.replace(/^data:image\/\w+;base64,/, ""),"base64"); 
}

function getImageType(dataImage) {
  return dataImage.split(";")[0].split("/")[1];
}

module.exports = {
  upload(image, Bucket) {
    let s3 = new aws.S3()
    let base64image = convertToBase64(image)
    let imageType = getImageType(image)
    let awsParams = {
      Bucket,
      Key: `${Date.now().toString()}.${imageType}`, // type is not required
      Body: base64image,
      ACL: "public-read",
      ContentEncoding: "base64", // required
      ContentType: `image/${imageType}` // required. Notice the back ticks
    };
    return s3.upload(awsParams).promise()
  }
}