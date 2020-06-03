module.exports = function(RED) {
  let net = require('net')
  let mhutils = require('./myhome-utils')

  function MyHomeCommandSessionNode(config) {
    RED.nodes.createNode(this,config)
    var node = this,
        state = {}
        gateway = RED.nodes.getNode(config.gateway)

    gateway.on('OWN', function(payload) {
       node.send({payload: payload, topic: 'state/' + config.topic})      
    })


    //node.status({fill: "red", shape: "dot", text: state})        

    node.on('input', function(msg) {
	  var command = msg.payload	
		
      mhutils.execute_command(true, command, RED.nodes.getNode(config.gateway),
        function(data) {
          // updating node state
          node.send({payload: command, topic: 'state/' + config.topic})
          node.status({fill: 'green', shape: 'dot', text: 'command executed: ' + command})
        }, function(data) {
          node.error('command failed' + msg.payload)
          node.status({fill: 'red', shape: 'dot', text: 'command failed: ' + command})
        })
      
      
    })
  }
  RED.nodes.registerType("myhome-commandsession", MyHomeCommandSessionNode);
}
