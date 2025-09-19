//
//  InvestigationDetailView.swift
//  compass
//
//  Created by MATTHEW PAZARYNA on 9/19/25.
//

import SwiftUI
import SwiftData

struct InvestigationDetailView: View {
    let investigation: Investigation

    @Environment(InvestigationService.self) private var investigationService
    @Environment(MLService.self) private var mlService
    @Environment(AppleEcosystemService.self) private var ecosystemService

    enum ViewState {
        case ready
        case processing
        case error(String)
    }

    @State private var viewState: ViewState = .ready
    @State private var messageText = ""
    @State private var showingKnowledgeBase = false
    @State private var showingInsights = false

    private var isViewStateReady: Bool {
        if case .ready = viewState {
            return true
        }
        return false
    }

    var body: some View {
        VStack(spacing: 0) {
            // Stage Header
            stageHeaderView

            // Messages
            messagesView

            // Input Area
            messageInputView
        }
        .navigationTitle(investigation.title)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItemGroup(placement: .primaryAction) {
                Menu {
                    Button {
                        showingKnowledgeBase = true
                    } label: {
                        Label("Knowledge Base", systemImage: "book")
                    }

                    Button {
                        showingInsights = true
                    } label: {
                        Label("Insights", systemImage: "lightbulb")
                    }

                    Divider()

                    Button {
                        Task {
                            await exportToReminders()
                        }
                    } label: {
                        Label("Export to Reminders", systemImage: "checklist")
                    }

                    Button {
                        exportToNotes()
                    } label: {
                        Label("Export to Notes", systemImage: "note.text")
                    }

                    Divider()

                    Button {
                        Task {
                            await generateArtifact(.specification)
                        }
                    } label: {
                        Label("Generate Specification", systemImage: "doc.text")
                    }

                    if investigation.stage.nextStage != nil {
                        Divider()
                        Button {
                            Task {
                                await advanceStage()
                            }
                        } label: {
                            Label("Advance Stage", systemImage: "arrow.right.circle")
                        }
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .sheet(isPresented: $showingKnowledgeBase) {
            KnowledgeBaseView(investigation: investigation)
        }
        .sheet(isPresented: $showingInsights) {
            InsightsView(investigation: investigation)
        }
        .task {
            // Start conversation if no messages exist
            if investigation.messages.isEmpty {
                do {
                    try await investigationService.startInvestigation(for: investigation)
                } catch {
                    viewState = .error(error.localizedDescription)
                }
            }
        }
    }

    private var stageHeaderView: some View {
        VStack(spacing: 8) {
            HStack {
                Image(systemName: investigation.stage.systemImage)
                    .foregroundStyle(.blue)

                Text(investigation.stage.displayName)
                    .font(.headline)
                    .foregroundStyle(.primary)

                Spacer()

                if case .processing = viewState {
                    ProgressView()
                        .scaleEffect(0.8)
                }
            }

            // Stage progress indicator
            StageProgressView(currentStage: investigation.stage)
        }
        .padding()
        .background(.regularMaterial, in: Rectangle())
    }

    private var messagesView: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: 12) {
                    ForEach(investigation.messages.sorted(by: { $0.timestamp < $1.timestamp })) { message in
                        MessageBubbleView(message: message)
                            .id(message.id)
                    }

                    if case .error(let errorMessage) = viewState {
                        ErrorMessageView(message: errorMessage) {
                            viewState = .ready
                        }
                    }
                }
                .padding(.horizontal)
                .padding(.top, 8)
            }
            .onChange(of: investigation.messages.count) { _, _ in
                // Auto-scroll to bottom when new message arrives
                if let lastMessage = investigation.messages.last {
                    withAnimation(.easeOut(duration: 0.3)) {
                        proxy.scrollTo(lastMessage.id, anchor: .bottom)
                    }
                }
            }
        }
    }

    private var messageInputView: some View {
        VStack(spacing: 0) {
            Divider()

            HStack(alignment: .bottom, spacing: 12) {
                TextField("Type your message...", text: $messageText, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                    .lineLimit(1...6)
                    .disabled(!isViewStateReady)

                Button {
                    Task {
                        await sendMessage()
                    }
                } label: {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.title2)
                        .foregroundStyle(messageText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? Color.secondary : Color.blue)
                }
                .disabled(messageText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || !isViewStateReady)
            }
            .padding()
        }
        .background(.regularMaterial)
    }

    private func sendMessage() async {
        let text = messageText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }

        messageText = ""
        viewState = .processing

        do {
            try await investigationService.processMessage(text, for: investigation)
            viewState = .ready
        } catch {
            viewState = .error(error.localizedDescription)
        }
    }

    private func advanceStage() async {
        do {
            try investigationService.advanceStage(investigation)
        } catch {
            viewState = .error("Failed to advance stage: \(error.localizedDescription)")
        }
    }

    private func generateArtifact(_ type: ArtifactType) async {
        do {
            try await investigationService.generateArtifact(type: type, for: investigation)
        } catch {
            viewState = .error("Failed to generate artifact: \(error.localizedDescription)")
        }
    }

    private func exportToReminders() async {
        do {
            try await ecosystemService.exportToReminders(investigation: investigation)
        } catch {
            viewState = .error("Failed to export to Reminders: \(error.localizedDescription)")
        }
    }

    private func exportToNotes() {
        let content = ecosystemService.createNotesContent(investigation: investigation)
        ecosystemService.openInNotes(content: content)
    }
}

