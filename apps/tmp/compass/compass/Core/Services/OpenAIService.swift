//
//  OpenAIService.swift
//  compass
//
//  Created by MATTHEW PAZARYNA on 9/19/25.
//

import Foundation

@Observable
class OpenAIService {
    private let apiKey: String
    private let apiURL = "https://api.openai.com/v1/chat/completions"
    private let model = "gpt-4-turbo-preview"

    var isAvailable = true
    var isProcessing = false

    init(apiKey: String = ProcessInfo.processInfo.environment["OPENAI_API_KEY"] ?? "") {
        self.apiKey = apiKey
        self.isAvailable = !apiKey.isEmpty
    }

    // MARK: - Main API Call

    func processInvestigationMessage(
        _ message: String,
        stage: InvestigationStage,
        conversationHistory: [Message],
        knowledgeBase: [KnowledgeEntry]
    ) async throws -> String {

        isProcessing = true
        defer { isProcessing = false }

        // Build the messages array for OpenAI
        var messages: [[String: String]] = []

        // System prompt for Compass methodology
        messages.append([
            "role": "system",
            "content": buildSystemPrompt(for: stage)
        ])

        // Add conversation history (last 10 messages for context)
        let recentHistory = conversationHistory.suffix(10)
        for msg in recentHistory {
            messages.append([
                "role": msg.role == .user ? "user" : "assistant",
                "content": msg.content
            ])
        }

        // Add the current user message
        messages.append([
            "role": "user",
            "content": message
        ])

        // Make API call
        let response = try await callOpenAI(messages: messages)
        return response
    }

    // MARK: - API Communication

    private func callOpenAI(messages: [[String: String]]) async throws -> String {
        guard !apiKey.isEmpty else {
            throw OpenAIError.missingAPIKey
        }

        var request = URLRequest(url: URL(string: apiURL)!)
        request.httpMethod = "POST"
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = [
            "model": model,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 500
        ]

        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw OpenAIError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            throw OpenAIError.httpError(statusCode: httpResponse.statusCode)
        }

        let jsonResponse = try JSONSerialization.jsonObject(with: data) as? [String: Any]

        guard let choices = jsonResponse?["choices"] as? [[String: Any]],
              let firstChoice = choices.first,
              let message = firstChoice["message"] as? [String: Any],
              let content = message["content"] as? String else {
            throw OpenAIError.invalidResponseFormat
        }

        return content
    }

    // MARK: - System Prompts

    private func buildSystemPrompt(for stage: InvestigationStage) -> String {
        let basePrompt = """
        You are Compass, an AI assistant that guides users through systematic investigations of complex topics.
        You use a methodical approach to help users thoroughly explore their questions and challenges.

        IMPORTANT GUIDELINES:
        1. Be conversational and supportive
        2. Ask one focused question at a time
        3. Build on previous responses to deepen understanding
        4. Help identify patterns and connections
        5. Guide toward actionable insights
        """

        let stageSpecificPrompt: String

        switch stage {
        case .initial:
            stageSpecificPrompt = """

            CURRENT STAGE: Initial Understanding
            Your role: Understand the user's goals and what success looks like for them.
            Focus on: Clarifying objectives, understanding context, identifying key stakeholders.
            Ask about: Their vision, current situation, desired outcomes.
            """

        case .questioning:
            stageSpecificPrompt = """

            CURRENT STAGE: Deep Questioning
            Your role: Gather comprehensive information through targeted questions.
            Focus on: Understanding challenges, constraints, resources, and opportunities.
            Ask about: Specific problems, past attempts, available resources, timeline.
            """

        case .knowledgeBuilding:
            stageSpecificPrompt = """

            CURRENT STAGE: Knowledge Building
            Your role: Help organize and structure the information gathered.
            Focus on: Identifying patterns, filling knowledge gaps, categorizing information.
            Ask about: Missing information, assumptions to validate, connections between ideas.
            """

        case .exploration:
            stageSpecificPrompt = """

            CURRENT STAGE: Exploration
            Your role: Explore different angles and alternative approaches.
            Focus on: Creative solutions, different perspectives, unconventional ideas.
            Ask about: Alternative approaches, inspiration from other fields, "what if" scenarios.
            """

        case .synthesis:
            stageSpecificPrompt = """

            CURRENT STAGE: Synthesis
            Your role: Help synthesize findings into coherent insights.
            Focus on: Key themes, actionable insights, priority areas.
            Ask about: Which insights resonate most, priority for action, potential obstacles.
            """

        case .specCreation:
            stageSpecificPrompt = """

            CURRENT STAGE: Specification Creation
            Your role: Help create actionable plans and specifications.
            Focus on: Concrete next steps, success metrics, implementation details.
            Ask about: Resource needs, timeline, success criteria, risk mitigation.
            """
        }

        return basePrompt + stageSpecificPrompt
    }
}

// MARK: - Error Types

enum OpenAIError: LocalizedError {
    case missingAPIKey
    case invalidResponse
    case invalidResponseFormat
    case httpError(statusCode: Int)
    case networkError(Error)

    var errorDescription: String? {
        switch self {
        case .missingAPIKey:
            return "OpenAI API key is not configured"
        case .invalidResponse:
            return "Invalid response from OpenAI"
        case .invalidResponseFormat:
            return "Unexpected response format from OpenAI"
        case .httpError(let statusCode):
            return "OpenAI API error: HTTP \(statusCode)"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        }
    }
}