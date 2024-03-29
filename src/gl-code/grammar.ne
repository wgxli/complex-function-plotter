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
    | "-" _ power {% data => ['neg', data[2]] %}
    | power {% id %}

power ->
    function _ powerOperator _ power {%
        (data) => ['pow', data[0], data[4]]
    %}
    | function {% id %}

function ->
    unaryFunction "(" _ sum _ ")" {% data => [data[0][0], data[3]] %}
    | unaryFunction "[" _ sum _ "]" {% data => [data[0][0], data[3]] %}
    | binaryFunction "(" _ sum "," _ sum _ ")" {% data => [data[0][0], data[3], data[6]] %}
    | binaryFunction "[" _ sum "," _ sum _ "]" {% data => [data[0][0], data[3], data[6]] %}
    | fourFunction "(" _ sum "," _ sum "," _ sum "," _ sum _ ")" {% data => [data[0][0], data[3], data[6], data[9], data[12]] %}
    | fourFunction "[" _ sum "," _ sum "," _ sum "," _ sum _ "]" {% data => [data[0][0], data[3], data[6], data[9], data[12]] %}
    | diffFunction "(" _ sum _ ")" {% data => [data[0][0], data[3], ['variable', 'z']] %}
    | diffFunction "[" _ sum _ "]" {% data => [data[0][0], data[3], ['variable', 'z']] %}
    | parenthesis2 {% id %}

parenthesis ->
    "(" sum ")" {% (data) => data[1] %}
    | "[" sum "]" {% (data) => data[1] %}
    | literal {% id %}

parenthesis2 ->
    parenthesis {% id %}
    | parenthesis "!" {% (data) => ['factorial', data[0]] %}


##### Operators #####
sumOperator ->
    "+" {% () => 'add' %}
    | "-" {% () => 'sub' %}
    | "−" {% () => 'sub' %}

productOperator ->
    "*" {% () => 'mul' %}
    | "×" {% () => 'mul' %}
    | "/" {% () => 'div' %}
    | "%" {% () => 'mod' %}

powerOperator -> "**" | "^"

##### Functions #####
fourFunction ->
   "sum"
   | "product" {% () => ['prod'] %}
   | "prod"

binaryFunction ->
   "beta"
   | "binom"
   | "binomial" {% () => ['binom'] %}
   | "choose" {% () => ['binom'] %}
   | "sn"
   | "cn"
   | "dn"
   | "wp"
   | "wp'" {% () => ['wpp'] %}
   | "theta00"
   | "theta01"
   | "theta10"
   | "theta11"
   | diffFunction {% x => x[0] %}

diffFunction ->
   "derivative" {% () => ['diff'] %}
   | "diff"

unaryFunction ->
   trigFunction
   | "cis"
   | "exp"
   | "log"
   | "ln" {% () => ['log'] %}
   | "sqrt"
   | "√" {% () => ['sqrt'] %}
   | "gamma"
   | "eta"
   | "zeta"
   | "erf"
   | "abs"
   | "arg"
   | "sgn"
   | "conj"
   | "real"
   | "imag"
   | "floor"
   | "ceil"
   | "round"
   | "step"
   | "re" {% () => ['real'] %}
   | "im" {% () => ['imag'] %}
   | "nome"
   | "sm"
   | "cm"
   | "j"
   | "e4" | "e6" | "e8" | "e10" | "e12" | "e14" | "e16"
   | "lambertw"

# Trigonometric functions
baseTrigFunction ->
   "sin" | "cos" | "tan" | "sec" | "csc" | "cot"

hyperbolicTrigFunction ->
   baseTrigFunction "h" {% (data) => data.join('') %}

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
