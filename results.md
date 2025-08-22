RUN v1.6.1 /Users/davidsheldrick/code/patchfork

✓ test/bench2.bench.ts > shallow object clone with 1 property 4949ms
name hz min max mean p75 p99 p995 p999 rme samples
· patchfork – setIn 4,726,643.08 0.0001 0.5023 0.0002 0.0002 0.0003 0.0003 0.0006 ±0.48% 2363322
· patchfork - edit.batch 5,162,487.66 0.0000 4.4489 0.0002 0.0002 0.0003 0.0004 0.0015 ±3.85% 2581244 fastest
· immer 1,471,143.21 0.0005 0.3569 0.0007 0.0007 0.0008 0.0010 0.0023 ±0.87% 735572
· mutative 1,151,597.87 0.0006 1.1160 0.0009 0.0008 0.0010 0.0012 0.0043 ±2.68% 575799 slowest
✓ test/bench2.bench.ts > shallow object clone with 10 properties 4467ms
name hz min max mean p75 p99 p995 p999 rme samples
· patchfork – setIn 4,271,765.66 0.0001 0.5775 0.0002 0.0003 0.0003 0.0003 0.0008 ±0.92% 2135883
· patchfork - edit.batch 4,736,700.70 0.0001 0.2805 0.0002 0.0002 0.0003 0.0003 0.0006 ±0.46% 2368351 fastest
· immer 969,159.46 0.0009 0.3914 0.0010 0.0010 0.0012 0.0013 0.0031 ±0.64% 484580
· mutative 928,892.93 0.0008 1.1350 0.0011 0.0010 0.0013 0.0015 0.0055 ±2.35% 464447 slowest
✓ test/bench2.bench.ts > shallow array clone with 10 items 4151ms
name hz min max mean p75 p99 p995 p999 rme samples
· patchfork – setIn 2,754,574.56 0.0002 1.1143 0.0004 0.0003 0.0008 0.0009 0.0027 ±1.00% 1377288
· patchfork - edit.batch 4,494,393.62 0.0001 0.4313 0.0002 0.0002 0.0003 0.0003 0.0006 ±0.60% 2247197 fastest
· immer 745,128.23 0.0012 0.7148 0.0013 0.0013 0.0015 0.0017 0.0025 ±0.82% 372565 slowest
· mutative 857,866.98 0.0009 1.1947 0.0012 0.0011 0.0013 0.0015 0.0045 ±1.80% 428934
✓ test/bench2.bench.ts > shallow array clone with 10_000 items 2519ms
name hz min max mean p75 p99 p995 p999 rme samples
· patchfork – setIn 125,045.17 0.0054 0.7405 0.0080 0.0060 0.1643 0.1724 0.2517 ±1.95% 62523
· patchfork - edit.batch 134,023.94 0.0053 0.3224 0.0075 0.0058 0.1619 0.1675 0.1874 ±1.74% 67012 fastest
· immer 7,560.20 0.1258 0.6060 0.1323 0.1280 0.3693 0.3945 0.5127 ±0.81% 3781 slowest
· mutative 105,993.09 0.0063 0.4614 0.0094 0.0071 0.1866 0.1946 0.2592 ±1.91% 52997
✓ test/bench2.bench.ts > deep object clone 2666ms
name hz min max mean p75 p99 p995 p999 rme samples
· patchfork – setIn 528,775.63 0.0017 0.0386 0.0019 0.0019 0.0020 0.0021 0.0023 ±0.05% 264388
· patchfork - edit.batch 534,847.77 0.0017 0.5075 0.0019 0.0018 0.0020 0.0021 0.0033 ±0.52% 267424 fastest
· immer 64,311.38 0.0146 0.7669 0.0155 0.0152 0.0190 0.0214 0.1247 ±0.80% 32156 slowest
· mutative 78,039.86 0.0107 1.9781 0.0128 0.0114 0.0164 0.0180 0.9253 ±3.00% 39020
✓ test/bench2.bench.ts > marking a todo as completed 3152ms
name hz min max mean p75 p99 p995 p999 rme samples
· patchfork – setIn 1,677,616.82 0.0005 0.5580 0.0006 0.0006 0.0007 0.0009 0.0012 ±0.91% 838992
· patchfork - edit.batch 1,779,236.98 0.0004 1.2274 0.0006 0.0005 0.0007 0.0009 0.0027 ±1.33% 889619 fastest
· immer 93,053.92 0.0102 0.5635 0.0107 0.0106 0.0116 0.0126 0.0238 ±0.53% 46527 slowest
· mutative 345,887.74 0.0023 1.4536 0.0029 0.0026 0.0030 0.0032 0.0064 ±2.85% 172944
✓ test/bench2.bench.ts > marking four todos as completed and changing the filter 2623ms
name hz min max mean p75 p99 p995 p999 rme samples
· patchfork – setIn 363,855.19 0.0025 0.6570 0.0027 0.0027 0.0030 0.0032 0.0060 ±0.84% 181928
· patchfork - edit.batch 402,501.04 0.0022 13.8373 0.0025 0.0024 0.0030 0.0047 0.0081 ±5.46% 201251 fastest
· immer 62,223.89 0.0156 0.3794 0.0161 0.0159 0.0177 0.0194 0.0327 ±0.34% 31112 slowest
· mutative 132,517.65 0.0063 1.7489 0.0075 0.0068 0.0113 0.0122 0.0530 ±2.73% 66260
✓ test/bench2.bench.ts > shallow Map clone with 5 elements 3572ms
name hz min max mean p75 p99 p995 p999 rme samples
· patchfork – setIn 2,189,438.20 0.0003 0.3099 0.0005 0.0005 0.0005 0.0007 0.0010 ±0.73% 1094720
· patchfork - edit.batch 2,344,261.49 0.0003 0.3547 0.0004 0.0004 0.0005 0.0007 0.0010 ±0.84% 1172131 fastest
· immer 816,222.35 0.0011 0.2699 0.0012 0.0012 0.0014 0.0015 0.0023 ±0.56% 408112
· mutative 791,733.33 0.0010 1.3140 0.0013 0.0011 0.0015 0.0017 0.0060 ±2.17% 395867 slowest
✓ test/bench2.bench.ts > shallow Map clone with 10,000 elements 2431ms
name hz min max mean p75 p99 p995 p999 rme samples
· patchfork – setIn 1,491.51 0.5497 3.5639 0.6705 0.6253 1.7562 1.9458 3.5639 ±2.58% 746
· patchfork - edit.batch 1,515.12 0.5432 4.3754 0.6600 0.6119 1.7400 1.8268 4.3754 ±2.77% 758 fastest
· immer 902.66 0.9958 2.6889 1.1078 1.0628 2.0346 2.3067 2.6889 ±1.91% 452 slowest
· mutative 1,453.03 0.5565 3.5819 0.6882 0.6323 2.0832 2.8810 3.5819 ±3.19% 727
✓ test/bench2.bench.ts > shallow Set clone with 5 elements 2722ms
name hz min max mean p75 p99 p995 p999 rme samples
· patchfork - edit.batch 4,074,648.61 0.0001 0.5376 0.0002 0.0003 0.0003 0.0003 0.0007 ±0.49% 2037325 fastest
· immer 427,901.22 0.0021 0.6732 0.0023 0.0023 0.0026 0.0028 0.0059 ±0.98% 213951 slowest
· mutative 596,673.68 0.0013 0.9957 0.0017 0.0015 0.0019 0.0020 0.0049 ±2.07% 298603
✓ test/bench2.bench.ts > shallow Set clone with 10,000 elements 1833ms
name hz min max mean p75 p99 p995 p999 rme samples
· patchfork - edit.batch 6,200.90 0.0698 7.3361 0.1613 0.1226 2.3023 2.8975 5.2543 ±8.03% 3101 fastest
· immer 325.18 2.8720 5.4922 3.0752 2.9993 5.2310 5.4922 5.4922 ±2.19% 163 slowest
· mutative 770.29 1.0859 2.6527 1.2982 1.2067 2.6211 2.6447 2.6527 ±2.93% 386
✓ test/bench2.bench.ts > complex nested structure with Maps and Sets using mutate 1868ms
name hz min max mean p75 p99 p995 p999 rme samples
· patchfork - mutate 183,479.44 0.0050 0.7203 0.0055 0.0053 0.0085 0.0104 0.0175 ±0.87% 91740 fastest
· immer 42,159.24 0.0225 0.6992 0.0237 0.0230 0.0277 0.0322 0.4547 ±1.02% 21080 slowest
· mutative 46,321.33 0.0176 2.3060 0.0216 0.0194 0.0287 0.0432 1.4710 ±3.65% 23161

