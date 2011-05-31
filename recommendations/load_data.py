#!/usr/bin/env python
import json
import riak
import os
import glob

critics = json.load(open("./mapred_js/critics.json"))
client = riak.RiakClient(transport_class=riak.RiakPbcTransport, port=8087)
bucket = client.bucket("critics")
event_bucket = client.bucket("critics.events")


# install the critics data
for name, value in critics.items():
    obj = bucket.get(name.encode("utf-8"))
    obj.set_data(value)
    obj.set_content_type("application/json")
    obj.store()

    # Store the prefs as events
    for title, rating in value.items():
        event_doc = {
            "timestamp": "1979-01-01T00:00:00",
            "actor": name,
            "target": title,
            "verb": "rate",
            "score": rating
            }

        event_key = ";".join([event_doc['timestamp'],
                              event_doc['actor'],
                              event_doc['verb'],
                              event_doc['target']])

        event_obj = event_bucket.get(event_key.encode("utf-8"))
        event_obj.set_content_type("application/json")
        event_obj.set_data(event_doc)
        event_obj.store()

# install the mapred queries
js_bucket = client.bucket("pci-mapred")

for filename in glob.glob("mapred_js/*.js"):
    obj = js_bucket.get(os.path.basename(filename))
    obj.set_data(file(filename).read())
    obj.set_content_type("text/javascript")
    obj.store()
