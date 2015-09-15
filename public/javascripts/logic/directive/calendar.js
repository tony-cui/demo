(function() {

		'use strict';

		var app = angular.module("app.directive", []);

		app.directive("calendar", function() {
				return {
					restrict: "E",
					templateUrl: "../javascripts/logic/directive/calendar.html",
					scope: {
						selected: "=?"
					},
					link: function(scope) {
						scope.selected =scope.selected || moment();
						
						// scope.today = moment();
						scope.month = scope.selected.clone();

						var start = scope.selected.clone();
						// start of month
						start.date(1);
						// first day of week and remove time
						_removeTime(start.day(1));

						_buildMonth(scope, start, scope.month);

						scope.select = function(day) {
							scope.selected = day.date;
						};

						scope.next = function() {
							var next = scope.month.clone();
							_removeTime(next.month(next.month() + 1).date(1).day(1));
							scope.month.month(scope.month.month() + 1);
							_buildMonth(scope, next, scope.month);

						};

					scope.previous = function() {
						var previous = scope.month.clone();
						_removeTime(previous.month(previous.month() - 1).date(1).day(1));
						scope.month.month(scope.month.month() - 1);
						_buildMonth(scope, previous, scope.month);
					};
				}
			};

			function _removeTime(date) {
				return date.hour(0).minute(0).second(0).millisecond(0);
			}

			// start -- first day of month
			// month -- moment()
			function _buildMonth(scope, start, month) {
				scope.weeks = [];
				var done = false,
					date = start.clone(),
					monthIndex = date.month(),
					count = 0;
				while (!done) {
					scope.weeks.push({
						days: _buildWeek(date.clone(), month)
					});
					date.add(1, "w");
					done = count++ > 2 && monthIndex !== date.month();
					monthIndex = date.month();
				}
			}

			function _buildWeek(date, month) {
				var days = [];
				for (var i = 0; i < 7; i++) {
					days.push({
						name: date.format("dd").substring(0, 1),
						number: date.date(),
						isCurrentMonth: date.month() === month.month(),
						isToday: date.isSame(new Date(), "day"),
						date: date
					});
					date = date.clone();
					date.add(1, "d");
				}
				return days;
			}
		});
})();