BENCH Summary

patchfork - edit.batch - test/bench2.bench.ts > shallow object clone with 1 property
1.09x faster than patchfork – setIn
3.51x faster than immer
4.48x faster than mutative

patchfork - edit.batch - test/bench2.bench.ts > shallow object clone with 10 properties
1.11x faster than patchfork – setIn
4.89x faster than immer
5.10x faster than mutative

patchfork - edit.batch - test/bench2.bench.ts > shallow array clone with 10 items
1.63x faster than patchfork – setIn
5.24x faster than mutative
6.03x faster than immer

patchfork - edit.batch - test/bench2.bench.ts > shallow array clone with 10_000 items
1.07x faster than patchfork – setIn
1.26x faster than mutative
17.73x faster than immer

patchfork - edit.batch - test/bench2.bench.ts > deep object clone
1.01x faster than patchfork – setIn
6.85x faster than mutative
8.32x faster than immer

patchfork - edit.batch - test/bench2.bench.ts > marking a todo as completed
1.06x faster than patchfork – setIn
5.14x faster than mutative
19.12x faster than immer

patchfork - edit.batch - test/bench2.bench.ts > marking four todos as completed and changing the filter
1.11x faster than patchfork – setIn
3.04x faster than mutative
6.47x faster than immer

patchfork - edit.batch - test/bench2.bench.ts > shallow Map clone with 5 elements
1.07x faster than patchfork – setIn
2.87x faster than immer
2.96x faster than mutative

patchfork - edit.batch - test/bench2.bench.ts > shallow Map clone with 10,000 elements
1.02x faster than patchfork – setIn
1.04x faster than mutative
1.68x faster than immer

patchfork - edit.batch - test/bench2.bench.ts > shallow Set clone with 5 elements
6.83x faster than mutative
9.52x faster than immer

patchfork - edit.batch - test/bench2.bench.ts > shallow Set clone with 10,000 elements
8.05x faster than mutative
19.07x faster than immer

patchfork - mutate - test/bench2.bench.ts > complex nested structure with Maps and Sets using mutate
3.96x faster than mutative
4.35x faster than immer
