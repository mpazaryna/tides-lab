//
//  AppleFoundationModelService.swift
//  compass
//
//  Created by MATTHEW PAZARYNA on 9/19/25.
//

import Foundation
import FoundationModels

@Observable
class AppleFoundationModelService {
    private let model = SystemLanguageModel.default
    private var session: LanguageModelSession?

    var isAvailable: Bool {
        if case .available = model.availability {
            return true
        }
        return false
    }

    var isProcessing = false

    init() {
        setupSession()
    }

    private func setupSession() {
        guard case .available = model.availability else { return }

        let instructions = """
        You are Compass, a friendly AI guide that helps people think through complex topics systematically.

        CONVERSATION STYLE:
        - Be conversational and natural, like a thoughtful friend
        - Use "I" and "you" - avoid formal language
        - Show genuine interest in what they're sharing
        - Be encouraging and curious, not robotic

        CRITICAL METHODOLOGY:
        1. **ONE QUESTION AT A TIME** - Never overwhelm with multiple questions
        2. **NATURAL FLOW** - Build on their specific response like a real conversation
        3. **ACKNOWLEDGE WARMLY** - Always acknowledge what they shared with genuine interest
        4. **BE CURIOUS** - Ask follow-ups that show you're really listening

        RESPONSE PATTERN:
        - React naturally to what they said (like "That's interesting..." or "I can see why that would be...")
        - Share a brief observation or insight
        - Ask ONE curious follow-up question that builds on their knowledge and experience
        - Focus on what they've learned, discovered, or found valuable rather than problems or challenges
        - Keep it conversational and warm
        - NEVER repeat the same question in different words
        - Listen to what they actually said and build on that specific detail

        Avoid formal phrases like "Thank you for sharing that context" or "Given your experience". Sound human!
        """

        session = LanguageModelSession(instructions: instructions)
    }

    func processInvestigationMessage(
        _ message: String,
        stage: InvestigationStage,
        conversationHistory: [Message],
        investigation: Investigation? = nil
    ) async throws -> String {

        guard let session = session, case .available = model.availability else {
            throw FoundationModelError.modelNotAvailable
        }

        guard !session.isResponding else {
            throw FoundationModelError.sessionBusy
        }

        isProcessing = true
        defer { isProcessing = false }

        // Build stage-specific prompt with conversation intelligence
        let contextualPrompt = buildIntelligentPrompt(message: message, stage: stage, history: conversationHistory, investigation: investigation)

        // Use the REAL Apple Intelligence API
        let response = try await session.respond(to: contextualPrompt)
        return response.content
    }

    private func buildIntelligentPrompt(message: String, stage: InvestigationStage, history: [Message], investigation: Investigation? = nil) -> String {
        let stageContext = getStageContext(stage)
        let conversationAnalysis = analyzeConversationDepth(history: history, stage: stage)

        // Include bearing context if available
        let bearingContext = getBearingContext(investigation: investigation)

        // Include recent conversation for context
        let recentMessages = history.suffix(6) // Last 3 exchanges
            .map { "\($0.role == .user ? "User" : "Assistant"): \($0.content)" }
            .joined(separator: "\n")

        return """
        CURRENT INVESTIGATION STAGE: \(stage.displayName)
        \(stageContext)

        \(bearingContext)

        CONVERSATION INTELLIGENCE:
        \(conversationAnalysis)

        RECENT CONVERSATION:
        \(recentMessages)

        USER'S CURRENT MESSAGE: \(message)

        Respond as Compass. Be conversational and engaging. If the analysis suggests this stage is complete, naturally suggest moving forward. Otherwise, continue exploring with one thoughtful question that directly builds on what they just shared. Don't repeat yourself or ask variations of the same question.
        """
    }

