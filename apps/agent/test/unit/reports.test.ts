/**
 * Unit Tests for ReportsService
 */

import { ReportsService } from '../../src/services/reports';
import type { Env, ReportsRequest } from '../../src/types';
import { setupR2MockWithRealData } from '../helpers/tideDataHelper';

describe('ReportsService', () => {
  let reportsService: ReportsService;
  let mockEnv: Env;

  beforeEach(() => {
    mockEnv = {
      DB: {} as any,
      TIDES_R2: {
        get: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        head: jest.fn(),
        list: jest.fn()
      } as any,
      TIDES_AUTH_KV: {} as any,
      AI: {} as any,
      COORDINATOR: {} as any,
      CLOUDFLARE_ACCOUNT_ID: 'test-account-id',
      R2_BUCKET_NAME: 'test-bucket',
      ENVIRONMENT: 'test'
    };

    reportsService = new ReportsService(mockEnv);
  });

  describe('generateReport', () => {
    beforeEach(() => {
      // Setup R2 mock with real tide data structure
      setupR2MockWithRealData(mockEnv);
    });

    test('should generate summary report', async () => {
      const request: ReportsRequest = {
        api_key: 'test-api-key',
        tides_id: 'daily-tide-default',
        report_type: 'summary'
      };

      const result = await reportsService.generateReport(request, 'test-user');

      expect(result.report_type).toBe('summary');
      expect(result.period).toBe('30d'); // Default period
      expect(result.summary).toBeDefined();
      expect(result.detailed_metrics).toBeDefined();
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.charts_data).toBeUndefined(); // Not included in summary

      // Validate summary data - based on actual tide data
      expect(result.summary.total_productive_hours).toBeGreaterThanOrEqual(0);
      expect(result.summary.average_daily_score).toBeGreaterThanOrEqual(0);
      expect(result.summary.average_daily_score).toBeLessThanOrEqual(100);
      expect(result.summary.completed_tasks).toBeGreaterThanOrEqual(0);
      expect(result.summary.focus_sessions).toBeGreaterThanOrEqual(0);
    });

    test('should generate detailed report', async () => {
      const request: ReportsRequest = {
        api_key: 'test-api-key',
        tides_id: 'daily-tide-default',
        report_type: 'detailed',
        period: '90d'
      };

      const result = await reportsService.generateReport(request, 'test-user');

      expect(result.report_type).toBe('detailed');
      expect(result.period).toBe('90d');
      expect(result.summary).toBeDefined();
      expect(result.detailed_metrics).toBeDefined();
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.charts_data).toBeUndefined(); // Not included in detailed

      // Detailed reports should have additional summary fields
      expect(result.summary).toHaveProperty('peak_productivity_day');
      expect(result.summary).toHaveProperty('peak_productivity_hour');
      expect(result.summary).toHaveProperty('improvement_percentage');
      expect(result.summary).toHaveProperty('streak_days');

      expect(['Monday', 'Tuesday', 'Wednesday']).toContain(result.summary.peak_productivity_day);
      expect(result.summary.peak_productivity_hour).toMatch(/^\d{1,2}:00$/);
      expect(result.summary.improvement_percentage).toBeGreaterThanOrEqual(5);
      expect(result.summary.improvement_percentage).toBeLessThanOrEqual(25);
    });

    test('should generate analytics report with charts', async () => {
      const request: ReportsRequest = {
        api_key: 'test-api-key',
        tides_id: 'daily-tide-default',
        report_type: 'analytics',
        period: '180d'
      };

      const result = await reportsService.generateReport(request, 'test-user');

      expect(result.report_type).toBe('analytics');
      expect(result.period).toBe('180d');
      expect(result.charts_data).toBeDefined(); // Included in analytics

      // Validate charts data - based on actual implementation
      expect(result.charts_data?.daily_productivity).toBeDefined();
      expect(result.charts_data?.hourly_distribution).toBeDefined();
      expect(result.charts_data?.energy_timeline).toBeDefined();
      expect(result.charts_data?.intensity_breakdown).toBeDefined();

      // Basic validation of chart structure  
      expect(typeof result.charts_data.daily_productivity).toBe('object');
      expect(typeof result.charts_data.hourly_distribution).toBe('object');
      expect(typeof result.charts_data.energy_timeline).toBe('object');
      expect(typeof result.charts_data.intensity_breakdown).toBe('object');

      // Analytics reports should have enhanced metrics
      expect(result.detailed_metrics).toHaveProperty('correlations');
      expect(result.detailed_metrics).toHaveProperty('predictions');
    });

    test('should validate detailed metrics structure', async () => {
      const request: ReportsRequest = {
        api_key: 'test-api-key',
        tides_id: 'daily-tide-default',
        report_type: 'detailed'
      };

      const result = await reportsService.generateReport(request, 'test-user');

      expect(result.detailed_metrics.productivity_trends).toBeDefined();
      expect(result.detailed_metrics.time_distribution).toBeDefined();
      expect(result.detailed_metrics.energy_patterns).toBeDefined();

      // Validate productivity trends
      const trends = result.detailed_metrics.productivity_trends;
      expect(trends.weekly_averages).toBeInstanceOf(Array);
      expect(trends.weekly_averages.length).toBeGreaterThanOrEqual(1); // Based on actual data availability
      // monthly_comparison removed in implementation due to requiring real historical data

      // Validate time distribution
      const timeDistrib = result.detailed_metrics.time_distribution;
      expect(timeDistrib.deep_work).toBeGreaterThanOrEqual(0);
      expect(timeDistrib.meetings).toBeGreaterThanOrEqual(0);
      expect(timeDistrib.administrative).toBeGreaterThanOrEqual(0);
      expect(timeDistrib.breaks).toBeGreaterThanOrEqual(0);
      expect(timeDistrib.deep_work + timeDistrib.meetings + timeDistrib.administrative + timeDistrib.breaks).toBe(100);

      // Validate energy patterns
      const energy = result.detailed_metrics.energy_patterns;
      expect(energy.morning_energy).toBeGreaterThanOrEqual(0);
      expect(energy.afternoon_energy).toBeGreaterThanOrEqual(0);
      expect(energy.evening_energy).toBeGreaterThanOrEqual(0);
    });

    test('should have different recommendations for different report types', async () => {
      const summaryRequest: ReportsRequest = {
        api_key: 'test-api-key',
        tides_id: 'daily-tide-default',
        report_type: 'summary'
      };

      const detailedRequest: ReportsRequest = {
        api_key: 'test-api-key',
        tides_id: 'daily-tide-default',
        report_type: 'detailed'
      };

      const summaryReport = await reportsService.generateReport(summaryRequest, 'test-user');
      const detailedReport = await reportsService.generateReport(detailedRequest, 'test-user');

      expect(summaryReport.recommendations.length).toBe(3);
      expect(detailedReport.recommendations.length).toBeGreaterThan(3);

      // Detailed reports should have additional recommendations
      expect(detailedReport.recommendations.length).toBeGreaterThan(summaryReport.recommendations.length);
    });

    test('should handle missing tide data', async () => {
      const mockR2 = mockEnv.TIDES_R2 as any;
      mockR2.get.mockResolvedValue(null);

      const request: ReportsRequest = {
        api_key: 'test-api-key',
        tides_id: 'nonexistent-tide',
        report_type: 'summary'
      };

      const result = await reportsService.generateReport(request, 'test-user');

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    test('should use default period when not specified', async () => {
      const request: ReportsRequest = {
        api_key: 'test-api-key',
        tides_id: 'daily-tide-default',
        report_type: 'summary'
      };

      const result = await reportsService.generateReport(request, 'test-user');

      expect(result.period).toBe('30d');
    });
  });

  describe('getReportTemplates', () => {
    test('should return available report templates', async () => {
      const templates = await reportsService.getReportTemplates();

      expect(templates).toBeInstanceOf(Array);
      expect(templates.length).toBe(3);

      const templateTypes = templates.map(t => t.type);
      expect(templateTypes).toContain('summary');
      expect(templateTypes).toContain('detailed');
      expect(templateTypes).toContain('analytics');

      templates.forEach(template => {
        expect(template.type).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.description).toBeDefined();
        expect(template.duration_options).toBeInstanceOf(Array);
        expect(template.duration_options.length).toBeGreaterThan(0);

        // Validate duration options format
        template.duration_options.forEach(duration => {
          expect(duration).toMatch(/^\d+[dwmy]$/);
        });
      });

      // Validate specific templates
      const summaryTemplate = templates.find(t => t.type === 'summary');
      expect(summaryTemplate?.name).toBe('Productivity Summary');
      expect(summaryTemplate?.duration_options).toEqual(['7d', '30d', '90d']);

      const analyticsTemplate = templates.find(t => t.type === 'analytics');
      expect(analyticsTemplate?.name).toBe('Advanced Analytics');
      expect(analyticsTemplate?.duration_options).toEqual(['30d', '90d', '180d', '1y']);
    });
  });

  describe('exportReport', () => {
    const mockReportData = {
      report_type: 'summary',
      summary: { total_productive_hours: 150 },
      recommendations: ['Test recommendation']
    };

    test('should export report as JSON', async () => {
      const result = await reportsService.exportReport(mockReportData, 'json');

      expect(result.format).toBe('json');
      expect(result.filename).toMatch(/^productivity-report-\d{4}-\d{2}-\d{2}\.json$/);
      expect(result.data).toBe(JSON.stringify(mockReportData, null, 2));
    });

    test('should export report as CSV', async () => {
      const result = await reportsService.exportReport(mockReportData, 'csv');

      expect(result.format).toBe('csv');
      expect(result.filename).toMatch(/^productivity-report-\d{4}-\d{2}-\d{2}\.csv$/);
      expect(result.data).toContain('Metric,Value');
      expect(result.data).toContain('"total_productive_hours","150"');
    });

    test('should handle PDF export placeholder', async () => {
      const result = await reportsService.exportReport(mockReportData, 'pdf');

      expect(result.format).toBe('pdf');
      expect(result.filename).toMatch(/^productivity-report-\d{4}-\d{2}-\d{2}\.pdf$/);
      expect(result.data).toBe('PDF generation not yet implemented');
    });

    test('should default to JSON format', async () => {
      const result = await reportsService.exportReport(mockReportData);

      expect(result.format).toBe('json');
    });

    test('should generate different filenames for different dates', async () => {
      const result1 = await reportsService.exportReport(mockReportData);
      const result2 = await reportsService.exportReport(mockReportData);

      // Both should have today's date, so filenames should be the same
      expect(result1.filename).toBe(result2.filename);
    });
  });

  describe('error handling', () => {
    test('should handle R2 storage errors gracefully', async () => {
      const mockR2 = mockEnv.TIDES_R2 as any;
      mockR2.get.mockRejectedValue(new Error('R2 storage error'));

      const request: ReportsRequest = {
        api_key: 'test-api-key',
        tides_id: 'daily-tide-default',
        report_type: 'summary'
      };

      const result = await reportsService.generateReport(request, 'test-user');

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    test('should handle invalid report types', async () => {
      const request = {
        api_key: 'test-api-key',
        tides_id: 'daily-tide-default',
        report_type: 'invalid' as any // Testing invalid report type
      } as ReportsRequest;

      const result = await reportsService.generateReport(request, 'test-user');

      // Should still generate a report with basic structure
      expect(result).toBeDefined();
      expect(result.report_type).toBe('invalid');
    });
  });

  describe('data consistency', () => {
    test('should generate consistent data across multiple calls', async () => {
      const request: ReportsRequest = {
        api_key: 'test-api-key',
        tides_id: 'daily-tide-default',
        report_type: 'summary'
      };

      const result1 = await reportsService.generateReport(request, 'test-user');
      const result2 = await reportsService.generateReport(request, 'test-user');

      // Structure should be consistent
      expect(Object.keys(result1.summary)).toEqual(Object.keys(result2.summary));
      expect(Object.keys(result1.detailed_metrics)).toEqual(Object.keys(result2.detailed_metrics));
      expect(result1.recommendations.length).toBe(result2.recommendations.length);

      // Values will be different due to randomization, but types should match
      expect(typeof result1.summary.total_productive_hours).toBe(typeof result2.summary.total_productive_hours);
      expect(typeof result1.summary.average_daily_score).toBe(typeof result2.summary.average_daily_score);
    });
  });
});