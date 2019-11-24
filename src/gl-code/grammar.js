// Generated automatically by nearley, version 2.19.0
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }
var grammar = {
    Lexer: undefined,
    ParserRules: [
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", "wschar"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_", "symbols": ["_$ebnf$1"], "postprocess": function(d) {return null;}},
    {"name": "__$ebnf$1", "symbols": ["wschar"]},
    {"name": "__$ebnf$1", "symbols": ["__$ebnf$1", "wschar"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "__", "symbols": ["__$ebnf$1"], "postprocess": function(d) {return null;}},
    {"name": "wschar", "symbols": [/[ \t\n\v\f]/], "postprocess": id},
    {"name": "unsigned_int$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "unsigned_int$ebnf$1", "symbols": ["unsigned_int$ebnf$1", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "unsigned_int", "symbols": ["unsigned_int$ebnf$1"], "postprocess": 
        function(d) {
            return parseInt(d[0].join(""));
        }
        },
    {"name": "int$ebnf$1$subexpression$1", "symbols": [{"literal":"-"}]},
    {"name": "int$ebnf$1$subexpression$1", "symbols": [{"literal":"+"}]},
    {"name": "int$ebnf$1", "symbols": ["int$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "int$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "int$ebnf$2", "symbols": [/[0-9]/]},
    {"name": "int$ebnf$2", "symbols": ["int$ebnf$2", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "int", "symbols": ["int$ebnf$1", "int$ebnf$2"], "postprocess": 
        function(d) {
            if (d[0]) {
                return parseInt(d[0][0]+d[1].join(""));
            } else {
                return parseInt(d[1].join(""));
            }
        }
        },
    {"name": "unsigned_decimal$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "unsigned_decimal$ebnf$1", "symbols": ["unsigned_decimal$ebnf$1", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "unsigned_decimal$ebnf$2$subexpression$1$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "unsigned_decimal$ebnf$2$subexpression$1$ebnf$1", "symbols": ["unsigned_decimal$ebnf$2$subexpression$1$ebnf$1", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "unsigned_decimal$ebnf$2$subexpression$1", "symbols": [{"literal":"."}, "unsigned_decimal$ebnf$2$subexpression$1$ebnf$1"]},
    {"name": "unsigned_decimal$ebnf$2", "symbols": ["unsigned_decimal$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "unsigned_decimal$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "unsigned_decimal", "symbols": ["unsigned_decimal$ebnf$1", "unsigned_decimal$ebnf$2"], "postprocess": 
        function(d) {
            return parseFloat(
                d[0].join("") +
                (d[1] ? "."+d[1][1].join("") : "")
            );
        }
        },
    {"name": "decimal$ebnf$1", "symbols": [{"literal":"-"}], "postprocess": id},
    {"name": "decimal$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "decimal$ebnf$2", "symbols": [/[0-9]/]},
    {"name": "decimal$ebnf$2", "symbols": ["decimal$ebnf$2", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "decimal$ebnf$3$subexpression$1$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "decimal$ebnf$3$subexpression$1$ebnf$1", "symbols": ["decimal$ebnf$3$subexpression$1$ebnf$1", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "decimal$ebnf$3$subexpression$1", "symbols": [{"literal":"."}, "decimal$ebnf$3$subexpression$1$ebnf$1"]},
    {"name": "decimal$ebnf$3", "symbols": ["decimal$ebnf$3$subexpression$1"], "postprocess": id},
    {"name": "decimal$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "decimal", "symbols": ["decimal$ebnf$1", "decimal$ebnf$2", "decimal$ebnf$3"], "postprocess": 
        function(d) {
            return parseFloat(
                (d[0] || "") +
                d[1].join("") +
                (d[2] ? "."+d[2][1].join("") : "")
            );
        }
        },
    {"name": "percentage", "symbols": ["decimal", {"literal":"%"}], "postprocess": 
        function(d) {
            return d[0]/100;
        }
        },
    {"name": "jsonfloat$ebnf$1", "symbols": [{"literal":"-"}], "postprocess": id},
    {"name": "jsonfloat$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "jsonfloat$ebnf$2", "symbols": [/[0-9]/]},
    {"name": "jsonfloat$ebnf$2", "symbols": ["jsonfloat$ebnf$2", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "jsonfloat$ebnf$3$subexpression$1$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "jsonfloat$ebnf$3$subexpression$1$ebnf$1", "symbols": ["jsonfloat$ebnf$3$subexpression$1$ebnf$1", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "jsonfloat$ebnf$3$subexpression$1", "symbols": [{"literal":"."}, "jsonfloat$ebnf$3$subexpression$1$ebnf$1"]},
    {"name": "jsonfloat$ebnf$3", "symbols": ["jsonfloat$ebnf$3$subexpression$1"], "postprocess": id},
    {"name": "jsonfloat$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "jsonfloat$ebnf$4$subexpression$1$ebnf$1", "symbols": [/[+-]/], "postprocess": id},
    {"name": "jsonfloat$ebnf$4$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "jsonfloat$ebnf$4$subexpression$1$ebnf$2", "symbols": [/[0-9]/]},
    {"name": "jsonfloat$ebnf$4$subexpression$1$ebnf$2", "symbols": ["jsonfloat$ebnf$4$subexpression$1$ebnf$2", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "jsonfloat$ebnf$4$subexpression$1", "symbols": [/[eE]/, "jsonfloat$ebnf$4$subexpression$1$ebnf$1", "jsonfloat$ebnf$4$subexpression$1$ebnf$2"]},
    {"name": "jsonfloat$ebnf$4", "symbols": ["jsonfloat$ebnf$4$subexpression$1"], "postprocess": id},
    {"name": "jsonfloat$ebnf$4", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "jsonfloat", "symbols": ["jsonfloat$ebnf$1", "jsonfloat$ebnf$2", "jsonfloat$ebnf$3", "jsonfloat$ebnf$4"], "postprocess": 
        function(d) {
            return parseFloat(
                (d[0] || "") +
                d[1].join("") +
                (d[2] ? "."+d[2][1].join("") : "") +
                (d[3] ? "e" + (d[3][1] || "+") + d[3][2].join("") : "")
            );
        }
        },
    {"name": "sum", "symbols": ["sum", "_", "sumOperator", "_", "product"], "postprocess": 
        (data) => [data[2], data[0], data[4]]
            },
    {"name": "sum", "symbols": ["product"], "postprocess": id},
    {"name": "product", "symbols": ["product", "_", "productOperator", "_", "function"], "postprocess": 
        (data) => [data[2], data[0], data[4]]
            },
    {"name": "product", "symbols": ["function"], "postprocess": id},
    {"name": "function", "symbols": ["unaryFunction", "_", "power"], "postprocess": data => [data[0], data[2]]},
    {"name": "function", "symbols": ["power"], "postprocess": id},
    {"name": "power", "symbols": ["parenthesis", "_", "powerOperator", "_", "power"], "postprocess": 
        (data) => ['pow', data[0], data[4]]
            },
    {"name": "power", "symbols": ["parenthesis"], "postprocess": id},
    {"name": "parenthesis", "symbols": [{"literal":"("}, "sum", {"literal":")"}], "postprocess": (data) => data[1]},
    {"name": "parenthesis", "symbols": [{"literal":"["}, "sum", {"literal":"]"}], "postprocess": (data) => data[1]},
    {"name": "parenthesis", "symbols": ["literal"], "postprocess": id},
    {"name": "parenthesis", "symbols": ["literal", {"literal":"!"}], "postprocess": (data) => ['factorial', data[0]]},
    {"name": "sumOperator", "symbols": [{"literal":"+"}], "postprocess": () => 'add'},
    {"name": "sumOperator", "symbols": [{"literal":"-"}], "postprocess": () => 'sub'},
    {"name": "productOperator", "symbols": [{"literal":"*"}], "postprocess": () => 'mul'},
    {"name": "productOperator", "symbols": [{"literal":"/"}], "postprocess": () => 'div'},
    {"name": "powerOperator$string$1", "symbols": [{"literal":"*"}, {"literal":"*"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "powerOperator", "symbols": ["powerOperator$string$1"]},
    {"name": "powerOperator", "symbols": [{"literal":"^"}]},
    {"name": "unaryFunction", "symbols": ["namedFunction"], "postprocess": id},
    {"name": "unaryFunction", "symbols": [{"literal":"-"}], "postprocess": () => 'neg'},
    {"name": "namedFunction", "symbols": ["trigFunction"], "postprocess": id},
    {"name": "namedFunction$string$1", "symbols": [{"literal":"c"}, {"literal":"i"}, {"literal":"s"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "namedFunction", "symbols": ["namedFunction$string$1"]},
    {"name": "namedFunction$string$2", "symbols": [{"literal":"e"}, {"literal":"x"}, {"literal":"p"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "namedFunction", "symbols": ["namedFunction$string$2"]},
    {"name": "namedFunction$string$3", "symbols": [{"literal":"l"}, {"literal":"o"}, {"literal":"g"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "namedFunction", "symbols": ["namedFunction$string$3"]},
    {"name": "namedFunction$string$4", "symbols": [{"literal":"l"}, {"literal":"n"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "namedFunction", "symbols": ["namedFunction$string$4"], "postprocess": () => 'log'},
    {"name": "namedFunction$string$5", "symbols": [{"literal":"s"}, {"literal":"q"}, {"literal":"r"}, {"literal":"t"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "namedFunction", "symbols": ["namedFunction$string$5"]},
    {"name": "namedFunction$string$6", "symbols": [{"literal":"g"}, {"literal":"a"}, {"literal":"m"}, {"literal":"m"}, {"literal":"a"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "namedFunction", "symbols": ["namedFunction$string$6"]},
    {"name": "namedFunction$string$7", "symbols": [{"literal":"e"}, {"literal":"t"}, {"literal":"a"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "namedFunction", "symbols": ["namedFunction$string$7"]},
    {"name": "namedFunction$string$8", "symbols": [{"literal":"z"}, {"literal":"e"}, {"literal":"t"}, {"literal":"a"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "namedFunction", "symbols": ["namedFunction$string$8"]},
    {"name": "namedFunction$string$9", "symbols": [{"literal":"a"}, {"literal":"b"}, {"literal":"s"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "namedFunction", "symbols": ["namedFunction$string$9"]},
    {"name": "namedFunction$string$10", "symbols": [{"literal":"a"}, {"literal":"r"}, {"literal":"g"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "namedFunction", "symbols": ["namedFunction$string$10"]},
    {"name": "namedFunction$string$11", "symbols": [{"literal":"c"}, {"literal":"o"}, {"literal":"n"}, {"literal":"j"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "namedFunction", "symbols": ["namedFunction$string$11"]},
    {"name": "namedFunction$string$12", "symbols": [{"literal":"c"}, {"literal":"i"}, {"literal":"s"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "namedFunction", "symbols": ["namedFunction$string$12"]},
    {"name": "namedFunction$string$13", "symbols": [{"literal":"r"}, {"literal":"e"}, {"literal":"a"}, {"literal":"l"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "namedFunction", "symbols": ["namedFunction$string$13"]},
    {"name": "namedFunction$string$14", "symbols": [{"literal":"i"}, {"literal":"m"}, {"literal":"a"}, {"literal":"g"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "namedFunction", "symbols": ["namedFunction$string$14"]},
    {"name": "namedFunction$string$15", "symbols": [{"literal":"r"}, {"literal":"e"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "namedFunction", "symbols": ["namedFunction$string$15"], "postprocess": () => 'real'},
    {"name": "namedFunction$string$16", "symbols": [{"literal":"i"}, {"literal":"m"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "namedFunction", "symbols": ["namedFunction$string$16"], "postprocess": () => 'imag'},
    {"name": "baseTrigFunction$string$1", "symbols": [{"literal":"s"}, {"literal":"i"}, {"literal":"n"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "baseTrigFunction", "symbols": ["baseTrigFunction$string$1"]},
    {"name": "baseTrigFunction$string$2", "symbols": [{"literal":"c"}, {"literal":"o"}, {"literal":"s"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "baseTrigFunction", "symbols": ["baseTrigFunction$string$2"]},
    {"name": "baseTrigFunction$string$3", "symbols": [{"literal":"t"}, {"literal":"a"}, {"literal":"n"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "baseTrigFunction", "symbols": ["baseTrigFunction$string$3"]},
    {"name": "baseTrigFunction$string$4", "symbols": [{"literal":"s"}, {"literal":"e"}, {"literal":"c"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "baseTrigFunction", "symbols": ["baseTrigFunction$string$4"]},
    {"name": "baseTrigFunction$string$5", "symbols": [{"literal":"c"}, {"literal":"s"}, {"literal":"c"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "baseTrigFunction", "symbols": ["baseTrigFunction$string$5"]},
    {"name": "baseTrigFunction$string$6", "symbols": [{"literal":"c"}, {"literal":"o"}, {"literal":"t"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "baseTrigFunction", "symbols": ["baseTrigFunction$string$6"]},
    {"name": "hyperbolicTrigFunction", "symbols": ["trigFunction", {"literal":"h"}], "postprocess": (data) => data.join('')},
    {"name": "trigFunction$ebnf$1$string$1", "symbols": [{"literal":"a"}, {"literal":"r"}, {"literal":"c"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "trigFunction$ebnf$1", "symbols": ["trigFunction$ebnf$1$string$1"], "postprocess": id},
    {"name": "trigFunction$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "trigFunction", "symbols": ["trigFunction$ebnf$1", "baseTrigFunction"], "postprocess": (data) => data.join('')},
    {"name": "trigFunction", "symbols": [{"literal":"a"}, "baseTrigFunction"], "postprocess": (data) => 'arc' + data[1]},
    {"name": "trigFunction$ebnf$2$string$1", "symbols": [{"literal":"a"}, {"literal":"r"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "trigFunction$ebnf$2", "symbols": ["trigFunction$ebnf$2$string$1"], "postprocess": id},
    {"name": "trigFunction$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "trigFunction", "symbols": ["trigFunction$ebnf$2", "hyperbolicTrigFunction"], "postprocess": (data) => data.join('')},
    {"name": "literal", "symbols": ["complexNumber"], "postprocess": id},
    {"name": "literal", "symbols": ["variable"], "postprocess": id},
    {"name": "variable$ebnf$1", "symbols": [/[a-z]/]},
    {"name": "variable$ebnf$1", "symbols": ["variable$ebnf$1", /[a-z]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "variable", "symbols": ["variable$ebnf$1"], "postprocess": 
        function(data, l, reject) {
            const constants = ['e', 'pi', 'tau', 'phi'];
            const token = data[0].join('')
            if (token === 'i') {return reject;}
            return constants.includes(token) ? ['constant', token] : ['variable', token];
        }
        },
    {"name": "complexNumber", "symbols": ["decimal"], "postprocess": (data) => ['number', data[0], 0]},
    {"name": "complexNumber", "symbols": ["decimal", {"literal":"i"}], "postprocess": (data) => ['number', 0, data[0]]},
    {"name": "complexNumber", "symbols": [{"literal":"i"}], "postprocess": () => ['number', 0, 1]}
]
  , ParserStart: "sum"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
