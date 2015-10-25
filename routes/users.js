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
// mongoose.connect('mongodb://localhost/demo');
// mongoose.set('debug', true);

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

	user.aggregate()
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


router.get("/count/start/:start/end/:end", function(req, res) {
	var _start = req.params.start;
	var _end = req.params.end;

	var start = moment(_start).add(1, 'day');
	var end = moment(_end).add(1, 'day');
	removeTime(start);
	removeTime(end);

	user.aggregate()
		.match({
			"day": {
				"$gt": start.toDate(),
				"$lt": end.toDate()
			}
		})
		.group({
			_id: "$name",
			total: {
				$sum: "$diff"
			}
		})
		.project({
			_id: 1,
			total: 1
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
					// if (start >= today) {
					_.each(list, function(item) {
						var newUser = new user;
						newUser.name = item.name;
						newUser.day = moment(day).hour(1).minute(1).second(1);

						item.createDate = item.createDate || today.format("YYYY-MM-DD");

						if (moment(day).format("YYYY-MM-DD") >= item.createDate) {
							newUser.save(function(err, doc, numberAffected) {
								newUser = doc;
							});
							userList2.push(newUser);
						}

					});
					// }
					res.send(userList2);
				} else {
					// if (start >= today) {
					function getName(item) {
						return item.name
					}
					// exist in list but not in userList
					var diff = _.difference(_.map(list, getName), _.map(userList, getName));
					_.each(diff, function(item) {

						var newUser = new user;
						newUser.name = item;
						newUser.day = moment(day).hour(1).minute(1).second(1);

						var dummyUser = _.find(list, function(input) {
							return input.name == item;
						})

						dummyUser.createDate = dummyUser.createDate || today.format("YYYY-MM-DD");

						if (moment(day).format("YYYY-MM-DD") >= dummyUser.createDate) {
							newUser.save(function(err, doc, numberAffected) {
								newUser = doc;
							});

							userList.push(newUser);
						}

					});
					// }
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
	newUser.createDate = moment().format("YYYY-MM-DD");

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
	console.log(input);
	var end = moment(input.day).hour(0).minute(0).second(0);
	var start = moment(end).clone().subtract(1, 'day');
	var nextStart = moment(end).clone().add(1, 'day');
	var nextEnd = moment(end).clone().add(2, 'day');

	var diff = 10;

	// find the record pre day
	user.findOne({
		name: input.name,
		"day": {
			"$gte": start.toDate(),
			"$lt": end.toDate()
		}
	}, function(err, preItem) {

		console.log(preItem);

		// get the record going to update
		user.findOne({
			_id: input._id
		}, function(err, todayItem) {
			if (err) res.send('could not find the user');
			if (preItem == null || preItem == undefined) {
				todayItem.sign = (input.score > 0) ? 'Y' : 'N';
				todayItem.diff = input.score;
			} else {
				if (input.score >= (preItem.score + diff)) {
					todayItem.sign = 'Y';
				} else {
					todayItem.sign = 'N';
				}
				todayItem.diff = input.score - preItem.score;
			}
			todayItem.score = input.score;
			todayItem.lastUpdateDate = new Date();

			todayItem.save(function(err) {
				if (err) {
					res.send(false);
				} else {
					user.findOne({
						name: input.name,
						"day": {
							"$gt": nextStart.toDate(),
							"$lt": nextEnd.toDate()
						}
					}, function(err, nextItem) {
						console.log(nextItem);
						// if next item exists
						if (nextItem != null && nextItem != undefined) {
							if (nextItem.score > 0) {
								nextItem.diff = nextItem.score - input.score;
								nextItem.sign = (nextItem.diff >= diff) ? "Y" : "N";
							} else {
								nextItem.diff = 0;
								nextItem.sign = 'N';
							}
							nextItem.save(function(err) {});
						}
					});

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


router.get("/updateCreateDay/name/:name/day/:day", function(req, res) {
	var name = req.params.name;
	var day = req.params.day;

	user.findOne({
		name: name,
		day: moment("9999-12-31")
	}, function(err, metaItem) {

		metaItem.createDate = moment(day).format("YYYY-MM-DD");

		metaItem.save(function(err) {
			res.send(err);
		});
	});
});

module.exports = router;