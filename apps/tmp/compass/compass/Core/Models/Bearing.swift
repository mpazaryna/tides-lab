//
//  Bearing.swift
//  compass
//
//  Created by MATTHEW PAZARYNA on 9/19/25.
//

import Foundation

struct BearingConfig: Codable, Identifiable {
    let id = UUID()
    let name: String
    let title: String
    let description: String
    let initialContext: String
    let followUpQuestions: [FollowUpQuestion]
    let explorationTasks: [ExplorationTask]
}

struct FollowUpQuestion: Codable, Identifiable {
    let id: String
    let question: String
    let purpose: String
    let required: Bool
}

struct ExplorationTask: Codable, Identifiable {
    let id: String
    let text: String
    let completed: Bool
}

// MARK: - Available Bearings

extension BearingConfig {
    static let personalBrand = BearingConfig(
        name: "personal-brand",
        title: "Personal Brand and Thought Leadership",
        description: "Build authentic personal brand through strategic thought leadership development",
        initialContext: """
# Personal Brand and Thought Leadership Project

This project will systematically develop your personal brand and establish thought leadership in your industry.

## Approach
We'll use a systematic methodology to:
1. **Explore** your unique value proposition, target audience, and market position
2. **Specify** your brand strategy, content pillars, and success metrics
3. **Execute** content creation, engagement, and brand building activities
4. **Feedback** and iterate based on performance data

## Focus Areas
- Industry expertise and unique perspective
- Target audience identification and engagement
- Content strategy and thought leadership positioning
- Systematic brand building and measurement
""",
        followUpQuestions: [
            FollowUpQuestion(
                id: "industry_field",
                question: "What industry or field do you want to be known in?",
                purpose: "Identify niche and focus area for thought leadership",
                required: true
            ),
            FollowUpQuestion(
                id: "unique_perspective",
                question: "What unique perspective or expertise do you bring to this field?",
                purpose: "Define value proposition and differentiators",
                required: true
            ),
            FollowUpQuestion(
                id: "target_audience",
                question: "Who do you want to influence or reach with your thought leadership?",
                purpose: "Target audience identification for focused messaging",
                required: true
            ),
            FollowUpQuestion(
                id: "time_commitment",
                question: "How much time can you dedicate weekly to building your personal brand?",
                purpose: "Resource constraints and realistic planning",
                required: true
            ),
            FollowUpQuestion(
                id: "success_metrics",
                question: "What does success look like for you in 6 months?",
                purpose: "Success metrics and goal setting",
                required: true
            )
        ],
        explorationTasks: [
            ExplorationTask(
                id: "industry_landscape_analysis",
                text: "Analyze current industry landscape and identify thought leadership opportunities",
                completed: false
            ),
            ExplorationTask(
                id: "competitor_thought_leaders",
                text: "Research existing thought leaders in your space and identify differentiation opportunities",
                completed: false
            ),
            ExplorationTask(
                id: "audience_persona_development",
                text: "Develop detailed personas of your target audience and their content consumption habits",
                completed: false
            ),
            ExplorationTask(
                id: "content_pillar_identification",
                text: "Identify 3-5 core content pillars that align with your expertise and audience needs",
                completed: false
            ),
            ExplorationTask(
                id: "platform_strategy_research",
                text: "Research optimal platforms for reaching your target audience and building thought leadership",
                completed: false
            ),
            ExplorationTask(
                id: "personal_brand_audit",
                text: "Audit current online presence and identify gaps in personal brand positioning",
                completed: false
            ),
            ExplorationTask(
                id: "expertise_inventory",
                text: "Document your expertise, experiences, and unique insights that can become content",
                completed: false
            ),
            ExplorationTask(
                id: "engagement_strategy_exploration",
                text: "Explore community engagement strategies and relationship building approaches",
                completed: false
            ),
            ExplorationTask(
                id: "measurement_framework",
                text: "Define metrics and measurement framework for tracking brand building progress",
                completed: false
            )
        ]
    )

    static let audienceResearch = BearingConfig(
        name: "audience-research",
        title: "Audience Research and Persona Development",
        description: "Deeply understand your target audience through systematic research and persona development",
        initialContext: """
# Audience Research and Persona Development Project

This project will systematically research and understand your target audience to create actionable personas and insights.

## Approach
We'll use a systematic methodology to:
1. **Explore** demographics, psychographics, behaviors, and needs of your target market
2. **Specify** detailed personas, journey maps, and key audience insights
3. **Execute** research activities, interviews, and validation studies
4. **Feedback** and refine based on research findings and market response

## Focus Areas
- Demographic and psychographic profiling
- Behavioral patterns and preferences
- Pain points and unmet needs
- Decision-making processes and influences
- Customer journey mapping
""",
        followUpQuestions: [
            FollowUpQuestion(
                id: "target_market",
                question: "Who is your target market or audience segment?",
                purpose: "Define the specific audience segment to research",
                required: true
            ),
            FollowUpQuestion(
                id: "customer_problems",
                question: "What problems or needs are you trying to solve for your audience?",
                purpose: "Identify core problems and value proposition alignment",
                required: true
            ),
            FollowUpQuestion(
                id: "current_understanding",
                question: "What do you currently know about your audience (existing data, assumptions)?",
                purpose: "Baseline current knowledge and identify research gaps",
                required: true
            ),
            FollowUpQuestion(
                id: "research_constraints",
                question: "What constraints or limitations do you have for audience research (budget, time, access)?",
                purpose: "Define research scope and methodology constraints",
                required: true
            ),
            FollowUpQuestion(
                id: "decision_factors",
                question: "What factors influence their decisions in your category?",
                purpose: "Understand decision drivers and purchasing behavior",
                required: true
            )
        ],
        explorationTasks: [
            ExplorationTask(
                id: "demographic_analysis",
                text: "Analyze demographic characteristics of target audience (age, location, income, education)",
                completed: false
            ),
            ExplorationTask(
                id: "psychographic_profiling",
                text: "Develop psychographic profiles including values, interests, lifestyle, and attitudes",
                completed: false
            ),
            ExplorationTask(
                id: "behavioral_pattern_mapping",
                text: "Map behavioral patterns, habits, and preferences relevant to your offering",
                completed: false
            ),
            ExplorationTask(
                id: "pain_point_identification",
                text: "Identify and prioritize key pain points and unmet needs",
                completed: false
            ),
            ExplorationTask(
                id: "journey_mapping",
                text: "Create customer journey maps from awareness to advocacy",
                completed: false
            ),
            ExplorationTask(
                id: "segment_analysis",
                text: "Analyze audience segments and identify primary, secondary, and tertiary targets",
                completed: false
            ),
            ExplorationTask(
                id: "persona_development",
                text: "Develop 3-5 detailed personas representing key audience segments",
                completed: false
            ),
            ExplorationTask(
                id: "interview_planning",
                text: "Plan and structure customer interviews and research activities",
                completed: false
            ),
            ExplorationTask(
                id: "validation_framework",
                text: "Create validation framework for testing assumptions and hypotheses",
                completed: false
            )
        ]
    )
}

// MARK: - Bearings Registry

class BearingsRegistry {
    static let shared = BearingsRegistry()

    private let availableBearings: [BearingConfig] = [
        .personalBrand,
        .audienceResearch
    ]

    private init() {}

    func getAllBearings() -> [BearingConfig] {
        return availableBearings
    }

    func getBearing(named name: String) -> BearingConfig? {
        return availableBearings.first { $0.name == name }
    }

    func bearingExists(_ name: String) -> Bool {
        return availableBearings.contains { $0.name == name }
    }
}