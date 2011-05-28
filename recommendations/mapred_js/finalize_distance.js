function(values) {
  /*
    Input: a list of records()
    Output: a list of records()

    Types:
       record(): {name(), other_name(), title(), rating(), other_rating(), simularity()}
       name(): string() - The person's name
       other_name(): string() - The other person's name
       title(): string() - The item's title
       rating(): float() - The person's rating
       other_rating(): float() - The other person's rating
       simularity(): The simularity between name() and other_name()
   */

  // Take the result of the pervious reduce phase 
  // and turn the calculated simularity into a number between 0 and 1
  return values.map(function(current) {
    current.simularity = 1 / (1 + current.simularity);
    return current;
  })
}
