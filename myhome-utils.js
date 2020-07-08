var exports = module.exports = {}


exports.execute_command = function(handshake, command, config, success, error) {
  let net = require('net');

  const ACK  = '*#*1##'
  const NACK = '*#*0##'
  const START_COMMAND = '*99*0##'

  var client = new net.Socket(),
      state = 'disconnected'

  client.on('error', function() {
    console.error("Command socket error")
    state = 'disconnected'
    client.destroy();
    error(command);
  })

  client.connect(config.port, config.host, function() {
    // opening command session
  })

  client.on('data', function(data) {
    var sdata = data.toString()

    if(sdata === NACK) {
      // calling callback
      error(sdata, command)
    } else {
      if(state == 'disconnected') {
        if (handshake)
          state = 'handshake'
        else 
          state = 'logged-in'    
        client.write(START_COMMAND)
        return
      }
      if(state == 'handshake') {		  
        var mm = sdata.match(/\*\#(.*)\#\#/)
		var res = '*#' + calcPass(config.pass, mm[1].toString()) + '##'
		client.write(res)
        state = 'logged-in'
		return
	  } 
      if(state == 'logged-in') {
        state = 'open'
        client.write(command)
        return
      }
      if(state == 'open') {
        state = 'command'
        client.write(command)
        return
      }
      // calling callback
      success(sdata, command)
    }
    client.destroy()
    return
  })

  client.on('close', function() {
    // to verify that no connections are left open
    if(client !== undefined)
        client.destroy()
    return
  })
}


function calcPass (pass, nonce) {
	var flag = true;
	var num1 = 0x0;
	var num2 = 0x0;
	var password = parseInt(pass, 10);
 
	for (var c in nonce) {
		c = nonce[c];
		if (c!='0') {
			if (flag) num2 = password;
			flag = false;
		}
		switch (c) {
			case '1':
				num1 = num2 & 0xFFFFFF80;
				num1 = num1 >>> 7;
				num2 = num2 << 25;
				num1 = num1 + num2;
				break;
			case '2':
				num1 = num2 & 0xFFFFFFF0;
				num1 = num1 >>> 4;
				num2 = num2 << 28;
				num1 = num1 + num2;
				break;
			case '3':
				num1 = num2 & 0xFFFFFFF8;
				num1 = num1 >>> 3;
				num2 = num2 << 29;
				num1 = num1 + num2;
				break;
			case '4':
				num1 = num2 << 1;
				num2 = num2 >>> 31;
				num1 = num1 + num2;
				break;
			case '5':
				num1 = num2 << 5;
				num2 = num2 >>> 27;
				num1 = num1 + num2;
				break;
			case '6':
				num1 = num2 << 12;
				num2 = num2 >>> 20;
				num1 = num1 + num2;
				break;
			case '7':
				num1 = num2 & 0x0000FF00;
				num1 = num1 + (( num2 & 0x000000FF ) << 24 );
				num1 = num1 + (( num2 & 0x00FF0000 ) >>> 16 );
				num2 = ( num2 & 0xFF000000 ) >>> 8;
				num1 = num1 + num2;
				break;
			case '8':
				num1 = num2 & 0x0000FFFF;
				num1 = num1 << 16;
				num1 = num1 + ( num2 >>> 24 );
				num2 = num2 & 0x00FF0000;
				num2 = num2 >>> 8;
				num1 = num1 + num2;
				break;
			case '9':
				num1 = ~num2;
				break;
			case '0':
				num1 = num2;
				break;
		}
		num2 = num1;
	}
	return (num1 >>> 0).toString();
}

exports.calcPass = calcPass;
