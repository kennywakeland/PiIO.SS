import json

from django.http import HttpResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt

from pi_io_site.models import *
from ws_comm.client import push_config


@csrf_exempt
def register(request):
    """
    When a rpi connects to the WS server this is called
    """
    if request.method == 'POST':
        try:
            json_req = json.loads(request.POST['json'])
        except:
            return HttpResponseBadRequest('Unable to parse post json key', mimetype='application/json')

        # verify fields exist
        if 'mac' not in json_req or 'ip' not in json_req or 'inter_face' not in json_req:
            return HttpResponseBadRequest('Does not have required fields', mimetype='application/json')

        # update rpi model
        rpi_db, created = RaspberryPi.objects.get_or_create(mac_address=json_req['mac'],
                                                            defaults={'current_ip': json_req['ip'],
                                                                      'name': '%s - %s' % (json_req['mac'], json_req['ip'])
                                                                     })

        rpi_db.current_ip = json_req['ip']
        rpi_db.online = True
        rpi_db.save()

        def update_inter_face(model_cls, index_name):
            if index_name in json_req['inter_face']:
                for inter_face in json_req['inter_face'][index_name]:
                    inter_face_db, created = model_cls.objects.get_or_create(rpi=rpi_db, name=inter_face['name'],
                                                                        defaults={'io_type': inter_face['io_type']})

                    inter_face_db.description = inter_face['desc']
                    inter_face_db.possible_choices = json.dumps(inter_face['choices'])
                    inter_face_db.save()

        # update referring interface models
        update_inter_face(RPIReadInterface, 'read')
        update_inter_face(RPIWriteInterface, 'write')

        # send configs to the RPI
        push_config(rpi_db)

    return HttpResponse('ok', mimetype='application/json')


@csrf_exempt
def disconnect(request):
    if request.method == 'POST':
        try:
            json_req = json.loads(request.POST['json'])
        except:
            return HttpResponseBadRequest('Unable to parse post json key', mimetype='application/json')

        # verify fields exist
        if 'mac' not in json_req:
            return HttpResponseBadRequest('Does not have required fields - mac', mimetype='application/json')

        rpi = RaspberryPi.objects.get(mac_address=json_req['mac'])
        rpi.online = False
        rpi.save()

    return HttpResponse('ok', mimetype='application/json')
