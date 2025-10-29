# Benchmark Results

## How to Run

```bash
# Node.js
npm run benchmark

# Bun
npm run benchmark:bun
```

## Expected Results

### Target Performance
- **syntrojs-logger**: Similar or faster than Pino
- **Node.js**: ~100k+ ops/sec
- **Bun**: ~200k+ ops/sec

### Why It Should Be Fast

1. **Minimal overhead**: Simple object creation
2. **No string formatting**: JSON.stringify only when needed
3. **Quick level filtering**: Numeric comparison
4. **Single dependency**: Only chalk for colors
5. **Sync operations**: No async overhead

## Comparison Points

| Feature | syntrojs-logger | Pino |
|---------|----------------|------|
| Bundle Size | ~15 KB | ~20 KB |
| Dependencies | 1 (chalk) | 5 |
| Async Context | ✅ Built-in | ❌ Manual |
| Correlation ID | ✅ Auto | ❌ Manual |
| Custom Transports | ✅ Easy | ⚠️ Complex |

Performance is just one metric. **syntrojs-logger** offers more features with similar speed.

