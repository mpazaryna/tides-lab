//
//  AdaptiveNavigationView.swift
//  compass
//
//  Created by MATTHEW PAZARYNA on 9/19/25.
//

import SwiftUI
import SwiftData

struct AdaptiveNavigationView: View {
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    var body: some View {
        if horizontalSizeClass == .compact {
            // iPhone and compact iPad
            MainTabView()
        } else {
            // iPad in landscape, Mac
            AdaptiveSidebarView()
        }
    }
}

struct AdaptiveSidebarView: View {
    @State private var selectedSection: NavigationSection = .investigations

    enum NavigationSection: String, CaseIterable, Equatable {
        case investigations = "Investigations"
        case utils = "Utils"

        var systemImage: String {
            switch self {
            case .investigations: return "house"
            case .utils: return "gear"
            }
        }
    }

    var body: some View {
        NavigationSplitView {
            // Sidebar
            List {
                ForEach(NavigationSection.allCases, id: \.rawValue) { section in
                    Button(action: {
                        selectedSection = section
                    }) {
                        HStack {
                            Label(section.rawValue, systemImage: section.systemImage)
                                .foregroundStyle(selectedSection == section ? .primary : .secondary)
                            Spacer()
                        }
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .listRowBackground(selectedSection == section ? Color.blue.opacity(0.1) : Color.clear)
                }
            }
            .navigationTitle("Compass")
        } detail: {
            // Detail view
            Group {
                switch selectedSection {
                case .investigations:
                    InvestigationListView()
                case .utils:
                    UtilsView()
                }
            }
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

#Preview("Compact") {
    AdaptiveNavigationView()
        .environment(\.horizontalSizeClass, .compact)
        .modelContainer(try! ModelContainer(for: Investigation.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true)))
        .environment(InvestigationService(
            modelContext: try! ModelContainer(for: Investigation.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true)).mainContext,
            mlService: MLService()
        ))
        .environment(MLService())
        .environment(AppleEcosystemService())
}

#Preview("Regular") {
    AdaptiveNavigationView()
        .environment(\.horizontalSizeClass, .regular)
        .modelContainer(try! ModelContainer(for: Investigation.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true)))
        .environment(InvestigationService(
            modelContext: try! ModelContainer(for: Investigation.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true)).mainContext,
            mlService: MLService()
        ))
        .environment(MLService())
        .environment(AppleEcosystemService())
}