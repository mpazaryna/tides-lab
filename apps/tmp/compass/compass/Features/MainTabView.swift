//
//  MainTabView.swift
//  compass
//
//  Created by MATTHEW PAZARYNA on 9/19/25.
//

import SwiftUI
import SwiftData

struct MainTabView: View {
    var body: some View {
        TabView {
            InvestigationListView()
                .tabItem {
                    Label("Home", systemImage: "house")
                }

            UtilsView()
                .tabItem {
                    Label("Utils", systemImage: "gear")
                }
        }
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