/**
 * This script Give an HowTo update the start/end time on an action based on Shelly location.
 *    You need to be sure the Latitude, Longitude and TimeZone of the device 
 *    are setup accordingly your need.
 *
 * The script will call the sunrise-sunset.org API, populate needed KVS values
 * Then modify the Start/End time of an action located on the same device.       
 * This script didn't use a timer, but a Cron Job to run à 3AM every day 
 *    see at the end of the script to create the Cron Job.
 * 
 * This script will modify the Start/End time of an action running only at night.
 *    you can adapt this script at your convinience 
 *    please report correction or enhancements on GitHub
 *     - https://github.com/HA-Rou/ShellyScripting
 */

////////////////////////////////////////////////////////////////////////////////////////////
// Configuration
////////////////////////////////////////////////////////////////////////////////////////////
// if no console log needed set log to '0'
let log = 1;                
// Sunrise-Sunset API see https://sunrise-sunset.org/api#documetation
let urlSunsetrise = "https://api.sunrise-sunset.org/json?formatted=0";
// Replace id with your action id 
let urlWebhook = 'http://localhost/rpc/Webhook.Update?id=1&name="WebhookPortalLightOn"&active_between=';
// get the device location & construct the API parameter
let deviceLocation = Shelly.getComponentConfig("sys").location;
let apiParameter = "&lat=" + deviceLocation.lat + "&lng=" + deviceLocation.lon + "&tzid=" + deviceLocation.tz;


////////////////////////////////////////////////////////////////////////////////////////////
// process the Http response
////////////////////////////////////////////////////////////////////////////////////////////
function processHttpResponse(result, error_code, error) {
  if (error_code != 0) {
    // process error
    if (log !== 0) print('Shelly Call error');
  } else {
    // process result
    if (log !== 0) print('Shelly Call result', JSON.stringify(result));
    //print('value', JSON.parse(result.body).results.value);
  }
}  //  function processHttpResponse

////////////////////////////////////////////////////////////////////////////////////////////
//  process the sunSet/Rise API response and store in KVS the values 
////////////////////////////////////////////////////////////////////////////////////////////
function processTwilightResponse(result, error_code, error) {
  if (error_code != 0) {
    // process error
    print('No connection');
  } else {
    // process result
    //setKVS('dawn', JSON.parse(result.body).results.civil_twilight_begin.substring(11, 16));
    //setKVS('sunrise', JSON.parse(result.body).results.sunrise.substring(11, 16));
    //setKVS('solarNoon', JSON.parse(result.body).solar_noon.substring(11, 16));
    //setKVS('sunset', JSON.parse(result.body).results.sunset.substring(11, 16));
    //setKVS('dusk', JSON.parse(result.body).results.civil_twilight_end.substring(11, 16));
    let openPortalLightOn = '"' + JSON.parse(result.body).results.sunset.substring(11, 16)
             + '","' + JSON.parse(result.body).results.sunrise.substring(11, 16)
             + '"';
    setKVS('OpenPortalLightOn', openPortalLightOn);
    
    // Change webhook Start/End time
    updateNightTime(openPortalLightOn);
    
    // end the Job and Die
    if (log !== 0) print("End Job");
    die("stop");
    
    
  }
} // function processTwilightResponse

////////////////////////////////////////////////////////////////////////////////////////////
// Set the KVS value 
////////////////////////////////////////////////////////////////////////////////////////////
function setKVS(key, setValue) {
    Shelly.call(
        'KVS.Set', {
            'key': key,
            'value': setValue
        },
        function(result) {
            if (log !== 0) print('KVS ', key, ' saved value: ', setValue, ' rev: ', result.rev);
        }
    );
};  // function setKVS

////////////////////////////////////////////////////////////////////////////////////////////
//  Update the Night Start/Ebd time of the Shelly action
////////////////////////////////////////////////////////////////////////////////////////////
function updateNightTime(range) {
  if (log !== 0) print('updateNightTime from/to ' + range);
  // Construct the RPC command
  let uwh = urlWebhook + '[' + range  + ']';
  if (log !== 0) console.log("url:",uwh)

  // Invoke the RPC command   
  Shelly.call('HTTP.GET', {url: uwh}, processHttpResponse );   
}  //  function updateNightTime


////////////////////////////////////////////////////////////////////////////////////////////
// Start the Script
////////////////////////////////////////////////////////////////////////////////////////////
if (log !== 0) print('Log ON')
if (log !== 0) print("Start Script.id:", Shelly.getCurrentScriptId(), "uptime:",Shelly.getUptimeMs());

// Call the Sunrise-Sunset API with the device location as parameter 
Shelly.call("HTTP.GET", {url: urlSunsetrise + apiParameter, timeout: 3}, processTwilightResponse);

// If needed Get OpenPortalLightOn KVS value
//Shelly.call('KVS.Get', {'key': 'OpenPortalLightOn'}, processHttpResponse);

// End of the Script

////////////////////////////////////////////////////////////////////////////////////////////
//  Cron setup
////////////////////////////////////////////////////////////////////////////////////////////
//
//
//
//Cron Time Format, "* * * * * *" --> 1.*=second 2.*=minute 3.*=hour 4.*=day_Of_month 5.*=month 6.*=day_of_week
//Cron Time Format, * = all, 1-4 --> from 1 to 4, /15 --> every 15, SUN-SAT support for day_of_week, JAN-DEC support for month
//Cron Time Format Examples:
// "*/15 * 1-4 * * *" --> Run every 15 seconds from 1 to 4 hours;
// "0 */2 1-4 * * *" --> Run every two minutes from 1 to 4 hours;
// "0 0 7 * * MON-FRI" --> Run at 7:00 every working day;
// "0 30 23 30 * *" --> Run at 23:30 every 30th day of month.

/*
Shelly.call('Schedule.Create', {enable: true, timespec: "0 0 3 * * *", calls: 
[
  {method:"Script.Start", params:{id:5}}, 
]});
*/
////////////////////////////////////////////////////////////////////////////////////////////
