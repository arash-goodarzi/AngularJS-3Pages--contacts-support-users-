(function ()
{
    'use strict';

    angular
        .module('app.tagnitro.support', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider, $translatePartialLoaderProvider, msApiProvider, msNavigationServiceProvider)
    {
        // State
        $stateProvider
            .state('app.tagnitro_support', {
                url    : '/support',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/tagnitro/support/support.html',
                        controller : 'SupportController as vm'
                    }
                },
                resolve: {
                    SampleData: function (msApi)
                    {
                        return msApi.resolve('support@get');
                    }
                }
            });

        // Translation
        $translatePartialLoaderProvider.addPart('app/main/tagnitro/support');

        // Api
        msApiProvider.register('support', ['app/data/support/support.json']);

    }
})();