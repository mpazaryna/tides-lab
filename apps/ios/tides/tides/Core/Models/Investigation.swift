//
//  Investigation.swift
//  compass
//
//  Created by MATTHEW PAZARYNA on 9/19/25.
//

import Foundation
import SwiftData

@Model
class Investigation {
    @Attribute(.unique) var id: UUID
    var title: String
    var stage: InvestigationStage
    var createdAt: Date
    var updatedAt: Date
    var bearingName: String? // Reference to the bearing used for this investigation

    @Relationship(deleteRule: .cascade)
    var messages: [Message] = []

    @Relationship(deleteRule: .cascade)
    var knowledgeEntries: [KnowledgeEntry] = []

    @Relationship(deleteRule: .cascade)
    var insights: [Insight] = []

    @Relationship(deleteRule: .cascade)
    var artifacts: [Artifact] = []

    init(title: String, bearingName: String? = nil) {
        self.id = UUID()
        self.title = title
        self.stage = .initial
        self.createdAt = Date()
        self.updatedAt = Date()
        self.bearingName = bearingName
    }

    // Computed property to get the bearing configuration
    var bearing: BearingConfig? {
        guard let bearingName = bearingName else { return nil }
        return BearingsRegistry.shared.getBearing(named: bearingName)
    }

    func updateTimestamp() {
        updatedAt = Date()
    }
}

enum InvestigationStage: String, Codable, CaseIterable {
    case initial
    case questioning
    case knowledgeBuilding
    case exploration
    case synthesis
    case specCreation

    var displayName: String {
        switch self {
        case .initial: return "Initial"
        case .questioning: return "Questioning"
        case .knowledgeBuilding: return "Knowledge Building"
        case .exploration: return "Exploration"
        case .synthesis: return "Synthesis"
        case .specCreation: return "Spec Creation"
        }
    }

    var systemImage: String {
        switch self {
        case .initial: return "lightbulb"
        case .questioning: return "questionmark.circle"
        case .knowledgeBuilding: return "book"
        case .exploration: return "map"
        case .synthesis: return "gearshape.2"
        case .specCreation: return "doc.text"
        }
    }

    var nextStage: InvestigationStage? {
        switch self {
        case .initial: return .questioning
        case .questioning: return .knowledgeBuilding
        case .knowledgeBuilding: return .exploration
        case .exploration: return .synthesis
        case .synthesis: return .specCreation
        case .specCreation: return nil
        }
    }
}