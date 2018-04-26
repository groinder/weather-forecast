(function(){
    'use strict';

    angular.module('weatherForecast', ['ngMaterial'])
})();
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
(function () {
    'use strict';

    angular.module('weatherForecast')
        .controller('searchController', searchController);

    searchController.$inject = ['$scope', 'mapService', '$q'];

    function searchController($scope, mapService, $q) {
        var self = this;
        
        mapService.init().then(function () {
            var map = mapService.getMap();
            var autcompleteService = new google.maps.places.AutocompleteService();
            var placeService = new google.maps.places.PlacesService(map);
            var marker = null;
    
            self.searchLocation = function searchLocation(text) {
                var defer = $q.defer();
    
                if (text.length < 3) {
                    defer.resolve([]);
                }
                else {
                    autcompleteService.getPlacePredictions({
                        input: text
                    }, function(results){
                        defer.resolve(results);
                    });
                }
    
                return defer.promise;
            };
    
            self.showWeather = function showWeather(item) {
                placeService.getDetails({placeId: item.place_id}, showPlace);
            };

            function showPlace(place) {
                createPlaceMarker(place);
                panMap(place);
            }

            function createPlaceMarker(place) {
                if (marker) {
                    marker.setPosition(place.geometry.location);
                    marker.setTitle(place.formatted_address);
                }
                else {
                    marker = new google.maps.Marker({
                        position: place.geometry.location,
                        map: map,
                        title: place.formatted_address
                    });
                }
            }

            function panMap(place) {
                map.setZoom(17);
                map.panTo(place.geometry.location);
            }
        });
    }
})();
//# sourceMappingURL=weatherForecast.js.map
