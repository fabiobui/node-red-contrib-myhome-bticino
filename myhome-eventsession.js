module.exports = function(RED) {
  let net = require('net')

  const ACK  = '*#*1##'
  const NACK = '*#*0##'
  const START_MONITOR = '*99*1##'

  function MyHomeEventSessionNode(config) {
    RED.nodes.createNode(this, config)
    var node = this

    gateway = RED.nodes.getNode(config.gateway)
    gateway.on('OWN', function(packet) {
          node.send({payload: packet})
        })
  }
  RED.nodes.registerType("myhome-eventsession", MyHomeEventSessionNode);
}
