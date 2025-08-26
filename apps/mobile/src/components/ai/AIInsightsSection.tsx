import React, { memo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '../Text';
import { Card } from '../Card';
import { Loading } from '../Loading';
import { colors, spacing } from '../../design-system/tokens';
import { AIAnalysisResult, AISuggestionResult } from '../../hooks/useAIFeatures';

interface AIInsightsSectionProps {
  insights: AIAnalysisResult | null;
  suggestions: AISuggestionResult | null;
  isAnalyzing: boolean;
  isGeneratingSuggestions: boolean;
  error: string | null;
  onAnalyzePress: () => void;
  onSuggestionsPress: () => void;
  onClearError: () => void;
}

export const AIInsightsSection = memo<AIInsightsSectionProps>(({
  insights,
  suggestions,
  isAnalyzing,
  isGeneratingSuggestions,
  error,
  onAnalyzePress,
  onSuggestionsPress,
  onClearError
}) => {
  return (
    <View style={styles.container}>
      <Text variant="h3" style={styles.sectionTitle}>
        AI Insights
      </Text>

      {/* Error Display */}
      {error && (
        <Card variant="outlined" padding={3} style={styles.errorCard}>
          <Text variant="bodySmall" color="error">
            {error}
          </Text>
          <TouchableOpacity onPress={onClearError} style={styles.clearButton}>
            <Text variant="bodySmall" color="primary">
              Clear
            </Text>
          </TouchableOpacity>
        </Card>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, isAnalyzing && styles.buttonDisabled]}
          onPress={onAnalyzePress}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <Loading size="small" />
          ) : (
            <Text variant="bodySmall" color="primary">
              Analyze Productivity
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, isGeneratingSuggestions && styles.buttonDisabled]}
          onPress={onSuggestionsPress}
          disabled={isGeneratingSuggestions}
        >
          {isGeneratingSuggestions ? (
            <Loading size="small" />
          ) : (
            <Text variant="bodySmall" color="primary">
              Get Flow Suggestions
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Productivity Insights */}
      {insights && (
        <Card variant="elevated" padding={4} style={styles.insightsCard}>
          <Text variant="h4" style={styles.cardTitle}>
            Productivity Analysis
          </Text>
          
          <Text variant="bodySmall" color="secondary" style={styles.analysisType}>
            {insights.analysis_type} analysis • {insights.session_count} sessions
          </Text>

          {insights.insights?.patterns && (
            <View style={styles.section}>
              <Text variant="bodySmall" weight="semibold" style={styles.sectionLabel}>
                Patterns:
              </Text>
              {insights.insights.patterns.map((pattern, index) => (
                <Text key={index} variant="bodySmall" style={styles.listItem}>
                  • {pattern}
                </Text>
              ))}
            </View>
          )}

          {insights.insights?.recommendations && (
            <View style={styles.section}>
              <Text variant="bodySmall" weight="semibold" style={styles.sectionLabel}>
                Recommendations:
              </Text>
              {insights.insights.recommendations.map((rec, index) => (
                <Text key={index} variant="bodySmall" style={styles.listItem}>
                  • {rec}
                </Text>
              ))}
            </View>
          )}

          {insights.insights?.energy_trends && (
            <View style={styles.section}>
              <Text variant="bodySmall" weight="semibold" style={styles.sectionLabel}>
                Energy Trends:
              </Text>
              <Text variant="bodySmall" style={styles.listItem}>
                {insights.insights.energy_trends}
              </Text>
            </View>
          )}
        </Card>
      )}

      {/* Flow Suggestions */}
      {suggestions && (
        <Card variant="elevated" padding={4} style={styles.suggestionsCard}>
          <Text variant="h4" style={styles.cardTitle}>
            Flow Suggestions
          </Text>
          
          <Text variant="bodySmall" color="secondary" style={styles.analysisType}>
            Confidence: {Math.round((suggestions.confidence_score || 0) * 100)}% • 
            Energy Level: {suggestions.current_energy}/10
          </Text>

          {suggestions.optimal_times?.length > 0 && (
            <View style={styles.section}>
              <Text variant="bodySmall" weight="semibold" style={styles.sectionLabel}>
                Optimal Times:
              </Text>
              <View style={styles.timeChipsContainer}>
                {suggestions.optimal_times.map((time, index) => (
                  <View key={index} style={styles.timeChip}>
                    <Text variant="bodySmall" color="primary">
                      {time}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {suggestions.suggestions && (
            <View style={styles.section}>
              <Text variant="bodySmall" weight="semibold" style={styles.sectionLabel}>
                AI Suggestions:
              </Text>
              <Text variant="bodySmall" style={styles.suggestionsText}>
                {suggestions.suggestions}
              </Text>
            </View>
          )}
        </Card>
      )}
    </View>
  );
});

AIInsightsSection.displayName = 'AIInsightsSection';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  sectionTitle: {
    marginBottom: spacing[3],
    color: colors.text.primary,
  },
  errorCard: {
    marginBottom: spacing[3],
    backgroundColor: colors.error + '10',
    borderColor: colors.error + '30',
  },
  clearButton: {
    marginTop: spacing[2],
    alignSelf: 'flex-start',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    backgroundColor: colors.primary + '05',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  insightsCard: {
    marginBottom: spacing[4],
    backgroundColor: colors.background.secondary,
  },
  suggestionsCard: {
    marginBottom: spacing[4],
    backgroundColor: colors.background.secondary,
  },
  cardTitle: {
    marginBottom: spacing[2],
    color: colors.text.primary,
  },
  analysisType: {
    marginBottom: spacing[3],
    fontStyle: 'italic',
  },
  section: {
    marginTop: spacing[3],
  },
  sectionLabel: {
    marginBottom: spacing[2],
    color: colors.text.primary,
  },
  listItem: {
    marginLeft: spacing[2],
    marginBottom: spacing[1],
    color: colors.text.secondary,
    lineHeight: 18,
  },
  timeChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  timeChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: 16,
    backgroundColor: colors.primary + '15',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  suggestionsText: {
    color: colors.text.secondary,
    lineHeight: 20,
  },
});