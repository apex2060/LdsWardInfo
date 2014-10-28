var MainCtrl = app.controller('MainCtrl', function($rootScope, $scope, $routeParams, $location, $http, config, userService){
	$rootScope.view = $routeParams.view;
	$rootScope.id = $routeParams.id;
	$rootScope.config = config;

	var tools = {
		user: userService,
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



var DirectoryCtrl = app.controller('DirectoryCtrl', function($rootScope, $scope, $routeParams, $location, $http, config, userService, directoryService){
	var tools = {
		init:function(){
			directoryService.list().then(function(directory){
				$scope.directory = directory;
			})
		},
		family:{
			show:function(family){
				$scope.family = family;
				$('#familyModal').modal('show');
			},
			map:function(family){
				if(family){
					var latLng = family.householdInfo.address.latitude+','+family.householdInfo.address.longitude;
					var markers = latLng
					var size = '600x300'
					var zoom = 14
					var url = 'https://maps.googleapis.com/maps/api/staticmap?'
						+'center='+latLng
						+'&zoom='+zoom
						+'&size='+size
						+'&markers='+markers;
					return(url)
				}else{
					return false;
				}
			}
		}
	}
	$scope.tools = tools;
	tools.init();
	it.DirectoryCtrl=$scope;
});


var MapCtrl = app.controller('MapCtrl', function($rootScope, $scope, $routeParams, $location, $http, config, userService, directoryService){
	var tools = {
		init:function(){
			directoryService.list().then(function(directory){
				console.log(directory)
				$scope.directory = directory;
				function initialize() {
					var mapOptions = {
						center: { lat: -34.397, lng: 150.644},
						zoom: 8
					};
					var map = new google.maps.Map(document.getElementById('map-canvas'),
						mapOptions);
				}
				google.maps.event.addDomListener(window, 'load', initialize);
			})
		}
	}
	$scope.tools = tools;
	tools.init();
	it.MapCtrl=$scope;
});