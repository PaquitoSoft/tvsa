angular.module('MyApp').factory('Auth', ['$http', '$location', '$rootScope', '$cookieStore', '$alert', 
	function($http, $location, $rootScope, $cookieStore, $alert) {

	$rootScope.currentUser = $cookieStore.get('user'); // TODO No deberia estar el passowrd
	$cookieStore.remove('user'); // TODO Por que no queremos login "infinito"??

	return {
		login: function(userCredentials) {
			// TODO La gestion de la respuesta deberia hacerse en un controlador
			return $http.post('/api/login', userCredentials)
				.success(function(data) {
					$rootScope.currentUser = data; // TODO No deberia estar el password
					$location.path('/'); // TODO Estaria bien recordar donde hizo login el usuario

					$alert({
						title: 'Cheers!',
						content: 'You have successfully logged in.',
						placement: 'top-right',
						type: 'success',
						duration: 3
					});
				})
				.error(function() {
					$alert({
						title: 'Error!',
						content: 'Invalid username and password.',
						placement: 'top-right',
						type: 'danger',
						duration: 3
					});
				});
		},
		signup: function(userCredentials) {
			// TODO Cual es el resultado de error()??
			return $http.post('/api/signup', userCredentials)
				.success(function() {
					$location.path('/login'); // TODO Estaría bien recordar el origen

					$alert({
						title: 'Congratulations!',
						content: 'Your account has been created.',
						placement: 'top-right',
						type: 'success',
						duration: 3
					});
				})
				.error(function(response) {
					$alert({
						title: 'Error!',
						content: response.data,
						placement: 'top-right',
						type: 'danger',
						duration: 3
					});
				});
		},
		logout: function() {
			// TODO Por que es un GET???
			return $http.get('/api/logout').success(function() {
				$rootScope.currentUser = null;
				$cookieStore.remove('user');
				$alert({
					content: 'You have been logged out.',
					placement: 'top-right',
					type: 'info',
					duration: 3
				});
			});
		}
	};

}]);