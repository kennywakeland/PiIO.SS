from django.db import models


class IOTypes(object):
    boolean = 'B'
    integer = 'I'


class RaspberryPi(models.Model):
    name = models.CharField(max_length=200)
    # in format AA:BB:CC:DD:EE:FF
    # should be unique identifier for RPI
    #primary_key
    mac_address = models.CharField(max_length=17, db_index=True)
    current_ip = models.IPAddressField()
    online = models.BooleanField(default=False)

    def __unicode__(self):
        return self.name

    class Meta:
        verbose_name = 'Raspberry Pi'
        verbose_name_plural = 'Raspberry Pi'

class RaspberryPiInterface(models.Model):
    # return type for reads, input for writes
    IO_TYPE = (
        ('B', 'Boolean'),
        ('I', 'Integer'),
    )

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    # this is used to determine the appropriate displays
    io_type = models.CharField(choices=IO_TYPE, max_length=1)
    # stored as a list of choices in json
    possible_choices = models.TextField(default='[]')

    rpi = models.ForeignKey(RaspberryPi)

    def __unicode__(self):
        return self.name

    class Meta:
        unique_together = (("name", "rpi"),)
        abstract = True


class RPIReadInterface(RaspberryPiInterface):
    pass


class RPIWriteInterface(RaspberryPiInterface):
    pass


class Display(models.Model):
    # channel or port
    #channel_port = models.IntegerField()
    channel_port = models.CharField(max_length=100)
    equation = models.CharField(max_length=100, blank=True)
    label = models.CharField(max_length=200, blank=True)

    rpi = models.ForeignKey(RaspberryPi)


    def __unicode__(self):
        return '%s - %s' % (self.__class__.__name__, self.channel_port)

    class Meta:
        abstract = True


class WriteDisplay(Display):
    interface = models.ForeignKey(RPIWriteInterface)


class ReadDisplay(Display):
    interface = models.ForeignKey(RPIReadInterface)


class NumericDisplay(ReadDisplay):
    io_type = (IOTypes.boolean, IOTypes.integer)


class ProgressBarDisplay(ReadDisplay):
    io_type = (IOTypes.integer,)


class GraphDisplay(ReadDisplay):
    io_type = (IOTypes.integer,)


class ButtonDisplay(WriteDisplay):
    io_type = (IOTypes.boolean,)


"""
Connect signals to ws_comm handler for interface change updates
"""
from django.db.models.signals import post_save, post_delete
from ws_comm.client import config_changed_signal

post_save.connect(config_changed_signal, dispatch_uid="uid_post_save_config")
post_delete.connect(config_changed_signal, dispatch_uid="uid_post_del_config")
