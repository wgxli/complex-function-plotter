import math
import numpy as np

def f(z):
    # Maximize Im(gamma(z)) by minimizing cz + d.
    coeffs = np.array([1, 0, 0, 1])
    a = np.array([z.real, z.imag])
    b = np.array([1., 0])
    for i in range(32):
        mu = round(np.dot(a, b) / np.dot(b, b))
        a -= mu * b
        coeffs[:2] -= mu * coeffs[2:]
        print(a, b, coeffs)

        mu = round(np.dot(a, b) / np.dot(a, a))
        b -= mu * a
        coeffs[2:] -= mu * coeffs[:2]

        print(a, b, coeffs)

    w1 = coeffs[0] * z + coeffs[1]
    w2 = coeffs[2] * z + coeffs[3]
    print(abs(w1), abs(w2))
    return coeffs



