(function() {
	'use strict';

	/**
	 * app Modul
	 *
	 * Description
	 */
	angular.module('app', ['app.service', 'app.directive', 'ui.bootstrap', 'dialogs.main', 'ngTouch', 'angularNumberPicker', 'smart-table', 'ui.router'])
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
		.directive('input', function() {
			return {
				restrict: 'E',
				require: 'ngModel',
				link: function(scope, element, attrs, ngModelCtrl) {
					if (attrs.type === 'checkbox')
						$(element).bootstrapSwitch({
							onText: attrs.on || 'YES',
							offText: attrs.off || 'NO',
							onSwitchChange: function(event, state) {
								scope.$apply(function() {
									ngModelCtrl.$setViewValue(state);
								});
							}
						});

					var dereg = scope.$watch(function() {
						return ngModelCtrl.$modelValue;
					}, function(newVal) {
						$(element).bootstrapSwitch('state', !!newVal, true);
						dereg();
					});
				}
			}
		})
		.filter('weekFilter', function() {
			return function(input) {
				switch (input) {
					case 1:
						return "一";
						break;
					case 2:
						return "两";
						break;
					case 3:
						return "三";
						break;
					case 4:
						return "四";
						break;
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
		.filter('formatNumber', function() {
			return function(input) {
				if (input == null || input == undefined || input == '') {
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
		}])
		.run(appStart);

	appStart.$injector = ['$rootScope'];

	function appStart($rootScope) {
		$rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
			console.log("toState: " + toState.name + " fromState: " + fromState.name);
		});

		$rootScope.$on('$stateNotFound',
			function(event, unfoundState, fromState, fromParams) {
				console.log(unfoundState.to); // "lazy.state"
				console.log(unfoundState.toParams); // {a:1, b:2}
				console.log(unfoundState.options); // {inherit:false} + default options
			})
	}

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

		$scope.week = 1;

		$scope.currentWeek = true;

		ctrl.currentEdit = {};

		// $scope.appStart = momnet();

		ctrl.duration = [];
		ctrl.showDays = 3;

		ctrl.userListInPeriod = [];
		ctrl.userListInPeriodSafe = [];

		ctrl.unSignUsersTotal = {};
		ctrl.totalActivity = {};
		ctrl.removeUser = removeUser;

		ctrl.listUserInPeriod = listUserInPeriod;

		ctrl.sign = sign;
		ctrl.unsign = unsign;

		ctrl.showEdit = showEdit;
		ctrl.hideEdit = hideEdit;
		ctrl.saveScore = saveScore;

		ctrl.getCss = getCss;

		ctrl.open = open;

		ctrl.addUser = addUser;

		ctrl.sort = {
			"undoDays": function(row) {
				return ctrl.unSignUsersTotal[row.name];
			},
			"activity": {},
			"totalActivity": function(row) {
				return ctrl.totalActivity[row.name];
			}
		};

		init();

		$scope.$on('refreshPage', refreshPage);

		function init() {
			// init duration
			updateDuration($scope.day);

			updateSortFunction();

			refreshPage();


			$scope.$watch("day", function(newValue, oldValue) {
				if (newValue != oldValue) {
					// refresh page
					updateDuration(newValue);

					updateSortFunction();

					$scope.$broadcast('refreshPage');
				}
			});

			$scope.$watch("week", function(newValue) {
				getUserTotalActivity(newValue, $scope.currentWeek);
			});
			$scope.$watch('currentWeek', function(newValue) {
				getUserTotalActivity($scope.week, newValue);
			})
		}

		function refreshPage() {
			listUserInPeriod();
			getUserTotalActivity(1, $scope.currentWeek);
		}

		function showEdit(item, row, idx, $event) {
			if (item._id) {
				if (idx > 0) {
					// not the first one
					var list = $filter('orderBy')(row, "day").list;
					var preItem = list[idx - 1];
					if (item.score < preItem.score) {
						item.score = preItem.score + 11;
					}
				}
				ctrl.currentEdit.edit = false;
				item.edit = true;
				ctrl.currentEdit = item;

			}
		}

		function hideEdit($event) {
			var clickAttr = $event.target.attributes['ng-click'];
			if(!clickAttr) {
				ctrl.currentEdit.edit = false;
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
				// listUserInPeriod();
				$scope.$broadcast('refreshPage');
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
			var dlg = dialogs.confirm(undefined, "确认删除" + name + "?");

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
			var endDay = $scope.day.clone().subtract(1, 'day');
			UserService.listUnsign(endDay, 365).then(function(data) {
				// var unSignUsersTotal = data;
				// console.log(data);
				_.map(data, function(item) {
					ctrl.unSignUsersTotal[item._id] = item.count;
				});
			});
		}

		function getUserTotalActivity(week, currentWeek) {
			var week = week || 1;
			UserService.countUserActivity(week, currentWeek).then(function(data) {
				_.map(data, function(item) {
					ctrl.totalActivity[item._id] = item.total;
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