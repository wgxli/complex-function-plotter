k = np.arange(4)
kkp = k*k/4.;

print('vec4 kz = z.y * k;')
print('vec4 kk = kkp + z.x*z.x + offset');
print('vec4 e1 = exp(kz - kk);')
print('vec4 e2 = exp(-kz - kk);')
print('series += 1./')
