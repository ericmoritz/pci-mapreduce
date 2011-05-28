"""
This converts the old preference doc to the event based one
"""
import riak
from pprint import pprint
client = riak.RiakClient(port=8087, transport_class=riak.RiakPbcTransport)
bucket = client.bucket("kns.comments.urls")
new_bucket = client.bucket("kns.events")

for url in bucket.get_keys():
    obj = bucket.get(url)
    doc = obj.get_data()

    for actor in doc.keys():
        new_doc = {
            'timestamp': "1979-01-01T00:00:00",
            'target': url,
            'verb': 'comment',
            'actor': actor,
            'score': doc[actor]
            }
        
        new_key = "%s;%s;%s" % (new_doc['timestamp'],
                                url,
                                actor)

        obj = new_bucket.get(new_key.encode("utf-8"))
        obj.set_data(new_doc)
        obj.set_content_type("application/json")
        obj.store()
                                
