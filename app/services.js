app.factory('userService', function ($rootScope, $http, $q, config) {
	var userService = {
		user:function(){
			var deferred = $q.defer();
			if($rootScope.user)
				deferred.resolve($rootScope.user);
			else{
				userService.init();
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
		reload:function(){
			var deferred = $q.defer();
			userService.user().then(function(){
				$http.get(config.parseRoot+'classes/Family?limit=900')
				.success(function(data){
					directory = data.results;
					localStorage.directory = angular.toJson(directory)
					deferred.resolve(directory);
				})
			});
			return deferred.promise;
		},
		list:function(){
			return directoryService.init();
		}
	}
	it.directoryService = directoryService;
	return directoryService;
});








app.factory('dataService', function ($http, $q, config) {
	return function(className, limit){
		var ds = this;
		this.className 	= className;
		this.limit 		= limit;
		this.list = [];
		
		if(!this.limit)
			this.limit = 100;
		
		var tools = this.tools = {
			init: function(){
				return tools.list();
			},
			list: function(){
				var deferred = $q.defer();
				if(ds.list.length == 0)
					$http.get('https://api.parse.com/1/classes/'+ds.className+'?limit='+ds.limit).success(function(data){
						if(data.results)
							ds.list = data.results;
						deferred.resolve(ds.list);
					})
				else
					deferred.resolve(ds.list);
				return deferred.promise;
			},
			save: function(item){
				if(item.objectId)
					return ds.tools.update(item);
				else
					return ds.tools.add(item);
			},
			add: function(item){
				var deferred = $q.defer();
				$http.post('https://api.parse.com/1/classes/'+ds.className, item).success(function(data){
					angular.extend(item, data);
					ds.list.push(item);
					deferred.resolve(ds.list);
				})
				return deferred.promise;
			},
			update: function(item){
				var deferred = $q.defer();
				var temp = angular.copy(item);
				delete temp.createdAt;
				delete temp.updatedAt;
				delete temp.objectId;
				$http.put('https://api.parse.com/1/classes/'+ds.className+'/'+item.objectId, temp).success(function(data){
					angular.extend(item, data);
					deferred.resolve(ds.list);
				})
				return deferred.promise;
			},
			delete: function(item){
				var deferred = $q.defer();
				if(confirm('Are you sure you want to delete this item?')){
					$http.delete('https://api.parse.com/1/classes/'+ds.className+'/'+item.objectId).success(function(data){
						var i = ds.list.indexOf(item);
						ds.list.splice(i, 1)
						deferred.resolve(ds.list);
					})
				}else{
					deferred.resolve(ds.list);
				}
				return deferred.promise;
			},
		}
		tools.init();
	}

	it.dataService = dataService;
	return dataService;
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



