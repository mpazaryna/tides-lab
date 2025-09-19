//
//  MainTabView.swift
//  tides
//
//  Created by MATTHEW PAZARYNA on 9/19/25.
//

import SwiftUI
import SwiftData

struct MainTabView: View {
    var body: some View {
        TabView {
            ContentView()
                .tabItem {
                    Label("Tides", systemImage: "water.waves")
                }

            CompassMainView()
                .tabItem {
                    Label("Compass", systemImage: "safari")
                }
        }
    }
}

struct CompassMainView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(MLService.self) private var mlService

    var body: some View {
        CompassTabView()
            .environment(InvestigationService(
                modelContext: modelContext,
                mlService: mlService
            ))
    }
}

#Preview {
    let config = ModelConfiguration(isStoredInMemoryOnly: true)
    let container = try! ModelContainer(for: Investigation.self, configurations: config)

    return MainTabView()
        .modelContainer(container)
        .environment(InvestigationService(
            modelContext: container.mainContext,
            mlService: MLService()
        ))
        .environment(MLService())
        .environment(AppleEcosystemService())
}