function(values) {
  /*
    Input: a list of records()
    Output: a list of records()

    Types:
       record(): {
                    "name": name(),
                    "items": {title(): rating()},
                    "scores": {other_name(): distance()}
                  }
       name(): string() - The person's name
       title(): string() - The item's title
       rating(): float() - The item's rating
       other_name(): name() - The name of the person being compared to
       distance(): The sim_distance between name() and other_name()
   */

  var sim_distance = function(person1, person2) {
    // Create a set of shared items
    var si = []
    for(item in person1) {
      if(item in person2 && si.indexOf(item) == -1) {
        si.push(item);
      }
    } 
    // If they have no ratings in common, return 0
    if(si.length == 0) return 0;

    var sum_of_squares = si.reduce(function(accum, item) {
      return accum + Math.pow(person1[item] - person2[item], 2);
    }, 0);

    return 1.0 / (1+sum_of_squares);
  };

  // For each record calculate the sim_distance against the other people
  for(i in values) {
    var current = values[i];
    for(j in values) {
      var other = values[j];
      // If other is not the same as other and we haven't already
      // calculated the sim_distance for these two:
      if(current !== other && !(other.name in current.scores)) {
        current.scores[other.name] = sim_distance(current.items, other.items);
      }
    }
  }
  return values;
}
