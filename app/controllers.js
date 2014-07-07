var MainCtrl = app.controller('MainCtrl', function($rootScope, $scope, $routeParams, $location, $http, config, userService, geoService){
	$rootScope.action = $routeParams.action;
	$rootScope.view = $routeParams.view;
	$rootScope.id = $routeParams.id;
	$rootScope.email = $routeParams.email;
	$rootScope.config = config;

	function setup(){
		$scope.$on('$viewContentLoaded', function(event) {
			ga('send', 'pageview', $location.path());
		});
	}

	var tools = {
		user: userService,
		setGeo:function(geo){
			if(!$rootScope.temp.user)
				$rootScope.temp.user = {};
			$rootScope.temp.user.geo = geoService.parsePoint(geo);
		},
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
			$rootScope.temp=	{};
			$rootScope.side=	{};
			$rootScope.mode=	'normal';
			// tools.side.set('left','partials/shoeboxlist/sidebar.html')
			// tools.side.set('right','partials/sidebar.html')
		},
		getInvite:function(){
			$routeParams.id
			$routeParams.email
			if($routeParams.id && $routeParams.email)
				$http.post(config.parseRoot+'functions/dataFromInvite', {token: $routeParams.id, email: $routeParams.email})
				.success(function(response){
					it.dataFromInvite = response;
					var u = response.result;
					$rootScope.temp.user = {
						firstName: 	u.firstName,
						lastName: 	u.lastName,
						phone: 		u.phone,
						address: 	u.address,
						geo: 		{
							__type: 	"GeoPoint",
							latitude: 	u.geo.latitude,
							longitude: 	u.geo.longitude
						},
						email:  	u.email
					}
				}).error(function(response){
					console.log('dataFromInvite error: ', response)
				})
		},
		signup:function(user){
			user.token=$routeParams.id;
			if($routeParams.email)
				user.email=$routeParams.email;
			tools.user.signup(user)
		},
		accountInit: function(){
			$rootScope.temp.user = angular.fromJson(angular.toJson($rootScope.user))
		},
		settings:function(user){
			var us = {}
				us.emailNotifications = user.emailNotifications
				us.phoneNotifications = user.phoneNotifications
			if(user.phone)
				us.phone = user.phone
			if(user.address)
				us.address = user.address
			if(user.email)
				us.email = user.email
			if(user.geo){
				us.geo = user.geo
				$rootScope.$broadcast('geoChange', user.geo);
			}

			$http.put(config.parseRoot+'users/'+$rootScope.user.objectId, us).success(function(data){
				$rootScope.error = null;
				$rootScope.success = data;
			}).error(function(error){
				$rootScope.error = error;
			})
		},
		invite: function(invitation){
			invitation.status = 'sending';
			$http.post(config.parseRoot+'classes/invitations', invitation)
				.success(function(response){
					console.log('invitation success: ', response);
					invitation.status='active';
				})
				.error(function(response){
					console.log('invitation error: ', response);
				})
		},
		clearInvite:function(){
			$rootScope.temp.invitation = {};
		}
	}
	$scope.tools = tools;
	$rootScope.mainTools = tools;

	if(!$rootScope.data){
		tools.setup();
	}
	it.MainCtrl=$scope;
});










