(function() {
	'use strict';

	/**
	 * app Modul
	 *
	 * Description
	 */
	angular.module('app', ['app.service', 'app.directive', 'ui.bootstrap', 'dialogs.main', 'ngTouch', 'angularNumberPicker'])
		.controller('userController', userController)
		.controller('modalController', modalController)
		.directive('colRatio', function() {
			return {
				link: function(scope, element, attr) {
					var ratio = +(attr.ratio);

					element.css('width', ratio + '%');

				}
			}
		})
		.config(['dialogsProvider', function(dialogsProvider) {
			dialogsProvider.useBackdrop('static');
			dialogsProvider.useEscClose(false);
			dialogsProvider.useCopy(false);
			dialogsProvider.setSize('sm');
		}]);

	modalController.$injector = ['$scope', '$modalInstance', 'UserService', 'dialogs'];

	function modalController($scope, $modalInstance, UserService, dialogs) {
		$scope.cancel = cancel;
		$scope.addUser = addUser;
		$scope.name = "";

		function cancel() {
			$modalInstance.dismiss('cancel');
		}

		function addUser(user) {
			if (angular.isDefined($scope.name) && $scope.name != null && $scope.name.length > 0) {
				var user = {
					name: $scope.name,
					day: new Date(),
					sign: 'N',
					score: 0
				};

				UserService.addUser(user).then(function(data) {
					if (data) {
						$modalInstance.close(true);
					} else {
						$modalInstance.dismiss(false);
					}
				});
			} else {
				dialogs.error(undefined, "please input the name");
			}

		}
	}

	userController.$injector = ['UserService', '$scope', '$modal', 'dialogs'];

	function userController(UserService, $scope, $modal, dialogs) {
		var ctrl = this;

		// moment.locale('zh_cn');
		$scope.day = moment();
		$scope.edit = false;
		$scope.score = 0;

		// $scope.appStart = momnet();

		ctrl.duration = [];
		ctrl.showDays = 3;

		ctrl.userListInPeriod = [];

		ctrl.unSignUsersTotal = {};
		ctrl.removeUser = removeUser;

		ctrl.listUserInPeriod = listUserInPeriod;

		ctrl.sign = sign;
		ctrl.unsign = unsign;

		ctrl.showEdit = showEdit;
		ctrl.saveScore = saveScore;

		ctrl.getCss = getCss;

		ctrl.open = open;

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
			if (item._id) {
				item.edit = true;
			}
		}

		function getCss(item) {
			if (item.sign == 'Y') {
				return 'success';
			} else {
				return item._id ? 'danger' : '';
			}
		}

		function open(size) {
			var modalInstance = $modal.open({
				templateUrl: 'newUser.html',
				controller: 'modalController',
				size: size
			});

			modalInstance.result.then(function(addResult) {
				if (addResult) {
					// show message
					dialogs.notify(undefined, 'add user successfully');
					listUserInPeriod();
				} else {
					dialogs.error(undefined, 'add user failed');
				}
			});
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



		function removeUser(name, idx) {
			var dlg = dialogs.confirm(undefined, "are you confirm to delete?");

			dlg.result.then(function(btn) {
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
			}, function(btn) {
				// cancel, do nothing
			});
		}

		function getUnSignMorethan2Days() {
			UserService.listUnsign().then(function(data) {
				ctrl.unSignUsers = data;
			});
		}

		function getUserUnsignDays() {
			// 10 years
			UserService.listUnsign(moment(), 365).then(function(data) {
				// var unSignUsersTotal = data;
				// console.log(data);
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
	}
})();