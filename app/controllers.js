// Prerequisits?
// - (Do a member data-sync)
// Flow:
// - Login > Load member info
// - Allow filters, tools, 


var MainCtrl = app.controller('MainCtrl', function($rootScope, $scope, $routeParams, $location, $http, config, userService, geoService){
	$rootScope.action = $routeParams.action;
	$rootScope.view = $routeParams.view;
	$rootScope.id = $routeParams.id;
	$rootScope.config = config;

	function setup(){
		$scope.$on('$viewContentLoaded', function(event) {
			// ga('send', 'pageview', $location.path());
			});
	}

	var tools = {
		user: userService,
		url:function(){
			if($rootScope.user || $routeParams.view == 'about' || $routeParams.view == 'signup')
				return 'views/'+$routeParams.view+'.html';
			else
				return 'views/restricted.html';
		},

		side:{
			set:function(side,url){
				$rootScope.side[side]=url;
				if(!$('#aside_'+side).hasClass('show'))
					$('#aside_'+side).removeClass('hide').addClass('show');
			},
			get:function(side){
				return $rootScope.side[side]
			},
			hide:function(side){
				$('#aside_'+side).removeClass('show').addClass('hide');
			},
			show:function(side){
				$('#aside_'+side).removeClass('hide').addClass('show');
			}
		},
		setup:function(){
			userService.init();
			setup();
			$rootScope.data=	{};
			$rootScope.resource={};
			$rootScope.temp=	{ride: {}};
			$rootScope.side=	{};
			$rootScope.mode=	'normal';
			// tools.side.set('left','partials/shoeboxlist/sidebar.html')
			// tools.side.set('right','partials/sidebar.html')
		},
		signup:function(user){
			tools.user.signup(user)
		},
		// settings:function(user){
		// 	var us = {}
		// 		us.emailNotifications = user.emailNotifications
		// 		us.phoneNotifications = user.phoneNotifications
		// 	if(user.phone)
		// 		us.phone = user.phone
		// 	if(user.address)
		// 		us.address = user.address
		// 	if(user.email)
		// 		us.email = user.email
		// 	if(user.temple)
		// 		us.temple = user.temple
		// 	$http.put(config.parseRoot+'users/'+$rootScope.user.objectId, us).success(function(data){
		// 		$rootScope.error = null;
		// 		$rootScope.success = data;
		// 	}).error(function(error){
		// 		$rootScope.error = error;
		// 	})
		// },
	}
	$scope.tools = tools;
	$rootScope.mainTools = tools;

	if(!$rootScope.data){
		tools.setup();
	}
	it.MainCtrl=$scope;
});










var RideCtrl = app.controller('RideCtrl', function($rootScope, $scope, $q, $sce, $http, config, settings, dataService, userService){
	$scope.moment = moment;
	$scope.warnings = {};

	var allRides = $q.defer();
	userService.user().then(function(user){
		var liveId = $rootScope.user.geo.latitude.toString().split('.')[0]+$rootScope.user.geo.longitude.toString().split('.')[0];
		var timestamp = new Date().getTime();
		var rideResource = new dataService.resource(
			'rides', 
			'rideList/'+liveId, 
			true, 
			true, 
			config.parseRoot+'functions/rideList', 
			{timestamp: timestamp}
		);
			// ar.setQuery('');
		allRides.resolve(rideResource);
		rideResource.item.list().then(function(data){
			$scope.rides = data;
			$scope.formated.driver.events 		= tools.formatRides(data.results.driver, 'driver');
			$scope.formated.passenger.events 	= tools.formatRides(data.results.passenger, 'passenger');
			$scope.formated.other.events 		= tools.formatRides(data.results.other, 'other');
		})
		$rootScope.$on(rideResource.listenId, function(event, data){
			$scope.rides = data;
			if(data){
				$scope.formated.driver.events 		= tools.formatRides(data.results.driver, 'driver');
				$scope.formated.passenger.events 	= tools.formatRides(data.results.passenger, 'passenger');
				$scope.formated.other.events 		= tools.formatRides(data.results.other, 'other');
			}
		})
		if(!$scope.temp.ride.temple)
			for(var i=0; i<$rootScope.templeList.length; i++)
				if($rootScope.templeList[i].link == $rootScope.user.temple.link){
					$scope.temp.ride.temple = $rootScope.templeList[i]
					tools.temple.set();
				}
	});
	var allRidesPromise = allRides.promise;

	var tools = {
		say:function(message){
			alert(message)
		}
	}
	
	$scope.tools = tools;
	it.RideCtrl=$scope;
});











