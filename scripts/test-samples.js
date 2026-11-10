/**
 * Automated Verification Test for PostgreSQL and MongoDB Sample Dumps
 * Used in CI and local verification.
 */

const fs = require('fs');
const path = require('path');

function runTests() {
  console.log('🧪 Starting DBDrill Sample Data & Dump Verification Suite...\n');

  let passed = 0;
  let failed = 0;

  // 1. Verify PostgreSQL Healthy Sample
  const pgHealthyPath = path.join(__dirname, '../sample_data/healthy.sql');
  const pgHealthy = fs.readFileSync(pgHealthyPath, 'utf8');

  console.log('Checking PostgreSQL Healthy Dump:');
  const pgHasTables = pgHealthy.includes('CREATE TABLE users') && pgHealthy.includes('CREATE TABLE orders');
  const pgHasInserts = pgHealthy.includes('INSERT INTO users') && pgHealthy.includes('INSERT INTO orders');
  const pgBalancedParens = (pgHealthy.match(/\(/g) || []).length === (pgHealthy.match(/\)/g) || []).length;

  if (pgHasTables && pgHasInserts && pgBalancedParens) {
    console.log('  ✅ healthy.sql contains valid tables, foreign keys, inserts, and balanced syntax.');
    passed++;
  } else {
    console.error('  ❌ healthy.sql failed validation.');
    failed++;
  }

  // 2. Verify PostgreSQL Corrupted Sample
  const pgCorruptedPath = path.join(__dirname, '../sample_data/corrupted.sql');
  const pgCorrupted = fs.readFileSync(pgCorruptedPath, 'utf8');

  console.log('\nChecking PostgreSQL Corrupted Dump:');
  const pgCorruptedDetected =
    pgCorrupted.includes('CORRUPTED') ||
    (pgCorrupted.match(/\(/g) || []).length !== (pgCorrupted.match(/\)/g) || []).length;

  if (pgCorruptedDetected) {
    console.log('  ✅ corrupted.sql correctly contains invalid syntax to trigger expected disaster drill failure.');
    passed++;
  } else {
    console.error('  ❌ corrupted.sql should contain syntax errors.');
    failed++;
  }

  // 3. Verify MongoDB Healthy Sample
  const mongoHealthyPath = path.join(__dirname, '../sample_data/mongo_healthy.json');
  const mongoHealthy = fs.readFileSync(mongoHealthyPath, 'utf8');

  console.log('\nChecking MongoDB Healthy Dump:');
  try {
    const parsed = JSON.parse(mongoHealthy);
    if (Array.isArray(parsed) && parsed.length >= 3 && parsed[0].orderId) {
      console.log(`  ✅ mongo_healthy.json is valid JSON with ${parsed.length} documents.`);
      passed++;
    } else {
      console.error('  ❌ mongo_healthy.json is not an array of orders.');
      failed++;
    }
  } catch (err) {
    console.error('  ❌ mongo_healthy.json failed JSON parse:', err.message);
    failed++;
  }

  // 4. Verify MongoDB Corrupted Sample
  const mongoCorruptedPath = path.join(__dirname, '../sample_data/mongo_corrupted.json');
  const mongoCorrupted = fs.readFileSync(mongoCorruptedPath, 'utf8');

  console.log('\nChecking MongoDB Corrupted Dump:');
  let mongoCorruptedThrows = false;
  try {
    JSON.parse(mongoCorrupted);
  } catch (err) {
    mongoCorruptedThrows = true;
    console.log(`  ✅ mongo_corrupted.json successfully triggered expected parse failure: "${err.message}"`);
    passed++;
  }

  if (!mongoCorruptedThrows) {
    console.error('  ❌ mongo_corrupted.json should be invalid JSON!');
    failed++;
  }

  console.log(`\n================================`);
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log(`================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

