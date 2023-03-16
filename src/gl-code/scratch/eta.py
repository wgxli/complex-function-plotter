"""Borwein series for Dirichlet eta."""
import math
import numpy as np
from scipy.special import factorial as fact

n = 49

d = [n * sum(fact(n+l-1) * 4**l / (fact(n-l) * fact(2*l)) for l in range(k+1)) for k in range(n+1)]

coefficients = [((-1)**k * (d[n] - d[k]))/d[n] for k in range(n)]

coefficients = np.array(coefficients)[1:]
ns = np.arange(n+1)[2:]

for i in [0, 16, 32]:
    print('mat4(' + ','.join(f'-{x:.14f}' for x in np.log(ns[i:i+16])) + '),')
    print('mat4(' + ','.join(f'{x:.14f}' for x in coefficients[i:i+16]) + '));')
    print()
