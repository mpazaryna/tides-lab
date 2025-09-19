//
//  CompassTabView.swift
//  tides
//
//  Created by MATTHEW PAZARYNA on 9/19/25.
//

import SwiftUI
import SwiftData

struct CompassTabView: View {
    var body: some View {
        InvestigationListView()
    }
}

#Preview {
    let config = ModelConfiguration(isStoredInMemoryOnly: true)
    let container = try! ModelContainer(for: Investigation.self, configurations: config)

    return CompassTabView()
        .modelContainer(container)
        .environment(InvestigationService(
            modelContext: container.mainContext,
            mlService: MLService()
        ))
        .environment(MLService())
        .environment(AppleEcosystemService())
}