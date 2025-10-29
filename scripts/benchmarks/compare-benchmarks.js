/**
 * Compares benchmarks between Node.js and Bun
 * 
 * Run with: node compare-benchmarks.js
 */

import { spawn } from 'child_process';

async function runBenchmark(name, command, args) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Running benchmark with ${name}...\n`);
    
    const proc = spawn(command, args, {
      stdio: 'pipe',
      shell: true
    });

    let output = '';
    let error = '';

    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.stderr.on('data', (data) => {
      error += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0 && error) {
        console.error(`Error running ${name}:`, error);
      }
      resolve(output);
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

function extractResults(output) {
  const lines = output.split('\n');
  const results = {};
  
  for (const line of lines) {
    // Look for benchmark result lines
    const match = line.match(/^(.{30})\s+(\d+\.\d+)\s+ms\s+\(([\d,]+)\s+ops\/sec\)/);
    if (match) {
      const name = match[1].trim();
      const time = parseFloat(match[2]);
      const ops = parseInt(match[3].replace(/,/g, ''));
      results[name] = { time, ops };
    }
    
    // Extract runtime info
    const runtimeMatch = line.match(/^Runtime:\s+(.+)$/);
    if (runtimeMatch) {
      results.runtime = runtimeMatch[1];
    }
  }
  
  return results;
}

function compareResults(nodeResults, bunResults) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 BENCHMARK COMPARISON: Node.js vs Bun');
  console.log('='.repeat(80));
  
  console.log(`\nRuntime: ${nodeResults.runtime} vs ${bunResults.runtime}\n`);
  
  // Find all benchmark names
  const benchmarks = new Set([
    ...Object.keys(nodeResults),
    ...Object.keys(bunResults)
  ].filter(name => name !== 'runtime'));
  
  console.log('Benchmark Name                    Node.js          Bun          Winner');
  console.log('-'.repeat(80));
  
  for (const name of benchmarks) {
    const node = nodeResults[name];
    const bun = bunResults[name];
    
    if (!node || !bun) continue;
    
    const nodeStr = `${node.ops.toLocaleString().padStart(10)} ops/s`;
    const bunStr = `${bun.ops.toLocaleString().padStart(10)} ops/s`;
    
    let winner = '';
    let speedup = 0;
    
    if (bun.ops > node.ops) {
      speedup = ((bun.ops / node.ops - 1) * 100).toFixed(1);
      winner = `Bun (+${speedup}%) 🚀`;
    } else if (node.ops > bun.ops) {
      speedup = ((node.ops / bun.ops - 1) * 100).toFixed(1);
      winner = `Node (+${speedup}%) ⚡`;
    } else {
      winner = 'Tie';
    }
    
    console.log(`${name.padEnd(32)} ${nodeStr}   ${bunStr}   ${winner}`);
  }
  
  console.log('\n' + '='.repeat(80) + '\n');
}

async function main() {
  console.log('🎯 Starting benchmark comparison...\n');
  
  // Check if both runtimes are available
  try {
    const nodeOutput = await runBenchmark('Node.js', 'node', ['benchmark.js']);
    const nodeResults = extractResults(nodeOutput);
    
    const bunOutput = await runBenchmark('Bun', 'bun', ['benchmark.js']);
    const bunResults = extractResults(bunOutput);
    
    compareResults(nodeResults, bunResults);
    
    console.log('✅ Comparison complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Tip: Make sure both Node.js and Bun are installed and the project is built (npm run build)');
    process.exit(1);
  }
}

main();

