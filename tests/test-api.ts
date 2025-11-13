/**
 * Test script for API integrations
 * Tests Claude API and Whisper API connections
 */

import { testClaudeConnection, generateText, analyzeImage } from '../lib/ai/claude-client';
import { testWhisperConnection } from '../lib/ai/whisper-client';

async function testAPIs() {
  console.log('='.repeat(60));
  console.log('ViralMommy API Integration Tests');
  console.log('='.repeat(60));
  console.log();

  // Test 1: Claude API Connection
  console.log('Test 1: Claude API Connection');
  console.log('-'.repeat(60));
  try {
    const claudeConnected = await testClaudeConnection();
    console.log(`Status: ${claudeConnected ? '✓ PASSED' : '✗ FAILED'}`);
  } catch (error) {
    console.error('Error:', error);
    console.log('Status: ✗ FAILED');
  }
  console.log();

  // Test 2: Claude Text Generation
  console.log('Test 2: Claude Text Generation');
  console.log('-'.repeat(60));
  try {
    const result = await generateText(
      'Write a 2-sentence viral video hook for a mom creator sharing a diaper organization hack.',
      'You are a viral content expert for mom creators.'
    );
    console.log('Generated text:', result.text);
    console.log(`Cost: $${result.usage.estimatedCost.toFixed(4)}`);
    console.log('Status: ✓ PASSED');
  } catch (error) {
    console.error('Error:', error);
    console.log('Status: ✗ FAILED');
  }
  console.log();

  // Test 3: Claude Vision API (with sample base64 image)
  console.log('Test 3: Claude Vision API');
  console.log('-'.repeat(60));
  try {
    // Create a simple 1x1 red pixel PNG (base64)
    const sampleImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

    const result = await analyzeImage(
      sampleImage,
      'Describe what you see in this image in one sentence.'
    );
    console.log('Analysis:', result.analysis);
    console.log(`Cost: $${result.usage.estimatedCost.toFixed(4)}`);
    console.log('Status: ✓ PASSED');
  } catch (error) {
    console.error('Error:', error);
    console.log('Status: ✗ FAILED');
  }
  console.log();

  // Test 4: Whisper API Connection
  console.log('Test 4: Whisper API Connection');
  console.log('-'.repeat(60));
  try {
    const whisperConnected = await testWhisperConnection();
    console.log(`Status: ${whisperConnected ? '✓ PASSED' : '✗ FAILED'}`);
  } catch (error) {
    console.error('Error:', error);
    console.log('Status: ✗ FAILED');
  }
  console.log();

  console.log('='.repeat(60));
  console.log('All API tests completed!');
  console.log('='.repeat(60));
}

// Run tests
testAPIs().catch(console.error);
