//
//  tidesApp.swift
//  tides
//
//  Created by MATTHEW PAZARYNA on 9/19/25.
//

import SwiftUI
import SwiftData

@main
struct tidesApp: App {
    var body: some Scene {
        WindowGroup {
            MainTabView()
                .modelContainer(for: Investigation.self)
                .environment(MLService())
                .environment(AppleEcosystemService())
        }
    }
}
