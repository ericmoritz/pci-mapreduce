-module(ml_utils).
-compile(export_all).


combine(L1, L2) ->
    combine(fun(X,Y, A) -> [{X, Y}|A] end, L1, L2, []).

combine(_, [], _L2, Accum) -> Accum;
combine(ReduceFun, [Current|Rest], L2, Accum) ->
    Accum1 = combine_inner(ReduceFun, Current, L2, Accum),
    combine(ReduceFun, Rest, L2, Accum1).

combine_inner(_, _Current, [], Accum) -> Accum;
combine_inner(ReduceFun, Current, [Other|Rest], Accum) ->
    combine_inner(ReduceFun, Current, Rest, ReduceFun(Current, Other, Accum)).
