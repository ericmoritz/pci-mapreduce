function(value) {
  var obj = {
    "name": value.key,
    "items": Riak.mapValuesJson(value)[0],
    "scores": {} // Score accumulator
  };
  return [obj];
}