struct MessageBubbleView: View {
    let message: Message

    var body: some View {
        HStack {
            if message.role == .user {
                Spacer(minLength: 60)
            }

            VStack(alignment: message.role == .user ? .trailing : .leading, spacing: 4) {
                // Use proper markdown rendering for assistant messages
                if message.role == .assistant {
                    Text(LocalizedStringKey(message.content))
                        .font(.body)
                        .foregroundStyle(.primary)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .background {
                            RoundedRectangle(cornerRadius: 20)
                                .fill(Color(.systemGray5))
                        }
                        .textSelection(.enabled)
                } else {
                    Text(message.content)
                        .font(.body)
                        .foregroundStyle(.white)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .background {
                            RoundedRectangle(cornerRadius: 20)
                                .fill(Color.blue)
                        }
                }

                Text(message.timestamp, style: .time)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 4)
            }

            if message.role == .assistant {
                Spacer(minLength: 60)
            }
        }
    }
}

struct StageProgressView: View {
    let currentStage: InvestigationStage

    private let allStages = InvestigationStage.allCases

    var body: some View {
        HStack(spacing: 4) {
            ForEach(Array(allStages.enumerated()), id: \.offset) { index, stage in
                Circle()
                    .fill(stage == currentStage ? Color.blue : (isCompleted(stage) ? Color.blue.opacity(0.3) : Color(.systemGray5)))
                    .frame(width: 8, height: 8)

                if index < allStages.count - 1 {
                    Rectangle()
                        .fill(isCompleted(stage) && currentStage != stage ? Color.blue.opacity(0.3) : Color(.systemGray5))
                        .frame(height: 2)
                }
            }
        }
        .padding(.horizontal, 4)
    }

    private func isCompleted(_ stage: InvestigationStage) -> Bool {
        guard let currentIndex = allStages.firstIndex(of: currentStage),
              let stageIndex = allStages.firstIndex(of: stage) else {
            return false
        }
        return stageIndex <= currentIndex
    }
}

struct ErrorMessageView: View {
    let message: String
    let onRetry: () -> Void

    var body: some View {
        HStack {
            Spacer(minLength: 60)

            VStack(alignment: .trailing, spacing: 8) {
                Text(message)
                    .font(.caption)
                    .foregroundStyle(.red)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background {
                        RoundedRectangle(cornerRadius: 16)
                            .fill(.red.opacity(0.1))
                            .stroke(.red.opacity(0.3), lineWidth: 1)
                    }

                Button("Dismiss") {
                    onRetry()
                }
                .font(.caption)
                .foregroundStyle(.red)
            }
        }
    }
}

// Placeholder views for sheets
struct KnowledgeBaseView: View {
    let investigation: Investigation

    var body: some View {
        NavigationStack {
            List(investigation.knowledgeEntries, id: \.id) { entry in
                VStack(alignment: .leading, spacing: 4) {
                    Text(entry.key)
                        .font(.headline)
                    Text(entry.value)
                        .font(.body)
                        .foregroundStyle(.secondary)
                }
                .padding(.vertical, 2)
            }
            .navigationTitle("Knowledge Base")
            .navigationBarTitleDisplayMode(.inline)
        }
        .presentationDetents([.medium, .large])
    }
}

struct InsightsView: View {
    let investigation: Investigation

    var body: some View {
        NavigationStack {
            List(investigation.insights, id: \.id) { insight in
                VStack(alignment: .leading, spacing: 4) {
                    Text(insight.content)
                        .font(.body)

                    if let category = insight.category {
                        Text(category)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(.quaternary, in: Capsule())
                    }
                }
                .padding(.vertical, 2)
            }
            .navigationTitle("Insights")
            .navigationBarTitleDisplayMode(.inline)
        }
        .presentationDetents([.medium, .large])
    }
}

#Preview {
    let config = ModelConfiguration(isStoredInMemoryOnly: true)
    let container = try! ModelContainer(for: Investigation.self, configurations: config)

    // Create sample investigation with messages
    let investigation = Investigation(title: "Sample Investigation")
    investigation.stage = .questioning

    let userMessage = Message(role: .user, content: "I want to redesign our mobile app to improve user engagement.")
    let assistantMessage = Message(role: .assistant, content: "That's an excellent goal. To better understand your objectives, could you tell me more about the current user engagement challenges you're facing?")

    userMessage.investigation = investigation
    assistantMessage.investigation = investigation
    investigation.messages = [userMessage, assistantMessage]

    container.mainContext.insert(investigation)

    return InvestigationDetailView(investigation: investigation)
        .modelContainer(container)
        .environment(InvestigationService(
            modelContext: container.mainContext,
            mlService: MLService()
        ))
        .environment(MLService())
}