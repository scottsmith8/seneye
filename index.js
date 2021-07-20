var HID = require('node-hid');
var mqtt = require('mqtt')

try {
  var client = mqtt.connect('mqtt://localhost')

  // Print devices
  var devices = HID.devices();
  devices.map(d => { console.log(d) })

  // Connect to Seneye
  var device = new HID.HID('/dev/hidraw0');

  // Hello
  device.write(Buffer.from('HELLOSUD'));
  device.write(Buffer.from('READING'));


  device.on("data", function (data) {
    var str = '';
    for (var ii = 0; ii < data.length; ii++) {
      str += data[ii].toString(16) + ' ';
    };

    // Read sensor String
    if (str.startsWith('0 1')) {
      const stateBit = data[6]

      const phVal = Buffer.from([data[10], data[11]]);
      const ph = phVal.readUInt16LE() / 100
      console.log(ph)

      const nh3Val = Buffer.from([data[12], data[13]]);
      const nh3 = nh3Val.readUInt16LE() / 1000
      console.log(nh3)

      const tempVal = Buffer.from([data[14], data[15], data[16], data[17]]);
      const temp = tempVal.readUInt32LE() / 1000
      console.log(temp)

      const inWater = isBitOn(stateBit, 2)
      const noSlide = isBitOn(stateBit, 3)
      const slideExpired = isBitOn(stateBit, 4)
      console.log('In Water:', inWater)
      console.log('No Slide:', noSlide)
      console.log('Slide Expired:', slideExpired)

      client.publish('/seneye', JSON.stringify({

        inWater, noSlide,
        slideExpired, temp, ph, nh3

      }))

      // Close it up
      device.write(Buffer.from('BYESUD'));
    }
  });

  device.on("error", function (err) {
    console.log(err)
  });
} catch (e) {
  console.log(e.message)
}

function toArray(buffer) {
  var view = [];
  for (var i = 0; i < buffer.length; ++i) {
    view.push(buffer[i]);
  }
  return view;
}

function isBitOn(number, index) {
  let binary = number.toString(2);
  return (binary[(binary.length - 1) - index] == "1"); // index backwards
}
