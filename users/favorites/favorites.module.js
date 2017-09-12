(function ()
{
    'use strict';

    angular
        .module('app.tagnitro.users.favorites', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider, $translatePartialLoaderProvider, msApiProvider, msNavigationServiceProvider)
    {
        // State
        $stateProvider
            .state('app.tagnitro_users_favorites', {
                url    : '/users/favorites',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/tagnitro/users/favorites/favorites.html',
                        controller : 'FavoritesController as vm'
                    }
                },
                resolve: {
                    SampleData: function (msApi)
                    {
                        return msApi.resolve('favorites@get');
                    }
                }
            });

        // Translation
        $translatePartialLoaderProvider.addPart('app/main/tagnitro/users/favorites');

        // Api
        msApiProvider.register('favorites', ['app/data/favorites/favorites.json']);

    }
})();