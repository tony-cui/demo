var mongoose = require('mongoose');

var Schema = mongoose.Schema;

// definiation
var schema = new Schema({
	name: String,
	day: Date,
	sign: {type: String, default: 'N'},
	score: {type: Number, default: 0},
	lastUpdateDate: {type: Date, default: new Date()}
});


// schema.post('find', function(result){

// 	if(result.length == 0) {
		
// 	}

// });

exports.user = mongoose.model('user', schema);