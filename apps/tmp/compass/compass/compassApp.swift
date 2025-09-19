//
//  compassApp.swift
//  compass
//
//  Created by MATTHEW PAZARYNA on 9/19/25.
//

import SwiftUI
import SwiftData

@main
struct CompassApp: App {
    let modelContainer: ModelContainer

    init() {
        do {
            modelContainer = try ModelContainer(for: Investigation.self)
        } catch {
            fatalError("Failed to create ModelContainer: \(error)")
        }
    }

    var body: some Scene {
        WindowGroup {
            AdaptiveNavigationView()
                .modelContainer(modelContainer)
                .environment(createInvestigationService())
                .environment(createMLService())
                .environment(AppleEcosystemService())
        }
    }

    private func createInvestigationService() -> InvestigationService {
        InvestigationService(
            modelContext: modelContainer.mainContext,
            mlService: createMLService()
        )
    }

    private func createMLService() -> MLService {
        // Apple Intelligence is built into iOS 26
        // No configuration needed - it just works!
        return MLService()
    }
}
