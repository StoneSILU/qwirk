var Qwirk = angular.module('Qwirk', ['ngRoute','ngSanitize','ui.bootstrap','ngFileUpload','dbaq.emoji']);

Qwirk.run(['$rootScope', '$location', 'authService', function ($rootScope, $location, authService) {
    $rootScope.$on('$routeChangeStart', function (event) {
		// if ($location.path() !== '/register' && $location.path() !== '/') {
		// 	authService.isLogged().then(function(response){
		// 		if(!response) {
		// 			$location.path('/');
		// 		}
		// 	})
			
		// }
    });
}]);
