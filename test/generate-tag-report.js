#!/usr/bin/env node

/**
 * Party Collection Test Intelligence Dashboard Generator
 * 
 * Generates comprehensive HTML test intelligence reports with advanced analytics
 * Includes code metrics, step coverage analysis, performance insights, and tag-based breakdowns
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const CONFIG = {
  environments: {
    local: {
      apiUrl: 'http://localhost:3001',
      frontendUrl: 'http://localhost:3000',
      reportDir: 'reports/local',
      cucumberJson: 'reports/cucumber-report.json'
    },
    dev: {
      apiUrl: process.env.DEV_API_URL || 'https://api-dev.yourpartycollection.com',
      frontendUrl: process.env.DEV_FRONTEND_URL || 'https://dev.yourpartycollection.com',
      reportDir: 'reports/dev',
      cucumberJson: 'reports/cucumber-report.json'
    },
    prod: {
      apiUrl: process.env.PROD_API_URL || 'https://api.yourpartycollection.com', 
      frontendUrl: process.env.PROD_FRONTEND_URL || 'https://yourpartycollection.com',
      reportDir: 'reports/prod',
      cucumberJson: 'reports/cucumber-report.json'
    }
  }
};

class TagBasedTestReportGenerator {
  constructor(environment = 'local') {
    this.env = environment;
    this.config = CONFIG.environments[environment];
    this.timestamp = new Date().toISOString();
    this.reportId = this.timestamp.replace(/[:.]/g, '-');
    this.cpuCores = os.cpus().length;
    
    // Create report directories
    this.setupDirectories();
  }

  setupDirectories() {
    const reportDir = path.resolve(__dirname, this.config.reportDir);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
  }

  // Parse existing cucumber JSON report
  parseCucumberResults() {
    const cucumberJsonPath = path.resolve(__dirname, this.config.cucumberJson);
    
    if (!fs.existsSync(cucumberJsonPath)) {
      throw new Error(`Cucumber JSON report not found at ${cucumberJsonPath}. Please run tests first with: npm test`);
    }

    console.log(`📊 Analyzing cucumber results from ${cucumberJsonPath}...`);
    
    const rawData = fs.readFileSync(cucumberJsonPath, 'utf8');
    const features = JSON.parse(rawData);
    
    return this.analyzeFeaturesByTags(features);
  }

  analyzeFeaturesByTags(features) {
    const tagStats = new Map();
    const featureStats = [];
    const stepCoverage = new Map(); // Track step definition usage
    const stepTypes = new Map(); // Track step keyword usage (Given, When, Then)
    let totalScenarios = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let totalSkipped = 0;
    let totalSteps = 0;
    let totalDuration = 0;

    for (const feature of features) {
      const featureStat = {
        name: feature.name,
        uri: feature.uri,
        scenarios: [],
        tags: feature.tags ? feature.tags.map(t => t.name) : [],
        passed: 0,
        failed: 0,
        skipped: 0,
        total: 0,
        duration: 0
      };

      // Process scenarios
      for (const element of feature.elements || []) {
        if (element.type === 'scenario') {
          const scenario = {
            name: element.name,
            tags: element.tags ? element.tags.map(t => t.name) : [],
            status: 'passed',
            duration: 0,
            steps: element.steps ? element.steps.length : 0,
            errors: []
          };

          // All tags for this scenario (feature + scenario tags)
          const allTags = [...featureStat.tags, ...scenario.tags];
          scenario.allTags = [...new Set(allTags)]; // Remove duplicates

          // Calculate scenario status and duration
          let scenarioPassed = true;
          for (const step of element.steps || []) {
            // Track step coverage and types
            if (step.match && step.match.location) {
              const location = step.match.location;
              stepCoverage.set(location, (stepCoverage.get(location) || 0) + 1);
            }
            
            if (step.keyword && !step.hidden) {
              const keyword = step.keyword.trim();
              stepTypes.set(keyword, (stepTypes.get(keyword) || 0) + 1);
            }
            
            if (step.result) {
              scenario.duration += step.result.duration || 0;
              if (step.result.status === 'failed') {
                scenarioPassed = false;
                scenario.errors.push({
                  step: step.name,
                  error: step.result.error_message || 'Unknown error'
                });
              } else if (step.result.status === 'skipped') {
                if (scenarioPassed) scenario.status = 'skipped';
              }
            }
            totalSteps++;
          }

          if (!scenarioPassed) {
            scenario.status = 'failed';
          } else if (scenario.status !== 'skipped') {
            scenario.status = 'passed';
          }

          // Update feature stats
          featureStat.total++;
          featureStat.duration += scenario.duration;
          if (scenario.status === 'passed') featureStat.passed++;
          else if (scenario.status === 'failed') featureStat.failed++;
          else featureStat.skipped++;

          // Update tag stats
          for (const tag of scenario.allTags) {
            if (!tagStats.has(tag)) {
              tagStats.set(tag, { total: 0, passed: 0, failed: 0, skipped: 0, scenarios: [] });
            }
            const tagStat = tagStats.get(tag);
            tagStat.total++;
            tagStat.scenarios.push(scenario);
            if (scenario.status === 'passed') tagStat.passed++;
            else if (scenario.status === 'failed') tagStat.failed++;
            else tagStat.skipped++;
          }

          featureStat.scenarios.push(scenario);
          totalScenarios++;
          if (scenario.status === 'passed') totalPassed++;
          else if (scenario.status === 'failed') totalFailed++;
          else totalSkipped++;
          totalDuration += scenario.duration;
        }
      }

      featureStats.push(featureStat);
    }

    // Process step coverage for display
    const topStepDefinitions = Array.from(stepCoverage.entries())
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    const stepTypeStats = Object.fromEntries(stepTypes);

    return {
      features: featureStats,
      tags: Object.fromEntries(tagStats),
      stepCoverage: {
        topStepDefinitions,
        stepTypes: stepTypeStats,
        totalUnique: stepCoverage.size
      },
      overall: {
        scenarios: totalScenarios,
        passed: totalPassed,
        failed: totalFailed,
        skipped: totalSkipped,
        steps: totalSteps,
        duration: totalDuration
      }
    };
  }

  // Generate performance insights
  generatePerformanceInsights(testResults) {
    const insights = {
      slowTests: [],
      fastTests: [],
      criticalTags: [],
      improvementAreas: [],
      regressions: []
    };

    // Identify slow vs fast tests based on duration
    const allScenarios = testResults.features.flatMap(f => f.scenarios);
    const avgDuration = testResults.overall.duration / testResults.overall.scenarios;
    
    insights.slowTests = allScenarios
      .filter(s => s.duration > avgDuration * 2)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);
    
    insights.fastTests = allScenarios
      .filter(s => s.duration < avgDuration * 0.5)
      .sort((a, b) => a.duration - b.duration)
      .slice(0, 5);

    // Critical tags (tags with failures)
    insights.criticalTags = Object.entries(testResults.tags)
      .filter(([tag, stats]) => stats.failed > 0)
      .sort((a, b) => b[1].failed - a[1].failed)
      .map(([tag, stats]) => ({
        tag,
        failures: stats.failed,
        total: stats.total,
        failRate: (stats.failed / stats.total * 100).toFixed(1)
      }));

    // Improvement areas
    if (insights.criticalTags.length === 0) {
      insights.improvementAreas.push('✅ All tests passing - consider adding edge case coverage');
    } else {
      insights.improvementAreas.push(`🔥 Focus on ${insights.criticalTags[0].tag} tag (${insights.criticalTags[0].failures} failures)`);
    }

    if (insights.slowTests.length > 3) {
      insights.improvementAreas.push(`⚡ Optimize ${insights.slowTests.length} slow tests for better CI performance`);
    }

    // Check for coverage gaps
    const commonTags = ['@login', '@auth', '@survey', '@admin', '@backend', '@frontend'];
    const missingTags = commonTags.filter(tag => !testResults.tags[tag]);
    if (missingTags.length > 0) {
      insights.improvementAreas.push(`📊 Consider adding tests for: ${missingTags.join(', ')}`);
    }

    return insights;
  }

  // Generate tag relationships
  generateTagRelationships(testResults) {
    const relationships = new Map();
    
    testResults.features.forEach(feature => {
      feature.scenarios.forEach(scenario => {
        if (scenario.status === 'failed' && scenario.allTags.length > 1) {
          const tagCombination = scenario.allTags.sort().join(' + ');
          if (!relationships.has(tagCombination)) {
            relationships.set(tagCombination, { count: 0, scenarios: [] });
          }
          const rel = relationships.get(tagCombination);
          rel.count++;
          rel.scenarios.push(scenario.name);
        }
      });
    });

    return Array.from(relationships.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);
  }

  // Generate code metrics
  async generateCodeMetrics() {
    console.log('📊 Generating code metrics...');
    
    const projectRoot = path.join(__dirname, '..');
    const frontendPath = path.join(projectRoot, 'frontend/src');
    const backendPath = path.join(projectRoot, 'backend/src');
    
    const metrics = {
      frontend: { code: 0, test: 0, files: 0 },
      backend: { code: 0, test: 0, files: 0 },
      tests: { code: 0, test: 0, files: 0 },
      total: { code: 0, test: 0, files: 0 }
    };

    try {
      // Frontend code (excluding tests)
      metrics.frontend = await this.countLinesInDirectory(
        frontendPath,
        ['*.tsx', '*.ts', '*.js', '*.jsx'],
        ['**/node_modules/**']
      );

      // Backend code  
      metrics.backend = await this.countLinesInDirectory(
        backendPath,
        ['*.ts', '*.js'],
        ['**/node_modules/**']
      );

      // Unified test suite
      metrics.tests = await this.countLinesInDirectory(
        __dirname,
        ['*.feature', '*.js'],
        ['**/node_modules/**', '**/reports/**']
      );

      // Calculate totals - combine frontend and backend code, separate test code
      metrics.total.code = metrics.frontend.code + metrics.backend.code;
      metrics.total.test = metrics.tests.test; // Only actual test code
      metrics.total.files = metrics.frontend.files + metrics.backend.files + metrics.tests.files;

    } catch (error) {
      console.warn('Warning: Error generating code metrics:', error.message);
    }

    return metrics;
  }

  async countLinesInDirectory(dirPath, includes, excludes = []) {
    const stats = { code: 0, test: 0, files: 0 };
    
    if (!fs.existsSync(dirPath)) {
      return stats;
    }

    try {
      this.walkDirectory(dirPath, stats, includes, excludes);
    } catch (error) {
      console.warn(`Warning: Error counting lines in ${dirPath}:`, error.message);
    }

    return stats;
  }

  walkDirectory(dir, stats, includes, excludes) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(dir, fullPath);
        
        // Skip node_modules and reports directories entirely
        if (entry.name === 'node_modules' || entry.name === 'reports') {
          continue;
        }
        
        // Check other excludes
        if (excludes.some(pattern => this.matchesGlob(relativePath, pattern))) {
          continue;
        }
        
        if (entry.isDirectory()) {
          this.walkDirectory(fullPath, stats, includes, excludes);
        } else if (includes.some(pattern => this.matchesExtension(entry.name, pattern))) {
          this.countLinesInFile(fullPath, stats);
          stats.files++;
        }
      }
    } catch (error) {
      // Skip directories that can't be read
      console.warn(`Warning: Cannot read directory ${dir}:`, error.message);
    }
  }

  matchesExtension(filename, pattern) {
    // Simple extension matching (e.g., "*.ts" matches "file.ts")
    if (pattern.startsWith('*.')) {
      const ext = pattern.substring(1); // Remove "*" to get ".ts"
      return filename.endsWith(ext);
    }
    // Fallback to simple glob matching
    const regex = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\./g, '\\.');
    return new RegExp(`^${regex}$`).test(filename);
  }

  matchesGlob(filename, pattern) {
    // Simple glob matching for common patterns
    const regex = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\./g, '\\.');
    return new RegExp(`^${regex}$`).test(filename);
  }

  countLinesInFile(filePath, stats) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        // Only skip completely empty lines
        if (trimmed.length === 0) continue;
        
        // Count all non-empty lines (including comments for documentation value)
        // If we're in the test directory (__dirname), everything counts as test code
        if (filePath.startsWith(__dirname)) {
          stats.test++;
        } else {
          stats.code++;
        }
      }
    } catch (err) {
      // Skip files that can't be read
    }
  }

  isCommentLine(line, filePath) {
    // JavaScript/TypeScript comments
    if (filePath.match(/\.(js|ts|tsx|jsx)$/)) {
      return line.startsWith('//') || line.startsWith('/*') || line.startsWith('*');
    }
    
    // Cucumber Feature files
    if (filePath.endsWith('.feature')) {
      return line.startsWith('#');
    }
    
    return false;
  }

  // Main generation method
  async generate() {
    console.log(`🚀 Generating Test Intelligence Dashboard from latest test results for ${this.env} environment...`);
    
    // Parse existing cucumber results instead of running tests
    const testResults = this.parseCucumberResults();
    
    // Generate code metrics
    const codeMetrics = await this.generateCodeMetrics();
    
    // Generate performance insights
    const performanceInsights = this.generatePerformanceInsights(testResults);
    
    // Generate tag relationships
    const tagRelationships = this.generateTagRelationships(testResults);
    
    // Generate combined results
    const combinedResults = this.generateCombinedResults(testResults, codeMetrics, performanceInsights, tagRelationships);
    
    // Generate HTML report
    const reportPath = this.generateHTMLReport(combinedResults);
    
    // Clean up old reports
    this.cleanupOldReports();
    
    console.log(`✅ Test Intelligence Dashboard generated successfully!`);
    console.log(`📊 Overall: ${combinedResults.overall.passed}/${combinedResults.overall.scenarios} scenarios passed`);
    console.log(`🏷️  Found ${Object.keys(combinedResults.testResults.tags).length} unique tags`);
    console.log(`⚡ Performance: ${combinedResults.performanceInsights.slowTests.length} slow tests, ${combinedResults.performanceInsights.criticalTags.length} critical tags`);
    console.log(`🔗 Relationships: ${combinedResults.tagRelationships.length} failing tag combinations found`);
    console.log(`📁 Latest report: ${reportPath}`);
    console.log(`🌐 Open in browser: file://${path.resolve(reportPath)}`);
    console.log(`📚 Previous reports automatically linked in navigation`);
    
    // Output actionable insights to console
    if (combinedResults.performanceInsights.improvementAreas.length > 0) {
      console.log(`\n💡 Action Items:`);
      combinedResults.performanceInsights.improvementAreas.forEach(area => {
        console.log(`   ${area}`);
      });
    }
    
    return reportPath;
  }

  formatDuration(nanoseconds) {
    const seconds = nanoseconds / 1000000000;
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(1)}s`;
  }

  getMostUsedTag(tags) {
    let maxCount = 0;
    let mostUsedTag = 'N/A';
    for (const [tag, stats] of Object.entries(tags)) {
      if (stats.total > maxCount) {
        maxCount = stats.total;
        mostUsedTag = tag;
      }
    }
    return `${mostUsedTag} (${maxCount})`;
  }

  generateCombinedResults(testResults, codeMetrics, performanceInsights, tagRelationships) {
    return {
      timestamp: this.timestamp,
      environment: this.env,
      testResults,
      codeMetrics,
      performanceInsights,
      tagRelationships,
      overall: testResults.overall
    };
  }

  generateHTMLReport(results) {
    // Get previous reports for navigation
    const previousReports = this.getPreviousReports();
    const reportContent = this.generateHTMLContent(results, previousReports);
    
    // Save timestamped report
    const reportPath = path.join(__dirname, this.config.reportDir, `test-intelligence-${this.reportId}.html`);
    fs.writeFileSync(reportPath, reportContent);
    
    // Create static latest report with navigation
    const latestPath = path.join(__dirname, this.config.reportDir, 'index.html');
    fs.writeFileSync(latestPath, reportContent);
    
    return latestPath;
  }

  getPreviousReports() {
    try {
      const reportDir = path.join(__dirname, this.config.reportDir);
      return fs.readdirSync(reportDir)
        .filter(file => (file.startsWith('tag-report-') || file.startsWith('test-intelligence-')) && file.endsWith('.html') && !file.includes('latest'))
        .map(file => {
          const filePath = path.join(reportDir, file);
          const stats = fs.statSync(filePath);
          const timestamp = file.replace(/^(tag-report-|test-intelligence-)/, '').replace('.html', '');
          
          // Parse the timestamp format: 2025-08-27T15-57-59-785Z
          const dateStr = timestamp.replace(/T(\d+)-(\d+)-(\d+)-(\d+)Z/, 'T$1:$2:$3.$4Z');
          const date = new Date(dateStr);
          
          return {
            filename: file,
            timestamp,
            date: date.toLocaleString(),
            size: Math.round(stats.size / 1024) + ' KB'
          };
        })
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(0, 7); // Keep only latest 7
    } catch (error) {
      return [];
    }
  }

  generateHTMLContent(results, previousReports = []) {
    const { testResults, codeMetrics, performanceInsights, tagRelationships, overall } = results;
    const passRate = overall.scenarios > 0 ? 
      ((overall.passed / overall.scenarios) * 100).toFixed(1) : 0;
    
    // Sort tags by failure rate and total scenarios
    const sortedTags = Object.entries(testResults.tags)
      .map(([tag, stats]) => ({
        name: tag,
        ...stats,
        failRate: stats.total > 0 ? (stats.failed / stats.total * 100).toFixed(1) : 0
      }))
      .sort((a, b) => {
        // Sort by failure rate first (descending), then by total scenarios (descending)
        if (b.failed !== a.failed) return b.failed - a.failed;
        return b.total - a.total;
      });
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Party Collection - Test Intelligence Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f7fa; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 12px; margin-bottom: 30px; }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { font-size: 1.2em; opacity: 0.9; }
        .stats-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 15px; margin-bottom: 30px; }
        .stat-number { font-size: 2.5em; font-weight: bold; margin-bottom: 5px; }
        .stat-number.success { color: #4CAF50; }
        .stat-number.warning { color: #FF9800; }
        .stat-number.error { color: #f44336; }
        .stat-label { color: #666; font-size: 0.9em; }
        
        .tags-section { background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin-bottom: 30px; }
        .tag-item { display: flex; justify-content: space-between; align-items: center; padding: 15px; margin-bottom: 10px; border-radius: 8px; border-left: 4px solid #ddd; background: #fafafa; }
        .tag-item.has-failures { border-left-color: #f44336; background: #fff8f8; }
        .tag-item.success { border-left-color: #4CAF50; background: #f8fff8; }
        .tag-name { font-weight: bold; color: #333; }
        .tag-stats { display: flex; gap: 15px; font-size: 0.9em; }
        .tag-stat { display: flex; flex-direction: column; align-items: center; }
        .tag-stat-number { font-weight: bold; }
        .tag-stat-label { font-size: 0.8em; color: #666; }
        
        .features-section { background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin-bottom: 30px; }
        .feature-item { margin-bottom: 20px; border-left: 4px solid #ddd; padding: 15px; border-radius: 0 8px 8px 0; background: #fafafa; }
        .feature-item.has-failures { border-left-color: #f44336; background: #fff8f8; }
        .feature-item.success { border-left-color: #4CAF50; background: #f8fff8; }
        .feature-name { font-size: 1.2em; font-weight: bold; margin-bottom: 10px; }
        .feature-stats { display: flex; gap: 15px; margin-bottom: 10px; font-size: 0.9em; }
        .feature-tags { margin-bottom: 10px; }
        .tag-badge { background: #e3f2fd; color: #1976d2; padding: 2px 8px; border-radius: 12px; font-size: 0.7em; margin-right: 5px; }
        .failure-details { background: #ffebee; border-left: 4px solid #f44336; padding: 10px; margin-top: 10px; border-radius: 0 4px 4px 0; }
        .scenario-failure { margin-bottom: 8px; }
        .scenario-name { font-weight: bold; color: #d32f2f; }
        .error-message { font-family: monospace; font-size: 0.8em; color: #666; margin-top: 2px; }
        
        .metrics-section { background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin-bottom: 30px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
        .metric-card { background: linear-gradient(145deg, #f8f9fa, #e9ecef); padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.2s ease; }
        .metric-card:hover { transform: translateY(-2px); }
        .metric-title { font-weight: bold; color: #495057; margin-bottom: 10px; font-size: 0.9em; text-transform: uppercase; letter-spacing: 0.5px; }
        .metric-value { font-size: 1.8em; color: #1976d2; font-weight: bold; margin-bottom: 5px; }
        .stat-card { background: linear-gradient(145deg, white, #f8f9fa); padding: 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); text-align: center; transition: transform 0.2s ease; }
        .stat-card:hover { transform: translateY(-3px); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 12px; margin-bottom: 30px; position: relative; overflow: hidden; }
        .header h1 { position: relative; z-index: 1; }
        .header p { position: relative; z-index: 1; }
        .footer { text-align: center; margin-top: 40px; color: #666; }
        
        /* Enhanced Visual Indicators */
        .progress-bar { width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden; margin-top: 8px; position: relative; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #4CAF50, #8BC34A); transition: width 0.8s ease; }
        .progress-fail { height: 100%; background: linear-gradient(90deg, #f44336, #ff7961); position: absolute; right: 0; top: 0; }
        
        /* Tooltips */
        .tooltip { position: relative; cursor: help; }
        .tooltip:hover .tooltip-text { visibility: visible; opacity: 1; }
        .tooltip-text { visibility: hidden; width: 220px; background-color: #333; color: #fff; text-align: center; border-radius: 6px; padding: 8px; position: absolute; z-index: 1; bottom: 125%; left: 50%; margin-left: -110px; opacity: 0; transition: opacity 0.3s; font-size: 0.8em; }
        .tooltip-text::after { content: ''; position: absolute; top: 100%; left: 50%; margin-left: -5px; border-width: 5px; border-style: solid; border-color: #333 transparent transparent transparent; }
        
        /* Action Items Panel */
        .insights-panel { background: linear-gradient(135deg, #fff3e0 0%, #ffcc02 100%); border-radius: 12px; padding: 25px; margin-bottom: 30px; box-shadow: 0 4px 20px rgba(255,152,0,0.2); border-left: 4px solid #ff9800; }
        .insights-panel h3 { color: #e65100; margin-bottom: 15px; font-size: 1.3em; }
        .insight-item { background: rgba(255,255,255,0.8); padding: 12px 15px; margin: 8px 0; border-radius: 8px; border-left: 3px solid #ff9800; display: flex; align-items: center; transition: transform 0.2s ease; }
        .insight-item:hover { transform: translateX(5px); background: rgba(255,255,255,0.95); }
        .insight-icon { font-size: 1.2em; margin-right: 10px; }
        
        /* Performance Indicators */
        .performance-section { background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c8 100%); border-radius: 12px; padding: 25px; margin-bottom: 30px; border-left: 4px solid #4CAF50; }
        .performance-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .perf-list { background: white; border-radius: 8px; padding: 15px; }
        .perf-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee; }
        .perf-item:last-child { border-bottom: none; }
        .perf-time { font-weight: bold; color: #666; font-size: 0.9em; }
        .speed-indicator { padding: 2px 8px; border-radius: 12px; font-size: 0.7em; font-weight: bold; }
        .fast { background: #c8e6c8; color: #2e7d32; }
        .slow { background: #ffcdd2; color: #c62828; }
        
        /* Tag Relationships */
        .relationships-section { background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%); border-radius: 12px; padding: 25px; margin-bottom: 30px; border-left: 4px solid #9c27b0; }
        .relationship-item { background: rgba(255,255,255,0.9); padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 3px solid #9c27b0; }
        .tag-combo { font-weight: bold; color: #6a1b9a; margin-bottom: 5px; }
        .failure-count { color: #d32f2f; font-weight: bold; }
        
        /* Interactive Elements */
        .expandable { cursor: pointer; transition: all 0.3s ease; }
        .expandable:hover { background: rgba(0,0,0,0.05); }
        .expandable.expanded .expand-icon { transform: rotate(180deg); }
        .expand-icon { transition: transform 0.3s ease; }
        .collapsible-content { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
        .collapsible-content.expanded { max-height: 500px; }
        
        /* Status Indicators */
        .status-indicator { width: 12px; height: 12px; border-radius: 50%; display: inline-block; margin-right: 8px; }
        .status-pass { background: #4CAF50; }
        .status-fail { background: #f44336; }
        .status-skip { background: #ff9800; }
        
        /* Print Styles */
        @media print {
            .header { background: #667eea !important; -webkit-print-color-adjust: exact; }
            .insights-panel, .performance-section, .relationships-section { -webkit-print-color-adjust: exact; }
            button { display: none; }
        }
        
        @media (max-width: 768px) {
            .performance-grid { grid-template-columns: 1fr; }
            .insight-item { flex-direction: column; align-items: flex-start; }
        }
        
        @media (max-width: 768px) { 
            .stats-grid { grid-template-columns: repeat(2, 1fr); }
            .metrics-grid { grid-template-columns: repeat(2, 1fr); }
            .tag-stats { flex-direction: column; gap: 5px; }
            .feature-stats { flex-direction: column; gap: 5px; }
        }
        @media (max-width: 480px) { 
            .stats-grid { grid-template-columns: 1fr; }
            .metrics-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Test Intelligence Dashboard</h1>
            <p>Party Collection System • ${results.environment.toUpperCase()} Environment</p>
            <p>Generated: ${new Date(results.timestamp).toLocaleString()}</p>
            ${previousReports.length > 0 ? `
                <div style="margin-top: 20px; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px; backdrop-filter: blur(10px);">
                    <h4 style="margin-bottom: 10px; font-size: 1em;">📚 Previous Reports</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">
                        ${previousReports.map(report => `
                            <a href="${report.filename}" 
                               style="color: white; text-decoration: none; background: rgba(255,255,255,0.2); 
                                      padding: 5px 10px; border-radius: 15px; font-size: 0.8em; 
                                      transition: background 0.2s ease; border: 1px solid rgba(255,255,255,0.3);"
                               onmouseover="this.style.background='rgba(255,255,255,0.3)'"
                               onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                                ${report.date.split(',')[1] ? report.date.split(',')[1].trim() : report.date} (${report.size})
                            </a>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number success">${overall.passed}</div>
                <div class="stat-label">Scenarios Passed</div>
            </div>
            <div class="stat-card">
                <div class="stat-number error">${overall.failed}</div>
                <div class="stat-label">Scenarios Failed</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${overall.scenarios}</div>
                <div class="stat-label">Total Scenarios</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${passRate}%</div>
                <div class="stat-label">Pass Rate</div>
                <div style="width: 100%; height: 4px; background: #e0e0e0; border-radius: 2px; margin-top: 10px; overflow: hidden;">
                    <div style="width: ${passRate}%; height: 100%; background: linear-gradient(90deg, #4CAF50, #8BC34A); transition: width 0.3s ease;"></div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${overall.steps}</div>
                <div class="stat-label">Total Steps</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${this.formatDuration(overall.duration)}</div>
                <div class="stat-label">Total Duration</div>
            </div>
        </div>

        <div class="metrics-section">
            <h2>📊 Code Metrics</h2>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-title">Frontend Code</div>
                    <div class="metric-value">${codeMetrics.frontend.code.toLocaleString()}</div>
                    <div class="stat-label">lines • ${codeMetrics.frontend.files} files</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Backend Code</div>
                    <div class="metric-value">${codeMetrics.backend.code.toLocaleString()}</div>
                    <div class="stat-label">lines • ${codeMetrics.backend.files} files</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Test Suite</div>
                    <div class="metric-value">${codeMetrics.tests.test.toLocaleString()}</div>
                    <div class="stat-label">lines • ${codeMetrics.tests.files} files</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Total Code</div>
                    <div class="metric-value">${codeMetrics.total.code.toLocaleString()}</div>
                    <div class="stat-label">production lines</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Test Coverage</div>
                    <div class="metric-value">${codeMetrics.total.code > 0 ? ((codeMetrics.total.test / (codeMetrics.total.code + codeMetrics.total.test)) * 100).toFixed(1) : '0'}%</div>
                    <div class="stat-label">test vs code ratio</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Unique Tags</div>
                    <div class="metric-value">${Object.keys(testResults.tags).length}</div>
                    <div class="stat-label">tag categories used</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Test Features</div>
                    <div class="metric-value">${testResults.features.length}</div>
                    <div class="stat-label">feature files tested</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Avg Steps/Scenario</div>
                    <div class="metric-value">${(overall.steps / overall.scenarios).toFixed(1)}</div>
                    <div class="stat-label">complexity metric</div>
                </div>
            </div>
            
            <div style="margin-top: 20px; padding: 20px; background: linear-gradient(145deg, #e3f2fd, #bbdefb); border-radius: 12px; border-left: 4px solid #2196f3;">
                <h3 style="color: #1565c0; margin-bottom: 10px;">🎯 Test Suite Insights</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; font-size: 0.9em;">
                    <div><strong>Critical Tags:</strong> ${Object.entries(testResults.tags).filter(([tag, stats]) => stats.failed > 0).length} tags with failures</div>
                    <div><strong>Backend Coverage:</strong> ${testResults.tags['@backend'] ? testResults.tags['@backend'].total : 0} scenarios</div>
                    <div><strong>Frontend Coverage:</strong> ${(overall.scenarios - (testResults.tags['@backend'] ? testResults.tags['@backend'].total : 0))} scenarios</div>
                    <div><strong>Performance Tests:</strong> ${testResults.tags['@fast'] ? testResults.tags['@fast'].total : 0} fast, ${testResults.tags['@slow'] ? testResults.tags['@slow'].total : 0} slow</div>
                </div>
            </div>
        </div>

        <!-- Step Coverage Analysis -->
        <div class="metrics-section">
            <h2>🔍 Step Definition Analysis</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                <div>
                    <h3 style="color: #1976d2; margin-bottom: 15px;">📈 Most Used Step Definitions</h3>
                    <div class="perf-list">
                        ${testResults.stepCoverage.topStepDefinitions.map(step => `
                            <div class="perf-item">
                                <div>
                                    <div style="font-weight: bold; color: #333;">${step.location.split('/').pop()}</div>
                                    <div style="font-size: 0.8em; color: #666; font-family: monospace;">${step.location}</div>
                                </div>
                                <div>
                                    <span class="perf-time">${step.count} uses</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div>
                    <h3 style="color: #1976d2; margin-bottom: 15px;">🎭 Step Type Distribution</h3>
                    <div class="perf-list">
                        ${Object.entries(testResults.stepCoverage.stepTypes).map(([keyword, count]) => `
                            <div class="perf-item">
                                <div>
                                    <span style="font-weight: bold; color: #333;">${keyword}</span>
                                    <span style="color: #666; margin-left: 10px;">${((count / overall.steps) * 100).toFixed(1)}%</span>
                                </div>
                                <div>
                                    <span class="perf-time">${count}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: center;">
                        <div style="font-size: 1.1em; font-weight: bold; color: #1976d2;">${testResults.stepCoverage.totalUnique}</div>
                        <div style="font-size: 0.9em; color: #666;">unique step definitions</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Action Items Panel -->
        <div class="insights-panel">
            <h3>🎯 Action Items & Insights</h3>
            ${performanceInsights.improvementAreas.map(area => `
                <div class="insight-item">
                    <span class="insight-icon">💡</span>
                    <span>${area}</span>
                </div>
            `).join('')}
            ${performanceInsights.criticalTags.length > 0 ? `
                <div class="insight-item">
                    <span class="insight-icon">⚠️</span>
                    <span>Critical: ${performanceInsights.criticalTags.length} tags need attention</span>
                </div>
            ` : `
                <div class="insight-item">
                    <span class="insight-icon">✅</span>
                    <span>All tests passing! Consider expanding test coverage.</span>
                </div>
            `}
        </div>

        <!-- Performance Visualization -->
        <div class="performance-section">
            <h3>⚡ Performance Analysis</h3>
            <div class="performance-grid">
                <div>
                    <h4>🐌 Slowest Tests (Optimize These)</h4>
                    <div class="perf-list">
                        ${performanceInsights.slowTests.slice(0, 5).map(test => `
                            <div class="perf-item">
                                <div>
                                    <div style="font-weight: 500;">${test.name}</div>
                                    <div style="font-size: 0.8em; color: #666;">${test.allTags.join(', ')}</div>
                                </div>
                                <div>
                                    <span class="speed-indicator slow">SLOW</span>
                                    <span class="perf-time">${this.formatDuration(test.duration)}</span>
                                </div>
                            </div>
                        `).join('') || '<div style="text-align: center; color: #666; padding: 20px;">No slow tests identified</div>'}
                    </div>
                </div>
                <div>
                    <h4>🚀 Fastest Tests (Good Performance)</h4>
                    <div class="perf-list">
                        ${performanceInsights.fastTests.slice(0, 5).map(test => `
                            <div class="perf-item">
                                <div>
                                    <div style="font-weight: 500;">${test.name}</div>
                                    <div style="font-size: 0.8em; color: #666;">${test.allTags.join(', ')}</div>
                                </div>
                                <div>
                                    <span class="speed-indicator fast">FAST</span>
                                    <span class="perf-time">${this.formatDuration(test.duration)}</span>
                                </div>
                            </div>
                        `).join('') || '<div style="text-align: center; color: #666; padding: 20px;">No fast tests identified</div>'}
                    </div>
                </div>
            </div>
        </div>

        ${tagRelationships.length > 0 ? `
        <!-- Tag Relationships -->
        <div class="relationships-section">
            <h3>🔗 Failing Tag Combinations</h3>
            <p style="margin-bottom: 15px; color: #666;">Tags that commonly fail together (potential dependencies)</p>
            ${tagRelationships.map(([combo, data]) => `
                <div class="relationship-item">
                    <div class="tag-combo">${combo}</div>
                    <div>Failed together: <span class="failure-count">${data.count} time${data.count > 1 ? 's' : ''}</span></div>
                    <div style="font-size: 0.8em; color: #666; margin-top: 5px;">
                        Scenarios: ${data.scenarios.slice(0, 2).join(', ')}${data.scenarios.length > 2 ? ` +${data.scenarios.length - 2} more` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="tags-section">
            <h2>🏷️ Test Results by Tags</h2>
            <p style="margin-bottom: 20px; color: #666;">Tags sorted by failure count and usage</p>
            ${sortedTags.map(tag => `
                <div class="tag-item ${tag.failed > 0 ? 'has-failures' : 'success'}">
                    <div>
                        <div class="tag-name">
                            <span class="status-indicator ${tag.failed > 0 ? 'status-fail' : 'status-pass'}"></span>
                            ${tag.name}
                            <span class="tooltip" style="margin-left: 8px;">ℹ️
                                <span class="tooltip-text">
                                    Pass Rate: ${((tag.passed / tag.total) * 100).toFixed(1)}%<br>
                                    Total Scenarios: ${tag.total}<br>
                                    ${tag.failed > 0 ? `Needs attention: ${tag.failed} failures` : 'All tests passing!'}
                                </span>
                            </span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(tag.passed / tag.total * 100).toFixed(1)}%"></div>
                            ${tag.failed > 0 ? `<div class="progress-fail" style="width: ${(tag.failed / tag.total * 100).toFixed(1)}%"></div>` : ''}
                        </div>
                    </div>
                    <div class="tag-stats">
                        <div class="tag-stat">
                            <div class="tag-stat-number">${tag.total}</div>
                            <div class="tag-stat-label">Total</div>
                        </div>
                        <div class="tag-stat">
                            <div class="tag-stat-number" style="color: #4CAF50">${tag.passed}</div>
                            <div class="tag-stat-label">Passed</div>
                        </div>
                        <div class="tag-stat">
                            <div class="tag-stat-number" style="color: #f44336">${tag.failed}</div>
                            <div class="tag-stat-label">Failed</div>
                        </div>
                        <div class="tag-stat">
                            <div class="tag-stat-number">${tag.failRate}%</div>
                            <div class="tag-stat-label">Fail Rate</div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="features-section">
            <h2>📋 Test Results by Feature</h2>
            ${testResults.features.map(feature => `
                <div class="feature-item ${feature.failed > 0 ? 'has-failures' : 'success'}">
                    <div class="feature-name">${feature.name}</div>
                    <div class="feature-stats">
                        <span><strong>Total:</strong> ${feature.total}</span>
                        <span><strong>Passed:</strong> ${feature.passed}</span>
                        <span><strong>Failed:</strong> ${feature.failed}</span>
                        <span><strong>Duration:</strong> ${this.formatDuration(feature.duration)}</span>
                    </div>
                    <div class="feature-tags">
                        ${feature.tags.map(tag => `<span class="tag-badge">${tag}</span>`).join('')}
                    </div>
                    ${feature.scenarios.filter(s => s.status === 'failed').length > 0 ? `
                        <div class="failure-details">
                            <strong>❌ Failed Scenarios:</strong>
                            ${feature.scenarios.filter(s => s.status === 'failed').map(scenario => `
                                <div class="scenario-failure">
                                    <div class="scenario-name">${scenario.name}</div>
                                    <div style="margin-left: 15px;">
                                        <div style="font-size: 0.8em; color: #666;">Tags: ${scenario.allTags.join(', ')}</div>
                                        ${scenario.errors.map(error => `
                                            <div class="error-message">${error.error}</div>
                                        `).join('')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>

        <div class="footer">
            <p>🚀 Generated by Party Collection Test Intelligence Dashboard</p>
            <p>Report analyzes results from latest test run without re-executing tests</p>
            <p>Report ID: ${results.timestamp}</p>
            <div style="margin-top: 15px; padding: 10px; background: #f0f0f0; border-radius: 8px; font-size: 0.9em;">
                <strong>📊 Report Statistics:</strong>
                Processed ${testResults.features.length} feature files, ${overall.scenarios} scenarios, ${overall.steps} steps in ${this.formatDuration(overall.duration)}
            </div>
        </div>
    </div>
    
    <!-- Interactive JavaScript -->
    <script>
        // Tooltip interactions
        document.addEventListener('DOMContentLoaded', function() {
            // Add click-to-copy functionality for report ID
            const footer = document.querySelector('.footer');
            if (footer) {
                const reportId = footer.querySelector('p:last-of-type');
                if (reportId) {
                    reportId.style.cursor = 'pointer';
                    reportId.title = 'Click to copy report ID';
                    reportId.addEventListener('click', function() {
                        const id = '${results.timestamp}';
                        navigator.clipboard.writeText(id).then(() => {
                            const originalText = this.textContent;
                            this.textContent = '✓ Report ID copied!';
                            this.style.color = '#4CAF50';
                            setTimeout(() => {
                                this.textContent = originalText;
                                this.style.color = '';
                            }, 2000);
                        });
                    });
                }
            }
            
            // Enhanced hover effects for stat cards
            const statCards = document.querySelectorAll('.stat-card, .metric-card');
            statCards.forEach(card => {
                card.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-5px) scale(1.02)';
                    this.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                });
                card.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0) scale(1)';
                    this.style.boxShadow = '';
                });
            });
            
            // Progress bar animations
            const progressBars = document.querySelectorAll('.progress-fill');
            progressBars.forEach(bar => {
                const width = bar.style.width;
                bar.style.width = '0%';
                setTimeout(() => {
                    bar.style.width = width;
                }, 500);
            });
            
            // Add export functionality
            const header = document.querySelector('.header');
            if (header) {
                const exportBtn = document.createElement('button');
                exportBtn.innerHTML = '📋 Export PDF';
                exportBtn.style.cssText = \`
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: 1px solid rgba(255,255,255,0.3);
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.9em;
                    transition: all 0.3s ease;
                \`;
                exportBtn.addEventListener('click', function() {
                    window.print();
                });
                exportBtn.addEventListener('mouseenter', function() {
                    this.style.background = 'rgba(255,255,255,0.3)';
                });
                exportBtn.addEventListener('mouseleave', function() {
                    this.style.background = 'rgba(255,255,255,0.2)';
                });
                header.style.position = 'relative';
                header.appendChild(exportBtn);
            }
            
            // Auto-refresh capability (if running in dev mode)
            if (window.location.protocol === 'file:' && '${results.environment}' === 'local') {
                let refreshTimer;
                const addRefreshButton = () => {
                    const refreshBtn = document.createElement('button');
                    refreshBtn.innerHTML = '🔄 Auto-refresh OFF';
                    refreshBtn.style.cssText = \`
                        position: fixed;
                        bottom: 20px;
                        right: 20px;
                        background: #2196f3;
                        color: white;
                        border: none;
                        padding: 10px 15px;
                        border-radius: 25px;
                        cursor: pointer;
                        font-size: 0.8em;
                        z-index: 1000;
                        box-shadow: 0 4px 15px rgba(33,150,243,0.3);
                        transition: all 0.3s ease;
                    \`;
                    
                    let autoRefresh = false;
                    refreshBtn.addEventListener('click', function() {
                        autoRefresh = !autoRefresh;
                        if (autoRefresh) {
                            this.innerHTML = '🔄 Auto-refresh ON';
                            this.style.background = '#4CAF50';
                            refreshTimer = setInterval(() => {
                                window.location.reload();
                            }, 30000); // Refresh every 30 seconds
                        } else {
                            this.innerHTML = '🔄 Auto-refresh OFF';
                            this.style.background = '#2196f3';
                            clearInterval(refreshTimer);
                        }
                    });
                    
                    document.body.appendChild(refreshBtn);
                };
                addRefreshButton();
            }
        });
    </script>
</body>
</html>`;
  }

  cleanupOldReports() {
    try {
      const reportDir = path.join(__dirname, this.config.reportDir);
      const files = fs.readdirSync(reportDir)
        .filter(file => (file.startsWith('tag-report-') || file.startsWith('test-intelligence-')) && file.endsWith('.html') && !file.includes('latest'))
        .map(file => ({
          name: file,
          path: path.join(reportDir, file),
          mtime: fs.statSync(path.join(reportDir, file)).mtime
        }))
        .sort((a, b) => b.mtime - a.mtime);

      // Keep only the latest 7 reports
      if (files.length > 7) {
        const filesToDelete = files.slice(7);
        for (const file of filesToDelete) {
          fs.unlinkSync(file.path);
        }
        console.log(`🧹 Cleaned up ${filesToDelete.length} old reports`);
      }
    } catch (error) {
      console.warn('Warning: Could not cleanup old reports:', error.message);
    }
  }
}

// CLI interface
async function main() {
  const environment = process.argv[2] || 'local';
  
  if (!['local', 'dev', 'prod'].includes(environment)) {
    console.error('❌ Invalid environment. Use: local, dev, or prod');
    process.exit(1);
  }

  try {
    const generator = new TagBasedTestReportGenerator(environment);
    await generator.generate();
  } catch (error) {
    console.error('❌ Report generation failed:', error.message);
    if (error.message.includes('Cucumber JSON report not found')) {
      console.log('💡 Please run tests first: npm test');
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { TagBasedTestReportGenerator };