from django.conf.urls import patterns, include, url

urlpatterns = patterns('',
    url(r'^rpis/$', 'user_api.views.rpi_list'),
    url(r'^ws_info/$', 'user_api.views.ws_info'),
)

