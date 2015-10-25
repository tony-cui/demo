(function() {
	'use strict';

	/**
	 * app.service Module
	 *
	 * Description
	 */
	angular.module('app.service', [])
		.factory('UserService', ['$http', '$q', '$filter', function($http, $q, $filter) {
			var baseUrl = "/users";

			var appInitDay = moment("2015-09-19");

			var _service = {};

			_service.addUser = addUser;
			_service.listUser = listUser;
			_service.updateUser = updateUser;
			_service.deleteUser = deleteUser;
			_service.listUnsign = listUnsign;
			_service.listUserInPeriod = listUserInPeriod;
			_service.countUserActivity = countUserActivity;

			return _service;

			function addUser(user) {

				return $http.post(baseUrl + "/addUser", user).then(function(response) {
					return response.data;
				}).catch(function(err) {
					return $q.reject(err);
				});
			}

			function listUser(day) {
				var date = day.format('YYYY-MM-DD');
				return $http.get(baseUrl + "/list/day/" + date).then(function(data) {
					return data.data;
				}).catch(function(err) {
					return $q.reject(err);
				});
			}

			function listUnsign(day, UnsignDays) {
				day = day || moment();
				UnsignDays = UnsignDays || 2;

				var end = day.add(1, 'day').format('YYYY-MM-DD');
				var start = day.clone().subtract(UnsignDays, 'day').format('YYYY-MM-DD');

				return $http.get(baseUrl + "/list/sign/N/start/" + start + "/end/" + end).then(function(data) {
					return data.data;
				}).catch(function(err) {
					return $q.reject(err);
				});

			}

			function listUserInPeriod(start, end, callback) {

				var _start = start.clone().hour(0).minute(0).second(0);
				var _end = end.clone().hour(0).minute(0).second(0);;


				var defered = $q.defer();
				var tmp = [];
				var promiseList = [];

				var dayList = [];


				// init data, make sure there have data in those days
				for (; _start <= end;) {
					dayList.push(_start.format("YYYY-MM-DD"));
					var promise = listUser(_start).then(function(_list) {
						_.each(_list, function(item) {
							tmp.push(item);
						});

					});
					promiseList.push(promise);
					_start.add(1, 'day');
				}

				$q.all(promiseList).then(function() {
					var tmp2 = _.groupBy(tmp, 'name');

					// fulfill
					tmp2 = _.mapObject(tmp2, function(records, key, context) {

						var _records = [];

						if (records.length < dayList.length) {
							_.each(dayList, function(day) {
								var record = $filter('filter')(records, function(value, index) {
									return day == moment(value.day).format("YYYY-MM-DD")
								});

								// record is a array
								if (record == null || record.length == 0) {
									var user = {
										"name": key,
										"day": moment(day).format("YYYY-MM-DD"),
										"score": "-",
										"sign": 'N',
										"exist": false
									};
									_records.push(user);
								} else {
									_records.push(record[0]);
								}
							});
							return _records;
						} else {
							return records;
						}
					});
					defered.resolve(tmp2);
				});
				return defered.promise;
			}

			function updateUser(user) {
				return $http.post(baseUrl + "/updateUser", user).then(function(data) {
					return data.data;
				}).catch(function(err) {
					return $q.reject(err);
				});
			}

			function deleteUser(user) {
				return $http.post(baseUrl + "/deleteUser", user).then(function(data) {
					return data.data;
				}).catch(function(err) {
					return $q.reject(err);
				});
			}

			function countUserActivity(weekOffset, currentWeek) {
				// default value of currentWeek is true
				var end = moment().isoWeekday(7); // sunday
				if(!currentWeek) {
					end = moment();
				}
				var start = end.clone().subtract(weekOffset, 'week');
				if(start < appInitDay) {
					start = appInitDay;
				}

				var _end = end.format("YYYY-MM-DD");
				var _start = start.format("YYYY-MM-DD");
				return $http.get(baseUrl + "/count/start/" + _start + "/end/" + _end).then(function(data) {
					return data.data;
				}).catch(function(err) {
					return $q.reject(err);
				});
			}
		}]);

})();