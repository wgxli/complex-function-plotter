"""Borwein series for Dirichlet eta."""
import math
from scipy.special import factorial as fact

n = 16

d = [n * sum(fact(n+l-1) * 4**l / (fact(n-l) * fact(2*l)) for l in range(k+1)) for k in range(n+1)]
print(d)

coefficients = [((-1)**k * (d[n] - d[k]))/d[n] for k in range(n)]
print(coefficients)

print('positives:')
for k in range(0, n, 2):
    print(f'{-math.log(k+1):.12f} * exp_z + vec2({math.log(coefficients[k]):.12f}, 0.),')
print()

print('negatives:')
for k in range(1, n, 2):
    print(f'{-math.log(k+1):.12f} * exp_z + vec2({math.log(-coefficients[k]):.12f}, 0.),')
