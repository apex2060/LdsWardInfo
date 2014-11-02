var MainCtrl = app.controller('MainCtrl', function($rootScope, $scope, $routeParams, $location, $http, $q, config, userService, directoryService){
	$rootScope.view = $routeParams.view;
	$rootScope.id = $routeParams.id;
	$rootScope.config = config;
	$rootScope.userService = userService;

	var Tag = Parse.Object.extend('Tag');
	var Note = Parse.Object.extend('Note');

	var tools = {
		user: userService,
		url:function(){
			if($rootScope.user || $routeParams.view == 'about' || $routeParams.view == 'home')
				return 'views/'+$routeParams.view+'.html';
			else
				return 'views/login.html';
		},
		sync:function(){
			tools.tag.reload().then(function(tags){
				$rootScope.tags = tags;
			})
		},
		init:function(){
			if(!$rootScope.data){
				$rootScope.data = {};
				$rootScope.temp = {};
				userService.user().then(function(){
					tools.family.init();
					tools.tag.init();
					tools.note.init();
				});
				$scope.$on('$viewContentLoaded', function(event) {
					// ga('send', 'pageview', $location.path());
				});
			}
		},
		tag: {
			init:function(){
				tools.tag.list().then(function(tags){
					$rootScope.tags = tags;
				})
			},
			reload:function(){
				var deferred = $q.defer();
				$http.get(config.parseRoot+'classes/Tag?limit=100').success(function(data){
					tags = data.results;
					localStorage.tags = angular.toJson(tags)
					deferred.resolve(tags);
				})
				return deferred.promise;
			},
			list:function(){
				var deferred = $q.defer();
				if(localStorage.tags){
					tags = angular.fromJson(localStorage.tags)
					deferred.resolve(tags);
				}else{
					tools.tag.reload().then(function(tags){
						deferred.resolve(tags);
					})
				}
				return deferred.promise;
			},
			create: function(){
				var tagName = prompt('Name this new tag: ');
				if(tagName)
					tools.tag.add(tagName);
			},
			add:function(name, icon, description){
				var tag = new Tag();
				tag.set('name', name)
				tag.set('icon', icon)
				tag.set('description', description)
				tag.save(null, {
					success: function(saved) {
						tools.tag.reload().then(function(tags){
							$rootScope.tags = tags;
						})
					}
				});
			},
			edit:function(tag){
				var toEdit = angular.copy(tag);
				var newName = prompt('Type a new name for the tag: '+tag.name)
				toEdit.name = newName;
				if(newName)
					$http.put(config.parseRoot+'classes/Tag/'+tag.objectId, toEdit).success(function(){
						tools.tag.reload().then(function(tags){
							$rootScope.tags = tags;
						})
					})
			},
			delete:function(tag){
				if(confirm('Are you sure you want to delete the -'+tag.name+'- tag? '))
				$http.delete(config.parseRoot+'classes/Tag/'+tag.objectId).success(function(){
					tools.tag.reload().then(function(tags){
						$rootScope.tags = tags;
					})
				})
			},
			choose: function(tag){
				if($rootScope.data.tagState == 'filter')
					tools.tag.filter(tag)
				else if($rootScope.data.tagState == 'set')
					tools.tag.toggle(tag.objectId, $scope.family)
				else if($rootScope.data.tagState == 'edit')
					return; //Do nothing
			},
			highlight: function(tag){
				var cs = $rootScope.data.tagState;
				if(cs == 'filter')
					if($rootScope.data.filterTags)
						return $rootScope.data.filterTags.indexOf(tag.objectId) != -1;
					else
						return false;
				else if(cs == 'set')
					return !!tools.family.hasTag(tag.objectId, $rootScope.family)
				else
					return false;
			},

			toggle:function(tagId, family){
				if(!family.tags)
					family.tags = [];
				var tagIndex = family.tags.indexOf(tagId);
				if(tagIndex == -1)
					family.tags.push(tagId)
				else
					family.tags.splice(tagIndex, 1)
				tools.family.save(family)
			},
			state: function(state){
				if(state)
					$rootScope.data.tagState = state;
				else
					return $rootScope.data.tagState;
			},
			filter: function(tag){
				if(!$rootScope.data.filterTags)
					$rootScope.data.filterTags = []
				var filterIndex = $rootScope.data.filterTags.indexOf(tag.objectId);
				if(filterIndex==-1)
					$rootScope.data.filterTags.push(tag.objectId)
				else
					$rootScope.data.filterTags.splice(filterIndex, 1)
			}
		},
		family:{
			init:function(){
				directoryService.list().then(function(directory){
					$rootScope.directory = directory
				})
			},
			save:function(family){
				var toSave = angular.copy(family)
				delete toSave.objectId
				delete toSave.createdAt
				delete toSave.updatedAt
				$http.put(config.parseRoot+'classes/Family/'+family.objectId, toSave).success(function(results){
					directoryService.reload().then(function(directory){
						$rootScope.directory = directory
					})
				})
			},
			close:function(){
				$rootScope.family = false;
				if(tools.tag.state()=='set')
					tools.tag.state('filter');
			},
			set:function(family){
				$rootScope.family = family;
				$rootScope.data.tagState = 'set';
				// $('#familyModal').modal('show');
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
			},
			hasTag:function(tagId, family){
				return (tagId && family && family.tags && family.tags.indexOf(tagId) != -1);
			}
		},
		note:{
			init:function(){
				tools.note.list().then(function(notes){
					$rootScope.notes = notes;
				})
			},
			reload:function(){
				var deferred = $q.defer();
				$http.get(config.parseRoot+'classes/Note?limit=100').success(function(data){
					notes = data.results;
					localStorage.notes = angular.toJson(notes)
					deferred.resolve(notes);
				})
				return deferred.promise;
			},
			list:function(){
				var deferred = $q.defer();
				if(localStorage.notes){
					notes = angular.fromJson(localStorage.notes)
					deferred.resolve(notes);
				}else{
					tools.note.reload().then(function(notes){
						deferred.resolve(notes);
					})
				}
				return deferred.promise;
			},
			create: function(){
				var noteName = prompt('Name this new note: ');
				if(noteName)
					tools.note.add(noteName);
			},
			add:function(family, tNote){
				if(family && tNote){
					var note = angular.copy(tNote)
					delete $rootScope.temp.note;
					note.family = {"__op":"AddRelation","objects":[{"__type":"Pointer","className":"Family","objectId":family.objectId}]}
					note.familyId = family.objectId;
					$http.post(config.parseRoot+'classes/Note', note).success(function(){
						tools.note.reload().then(function(notes){
							$rootScope.notes = notes;
						})
					})
				}
			},
			family:function(family){
				var notes = $rootScope.notes
				var familyNotes = [];
				if(family && notes){
					for(var i=0; i<notes.length; i++)
						if(notes[i].familyId == family.objectId)
							familyNotes.push(notes[i])
					return familyNotes;
				}
			}
		}
	}
	$scope.tools = tools;
	tools.init();
	it.MainCtrl=$scope;
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