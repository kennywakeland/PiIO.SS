import json

from django.http import HttpResponse

from pi_io_site.models import *
from pi_io import settings


def rpi_list(request):
    rpis = RaspberryPi.objects.all().order_by('-online')

    rpis_json = []
    for rpi in rpis:
        obj_d = {'mac': rpi.mac_address, 'online': rpi.online, 'name': rpi.name}
        rpis_json.append(obj_d)

    return HttpResponse(json.dumps(rpis_json), mimetype='application/json')


def ws_info(request):

    ws_info_json = {'ws_server': settings.WS_SERVER_IP, 'ws_port': settings.WS_PORT}

    return HttpResponse(json.dumps(ws_info_json), mimetype='application/json')