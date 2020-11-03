module.exports = function(RED) {
  let net = require('net')
  let mhutils = require('./myhome-utils')

  const ACK  = '*#*1##'
  const NACK = '*#*0##'
  const START_MONITOR = '*99*1##'


  function MyHomeGatewayNode(config) {
    RED.nodes.createNode(this, config);

    var node = this,
        state = 'disconnected'

    node.client = undefined
    node.host = config.host
    node.port = config.port
    node.pass = config.pass
    node.timeout = parseInt(config.timeout) || 30
    node.time
    node.setMaxListeners(100)

    node.status({fill: "red", shape: "dot", text: state})

    node.client = new net.Socket()

      node.client.on('error', function() {
        node.error("Gateway socket error")
        state = 'disconnected'
        //  propably the reason for the timeout issue?
        if(node.client !== undefined)
          node.client.destroy()
        instanciateClient()
      })

      node.client.on('data', function(data) {
        if(data === undefined) return
        parsePacket(data)
      })

      node.client.on('close', function() {
        node.error('IP connection closed')
        close()
        instanciateClient()
      })


    function instanciateClient() {
      node.log("instanciate client")
      
      if (node.client === undefined)
          node.client = new net.Socket()

      node.client.connect(node.port, node.host, function() {
        node.status({fill:"yellow",shape:"ring",text:"connecting"})
        // request monitoring session
        node.log('start monitoring')
        node.client.write(START_MONITOR)
        node.log('started monitoring')
      })
    }
    
    
    function parsePacket(data) {
      var sdata = data.toString()
      node.log('sdata is '+sdata)

      while (sdata.length > 0) {
        var m = sdata.match(/(\*.+?##)(.*)/)
        packet = m[1]
        sdata = m[2]


        if (state !== 'monitoring') {
          if(packet === ACK) {
            switch(state) {
              case 'disconnected':
                var mm = m[2].match(/\*\#(.*)\#\#/)
                if (mm==undefined) break
                state = 'logged-in'
				//node.log('mm '+mm[1])
				if(node.pass !== null && node.pass !== '') {
			      var res = '*#' + mhutils.calcPass(node.pass, mm[1].toString()) + '##'
				//node.log('passw '+res)
				  node.client.write(res)
                }
                node.status({fill:"yellow",shape:"ring",text:"logged-in"})
                sdata = ''
                break
              case 'logged-in':
                state = 'monitoring'
                node.log('connected to gateway: ' + node.host)
                node.status({fill:"green",shape:"dot",text:"connected"})
                // it was '*#1*0##' but it's too heavy
                mhutils.execute_command(true, '*99*1##', node,
                        function(data) {
                          node.log('Updated states')
                        }, function(data) {
                          node.error('failed requesting time. connection seems broken. Reconnecting to gateway.' )
                          close()
                          instanciateClient()
                        })
                break
              default:
                node.log('unknown state: ' + state)
            }
            node.log("new state:" + state)
          } else {
            node.log('command was not acknowledged: ' + packet)
          }
        } else {
          node.emit('OWN', packet)
        }
      }
    }    


    function close() {
      state = 'disconnected'
      node.log('disconnected from gateway')
      node.status({fill:"red",shape:"dot",text:"disconnected"});
      if(node.client !== undefined)
        node.client.destroy()
    }

    function check_connection() {
      node.log("checking connection")      
      node.client.write(START_MONITOR)    
    }
    

    instanciateClient()
    setInterval(check_connection, (node.timeout)*1000);
  }

  RED.nodes.registerType("myhome-gateway", MyHomeGatewayNode);
}
