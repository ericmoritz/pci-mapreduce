function(values) {
  var start = new Date().getTime();
  //ejsLog("/tmp/map_reduce.log", "reduce_events" + JSON.stringify(values));
  var accum = {};
  // Sum the events
  for(var i = 0; i < values.length; i++) {

    var current = values[i];
    var key = [current.name, current.title];

    var accum_record = accum[key] || {
      "name": current.name,
      "title": current.title,
      "rating": 0
    };

    accum_record.rating += current.rating;
    accum[key] = accum_record;
  }


  var result = [];
  for(var key in accum) {
    result.push(accum[key]);
  }
  var end = new Date().getTime();
  ejsLog("/tmp/map_reduce.log", "reduce_events: " + (end - start));
  return result;
}
