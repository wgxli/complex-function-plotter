"""Borwein series for Dirichlet eta."""
import math

N = 8

for n in range(1, N+1):
    print(f'{-math.log(n):.12f} * exp_z,')
print()

for n in range(1, N+1):
    print(f'{math.log(n):.12f} * exp_z - vec2({math.log(n):.12f}, 0),')
