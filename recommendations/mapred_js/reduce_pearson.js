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

  var sim_pearson = function(person1, person2) {
    var pow = Math.pow;

    // Create a set of shared items
    var si = []
    for(item in person1) {
      if(item in person2 && si.indexOf(item) == -1) {
        si.push(item);
      }
    } 
    // If they have no ratings in common, return 0
    if(si.length == 0) return 0;
    
    // This 
    function sum(list, key_func) {
      return list.reduce(function(accum, item) {
        return accum + key_func(item);
      }, 0);
    };

    var n      = si.length;
    var sum1   = sum(si, function(item) { return person1[item]; });
    var sum2   = sum(si, function(item) { return person2[item]; });
    var sum1Sq = sum(si, function(item) { return pow(person1[item], 2); });
    var sum2Sq = sum(si, function(item) { return pow(person2[item], 2); });
    var pSum   = sum(si, function(item) { return person1[item] * person2[item] });
    var num    = pSum-(sum1*sum2/n);
    var den    = Math.sqrt((sum1Sq - pow(sum1, 2) / n)*(sum2Sq - pow(sum2, 2) / n));

    if(den == 0) return 0;
    var r = num / den;
    return r;
  };

  // For each record calculate the sim_pearson against the other people
  for(i in values) {
    var current = values[i];
    for(j in values) {
      var other = values[j];
      // If other is not the same as other and we haven't already
      // calculated the sim_pearson for these two:
      if(current !== other && !(other.name in current.scores)) {
        current.scores[other.name] = sim_pearson(current.items, other.items);
      }
    }
  }
  return values;
}
