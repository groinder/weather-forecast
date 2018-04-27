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