var RideCtrl = app.controller('RideCtrl', function($rootScope, $scope, $q, $sce, $http, config, settings, dataService, userService){
	console.log('RIDE CONTROLLER')
	$scope.moment = moment;
	$scope.warnings = {};
	$scope.future = {
		ends: new Date()
	}
	$http.get('/assets/json/temples.json').success(function(data){
		$scope.templeList = data.temples;
	})


	$scope.formated = {
		driver: {
			color: settings.colors.background.driver,
			textColor: settings.colors.font.driver,
			events: []
		},
		passenger: {
			color: settings.colors.background.passenger,
			textColor: settings.colors.font.passenger,
			events: []
		},
		other: {
			color: settings.colors.background.other,
			textColor: settings.colors.font.other,
			events: []
		}
	}

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
	});
	var allRidesPromise = allRides.promise;

	var tools = {
		formatRides: function(rides, type){
			var rideList = [];
			if(rides)
				for(var i=0; i<rides.length; i++){
					var tRide = angular.fromJson(angular.toJson(rides[i]))

					tRide.title 	= tRide.temple;
					tRide.type 		= type;
					tRide.starts 	= new Date(tRide.date+' '+tRide.leaving);
					tRide.ends 		= new Date(tRide.date+' '+tRide.returning);
					tRide.allDay 	= false;

					rideList.push(tRide);
				}
			return rideList;
		},
		ride:{
			ind: function(){
				allRidesPromise.then(function(rideResource){
					$rootScope.$on(rideResource.listenId, function(event, data){
						tools.ride.get($rootScope.id).then(function(ride){
							$scope.ride = ride;
							if(ride.type=='driver')
								tools.ride.passengerList(ride);
						})
					});
				});
			},
			get: function(rideId){
				var ride = $q.defer();
				allRidesPromise.then(function(rideResource){
					var rideTypes = ['driver','passenger','other']
					var rides = $scope.formated;
					for(var t=0; t<rideTypes.length; t++){
						var list = rides[rideTypes[t]].events;
						for(var i=0; i<list.length; i++){
							if(list[i].objectId == rideId){
								list[i].type = rideTypes[t];
								ride.resolve(list[i]);
							}
						}
					}
				})
				return ride.promise;
			},
			display: function(ride){
				if(ride.type=='driver'){
					var passengers = ride.seats-ride.seatsAvail;
					if(passengers == 0)
						return 'No one is going yet, but you have set up a ride for '+moment(ride.start).format('dddd MMMM Do [at] h:mm a');
					else if(passengers == 1)
						return 'You are giving a ride to one person '+moment(ride.start).format('dddd MMMM Do [at] h:mm a');
					else
						return 'You are giving a ride to '+(ride.seats-ride.seatsAvail)+' people '+moment(ride.start).format('dddd MMMM Do [at] h:mm a');
				}else if(ride.type=='passenger')
					return 'You will be picked up to go to the temple: '+moment(ride.start).format('dddd MMMM Do [at] h:mm a');
				else 
					return 'A ride to the '+ride.temple+' is available: '+moment(ride.start).format('dddd MMMM Do [at] h:mm a');
			},
			focus: function(ride){
				$scope.temp.reservationStatus = null;
				$rootScope.temp.focus = ride;
				$rootScope.mainTools.side.set('right','partials/side/'+ride.type+'.html');
				console.log(ride.type)
				if(ride.type=='driver')
					tools.ride.passengerList(ride);
			},
			add: function(ride){
				if(ride){
					if(!ride.date)
						$scope.warnings.date = 'You must specify the day you will go to the temple.'
					else
						delete $scope.warnings.date

					if(new Date(ride.date+' '+ride.leaving) > new Date(ride.date+' '+ride.returning))
						$scope.warnings.leaveReturn = 'You must leave before you return.'
					else
						delete $scope.warnings.leaveReturn

					if(!ride.temple)
						$scope.warnings.temple = 'You must specify the temple you will be attending.'
					else
						delete $scope.warnings.temple

					if(!ride.seats)
						$scope.warnings.seats = 'You must specify the number of seats available.'
					else
						delete $scope.warnings.seats
				}
				if(angular.toJson($scope.warnings) == "{}"){
					ride.timestamp = new Date(ride.date+' '+ride.leaving).getTime();
					ride.status = 'active';
					ride.temple = ride.temple.name;
					allRidesPromise.then(function(rideResource){
						rideResource.item.save(ride)
					})
					$scope.temp.ride = {};
				}
			},
			remove: function(ride){
				var infoToSave = {
					objectId: ride.objectId,
					status: 'removed'
				}
				if(confirm('Are you sure you want to delete this ride?')){
					allRidesPromise.then(function(rideResource){
						rideResource.item.save(infoToSave)
					})
					$scope.temp.ride = {};
				}
			},
			reserve: function(ride){
				$scope.temp.reservationStatus = 'processing';
				$http.post(config.parseRoot+'functions/joinRide', {objectId: ride.objectId}).then(function(response){
					if(response.data.result && response.data.result.updatedAt){
						$scope.temp.reservationStatus = 'reserved';
						allRidesPromise.then(function(rideResource){
							rideResource.broadcast(response.data.result.updatedAt)
						})
					}else{
						$scope.temp.reservationStatus = 'error';
					}
				})
			},
			cancelReservation: function(ride){
				$scope.temp.reservationStatus = 'processing';
				$http.post(config.parseRoot+'functions/leaveRide', {objectId: ride.objectId}).then(function(response){
					if(response.data.result && response.data.result.updatedAt){
						$scope.temp.reservationStatus = 'canceled';
						allRidesPromise.then(function(rideResource){
							rideResource.broadcast(response.data.result.updatedAt)
						})
					}else{
						$scope.temp.reservationStatus = 'error';
					}
				})
			},
			list: function(){
				$http.post(config.parseRoot+'functions/rideList', {}).then(function(response){
					console.log('Ride List Response: ', response)
				})
			},
			passengerList: function(ride){
				$http.post(config.parseRoot+'functions/passengerList', {objectId: ride.objectId}).then(function(response){
					var passengers = response.data.result;
					$scope.temp.passengers = passengers;
					var details = '?'
								+ 'key=' + config.googleApiKey
								+ '&origin='+$rootScope.user.geo.latitude+','+$rootScope.user.geo.longitude
								+ '&destination='+ride.temple
					if(passengers.length>0){
						var waypoints = passengers[0].geo.latitude+','+passengers[0].geo.longitude;
						for(var i=1; i<passengers.length; i++)
							waypoints += '|' + passengers[i].geo.latitude+','+passengers[i].geo.longitude;
						details += '&waypoints='+waypoints;
					}
					var mapUrl 	= 'https://www.google.com/maps/embed/v1/directions'+details
					$rootScope.mapUrl = $sce.trustAsResourceUrl(mapUrl);
				})
			}
		},
		temple:{
			set:function(temple){
				var temple = $rootScope.temp.ride.temple;
				$rootScope.templeLink = $sce.trustAsResourceUrl(temple.link+'#primary-details');
				// $rootScope.templeLink = $sce.trustAsResourceUrl(temple.link+'#schedule-section');
				$rootScope.mainTools.side.set('right', 'partials/side/temple.html');
			}
		}
	}

	$scope.uiConfig = {
		calendar:{
			height: 450,
			editable: false,
			header:{
				left: 'title',
				center: '',
				right: 'today prev,next'
			},
			eventClick: function(obj, e){
				tools.ride.focus(obj)
			},
			eventDrop: $scope.alertOnDrop,
			eventResize: $scope.alertOnResize,
			viewRender: function(view, element) {
				console.log("View Changed: ", view.visStart, view.visEnd, view.start, view.end);
			}
		}
	};
	$scope.eventSources = [$scope.formated.driver, $scope.formated.passenger, $scope.formated.other];
	$scope.tools = tools;

	$rootScope.$on('geoChange', function(event, geo) {
		allRidesPromise.then(function(rideResource){
			rideResource.loadData();
		})
	});

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
				var oFamily = $rootScope.temp.oFamily;
				$('#familyModal').modal('hide');
				
				//Validate email & phone
				//Check for internet - call later if not.
				if(family.share && !oFamily.shareRides){
					family.fromList = true;
					tools.family.invite(family)
				}

				var familyId = oFamily.objectId;
				oFamily.householdInfo.phone = family.phone;
				oFamily.householdInfo.email = family.email;
				oFamily.shareRides 			= family.share;
				oFamily.hasInternet 		= family.internet;
				delete oFamily.ACL
				delete oFamily.objectId
				delete oFamily.createdBy
				delete oFamily.createdAt
				delete oFamily.updatedAt
				tools.http.put(config.parseRoot+'classes/Family/'+familyId, oFamily)
				//Save data back to parse
			},
			invite: function(invitation){
				// Add another modal that says an invitation email has been sent.
				$('#welcomeModal').modal('show');
				invitation.status = 'sending';
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