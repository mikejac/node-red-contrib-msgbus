/**
 * Copyright 2013, 2016 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
    "use strict";
    //var mqtt   = require('mqtt')

    function matchTopic(ts,t) {
        if (ts == "#") {
            return true;
        }
        var re = new RegExp("^"+ts.replace(/([\[\]\?\(\)\\\\$\^\*\.|])/g,"\\$1").replace(/\+/g,"[^/]+").replace(/\/#$/,"(\/.*)?")+"$");
        return re.test(t);
    }

    var ClassType = {
	    ClassTypeInvalid:			0,
	    ClassTypeDevice:			1,
	    ClassTypeController:		2,
	    ClassTypeDeviceSvc:			3,
	    ClassTypeControllerSvc:		4
    };

    var classTypeTxt = {
        classTypeDeviceTxt:			"device",
        classTypeControllerTxt:		"controller",
        classTypeDeviceSvcTxt: 		"device_svc",
        classTypeControllerSvcTxt:	"controller_svc"
    };

	var FabricNodenameAny			= "+"

	var fabricSys       			= "sysctl"
	var fabricCmdStatus 			= "status"

	var fabricTopicAny				= "+"
	var fabricNodenameBroadcast		= "broadcast"

	var fabricServiceIdRpcServer	= "rpc_server"
	var fabricServiceIdRpcClient	= "rpc_client"
	var fabricServiceIdFromHK 		= "from_hk"
	var fabricServiceIdToHK   		= "to_hk"
	var fabricServiceIdAccessories  = "accessories"
	var fabricServiceIdDebug		= "debug"

	var fabricTaskIdService			= "svc"
	var fabricTaskIdDebug			= "dbg"

	var fabricFeedIdDebug			= "debug"
	var fabricFeedIdInfo			= "info"
    var fabricFeedIdString          = "string"
	var fabricFeedIdBool            = "bool"
	var fabricFeedIdFloat           = "float"
	var fabricFeedIdUInt8           = "uint8"
	var fabricFeedIdUInt16          = "uint16"
	var fabricFeedIdUInt32          = "uint32"
	var fabricFeedIdInt32           = "int32"
	var fabricFeedIdUInt64          = "uint64"
	var fabricFeedIdData            = "data"
	var fabricFeedIdTLV8            = "tlv8"

	var MsgbusStatusInvalid         = 0
	var MsgbusStatusOnline          = 1
	var MsgbusStatusOffline         = 2
	var MsgbusStatusDisconnected    = 3

    //
    // topic elements
    //
    var msgbusSelf                  = "msgbus"
    var msgbusVersion               = "v1"

    var msgbusDestBroadcast         = "broadcast"

    //
    // service elements
    //
    var msgbusServiceStatus         = "status"
    var msgbusServiceDebug          = "debug"
    var msgbusServiceOnramp         = "onramp"
    var msgbusServiceOfframp        = "offramp"

    //
    // data id
    //
    var msgbusIdStatus              = "status"
    var msgbusIdDebug               = "debug"

    //
    // data types
    //
	var msgbusTypeStatusCtl		    = "status_ctl"          // controller
	var msgbusTypeStatusDvc		    = "status_dvc"          // device
	var msgbusTypeDebug			    = "debug"
	var msgbusTypeInfo			    = "info"
    var msgbusTypeString            = "string"
	var msgbusTypeBool              = "bool"
	var msgbusTypeFloat             = "float"
	var msgbusTypeUInt8             = "uint8"
	var msgbusTypeUInt16            = "uint16"
	var msgbusTypeUInt32            = "uint32"
	var msgbusTypeInt32             = "int32"
	var msgbusTypeUInt64            = "uint64"
	var msgbusTypeData              = "data"
	var msgbusTypeTLV8              = "tlv8"

    //
    function topicStatusPublish(mqtt) {
	    return  mqtt.domain + "/" +
                msgbusSelf + "/" + msgbusVersion + "/" +
                msgbusDestBroadcast + "/" +                     // destination
                mqtt.nodename + "/" +                           // source
                msgbusServiceStatus + "/" +                     // service
                msgbusIdStatus + "/" +                          // data id
                msgbusTypeStatusCtl                             // data type
    }

    //
    function topicStatusSubscribe(mqtt, source) {
	    return  mqtt.domain + "/" +
                msgbusSelf + "/" + msgbusVersion + "/" +
                msgbusDestBroadcast + "/" +                     // destination
                source + "/" +                                  // source
                msgbusServiceStatus + "/" +                     // service
                msgbusIdStatus + "/" +                          // data id
                "+"                                             // data type
    }

    //
    function topicDebugSubscribe(mqtt, source) {
	    return  mqtt.domain + "/" +
                msgbusSelf + "/" + msgbusVersion + "/" +
                msgbusDestBroadcast + "/" +                     // destination
                source + "/" +                                  // source
                msgbusServiceDebug + "/" +                      // service
                msgbusIdDebug + "/" +                           // data id
                "+"                                             // data type
    }

    //
    function topicValueSubscribe(mqtt, nodename, dataid, datatype) {
	    return  mqtt.domain + "/" +
                msgbusSelf + "/" + msgbusVersion + "/" +
                msgbusDestBroadcast + "/" +                     // destination
                nodename + "/" +                                // source
                msgbusServiceOnramp + "/" +                     // service
                dataid + "/" +                                  // data id
                datatype                                        // data type
    }

    //
    function topicValuePublish(mqtt, nodename, dataid, datatype) {
	    return  mqtt.domain + "/" +
                msgbusSelf + "/" + msgbusVersion + "/" +
                nodename + "/" +                                // destination
                mqtt.nodename + "/" +                           // source
                msgbusServiceOfframp + "/" +                    // service
                dataid + "/" +                                  // data id
                datatype                                        // data type
    }

    //
    function statusMessage(mqtt, status, seconds) {
        var topic = topicStatusPublish(mqtt)

        var d = {
            "d": {
                "_type":       "status",
                "nodename":    mqtt.nodename,
                "platform_id": mqtt.platformId
            }
        }

        switch(mqtt.classType) {
            case ClassType.ClassTypeDevice:
                d["d"]["class"] = classTypeTxt.classTypeDeviceTxt
                break

            case ClassType.ClassTypeController:
                d["d"]["class"] = classTypeTxt.classTypeControllerTxt
                break

            case ClassType.ClassTypeDeviceSvc:
                d["d"]["class"] = classTypeTxt.classTypeDeviceSvcTxt
                break

            case ClassType.ClassTypeControllerSvc:
                d["d"]["class"] = classTypeTxt.classTypeControllerSvcTxt
                break
        }

        switch(status) {
            case MsgbusStatusOnline:
                d["d"]["status"] = "online"
                d["d"]["uptime"] = seconds
                break

            case MsgbusStatusOffline:
                d["d"]["status"] = "offline"
                d["d"]["uptime"] = seconds
                break

            case MsgbusStatusDisconnected:
                d["d"]["status"] = "disconnected"
                d["d"]["uptime"] = null
                break
        }

        var data = {
            topic:  topic,
            msg:    JSON.stringify(d)
        }

        return data
    }

	/******************************************************************************************************************
	 * 
	 *
	 */
    function MQTTMsgBusClientNode(config) {
        //console.log("MQTTMsgBusClientNode(): config = ", config)

        RED.nodes.createNode(this, config)

        this.domain     = "domain"
        this.platformId = "nodered"

        this.classType  = ClassType.ClassTypeControllerSvc
        this.nodename   = config.nodename
        this.broker     = config.broker
        this.brokerConn = RED.nodes.getNode(this.broker)

        var willMsg = statusMessage(this, MsgbusStatusDisconnected, 0)

        this.brokerConn.willTopic = willMsg.topic 
        this.brokerConn.options.will = {
            topic:   this.brokerConn.willTopic,
            payload: willMsg.msg,
            qos:     2,
            retain:  true
        }

        var birthMsg = statusMessage(this, MsgbusStatusOnline, 0)

        this.brokerConn.birthTopic = birthMsg.topic 
        this.brokerConn.birthMessage = {
            topic:   this.brokerConn.birthTopic,
            payload: birthMsg.msg,
            qos:     2,
            retain:  true
        }

        var node = this

        if (this.brokerConn) {
            //console.log("MQTTMsgBusClientNode(): node.brokerConn = ", node.brokerConn)
            node.brokerConn.register(node)
        } else {
            node.log(RED._("msgbus.errors.missing-config"))
        }

        this.on('close', function(done) {
            node.brokerConn.deregister(node, done)
        })
    }

    RED.nodes.registerType("msgbus-client", MQTTMsgBusClientNode)

	/******************************************************************************************************************
	 * 
	 *
	 */
    function MQTTMsgBusStatusInNode(config) {
        RED.nodes.createNode(this, config)

        this.qos = parseInt(config.qos)

        if (isNaN(this.qos) || this.qos < 0 || this.qos > 2) {
            this.qos = 2
        }

        this.source = config.source
        
        if (typeof this.source === 'undefined'){
            this.source = "+"
        } else if (this.source == "") {
            this.source = "+"
        }

        this.client     = config.client
        this.clientConn = RED.nodes.getNode(this.client)

        this.broker     = this.clientConn.broker
        this.brokerConn = RED.nodes.getNode(this.broker)

        var node = this

        if (this.brokerConn) {
            this.status({fill:"red", shape:"ring", text:"node-red:common.status.disconnected"})

            this.topic = topicStatusSubscribe(this.clientConn, this.source)

            node.brokerConn.register(this)

            this.brokerConn.subscribe(this.topic, this.qos, function(topic, payload, packet) {
                onStatusHandler(node, node.brokerConn, topic, payload)
            }, this.id)

            if (this.brokerConn.connected) {
                node.status({fill:"green", shape:"dot", text:"node-red:common.status.connected"})
            }

            this.on('close', function(done) {
                if (node.brokerConn) {
                    node.brokerConn.unsubscribe(node.topic, node.id)
                    node.brokerConn.deregister(node, done)
                }
            })
        } else {
            this.error(RED._("msgbus.errors.missing-config"))
        }
    }

    RED.nodes.registerType("msgbus status", MQTTMsgBusStatusInNode)

    //
    //
    //
    function onStatusHandler(node, mqtt, topic, payload) {
        var tokenizer = topic.split("/")
        var count     = tokenizer.length

        if (count != 8) {
            node.error("onStatusHandler(): invalid topic; count != 8 --" + topic)
        } else if (tokenizer[0] != node.clientConn.domain) {
            node.error("onStatusHandler(): invalid topic; not our domain -- " + topic)
        } else if(tokenizer[1] != msgbusSelf) {
            node.error("onStatusHandler(): invalid topic; not our bus -- " + topic)
        } else if (tokenizer[2] != msgbusVersion) {
            node.error("onStatusHandler(): invalid topic; not our version -- " + topic)
        } else if (tokenizer[4] != node.clientConn.nodename) {
            var nodename = tokenizer[4]
            var service  = tokenizer[5]
            var dataId   = tokenizer[6]
            var dataType = tokenizer[7]

            try {
                var obj = JSON.parse(payload.toString())

                // validate object
                if (!obj.hasOwnProperty("d")) {
                    node.error("onStatusHandler(): invalid object; 'd' is missing; " + payload.toString())
                } else if (!obj.d.hasOwnProperty("_type")) {
                    node.error("onStatusHandler(): invalid object; 'd._type' is missing; " + payload.toString())
                } else if (!obj.d.hasOwnProperty("status")) {
                    node.error("onStatusHandler(): invalid object; 'd.status' is missing; " + payload.toString())
                } else if (!obj.d.hasOwnProperty("uptime")) {
                    node.error("onStatusHandler(): invalid object; 'd.uptime' is missing; " + payload.toString())
                } else if (!obj.d.hasOwnProperty("nodename")) {
                    node.error("onStatusHandler(): invalid object; 'd.nodename' is missing; " + payload.toString())
                } else if (!obj.d.hasOwnProperty("platform_id")) {
                    node.error("onStatusHandler(): invalid object; 'd.platform_id' is missing; " + payload.toString())
                } else if (!obj.d.hasOwnProperty("class")) {
                    node.error("onStatusHandler(): invalid object; 'd.class' is missing; " + payload.toString())
                } else if (obj.d._type != "status") {
                    node.error("onStatusHandler(): invalid content of 'd._type'; " + payload.toString())
                } else {
                    var d = {
                        type:       "status",
                        nodename:   obj.d.nodename,
                        platformId: obj.d.platform_id,
                        uptime:     obj.d.uptime,
                        classType:  obj.d.class
                    }

                    var msg = { payload: d }

                    if (obj.d.status == "online") {
                        node.send([msg, null, null])
                    } else if (obj.d.status == "offline") {
                        node.send([null, msg, null])
                    } else if (obj.d.status == "disconnected") {
                        node.send([null, null, msg])
                    } else {
                        node.error("invalid content of 'd.status'; " + obj.d.status)
                    }
                }
            } catch(error) {
                node.error(error)
            }
        }
    }

	/******************************************************************************************************************
	 * 
	 *
	 */
    function MQTTMsgBusDebugInNode(config) {
        RED.nodes.createNode(this, config)

        this.qos = 0
        this.source = config.source
        
        if (typeof this.source === 'undefined'){
            this.source = "+"
        } else if (this.source == "") {
            this.source = "+"
        }

        this.client     = config.client
        this.clientConn = RED.nodes.getNode(this.client)

        this.broker     = this.clientConn.broker
        this.brokerConn = RED.nodes.getNode(this.broker)

        var node = this

        if (this.brokerConn) {
            this.status({fill:"red", shape:"ring", text:"node-red:common.status.disconnected"})

            this.topic = topicDebugSubscribe(this.clientConn, this.source)

            node.brokerConn.register(this)

            this.brokerConn.subscribe(this.topic, this.qos, function(topic, payload, packet) {
                onDebugHandler(node, node.brokerConn, topic, payload)
            }, this.id)

            if (this.brokerConn.connected) {
                node.status({fill:"green", shape:"dot", text:"node-red:common.status.connected"})
            }

            this.on('close', function(done) {
                if (node.brokerConn) {
                    node.brokerConn.unsubscribe(node.topic, node.id)
                    node.brokerConn.deregister(node, done)
                }
            })
        } else {
            this.error(RED._("msgbus.errors.missing-config"))
        }

    }

    RED.nodes.registerType("msgbus debug", MQTTMsgBusDebugInNode)

    //
    //
    //
    function onDebugHandler(node, mqtt, topic, payload) {
        var tokenizer = topic.split("/")
        var count     = tokenizer.length

        if (count != 8) {
            node.error("onStatusHandler(): invalid topic; count != 8 --" + topic)
        } else if (tokenizer[0] != node.clientConn.domain) {
            node.error("onStatusHandler(): invalid topic; not our domain -- " + topic)
        } else if(tokenizer[1] != msgbusSelf) {
            node.error("onStatusHandler(): invalid topic; not our bus -- " + topic)
        } else if (tokenizer[2] != msgbusVersion) {
            node.error("onStatusHandler(): invalid topic; not our version -- " + topic)
        } else if (tokenizer[4] != node.clientConn.nodename) {
            var nodename = tokenizer[4]
            var service  = tokenizer[5]
            var dataId   = tokenizer[6]
            var dataType = tokenizer[7]

            var msg = { payload: payload.toString() }
            msg.type        = "debug"
            msg.nodename    = nodename
            msg.service     = service
            msg.format      = msgbusTypeString

            if (dataType == msgbusTypeInfo) {
                node.send([msg, null])
            } else if (dataType == msgbusTypeDebug) {
                node.send([null, msg])
            } else {
                node.error("onDebugHandler(): invalid type; " + dataType)
            }

        }
    }

	/******************************************************************************************************************
	 * 
	 *
	 */
    function MQTTMsgBusValueNode(config) {
        RED.nodes.createNode(this, config)
        console.log("MQTTMsgBusValueNode(): config =", config)

        this.qos        = 0
        this.retain     = false
        this.nodename   = config.nodename
        this.service    = config.service
        this.dataId     = config.dataid
        this.dataType   = config.dataType
        this.event      = config.event
        this.subscribed = false
        this.lastVal    = {}

        this.client     = config.client
        this.clientConn = RED.nodes.getNode(this.client)
        //console.log("MQTTMsgBusValueNode(): this.clientConn =", this.clientConn)

        if (!this.clientConn) {
            //console.log("MQTTMsgBusValueNode(): !this.clientConn, dataId =", this.dataId)
            this.error(RED._("msgbus.errors.missing-config"))
            return
        }

        //this.nodenameSelf   = this.clientConn.nodename

        this.broker         = this.clientConn.broker
        this.brokerConn     = RED.nodes.getNode(this.broker)

        var node = this

        if (this.brokerConn) {
            this.status({fill:"red", shape:"ring", text:"node-red:common.status.disconnected"})

            node.brokerConn.register(this)

            if (    this.subscribed == false && 
                    typeof this.nodename !== 'undefined' && 
                    this.nodename != "" &&
                    typeof this.dataId !== 'undefined' && 
                    this.dataId != "") {

                this.topic      = topicValueSubscribe(this.clientConn, this.nodename, this.dataId, "+")
                this.subscribed = true

                console.log("MQTTMsgBusValueNode(1): dataid =", this.dataId)
                console.log("MQTTMsgBusValueNode(1): topic  =", this.topic)

                this.brokerConn.subscribe(this.topic, this.qos, function(topic, payload, packet) {
                    console.log("MQTTMsgBusValueNode(1): payload =", payload.toString())
                    onValueHandler(node, node.brokerConn, topic, payload)
                }, this.id)
            }

            if (this.brokerConn.connected) {
                node.status({fill:"green", shape:"dot", text:"node-red:common.status.connected"})
            }

            this.on("input", function(msg) {
                console.log("MQTTMsgBusValueNode(): msg =", msg)
                //console.log("MQTTMsgBusValueNode(): hap =", msg.hap.characteristic.props)

                var chk = 0

                if (msg.hasOwnProperty("model")) {
                    chk++                                   // becomes 'nodename'
                }
                if (msg.hasOwnProperty("serialno")) {       // becomes 'dataId'
                    chk++
                }
                if (msg.hasOwnProperty("format")) {         // becomes 'dataType'
                    chk++
                }
                if (msg.hasOwnProperty("event")) {
                    chk++
                }

                var nodename = msg.model
                var dataId   = msg.serialno
                var dataType = msg.hap.characteristic.props.format
                
                if (chk == 4) {
                    if (    node.subscribed == false && 
                            typeof nodename !== 'undefined' && 
                            nodename != "" &&
                            typeof dataId !== 'undefined' && 
                            dataId != "" &&
                            typeof dataType !== 'undefined') {
                                
                        node.topic      = topicValueSubscribe(node.clientConn, nodename, dataId, "+")
                        node.subscribed = true

                        console.log("MQTTMsgBusValueNode(2): dataId =", dataId)
                        console.log("MQTTMsgBusValueNode(2): topic  =", node.topic)

                        node.brokerConn.subscribe(node.topic, node.qos, function(topic, payload, packet) {
                            console.log("MQTTMsgBusValueNode(2): payload =", payload.toString())
                            onValueHandler(node, node.brokerConn, topic, payload)
                        }, this.id)
                    }

                    console.log("MQTTMsgBusValueNode(): node.lastVal =", node.lastVal)

                    var event         = msg.event.toLowerCase()
                    var topicNotExist = node.lastVal[event] === undefined
                    
                    if (!topicNotExist) {
                        if (node.lastVal[event] != msg.payload) {
                            console.log("MQTTMsgBusValueNode(): unequal")
                            node.lastVal[event] = msg.payload
                        } else {
                            console.log("MQTTMsgBusValueNode(): equal, not sending")
                            return
                        }
                    } else {
                        console.log("MQTTMsgBusValueNode(): not exist")
                        node.lastVal[event] = msg.payload
                    }
                } else {

                }
  
                var d = {
                    "d": {
                        "_type":    msg.event.toLowerCase(),
                        "value":    msg.payload
                    }
                }

                //
                // build topic
                //
                var topic = topicValuePublish(node.clientConn, node.nodename, dataId, dataType)

                var m = {}
                m.topic   = topic
                m.payload = JSON.stringify(d)
                m.qos     = node.qos
                m.retain  = node.retain

                console.log("MQTTMsgBusValueNode(publish): msg =", m)
                node.brokerConn.publish(m)  // send the message
            })

            this.on('close', function(done) {
                if (node.brokerConn) {
                    node.brokerConn.unsubscribe(node.topic, node.id)
                    node.brokerConn.deregister(node, done)
                }
            })
        } else {
            this.error(RED._("msgbus.errors.missing-config"))
        }

    }

    RED.nodes.registerType("msgbus io", MQTTMsgBusValueNode)

    //
    //
    //
    function onValueHandler(node, mqtt, topic, payload) {
        var tokenizer = topic.split("/")
        var count     = tokenizer.length

        if (count != 8) {
            node.error("onStatusHandler(): invalid topic; count != 8 --" + topic)
        } else if (tokenizer[0] != node.clientConn.domain) {
            node.error("onStatusHandler(): invalid topic; not our domain -- " + topic)
        } else if(tokenizer[1] != msgbusSelf) {
            node.error("onStatusHandler(): invalid topic; not our bus -- " + topic)
        } else if (tokenizer[2] != msgbusVersion) {
            node.error("onStatusHandler(): invalid topic; not our version -- " + topic)
        } else if (tokenizer[4] != node.clientConn.nodename) {
            var nodename = tokenizer[4]
            var service  = tokenizer[5]
            var dataId   = tokenizer[6]
            var dataType = tokenizer[7]

            console.log("onValueHandler(): nodename =", nodename)
            console.log("onValueHandler(): service  =", service)
            console.log("onValueHandler(): dataId   =", dataId)
            console.log("onValueHandler(): dataType =", dataType)

            if (service == msgbusServiceOnramp) {
                var obj = JSON.parse(payload.toString())

                // validate object
                if (!obj.hasOwnProperty("d")) {
                    node.error("onValueHandler(): invalid object; 'd' is missing")
                } else if (!obj.d.hasOwnProperty("_type")) {
                    node.error("onValueHandler(): invalid object; 'd._type' is missing")
                } else if (!obj.d.hasOwnProperty("value")) {
                    node.error("onValueHandler(): invalid object; 'd.value' is missing")
                } else {
                    if (dataType == msgbusTypeString) {

                    } else if (dataType == msgbusTypeBool) {

                    } else if (dataType == msgbusTypeFloat) {

                    } else if (dataType == msgbusTypeUInt8) {

                    } else if (dataType == msgbusTypeUInt32) {

                    } else if (dataType == msgbusTypeInt32) {

                    } else if (dataType == msgbusTypeUInt64) {

                    } else {
                        node.error("onValueHandler(): invalid data type; " + dataType)
                        return
                    }

                    topic   = obj.d._type       // aka 'event'
                    payload = obj.d.value

                    console.log("onValueHandler(): out topic   =", topic)
                    console.log("onValueHandler(): out payload =", payload)

                    var msg = {
                        topic:   topic,
                        payload: payload
                    }

                    var topicNotExist = node.lastVal[topic] === undefined
                    
                    if (!topicNotExist) {
                        if (node.lastVal[topic] != payload) {
                            console.log("onValueHandler(): unequal")
                            node.lastVal[topic] = payload
                            //node.send(msg)
                        } else {
                            //console.log("onValueHandler(): equal, not sending")
                        }
                    } else {
                        console.log("onValueHandler(): not exist")
                        node.lastVal[topic] = payload
                        //node.send(msg)
                    }
                    
                    node.send(msg)

                    console.log("onValueHandler(): node.lastVal =", node.lastVal)
                }
            }
        } else {
            console.log("onValueHandler(): node.clientConn.nodename =", node.clientConn.nodename)
        }
    }
}
