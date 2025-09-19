//
//  InvestigationService.swift
//  compass
//
//  Created by MATTHEW PAZARYNA on 9/19/25.
//

import Foundation
import SwiftData

@Observable
class InvestigationService {
    private let modelContext: ModelContext
    private let mlService: MLService

    var currentInvestigation: Investigation?
    var isProcessing = false
    var error: String?

    init(modelContext: ModelContext, mlService: MLService) {
        self.modelContext = modelContext
        self.mlService = mlService
    }

    // MARK: - Investigation Management

    func createInvestigation(title: String, bearingName: String? = nil) throws -> Investigation {
        let investigation = Investigation(title: title, bearingName: bearingName)
        modelContext.insert(investigation)
        try modelContext.save()
        return investigation
    }

    func deleteInvestigation(_ investigation: Investigation) throws {
        modelContext.delete(investigation)
        try modelContext.save()
    }

    // MARK: - Message Processing

    func processMessage(_ text: String, for investigation: Investigation) async throws {
        isProcessing = true
        error = nil

        do {
            // Add user message
            let userMessage = Message(role: .user, content: text)
            userMessage.investigation = investigation
            investigation.messages.append(userMessage)
            investigation.updateTimestamp()

            try modelContext.save()

            // Extract knowledge from user input in background
            Task {
                await extractKnowledgeFromMessage(text, for: investigation)
            }

            // Process with ML service - pass the full investigation for context
            let response = try await mlService.processPrompt(
                text,
                context: investigation.stage.displayName,
                investigation: investigation
            )

            // Add assistant response
            let assistantMessage = Message(role: .assistant, content: response)
            assistantMessage.investigation = investigation
            investigation.messages.append(assistantMessage)
            investigation.updateTimestamp()

            try modelContext.save()

            // Generate insights periodically
            if investigation.messages.count % 4 == 0 {
                Task {
                    await generateInsightsForInvestigation(investigation)
                }
            }

            // Check for stage advancement
            if shouldAdvanceStage(investigation) {
                try advanceStage(investigation)
            }

        } catch {
            self.error = error.localizedDescription
            throw error
        }

        isProcessing = false
    }

    // MARK: - Stage Management

    func advanceStage(_ investigation: Investigation) throws {
        guard let nextStage = investigation.stage.nextStage else { return }
        investigation.stage = nextStage
        investigation.updateTimestamp()
        try modelContext.save()
    }

    private func shouldAdvanceStage(_ investigation: Investigation) -> Bool {
        let messageCount = investigation.messages.count

        switch investigation.stage {
        case .initial:
            return messageCount >= 4 // 2 exchanges to understand the topic
        case .questioning:
            return messageCount >= 8 // 4 exchanges to gather information
        case .knowledgeBuilding:
            return messageCount >= 12 // 6 exchanges to build knowledge base
        case .exploration:
            return messageCount >= 16 // 8 exchanges to explore alternatives
        case .synthesis:
            return messageCount >= 20 // 10 exchanges to synthesize findings
        case .specCreation:
            return false // Final stage
        }
    }

    // MARK: - Knowledge Extraction

    private func extractKnowledgeFromMessage(_ text: String, for investigation: Investigation) async {
        do {
            let entries = try await mlService.extractKnowledgeEntries(from: text)

            for entry in entries {
                // Check if similar entry already exists
                let existingEntry = investigation.knowledgeEntries.first { existing in
                    existing.key.lowercased() == entry.key.lowercased() ||
                    existing.category == entry.category
                }

                if existingEntry == nil {
                    entry.investigation = investigation
                    investigation.knowledgeEntries.append(entry)
                }
            }

            investigation.updateTimestamp()
            try modelContext.save()
        } catch {
            // Silently handle knowledge extraction errors
            print("Knowledge extraction failed: \(error)")
        }
    }

    private func generateInsightsForInvestigation(_ investigation: Investigation) async {
        do {
            let insights = try await mlService.generateInsights(from: investigation.knowledgeEntries)

            for insight in insights {
                // Check if similar insight already exists
                let existingInsight = investigation.insights.first { existing in
                    existing.content.lowercased().contains(insight.content.prefix(50).lowercased()) ||
                    existing.category == insight.category
                }

                if existingInsight == nil {
                    insight.investigation = investigation
                    investigation.insights.append(insight)
                }
            }

            investigation.updateTimestamp()
            try modelContext.save()
        } catch {
            // Silently handle insight generation errors
            print("Insight generation failed: \(error)")
        }
    }

    // MARK: - Knowledge Management

    func addKnowledgeEntry(key: String, value: String, category: String? = nil, to investigation: Investigation) throws {
        let entry = KnowledgeEntry(key: key, value: value, category: category)
        entry.investigation = investigation
        investigation.knowledgeEntries.append(entry)
        investigation.updateTimestamp()
        try modelContext.save()
    }

    func addInsight(content: String, category: String? = nil, to investigation: Investigation) throws {
        let insight = Insight(content: content, category: category)
        insight.investigation = investigation
        investigation.insights.append(insight)
        investigation.updateTimestamp()
        try modelContext.save()
    }

    // MARK: - Investigation Initialization

    func startInvestigation(for investigation: Investigation) async throws {
        guard investigation.messages.isEmpty else { return }

        isProcessing = true
        error = nil

        do {
            let welcomeMessage = try await mlService.processPrompt(
                "Starting investigation: \(investigation.title)",
                context: investigation.stage.displayName,
                investigation: investigation
            )

            let assistantMessage = Message(role: .assistant, content: welcomeMessage)
            assistantMessage.investigation = investigation
            investigation.messages.append(assistantMessage)
            investigation.updateTimestamp()

            try modelContext.save()
        } catch {
            self.error = error.localizedDescription
            throw error
        }

        isProcessing = false
    }

    // MARK: - Artifact Generation

    func generateArtifact(type: ArtifactType, for investigation: Investigation) async throws {
        isProcessing = true
        error = nil

        do {
            // Simple artifact generation for now
            let artifactContent = "# \(investigation.title) - \(type.displayName)\n\nGenerated artifact content."

            let artifact = Artifact(
                name: "\(type.displayName) - \(investigation.title)",
                type: type,
                content: artifactContent
            )

            artifact.investigation = investigation
            investigation.artifacts.append(artifact)
            investigation.updateTimestamp()

            try modelContext.save()
        } catch {
            self.error = error.localizedDescription
            throw error
        }

        isProcessing = false
    }
}