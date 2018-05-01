(function () {
    'use strict';

    angular.module('weatherForecast')
        .controller('searchController', searchController);

    searchController.$inject = ['$scope', 'mapService', '$q', 'weatherService', '$localStorage'];

    function searchController($scope, mapService, $q, weatherService, $localStorage) {
        var self = this;

        self.weatherList = [];
        self.defaultLocation = $localStorage.defaultLocation;
        self.loading = true;
        self.geocoderUnavailable = !navigator.geolocation;

        mapService.init().then(function () {
            var map = mapService.getMap();
            var autcompleteService = new google.maps.places.AutocompleteService();
            var placeService = new google.maps.places.PlacesService(map);
            var placeInfo = null;

            mapService.setMarkerDragend(markerMove);

            if ($localStorage.defaultLocation) {
                self.selectedItem = $localStorage.defaultLocation;
            }
            else {
                self.loading = false;
            }

            self.searchLocation = function searchLocation(text) {
                var defer = $q.defer();

                if (text.length < 3) {
                    defer.resolve([]);
                }
                else {
                    autcompleteService.getPlacePredictions({
                        input: text
                    }, function (results) {
                        defer.resolve(results);
                    });
                }

                return defer.promise;
            };

            self.showWeather = function showWeather(item) {
                if (item) {
                    placeService.getDetails({placeId: item.place_id}, function (place) {
                        placeInfo = place;
                        showPlace(place);
                    });
                }
            };

            self.storeDefault = function () {
                $localStorage.defaultLocation = self.defaultLocation = angular.copy(self.selectedItem);
            };

            self.geolocate = function geolocate() {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        function (position) {
                            mapService.geocode({
                                    lat: position.coords.latitude,
                                    lng: position.coords.longitude
                                }
                            ).then(onGeocodeResult);
                        });
                }
            };

            function showPlace(place) {
                var location = {
                    lat: place.geometry.location.lat(),
                    lon: place.geometry.location.lng()
                };

                mapService.setMarker(place.geometry.location, place.formatted_address);

                weatherService.getForecast(location).then(
                    function success(result) {
                        self.weatherList = weatherService.parseForecast(result.list);
                        mapService.setInfoWindow(weatherService.createInfoWindowString(result.city, result.list[0]));
                    })
                    .finally(function () {
                        self.loading = false;
                    });

                panMap(place);
            }

            function panMap(place) {
                map.panTo(place.geometry.location);
            }

            function markerMove() {
                var marker = this;
                mapService.geocode(marker.getPosition()).then(
                    onGeocodeResult,
                    function (reason) {
                        alert(reason);
                    }
                );
            }

            function onGeocodeResult(result) {
                self.selectedItem = result;
                self.showWeather(self.selectedItem);
            }
        });
    }
})();