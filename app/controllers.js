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



var DirectoryCtrl = app.controller('DirectoryCtrl', function($rootScope, $scope, $routeParams, $location, $http, config, userService, directoryService, tagService){
	var tools = {
		tag: tagService,
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
	var map = {
		canvas: null,
		markers: [],
		latLngs: []
	}
	$scope.map = map;


	var tools = {
		setMarker:function(marker){
			if($scope.marker)
				tools.toggleAnimation($scope.marker)
			$scope.marker = marker;
			$scope.family = marker.family;
			tools.toggleAnimation(marker)
		},
		toggleAnimation:function(marker){
			marker.animated = !!!marker.animated;
			if(marker.animated)
				marker.setAnimation(google.maps.Animation.BOUNCE);
			else
				marker.setAnimation(null);
			it.MapCtrl.$apply()
		},
		setFamily:function(){
			tools.setMarker(this)
		},
		addMarker:function(family){
			if(map.canvas){
				var address = family.householdInfo.address;
				if(address){
					var latlng = new google.maps.LatLng(address.latitude, address.longitude);
					var marker = new google.maps.Marker({
						position: latlng,
						title: family.coupleName,
						family: family,
						map: map.canvas
					});

					map.latLngs.push(latlng)
					map.markers.push(marker)
					google.maps.event.addListener(marker, 'click', tools.setFamily);

					var latlngbounds = new google.maps.LatLngBounds();
					for(var i=0; i<map.latLngs.length; i++)
						latlngbounds.extend(map.latLngs[i]);
					map.canvas.setCenter(latlngbounds.getCenter());
					map.canvas.fitBounds(latlngbounds);
				}
			}else{
				console.error('The map must be initialized first.')
			}
		},
		init:function(){
			directoryService.list().then(function(directory){
				$scope.directory = directory;

				var mapOptions = {
					center: { lat: 40.7500, lng: -111.8833 },
					zoom: 10
				};
				map.canvas = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

				for(var i=0; i<directory.length; i++){
					tools.addMarker(directory[i])
				}
			})
		}
	}
	$scope.tools = tools;
	tools.init();
	it.MapCtrl=$scope;
});






var TagCtrl = app.controller('TagCtrl', function($rootScope, $scope, $routeParams, $location, $http, config, userService, tagService){
	var tools = {
		init:function(){
			tagService.list().then(function(tags){
				$scope.tags = tags;
			})
		},
		add: function(){
			tagService.add(prompt('Name this new tag: ')).then(function(saved){
				tools.init();
			})
		}
	}
	$scope.tools = tools;
	$scope.tagTool = tagService;
	tools.init();
	it.TagCtrl=$scope;
});
