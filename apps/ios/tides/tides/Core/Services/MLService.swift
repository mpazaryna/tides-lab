//
//  MLService.swift
//  compass
//
//  Created by MATTHEW PAZARYNA on 9/19/25.
//

import Foundation

@Observable
class MLService {
    private let foundationModelService = AppleFoundationModelService()

    var isAvailable: Bool {
        return foundationModelService.isAvailable
    }

    var isProcessing = false

    init() {
        // Apple Foundation Models are built into iOS 26
        // No configuration needed
    }

    func checkAvailability() async -> MLAvailability {
        // Mock implementation - check device capabilities
        return .available
    }

    func processPrompt(_ prompt: String, context: String? = nil, investigation: Investigation? = nil) async throws -> String {
        isProcessing = true
        defer { isProcessing = false }

        // Use Apple Foundation Models (built into iOS 26)
        if let investigation = investigation {
            return try await foundationModelService.processInvestigationMessage(
                prompt,
                stage: investigation.stage,
                conversationHistory: investigation.messages,
                investigation: investigation
            )
        }

        throw MLError.noInvestigationContext
    }

    func extractKnowledgeEntries(from text: String) async throws -> [KnowledgeEntry] {
        isProcessing = true
        defer { isProcessing = false }

        try await Task.sleep(nanoseconds: 500_000_000)

        // Mock knowledge extraction
        var entries: [KnowledgeEntry] = []

        let text = text.lowercased()
        if text.contains("user") || text.contains("customer") {
            entries.append(KnowledgeEntry(key: "Target Users", value: "User-focused considerations mentioned", category: "Stakeholders"))
        }
        if text.contains("challenge") || text.contains("problem") {
            entries.append(KnowledgeEntry(key: "Key Challenge", value: "Challenge areas identified", category: "Problems"))
        }
        if text.contains("goal") || text.contains("objective") {
            entries.append(KnowledgeEntry(key: "Objective", value: "Goal-oriented input captured", category: "Goals"))
        }

        return entries
    }

    func generateInsights(from entries: [KnowledgeEntry]) async throws -> [Insight] {
        isProcessing = true
        defer { isProcessing = false }

        try await Task.sleep(nanoseconds: 800_000_000)

        // Mock insight generation based on knowledge entries
        var insights: [Insight] = []

        let categories = Set(entries.compactMap { $0.category })

        if categories.contains("Stakeholders") && categories.contains("Problems") {
            insights.append(Insight(content: "Strong alignment between user needs and identified challenges suggests a user-centered approach will be most effective.", category: "Strategic"))
        }

        if categories.contains("Goals") {
            insights.append(Insight(content: "Clear goal definition early in the process indicates strong project foundation and direction.", category: "Process"))
        }

        if entries.count >= 3 {
            insights.append(Insight(content: "Rich information gathering suggests thorough problem understanding - ready for solution exploration.", category: "Progress"))
        }

        return insights
    }

    private func generateMockResponse(for prompt: String, context: String?) -> String {
        guard let context = context else {
            return "Welcome to Compass! I'm here to guide you through a systematic investigation of your topic. Let's start by understanding your goals and what you hope to achieve."
        }

        let promptLower = prompt.lowercased()

        switch context {
        case "Initial":
            if promptLower.contains("goal") || promptLower.contains("want") || promptLower.contains("need") {
                return "Excellent! I can see you have clear objectives. To build a comprehensive understanding, let me ask some targeted questions that will help us explore all the important aspects of this topic."
            }
            return "Thank you for sharing that context. To ensure we explore this thoroughly, I'd like to understand your specific goals and what success looks like to you."

        case "Questioning":
            if promptLower.contains("challenge") || promptLower.contains("problem") {
                return "That's valuable insight about the challenges. Understanding obstacles is crucial for developing effective solutions. Can you tell me more about the root causes or any patterns you've noticed?"
            } else if promptLower.contains("user") || promptLower.contains("customer") {
                return "User perspective is essential. How do you currently gather feedback from users, and what are the most common pain points they express?"
            }
            return "That provides helpful context. Let me dig deeper: What specific constraints or requirements should we keep in mind as we explore solutions?"

        case "Knowledge Building":
            return "I'm organizing the information you've shared into our knowledge base. Based on the patterns emerging, I'd like to explore a few more areas to ensure we have a complete picture. What additional context would be helpful?"

        case "Exploration":
            if promptLower.contains("approach") || promptLower.contains("strategy") {
                return "That's an interesting approach. Let's also consider alternative strategies. Have you evaluated [different methodology] or considered how [industry best practices] might apply here?"
            }
            return "Great input. Now let's explore this from different angles. What would happen if we approached this challenge from the perspective of [stakeholder group] or [alternative framework]?"

        case "Synthesis":
            return "Let me synthesize the key insights we've gathered:\n\n• Core challenge: [Primary issue identified]\n• Key constraints: [Main limitations]\n• Opportunities: [Potential solutions]\n\nDoes this synthesis capture the essential elements? What would you add or modify?"

        case "Spec Creation":
            if promptLower.contains("technical") {
                return "Perfect. I'll focus on technical specifications. Based on our investigation, here's a structured approach:\n\n**Technical Requirements:**\n- [Requirement 1]\n- [Requirement 2]\n\n**Implementation Approach:**\n- [Step 1]\n- [Step 2]\n\nShould I elaborate on any of these areas?"
            }
            return "Excellent. Based on our comprehensive investigation, I'm ready to help create a detailed specification. Would you prefer I focus on strategic recommendations, technical requirements, or implementation roadmap?"

        default:
            return "I'm here to guide you through this systematic investigation. What aspect would you like to explore next?"
        }
    }
}

enum MLError: LocalizedError {
    case noServiceAvailable
    case noInvestigationContext

    var errorDescription: String? {
        switch self {
        case .noServiceAvailable:
            return "Apple Intelligence not available on this device."
        case .noInvestigationContext:
            return "Investigation context required for processing."
        }
    }
}

enum MLAvailability {
    case available
    case unavailable(reason: String)
    case restricted

    var isAvailable: Bool {
        if case .available = self {
            return true
        }
        return false
    }

    var localizedDescription: String {
        switch self {
        case .available:
            return "Apple Intelligence is available"
        case .unavailable(let reason):
            return "Apple Intelligence unavailable: \(reason)"
        case .restricted:
            return "Apple Intelligence is restricted on this device"
        }
    }

    func generateArtifact(type: ArtifactType, investigation: Investigation) async throws -> String {

        try await Task.sleep(nanoseconds: 1_500_000_000) // 1.5 seconds

        // Generate basic artifact content
        switch type {
        case .specification:
            return "# \(investigation.title) - Specification\n\nGenerated specification based on investigation findings."
        case .roadmap:
            return "# \(investigation.title) - Roadmap\n\nImplementation roadmap based on investigation."
        case .report:
            return "# \(investigation.title) - Report\n\nDetailed report of investigation findings."
        case .other:
            return "# \(investigation.title) - Summary\n\nSummary of investigation."
        }
    }
}