module.exports = function(RED) {
  let mhutils = require('./myhome-utils')

  function MyHomeCoverNode(config) {
    RED.nodes.createNode(this,config)
    var node = this,
        state = {}
        gateway = RED.nodes.getNode(config.gateway)

    gateway.on('OWN', function(packet) {
      var payload = {}

      // check if message is a status update
      if(new RegExp('^\\*2\\*0\\*(' + config.coverid + '|0)##').test(packet)) {  // stopped
        node.status({fill: 'yellow', shape: 'dot', text: 'STOP'})
        // node.send({payload: "STOP", topic: 'state/' + config.topic})
        return
      }
      if(new RegExp('^\\*2\\*1\\*(' + config.coverid + '|0)##').test(packet)) {  // stopped
        node.status({fill: 'yellow', shape: 'dot', text: 'OPEN'})
        node.send({payload: "open", topic: 'state/' + config.topic})
        return
      }
      if(new RegExp('^\\*2\\*2\\*(' + config.coverid + '|0)##').test(packet)) {  // stopped
        node.status({fill: 'yellow', shape: 'dot', text: 'CLOSE'})
        node.send({payload: "closed", topic: 'state/' + config.topic})
        return
      }
    })


    node.on('input', function(msg) {
      // check if message is boolean indicating desired state of light
      var command = ''

      if (typeof(msg) === 'string')
        msg = JSON.parse(msg)

      if (msg.topic === 'cmd/' + config.topic) {
        if(msg.payload == "OPEN") {
          command = '*2*1*' + config.coverid + '##'
          msg.payload = "open"
        } else if(msg.payload == "CLOSE") {
          command = '*2*2*' + config.coverid + '##'
          msg.payload = "closed"
        } else if(msg.payload == "STOP") {
          command = '*2*0*' + config.coverid + '##'
        }
        var handshake = false
        if(gateway.pass !== null && gateway.pass !== '') {
			handshake = true
		}
        mhutils.execute_command(handshake, command, gateway,
        function(data) {
          // updating node state
          // node.status({fill: 'yellow', shape: 'dot', text: msg.payload})
          if(msg.payload != "STOP")
            node.send({payload: msg.payload, topic: 'state/' + config.topic})
        }, function(data) {
          node.error('command failed' + command)
          node.status({fill: 'red', shape: 'dot', text: 'command failed: ' + command})
        })
        return
      }
    })
  }
  RED.nodes.registerType("myhome-cover", MyHomeCoverNode);
}
