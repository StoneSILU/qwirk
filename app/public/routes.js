Qwirk.config(function($routeProvider){

	$routeProvider
		.when('/home',{
			templateUrl: 'Views/home.html',
			controller: "userCtrl"
		})
		
		.when('/',{
			templateUrl: 'Views/login.html',
		})

		.when('/register',{
			templateUrl: 'Views/register.html',
			controller: "RegisterCtrl"
		})

      .otherwise({redirectTo: '/'});
		
})