var ListCtrl = app.controller('ListCtrl', function($rootScope, $scope, $q, $http, config, dataService, userService){
	var tools = {
		authAndSync: function(request){
			$rootScope.mainTools.side.hide('right')
			if(!request){
				if(config.dataLink.sessionToken){
					tools.http.get(config.parseRoot+'classes/Family?limit=1000').then(function(data){
						$scope.familyList = data.results;
					})
				}
			}else{
				tools.http.auth(request.username, request.password).then(function(credentials){
					tools.http.get(config.parseRoot+'classes/Family?limit=1000').then(function(data){
						$scope.familyList = data.results;
					})
				})
			}
		},
		family:{
			details: function(family){
				var lastName = family.coupleName.split(",")[0]
				var firstName = family.coupleName.split(",")[1].replace("&", "or")
				$rootScope.temp.oFamily = family;
				if(family.hasInternet==undefined)
					family.hasInternet = true;
				$rootScope.temp.family = {
					lastName: 	lastName,
					firstName: 	firstName,
					name: 		family.coupleName,
					email: 		family.householdInfo.email,
					phone: 		family.householdInfo.phone,
					ward: 		family.ward,
					share: 		family.shareRides,
					internet: 	family.hasInternet
				}
				if(!family.householdInfo.email)
					if(family.headOfHousehold && family.headOfHousehold.email)
						$rootScope.temp.family.email = family.headOfHousehold.email;
					else if(family.spouse && family.spouse.email)
						$rootScope.temp.family.email = family.spouse.email;

				if(!family.householdInfo.phone)
					if(family.headOfHousehold && family.headOfHousehold.phone)
						$rootScope.temp.family.phone = family.headOfHousehold.phone;
					else if(family.spouse && family.spouse.phone)
						$rootScope.temp.family.phone = family.spouse.phone;

				if(family.householdInfo.address){
					$rootScope.temp.family.address = family.householdInfo.address.addr1+' '+family.householdInfo.address.addr2;
					$rootScope.temp.family.geo = {
						latitude: 	family.householdInfo.address.latitude,
						longitude: 	family.householdInfo.address.longitude
					}
				}
				$('#familyModal').modal('show');
			},
			save: function(family){
				if(!family.email && family.internet)
					alert('Please provide an email if you have internet at home.')
				else if(!family.email && !family.phone && family.share)
					alert('You need to provide a phone number or email address so you can share rides to the temple.')
				else{
					var oFamily = $rootScope.temp.oFamily;
					$('#familyModal').modal('hide');
					if(family.share && !oFamily.shareRides){
						family.fromList = true;
						tools.family.invite(family)
					}

					var familyId = oFamily.objectId;
					oFamily.householdInfo.phone = family.phone;
					oFamily.householdInfo.email = family.email;
					oFamily.shareRides 			= family.share;
					oFamily.hasInternet 		= family.internet;

					var nFamily = {}
					angular.copy(oFamily, nFamily)
					delete nFamily.ACL
					delete nFamily.objectId
					delete nFamily.createdBy
					delete nFamily.createdAt
					delete nFamily.updatedAt
					tools.http.put(config.parseRoot+'classes/Family/'+familyId, nFamily)
				}
			},
			invite: function(invitation){
				// Add another modal that says an invitation email has been sent.
				$('#welcomeModal').modal('show');
				invitation.status = 'sending';
				if(invitation.geo)
					invitation.geo.__type =	"GeoPoint";

				$http.post(config.parseRoot+'classes/invitations', invitation)
				.success(function(response){
					console.log('invitation success: ', response);
					invitation.status='active';
				})
				.error(function(response){
					console.log('invitation error: ', response);
				})
			}
		},
		http: {
			auth: function(username, password){
				var deferred = $q.defer();
				if(!$rootScope.dataLink){
					tools.http.get(config.parseRoot+'login?username='+username+'&password='+password).then(function(response){
						$rootScope.dataLink = response;
						deferred.resolve(response)
					})
				}else{
					deferred.resolve($rootScope.dataLink)
				}
				return deferred.promise;
			},
			get: function(url){
				var deferred = $q.defer();
				if($rootScope.dataLink)
					config.dataLink.sessionToken = $rootScope.dataLink.sessionToken;
				$http.get(url, {
					headers: {
						'X-Parse-Application-Id': 	config.dataLink.parseAppId,
						'X-Parse-REST-API-Key': 	config.dataLink.parseRestApiKey,
						'X-Parse-Session-Token': 	config.dataLink.sessionToken,
						'Content-Type': 			'application/json'
					}
				}).success(function(data){
					deferred.resolve(data);
				})
				return deferred.promise;
			},
			post: function(url, data){
				var deferred = $q.defer();
				if($rootScope.dataLink)
					config.dataLink.sessionToken = $rootScope.dataLink.sessionToken;
				$http.post(url, data, {
					headers: {
						'X-Parse-Application-Id': 	config.dataLink.parseAppId,
						'X-Parse-REST-API-Key': 	config.dataLink.parseRestApiKey,
						'X-Parse-Session-Token': 	config.dataLink.sessionToken,
						'Content-Type': 			'application/json'
					}
				}).success(function(data){
					deferred.resolve(data);
				})
				return deferred.promise;
			},
			put: function(url, data){
				var deferred = $q.defer();
				if($rootScope.dataLink)
					config.dataLink.sessionToken = $rootScope.dataLink.sessionToken;
				$http.put(url, data, {
					headers: {
						'X-Parse-Application-Id': 	config.dataLink.parseAppId,
						'X-Parse-REST-API-Key': 	config.dataLink.parseRestApiKey,
						'X-Parse-Session-Token': 	config.dataLink.sessionToken,
						'Content-Type': 			'application/json'
					}
				}).success(function(data){
					deferred.resolve(data);
				})
				return deferred.promise;
			}
		}
	}
	$scope.tools = tools;
	
	it.ListCtrl=$scope;
});
























