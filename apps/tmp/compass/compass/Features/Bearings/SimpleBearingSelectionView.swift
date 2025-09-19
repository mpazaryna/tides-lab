//
//  SimpleBearingSelectionView.swift
//  compass
//
//  Created by MATTHEW PAZARYNA on 9/19/25.
//

import SwiftUI
import SwiftData

struct SimpleBearingSelectionView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(InvestigationService.self) private var investigationService

    @State private var selectedBearingName: String?
    @State private var investigationTitle = ""

    private let bearings = BearingsRegistry.shared.getAllBearings()

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                Text("Choose Your Investigation Type")
                    .font(.title2)
                    .fontWeight(.semibold)

                VStack(spacing: 12) {
                    ForEach(bearings) { bearing in
                        Button(action: {
                            selectedBearingName = bearing.name
                            investigationTitle = bearing.title
                        }) {
                            HStack {
                                VStack(alignment: .leading) {
                                    Text(bearing.title)
                                        .font(.headline)
                                        .foregroundStyle(.primary)
                                    Text(bearing.description)
                                        .font(.subheadline)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                Image(systemName: selectedBearingName == bearing.name ? "checkmark.circle.fill" : "circle")
                                    .foregroundStyle(selectedBearingName == bearing.name ? .blue : .gray)
                            }
                            .padding()
                            .background(selectedBearingName == bearing.name ? .blue.opacity(0.1) : .gray.opacity(0.1))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                        }
                        .buttonStyle(.plain)
                    }

                    // Custom option
                    Button(action: {
                        selectedBearingName = nil
                        investigationTitle = ""
                    }) {
                        HStack {
                            VStack(alignment: .leading) {
                                Text("Custom Investigation")
                                    .font(.headline)
                                    .foregroundStyle(.primary)
                                Text("Create your own investigation")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            Image(systemName: selectedBearingName == nil ? "checkmark.circle.fill" : "circle")
                                .foregroundStyle(selectedBearingName == nil ? .blue : .gray)
                        }
                        .padding()
                        .background(selectedBearingName == nil ? .blue.opacity(0.1) : .gray.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                    .buttonStyle(.plain)
                }

                if selectedBearingName == nil {
                    TextField("Investigation topic...", text: $investigationTitle)
                        .textFieldStyle(.roundedBorder)
                }

                Spacer()

                Button("Create Investigation") {
                    createInvestigation()
                }
                .buttonStyle(.borderedProminent)
                .disabled(investigationTitle.isEmpty)
            }
            .padding()
            .navigationTitle("New Investigation")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }

    private func createInvestigation() {
        do {
            let _ = try investigationService.createInvestigation(
                title: investigationTitle.trimmingCharacters(in: .whitespacesAndNewlines),
                bearingName: selectedBearingName
            )
            dismiss()
        } catch {
            print("Failed to create investigation: \(error)")
        }
    }
}

#Preview {
    SimpleBearingSelectionView()
        .environment(InvestigationService(
            modelContext: try! ModelContainer(for: Investigation.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true)).mainContext,
            mlService: MLService()
        ))
}