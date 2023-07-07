To add a function:
- Add syntax to `grammar.ne` and compile grammar.
- Write definition in `complex-functions.js` and add to function list at bottom.
- Add JS implementation in `translators/to-js.js`.
- (If applicable) add derivative rules in `translators/derivative.js`.
- (If applicable) add optimizations to `translators/compiler.js`.

There are two separate number systems in use; the `vec2` system `x + iy`, and the `vec3` system `e^z (x + iy)`. Functions may have two different definitions in each system (the first for `vec2`, and the second for `vec3`). The `VEC_TYPE` declaration is automatically set to the appropriate type.

In the `vec3` system, addition and subtraction must be done with the appropriately named functions unless `z = 0` (the number is 'downconverted'). Be careful about downconversion, as it results in a loss of range. The definitions of `cadd`, `cadd4`, `cadd8` treat this properly.
Note that `cmul`, `cdiv`, `creciprocal` preserve downconverted-ness. Output of `clog` is already downconverted.
