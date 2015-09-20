(function() {
	'use strict';

	/**
	 * app Modul
	 *
	 * Description
	 */
	angular.module('app', ['app.service', 'app.directive', 'ui.bootstrap', 'dialogs.main', 'ngTouch', 'angularNumberPicker', 'smart-table'])
		.controller('userController', userController)
		.controller('modalController', modalController)
		.directive('ratio', function() {
			return {
				link: function(scope, element, attr) {
					var ratio = +(attr.ratio);
					element.css('width', ratio + '%');
				}
			}
		})
		.filter('myFilter', ['$filter', function($filter) {
			return function(rowList, predicate) {

				if (predicate == null || predicate == undefined || predicate == '') {
					return rowList;
				} else {
					return $filter('filter')(rowList, function(row, index) {
						return row.list[row.list.length - 1].sign == predicate;
					});
				}
			}
		}])
		.filter('formatNumber', function(){
			return function(input) {
				if(input == null || input == undefined || input == '') {
					return 0;
				} 
				return input;
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

	userController.$injector = ['UserService', '$scope', '$modal', 'dialogs', '$filter'];

	function userController(UserService, $scope, $modal, dialogs, $filter) {
		var ctrl = this;

		// moment.locale('zh_cn');
		$scope.day = moment();
		$scope.edit = false;
		$scope.score = 0;

		// $scope.appStart = momnet();

		ctrl.duration = [];
		ctrl.showDays = 3;

		ctrl.userListInPeriod = [];
		ctrl.userListInPeriodSafe = [];

		ctrl.unSignUsersTotal = {};
		ctrl.removeUser = removeUser;

		ctrl.listUserInPeriod = listUserInPeriod;

		ctrl.sign = sign;
		ctrl.unsign = unsign;

		ctrl.showEdit = showEdit;
		ctrl.saveScore = saveScore;

		ctrl.getCss = getCss;

		ctrl.open = open;

		ctrl.addUser = addUser;

		ctrl.sort = {
			"undoDays": function(row) {
				return ctrl.unSignUsersTotal[row.name];
			},
			"activity": {}
		};

		init();

		$scope.$on('refreshPage', listUserInPeriod);

		function init() {

			// init duration
			updateDuration($scope.day);

			updateSortFunction();

			listUserInPeriod();

			$scope.$watch("day", function(newValue, oldValue) {
				if (newValue != oldValue) {
					// refresh page
					updateDuration(newValue);

					updateSortFunction();

					// listUserInPeriod();
					$scope.$broadcast('refreshPage');
				}
			});
		}

		function showEdit(item) {
			if (item._id) {
				item.edit = true;
			}
		}

		function getCss(item) {
			// console.log(item);
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
					// listUserInPeriod();
					$scope.$broadcast('refreshPage');
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

		function updateSortFunction() {
			_.each(ctrl.duration, function(day, index) {
				ctrl.sort.activity[day] = function(row) {
					return row.list[index].score;
				}
			})
		}


		function listUserInPeriod() {
			var len = ctrl.duration.length;
			UserService.listUserInPeriod(ctrl.duration[0], ctrl.duration[len - 1]).then(function(list) {

				var names = _.keys(list);

				var items = [];

				_.each(names, function(name) {
					var item = {
						"name": name,
						"list": $filter('orderBy')(list[name], 'day')
					};

					items.push(item);

				});

				// console.log(items);

				ctrl.userListInPeriod = items;
				ctrl.userListInPeriodSafe = items;

				// get undone days for each user
				getUserUnsignDays();
			});
		}



		function removeUser(name, idx) {
			var dlg = dialogs.confirm(undefined, "It will delete all data associated with this memeber, Are you confirm to delete ?");

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
			UserService.listUnsign(moment().subtract(1, 'day'), 365).then(function(data) {
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

		function addUser(user) {
			if (angular.isDefined($scope.name) && $scope.name != null && $scope.name.length > 0) {
				var user = {
					name: $scope.name,
					day: new Date(),
					sign: 'N',
					score: 0,
					diff: 0
				};

				UserService.addUser(user).then(function(data) {
					ctrl.addNew = false;
					$scope.name = '';
					if (data) {
						dialogs.notify(undefined, "user add successfully");
						$scope.$broadcast('refreshPage');
					} else {
						dialogs.error(undefined, "add user failed");
					}
				});
			} else {
				dialogs.error(undefined, "please input the name");
			}

		}
	}
})();