var AdminCtrl = app.controller('AdminCtrl', function($rootScope, $scope, $http, $q, config, initSetupService, roleService){
	var tools = {
		email:function(fun){
			$http.post(config.parseRoot+'functions/'+fun, {}).success(function(data){
				$scope.response = data;
			}).error(function(error, data){
				$scope.response = {error:error,data:data};
			});
		},
		setup:function(){
			roleService.detailedRoles().then(function(roles){
				$rootScope.data.roles = roles;
				roleService.unassigned().then(function(unassigned){
					$rootScope.data.unassigned = unassigned;
				})
			})
		},
		userRoles:roleService,
		user:{
			editRoles:function(user){
				$rootScope.temp.user = user;
				$('#adminUserModal').modal('show');
				// ga('send', 'event', 'admin', 'editRoles');
			}
		},
		roles:{
			setup:function(){	//This is a one time only thing - used to initiate the website roles.
				initSetupService.setup($rootScope.user,config.roles).then(function(results){
					$rootScope.data.roles = results;
				})
			}
		}
	}

	tools.setup();
	$scope.$on('authenticated', function() {
		tools.setup();
	})
	$rootScope.$on('role-reassigned', function(event,unassigned){
		$rootScope.data.unassigned = unassigned;
	})
	$scope.tools = tools;
	it.AdminCtrl=$scope;
});