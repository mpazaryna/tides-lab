//
//  AppleIntelligenceService.swift
//  compass
//
//  Created by MATTHEW PAZARYNA on 9/19/25.
//

import Foundation
import CoreML

/// Service for integrating with Apple's on-device intelligence capabilities
/// Currently uses fallback implementations with architecture ready for future Apple Intelligence APIs
@Observable
class AppleIntelligenceService {

    enum IntegrationStatus {
        case unavailable(reason: String)
        case fallbackMode
        case ready
    }

    var status: IntegrationStatus = .fallbackMode
    var isProcessing = false

    init() {
        checkAvailability()
    }

    // MARK: - Availability Checking

    private func checkAvailability() {
        // Check device capabilities and iOS version
        if #available(iOS 17.0, *) {
            // Future: Check for Apple Intelligence availability
            // For now, use fallback mode
            status = .fallbackMode
        } else {
            status = .unavailable(reason: "iOS 17.0 or later required")
        }
    }

    // MARK: - Text Processing

    func processText(_ text: String, context: String) async throws -> String {
        isProcessing = true
        defer { isProcessing = false }

        switch status {
        case .unavailable(let reason):
            throw AppleIntelligenceError.unavailable(reason)

        case .fallbackMode:
            return await processFallback(text, context: context)

        case .ready:
            // Future: Use actual Apple Intelligence APIs
            return await processFallback(text, context: context)
        }
    }

    // MARK: - Fallback Implementation

    private func processFallback(_ text: String, context: String) async -> String {
        // Simulate processing time
        let delay = UInt64.random(in: 800_000_000...2_500_000_000)
        try? await Task.sleep(nanoseconds: delay)

        // Enhanced fallback responses based on content analysis
        return generateIntelligentResponse(for: text, context: context)
    }

    private func generateIntelligentResponse(for text: String, context: String) -> String {
        let analysis = analyzeTextContent(text)

        switch context {
        case "Initial":
            return generateInitialStageResponse(analysis: analysis)
        case "Questioning":
            return generateQuestioningResponse(analysis: analysis)
        case "Knowledge Building":
            return generateKnowledgeBuildingResponse(analysis: analysis)
        case "Exploration":
            return generateExplorationResponse(analysis: analysis)
        case "Synthesis":
            return generateSynthesisResponse(analysis: analysis)
        case "Spec Creation":
            return generateSpecResponse(analysis: analysis)
        default:
            return "I'm here to guide you through this investigation. What would you like to explore?"
        }
    }

    // MARK: - Content Analysis

    private func analyzeTextContent(_ text: String) -> TextAnalysis {
        let lowercased = text.lowercased()

        return TextAnalysis(
            originalText: text,
            containsGoals: lowercased.contains("goal") || lowercased.contains("objective") || lowercased.contains("want") || lowercased.contains("successful"),
            containsProblems: lowercased.contains("problem") || lowercased.contains("challenge") || lowercased.contains("issue"),
            containsUsers: lowercased.contains("user") || lowercased.contains("customer") || lowercased.contains("people") || lowercased.contains("attended"),
            containsTechnical: lowercased.contains("technical") || lowercased.contains("code") || lowercased.contains("develop"),
            containsBusiness: lowercased.contains("business") || lowercased.contains("market") || lowercased.contains("revenue") || lowercased.contains("practice"),
            sentiment: determineSentiment(lowercased),
            wordCount: text.components(separatedBy: .whitespacesAndNewlines).filter { !$0.isEmpty }.count
        )
    }

    private func determineSentiment(_ text: String) -> Sentiment {
        let positiveWords = ["great", "excellent", "good", "excited", "positive", "success"]
        let negativeWords = ["problem", "issue", "difficult", "challenge", "concern", "worried"]

        let positiveCount = positiveWords.reduce(0) { count, word in
            count + (text.contains(word) ? 1 : 0)
        }

        let negativeCount = negativeWords.reduce(0) { count, word in
            count + (text.contains(word) ? 1 : 0)
        }

        if positiveCount > negativeCount {
            return .positive
        } else if negativeCount > positiveCount {
            return .negative
        } else {
            return .neutral
        }
    }
}

// MARK: - Supporting Types

struct TextAnalysis {
    let originalText: String
    let containsGoals: Bool
    let containsProblems: Bool
    let containsUsers: Bool
    let containsTechnical: Bool
    let containsBusiness: Bool
    let sentiment: Sentiment
    let wordCount: Int
}

enum Sentiment {
    case positive, negative, neutral
}

enum AppleIntelligenceError: LocalizedError {
    case unavailable(String)
    case processingFailed(String)

