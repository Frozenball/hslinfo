import time
import sys
import json
import os
import collections

from werkzeug.contrib.cache import SimpleCache
from flask import Flask, render_template, Response
import requests

Stop = collections.namedtuple("Stop", ['code', 'max_entries'])
Departure = collections.namedtuple("Departure", ['code_short', 'time', 'name'])

try:
    HSL_USERNAME = os.environ['HSL_USERNAME']
    HSL_PASSWORD = os.environ['HSL_PASSWORD']
    WEATHER_API_KEY = os.environ['WEATHER_API_KEY']
except KeyError as e:
    print "Missing configuration variable: %s" % e
    print ""
    print "You can get the API from:"
    print "http://developer.reittiopas.fi/pages/en/account-request.php"
    print "and then you can export it:"
    print ""
    print "export HSL_USERNAME=''"
    print "export HSL_PASSWORD=''"
    sys.exit(1)

# Test if we have the right configuration
example_request = requests.get(
    'http://api.reittiopas.fi/hsl/prod/'
    '?user=%s&pass=%s&request=stop&code=%s'
    % (
        HSL_USERNAME,
        HSL_PASSWORD,
        '2222209'
    )
)
if example_request.status_code != 200:
    print "HSL api returned error:"
    print ""
    print example_request.content
    sys.exit(2)


STOPS = (
    Stop('2222209', 2),
    Stop('2222210', 8)
    # Stop('2222233', 3),
    # Stop('2222235', 3),
)
API_CACHE = SimpleCache()


def cache_get(url):
    rv = API_CACHE.get(url)
    if rv:
        return rv
    else:
        rv = requests.get(url).json()
        API_CACHE.set(url, rv, timeout=5*60)
        return rv


def get_line_name(find_code, response):
    for line in response[0]['lines']:
        code, name = line.split(":")
        if code == find_code:
            return name.split(',')[0]
    return None


def convertcode(code):
    new_code = code[1:5]
    if new_code[0] == '0':
        new_code = new_code[1:]
    return new_code.strip()


def converttime(time):
    time = str(time)
    if len(time) == 3:
        time = '0'+time
    return '%s:%s' % (time[0:2], time[2:])

app = Flask(__name__)


@app.route('/')
def frontpage():
    return render_template(
        'index.html',
        time=time.time()
    )


@app.route('/routes')
def routes():
    departures = {}
    for stop in STOPS:
        response = cache_get(
            'http://api.reittiopas.fi/hsl/prod/'
            '?user=%s&pass=%s&request=stop&code=%s'
            % (
                HSL_USERNAME,
                HSL_PASSWORD,
                stop.code
            )
        )
        if response[0]['departures']:
            departures[stop.code] = []
            for i, departure in enumerate(response[0]['departures']):
                if i >= stop.max_entries:
                    break
                departures[stop.code].append(
                    Departure(
                        convertcode(departure['code']),
                        converttime(departure['time']),
                        get_line_name(departure['code'], response)
                    )
                )

    return render_template(
        'routes.html',
        departures=departures
    )


@app.route('/weather')
def weather():
    return Response(
        json.dumps(
            cache_get('http://api.openweathermap.org/data/2.5/weather?q=Espoo&appid=%s' % WEATHER_API_KEY)
        ),
        mimetype='application/json'
    )

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=False)
