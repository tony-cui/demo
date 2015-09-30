(function() {
	'use strict';

	/**
	 * app Module
	 *
	 * Description
	 */
	angular.module('app')
		.config(routerConfig);

	routerConfig.$injector = ['$stateProvider', '$urlRouterProvider'];

	function routerConfig($stateProvider, $urlRouterProvider) {

		$stateProvider.state('login', {
				url: '/login',
				templateUrl: 'login.html',
				controller: 'LoginController',
				controllerAs: 'loginCtrl'
			})
			.state('home', {
				url: '/home',
				templateUrl: 'home.html',
				controller: 'userController',
				controllerAs: 'ctrl'
			});

		$urlRouterProvider.otherwise('/home');
	}

})();