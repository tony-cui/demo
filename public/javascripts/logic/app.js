(function() {
	'use strict';

	/**
	 * app Modul
	 *
	 * Description
	 */
	angular.module('app', ['app.service', 'app.directive'])
		.controller('userController', ['UserService', '$scope', function(UserService, $scope) {
			var ctrl = this;

			// select
			$scope.day = moment();
			$scope.edit = false;
			$scope.score = 0;

			// $scope.appStart = momnet();

			ctrl.duration = [];
			ctrl.showDays = 5;

			ctrl.userListInPeriod = [];

			ctrl.unSignUsersTotal = {};
			ctrl.addUser = addUser;
			ctrl.removeUser = removeUser;

			ctrl.listUserInPeriod = listUserInPeriod;

			ctrl.sign = sign;
			ctrl.unsign = unsign;

			ctrl.addUserInit = addUserInit;

			ctrl.showEdit = showEdit;
			ctrl.saveScore = saveScore;

			ctrl.getCss = getCss;

			init();

			function init() {

				// init duration
				updateDuration($scope.day);

				listUserInPeriod();

				$scope.$watch("day", function(newValue, oldValue) {
					if (newValue != oldValue) {
						// refresh page
						updateDuration(newValue);

						listUserInPeriod();
					}
				});
			}

			function showEdit(item) {
				if(item._id) {
					item.edit = true;
				}
			}

			function getCss(item) {
				if(item.sign == 'Y') {
					return 'success';
				} else {
					return item._id ? 'danger' : '';
				}
			}

			function saveScore(user) {
				// console.log("update score to " + user.score);
				UserService.updateUser(user).then(function(data) {
					user.edit = false;
					// update page
					listUserInPeriod();
				});
			}

			function updateDuration(day) {
				// first of all, clear it
				ctrl.duration = [];
				for (var i = 0; i < ctrl.showDays; i++) {
					// add one week
					ctrl.duration.push(day.clone().add(i, 'day').subtract(ctrl.showDays - 1, 'day'));
				}
			}


			function listUserInPeriod() {
				var len = ctrl.duration.length;
				UserService.listUserInPeriod(ctrl.duration[0], ctrl.duration[len - 1]).then(function(list) {
					ctrl.userListInPeriod = list;

					// get undone days for each user
					getUserUnsignDays();
				});
			}


			function addUser(user) {
				var user = {
					name: $scope.name,
					day: new Date(),
					sign: 'N',
					score: 0
				};

				UserService.addUser(user).then(function(data) {
					// notification to add successfully
					if (data) {

						listUserInPeriod();
					}
				});

			}

			function removeUser(name, idx) {
				var user = {
					"name": name
				};
				UserService.deleteUser(user).then(function(data) {
					if (data) {

						ctrl.userListInPeriod = _.omit(ctrl.userListInPeriod, function(value, key, object) {
							return key == name;
						});
					}
				});
			}

			// function _listUser() {
			// 	UserService.listUser($scope.day).then(function(data) {
			// 		ctrl.users = data;
			// 	});
			// }

			function getUnSignMorethan2Days() {
				UserService.listUnsign().then(function(data) {
					ctrl.unSignUsers = data;
				});
			}

			function getUserUnsignDays() {
				// 10 years
				UserService.listUnsign(moment(), 365).then(function(data) {
					// var unSignUsersTotal = data;
					console.log(data);
					_.map(data, function(item) {
						ctrl.unSignUsersTotal[item._id] = item.count;
					});
				});
			}

			function sign(user) {
				user.sign = "Y";
				UserService.updateUser(user).then(function(data) {
					if (data) {
						// sign successfully
						// user.sign = 'Y';
					}
				}).catch(function(err) {
					// update failure
					user.sign = 'N';
				});
			}

			function unsign(user) {
				user.sign = 'N';
				UserService.updateUser(user).then(function(data) {
					if (data) {
						// sign successfully
						// user.sign = 'Y';
					}
				}).catch(function(err) {
					user.sign = 'Y';
				});
			}

			function addUserInit() {

			}


		}]);

})();