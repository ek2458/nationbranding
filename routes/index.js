var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var geocoder = require('geocoder'); // geocoder library

// our db models
var Country = require("../models/country.js");
// var Course = require("../models/course.js");

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
  	'name': 'itp-directory',
  	'api-status':'OK'
  }

  // respond with json data
  //res.json(jsonData)

  // respond by redirecting
  //res.redirect('/directory')

  // respond with html
  res.render('directory.html')

});

router.get('/add-country', function(req,res){

  res.render('add.html')

})

router.get('/add-country-with-image', function(req,res){

  res.render('add-with-image.html')

})

router.get('/directory', function(req,res){

  res.render('directory.html')

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

  var requestedSlug = req.params.id;

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

//pull information form the req.bodycountry: req.body.country,

router.post('/api/create', function(req,res){

  console.log(req.body);

  var country = req.body.country;
  var continent = req.body.continent;
  var flag = req.body.flag;
  var capitalCity = req.body.capitalCity;
  var popn = req.body.popn.replace(/,/g,'');
  var currency = req.body.currency;
  var language = req.body.language.split(',');
  var coatOfArm = req.body.coatOfArm;
  var animal = req.body.animal.split(',');
  var plant = req.body.plant;
  var motto = req.body.motto;
  var slug = req.body.country.toLowerCase().replace(/[^\w ]+/g,'').replace(/ +/g,'-');


  var countryObj = {
    country: country,
    continent: continent,
    flag: flag,
    popn: popn,
    currency: currency,
    language: language,
    symbol: {
      coatOfArm: coatOfArm,
      animal: animal,
      plant: plant,
      motto: motto
    },
    slug: slug
  }

  // if there is no capitalCity, return an error
  if(!capitalCity) return res.json({status:'ERROR', message: 'You are missing a required field or have submitted a malformed request.'})

  // now, let's geocode the capitalCity
  geocoder.geocode(capitalCity, function (err,data) {


    // if we get an error, or don't have any results, respond back with error
    if (!data || data==null || err || data.status == 'ZERO_RESULTS'){
      var error = {status:'ERROR', message: 'Error finding capital city'};
      return res.json({status:'ERROR', message: 'You are missing a required field or have submitted a malformed request.'})
    }

    // else, let's pull put the lat lon from the results
    var lon = data.results[0].geometry.location.lng;
    var lat = data.results[0].geometry.location.lat;

    // now, let's add this to our animal object from above
    countryObj.capitalCity = {
      geo: [lon,lat], // need to put the geo co-ordinates in a lng-lat array for saving
      city: data.results[0].formatted_address // the capitalCity
    }

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

      return res.redirect('/directory');

    })
  });
})

