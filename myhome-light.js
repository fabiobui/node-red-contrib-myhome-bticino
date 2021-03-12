module.exports = function(RED) {
  let mhutils = require('./myhome-utils')
  
  function MyHomeLightNode(config) {
    RED.nodes.createNode(this,config)
    var node = this,
        state = {}
        gateway = RED.nodes.getNode(config.gateway)

    gateway.on('OWN', function(packet) {
      var payload = {}

      // check if message is a status update
      if(new RegExp('\\*1\\*(\\d+)\\*(' + config.lightid + '|0)##').test(packet) || // simple light status
         new RegExp('\\*#1\\*' + config.lightid + '\\*1\\*(\\d+)\\*(\\d+)##').test(packet)) {  // dimmer updates

        if(packet[1] == '#') {
          var m = packet.match('\\*#1\\*' + config.lightid + '\\*1\\*(\\d+)\\*4##'),
              what = parseInt(m[1])

          payload.state = 'ON'
          payload.brightness = (what - 100)
        } else {
          var m = packet.match('\\*1\\*(\\d+)\\*(' + config.lightid + '|0)##'),
              what = parseInt(m[1])

          if((what == 0) || (what == 1)) {
            payload.state = (what == "1") ? 'ON' : 'OFF'
          } else {
            payload.state = 'ON'
            payload.brightness = (what * 10)
          }
        }
        if (m === null) {
          node.error('failed parsing OWN packet: ' + packet)
          return
        }

        payload.state == 'ON' ? node.status({fill: 'yellow', shape: 'dot', text: 'On'}) : node.status({fill: 'grey', shape: 'dot', text: 'Off'})
        if(payload.brightness)
          payload.state == 'ON' ? node.status({fill: 'yellow', shape: 'dot', text: 'On (' + payload.brightness +'%)'}) : node.status({fill: 'grey', shape: 'dot', text: 'Off'})
        msg2={payload : {On:false}, topic: 'state/' + config.topic}
        if (payload=='ON') msg2.payload.On = true  
        node.send([{payload: payload, topic: 'state/' + config.topic},msg2])
        return
      }
    })


    node.on('input', function(msg) {
      // check if message is boolean indicating desired state of light
      if (typeof(msg) === 'string')
        msg = JSON.parse(msg)
      if (typeof(msg.payload) === 'string')
        msg.payload = JSON.parse(msg.payload)
  
      var payload = msg.payload
  
      if (msg.topic === 'cmd/' + config.topic) {
        var cmd_what = "";
        if (payload.state) {
          if (payload.state == 'OFF') {
            // turning OFF is the same for all lights (dimmed or not)
            cmd_what = "0";
          } else if (payload.state == 'ON') {
            if(payload.brightness) {
              // Brightness is provided in %, convert it to WHAT command (from min 2 (20%) to max 10 (100%))
              var requested_brightness = Math.round(parseInt(payload.brightness)/10);
              if (requested_brightness < 2) {
                requested_brightness = 2
              } else if (requested_brightness > 10) {
                requested_brightness = 10
              }
              cmd_what = requested_brightness.toString();
            } else {
              // No brightness provided : is a simple 'ON' call
              cmd_what = "1";
            }
              
          }
        }
            
        if (cmd_what) {
          var command = '*1*' + cmd_what + '*' + config.lightid + '##'
          var handshake = false
          if(gateway.pass !== null && gateway.pass !== '') {
            handshake = true
          }
          mhutils.execute_command(handshake, command, gateway,
          function(data) {
            // updating node state
            if (requested_brightness) {
              node.send({payload: {'state': payload.state, 'brightness': requested_brightness}, topic: 'state/' + config.topic})
            } else {
              node.send({payload: {'state': payload.state}, topic: 'state/' + config.topic})                
            }
          }, function(data) {
            node.error('command failed' + command)
            node.status({fill: 'red', shape: 'dot', text: 'command failed: ' + command})
          })
        }
        return
      }
    })
  }
  RED.nodes.registerType("myhome-light", MyHomeLightNode);
}
