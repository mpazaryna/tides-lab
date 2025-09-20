#!/usr/bin/env swift

import Foundation
import CoreGraphics
import ImageIO
import CoreText
import UniformTypeIdentifiers

func generatePurpleTIcon(size: CGSize) -> CGImage? {
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    let context = CGContext(data: nil,
                           width: Int(size.width),
                           height: Int(size.height),
                           bitsPerComponent: 8,
                           bytesPerRow: 0,
                           space: colorSpace,
                           bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)

    guard let ctx = context else { return nil }

    // Purple gradient background
    let cornerRadius = size.width * 0.2
    let rect = CGRect(x: 0, y: 0, width: size.width, height: size.height)

    // Create rounded rectangle path
    let path = CGPath(roundedRect: rect, cornerWidth: cornerRadius, cornerHeight: cornerRadius, transform: nil)
    ctx.addPath(path)
    ctx.clip()

    // Purple gradient
    let colors = [
        CGColor(red: 0.4, green: 0.2, blue: 0.8, alpha: 1.0),
        CGColor(red: 0.5, green: 0.3, blue: 0.9, alpha: 1.0)
    ]

    let gradient = CGGradient(colorsSpace: colorSpace, colors: colors as CFArray, locations: [0.0, 1.0])!
    ctx.drawLinearGradient(gradient, start: CGPoint(x: 0, y: 0), end: CGPoint(x: size.width, y: size.height), options: [])

    // Draw white "T" using simple text drawing
    ctx.setFillColor(CGColor(red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0))

    let fontSize = size.width * 0.6
    let fontName = "Helvetica-Bold" as CFString
    let font = CTFontCreateWithName(fontName, fontSize, nil)

    let attributedString = CFAttributedStringCreateMutable(kCFAllocatorDefault, 0)
    CFAttributedStringReplaceString(attributedString, CFRangeMake(0, 0), "T" as CFString)
    CFAttributedStringSetAttribute(attributedString, CFRangeMake(0, 1), kCTFontAttributeName, font)
    CFAttributedStringSetAttribute(attributedString, CFRangeMake(0, 1), kCTForegroundColorAttributeName, CGColor(red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0))

    let line = CTLineCreateWithAttributedString(attributedString!)
    let bounds = CTLineGetBoundsWithOptions(line, CTLineBoundsOptions.useOpticalBounds)

    let x = (size.width - bounds.width) / 2
    let y = (size.height - bounds.height) / 2 - bounds.origin.y

    ctx.textPosition = CGPoint(x: x, y: y)
    CTLineDraw(line, ctx)

    return ctx.makeImage()
}

func savePNGImage(_ image: CGImage, to url: URL) throws {
    guard let destination = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil) else {
        throw NSError(domain: "ImageError", code: 1, userInfo: [NSLocalizedDescriptionKey: "Failed to create image destination"])
    }

    CGImageDestinationAddImage(destination, image, nil)

    if !CGImageDestinationFinalize(destination) {
        throw NSError(domain: "ImageError", code: 2, userInfo: [NSLocalizedDescriptionKey: "Failed to finalize image"])
    }
}

// Generate all icon sizes
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

let outputDir = URL(fileURLWithPath: FileManager.default.currentDirectoryPath).appendingPathComponent("TidesAppIcons")

do {
    try FileManager.default.createDirectory(at: outputDir, withIntermediateDirectories: true)

    for (name, size) in sizes {
        if let image = generatePurpleTIcon(size: size) {
            let fileURL = outputDir.appendingPathComponent("AppIcon-\(name).png")
            try savePNGImage(image, to: fileURL)
            print("Generated: \(fileURL.path)")
        }
    }

    print("\nAll icons generated in: \(outputDir.path)")
    print("Copy these files to your project's Assets.xcassets/AppIcon.appiconset/ folder")

} catch {
    print("Error: \(error)")
}