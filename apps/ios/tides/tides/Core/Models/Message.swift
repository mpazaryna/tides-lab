//
//  Message.swift
//  compass
//
//  Created by MATTHEW PAZARYNA on 9/19/25.
//

import Foundation
import SwiftData

@Model
class Message {
    @Attribute(.unique) var id: UUID
    var role: MessageRole
    var content: String
    var timestamp: Date
    var metadata: String // JSON encoded metadata

    var investigation: Investigation?

    init(role: MessageRole, content: String, metadata: [String: String] = [:]) {
        self.id = UUID()
        self.role = role
        self.content = content
        self.timestamp = Date()

        // Encode metadata as JSON string
        if let data = try? JSONSerialization.data(withJSONObject: metadata, options: []) {
            self.metadata = String(data: data, encoding: .utf8) ?? "{}"
        } else {
            self.metadata = "{}"
        }
    }

    var decodedMetadata: [String: String] {
        guard let data = metadata.data(using: .utf8),
              let dict = try? JSONSerialization.jsonObject(with: data) as? [String: String] else {
            return [:]
        }
        return dict
    }
}

enum MessageRole: String, Codable, CaseIterable {
    case user
    case assistant

    var displayName: String {
        switch self {
        case .user: return "You"
        case .assistant: return "Compass"
        }
    }
}