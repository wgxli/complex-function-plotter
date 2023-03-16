"""Borwein series for Dirichlet eta."""
import math
import numpy as np

ns = 2 + 16*1 + np.arange(16)
print('mat4(' + ','.join(f'{x:.0f}.' for x in ns) + '),')
print('mat4(' + ','.join(f'-{x:.12f}' for x in np.log(ns)) + ')')
