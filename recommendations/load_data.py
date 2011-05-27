#!/usr/bin/env python
import json
import riak
import os
import glob

critics = json.load(open("./mapred_js/critics.json"))
client = riak.RiakClient(transport_class=riak.RiakPbcTransport, port=8087)
bucket = client.bucket("critics")


# install the critics data
for key, value in critics.items():
    obj = bucket.get(key.encode("utf-8"))
    obj.set_data(value)
    obj.set_content_type("application/json")
    obj.store()

# install the mapred queries
js_bucket = client.bucket("pci-mapred")

for filename in glob.glob("mapred_js/*.js"):
    obj = js_bucket.get(os.path.basename(filename))
    obj.set_data(file(filename).read())
    obj.set_content_type("text/javascript")
    obj.store()
