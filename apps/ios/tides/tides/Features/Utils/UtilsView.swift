//
//  UtilsView.swift
//  compass
//
//  Created by MATTHEW PAZARYNA on 9/19/25.
//

import SwiftUI
import SwiftData

struct UtilsView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(InvestigationService.self) private var investigationService

    @Query private var investigations: [Investigation]

    @State private var showingDeleteAlert = false
    @State private var isDeleting = false

    var body: some View {
        NavigationStack {
            List {
                Section {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Image(systemName: "chart.bar.fill")
                                .foregroundStyle(.blue)
                            Text("Storage")
                                .font(.headline)
                            Spacer()
                        }

                        Text("\(investigations.count) investigations")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)

                        if investigations.count > 0 {
                            let totalMessages = investigations.reduce(0) { $0 + $1.messages.count }
                            Text("\(totalMessages) total messages")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 4)
                }

                Section {
                    Button(action: {
                        showingDeleteAlert = true
                    }) {
                        HStack {
                            Image(systemName: "trash")
                                .foregroundStyle(.red)
                            Text("Delete All Investigations")
                                .foregroundStyle(.red)
                        }
                    }
                    .disabled(investigations.isEmpty || isDeleting)
                } header: {
                    Text("Data Management")
                } footer: {
                    Text("This will permanently delete all your Compass investigations and cannot be undone.")
                }

                Section {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Image(systemName: "info.circle.fill")
                                .foregroundStyle(.blue)
                            Text("About Compass")
                                .font(.headline)
                        }

                        Text("Compass helps you systematically explore complex topics through guided investigations powered by Apple Intelligence.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)

                        Text("Version 1.0")
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                    }
                    .padding(.vertical, 4)
                }
            }
            .navigationTitle("Utils")
            .alert("Delete All Investigations", isPresented: $showingDeleteAlert) {
                Button("Cancel", role: .cancel) { }
                Button("Delete All", role: .destructive) {
                    deleteAllInvestigations()
                }
            } message: {
                Text("This will permanently delete all \(investigations.count) investigations and their messages. This action cannot be undone.")
            }
        }
    }

    private func deleteAllInvestigations() {
        isDeleting = true

        // Delete all investigations
        for investigation in investigations {
            modelContext.delete(investigation)
        }

        do {
            try modelContext.save()
        } catch {
            print("Failed to delete investigations: \(error)")
        }

        isDeleting = false
    }
}

#Preview {
    let config = ModelConfiguration(isStoredInMemoryOnly: true)
    let container = try! ModelContainer(for: Investigation.self, configurations: config)

    // Create some sample data
    let investigation1 = Investigation(title: "Sample Investigation 1")
    let investigation2 = Investigation(title: "Sample Investigation 2")
    container.mainContext.insert(investigation1)
    container.mainContext.insert(investigation2)

    return UtilsView()
        .modelContainer(container)
        .environment(InvestigationService(
            modelContext: container.mainContext,
            mlService: MLService()
        ))
}