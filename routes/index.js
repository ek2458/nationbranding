var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

// our db model
var Country = require("../models/country.js");

// S3 File dependencies
var AWS = require('aws-sdk');
var awsBucketName = process.env.AWS_BUCKET_NAME;
var s3Path = process.env.AWS_S3_PATH; // TODO - we shouldn't hard code the path, but get a temp URL dynamically using aws-sdk's getObject
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY
});
var s3 = new AWS.S3();

// file processing dependencies
var fs = require('fs');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

/**
 * GET '/'
 * Default home route. Just relays a success message back.
 * @param  {Object} req
 * @return {Object} json
 */
router.get('/', function(req, res) {

  console.log('home page requested!');

  var jsonData = {
  	name: 'class-directory',
  	status:'OK'
  }

  // respond with json data
  res.render('index.html');
});

router.get('/add-country', function(req,res){

  res.render('add.html');

})

router.get('/directory', function(req,res){

  res.render('directory.html');

})

router.get('/edit/:slug', function(req,res){

  var requestedSlug = req.params.slug;

  Country.findOne({slug: requestedSlug},function(err,data){
    if(err){
      var error = {
        status: "ERROR",
        message: err
      }
      return res.json(err)
    }

    console.log(data);

    var viewData = {
      pageTitle: "Edit " + data.name,
      country: data
    }

    res.render('edit.html',viewData);

  })

})

router.get('/edit/:id', function(req,res){

  var requestedId = req.params.id;

  Country.findById(requestedId,function(err,data){
    if(err){
      var error = {
        status: "ERROR",
        message: err
      }
      return res.json(err)
    }

    var viewData = {
      status: "OK",
      country: data
    }

    return res.render('edit.html',viewData);
  })

})

router.post('/api/create', function(req, res){

    console.log(req.body);

    var countryObj = {
      country: req.body.country,
      continent: req.body.continent,
      flag: req.body.flag,
      city: req.body.city,
      lat: req.body.lat,
      lon: req.body.lon,
      popn: req.body.popn.replace(/,/g , "");,
      currency: req.body.currency,
      language: req.body.language.split(','),
      animal: req.body.animal.split(','), // split string into array
      plant: req.body.plant,
      motto: req.body.motto,
      slug: req.body.country.toLowerCase().replace(/[^\w ]+/g,'').replace(/ +/g,'_')
    }

    var country = new Country(countryObj);

    country.save(function(err,data){
      if (err){
        var error = {
          status:'ERROR',
          message: 'Error saving country'
        };
        return res.json(error);
      }

      var jsonData = {
        status: 'OK',
        country: data
      }

      return res.json(jsonData);
      // res.render('directory.html');

    })

});

router.get('api/country/:slug', function(req,res){
  var reqestedSlug = req.params.slug;

  console.log(reqestedSlug);
  Country.findOne({slug:requestedSlug}, function(err,data){
    if(!data || data==null || data==""){
      var error={
        status: 'error',
        message: "we could not find that country"
      }

      res.json({status:'error', message:'could not find that country'});
    }
    console.log('found that country -->');
    console.log(data);

    res.json(data);
  })

})

router.post('/api/edit/:slug', function(req,res){

  console.log(req.body);
  var requestedSlug = req.params.slug;

  var countryObj = {
    country: req.body.country,
    continent: req.body.continent,
    flag: req.body.flag,
    city: req.body.city,
    lat: req.body.lat,
    lon: req.body.lon,
    popn: req.body.popn,
    currency: req.body.currency,
    language: req.body.language.split(','),
    animal: req.body.animal.split(','), // split string into array
    plant: req.body.plant,
    motto: req.body.motto,
    slug: req.body.country.toLowerCase().replace(/[^\w ]+/g,'').replace(/ +/g,'_')
  }

  console.log(countryObj);

  Country.findOneAndUpdate({slug: requestedSlug},countryObj,function(err,data){
    if(err){
      var error = {
        status: "ERROR",
        message: err
      }
      return res.json(error)
    }

    var jsonData = {
      status: "OK",
      country: data
    }

    //return res.json(jsonData);

    return res.redirect('/directory');

  })

})

