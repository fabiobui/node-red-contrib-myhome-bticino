# node-red-contrib-myhome-bticino

Control Bticino MyHome&#8482; components from NodeRED.

## Intro

node-red-contrib-myhome-bticino is a Node-RED nodes pack to interact with Bticino MyHome&#8482; devices with [OpenWebNet](https://en.wikipedia.org/wiki/OpenWebNet) protocol through a supported gateway (in my case I use unexpensive MH201 Gateway). 
Based on unpublished (into NPM repository, but it's on GitHub) work of Ralph Vigne: [https://github.com/vigne/node-red-bticino-myhome](https://github.com/vigne/node-red-bticino-myhome)

## Nodes that are now working
- **Switches**
	-- ON/OFF
- **Event Session**
	-- Listen for any message on the bus and sends it as payload
- **Command Session**
	-- Send arbitray message provided in payload to bus. E.g. **\*1\*1\*16\#\#** to turn on light **16**

## Nodes under developing (not tested)

- Lights
	-- ON/OFF
  * Dimming (providing a fixed percentage)
- Covers
	-- UP/DOWN/STOP

## Improvement and changes from original sources
- Gateway's password management that is usually set to **12345**
- Two outputs on node 
	 1. default 'payload' output with 'ON' / 'OFF' value
	 2. boolean 'payload.On' output to manage the state in homekit-bridge node 

## Installation & Usage

### Easy Install

If you have Node-RED already installed the recommended install method is to use the editor. To do this, select `Manage Pallette` from the Node-RED menu (top right), and then select `install` tab in the pallette. Search for and install this node (`node-red-contrib-myhome-bticino`).

### Using NPM

If you have not yet installed Node-RED then run following command or go to [Node-RED Installation Guide](https://nodered.org/docs/getting-started/installation).

        npm install -g --unsafe-perm node-red

Next, to install node-red-contrib-myhome-biticino node run the following command in your Node-RED user directory - typically `~/.node-red`

        npm install node-red-contrib-myhome-bticino

### Usage

#### First touch
In order to easy starting to test the nodes copy this flow in Node-RED selecting Import in the menu.

```
[{"id":"ab97f24d.b82ae","type":"inject","z":"e389524d.5c9b","name":"","topic":"cmd/switch","payload":"ON","payloadType":"str","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":180,"y":100,"wires":[["eb9f8904.d99788"]]},{"id":"c26ad40e.e21b48","type":"inject","z":"e389524d.5c9b","name":"","topic":"cmd/switch","payload":"OFF","payloadType":"str","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":180,"y":140,"wires":[["eb9f8904.d99788"]]},{"id":"eb9f8904.d99788","type":"myhome-switch","z":"e389524d.5c9b","switchid":"16","topic":"switch","gateway":"85cc3f4e.d14b8","name":"LightTest","x":400,"y":120,"wires":[["548fd2fb.a0a68c"],[]]},{"id":"548fd2fb.a0a68c","type":"debug","z":"e389524d.5c9b","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","x":630,"y":80,"wires":[]},{"id":"85cc3f4e.d14b8","type":"myhome-gateway","z":"","name":"MH201","host":"192.168.1.44","port":"20000","pass":"12345","timeout":"60"}]
```
After that you have to change the IP address in the Gateway configuration and of course the light number in switch node.

### Usage of Switch Node

... to be continued ...

### Tips

#### How to discover device

 1. Put `Listen Node` connect to a `Debug Node` on your flow
 2. Deploy the project and open `Debug messages window`
 3. Click on the switch that you want to know the number
 4. Watch at debug window to see the right message generated  
 

> Remeber that the message will be as **\*1\*1\*xx\##** if on or **\*1\*0\*xx\##** if off, where **xx** is the number of the switch you are trying to discover

## Bticino Gateway & OpenWebNet

Bicino is using a proprietary protocol (SCS) to comunicate from/to the devices in MyHome network system. There are a many gateways able to convert SCS protocol to OpenWebNet protocol that is well documented (follow this [link](https://developer.legrand.com/documentation/open-web-net-for-myhome/) for more details) and quit easy to use. 
I suggest to buy MH201 Gateway that is for hotel room management and it's cheap. 


## Contact me

[mail to Fabio](mailto:fabio.bui@libero.it?subject=[MyHome])
