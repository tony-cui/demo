var mongoose = require('mongoose');

var Schema = mongoose.Schema;

// definiation
var schema = new Schema({
	name: String,
	day: Date,
	sign: {type: String, default: 'N'},
	score: {type: Number, default: 0},
	diff: {type:Number,default: 0},
	lastUpdateDate: {type: Date, default: new Date()},
	createDate: {type: String}
});


exports.user = mongoose.model('user', schema);