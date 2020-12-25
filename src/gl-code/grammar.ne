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
    function _ powerOperator _ power {%
        (data) => ['pow', data[0], data[4]]
    %}
    | function {% id %}

function ->
    unaryFunction "(" sum ")" {% data => [data[0][0], data[2]] %}
    | unaryFunction "[" sum "]" {% data => [data[0][0], data[2]] %}
    | binaryFunction "(" sum "," _ sum ")" {% data => [data[0][0], data[2], data[5]] %}
    | binaryFunction "[" sum "," _ sum "]" {% data => [data[0][0], data[2], data[5]] %}
    | parenthesis {% id %}

parenthesis ->
    "(" sum ")" {% (data) => data[1] %}
    | "[" sum "]" {% (data) => data[1] %}
    | literal {% id %}
    | literal "!" {% (data) => ['factorial', data[0]] %}


##### Operators #####
sumOperator ->
    "+" {% () => 'add' %}
    | "-" {% () => 'sub' %}
    | "−" {% () => 'sub' %}

productOperator ->
    "*" {% () => 'mul' %}
    | "×" {% () => 'mul' %}
    | "/" {% () => 'div' %}

powerOperator -> "**" | "^"

##### Functions #####
unaryFunction ->
   namedFunction {% id %}
   | "-" {% () => 'neg' %}

binaryFunction ->
   "sn"
   | "cn"
   | "dn"
   | "wp"
   | "wp'" {% () => ['wpp'] %}
   | "theta00"
   | "theta01"
   | "theta10"
   | "theta11"

namedFunction ->
   trigFunction
   | "cis"
   | "exp"
   | "log"
   | "ln" {% () => ['log'] %}
   | "sqrt"
   | "gamma"
   | "eta"
   | "zeta"
   | "abs"
   | "arg"
   | "conj"
   | "real"
   | "imag"
   | "re" {% () => ['real'] %}
   | "im" {% () => ['imag'] %}
   | "sm"
   | "cm"

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
    function(data, l, reject) {
        const constants = ['e', 'pi', 'tau', 'phi'];
        const token = data[0].join('')
        if (token === 'i') {return reject;}
        return constants.includes(token) ? ['constant', token] : ['variable', token];
    }
%}

complexNumber ->
    decimal {% (data) => ['number', data[0], 0] %}
    | decimal "i" {% (data) => ['number', 0, data[0]] %}
    | "i" {% () => ['number', 0, 1] %}
