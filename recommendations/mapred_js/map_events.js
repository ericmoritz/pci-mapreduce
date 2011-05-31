function(value) {
  if(typeof Riak != "undefined") {
    var data = Riak.mapValuesJson(value)[0];
  } else {
    var data = value;
  }
  
  //ejsLog("/tmp/map_reduce.log", "map_events");
  return [{"name": data.actor,
          "title": data.target,
          "rating": data.score}];
}
