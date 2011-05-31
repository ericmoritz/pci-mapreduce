function(values) {
  /*
    Input: a list of records()
    Output: a list of records()

    Types:
       record(): {name(), other_name(), title(), rating(), other_rating(), sqSum)}
       name(): string() - The person's name
       other_name(): string() - The other person's name
       title(): string() - The item's title
       rating(): float() - The person's rating
       other_rating(): float() - The other person's rating
       sqSum(): Sum of the squares
   */
  ejsLog("", "reduce_distance { " + values.length);

  var accum = {}
  for(var i in values) {
    var current = values[i];
    var accum_key = [current.name, current.other_name];

    // Get the current accum record or the initializer
    var accum_record = accum[accum_key] || {
      "name": current.name,
      "other_name": current.other_name,
      "sqSum": 0
    }

    // If the current record's title is undefined, that means we're
    // looking at a precalculated summed square from a previous reduce
    // iteration
    if(typeof(current.title) == "undefined") {
      var square = current.sqSum;
    } else {
      // Calculate the square if the current record isn't from a
      // previous reduce iteration
      var square = Math.pow(current.rating - current.other_rating, 2);
    }

    // Sum the accum_record's add the square onto the sum
    accum_record.sqSum += square;
    
    // Update the accum'd record
    accum[accum_key] = accum_record

  }

  // Convert accum to a list
  var result = [];
  for(var key in accum) {
    result.push(accum[key]);
  }
  return result
}
