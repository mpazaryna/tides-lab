#!/usr/bin/env swift

import Foundation
import CoreGraphics
import CoreText
import ImageIO
import UniformTypeIdentifiers

func createCompassIcon(size: CGSize, backgroundColor: CGColor, letterColor: CGColor) -> CGImage? {
    // Create the context
    guard let colorSpace = CGColorSpace(name: CGColorSpace.sRGB) else { return nil }
    guard let context = CGContext(
        data: nil,
        width: Int(size.width),
        height: Int(size.height),
        bitsPerComponent: 8,
        bytesPerRow: 0,
        space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    ) else { return nil }

    // Fill background with rounded rect (iOS app icon style)
    let rect = CGRect(origin: .zero, size: size)
    let cornerRadius = size.width * 0.18 // Apple's standard rounded corner ratio

    context.setFillColor(backgroundColor)
    let path = CGPath(roundedRect: rect, cornerWidth: cornerRadius, cornerHeight: cornerRadius, transform: nil)
    context.addPath(path)
    context.fillPath()

    // Draw the "C" letter
    context.setFillColor(letterColor)

    // Calculate font size and position
    let fontSize = size.width * 0.6
    let font = CTFontCreateWithName("SF Pro Display" as CFString, fontSize, nil) ??
               CTFontCreateWithName("Helvetica" as CFString, fontSize, nil)

    // Create attributed string with Core Text attributes
    let attributes: [CFString: Any] = [
        kCTFontAttributeName: font,
        kCTForegroundColorAttributeName: letterColor
    ]
    let attributedString = CFAttributedStringCreate(nil, "C" as CFString, attributes as CFDictionary)!

    // Get text bounds
    let line = CTLineCreateWithAttributedString(attributedString)
    let textBounds = CTLineGetBoundsWithOptions(line, CTLineBoundsOptions.useOpticalBounds)

    // Center the text
    let textX = (size.width - textBounds.width) / 2 - textBounds.origin.x
    let textY = (size.height - textBounds.height) / 2 - textBounds.origin.y

    // Draw the text
    context.textMatrix = CGAffineTransform.identity
    context.translateBy(x: textX, y: textY)
    CTLineDraw(line, context)

    return context.makeImage()
}

func saveImageToPNG(image: CGImage, url: URL) -> Bool {
    guard let destination = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil) else {
        return false
    }

    CGImageDestinationAddImage(destination, image, nil)
    return CGImageDestinationFinalize(destination)
}

// Define colors
let blueColor = CGColor(red: 0.0, green: 0.478, blue: 1.0, alpha: 1.0) // iOS blue
let whiteColor = CGColor(red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0)
let blackColor = CGColor(red: 0.0, green: 0.0, blue: 0.0, alpha: 1.0)
let darkGrayColor = CGColor(red: 0.11, green: 0.11, blue: 0.12, alpha: 1.0) // iOS dark mode background

// Create the icons
let iconSize = CGSize(width: 1024, height: 1024)

// Light mode icon (blue background, white C)
if let lightIcon = createCompassIcon(size: iconSize, backgroundColor: blueColor, letterColor: whiteColor) {
    let lightURL = URL(fileURLWithPath: "compass/Assets.xcassets/AppIcon.appiconset/compass-icon-1024.png")
    if saveImageToPNG(image: lightIcon, url: lightURL) {
        print("✅ Created light mode icon: compass-icon-1024.png")
    } else {
        print("❌ Failed to save light mode icon")
    }
}

// Dark mode icon (dark background, white C)
if let darkIcon = createCompassIcon(size: iconSize, backgroundColor: darkGrayColor, letterColor: whiteColor) {
    let darkURL = URL(fileURLWithPath: "compass/Assets.xcassets/AppIcon.appiconset/compass-icon-1024-dark.png")
    if saveImageToPNG(image: darkIcon, url: darkURL) {
        print("✅ Created dark mode icon: compass-icon-1024-dark.png")
    } else {
        print("❌ Failed to save dark mode icon")
    }
}

// Tinted icon (white background, blue C)
if let tintedIcon = createCompassIcon(size: iconSize, backgroundColor: whiteColor, letterColor: blueColor) {
    let tintedURL = URL(fileURLWithPath: "compass/Assets.xcassets/AppIcon.appiconset/compass-icon-1024-tinted.png")
    if saveImageToPNG(image: tintedIcon, url: tintedURL) {
        print("✅ Created tinted icon: compass-icon-1024-tinted.png")
    } else {
        print("❌ Failed to save tinted icon")
    }
}

print("🎉 Icon generation complete!")