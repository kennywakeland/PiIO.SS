

$(document).ready(function() {
    interface.getAjaxMenu();
    interface.getWSinfo();

    var client = new WSClient('ws://' +interface.ws_info.ws_server + ':'+interface.ws_info.ws_port +'/', false);
    // the interface needs to be aware of the ws client to delegate data write requests
    interface.wsclient = client;

    interface.rpi_menu_click = function(context) {
        interface.wsclient.unregister_rpi();
        interface.getAjaxDisplays(context.data.mac, function(){
            interface.wsclient.request_rpi_stream(context.data.mac);
        });
    };

    interface.wsclient.e_rpi_online = function(rpi_mac) {
        interface.getAjaxMenu();
        interface.notify('A raspberry pi has come online', 'success', 5000);
    };

    interface.wsclient.e_rpi_offline = function(rpi_mac) {
        interface.getAjaxMenu();
        interface.notify('A raspberry pi has gone offline', 'error', 5000);
        // our RPI went offline, cleanup
        if (interface.wsclient.bound_rpi_mac && interface.wsclient.bound_rpi_mac == rpi_mac)
        {
            interface.getAjaxDisplays(rpi_mac, function() {

            });
        }
    };

    interface.wsclient.e_rpi_drop_stream = function(rpi_mac) {
        if (interface.wsclient.bound_rpi_mac && interface.wsclient.bound_rpi_mac == rpi_mac)
        {
            interface.notify('The raspberry pi has been reconfigured', 'info', 5000);
        }
    };

    interface.wsclient.e_rpi_stream = function(rpi_mac) {
        if (interface.wsclient.bound_rpi_mac && interface.wsclient.bound_rpi_mac == rpi_mac)
        {
            interface.getAjaxDisplays(rpi_mac, function() {
                interface.wsclient.request_rpi_stream(rpi_mac);
            });
        }
    };

    interface.wsclient.onerror = function() {
        interface.notify('Error with websocket connection, is the server running?', 'error');
    };
});
