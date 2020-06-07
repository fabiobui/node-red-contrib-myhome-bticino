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
        if(payload.state) {
          var command = '*1*' + (payload.state == 'ON' ? 1 : 0) + '*' + config.lightid + '##'
          mhutils.execute_command(true, command, RED.nodes.getNode(config.gateway),
          function(data) {
            // updating node state
            // payload.state == 'ON' ? node.status({fill: 'yellow', shape: 'dot', text: 'On'}) : node.status({fill: 'grey', shape: 'dot', text: 'Off'})
            node.send({payload: {'state': payload.state}, topic: 'state/' + config.topic})
          }, function(data) {
            node.error('command failed' + command)
            node.status({fill: 'red', shape: 'dot', text: 'command failed: ' + command})
          })
        }

        if(payload.brightness) {
          var requested_brightness = parseInt(payload.brightness),
              command = '*#1*' + config.lightid + '*#1*' + (requested_brightness+100) + '*255##'

          mhutils.execute_command(command, RED.nodes.getNode(config.gateway),
          function(data) {
            node.send({payload: {'state': payload.state, 'brightness': requested_brightness}, topic: 'state/' + config.topic})
            // node.status({fill: 'yellow', shape: 'dot', text: 'On (' + requested_brightness + '%)'})
          }, function() {
            node.error('command failed: ' + command)
            node.status({fill: 'red', shape: 'dot', text: 'command failed: ' + command})
          })
        }
        return
      }
    })
  }
  RED.nodes.registerType("myhome-light", MyHomeLightNode);
}
