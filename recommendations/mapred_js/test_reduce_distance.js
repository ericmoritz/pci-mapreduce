/* A little node.js script to make sure my reducer works correctly */
var fs = require("fs");

function keys(obj) {
  var accum = [];
  for(key in obj) {
    accum.push(key);
  }
  return accum;
}

fs.readFile("./critics.json", function(err, data) {
  if(err) throw err;
  var critics = JSON.parse(data);

  // Transform the critics values into an array
  var values = keys(critics).reduce(function(accum, key) {
    var obj = {
      "name": key,
      "items": critics[key],
      "scores": {}
    };
    accum.push(obj);
    return accum;
  }, []);

  // Load the reduce function
  fs.readFile("./reduce_distance.js", function(err, data) {
    if(err) throw err;
    var reduce_distance = eval("("+data+")");
    console.dir(reduce_distance(values));
  });

});
