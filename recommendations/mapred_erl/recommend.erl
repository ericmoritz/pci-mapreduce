-module(recommend).
-compile(export_all).

od_values(OrdDict) ->
    lists:map(fun({_Key, Value}) -> Value end, OrdDict).

event_to_pref(EventDict) ->
    orddict:from_list([
      {"name", orddict:fetch(<<"actor">>, EventDict)},
      {"title", orddict:fetch(<<"target">>, EventDict)},
      {"rating", orddict:fetch(<<"score">>, EventDict)}
     ]).


map_events(Value, _KeyData, _Arg) ->
    {struct, Event} = mochijson2:decode(riak_object:get_value(Value)),
    [event_to_pref(orddict:from_list(Event))].


% Dedupe the events
events_reducer(Value, Accum) ->
    Key = {orddict:fetch("name", Value), orddict:fetch("title", Value)},
    {Name, Title} = Key,
    Rating = orddict:fetch("rating", Value),

    % Fetch the Accum Record and Rating
    AccumRecord = case orddict:find(Key, Accum) of
        {ok, Value} ->
          Value;
        error ->
          orddict:from_list([{"name", Name}, {"title", Title}, {"rating", 0}])
        end,
    AccumRating = orddict:fetch("rating", AccumRecord),

    % Update the Accum Record with the new rating
    AccumRecord1 = orddict:store("rating", AccumRating + Rating, AccumRecord),
    orddict:store(Key, AccumRecord1, Accum).


reduce_events(Values, _) ->
    ReducedDict = lists:foldl(fun events_reducer/2, orddict:new(), Values),
    od_values(ReducedDict).

reduce_prefs_csv(Values, _) ->
    lists:foldl(fun(X, Accum) -> [[orddict:fetch("name", X), orddict:fetch("title", X), orddict:fetch("rating", X)]|Accum] end, [], Values).

si_reducer(X, Y, Accum) when is_tuple(X) -> ordsets:add_element(X, ordsets:add_element(Y, Accum));
si_reducer(X, Y, Accum) ->
    NotSameName = orddict:fetch("name",X) /= orddict:fetch("name", Y),
    SameTitle = orddict:fetch("title", X) == orddict:fetch("title", Y),
    case NotSameName and SameTitle of
       true -> ordsets:add_element({X,Y}, Accum);
       false -> Accum
    end.


reduce_si(Values, _) ->
   ValueSet = ordsets:from_list(Values),
   ordsets:to_list(ml_utils:combine(fun si_reducer/3, ValueSet, ValueSet, ordsets:new())).


distance_reducer(Value, Accum) when is_tuple(Value) ->
    {Current, Other} = Value,
    AccumKey = {orddict:fetch("name", Current), orddict:fetch("name", Other)},
    {Name, OtherName} = AccumKey,

    AccumRecord = case orddict:find(AccumKey, Accum) of
            {ok, V} -> V;
            error -> orddict:from_list([{"name", Name},
                      {"other_name", OtherName},
                      {"sq_sum", 0}])
    end,

    AccumSqSum = orddict:fetch("sq_sum", AccumRecord),
    SqSum = math:pow(orddict:fetch("rating", Current) - orddict:fetch("rating", Other), 2),
    orddict:store(AccumKey, orddict:store("sq_sum", AccumSqSum + SqSum, AccumRecord), Accum);
distance_reducer(Value, Accum) -> 
    % If the value is not a tuple, we've alread processed it
    AccumKey = {orddict:fetch("name", Value), orddict:fetch("other_name", Value)},
    orddict:store(AccumKey, Value, Accum).
    

reduce_distance(Values, _) ->
    od_values(lists:foldl(fun distance_reducer/2, orddict:new(), Values)).


finalize_distance(Values, _) ->
    F = fun(X) ->
        Sim = 1 / (1 + orddict:fetch("sq_sum", X)),
        orddict:store("simularity", Sim, X)
        end,

    lists:map(F, Values).


query_prefs(Bucket) ->
   {ok, Client} = riak:local_client(),
   Query = [
       {map, {modfun, recommend, map_events}, none, false},
       {reduce, {modfun, recommend, reduce_events}, none, true}
       ],
   Client:mapred(Bucket, Query, 1000*60*60).


query_distance(Bucket) ->
   {ok, Client} = riak:local_client(),
   Query = [
       {map, {modfun, recommend, map_events}, none, false},
       {reduce, {modfun, recommend, reduce_events}, none, true}
       ],
   Client:mapred(Bucket, Query, 1000*60*60).

