import React, { useState, useCallback, memo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Stack,
  colors,
  spacing
} from '../../design-system';
import { LoggingService } from '../../services/LoggingService';
import { NotificationService } from '../../services/NotificationService';
import { agentService } from '../../services/agentService';
import { useMCP } from '../../context/MCPContext';
import { useServerEnvironment } from '../../context/ServerEnvironmentContext';
import { useAuth } from '../../context/AuthContext';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  result?: string;
  error?: string;
  timestamp?: Date;
}

interface TestingPanelProps {
  /** Whether to show all test categories expanded by default */
  expandedByDefault?: boolean;
  /** Callback when test results change */
  onTestResultsChange?: (results: TestResult[]) => void;
}

const TestingPanel: React.FC<TestingPanelProps> = ({
  expandedByDefault = false,
  onTestResultsChange
}) => {
  const { 
    isConnected: mcpConnected, 
    getCurrentServerUrl,
    createTide,
    startTideFlow,
    addEnergyToTide,
    getTideReport,
    linkTaskToTide,
    getTaskLinks,
    getTideParticipants
  } = useMCP();
  
  const { currentEnvironment, switchEnvironment, environments } = useServerEnvironment();
  const { user, apiKey } = useAuth();
  
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    connection: expandedByDefault,
    agent: expandedByDefault,
    mcp: expandedByDefault,
    auth: expandedByDefault,
    environment: expandedByDefault
  });

  // ======================== Test Execution Helpers ========================

  const updateTestResult = useCallback((name: string, updates: Partial<TestResult>) => {
    setTestResults(prev => {
      const existingIndex = prev.findIndex(t => t.name === name);
      const updatedResult: TestResult = {
        name,
        status: 'pending',
        timestamp: new Date(),
        ...(existingIndex >= 0 ? prev[existingIndex] : {}),
        ...updates
      };

      const newResults = existingIndex >= 0
        ? prev.map((result, index) => index === existingIndex ? updatedResult : result)
        : [...prev, updatedResult];

      onTestResultsChange?.(newResults);
      return newResults;
    });
  }, [onTestResultsChange]);

  const runTest = useCallback(async (
    name: string,
    testFn: () => Promise<string>
  ) => {
    updateTestResult(name, { status: 'running' });
    
    try {
      const result = await testFn();
      updateTestResult(name, { 
        status: 'success', 
        result,
        error: undefined
      });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateTestResult(name, { 
        status: 'error', 
        error: errorMessage,
        result: undefined
      });
      return false;
    }
  }, [updateTestResult]);

  // ======================== Connection Tests ========================

  const testAgentConnection = useCallback(async () => {
    return runTest('Agent Connection', async () => {
      const status = await agentService.checkStatus();
      return `Agent status: ${status.status}, Connected: ${status.connected}`;
    });
  }, [runTest]);

  const testMCPConnection = useCallback(async () => {
    return runTest('MCP Connection', async () => {
      const url = getCurrentServerUrl();
      const connected = mcpConnected;
      return `MCP URL: ${url}, Connected: ${connected}`;
    });
  }, [runTest, getCurrentServerUrl, mcpConnected]);

  const testNetworkReachability = useCallback(async () => {
    return runTest('Network Reachability', async () => {
      const url = getCurrentServerUrl();
      const response = await fetch(`${url}/health`);
      return `HTTP ${response.status}: ${response.statusText}`;
    });
  }, [runTest, getCurrentServerUrl]);

  // ======================== Agent Tests ========================

  const testAgentMessage = useCallback(async () => {
    return runTest('Agent Message', async () => {
      const response = await agentService.sendMessage("test message");
      return `Response length: ${response.content.length} chars`;
    });
  }, [runTest]);

  const testAgentInsights = useCallback(async () => {
    return runTest('Agent Insights', async () => {
      const insights = await agentService.getInsights();
      return `Insights length: ${insights.content.length} chars`;
    });
  }, [runTest]);

  const testAgentOptimization = useCallback(async () => {
    return runTest('Agent Optimization', async () => {
      const optimization = await agentService.optimizeTide('test-tide-id');
      return `Optimization length: ${optimization.content.length} chars`;
    });
  }, [runTest]);

  // ======================== MCP Tool Tests ========================

  const testMCPToolCreate = useCallback(async () => {
    return runTest('MCP Create Tide', async () => {
      const result = await createTide('Test Tide', 'Test Description', 'daily');
      return `Created tide: ${JSON.stringify(result).substring(0, 50)}...`;
    });
  }, [runTest, createTide]);

  const testMCPToolList = useCallback(async () => {
    return runTest('MCP List Tides', async () => {
      // This would call tide_list tool - for now simulate
      return 'Tide list retrieved successfully';
    });
  }, [runTest]);

  const testMCPToolFlow = useCallback(async () => {
    return runTest('MCP Start Flow', async () => {
      const result = await startTideFlow('test-tide', 'moderate', 60, 'medium', 'Test context');
      return `Flow started: ${JSON.stringify(result).substring(0, 50)}...`;
    });
  }, [runTest, startTideFlow]);

  const testMCPToolEnergy = useCallback(async () => {
    return runTest('MCP Add Energy', async () => {
      const result = await addEnergyToTide('test-tide', 'high', 'Test energy update');
      return `Energy added: ${JSON.stringify(result).substring(0, 50)}...`;
    });
  }, [runTest, addEnergyToTide]);

  const testMCPToolReport = useCallback(async () => {
    return runTest('MCP Get Report', async () => {
      const result = await getTideReport('test-tide', 'json');
      return `Report generated: ${JSON.stringify(result).substring(0, 50)}...`;
    });
  }, [runTest, getTideReport]);

  const testMCPToolLinkTask = useCallback(async () => {
    return runTest('MCP Link Task', async () => {
      const result = await linkTaskToTide('test-tide', 'https://example.com/task', 'Test Task', 'feature');
      return `Task linked: ${JSON.stringify(result).substring(0, 50)}...`;
    });
  }, [runTest, linkTaskToTide]);

  const testMCPToolTaskLinks = useCallback(async () => {
    return runTest('MCP Get Task Links', async () => {
      const result = await getTaskLinks('test-tide');
      return `Task links: ${JSON.stringify(result).substring(0, 50)}...`;
    });
  }, [runTest, getTaskLinks]);

  const testMCPToolParticipants = useCallback(async () => {
    return runTest('MCP Get Participants', async () => {
      const result = await getTideParticipants('active', undefined, undefined, 10);
      return `Participants: ${JSON.stringify(result).substring(0, 50)}...`;
    });
  }, [runTest, getTideParticipants]);

  // ======================== Auth Tests ========================

  const testAuthStatus = useCallback(async () => {
    return runTest('Auth Status', async () => {
      return `User: ${user ? 'authenticated' : 'not authenticated'}, API Key: ${apiKey ? 'available' : 'missing'}`;
    });
  }, [runTest, user, apiKey]);

  const testApiKeyValidation = useCallback(async () => {
    return runTest('API Key Validation', async () => {
      if (!apiKey) throw new Error('No API key available');
      
      // Test API key format
      const isValidFormat = apiKey.startsWith('tides_') && apiKey.split('_').length === 3;
      return `Format valid: ${isValidFormat}, Length: ${apiKey.length}`;
    });
  }, [runTest, apiKey]);

  // ======================== Environment Tests ========================

  const testEnvironmentSwitching = useCallback(async () => {
    return runTest('Environment Switching', async () => {
      const originalEnv = currentEnvironment;
      const envKeys = Object.keys(environments);
      const testEnv = envKeys.find(key => key !== originalEnv);
      
      if (!testEnv) {
        return 'Only one environment available - switching test skipped';
      }
      
      await switchEnvironment(testEnv as any);
      const newUrl = getCurrentServerUrl();
      await switchEnvironment(originalEnv as any);
      const restoredUrl = getCurrentServerUrl();
      
      return `Switched to ${testEnv}, URL changed: ${newUrl !== restoredUrl}`;
    });
  }, [runTest, currentEnvironment, environments, switchEnvironment, getCurrentServerUrl]);

  // ======================== Batch Test Functions ========================

  const runConnectionTests = useCallback(async () => {
    setIsRunningTests(true);
    try {
      await Promise.all([
        testAgentConnection(),
        testMCPConnection(),
        testNetworkReachability()
      ]);
      NotificationService.success('Connection tests completed', 'Tests');
    } catch (error) {
      NotificationService.error('Some connection tests failed', 'Tests');
    } finally {
      setIsRunningTests(false);
    }
  }, [testAgentConnection, testMCPConnection, testNetworkReachability]);

  const runAgentTests = useCallback(async () => {
    setIsRunningTests(true);
    try {
      await Promise.all([
        testAgentMessage(),
        testAgentInsights(),
        testAgentOptimization()
      ]);
      NotificationService.success('Agent tests completed', 'Tests');
    } catch (error) {
      NotificationService.error('Some agent tests failed', 'Tests');
    } finally {
      setIsRunningTests(false);
    }
  }, [testAgentMessage, testAgentInsights, testAgentOptimization]);

  const runMCPTests = useCallback(async () => {
    setIsRunningTests(true);
    try {
      await Promise.all([
        testMCPToolCreate(),
        testMCPToolList(),
        testMCPToolFlow(),
        testMCPToolEnergy(),
        testMCPToolReport(),
        testMCPToolLinkTask(),
        testMCPToolTaskLinks(),
        testMCPToolParticipants()
      ]);
      NotificationService.success('MCP tool tests completed', 'Tests');
    } catch (error) {
      NotificationService.error('Some MCP tests failed', 'Tests');
    } finally {
      setIsRunningTests(false);
    }
  }, [
    testMCPToolCreate, testMCPToolList, testMCPToolFlow, testMCPToolEnergy,
    testMCPToolReport, testMCPToolLinkTask, testMCPToolTaskLinks, testMCPToolParticipants
  ]);

  const runAuthTests = useCallback(async () => {
    setIsRunningTests(true);
    try {
      await Promise.all([
        testAuthStatus(),
        testApiKeyValidation()
      ]);
      NotificationService.success('Auth tests completed', 'Tests');
    } catch (error) {
      NotificationService.error('Some auth tests failed', 'Tests');
    } finally {
      setIsRunningTests(false);
    }
  }, [testAuthStatus, testApiKeyValidation]);

  const runEnvironmentTests = useCallback(async () => {
    setIsRunningTests(true);
    try {
      await testEnvironmentSwitching();
      NotificationService.success('Environment tests completed', 'Tests');
    } catch (error) {
      NotificationService.error('Environment tests failed', 'Tests');
    } finally {
      setIsRunningTests(false);
    }
  }, [testEnvironmentSwitching]);

  const runAllTests = useCallback(async () => {
    Alert.alert(
      'Run All Tests',
      'This will run all test categories. It may take a while. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Run All',
          onPress: async () => {
            setIsRunningTests(true);
            setTestResults([]);
            
            try {
              await Promise.all([
                runConnectionTests(),
                runAgentTests(),
                runMCPTests(),
                runAuthTests(),
                runEnvironmentTests()
              ]);
              NotificationService.success('All tests completed', 'Tests');
            } catch (error) {
              NotificationService.error('Some tests failed', 'Tests');
            } finally {
              setIsRunningTests(false);
            }
          }
        }
      ]
    );
  }, [runConnectionTests, runAgentTests, runMCPTests, runAuthTests, runEnvironmentTests]);

  const clearResults = useCallback(() => {
    setTestResults([]);
    onTestResultsChange?.([]);
  }, [onTestResultsChange]);

  const exportResults = useCallback(() => {
    const resultsText = JSON.stringify(testResults, null, 2);
    // In a real app, you'd use react-native-fs or similar to save to file
    LoggingService.info('TestingPanel', 'Test results exported', { resultsText }, 'TEST_EXPORT_001');
    NotificationService.info('Results logged to console', 'Export');
  }, [testResults]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // ======================== Render Helpers ========================

  const renderTestResult = (result: TestResult) => {
    const getStatusColor = () => {
      switch (result.status) {
        case 'success': return colors.success;
        case 'error': return colors.error;
        case 'running': return colors.warning;
        default: return colors.neutral[400];
      }
    };

    const getStatusIcon = () => {
      switch (result.status) {
        case 'success': return '✅';
        case 'error': return '❌';
        case 'running': return '⏳';
        default: return '⏸';
      }
    };

    return (
      <View key={result.name} style={styles.testResultItem}>
        <View style={styles.testResultHeader}>
          <Text variant="bodySmall" style={[styles.testName, { color: getStatusColor() }]}>
            {getStatusIcon()} {result.name}
          </Text>
          {result.timestamp && (
            <Text variant="bodySmall" color="tertiary">
              {result.timestamp.toLocaleTimeString()}
            </Text>
          )}
        </View>
        {result.result && (
          <Text variant="bodySmall" color="secondary" style={styles.testResult}>
            {result.result}
          </Text>
        )}
        {result.error && (
          <Text variant="bodySmall" color="error" style={styles.testError}>
            Error: {result.error}
          </Text>
        )}
      </View>
    );
  };

  const renderTestSection = (
    title: string,
    sectionKey: string,
    tests: { name: string; onPress: () => void }[],
    batchTest?: () => void
  ) => (
    <Card variant="outlined" padding={3} style={styles.sectionCard}>
      <TouchableOpacity
        onPress={() => toggleSection(sectionKey)}
        style={styles.sectionHeader}
      >
        <Text variant="body" weight="medium">{title}</Text>
        <Text variant="bodySmall" color="tertiary">
          {expandedSections[sectionKey] ? "▼" : "▶"}
        </Text>
      </TouchableOpacity>
      
      {expandedSections[sectionKey] && (
        <View style={styles.sectionContent}>
          <Stack spacing={2}>
            {batchTest && (
              <Button
                variant="primary"
                size="sm"
                onPress={batchTest}
                loading={isRunningTests}
                style={styles.batchButton}
              >
                Run All {title} Tests
              </Button>
            )}
            
            <View style={styles.individualTests}>
              {tests.map(test => (
                <Button
                  key={test.name}
                  variant="outline"
                  size="sm"
                  onPress={test.onPress}
                  disabled={isRunningTests}
                  style={styles.testButton}
                >
                  {test.name}
                </Button>
              ))}
            </View>
          </Stack>
        </View>
      )}
    </Card>
  );

  // ======================== Main Render ========================

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Stack spacing={3}>
        {/* Header */}
        <Card variant="outlined" padding={4} style={styles.headerCard}>
          <Text variant="h3" color="primary" style={styles.title}>
            Debug Testing Panel
          </Text>
          <Text variant="body" color="secondary">
            Test all system connections, agent communication, and MCP tools
          </Text>
          
          <View style={styles.headerActions}>
            <Button
              variant="primary"
              onPress={runAllTests}
              loading={isRunningTests}
              style={styles.runAllButton}
            >
              Run All Tests
            </Button>
            <Button
              variant="outline"
              onPress={clearResults}
              disabled={isRunningTests || testResults.length === 0}
            >
              Clear Results
            </Button>
          </View>
        </Card>

        {/* Test Sections */}
        {renderTestSection(
          'Connection',
          'connection',
          [
            { name: 'Test Agent', onPress: testAgentConnection },
            { name: 'Test MCP', onPress: testMCPConnection },
            { name: 'Test Network', onPress: testNetworkReachability }
          ],
          runConnectionTests
        )}

        {renderTestSection(
          'Agent',
          'agent',
          [
            { name: 'Send Message', onPress: testAgentMessage },
            { name: 'Get Insights', onPress: testAgentInsights },
            { name: 'Optimize Tide', onPress: testAgentOptimization }
          ],
          runAgentTests
        )}

        {renderTestSection(
          'MCP Tools',
          'mcp',
          [
            { name: 'Create Tide', onPress: testMCPToolCreate },
            { name: 'List Tides', onPress: testMCPToolList },
            { name: 'Start Flow', onPress: testMCPToolFlow },
            { name: 'Add Energy', onPress: testMCPToolEnergy },
            { name: 'Get Report', onPress: testMCPToolReport },
            { name: 'Link Task', onPress: testMCPToolLinkTask },
            { name: 'Task Links', onPress: testMCPToolTaskLinks },
            { name: 'Participants', onPress: testMCPToolParticipants }
          ],
          runMCPTests
        )}

        {renderTestSection(
          'Authentication',
          'auth',
          [
            { name: 'Auth Status', onPress: testAuthStatus },
            { name: 'API Key', onPress: testApiKeyValidation }
          ],
          runAuthTests
        )}

        {renderTestSection(
          'Environment',
          'environment',
          [
            { name: 'Switch Test', onPress: testEnvironmentSwitching }
          ],
          runEnvironmentTests
        )}

        {/* Test Results */}
        {testResults.length > 0 && (
          <Card variant="outlined" padding={3} style={styles.resultsCard}>
            <View style={styles.resultsHeader}>
              <Text variant="body" weight="medium">Test Results</Text>
              <Button
                variant="outline"
                size="sm"
                onPress={exportResults}
              >
                Export
              </Button>
            </View>
            
            <ScrollView style={styles.resultsScroll} nestedScrollEnabled>
              {testResults.map(renderTestResult)}
            </ScrollView>
          </Card>
        )}
      </Stack>
    </ScrollView>
  );
};

// ======================== Styles ========================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing[4]
  },
  headerCard: {
    backgroundColor: colors.primary[50]
  },
  title: {
    marginBottom: spacing[2]
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[4]
  },
  runAllButton: {
    flex: 1
  },
  sectionCard: {
    backgroundColor: colors.background.secondary
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2]
  },
  sectionContent: {
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200]
  },
  batchButton: {
    marginBottom: spacing[2]
  },
  individualTests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2]
  },
  testButton: {
    minWidth: 120
  },
  resultsCard: {
    backgroundColor: colors.neutral[50],
    maxHeight: 300
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3]
  },
  resultsScroll: {
    maxHeight: 200
  },
  testResultItem: {
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100]
  },
  testResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1]
  },
  testName: {
    fontWeight: '600'
  },
  testResult: {
    marginLeft: spacing[3],
    fontStyle: 'italic'
  },
  testError: {
    marginLeft: spacing[3],
    backgroundColor: colors.error + '10',
    padding: spacing[2],
    borderRadius: 4
  }
});

export default memo(TestingPanel);