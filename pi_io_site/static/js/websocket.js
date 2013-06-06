function WSClient(url, debug) {
    var self = this;
    this.debug = Boolean(debug);
    this.ws = new WebSocket(url);
    this.ws.onopen = function() {
        self.ws_onopen();
    };
    this.ws.onclose = function() {
        self.ws_onclose();
    };
    this.ws.onmessage = function(msg) {
        self.ws_onmessage(msg);
    };
    this.ws.onerror = function(error) {
        self.ws_onerror(error);
    };

    // callback for errors
    this.onerror = undefined;

    this.datamsgcount_ack = 0;

    this.clientcmds = {
        'CONNECT_RPI':'rpi_connect',
        'ACK_DATA':'ack_data',
        'WRITE_DATA':'write_data'
    };
    this.servercmds = {
        'RPI_STATE_CHANGE':'rpi_schange',
        'WRITE_DATA':'write_data'
    };
}

WSClient.prototype.ws_onmessage = function(msg) {
    var parsedMsg = jQuery.parseJSON(msg.data);

    $("#wakeland_debug").text(parsedMsg);
    //console.log(parsedMsg);

    if (this.debug)
        console.log(parsedMsg);

    var key,type,index;
    switch (parsedMsg.cmd) {
        case this.servercmds.RPI_STATE_CHANGE:
            // for now i don't care, just refresh menu
            switch(parsedMsg.rpi_state)
            {
                case 'drop_stream':
                    // when any RPI drops from its streaming state
                    // this occurs when a RPI gets reconfigured (admin change)
                    if (this.e_rpi_drop_stream) this.e_rpi_drop_stream(parsedMsg.rpi_mac);
                    break;
                case 'stream':
                    // when any RPI begins streaming
                    if (this.e_rpi_stream) this.e_rpi_stream(parsedMsg.rpi_mac);
                    break;
                case 'online':
                    // when any RPI comes online
                    if (this.e_rpi_online) this.e_rpi_online(parsedMsg.rpi_mac);
                    break;
                case 'offline':
                    // when any RPI goes offline
                    if (this.e_rpi_offline) this.e_rpi_offline(parsedMsg.rpi_mac);
                    break;
                default:
                    break;
            }
            break;
        case this.servercmds.WRITE_DATA:
            this.datamsgcount_ack++;

            if('data_bindings' in window  ){
                this.update_instance(parsedMsg.read,data_bindings);
                this.update_instance(parsedMsg.write,data_bindings);
            }


            if (this.datamsgcount_ack >= 5) {
                this.acknowledge();
                this.datamsgcount_ack = 0;
            }

            break;
        default:
            console.log("oo nno");
            break;
    }
};

WSClient.prototype.update_instance = function(update_date,bindings){
    var port_key,type_key,index;
    for (port_key in update_date) {
        if (port_key in data_bindings) {

            for (type_key in data_bindings[port_key]) {
                if (data_bindings[port_key][type_key].instances) {
                    for (index in data_bindings[port_key][type_key].instances) {
                        data_bindings[port_key][type_key].instances[index].update(update_date[port_key]);
                    }
                }
            }
        }else{
            alert(port_key);
        }
    }
}

WSClient.prototype.acknowledge = function(){
    var push_msg = {
        'cmd':this.clientcmds.ACK_DATA,
        'ack_count':this.datamsgcount_ack
    };

    this.ws.send(JSON.stringify(push_msg));

    console.log('WS acknowledge');
    console.log(this.datamsgcount_ack);

    this.datamsgcount_ack = 0;
}

WSClient.prototype.ws_onopen = function() {
    if (this.debug) {
        console.log('WS connected');
    }

    // request connected RPI list
};

WSClient.prototype.ws_onclose = function() {
    if (this.debug) {
        console.log('WS closed');
    }
};

WSClient.prototype.ws_onerror = function(error) {
    if (this.debug) {
        console.log('Error ' + error);
    }

    if (this.onerror) this.onerror();
};

WSClient.prototype.request_rpi_stream = function(rpi_mac) {
    var msg = {
        'cmd':this.clientcmds.CONNECT_RPI,
        'rpi_mac':rpi_mac
    };
    if (this.debug) {
        console.log(msg);
    }
    this.ws.send(JSON.stringify(msg));
    this.datamsgcount_ack = 0;
    this.bound_rpi_mac = rpi_mac;
};

WSClient.prototype.unregister_rpi = function() {
    this.bound_rpi_mac = null;
};

WSClient.prototype.send_write_data = function(key, data) {
    var msg = {
        'cmd':this.clientcmds.WRITE_DATA,
        'inter_face_port':key,
        'value':data
    };

    console.log(msg);
    if (this.debug) {
        console.log(msg);
    }
    this.ws.send(JSON.stringify(msg));
};