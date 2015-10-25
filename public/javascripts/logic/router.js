(function() {
	'use strict';

	/**
	 * app Module
	 *
	 * Description
	 */
	angular.module('app')
		.config(routerConfig);

	routerConfig.$injector = ['$stateProvider', '$urlRouterProvider', '$locationProvider'];

	function routerConfig($stateProvider, $urlRouterProvider, $locationProvider) {

		// $locationProvider.html5Mode(true);
		$locationProvider.hashPrefix('!');

		$stateProvider.state('login', {
				url: '/login',
				templateUrl: 'html/login.html',
				controller: 'LoginController',
				controllerAs: 'loginCtrl'
			})
			.state('home', {
				url: '/home',
				templateUrl: 'html/home.html',
				controller: 'userController',
				controllerAs: 'ctrl'
			});

		$urlRouterProvider.otherwise('/home');
	}

})();