    private func getBearingContext(investigation: Investigation?) -> String {
        guard let investigation = investigation,
              let bearing = investigation.bearing else {
            return ""
        }

        return """

        DOMAIN CONTEXT (from \(bearing.title)):
        \(bearing.initialContext)

        DOMAIN FOCUS AREAS:
        \(bearing.explorationTasks.map { "- \($0.text)" }.joined(separator: "\n"))
        """
    }

    private func analyzeConversationDepth(history: [Message], stage: InvestigationStage) -> String {
        let exchanges = history.count / 2 // Rough estimate of back-and-forth
        let userMessages = history.filter { $0.role == .user }
        let totalUserWords = userMessages.reduce(0) { $0 + $1.content.split(separator: " ").count }

        let depth = determineDepth(exchanges: exchanges, userWords: totalUserWords, stage: stage)

        switch depth {
        case .shallow:
            return "DEPTH: Early exploration - keep digging deeper with curious questions"
        case .developing:
            return "DEPTH: Good momentum building - continue exploring but watch for natural completion"
        case .sufficient:
            return "DEPTH: Rich understanding developed - consider if ready to advance to next stage"
        case .deep:
            return "DEPTH: Thorough exploration complete - suggest moving to next stage naturally"
        }
    }

    private func determineDepth(exchanges: Int, userWords: Int, stage: InvestigationStage) -> ConversationDepth {
        // Adaptive thresholds based on stage
        let minExchanges = stage == .initial ? 2 : 3
        let targetExchanges = stage == .initial ? 3 : 5
        let deepExchanges = stage == .initial ? 4 : 7

        if exchanges < minExchanges || userWords < 50 {
            return .shallow
        } else if exchanges < targetExchanges || userWords < 120 {
            return .developing
        } else if exchanges < deepExchanges || userWords < 200 {
            return .sufficient
        } else {
            return .deep
        }
    }

    enum ConversationDepth {
        case shallow, developing, sufficient, deep
    }

    // Note: Removed simulation code - now using actual Apple Intelligence API

    private func buildContext(for stage: InvestigationStage, history: [Message]) -> String {
        let stageContext = getStageContext(stage)

        // Include recent conversation history
        let recentMessages = history.suffix(10)
            .map { "\($0.role == .user ? "User" : "Assistant"): \($0.content)" }
            .joined(separator: "\n")

        return """
        You are Compass, helping guide a systematic investigation.
        Current stage: \(stage.displayName)
        \(stageContext)

        Recent conversation:
        \(recentMessages)
        """
    }

    private func getStageContext(_ stage: InvestigationStage) -> String {
        switch stage {
        case .initial:
            return """
            INITIAL STAGE: Build rapport and understand their core goal.
            Ask ONE specific question to understand what they're trying to achieve. Don't ask multiple variations of the same thing.
            """
        case .questioning:
            return """
            QUESTIONING STAGE: Dig deeper into their situation with natural curiosity.
            Focus on what they've learned, what's working, what they're excited about. Build understanding organically.
            """
        case .knowledgeBuilding:
            return """
            KNOWLEDGE BUILDING STAGE: You're seeing patterns and connections.
            Help them recognize insights. If conversation feels rich and complete, gently suggest moving forward.
            """
        case .exploration:
            return """
            EXPLORATION STAGE: Explore different perspectives and possibilities.
            Help them see their situation from new angles. Watch for readiness to synthesize learnings.
            """
        case .synthesis:
            return """
            SYNTHESIS STAGE: Connect insights into a coherent understanding.
            Help them see the bigger picture. Prepare to move toward actionable planning.
            """
        case .specCreation:
            return """
            SPEC CREATION STAGE: Transform insights into actionable outcomes.
            Focus on concrete next steps that could go into their Reminders or Notes. Make it practical and achievable.
            """
        }
    }
}

enum FoundationModelError: LocalizedError {
    case modelNotAvailable
    case sessionBusy

    var errorDescription: String? {
        switch self {
        case .modelNotAvailable:
            return "Apple Intelligence model not available"
        case .sessionBusy:
            return "Apple Intelligence session is busy"
        }
    }
}