(function() {

/**
 * @function getCoordsViaPromise 
 * @description utilizes Promise to get coords
 * @returns {Promise}
 */
const getCoordsViaPromise = () => { // returns Promise resolved with coords
     return new Promise((resolve, reject) => {
         if('geolocation' in navigator) {
             navigator.geolocation.getCurrentPosition((pos) => {
                 resolve(pos);
             });
         }else { // no geolocation in browser, use third party geolocation api
             fetch("https://freegeoip.net/json/?callback=fetchCallback")
            .then(val => {
                if(val.ok) {
                    return val.text();
                }
            }) 
            .then((data) => {
                let regexObj = /\(([^)]+)\)/;
                resolve(JSON.parse(data.match(regexObj)[1]));
            });            
         }
     });
}

/**
 * @function getWeatherViaPromise
 * @description ajax request via fetch API to get weather
 * @param {object} - object containing latitude/longitude
 * @param {string} - string to determine whether current conditions or forecast data is retrieved
 * @returns {Promise}
 */

const getWeatherViaPromise = (obj) => (feature) => { // feature can be 'conditions' or 'forecast'
    return new Promise((resolve, reject) => {
        let {lat, lng} = obj;
        let format = '.json';
        let url = 'https://api.wunderground.com/api/470787643e4b900e/' + feature + '/q/'
                    + lat + ',' + lng + format;
        fetch(url)
        .then(res => resolve(res.json()));
    });
}

// get coordinates of user
const coords = getCoordsViaPromise();
coords.then(response => { // make and return object for retrieving weather data
    var latitude, longitude;
    if(response.coords) {
        latitude = response.coords.latitude;
        longitude = response.coords.longitude;
    }else {
        latitude = response.latitude;
        longitude = response.longitude;
    }
    let weatherReqObj = {
        lat: latitude,
        lng: longitude
    };
    return weatherReqObj;
})

.then(reqObj => { // get current conditions and three day forecast
    let forecast =  getWeatherViaPromise(reqObj)('forecast');
    let currentConditions = getWeatherViaPromise(reqObj)('conditions');
    return Promise.all([currentConditions, forecast]); // wait for current weather and forecast Promises to resolve
})

.then(weatherResponses => {
    var { // deconstruct appropriate property values from current observation object
        UV,
        temp_f,
        feelslike_f,
        relative_humidity,
        visibility_mi,
        observation_time,
        pressure_in,
        pressure_trend, // '+' or '-'
        display_location, // object
        weather, 
        wind_mph,
        wind_dir,
        wind_string
    } = weatherResponses[0].current_observation; 
        
    /**
     * @function conveyorBelt
     * @description pipe function
     * @param {functions} - functions that will sequentially act on initial value
     * @param {initialValue} - initial value that will be fed through the conveyor belt
     * @returns {accumulatedValue}
     */       
    const conveyorBelt = (...fns) => (val) => fns.reduce((acc, fn) => fn(acc), val)

    /**
     * @function setAttrs
     * @description sets DOM attributes on input
     * @param {object} - object containing key/value pairs representing attribute/value respectively
     * @param {DOMElement} - DOM element to be modified
     * @returns {DOMElement}
     */           
    const setAttrs = (obj) => (element) => {
        let keys = Object.keys(obj);
        keys.forEach((key) => element.setAttribute(key, obj[key]));
        return element;
    }

    /**
     * @function append
     * @description appends first argument into second argument
     * @param {DOMElement} - DOM element to append
     * @param {DOMElement} - DOM element to receive first argument
     * @returns {DOMElement} - returns the container DOM element
     */           
    const append = (elementToAppend) => (appendee) => {
        appendee.appendChild(elementToAppend);
        return appendee;
    }
    const make = (str) => document.createElement(str);

    /**
     * @function populateAndReturnContainer
     * @description appends first argument into second argument
     * @param {array} - array of DOM elements to append
     * @param {DOMElement} - DOM element array elements will be appended in to
     * @returns {DOMElement} - returns the container DOM element
     */   
    const populateAndReturnContainer = (arr) => (container) => {
        arr.forEach(el => append(el)(container));
        return container;
    }
    
    
    const makeTextNodeAndAppendToHeaderTag = (str) => (element) => append(document.createTextNode(str))(element)

    const mainContainer = document.getElementsByClassName('mainContainer')[0];

    const currentWeatherContainer = setAttrs({'class': 'currentWeatherContainer'})(make('div'))

    const locationHeader = makeTextNodeAndAppendToHeaderTag(display_location.full)(make('h1'))
    const updatedHeader = makeTextNodeAndAppendToHeaderTag(observation_time)(make('h4'))
    const tempHeader = makeTextNodeAndAppendToHeaderTag(temp_f + '\u00b0' + 'F')(make('h2'))
    const conditionsHeader = makeTextNodeAndAppendToHeaderTag(weather)(make('h3'))
    const feelsLikeHeader = makeTextNodeAndAppendToHeaderTag('feels like: ' + feelslike_f + '\u00b0' + 'F')(make('h3'));
    const uvHeader = makeTextNodeAndAppendToHeaderTag('UV: ' + UV)(make('h3'));

    const windHeader = makeTextNodeAndAppendToHeaderTag(`Wind: ${wind_mph} ${wind_dir}`)(make('h3'));
    const windCondition = makeTextNodeAndAppendToHeaderTag(wind_string)(make('h4'));
    const windBox = populateAndReturnContainer([windHeader, windCondition])(make('div'));
    const windBoxWithAttr = setAttrs({'class': 'windBox'})(windBox);
    const pressureHeader = makeTextNodeAndAppendToHeaderTag(`Pressure: ${pressure_trend === '0'
                                                                            ? ''
                                                                            : pressure_trend}${pressure_in} in.`)(make('h3'));

    const stuffToAppend = [
        locationHeader,
        updatedHeader,
        tempHeader,
        conditionsHeader,
        feelsLikeHeader,
        uvHeader,
        windBox,
        pressureHeader
    ];
    const populatedCurrentWeatherContainer = populateAndReturnContainer(stuffToAppend)(currentWeatherContainer);
    const showCurrentWeather = () => append(populatedCurrentWeatherContainer)(mainContainer);
    showCurrentWeather();    

    const setForecastContainerAttr = setAttrs({'class': 'forecastContainer'});
    const setDividerAttr = setAttrs({'class': 'vertical-divide'});
    const setTempAttr = setAttrs({'class': 'tempContainer'});
    const makeAndSetDivider = () => setDividerAttr(make('div'))
    const makeAndSetTempContainer = () => setTempAttr(make('div'))
    const appendDividerToForecastContainer = (container) => append(makeAndSetDivider())(container);

    // conveyorBelt function returns curried function waiting for initial value argument for reduce function
    const setupForecastContainer = conveyorBelt(setForecastContainerAttr, 
                                                appendDividerToForecastContainer);                                                   
    let [head, ...tail] = weatherResponses[1].forecast.simpleforecast.forecastday                                                  
    const fourDayForecastArray = tail;   
    const functionsToExecute = [];

    fourDayForecastArray.forEach((el, idx) => {
        let {
            avehumidity,
            avewind, // object
            date, // object
            conditions,
            high, // object
            low, // object
            qpf_allday, // object            
        } = el;

    const dateHeader = makeTextNodeAndAppendToHeaderTag(date.monthname_short + ' ' + date.day)(make('h1'))
    const highTempHeader = makeTextNodeAndAppendToHeaderTag('Hi: ' + high.fahrenheit + '\u00B0' + 'F')(make('h2'));
    const lowTempHeader = makeTextNodeAndAppendToHeaderTag('Lo: ' + low.fahrenheit + '\u00b0' + 'F')(make('h2'));
    const tempBox = populateAndReturnContainer([highTempHeader, lowTempHeader])(make('div'));
    setAttrs({'class': 'tempBox'})(tempBox);

    const windHeader = makeTextNodeAndAppendToHeaderTag('Wind: ')(make('h3'));
    const windHeaderInfo = makeTextNodeAndAppendToHeaderTag(avewind.mph + ' mph')(make('h3'));
    const windBox = populateAndReturnContainer([windHeader, windHeaderInfo])(make('div'));
    setAttrs({'class': 'windBox'})(windBox);

    const humidityHeader = makeTextNodeAndAppendToHeaderTag('Avg Humidity: ')(make('h3'));
    const humidityInfo = makeTextNodeAndAppendToHeaderTag(avehumidity + '%')(make('h3'));
    const humidityBox = populateAndReturnContainer([humidityHeader, humidityInfo])(make('h3'));
    setAttrs({'class': 'humidityBox'})(humidityBox);

    const precipitationHeader = makeTextNodeAndAppendToHeaderTag('Precip: ')(make('h3'));
    const precipitationInfo = makeTextNodeAndAppendToHeaderTag(qpf_allday.in + ' in.')(make('h3'));
    const precipBox = populateAndReturnContainer([precipitationHeader,
                                                        precipitationInfo])(make('div'));
    setAttrs({'class': 'precipBox'})(precipBox);                                                        

    let contentToAppendArr = [dateHeader, 
                              tempBox,
                              windBox,
                              humidityBox,
                              precipBox];
    const populatedForecastContainer = populateAndReturnContainer(contentToAppendArr)(setupForecastContainer(make('div')))
    const execute = () => append(populatedForecastContainer)(mainContainer)
    const slideIn = () => setTimeout(execute, 60 * (idx+1));    
    functionsToExecute.push(slideIn);
    });
    const execute = () => functionsToExecute.forEach(fn => fn());
    setTimeout(execute, 800);
});
})();

