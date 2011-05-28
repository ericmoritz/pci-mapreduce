"""
This records the user's ratings on a story based on the number of comments they leave.
"""
import feedparser
import eventlet
from eventlet import Queue, GreenPool
from pyquery import PyQuery as Q
from pprint import pprint
from urlparse import urljoin
import re
import logging
import riak
import time

eventlet.monkey_patch()

log = logging.getLogger(__name__)
logging.basicConfig(level=logging.DEBUG)


def url_to_comment_gen(url):
    log.debug("fetching %s" % (url, ))
    q = Q(url=url)

    for el in map(Q, q(".comment_body .author a")):
        name = el.html()
        yield ((url, name), 1)

    # If comments are paginated, and we're not on a paginated page already
    # fetch those comments
    if("/comments/list/news/stories/" not in url):
        url_list = [urljoin(url, Q(el).attr("value"))
                    for el in q(".pagination_top .time_paginated_counter option")][1:]
        log.info("Found %s pages on %s" % (len(url_list), url))
        for page_url in url_list:
            for (_, name), _ in url_to_comment_gen(page_url):
                yield ((url, name), 1)
                

def reduce_comments(accum, value):
    scratch = dict(accum)
    key, count = value
    scratch.setdefault(key, 0)
    scratch[key] += count
    return scratch.items()

def get_url_set():
    url_set = set()

    for entry in feedparser.parse("http://www.knoxnews.com/feeds/comments/").entries:
        # Build a set of URL based on the comments feed
        url_set.add(re.sub(r"\?comments_id=\d+", "", entry.link))

    return url_set


def fetch_comments(url):
    # Build the comment data from the url
    return reduce(reduce_comments, url_to_comment_gen(url), [])


def update_documents(comments):
    client = riak.RiakClient(port=8087, transport_class=riak.RiakPbcTransport)

    # With the comments, generate the user doc and the url doc
    user_doc = {}
    url_doc = {}
    for (url, name), rating in comments:
        user_doc.setdefault(name, {})
        user_doc[name][url] = rating

        url_doc.setdefault(url, {})
        url_doc[url][name] = rating


    urls_bucket = client.bucket("kns.comments.urls")
    for url, doc in url_doc.items():
        obj = urls_bucket.get(url.encode("utf-8"))
        obj.set_data(doc)
        obj.set_content_type("application/json")
        log.info("Storing %s doc %s" % (urls_bucket.get_name(),
                                        obj.get_key()))
        obj.store()


    user_bucket = client.bucket("kns.comments.users")
    user_bucket.set_allow_multiples(True)

    for name, doc in user_doc.items():
        obj = user_bucket.get(name.encode("utf-8"))

        # Handle conflicts
        if not obj.exists():
            old_doc = {}
        elif obj.has_siblings():
            log.debug("obj %s in conflict, resolving" % (obj.get_key(), ))
            old_doc = {}
            for sibling in (obj.get_sibling(i) for i in range(obj.get_sibling_count())):
                data = sibling.get_data()
                for url, rating in data.items():
                    old_doc[url] = rating
        else:
            old_doc = obj.get_data()

        old_doc.update(doc)
        obj.set_data(old_doc)
        obj.set_content_type("application/json")
        log.info("Storing %s doc %s" % (user_bucket.get_name(),
                                        obj.get_key()))
        obj.store()



def get_days_stories(slug):
    url = "http://www.knoxnews.com/news"+slug
    q = Q(url=url)
    return [urljoin(url, el.attr("href")) 
            for el in map(Q, q(".bucket_detail_primary li a"))]


def spawn(url_list):
    def green_map(url):
        comments = fetch_comments(url)
        update_documents(comments)

        eventlet.sleep(0.1)
        return url
    

    pool = GreenPool(3)
    for url in pool.imap(green_map, url_list):
        log.info("Finished %s" % (url, ))
    

def main():
    while True:
        url_list = list(get_url_set())
        spawn(url_list)
        log.info("Sleeping...")
        time.sleep(500)

if __name__ == '__main__':
    #for day in range(1,28):
    #    url_list = get_days_stories("/2011/may/%02d/" % day)
    #    spawn(url_list)

    main()
