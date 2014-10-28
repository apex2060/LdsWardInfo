app.factory('config', function ($rootScope, $http) {
	var config = {
		parseRoot: 			'https://api.parse.com/1/',
	 	parseAppId: 		'EidNJX27qA8pK7ONhftKzmPKIZ3HnhG1GEflmThN',
	 	parseJsKey: 		'8EQE83Vnyk4O7zePlbs2Flox2BjVAigZGmAzA53v',
	 	parseRestApiKey: 	'SgbhNWFjKrTp6g9H5C7fg8WJKNRMPC8GGs9SyeEF',
	 	googleApiKey: 		'AIzaSyCdziJUzU0g7gUs3T-b3YBX1CipHwQybSM',
	};

	Parse.initialize(config.parseAppId, config.parseJsKey);
	$http.defaults.headers.common['X-Parse-Application-Id'] = config.parseAppId;
	$http.defaults.headers.common['X-Parse-REST-API-Key'] = config.parseRestApiKey;
	$http.defaults.headers.common['Content-Type'] = 'application/json';

	return config;
});