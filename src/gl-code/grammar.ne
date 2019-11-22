@builtin "whitespace.ne"
@builtin "number.ne"

# Defined this way for correct associativity + precedence

sum ->
    sum _ sumOperator _ product {%
        (data) => [data[2], data[0], data[4]]
    %}
    | product {% id %}

product ->
    product _ productOperator _ power {%
        (data) => [data[2], data[0], data[4]]
    %}
    | power {% id %}

power ->
    parenthesis _ powerOperator _ power {%
        (data) => ['pow', data[0], data[4]]
    %}
    | parenthesis {% id %}

parenthesis ->
    "(" _ sum _ ")" {% (data) => data[2] %}
    | "[" _ sum _ "]" {% (data) => data[2] %}
    | function {% id %}

function ->
    literal {% id %}
    | literal _ "!" {% (data) => ['factorial', data[0]] %}
    | unaryFunction _ parenthesis {%
        (data) => [data[0], data[2]]
    %}

##### Operators #####
sumOperator ->
    "+" {% () => 'add' %}
    | "-" {% () => 'sub' %}

productOperator ->
    "*" {% () => 'mul' %}
    | "/" {% () => 'div' %}

powerOperator -> "**" | "^"

##### Functions #####
unaryFunction ->
   namedFunction {% id %}
   | "-" {% () => 'neg' %}

namedFunction ->
   trigFunction {% id %}
   | "cis"
   | "exp"
   | "log"
   | "ln" {% () => 'log' %}
   | "sqrt"
   | "gamma"
   | "eta"
   | "zeta"
   | "abs"
   | "arg"
   | "conj"
   | "cis"
   | "real"
   | "imag"
   | "re" {% () => 'real' %}
   | "im" {% () => 'imag' %}

# Trigonometric functions
baseTrigFunction ->
   "sin" | "cos" | "tan" | "sec" | "csc" | "cot"

hyperbolicTrigFunction ->
   trigFunction "h" {% (data) => data.join('') %}

trigFunction ->
   "arc":? baseTrigFunction {% (data) => data.join('') %}
   | "a" baseTrigFunction {% (data) => 'arc' + data[1] %}
   | "ar":? hyperbolicTrigFunction {% (data) => data.join('') %}

##### Literals #####
literal ->
    complexNumber {% id %}
    | variable {% id %}


variable -> [a-z]:+ {%
    function(data) {
        const constants = ['e', 'pi', 'tau', 'phi'];
        const token = data[0].join('')
        return constants.includes(token) ? ['constant', token] : ['variable', token];
    }
%}

complexNumber ->
    decimal {% (data) => ['number', data[0], 0] %}
    | decimal "i" {% (data) => ['number', 0, data[0]] %}
    | "i" {% () => ['number', 0, 1] %}