router.post('/api/edit/:slug', function(req,res){

  console.log(req.body);
  var requestedSlug = req.params.slug;

  var country = req.body.country;
  var continent = req.body.continent;
  var flag = req.body.flag;
  var capitalCity = req.body.capitalCity;
  var popn = req.body.popn.replace(/,/g,'');
  var currency = req.body.currency;
  var language = req.body.language.split(',');
  var coatOfArm = req.body.coatOfArm;
  var animal = req.body.animal.split(',');
  var plant = req.body.plant;
  var motto = req.body.motto;
  var slug = req.body.country.toLowerCase().replace(/[^\w ]+/g,'').replace(/ +/g,'-');

  var countryObj = {
    country: country,
    continent: continent,
    flag: flag,
    popn: popn,
    currency: currency,
    language: language,
    symbol: {
      coatOfArm: coatOfArm,
      animal: animal,
      plant: plant,
      motto: motto
    },
    slug: slug
  }

  // if there is no capitalCity, return an error
  if(!capitalCity) return res.json({status:'ERROR', message: 'You are missing a required field or have submitted a malformed request.'})

  // now, let's geocode the capitalCity
  geocoder.geocode(capitalCity, function (err,data) {


    // if we get an error, or don't have any results, respond back with error
    if (!data || data==null || err || data.status == 'ZERO_RESULTS'){
      var error = {status:'ERROR', message: 'Error finding capital city'};
      return res.json({status:'ERROR', message: 'You are missing a required field or have submitted a malformed request.'})
    }

    // else, let's pull put the lat lon from the results
    var lon = data.results[0].geometry.location.lng;
    var lat = data.results[0].geometry.location.lat;

    // now, let's add this to our animal object from above
    countryObj.capitalCity = {
      geo: [lon,lat], // need to put the geo co-ordinates in a lng-lat array for saving
      city: data.results[0].formatted_address // the capitalCity
    }

    console.log(countryObj);

    Country.findOneAndUpdate(requestedSlug,countryObj,function(err,data){
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
  });
});

router.post('/api/create/image', multipartMiddleware, function(req,res){

  console.log('the incoming data >> ' + JSON.stringify(req.body));
  console.log('the incoming image file >> ' + JSON.stringify(req.files.image));

  var country = req.body.country;
  var continent = req.body.continent;
  var flag = req.body.flag;
  var capitalCity = req.body.capitalCity;
  var popn = req.body.popn.replace(/,/g,'');
  var currency = req.body.currency;
  var language = req.body.language.split(',');
  var coatOfArm = req.body.coatOfArm;
  var animal = req.body.animal.split(',');
  var plant = req.body.plant;
  var motto = req.body.motto;
  var slug = req.body.country.toLowerCase().replace(/[^\w ]+/g,'').replace(/ +/g,'-');

  var countryObj = {
    country: country,
    continent: continent,
    flag: flag,
    popn: popn,
    currency: currency,
    language: language,
    symbol: {
      coatOfArm: coatOfArm,
      animal: animal,
      plant: plant,
      motto: motto
    },
    slug: slug
  }

  // if there is no capitalCity, return an error
  if(!capitalCity) return res.json({status:'ERROR', message: 'You are missing a required field or have submitted a malformed request.'})

  // now, let's geocode the capitalCity
  geocoder.geocode(capitalCity, function (err,data) {


    // if we get an error, or don't have any results, respond back with error
    if (!data || data==null || err || data.status == 'ZERO_RESULTS'){
      var error = {status:'ERROR', message: 'Error finding capital city'};
      return res.json({status:'ERROR', message: 'You are missing a required field or have submitted a malformed request.'})
    }

    // else, let's pull put the lat lon from the results
    var lon = data.results[0].geometry.location.lng;
    var lat = data.results[0].geometry.location.lat;

    // now, let's add this to our animal object from above
    countryObj.capitalCity = {
      geo: [lon,lat], // need to put the geo co-ordinates in a lng-lat array for saving
      city: data.results[0].formatted_address // the capitalCity
    }
  })


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
        country: data
      }

      return res.json(jsonData);

  })

})

router.get('/api/get/continent/:continent',function(req,res){

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

// example query --> /api/get/query?continent=2016&country=korea
// --> continent=asia
// --> country=korea
router.get('/api/get/query',function(req,res){

  console.log(req.query);

  // start with an empty searchQuery object
  var searchQuery = {};

  // if continent is in the query, add it to the searchQuery object
  if(req.query.continent){
    searchQuery['continent'] =  req.query.continent
  }
  // in the above example, searchQuery is now --> { continent: asia }

  // if country is in the query, add it to the searchQuery object
  if(req.query.country){
    searchQuery['country'] =  req.query.country
  }
  // in the above example, searchQuery is now { continent: aisa, country: Sam}

  // if language is in the query, add it to the example
  if(req.query.language){
    searchQuery['language'] =  req.query.language
  }

  Country.find(searchQuery,function(err,data){
    res.json(data);
  })

  // Country.find(searchQuery).sort('-name').exec(function(err,data){
  //   res.json(data);
  // })

})



module.exports = router;