router.post('/api/create/image', multipartMiddleware, function(req,res){

  console.log('the incoming data >> ' + JSON.stringify(req.body));
  console.log('the incoming image file >> ' + JSON.stringify(req.files.image));

  var countryObj = {
    country: req.body.country,
    continent: req.body.continent,
    flag: req.body.flag,
    city: req.body.city,
    lat: req.body.lat,
    lon: req.body.lon,
    popn: parseInt(req.body.popn),
    currency: req.body.currency,
    language: req.body.language.split(','),
    animal: req.body.animal.split(','), // split string into array
    plant: req.body.plant,
    motto: req.body.motto,
    slug: req.body.country.toLowerCase().replace(/[^\w ]+/g,'').replace(/ +/g,'_')
  }


  // NOW, we need to deal with the image
  // the contents of the image will come in req.files (not req.body)
  var filename = req.files.image.name; // actual filename of file
  var path = req.files.image.path; // will be put into a temp directory
  var mimeType = req.files.image.type; // image/jpeg or actual mime type

  // create a cleaned file name to store in S3
  // see cleanFileName function below
  var cleanedFileName = cleanFileName(filename);

  // We first need to open and read the uploaded image into a buffer
  fs.readFile(path, function(err, file_buffer){

    // reference to the Amazon S3 Bucket
    var s3bucket = new AWS.S3({params: {Bucket: awsBucketName}});

    // Set the bucket object properties
    // Key == filename
    // Body == contents of file
    // ACL == Should it be public? Private?
    // ContentType == MimeType of file ie. image/jpeg.
    var params = {
      Key: cleanedFileName,
      Body: file_buffer,
      ACL: 'public-read',
      ContentType: mimeType
    };

    // Put the above Object in the Bucket
    s3bucket.putObject(params, function(err, data) {
      if (err) {
        console.log(err)
        return;
      } else {
        console.log("Successfully uploaded data to s3 bucket");

        // now that we have the image
        // we can add the s3 url our country object from above
        countryObj['imageUrl'] = s3Path + cleanedFileName;

        // now, we can create our country instance
        var country = new Country(countryObj);

        country.save(function(err,data){
          if(err){
            var error = {
              status: "ERROR",
              message: err
            }
            return res.json(err)
          }

          var jsonData = {
            status: "OK",
            country: data
          }

          return res.json(jsonData);
        })

      }

    }); // end of putObject function

  });// end of read file

})

function cleanFileName (filename) {

    // cleans and generates new filename for example userID=abc123 and filename="My Pet Dog.jpg"
    // will return "abc123_my_pet_dog.jpg"
    var fileParts = filename.split(".");

    //get the file extension
    var fileExtension = fileParts[fileParts.length-1]; //get last part of file

    //add time string to make filename a little more random
    d = new Date();
    timeStr = d.getTime();

    //name without extension
    newFileName = fileParts[0];

    return newFilename = timeStr + "_" + fileParts[0].toLowerCase().replace(/[^\w ]+/g,'').replace(/ +/g,'_') + "." + fileExtension;

}

router.get('/api/get', function(req,res){

  Country.find(function(err,data){

      if(err){
        var error = {
          status: "ERROR",
          message: err
        }
        return res.json(err)
      }

      var jsonData = {
        status: "OK",
        countryObj: data
      }

      return res.json(jsonData);

  })

})

router.get('/api/get/:continent',function(req,res){

  var requestedContinent = req.params.continent;

  console.log(requestedContinent);

  Country.find({continent:requestedContinent},function(err,data){
      if(err){
        var error = {
          status: "ERROR",
          message: err
        }
        return res.json(err)
      }

      var jsonData = {
        status: "OK",
        country: data
      }

      return res.json(jsonData);
  })

})

// year, name
// /api/get/query?year=2016&name=Sam&hasGlasses=true

router.get('/api/get/query',function(req,res){

  console.log(req.query);

  var searchQuery = {};

  if(req.query.language){
    searchQuery['language'] =  req.query.language
  }

  if(req.query.continent){
    searchQuery['continent'] =  req.query.continent
  }

  if(req.query.plant){
    searchQuery['plant'] =  req.query.plant
  }

  Country.find(searchQuery,function(err,data){
    res.json(data);
  })

  // Country.find(searchQuery).sort('-name').exec(function(err,data){
  //   res.json(data);
  // })


})



module.exports = router;
