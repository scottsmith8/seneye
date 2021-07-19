var HID = require('node-hid');
var mqtt = require('mqtt')

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
  //0 1 e6 bc f2 60 - 1 0 0 0 0 0 0 0 cc 5b 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
  //0 1 ff bd f2 60 - 1 0 0 0 0 0 0 0 c6 5c 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 

  // in no slide
  //0 1 71 c0 f2 60 - d 0 0 0 0 0 0 0 d8 59 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
  // out no slide
  //0 1 47 bf f2 60 - 9 0 0 0 0 0 0 0 d8 59 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 

  //water
  //0 1 4b be f2 60 - state 5 - isK 0 - 0 0 e4 2 2 0 c6 5c 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0

  //e4 2
  // 11100100 00000010
  // 228 2 = 230

  // d8 59
  // 1101000 1011001
  // 104 89 = 193

  //0000 0001 - out of water, with slide
  //0000 1001 - out, no slide 
  //0000 0101 - in water, with slide
  //0000 1101 - in no slide
  // let out = ''
  //cats.forEach(c=> out= out+c+',')
  // console.log(cats.slice(112,144))
  //onst cars = BitArray.fromBuffer(data)

  //const c = Buffer.from(data, 'hex')
  //console.log(Buffer.isBuffer(data));
  //console.log(c.toString())
  //  console.log(Buffer.from( data.toString('hex'),'hex'))

  //console.log(new Buffer.from(data).toString());
});

device.on("error", function (err) {
  console.log(err)
});

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
