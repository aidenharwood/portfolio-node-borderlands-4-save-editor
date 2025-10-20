# Manual Testing Results

Please test each serial at: https://borderlands4-deserializer.nicnl.com/

## Serial 1: @Ugr%Scm/%Dy!t/Y>M^&nQZ9u!5Q2S`+$e>05
**Nicnl Output:** 
```
321, 0, 1, 28| 2, 2493|| {7} {10} {246:22} {237:9} {246:[51 3]} {6}|
```

**Analysis:**
- Parts section starts at bit 92
- 6 parts: {7} {10} {246:22} {237:9} {246:[51 3]} {6}
- Chunk patterns: none, none, single, single, array(2), none

---

## Serial 2: @Ugr$fEm/%P$!bk(PLUrm>VNhdGXHct9=^Fq
**Nicnl Output:** 
```
(PASTE HERE)
```

**Binary:**
- Parts section starts at bit 87

---

## Serial 3: @Uga`vnFoFnUeS-d?3iYUcs7>ub<wBK1okIW
**Nicnl Output:** 
```
(PASTE HERE)
```

---

## Serial 4: @UgdhV<Fme!Kpj6O0RG}8tsNq8CP&HAL`qWKS9n>FGAJi+<FH}zi
**Nicnl Output:** 
```
(PASTE HERE)
```

---

## Serial 5: @UgwSAs2}T1VOz#USjp~P5)S(jfsJ*DNsIaI@g+bLpr9!Pj^+J_H00
**Nicnl Output:** 
```
(PASTE HERE)
```

---

## Pattern Analysis

Once you've pasted all outputs above, we can look for patterns:

1. **Part count encoding** - How is the number of parts stored?
2. **Chunk flags** - How does it indicate which parts have chunks?
3. **Array vs single** - How to differentiate {id:value} from {id:[values]}?
4. **Metadata location** - Where is the chunk metadata relative to IDs?

### Hypothesis to Test:
Looking at Serial 1 (6 parts, starts bit 92) and Serial 2 (unknown parts, starts bit 87):
- The starting bit varies (92 vs 87) = 5 bit difference
- Serial 1 random seed = 2493 (15-bit varint5)
- Serial 2 random seed = 98 (10-bit varint5)
- Difference: 5 bits, which matches the parts start difference!

This confirms parts start immediately after fields end marker (000).
