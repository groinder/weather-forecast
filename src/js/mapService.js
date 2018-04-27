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