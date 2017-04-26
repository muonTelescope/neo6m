# NEO6M GPS Library
Communicates and parses GPS strings from a NEO-6M module connected via I2C.

### Use
For example, to use it on your project instantiate the library, and call the data function. As it accesses hardware features, you need sudo to run it. The constructor requires the I2C address of the slave. Include it in your `package.json` dependency tree with
```javascript
"dependencies": {
  "neo6m": "muonTelescope/neo6m"
}
```
And run `npm install`, or just install and save the dependency with
```
npm install --save muonTelescope/neo6m
```
Include the module in your file.
```javascript
var NEO6m = require("neo6m");
```
#### Call
After importing the module a new object is created.
```javascript
var gps = new NEO6m();
```
Then to get the data object, calling 
```javascript
gps.data();
```
Returns a formatted response.
#### Response
The response is a javascript object 
```javascript
{ time: 2016-11-14T07:20:12.000Z,
  latitude: 33.7535,
  longitude: -84.38733333333333,
  altitude: 322.9,
  speedKph: 0.424,
  trueCourse: 'N/A',
  PDOP: 12.12,
  HDOP: 4.79,
  VDOP: 11.13,
  vaild: true }
```
##### Raw NEMA String
Here is a raw NEMA string for a location in Atlanta, GA. When getting a gps Lock is difficult or for development it is essential to have.
```text
$GPRMC,022012.00,A,3345.21805,N,08423.24701,W,0.229,,141016,,,A*69
$GPVTG,,T,,M,0.229,N,0.424,K,A*28
$GPGGA,022012.00,3345.21805,N,08423.24701,W,1,04,4.79,322.9,M,-31.2,M,,*66
$GPGSA,A,3,14,25,32,31,,,,,,,,,12.12,4.79,11.13*0B
$GPGSV,3,1,12,01,21,288,,03,08,319,,10,40,151,,11,06,268,*72
$GPGSV,3,2,12,12,11,038,,14,62,353,19,18,09,145,,22,26,313,*7A
$GPGSV,3,3,12,25,39,066,18,26,22,179,,31,73,270,27,32,55,056,25*76
$GPGLL,3345.21805,N,08423.24701,W,022012.00,A,A*7A
```