    var errorDescription: String? {
        switch self {
        case .unavailable(let reason):
            return "Apple Intelligence unavailable: \(reason)"
        case .processingFailed(let reason):
            return "Processing failed: \(reason)"
        }
    }
}

// MARK: - Response Generation Extensions

extension AppleIntelligenceService {

    private func generateInitialStageResponse(analysis: TextAnalysis) -> String {
        let text = analysis.originalText.lowercased()

        // Check for specific success indicators
        if text.contains("practice") && (text.contains("attended") || text.contains("people")) {
            return "That's a compelling vision - building a practice that draws a broader audience beyond your immediate circle. What type of practice are you developing, and what specific outcomes would indicate you've achieved this broader reach?"
        }

        if text.contains("successful") && text.contains("business") {
            return "Building a successful business is an excellent goal. What does success look like to you specifically, and what are the key challenges you're currently facing in achieving that vision?"
        }

        if analysis.containsGoals && analysis.wordCount > 15 {
            return "I can see you have a clear vision in mind. To build a comprehensive understanding of how to achieve this, let me ask some targeted questions that will help us explore all the important aspects systematically."
        }

        if analysis.wordCount > 20 {
            return "Thank you for that detailed context. To ensure we explore this systematically, what specific goals are you hoping to achieve, and what would success look like?"
        }

        return "Thanks for sharing that. To ensure we explore this thoroughly, could you tell me more about your specific goals and what success would look like to you?"
    }

    private func generateQuestioningResponse(analysis: TextAnalysis) -> String {
        let text = analysis.originalText.lowercased()

        // Check for teaching/education context
        if text.contains("teach") || text.contains("education") || text.contains("training") {
            if text.contains("group") || text.contains("size") {
                return "Teaching to a mid-sized group is a great goal - it shows you're ready to scale beyond personal connections. What subject or skill will you be teaching, and what size group are you envisioning (10-20 people, 20-50, larger)?"
            }
            return "I see you're focused on teaching and education. What specific topics or skills do you plan to teach, and who is your ideal student or participant?"
        }

        // Check for audience/scale context
        if (text.contains("group") || text.contains("audience")) && text.contains("not just") {
            return "Growing beyond your immediate circle is an important milestone. What strategies have you considered for reaching this broader audience, and what barriers do you anticipate?"
        }

        if analysis.containsProblems && analysis.containsUsers {
            return "That's valuable insight about both the challenges and user impact. Understanding these connections is crucial. Can you tell me more about how these problems specifically affect your users' experience?"
        }

        if analysis.containsTechnical && analysis.containsBusiness {
            return "I can see this involves both technical and business considerations. How do these technical requirements align with your business objectives and constraints?"
        }

        if analysis.containsUsers {
            return "User perspective is essential. How do you currently gather feedback from users, and what are the most common pain points they express?"
        }

        return "That provides helpful context. Let me dig deeper: What specific constraints or requirements should we keep in mind as we explore solutions?"
    }

    private func generateKnowledgeBuildingResponse(analysis: TextAnalysis) -> String {
        return "I'm organizing the information you've shared into our knowledge base. Based on the patterns emerging, I'd like to explore a few more areas to ensure we have a complete picture. What additional context would be most helpful to share?"
    }

    private func generateExplorationResponse(analysis: TextAnalysis) -> String {
        if analysis.containsTechnical {
            return "That's an interesting technical approach. Let's also consider alternative strategies. Have you evaluated different architectural patterns or explored how similar challenges are solved in your industry?"
        }

        return "Great input. Now let's explore this from different angles. What would happen if we approached this challenge from the perspective of different stakeholders or alternative frameworks?"
    }

    private func generateSynthesisResponse(analysis: TextAnalysis) -> String {
        return """
        Let me synthesize the key insights we've gathered:

        • Core focus: \(analysis.containsUsers ? "User-centered approach" : "System optimization")
        • Primary consideration: \(analysis.containsTechnical ? "Technical implementation" : "Strategic planning")
        • Key challenge area: \(analysis.containsProblems ? "Problem resolution" : "Enhancement and growth")

        Does this synthesis capture the essential elements? What would you add or modify?
        """
    }

    private func generateSpecResponse(analysis: TextAnalysis) -> String {
        if analysis.containsTechnical {
            return """
            Perfect. Based on our investigation, here's a structured technical approach:

            **Technical Requirements:**
            • Architecture considerations based on your constraints
            • Implementation approach aligned with your goals
            • Integration patterns for your existing systems

            **Next Steps:**
            • Detailed technical specification
            • Implementation roadmap
            • Risk assessment and mitigation

            Should I elaborate on any of these areas?
            """
        }

        return "Excellent. Based on our comprehensive investigation, I'm ready to help create a detailed specification. Would you prefer I focus on strategic recommendations, technical requirements, or implementation roadmap?"
    }
}