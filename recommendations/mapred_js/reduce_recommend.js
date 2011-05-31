function(values) {
  /*
    Input: output of a similarity reduction (reduce_distance | reduce_pearson)
    Output: a list of records()

    Types:
       record(): {
                    "name": name(),
                    "items": {title(): rating()},
                    "scores": {other_name(): distance()}
                    "recommendations": [[score(), title()]]
                  }
       name(): string() - The person's name
       title(): string() - The item's title
       rating(): float() - The item's rating
       other_name(): name() - The name of the person being compared to
       distance(): The sim_distance between name() and other_name()
   */
  
  // Add the recommendations array to the records
  ejsLog('/tmp/map_reduce.log', JSON.stringify(values))

  return values.map(function(current) {
    var totals = {}
    var simSums = {}

    // Iterate over each person
    for(var i in values) {
      var other = values[i]

      // Don't compare current to itself
      if(other.name == current.name) continue;

      // Fetch the pre-calculated simularity value
      var sim = current.scores[other.name] || 0;

      // Ignore scores of zero or lower
      if(sim <= 0) continue;

      for(var other_title in other.items) {
        var other_item = other.items[other_title];

        // Only score items current hasn't seen yet
        if(!current.items[other_title]) {
          // Similarity * Score
          totals[other_title] = totals[other_title] || 0;
          totals[other_title] += other_item*sim;
          // Sum of similarities
          simSums[other_title] = simSums[other_title] || 0;
          simSums[other_title] += sim;
        }
      }
    }
    
    var rankings = [];
    for(title in totals) {
      var total = totals[title];
      rankings.push([total/simSums[title], title]);
    }

    // reverse sort the rankings and store the value into the current
    // record's recommendations
    current.recommendations = rankings.sort(function(x,y) { return y[0] - x[0] });
    
    // Return updated record
    return current;
  });
}
