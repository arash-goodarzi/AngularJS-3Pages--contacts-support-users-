(function ()
{
    'use strict';

    angular
        .module('app.tagnitro.users.activeusers', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider, $translatePartialLoaderProvider, msApiProvider, msNavigationServiceProvider)
    {
        // State
        $stateProvider
            .state('app.tagnitro_users_activeusers', {
                url    : '/users/activeusers',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/tagnitro/users/activeusers/activeusers.html',
                        controller : 'ActiveusersController as vm'
                    }
                },
                resolve: {
                    SampleData: function (msApi)
                    {
                        return msApi.resolve('activeusers@get');
                    }
                }
            });

        // Translation
        $translatePartialLoaderProvider.addPart('app/main/tagnitro/users/activeusers');

        // Api
        msApiProvider.register('activeusers', ['app/data/activeusers/activeusers.json']);
    }
})();