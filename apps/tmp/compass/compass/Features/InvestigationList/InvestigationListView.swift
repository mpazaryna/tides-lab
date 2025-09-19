//
//  InvestigationListView.swift
//  compass
//
//  Created by MATTHEW PAZARYNA on 9/19/25.
//

import SwiftUI
import SwiftData

struct InvestigationListView: View {
    @Query(sort: \Investigation.updatedAt, order: .reverse)
    private var investigations: [Investigation]

    @Environment(\.modelContext) private var modelContext
    @Environment(InvestigationService.self) private var investigationService

    @State private var showingNewInvestigation = false
    @State private var newInvestigationTitle = ""

    var body: some View {
        NavigationStack {
            Group {
                if investigations.isEmpty {
                    emptyStateView
                } else {
                    investigationsList
                }
            }
            .navigationTitle("Compass")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showingNewInvestigation = true
                    } label: {
                        Image(systemName: "plus")
                    }
                    .accessibilityLabel("New Investigation")
                }
            }
            .sheet(isPresented: $showingNewInvestigation) {
                SimpleBearingSelectionView()
            }
        }
    }

    private var investigationsList: some View {
        List {
            ForEach(investigations) { investigation in
                NavigationLink(destination: AdaptiveInvestigationView(investigation: investigation)) {
                    InvestigationRowView(investigation: investigation)
                }
                .listRowSeparator(.hidden)
                .listRowBackground(Color.clear)
            }
            .onDelete(perform: deleteInvestigations)
        }
        .listStyle(.plain)
        .refreshable {
            // Refresh logic if needed
        }
    }

    private var emptyStateView: some View {
        ContentUnavailableView {
            Label("No Investigations", systemImage: "lightbulb")
        } description: {
            Text("Start your first investigation to explore complex topics systematically.")
        } actions: {
            Button("New Investigation") {
                showingNewInvestigation = true
            }
            .buttonStyle(.borderedProminent)
        }
    }

    private var newInvestigationSheet: some View {
        NavigationStack {
            VStack(spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Investigation Topic")
                        .font(.headline)
                        .foregroundStyle(.secondary)

                    TextField("What would you like to explore?", text: $newInvestigationTitle, axis: .vertical)
                        .textFieldStyle(.roundedBorder)
                        .lineLimit(3, reservesSpace: true)
                }

                Spacer()
            }
            .padding()
            .navigationTitle("New Investigation")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        showingNewInvestigation = false
                        newInvestigationTitle = ""
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") {
                        createInvestigation()
                    }
                    .disabled(newInvestigationTitle.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
        .presentationDetents([.medium])
        .presentationDragIndicator(.visible)
    }

    private func createInvestigation() {
        do {
            let _ = try investigationService.createInvestigation(title: newInvestigationTitle.trimmingCharacters(in: .whitespacesAndNewlines))
            showingNewInvestigation = false
            newInvestigationTitle = ""
        } catch {
            // Handle error - could show alert
            print("Failed to create investigation: \(error)")
        }
    }

    private func deleteInvestigations(offsets: IndexSet) {
        for index in offsets {
            let investigation = investigations[index]
            do {
                try investigationService.deleteInvestigation(investigation)
            } catch {
                print("Failed to delete investigation: \(error)")
            }
        }
    }
}

struct InvestigationRowView: View {
    let investigation: Investigation

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(investigation.title)
                    .font(.headline)
                    .lineLimit(2)

                Spacer()

                Text(investigation.updatedAt, style: .relative)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            HStack {
                Label(investigation.stage.displayName, systemImage: investigation.stage.systemImage)
                    .font(.caption)
                    .foregroundStyle(.secondary)

                Spacer()

                if !investigation.messages.isEmpty {
                    Text("\(investigation.messages.count) messages")
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

// InvestigationDetailView is now in its own file

#Preview {
    let config = ModelConfiguration(isStoredInMemoryOnly: true)
    let container = try! ModelContainer(for: Investigation.self, configurations: config)
    InvestigationListView()
        .modelContainer(container)
        .environment(InvestigationService(
            modelContext: container.mainContext,
            mlService: MLService()
        ))
}