function(values) {
  var start = new Date().getTime();
  ejsLog("/tmp/map_reduce.log", "reduce_si { " + values.length);

  var accum = [];
  var seen = {};

  for(var i in values) {
    var current = values[i];
    for(var j in values) {
      var other = values[j];
      var seen_key = [current.name, other.name, current.title];

      if(current.name != other.name 
         && current.title == other.title
         && !seen[seen_key]) {

        seen[seen_key] = 1;

        accum.push({
          "name": current.name,
          "other_name": other.name,
          "title": current.title,
          "rating": current.rating,
          "other_rating": other.rating,
          "similarity": 0
        });
      }
    }
  }
  var end = new Date().getTime();
  ejsLog("/tmp/map_reduce.log", "reduce_si: " + (end - start));
  return accum;
}
