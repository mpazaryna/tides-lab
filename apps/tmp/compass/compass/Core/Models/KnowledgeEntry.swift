//
//  KnowledgeEntry.swift
//  compass
//
//  Created by MATTHEW PAZARYNA on 9/19/25.
//

import Foundation
import SwiftData

@Model
class KnowledgeEntry {
    @Attribute(.unique) var id: UUID
    var key: String
    var value: String
    var category: String?
    var createdAt: Date

    var investigation: Investigation?

    init(key: String, value: String, category: String? = nil) {
        self.id = UUID()
        self.key = key
        self.value = value
        self.category = category
        self.createdAt = Date()
    }
}

@Model
class Insight {
    @Attribute(.unique) var id: UUID
    var content: String
    var category: String?
    var createdAt: Date

    var investigation: Investigation?

    init(content: String, category: String? = nil) {
        self.id = UUID()
        self.content = content
        self.category = category
        self.createdAt = Date()
    }
}

@Model
class Artifact {
    @Attribute(.unique) var id: UUID
    var name: String
    var type: ArtifactType
    var content: String
    var createdAt: Date

    var investigation: Investigation?

    init(name: String, type: ArtifactType, content: String) {
        self.id = UUID()
        self.name = name
        self.type = type
        self.content = content
        self.createdAt = Date()
    }
}

enum ArtifactType: String, Codable, CaseIterable {
    case specification
    case roadmap
    case report
    case other

    var displayName: String {
        switch self {
        case .specification: return "Specification"
        case .roadmap: return "Roadmap"
        case .report: return "Report"
        case .other: return "Other"
        }
    }

    var systemImage: String {
        switch self {
        case .specification: return "doc.text.below.ecg"
        case .roadmap: return "map.fill"
        case .report: return "doc.richtext"
        case .other: return "doc"
        }
    }
}