var it = {};

var app = angular.module('LdsWardInfo', ['ngAnimate','ngResource','ngRoute','ngTouch'])
.config(function($routeProvider) {
	$routeProvider

	.when('/:view', {
		templateUrl: 'views/main.html',
		controller: 'MainCtrl'
	})
	.when('/:view/:id', {
		templateUrl: 'views/main.html',
		controller: 'MainCtrl'
	})
	.when('/:module/:view/:id', {
		templateUrl: 'views/main.html',
		controller: 'MainCtrl'
	})
	.otherwise({
		redirectTo: '/home'
	});
});


angular.element(document).ready(function() {
	angular.bootstrap(document, ['LdsWardInfo']);
});