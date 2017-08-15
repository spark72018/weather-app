'use strict';

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

// https://coolors.co/130303-d72638-b2ffa9-ff4a1c-3f88c5
(function () {
    var getCoordsViaPromise = function getCoordsViaPromise() {
        // returns Promise resolved with coords
        return new Promise(function (resolve, reject) {
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(function (pos) {
                    resolve(pos);
                });
            } else {
                // no geolocation in browser, use third party geolocation api
                fetch("https://freegeoip.net/json/?callback=fetchCallback").then(function (val) {
                    if (val.ok) {
                        return val.text();
                    }
                }).then(function (data) {
                    var regexObj = /\(([^)]+)\)/;
                    resolve(JSON.parse(data.match(regexObj)[1]));
                });
            }
        });
    };

    var getWeatherViaPromise = function getWeatherViaPromise(obj) {
        return function (feature) {
            // feature can be 'conditions' or 'forecast'
            return new Promise(function (resolve, reject) {
                var lat = obj.lat,
                    lng = obj.lng;

                var format = '.json';
                var url = 'https://api.wunderground.com/api/470787643e4b900e/' + feature + '/q/' + lat + ',' + lng + format;
                fetch(url).then(function (res) {
                    return resolve(res.json());
                });
            });
        };
    };

    var coords = getCoordsViaPromise();
    coords.then(function (response) {
        var latitude, longitude;
        if (response.coords) {
            latitude = response.coords.latitude;
            longitude = response.coords.longitude;
        } else {
            latitude = response.latitude;
            longitude = response.longitude;
        }
        var weatherReqObj = {
            lat: latitude,
            lng: longitude
        };
        return weatherReqObj;
    }).then(function (reqObj) {
        var forecast = getWeatherViaPromise(reqObj)('forecast');
        var currentConditions = getWeatherViaPromise(reqObj)('conditions');
        return Promise.all([currentConditions, forecast]); // wait for current weather and forecast Promises to resolve
    }).then(function (weatherResponses) {
        var _weatherResponses$0$c = weatherResponses[0].current_observation,
            UV = _weatherResponses$0$c.UV,
            temp_f = _weatherResponses$0$c.temp_f,
            feelslike_f = _weatherResponses$0$c.feelslike_f,
            relative_humidity = _weatherResponses$0$c.relative_humidity,
            visibility_mi = _weatherResponses$0$c.visibility_mi,
            observation_time = _weatherResponses$0$c.observation_time,
            pressure_in = _weatherResponses$0$c.pressure_in,
            pressure_trend = _weatherResponses$0$c.pressure_trend,
            display_location = _weatherResponses$0$c.display_location,
            weather = _weatherResponses$0$c.weather,
            wind_mph = _weatherResponses$0$c.wind_mph,
            wind_dir = _weatherResponses$0$c.wind_dir,
            wind_string = _weatherResponses$0$c.wind_string;


        var conveyorBelt = function conveyorBelt() {
            for (var _len = arguments.length, fns = Array(_len), _key = 0; _key < _len; _key++) {
                fns[_key] = arguments[_key];
            }

            return function (val) {
                return fns.reduce(function (acc, fn) {
                    return fn(acc);
                }, val);
            };
        };
        var setAttrs = function setAttrs(obj) {
            return function (element) {
                var keys = Object.keys(obj);
                keys.forEach(function (key) {
                    return element.setAttribute(key, obj[key]);
                });
                return element;
            };
        };
        var append = function append(elementToAppend) {
            return function (appendee) {
                appendee.appendChild(elementToAppend);
                return appendee;
            };
        };
        var make = function make(str) {
            return document.createElement(str);
        };
        var populateAndReturnContainer = function populateAndReturnContainer(arr) {
            return function (container) {
                arr.forEach(function (el) {
                    return append(el)(container);
                });
                return container;
            };
        };
        var makeTextNodeAndAppendToHeaderTag = function makeTextNodeAndAppendToHeaderTag(str) {
            return function (element) {
                return append(document.createTextNode(str))(element);
            };
        };

        var mainContainer = document.getElementsByClassName('mainContainer')[0];

        var currentWeatherContainer = setAttrs({ 'class': 'currentWeatherContainer' })(make('div'));

        var locationHeader = makeTextNodeAndAppendToHeaderTag(display_location.full)(make('h1'));
        var updatedHeader = makeTextNodeAndAppendToHeaderTag(observation_time)(make('h4'));
        var tempHeader = makeTextNodeAndAppendToHeaderTag(temp_f + '\xB0' + 'F')(make('h2'));
        var conditionsHeader = makeTextNodeAndAppendToHeaderTag(weather)(make('h3'));
        var feelsLikeHeader = makeTextNodeAndAppendToHeaderTag('feels like: ' + feelslike_f + '\xB0' + 'F')(make('h3'));
        var uvHeader = makeTextNodeAndAppendToHeaderTag('UV: ' + UV)(make('h3'));

        var windHeader = makeTextNodeAndAppendToHeaderTag('Wind: ' + wind_mph + ' ' + wind_dir)(make('h3'));
        var windCondition = makeTextNodeAndAppendToHeaderTag(wind_string)(make('h4'));
        var windBox = populateAndReturnContainer([windHeader, windCondition])(make('div'));
        var windBoxWithAttr = setAttrs({ 'class': 'windBox' })(windBox);
        var pressureHeader = makeTextNodeAndAppendToHeaderTag('Pressure: ' + (pressure_trend === '0' ? '' : pressure_trend) + pressure_in + ' in.')(make('h3'));

        var stuffToAppend = [locationHeader, updatedHeader, tempHeader, conditionsHeader, feelsLikeHeader, uvHeader, windBox, pressureHeader];
        var populatedCurrentWeatherContainer = populateAndReturnContainer(stuffToAppend)(currentWeatherContainer);
        var showCurrentWeather = function showCurrentWeather() {
            return append(populatedCurrentWeatherContainer)(mainContainer);
        };
        showCurrentWeather();

        var setForecastContainerAttr = setAttrs({ 'class': 'forecastContainer' });
        var setDividerAttr = setAttrs({ 'class': 'vertical-divide' });
        var setTempAttr = setAttrs({ 'class': 'tempContainer' });
        var makeAndSetDivider = function makeAndSetDivider() {
            return setDividerAttr(make('div'));
        };
        var makeAndSetTempContainer = function makeAndSetTempContainer() {
            return setTempAttr(make('div'));
        };
        var appendDividerToForecastContainer = function appendDividerToForecastContainer(container) {
            return append(makeAndSetDivider())(container);
        };

        // conveyorBelt function returns curried function waiting for initial value argument for reduce function
        var setupForecastContainer = conveyorBelt(setForecastContainerAttr, appendDividerToForecastContainer);

        var _weatherResponses$1$f = _toArray(weatherResponses[1].forecast.simpleforecast.forecastday),
            head = _weatherResponses$1$f[0],
            tail = _weatherResponses$1$f.slice(1);

        var fourDayForecastArray = tail;
        var functionsToExecute = [];

        fourDayForecastArray.forEach(function (el, idx) {
            var avehumidity = el.avehumidity,
                avewind = el.avewind,
                date = el.date,
                conditions = el.conditions,
                high = el.high,
                low = el.low,
                qpf_allday = el.qpf_allday;


            var dateHeader = makeTextNodeAndAppendToHeaderTag(date.monthname_short + ' ' + date.day)(make('h1'));
            var highTempHeader = makeTextNodeAndAppendToHeaderTag('Hi: ' + high.fahrenheit + '\xB0' + 'F')(make('h2'));
            var lowTempHeader = makeTextNodeAndAppendToHeaderTag('Lo: ' + low.fahrenheit + '\xB0' + 'F')(make('h2'));
            var tempBox = populateAndReturnContainer([highTempHeader, lowTempHeader])(make('div'));
            setAttrs({ 'class': 'tempBox' })(tempBox);

            var windHeader = makeTextNodeAndAppendToHeaderTag('Wind: ')(make('h3'));
            var windHeaderInfo = makeTextNodeAndAppendToHeaderTag(avewind.mph + ' mph')(make('h3'));
            var windBox = populateAndReturnContainer([windHeader, windHeaderInfo])(make('div'));
            setAttrs({ 'class': 'windBox' })(windBox);

            var humidityHeader = makeTextNodeAndAppendToHeaderTag('Avg Humidity: ')(make('h3'));
            var humidityInfo = makeTextNodeAndAppendToHeaderTag(avehumidity + '%')(make('h3'));
            var humidityBox = populateAndReturnContainer([humidityHeader, humidityInfo])(make('h3'));
            setAttrs({ 'class': 'humidityBox' })(humidityBox);

            var precipitationHeader = makeTextNodeAndAppendToHeaderTag('Precip: ')(make('h3'));
            var precipitationInfo = makeTextNodeAndAppendToHeaderTag(qpf_allday.in + ' in.')(make('h3'));
            var precipBox = populateAndReturnContainer([precipitationHeader, precipitationInfo])(make('div'));
            setAttrs({ 'class': 'precipBox' })(precipBox);

            var contentToAppendArr = [dateHeader, tempBox, windBox, humidityBox, precipBox];
            var populatedForecastContainer = populateAndReturnContainer(contentToAppendArr)(setupForecastContainer(make('div')));
            var execute = function execute() {
                return append(populatedForecastContainer)(mainContainer);
            };
            var slideIn = function slideIn() {
                return setTimeout(execute, 60 * (idx + 1));
            };
            functionsToExecute.push(slideIn);
        });
        var execute = function execute() {
            return functionsToExecute.forEach(function (fn) {
                return fn();
            });
        };
        setTimeout(execute, 800);
    });
})();