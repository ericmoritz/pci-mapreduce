/* A little node.js script to make sure my reducer works correctly */
var fs = require("fs");

function ejsLog(filename, message) {
  console.log(message)
}

function keys(obj) {
  var accum = [];
  for(key in obj) {
    accum.push(key);
  }
  return accum;
}

function simulate_reduce(values, reducer) {
  return reducer(values);
  // Split the values in half
  var half_n = Math.floor(values.length / 2);
  var chunk_1 = values.slice(0, half_n);
  var chunk_2 = values.slice(half_n, -1);

  // reduce each chunk
  console.log(chunk_1.length);
  result_1 = reducer(chunk_1);
  console.log(chunk_2.length);
  result_2 = reducer(chunk_2);

  // reduce the merged chunks
  result = reducer(result_1.concat(result_2));
  return result;

}

function merge(lol) {
  var accum = [];
  for(var i in lol) {
    accum = accum.concat(lol[i]);
  }
  return accum;
}

function compile(filename) {
  var code = fs.readFileSync(filename);
  return eval("(" + code + ")");
}

fs.readFile("./kns.events.json", function(err, data) {
  if(err) throw err;

  var map_events = compile("./map_events.js");
  var reduce_events = compile("./reduce_events.js");
  var reduce_si = compile("./reduce_si.js");
  
  var reduce_similarity = compile("reduce_" + process.argv[2] + ".js");
  var finalize_similarity = compile("finalize_" + process.argv[2] + ".js");

  var events = JSON.parse(data);

  function strcmp(x, y) {
    if(x == y) return 0;
    return x > y ? 1 : -1;
  }
  var values = merge(events.map(map_events));
  var values = simulate_reduce(values, reduce_events);
  var values = simulate_reduce(values, reduce_si);
  var values = simulate_reduce(values, reduce_similarity);  
  var values = simulate_reduce(values, finalize_similarity);  
  console.info(values.sort(function(x,y) { return strcmp(x.name, y.name) })); return;



});
