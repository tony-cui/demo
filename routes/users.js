var express = require('express');
var router = express.Router();
var moment = require('moment');
var _ = require('underscore');

var mongoose = require('mongoose');
// require('express-mongoose');
var userSchema = require('../model/userSchema');

// model
var user = userSchema.user;

// connect to db
mongoose.connect('mongodb://localhost/demo');
mongoose.set('debug', true);

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error'));
db.once('open', function(callback) {

});

// methods
// 

/**
 * remove time
 * @param  {[type]} time [description]
 * @return {[type]}      [description]
 */
function removeTime(time) {
	time.hour(0).minute(0).second(0).millisecond(0);
}

router.get('/list', function(req, res) {
	user.find(function(err, doc) {
		res.json(doc);
	});
});

router.get('/list/sign/:sign/start/:start/end/:end', function(req, res) {
	var start = moment(req.params.start);
	var end = moment(req.params.end);
	var sign = req.params.sign || 'N';

	console.log(start.format('YYYY-MM-DD') + "/" + end.format('YYYY-MM-DD') + "/" + sign);

	user.aggregate()
		// .match({
		// 	"sign": sign
		// })
		.match({
			"day": {
				"$gt": start.toDate(),
				"$lt": end.toDate()
			}
		})
		.group({
			_id: "$name",
			count: {
				$sum: {
					$cond: {
						if: {
							$eq: ["$sign", 'N']
						},
						then: 1,
						else: 0
					}
				}
			}
		})
		.project({
			_id: 1,
			count: 1
		})
		.exec(function(err, list) {
			res.send(list);
		});
});

router.get('/list/day/:day',
	function(req, res) {
		var day = req.params.day;
		var start = moment(day);
		var end = start.clone().add(1, 'day');
		var today = moment();
		removeTime(today);

		user.find({
			"day": {
				"$gt": start.toDate(),
				"$lt": end.toDate()
			}
		}, function(err, userList) {
			var dummy = moment('9999-12-31');
			user.find({
				"day": dummy
			}, function(err, list) {

				if (userList.length == 0) {

					var userList2 = [];
					// auto init record for future
					if (start >= today) {
						_.each(list, function(item) {
							var newUser = new user;
							newUser.name = item.name;
							newUser.day = moment(day).hour(1).minute(1).second(1);
							newUser.save(function(err, doc, numberAffected) {
								newUser = doc;
							});
							userList2.push(newUser);
						});
					}
					res.send(userList2);
				} else {

					// if day greater than today, it should return a empty array
					// if day is less than today, there should have some record in db
					function getName(item) {
						return item.name
					}
					// exist in list but not in userList
					var diff = _.difference(_.map(list, getName), _.map(userList, getName));
					_.each(diff, function(item) {
						var newUser = new user;
						newUser.name = item;
						newUser.day = moment(day).hour(1).minute(1).second(1);
						if (start >= today) {
							newUser.save(function(err, doc, numberAffected) {
								newUser = doc;
							});
						}
						userList.push(newUser);
					});
					res.send(userList);
				}
			});
		});
	});


router.post('/addUser', function(req, res, next) {
	var input = req.body;

	var newUser = new user;
	newUser.name = input.name;
	newUser.day = moment('9999-12-31');

	newUser.save(function(err, m) {
		if (err) {
			res.send(false);
		} else {
			res.send(true);
		}
	});
});


router.post("/updateUser", function(req, res, next) {
	var input = req.body;
	var end = moment(input.day).hour(0).minute(0).second(0);
	var start = moment(end).subtract(1, 'day');

	var diff = input.diff || 10;

	// find the record pre day
	user.findOne({
		name: input.name,
		"day": {
			"$gte": start.toDate(),
			"$lt": end.toDate()
		}
	}, function(err, item) {

		// get the record going to update
		user.findOne({
			_id: input._id
		}, function(err, doc) {
			if (err) res.send('could not find the user');
			if (item == null) {
				doc.sign =  (input.score > 0) ? 'Y' : 'N';
			} else {
				if (input.score >= item.score + diff) {
					doc.sign = 'Y';
				} else {
					doc.sign = 'N';
				}
			}
			doc.score = input.score;
			doc.lastUpdateDate = new Date();

			doc.save(function(err) {
				if (err) {
					res.send(false);
				} else {
					res.send(true)
				}
			});
		});
	});
});


router.post("/deleteUser", function(req, res, next) {

	var input = req.body;
	user.remove({
		name: input.name
	}, function(err) {
		if (err) {
			res.send(false);
		} else {
			res.send(true);
		}
	});
});


router.get('/init', function(req, res) {

	for (var i = 0; i < 5; i++) {
		var _user = new user({
			name: 'Jack' + i,
			day: moment('9999-12-31')
		});

		//_user.sayHi();
		_user.save(function(err) {
			console.log(err);
		});
	};

	res.send('data inited');
});

module.exports = router;