var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// See http://mongoosejs.com/docs/schematypes.html

var countrySchema = new Schema({
	country: String,
	// country: {type: String, unique: true, required: true}, // this version requires this field to exist
	// name: {type: String, unique: true}, // this version requires this field to be unique in the db
	continent: String,
	flag: String,
	capitalCity: {
		city: String,
		lat: String,
		lon: String
	},
	popn: String,
	currency: String,
	language: [String],
	symbol: {
		coatOfArm: String,
		animal: [String],
		plant: String,
		motto: String,
	},
	dateAdded : { type: Date, default: Date.now },
})

// export 'Animal' model so we can interact with it in other files
module.exports = mongoose.model('Country',countrySchema);
