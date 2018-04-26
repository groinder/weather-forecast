(function () {
    'use strict';

    angular.module('weatherForecast')
        .factory('mapService', mapService);

    mapService.$inject = ['$q', '$window'];

    function mapService($q, $window) {
        var map = null;

        function loadGoogleMaps() {
            var defer = $q.defer();

            function loadScript() {
                var script = document.createElement('script');
                script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyB0qApnUTcWGGVWjIQ0oDysnMIxuQimj2o&libraries=places&callback=initMap';

                document.body.appendChild(script);
            }

            $window.initMap = function () {
                defer.resolve();
            }

            loadScript();

            return defer.promise;
        }

        function initMap() {
            map = new google.maps.Map(document.getElementById('map'), {
                center: { lat: -34.397, lng: 150.644 },
                zoom: 8
            });
        }

        return {
            init: function init() {
                return loadGoogleMaps().then(initMap);
            },

            getMap: function getMap() {
                return map;
            }
        }
    }
})();