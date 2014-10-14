app.factory('config', function ($rootScope, $http) {
	var config = {
		fireRoot: 			'https://ldswardinfo.firebaseio.com/',
		fireRef: 			new Firebase('https://ldswardinfo.firebaseio.com/'),
		parseRoot: 			'https://api.parse.com/1/',
	 	parseAppId: 		'muk3Od6KYbcuHGuvkHQi09mdxYVjjSglkUeHrud8',
	 	parseJsKey: 		'q2A4cUHFyHLl2UcI3CRCIDkXsKxL8xln6LDm92tA',
	 	parseRestApiKey: 	'MyyuRPK5Qqth07iWKJnxBegqj7URRzPd4LSNxO82',
	 	googleApiKey: 		'AIzaSyCdziJUzU0g7gUs3T-b3YBX1CipHwQybSM',
	 	roles: 				['Admin','Support','Leadership','Member','BlockedUser'],

	 	dataLink: {
	 		app: 				"Member Datalink",
			parseAppId: 		"EidNJX27qA8pK7ONhftKzmPKIZ3HnhG1GEflmThN",
			parseRestApiKey: 	"SgbhNWFjKrTp6g9H5C7fg8WJKNRMPC8GGs9SyeEF",
			sessionToken: 		""
	 	}
	};

	Parse.initialize(config.parseAppId, config.parseJsKey);
	$http.defaults.headers.common['X-Parse-Application-Id'] = config.parseAppId;
	$http.defaults.headers.common['X-Parse-REST-API-Key'] = config.parseRestApiKey;
	$http.defaults.headers.common['Content-Type'] = 'application/json';

	return config;
});



app.factory('settings', function ($rootScope) {
	var settings = {
		colors: {
			background: {
				driver: 	'#10663F',	//Green
				passenger: 	'#FFEDD6',	//Blue
				other: 		'#AAA'		//Grey
			},
			font: {
				driver: 	'#FFF',
				passenger: 	'#FFF',
				other: 		'#333'
			}
		}
	};
	return settings;
});