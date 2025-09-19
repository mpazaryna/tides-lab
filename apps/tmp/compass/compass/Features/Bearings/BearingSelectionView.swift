//
//  BearingSelectionView.swift
//  compass
//
//  Created by MATTHEW PAZARYNA on 9/19/25.
//

import SwiftUI
import SwiftData
import UIKit

struct BearingSelectionView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(InvestigationService.self) private var investigationService

    @State private var selectedBearing: BearingConfig?
    @State private var investigationTitle = ""
    @State private var showingCustomInvestigation = false

    private let bearings = BearingsRegistry.shared.getAllBearings()

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Choose Your Bearing")
                        .font(.title2)
                        .fontWeight(.semibold)

                    Text("Select a domain-specific template to guide your investigation, or create a custom exploration.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(bearings) { bearing in
                            BearingCard(
                                bearing: bearing,
                                isSelected: selectedBearing?.id == bearing.id
                            ) {
                                selectedBearing = bearing
                                investigationTitle = bearing.title
                            }
                        }

                        // Custom investigation option
                        CustomInvestigationCard(isSelected: selectedBearing == nil) {
                            selectedBearing = nil
                            showingCustomInvestigation = true
                        }
                    }
                }

                Spacer()

                // Create button
                Button(action: createInvestigation) {
                    Text("Start Investigation")
                        .font(.headline)
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(canCreateInvestigation ? Color.blue : Color(UIColor.systemGray))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .disabled(!canCreateInvestigation)
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
            .sheet(isPresented: $showingCustomInvestigation) {
                CustomInvestigationSheet(investigationTitle: $investigationTitle)
            }
        }
    }

    private var canCreateInvestigation: Bool {
        return !investigationTitle.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    private func createInvestigation() {
        do {
            let _ = try investigationService.createInvestigation(
                title: investigationTitle.trimmingCharacters(in: .whitespacesAndNewlines),
                bearingName: selectedBearing?.name
            )
            dismiss()
        } catch {
            // Handle error
            print("Failed to create investigation: \(error)")
        }
    }
}

struct BearingCard: View {
    let bearing: BearingConfig
    let isSelected: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(bearing.title)
                            .font(.headline)
                            .foregroundStyle(.primary)

                        Text(bearing.description)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.leading)
                    }

                    Spacer()

                    Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                        .foregroundStyle(isSelected ? .blue : Color(UIColor.tertiaryLabel))
                        .font(.title2)
                }

                // Show some exploration tasks as preview
                VStack(alignment: .leading, spacing: 4) {
                    Text("Key Areas:")
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundStyle(.secondary)

                    ForEach(bearing.explorationTasks.prefix(3)) { task in
                        HStack(alignment: .top, spacing: 6) {
                            Image(systemName: "circle.fill")
                                .font(.system(size: 4))
                                .foregroundStyle(Color(UIColor.tertiaryLabel))
                                .padding(.top, 6)

                            Text(task.text)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .multilineTextAlignment(.leading)
                        }
                    }

                    if bearing.explorationTasks.count > 3 {
                        Text("+ \(bearing.explorationTasks.count - 3) more areas")
                            .font(.caption)
                            .foregroundStyle(Color(UIColor.tertiaryLabel))
                            .padding(.leading, 12)
                    }
                }
            }
            .padding()
            .background(isSelected ? Color.blue.opacity(0.1) : Color(UIColor.systemGray6))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? Color.blue : Color.clear, lineWidth: 2)
            )
        }
        .buttonStyle(.plain)
    }
}

struct CustomInvestigationCard: View {
    let isSelected: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Custom Investigation")
                        .font(.headline)
                        .foregroundStyle(.primary)

                    Text("Create your own investigation without a predefined template")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.leading)
                }

                Spacer()

                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(isSelected ? .blue : Color(UIColor.tertiaryLabel))
                    .font(.title2)
            }
            .padding()
            .background(isSelected ? Color.blue.opacity(0.1) : Color(UIColor.systemGray6))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? Color.blue : Color.clear, lineWidth: 2)
            )
        }
        .buttonStyle(.plain)
    }
}

struct CustomInvestigationSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Binding var investigationTitle: String

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Custom Investigation")
                        .font(.headline)

                    Text("What would you like to investigate?")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                TextField("Investigation topic...", text: $investigationTitle, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                    .lineLimit(3, reservesSpace: true)

                Spacer()
            }
            .padding()
            .navigationTitle("Custom Investigation")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        dismiss()
                    }
                    .disabled(investigationTitle.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
        .presentationDetents([.medium])
    }
}

#Preview {
    BearingSelectionView()
        .environment(InvestigationService(
            modelContext: try! ModelContainer(for: Investigation.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true)).mainContext,
            mlService: MLService()
        ))
}