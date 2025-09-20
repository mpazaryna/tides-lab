import SwiftUI
import UIKit

@MainActor
struct PurpleTIconGenerator {
    static func generatePurpleTIcon(size: CGSize) -> UIImage? {
        let iconView = PurpleTView(size: min(size.width, size.height))
            .frame(width: size.width, height: size.height)

        let renderer = ImageRenderer(content: iconView)
        renderer.scale = UIScreen.main.scale
        renderer.proposedSize = ProposedViewSize(size)

        return renderer.uiImage
    }

    static func generateAllAppIconSizes() -> [String: UIImage] {
        var icons: [String: UIImage] = [:]

        // Common iOS app icon sizes
        let sizes: [String: CGSize] = [
            "20x20": CGSize(width: 20, height: 20),
            "29x29": CGSize(width: 29, height: 29),
            "40x40": CGSize(width: 40, height: 40),
            "58x58": CGSize(width: 58, height: 58),
            "60x60": CGSize(width: 60, height: 60),
            "80x80": CGSize(width: 80, height: 80),
            "87x87": CGSize(width: 87, height: 87),
            "120x120": CGSize(width: 120, height: 120),
            "180x180": CGSize(width: 180, height: 180),
            "1024x1024": CGSize(width: 1024, height: 1024)
        ]

        for (name, size) in sizes {
            if let image = generatePurpleTIcon(size: size) {
                icons[name] = image
            }
        }

        return icons
    }

    static func saveAppIconsToBundle() {
        let icons = generateAllAppIconSizes()

        // For development, save to documents directory
        guard let documentsDirectory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first else {
            print("Could not find documents directory")
            return
        }

        let appIconsDirectory = documentsDirectory.appendingPathComponent("TidesAppIcons")

        do {
            try FileManager.default.createDirectory(at: appIconsDirectory, withIntermediateDirectories: true)

            for (name, image) in icons {
                let imageURL = appIconsDirectory.appendingPathComponent("AppIcon-\(name).png")
                if let imageData = image.pngData() {
                    try imageData.write(to: imageURL)
                    print("Saved: \(imageURL.path)")
                }
            }

            print("All Tides app icons saved to: \(appIconsDirectory.path)")
            print("Copy these files to your project's Assets.xcassets/AppIcon.appiconset/ folder")
        } catch {
            print("Error saving app icons: \(error)")
        }
    }
}

struct PurpleTView: View {
    let size: CGFloat

    var body: some View {
        ZStack {
            // Purple gradient background with rounded corners
            RoundedRectangle(cornerRadius: size * 0.2)
                .fill(LinearGradient(
                    gradient: Gradient(colors: [
                        Color(red: 0.4, green: 0.2, blue: 0.8),  // Vibrant purple
                        Color(red: 0.5, green: 0.3, blue: 0.9)   // Slightly lighter purple
                    ]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                ))
                .frame(width: size, height: size)

            // White "T" letter
            Text("T")
                .font(.system(size: size * 0.6, weight: .bold, design: .default))
                .foregroundColor(.white)
                .shadow(color: .black.opacity(0.3), radius: size * 0.02, x: 0, y: size * 0.02)
        }
    }
}

// SwiftUI View for testing the generated icons
struct PurpleTIconPreview: View {
    @State private var icons: [String: UIImage] = [:]

    var body: some View {
        NavigationView {
            ScrollView {
                LazyVStack(spacing: 20) {
                    // Preview of the T icon
                    PurpleTView(size: 100)
                        .padding()

                    if icons.isEmpty {
                        Button("Generate Tides App Icons") {
                            Task {
                                icons = PurpleTIconGenerator.generateAllAppIconSizes()
                                PurpleTIconGenerator.saveAppIconsToBundle()
                            }
                        }
                        .buttonStyle(.borderedProminent)
                        .padding()
                    } else {
                        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 3), spacing: 15) {
                            ForEach(Array(icons.sorted(by: { $0.key < $1.key })), id: \.key) { name, image in
                                VStack(spacing: 8) {
                                    Image(uiImage: image)
                                        .resizable()
                                        .aspectRatio(contentMode: .fit)
                                        .frame(width: 60, height: 60)
                                        .cornerRadius(8)
                                        .shadow(radius: 2)

                                    Text(name)
                                        .font(.caption2)
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                        .padding()

                        Button("Regenerate Icons") {
                            Task {
                                icons = PurpleTIconGenerator.generateAllAppIconSizes()
                                PurpleTIconGenerator.saveAppIconsToBundle()
                            }
                        }
                        .buttonStyle(.bordered)
                        .padding()
                    }
                }
                .padding()
            }
            .navigationTitle("Tides Icon Generator")
        }
    }
}

#Preview {
    PurpleTIconPreview()
}