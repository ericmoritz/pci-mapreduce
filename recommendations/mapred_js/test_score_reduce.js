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

  // Transform critics into a list of 
  // [name, title, rating, other_rating, similarity]
  var values = keys(critics).reduce(function(accum, name) {
    var current = critics[name];
    for(var other_name in critics) {
      if(name != other_name) {
        var other = critics[other_name];
        for(var title in other) {
          if(title in current) {
            var rating = current[title];
            var other_rating = other[title];
            accum.push({"name": name,
                        "other_name": other_name,
                        "title": title,
                        "rating": rating,
                        "other_rating": other_rating, 
                        "similarity": 0});
          }
        }
      }
    }
    return accum;
  }, []);
  // Load the reduce function
  fs.readFile("reduce_" + process.argv[2] + ".js", function(err, data) {
    if(err) throw err;
    var reduce_similarity = eval("("+data+")");
    var reduce_result  = reduce_similarity(values);
    //console.dir(reduce_result);

    fs.readFile("finalize_" + process.argv[2] + ".js", function(err, data) {
      var finalize_similarity = eval("("+data+")");      
      console.dir(finalize_similarity(reduce_result));
    })
  });

});
