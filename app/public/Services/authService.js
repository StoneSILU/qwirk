Qwirk.service('authService',  function($http, $location){
      this.isLogged =  function(){
        return $http({
          method: 'GET',
          url: SERVER_URL+'/api/isConnected',
        })
        .then(
            function(response) {
                return response;
            },
            function(response) {
              return false;
        });
      }
      
      this.authorized =  function() {
        if(!this.isLogged()) {
          $location.path('/');
        }
      }
});

Qwirk.config(function ($httpProvider) {
  $httpProvider.interceptors.push(function ($rootScope, $q, $window) {
      return {
        request: function (config) {
          config.headers = config.headers || {};
          if ($window.sessionStorage.token) {
            config.headers.Authorization = 'Bearer ' + $window.sessionStorage.token;
          }
          return config;
        },
        response: function (response) {
          if (response.status === 401) {
          }
          return response || $q.when(response);
        }
      };
  });
  $httpProvider.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
});