app.factory('userService', function ($rootScope, $http, $q, config) {
	var userService = {
		user:function(){
			var deferred = $q.defer();
			if($rootScope.user)
				deferred.resolve($rootScope.user);
			else{
				$rootScope.$on('authenticated', function(event,user) {
					deferred.resolve(user);
				});
			}
			return deferred.promise;
		},
 		init:function(){
 			if(localStorage.user){
				var localUser = angular.fromJson(localStorage.user);
				Parse.User.become(localUser.sessionToken)
				$http.defaults.headers.common['X-Parse-Session-Token'] = localUser.sessionToken;
			}
 			$http.get(config.parseRoot+'users/me').success(function(data){
 				//Add a weird hack because /me does not return all information stored in the user object.
 				$http.get(config.parseRoot+'users/'+data.objectId).success(function(data){
 					$rootScope.user=data;
	 				$rootScope.$broadcast('authenticated', data);
 				});
 			}).error(function(){
				//Prompt for login
			});
 		},
 		loginModal:function(){
 			$('#userLoginModal').modal('show');
 		},
 		login:function(user){
 			var login = {
 				username:user.username,
 				password:user.password
 			}
 			$http.get(config.parseRoot+"login", {params: login}).success(function(data){
 				Parse.User.become(data.sessionToken);
 				$http.defaults.headers.common['X-Parse-Session-Token'] = data.sessionToken;
 				localStorage.user=angular.toJson(data);
 				$rootScope.user=data;
				$rootScope.$broadcast('authenticated', data);
 				$('#userLoginModal').modal('hide');
 			}).error(function(data){
 				console.error('error',data.error);
				// $('#loading').removeClass('active');
			});
 		},
 		logout:function(){
 			localStorage.clear();
 			$rootScope.user=null;
 			Parse.User.logOut()
 		}
 	}
	it.userService = userService;
	return userService;
});









app.factory('directoryService', function ($rootScope, $http, $q, config, userService) {
	var directory = false;
	var directoryService = {
		init:function(){
			var deferred = $q.defer();
			userService.user().then(function(){
				if(localStorage.directory){
					directory = angular.fromJson(localStorage.directory)
					deferred.resolve(directory);
				}else{
					$http.get(config.parseRoot+'classes/Family?limit=900')
					.success(function(data){
						directory = data.results;
						localStorage.directory = angular.toJson(directory)
						deferred.resolve(directory);
					})
				}
			})
			return deferred.promise;
		},
		list:function(){
			return directoryService.init();
		}
	}
	it.directoryService = directoryService;
	return directoryService;
});








app.factory('tagService', function ($rootScope, $http, $q, config, userService) {
	var tagService = {
		Tag: Parse.Object.extend('Tag'),
		init:function(){
			var deferred = $q.defer();
			var query = new Parse.Query(tagService.Tag);
			userService.user().then(function(){
				query.find({
					success:function(results){
						deferred.resolve(results);
					}
				})
				// if(localStorage.tags){
				// 	tags = angular.fromJson(localStorage.tags)
				// 	deferred.resolve(tags);
				// }else{
				// 	$http.get(config.parseRoot+'classes/Tags?limit=100')
				// 	.success(function(data){
				// 		tags = data.results;
				// 		localStorage.tags = angular.toJson(tags)
				// 		deferred.resolve(tags);
				// 	})
				// }
			})
			return deferred.promise;
		},
		add:function(name, icon, description){
			var deferred = $q.defer();
			var tag = new tagService.Tag();
			tag.set('name', name)
			tag.set('icon', icon)
			tag.set('description', description)
			tag.save(null, {
				success: function(saved) {
					deferred.resolve(saved);
				}
			});
			return deferred.promise;
		},
		hasTag:function(tag, family){
			return (family && family.tags && family.tags.indexOf(tag.id) != -1);
		},
		toggle:function(tag, family){
			if(!family.tags)
				family.tags = [];
			var tagIndex = family.tags.indexOf(tag.id);
			if(tagIndex == -1)
				family.tags.push(tag.id)
			else
				family.tags.splice(tagIndex, 1)
			console.log(tag, family)
		},
		list:function(){
			return tagService.init();
		}
	}
	it.tagService = tagService;
	return tagService;
});








app.factory('fileService', function ($http, config) {
	var fileService = {
		upload:function(details,b64,successCallback,errorCallback){
			var file = new Parse.File(details.name, { base64: b64});
			file.save().then(function(data) {
				it.fileData = data;
				console.log('save success',data)
				if(successCallback)
					successCallback(data);
			}, function(error) {
				console.log('save error',error)
				if(errorCallback)
					errorCallback(error)
			});
		}
	}

	it.fileService = fileService;
	return fileService;
});



app.factory('qrService', function () {
	var qrService = {
		create:function(text, size){
			if(!size)
				size = 256;
			return 'https://api.qrserver.com/v1/create-qr-code/?size='+size+'x'+size+'&data='+text
			// return 'https://chart.googleapis.com/chart?'+
		}
	}

	it.qrService = qrService;
	return qrService;
});



