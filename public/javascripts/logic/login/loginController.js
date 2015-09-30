(function() {

	'use strict';


	/**
	 * app Module
	 *
	 * Description
	 */
	angular.module('app')
	.controller('LoginController', LoginController);

	LoginController.$injector = ['$scope', '$state'];

	function LoginController($scope, $state) {

		var loginCtrl = this;

		loginCtrl.login = login;
		loginCtrl.logOff = logOff;

		function login() {
			$state.go('home');
		}


		function logOff() {
			$state.go('login');
		}

	}

})();