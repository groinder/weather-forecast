(function(){
    'use strict';

    angular.module('weatherForecast', ['ngMaterial', 'ngStorage', 'ngAnimate'])
})();
(function(){
    'use strict';

    angular.module('weatherForecast')
        .constant('OWM_API_KEY', 'efc991d41c1c953acb247bfcd541165f')
        .constant('GOOGLE_MAPS_API_KEY', 'AIzaSyB0qApnUTcWGGVWjIQ0oDysnMIxuQimj2o')
})();
(function () {
    'use strict';

    angular.module('weatherForecast')
        .factory('mapService', mapService);

    mapService.$inject = ['$q', '$window', 'GOOGLE_MAPS_API_KEY'];

    function mapService($q, $window, GOOGLE_MAPS_API_KEY) {
        var map = null;
        var marker = null;
        var markerDragend = null;
        var infoWindow = null;
        var geocoder;

        function loadGoogleMaps() {
            var defer = $q.defer();

            function loadScript() {
                var script = document.createElement('script');
                script.src = 'https://maps.googleapis.com/maps/api/js?key=' + GOOGLE_MAPS_API_KEY + '&libraries=places&callback=initMap';

                document.body.appendChild(script);
            }

            $window.initMap = function () {
                defer.resolve();
            };

            loadScript();

            return defer.promise;
        }

        function initialize() {
            geocoder = new google.maps.Geocoder();

            map = new google.maps.Map(document.getElementById('map'), {
                center: {lat: -34.397, lng: 150.644},
                zoom: 8
            });
        }

        function geocode(location) {
            var defer = $q.defer();

            geocoder.geocode({'location': location}, function (results, status) {
                if (status === 'OK') {
                    if (results[0]) {
                        defer.resolve({
                            place_id: results[0].place_id,
                            description: results[0].formatted_address
                        });
                    } else {
                        defer.reject('NO_RESULTS')
                    }
                } else {
                    defer.reject('Geocoder failed due to: ' + status);
                }
            });

            return defer.promise;
        }

        return {
            init: function init() {
                return loadGoogleMaps().then(initialize);
            },

            getMap: function getMap() {
                return map;
            },

            setMarker: function setMarker(position, title) {
                if (marker) {
                    marker.setPosition(position);
                    marker.setTitle(title);
                }
                else {
                    marker = new google.maps.Marker({
                        position: position,
                        map: map,
                        title: title,
                        draggable: true,
                    });

                    if (markerDragend) {
                        marker.addListener('dragend', markerDragend);
                    }
                }
            },

            setInfoWindow: function setInfoWindow(text) {
                if (infoWindow) {
                    infoWindow.setContent(text);
                }
                else {
                    infoWindow = new google.maps.InfoWindow({
                        content: text
                    });

                    marker.addListener('click', function () {
                        infoWindow.open(map, marker);
                    });

                    marker.addListener('dragstart', function () {
                        infoWindow.close();
                    });
                }

                infoWindow.open(map, marker);
            },

            setMarkerDragend: function (dragend) {
                markerDragend = dragend;
            },

            geocode: geocode
        }
    }
})();
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
                    navigator.geolocation.getCurrentPosition(function (position) {
                        mapService.geocode({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        }).then(onGeocodeResult);
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
                mapService.geocode(marker.getPosition()).then(onGeocodeResult);
            }

            function onGeocodeResult(result) {
                self.selectedItem = result;
                self.showWeather(self.selectedItem);
            }
        });
    }
})();
(function () {
    'use strict';

    angular.module('weatherForecast')
        .factory('weatherService', weatherService);

    weatherService.$inject = ['$http', 'OWM_API_KEY', '$q'];

    function weatherService($http, OWM_API_KEY, $q) {
        var API_URL = 'http://api.openweathermap.org/data/2.5/';
        var lastParams = null;
        var forecastPromise = null;

        function makeCall(params, method) {
            var defer = $q.defer();
            params['APPID'] = OWM_API_KEY;

            $http.get(API_URL + method, {
                params: params
            }).then(
                function success(response) {
                    defer.resolve(response.data);
                },
                function failure(reason) {
                    defer.reject();
                    alert(reason.message);
                }
            );

            return defer.promise;
        }

        function equalDates(date1, date2) {
            return (date1 && date2) && (date1.getDay() === date2.getDay()
                && date1.getMonth() === date2.getMonth()
                && date1.getFullYear() === date2.getFullYear());
        }

        function dayDateIdx(arr, date) {
            for (var i = 0; i < arr.length; i++) {
                if (equalDates(arr[i].date, date)) {
                    return i;
                }
            }

            return -1;
        }

        function getIconUrl(id) {
            return "http://openweathermap.org/img/w/" + id + ".png"
        }

        return {
            getForecast: function (params) {
                if (!angular.equals(params, lastParams)) {
                    forecastPromise = makeCall(params, 'forecast');
                }

                return forecastPromise;
            },

            createInfoWindowString: function createInfoWindowString(city, weather) {
                return '<div class="info-window"><div class="title">Weather for: ' + city.name + '</div>' +
                    '<div class="address-line">Temp: ' + weather.main.temp + ' &#8457;</div>' +
                    '<div class="address-line">Pressure: ' + weather.main.pressure + ' hPa</div>' +
                    '<div class="address-line"><b>' + weather.weather[0].main + '</b></div></div>';
            },

            parseForecast: function (list) {
                var days = [];
                var date, idx;

                for (var i = 0; i < list.length; i++) {
                    list[i].date = new Date(list[i].dt_txt);
                    idx = dayDateIdx(days, list[i].date);

                    list[i].iconUrl = getIconUrl(list[i].weather[0].icon);

                    if (idx === -1) {
                        days.push({
                            date: list[i].date,
                            hours: [list[i]]
                        })
                    }
                    else {
                        days[idx].hours.push(list[i]);
                    }
                }

                return days;
            }
        }
    }
})();
//# sourceMappingURL=weatherForecast.js.map
