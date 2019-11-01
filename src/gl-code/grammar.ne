@builtin "whitespace.ne"
@builtin "number.ne"

##### Expressions #####
expression ->
    expression binaryOperator expression {%
        (data) => `${data[1]}(${data[0]}, ${data[2]})`
    %}

##### Operators #####
binaryOperator ->
    "+" {% () => 'cadd' %}
    | "-" {% () => 'csub' %}

##### Number Literals #####
complexNumber ->
    decimal {% (data) => `vec2(${data[0]}, 0)` %}
    | decimal "i" {% ([imag, _]) => `vec2(0, ${imag})` %}
    | "i" {% () => 'vec2(0, 1)' %}
