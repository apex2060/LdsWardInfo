var MainCtrl = app.controller('MainCtrl', function($rootScope, $scope, $routeParams, $location, $http, config, userService){
	$rootScope.view = $routeParams.view;
	$rootScope.id = $routeParams.id;
	$rootScope.config = config;

	var tools = {
		url:function(){
			if($rootScope.user || $routeParams.view == 'about' || $routeParams.view == 'home')
				return 'views/'+$routeParams.view+'.html';
			else
				return 'views/login.html';
		},
		init:function(){
			if(!$rootScope.data){
				userService.init();
				$rootScope.data = {};
				$scope.$on('$viewContentLoaded', function(event) {
					// ga('send', 'pageview', $location.path());
				});
			}
		}
	}
	$scope.tools = tools;
	tools.init();
	it.MainCtrl=$scope;
});



var DirectoryCtrl = app.controller('DirectoryCtrl', function($rootScope, $scope, $routeParams, $location, $http, config, userService){

	var tools = {
		init:function(){
			if(!$scope.directory){
				userService.user().then(function(){
					$http.get(config.parseRoot+'classes/Family?limit=900')
					.success(function(data){
						$scope.directory = data;
					})
				})
			}
		}
	}
	$scope.tools = tools;
	tools.init();
	it.DirectoryCtrl=$scope;
});