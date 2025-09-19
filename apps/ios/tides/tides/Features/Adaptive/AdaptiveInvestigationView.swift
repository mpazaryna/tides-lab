//
//  AdaptiveInvestigationView.swift
//  compass
//
//  Created by MATTHEW PAZARYNA on 9/19/25.
//

import SwiftUI
import SwiftData

struct AdaptiveInvestigationView: View {
    let investigation: Investigation
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @Environment(\.verticalSizeClass) private var verticalSizeClass

    var body: some View {
        if horizontalSizeClass == .compact {
            // iPhone, compact iPad
            InvestigationDetailView(investigation: investigation)
        } else if verticalSizeClass == .compact {
            // iPad landscape
            LandscapeInvestigationView(investigation: investigation)
        } else {
            // iPad portrait
            PadInvestigationView(investigation: investigation)
        }
    }
}

// Future: macOS support will be added here

struct LandscapeInvestigationView: View {
    let investigation: Investigation

    var body: some View {
        HStack(spacing: 0) {
            // Conversation takes 2/3 of width
            InvestigationDetailView(investigation: investigation)
                .frame(maxWidth: .infinity)

            Divider()

            // Sidebar takes 1/3 of width
            VStack(alignment: .leading, spacing: 16) {
                Text("Tools")
                    .font(.headline)
                    .padding(.horizontal)

                ScrollView {
                    VStack(spacing: 8) {
                        NavigationLink(destination: KnowledgeBaseView(investigation: investigation)) {
                            Label("Knowledge", systemImage: "book")
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .buttonStyle(.bordered)

                        NavigationLink(destination: InsightsView(investigation: investigation)) {
                            Label("Insights", systemImage: "lightbulb")
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .buttonStyle(.bordered)
                    }
                    .padding(.horizontal)
                }
            }
            .frame(maxWidth: 250)
        }
        .navigationBarHidden(true)
    }
}

struct PadInvestigationView: View {
    let investigation: Investigation

    var body: some View {
        InvestigationDetailView(investigation: investigation)
            .navigationBarTitleDisplayMode(.large)
    }
}

#Preview {
    let config = ModelConfiguration(isStoredInMemoryOnly: true)
    let container = try! ModelContainer(for: Investigation.self, configurations: config)

    let investigation = Investigation(title: "Sample Investigation")
    container.mainContext.insert(investigation)

    return AdaptiveInvestigationView(investigation: investigation)
        .modelContainer(container)
        .environment(InvestigationService(
            modelContext: container.mainContext,
            mlService: MLService()
        ))
        .environment(MLService())
        .environment(AppleEcosystemService())
}