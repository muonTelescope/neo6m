//This is a I2C library for the NEO-6m GPS module by u-Blox

var I2C = require('raspi-i2c').I2C;

module.exports = class NEO6m {
    constructor() {
        //The NEO 6m has a slave addres that can not be changed.
        this.SLAVE_ADDR = 0x42;
    }

    data() {
        var data = {};
        var tempData = this.rawParse(this.readBuffer(this.bytesAvailible()));
        if (Object.keys(tempData).length === 0) {
            return null;
        }
        data.time = tempData.GPRMC.time;
        data.latitude = tempData.GPRMC.latitude;
        data.longitude = tempData.GPRMC.longitude;
        data.altitude = tempData.GPGGA.mslAltitude;
        data.speedKph = tempData.GPVTG.speedKph;
        data.trueCourse = tempData.GPVTG.trueCourse;
        data.PDOP = tempData.GPGSA.PDOP;
        data.HDOP = tempData.GPGSA.HDOP;
        data.VDOP = tempData.GPGSA.VDOP;
        data.vaild = tempData.GPRMC.valid;
        return data;
    }

    rawParse(rawString) {
        var gpsData = {};
        var nemaStrings = rawString.split(/\r\n|\r|\n/g);
        for (var line in nemaStrings) {
            nemaStrings[line] = nemaStrings[line].trim();
            //validate checksum
            var checksum = 0;
            for (var i = 0; i < nemaStrings[line].substring(1, (nemaStrings[line].length - 3)).length; i++) {
                checksum = checksum ^ nemaStrings[line].substring(1, (nemaStrings[line].length - 3)).charCodeAt(i);
            }
            //If the checksum is correct, continue
            if (parseInt(nemaStrings[line].substring((nemaStrings[line].length - 2)), 16) == checksum) {
                nemaStrings[line] = nemaStrings[line].replace("*", ",").split(",");
                switch (nemaStrings[line][0]) {
                    case "$GPRMC":
                        gpsData.GPRMC = this.handleGPRMC(nemaStrings[line]);
                        break;
                    case "$GPVTG":
                        gpsData.GPVTG = this.handleGPVTG(nemaStrings[line]);
                        break;
                    case "$GPGGA":
                        gpsData.GPGGA = this.handleGPGGA(nemaStrings[line]);
                        break;
                    case "$GPGSA":
                        gpsData.GPGSA = this.handleGPGSA(nemaStrings[line]);
                        break;
                    default:
                    //skip
                }
            }
        }
        return gpsData;
    }

    handleGPRMC(gprmcArray) {
        var GPRMC = {};

        GPRMC.time = new Date(
            2000 + Number(gprmcArray[9].substring(4, 6)),//year
            Number(gprmcArray[9].substring(2, 4)),//month
            Number(gprmcArray[9].substring(0, 2)),//day
            Number(gprmcArray[1].substring(0, 2)),//hours
            Number(gprmcArray[1].substring(2, 4)),//min
            Number(gprmcArray[1].substring(4, 6)),//sec
            Number(gprmcArray[1].substring(7, 10))//millis
        );

        if (gprmcArray[2].trim() == "A") {
            GPRMC.valid = true;
        } else {
            GPRMC.valid = false;
        }

        GPRMC.latitude = Number(gprmcArray[3].substring(0, 2)) + (Number(gprmcArray[3].substring(2, 7)) / 60)
        if (gprmcArray[4].trim() == "N") {
        } else if (gprmcArray[4].trim() == "S") {
            GPRMC.latitude = -GPRMC.latitude;
        } else {
            GPRMC.latitude = null;
            //"Not north or south"
        }

        GPRMC.longitude = Number(gprmcArray[5].substring(0, 3)) + (Number(gprmcArray[5].substring(3, 8)) / 60)
        if (gprmcArray[6].trim() == "E") {
        } else if (gprmcArray[6].trim() == "W") {
            GPRMC.longitude = -GPRMC.longitude;
        } else {
            GPRMC.longitude = null;
            //"Not east or west"
        }

        if (gprmcArray[7] == "") {
            GPRMC.speed = null;
        } else {
            GPRMC.speed = Number(gprmcArray[7]); //speed in knots        
        }

        if (gprmcArray[8] == "") {
            GPRMC.course = null;
        } else {
            GPRMC.course = Number(gprmcArray[8]); //course in degrees
        }

        return GPRMC;
    }

    handleGPVTG(gpvtgArray) {
        var GPVTG = {};

        if (gpvtgArray[1] == "") {
            GPVTG.trueCourse = null;
        } else {
            GPVTG.trueCourse = Number(gpvtgArray[1]);
        }

        if (gpvtgArray[3] == "") {
            GPVTG.magneticCourse = null;
        } else {
            GPVTG.magneticCourse = Number(gpvtgArray[3]);
        }

        if (gpvtgArray[5] == "") {
            GPVTG.speedKnots = null;
        } else {
            GPVTG.speedKnots = Number(gpvtgArray[5]);
        }

        if (gpvtgArray[7] == "") {
            GPVTG.speedKph = null;
        } else {
            GPVTG.speedKph = Number(gpvtgArray[7]);
        }

        return GPVTG;
    }

    handleGPGGA(gpggaArray) {
        var GPGGA = {};
        switch (Number(gpggaArray[6])) {
            case 0:
                GPGGA.fixType = "Not availible or Invalid";
                break;
            case 1:
                GPGGA.fixType = "GPS SPS Mode, Valid";
                break;
            case 2:
                GPGGA.fixType = "Diffrential GPS, SPS Mode, Valid";
                break;
            case 6:
                GPGGA.fixType = "Dead Reckoning, Valid";
                break;
            default:
                GPGGA.fixType = "Not Suppourted";
        }

        if (gpggaArray[7] == "") {
            GPGGA.satellitesUsed = null;
        } else {
            GPGGA.satellitesUsed = Number(gpggaArray[7]);
        }

        //Horizontal Dialution of Precision
        if (gpggaArray[8] == "") {
            GPGGA.HDOP = null;
        } else {
            GPGGA.HDOP = Number(gpggaArray[8]);
        }

        //Altitude
        if (gpggaArray[9] == "") {
            GPGGA.mslAltitude = null;
        } else {
            GPGGA.mslAltitude = Number(gpggaArray[9]);
        }

        //GeoId Seperation
        if (gpggaArray[11] == "") {
            GPGGA.geoIdSeperation = null;
        } else {
            GPGGA.geoIdSeperation = Number(gpggaArray[11]);
        }

        return GPGGA;
    }

    handleGPGSA(gpgsaArray) {
        var GPGSA = {};
        switch (gpgsaArray[1]) {
            case "A":
                GPGSA.mode1 = "Manual—forced to operate in 2D or 3D mode";
                break;
            case "B":
                GPGSA.mode1 = "2D Automatic—allowed to automatically switch 2D/3D";
                break;
        }

        switch (Number(gpgsaArray[2])) {
            case 1:
                GPGSA.mode2 = "Fix not available";
                break;
            case 2:
                GPGSA.mode2 = "2D (<4 SVs used)";
                break;
            case 3:
                GPGSA.mode2 = "3D (>3 SVs used)";
                break;
        }

        GPGSA.satalites = [];
        for (var satNo = 0; satNo < 12; satNo++) {
            GPGSA.satalites.push(Number(gpgsaArray[satNo + 3]));
        }

        GPGSA.PDOP = Number(gpgsaArray[15]);
        GPGSA.HDOP = Number(gpgsaArray[16]);
        GPGSA.VDOP = Number(gpgsaArray[17]);

        return GPGSA;
    }

    bytesAvailible() {
        var i2c = new I2C();
        var bytesAvailible = new ArrayBuffer(2);
        var dataview = new DataView(bytesAvailible);
        var tries = 0;
        var maxTries = 3;
        while (true) {
            try {
                i2c.writeByteSync(this.SLAVE_ADDR, 0XFD);
                break;
            } catch (EIO) {
                tries++;
                if (maxTries <= tries) {
                    throw "Can not write byte";
                }
            }
        }

        dataview.setUint8(0, i2c.readByteSync(this.SLAVE_ADDR));
        dataview.setUint8(1, i2c.readByteSync(this.SLAVE_ADDR));
        return dataview.getUint16(0);
    }

    readBuffer(bytes) {
        var outputString = "";
        var i2c = new I2C();
        i2c.writeByteSync(this.SLAVE_ADDR, 0XFF);
        for (var byteNo = 0; byteNo < bytes; byteNo++) {
            outputString += String.fromCharCode(i2c.readByteSync(this.SLAVE_ADDR));
        }
        return outputString;
    }
}