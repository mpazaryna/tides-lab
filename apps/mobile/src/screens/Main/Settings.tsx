import React, { useState } from "react";
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useMCP } from "../../context/MCPContext";
import { useServerEnvironment } from "../../context/ServerEnvironmentContext";
import { ServerEnvironmentSelector } from "../../components/ServerEnvironmentSelector";
import {
  Button,
  Card,
  colors,
  Container,
  spacing,
  Text,
} from "../../design-system";
import { getRobotoMonoFont } from "../../utils/fonts";

export default function Settings() {
  const { user, signOut, apiKey } = useAuth();
  const { isConnected, loading, error, checkConnection, getCurrentServerUrl } =
    useMCP();
  const { getCurrentEnvironment } = useServerEnvironment();

  // Server environment configuration state
  const [showServerConfig, setShowServerConfig] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {}
  };

  const handleTestConnection = async () => {
    try {
      // Force a refresh to test the actual MCP connection
      await checkConnection();
    } catch (err) {}
  };

  const handleRefreshConnection = async () => {
    try {
      await checkConnection();
    } catch (err) {}
  };

  const handleEnvironmentSelected = async () => {
    // Close the server config panel when environment is selected
    setShowServerConfig(false);

    // Trigger a connection check to verify the new environment
    try {
      await checkConnection();
    } catch (err) {
      // Error handling is done in checkConnection
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Container padding={5} style={styles.content}>
          <Text variant="h2" align="center" style={styles.titleStyle}>
            Settings
          </Text>

          {/* Account Information Section */}
          {user && (
            <Card
              variant="elevated"
              padding={6}
              style={styles.sectionCardStyle}
            >
              <Text variant="h3" style={styles.sectionTitleStyle}>
                Account Information
              </Text>

              <Text
                variant="bodySmall"
                color="secondary"
                align="center"
                style={styles.userSubtitleStyle}
              >
                You're signed in as:
              </Text>
              <Text
                variant="h4"
                color={colors.primary[500]}
                align="center"
                style={styles.userEmailStyle}
              >
                {user.email}
              </Text>
              <Text variant="mono" color="tertiary" align="center">
                User ID: {user.id}
              </Text>
              <Text
                variant="bodySmall"
                color={apiKey ? "success" : "error"}
                align="center"
                style={styles.apiKeyStatusStyle}
              >
                API Key: {apiKey ? "✓ Available" : "✗ Missing"}
              </Text>
            </Card>
          )}

          {/* Server Environment Configuration Section */}
          <Card variant="outlined" padding={5} style={styles.sectionCardStyle}>
            <Text variant="h3" style={styles.sectionTitleStyle}>
              Server Environment
            </Text>

            <TouchableOpacity
              style={styles.serverConfigHeader}
              onPress={() => setShowServerConfig(!showServerConfig)}
            >
              <Text variant="body" weight="medium">
                Current Environment: {getCurrentEnvironment().name}
              </Text>
              <Text variant="bodySmall" color="secondary">
                {getCurrentServerUrl()}
              </Text>
              <Text
                variant="bodySmall"
                color="primary"
                style={styles.toggleTextStyle}
              >
                {showServerConfig
                  ? "▲ Hide Configuration"
                  : "▼ Show Configuration"}
              </Text>
            </TouchableOpacity>

            {showServerConfig && (
              <View style={styles.serverConfigContent}>
                <ServerEnvironmentSelector
                  onEnvironmentSelected={handleEnvironmentSelected}
                  showCurrentUrl={true}
                  showFeatures={false}
                  compact={false}
                />
              </View>
            )}
          </Card>

          {/* MCP Connection Section */}
          <Card variant="elevated" padding={5} style={styles.sectionCardStyle}>
            <Text variant="h3" style={styles.sectionTitleStyle}>
              MCP Connection
            </Text>

            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  isConnected ? styles.connectedDot : styles.disconnectedDot,
                ]}
              />
              <Text variant="body" weight="medium">
                {isConnected ? "Connected" : "Disconnected"}
              </Text>
              {loading && (
                <Text
                  variant="bodySmall"
                  color="secondary"
                  style={styles.loadingTextStyle}
                >
                  {" "}
                  (Loading...)
                </Text>
              )}
            </View>

            <Text
              variant="bodySmall"
              color="secondary"
              align="center"
              style={styles.serverUrlTextStyle}
            >
              Server: {getCurrentServerUrl()}
            </Text>

            {error && (
              <Text
                variant="bodySmall"
                color="error"
                align="center"
                style={styles.errorTextStyle}
              >
                {error}
              </Text>
            )}

            <View style={styles.connectionButtonsRow}>
              <Button
                variant={isConnected ? "secondary" : "primary"}
                size="md"
                onPress={handleRefreshConnection}
                loading={loading}
                style={styles.connectionButton}
              >
                {isConnected ? "Refresh" : "Connect"}
              </Button>

              <Button
                variant="outline"
                size="md"
                onPress={handleTestConnection}
                loading={loading}
                style={styles.connectionButton}
                disabled={!isConnected}
              >
                Test Connection
              </Button>
            </View>
          </Card>

          {/* Debug Information Section */}
          {user && (
            <Card variant="outlined" padding={5} style={styles.debugCardStyle}>
              <Text variant="h3" style={styles.sectionTitleStyle}>
                Debug Information
              </Text>

              <View style={styles.debugSection}>
                <Text variant="body" weight="medium" style={styles.debugLabel}>
                  Environment:
                </Text>
                <Text
                  variant="body"
                  color="secondary"
                  style={styles.debugValue}
                >
                  {getCurrentEnvironment().name} ({getCurrentEnvironment().id})
                </Text>
              </View>

              <View style={styles.debugSection}>
                <Text variant="body" weight="medium" style={styles.debugLabel}>
                  Authorization Token:
                </Text>
                {apiKey ? (
                  <Text
                    variant="mono"
                    color="success"
                    style={styles.debugTokenStyle}
                  >
                    Bearer {apiKey}
                  </Text>
                ) : (
                  <Text variant="body" color="error" style={styles.debugValue}>
                    No API key available
                  </Text>
                )}
              </View>

              <View style={styles.debugSection}>
                <Text variant="body" weight="medium" style={styles.debugLabel}>
                  Token Format Expected:
                </Text>
                <Text
                  variant="bodySmall"
                  color="tertiary"
                  style={styles.debugValue}
                >
                  Bearer tides_[userId]_[randomId]
                </Text>
                <Text
                  variant="bodySmall"
                  color="tertiary"
                  style={styles.debugNote}
                >
                  Mobile clients use custom API keys for enhanced security.
                  Desktop clients use UUID-based Bearer tokens.
                </Text>
              </View>

              <View style={styles.debugSection}>
                <Text variant="body" weight="medium" style={styles.debugLabel}>
                  Token Validation:
                </Text>
                <Text
                  variant="bodySmall"
                  color="info"
                  style={styles.debugValue}
                >
                  {apiKey && apiKey.startsWith("tides_")
                    ? "✓ Valid mobile client format"
                    : apiKey
                    ? "⚠️ Non-standard format (may be desktop UUID)"
                    : "✗ No token available"}
                </Text>
              </View>
            </Card>
          )}

          {/* Sign Out Section */}
          <Button
            variant="danger"
            size="lg"
            onPress={handleSignOut}
            fullWidth
            style={styles.signOutButtonStyle}
          >
            Sign Out
          </Button>
        </Container>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    alignItems: "center",
  },
  titleStyle: {
    marginBottom: spacing[8],
  },
  sectionCardStyle: {
    marginBottom: spacing[6],
    width: "100%",
  },
  sectionTitleStyle: {
    marginBottom: spacing[4],
    textAlign: "center",
  },
  userSubtitleStyle: {
    marginBottom: spacing[2],
  },
  userEmailStyle: {
    marginBottom: spacing[2],
  },
  apiKeyStatusStyle: {
    marginTop: spacing[2],
  },
  serverConfigHeader: {
    alignItems: "center",
  },
  toggleTextStyle: {
    marginTop: spacing[2],
  },
  serverConfigContent: {
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    height: 400, // Fixed height for the selector
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[3],
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing[2],
  },
  connectedDot: {
    backgroundColor: colors.success,
  },
  disconnectedDot: {
    backgroundColor: colors.error,
  },
  serverUrlTextStyle: {
    marginBottom: spacing[3],
    fontFamily: getRobotoMonoFont("regular"),
  },
  errorTextStyle: {
    marginBottom: spacing[3],
  },
  connectionButtonsRow: {
    flexDirection: "row",
    gap: spacing[3],
    marginTop: spacing[4],
  },
  connectionButton: {
    flex: 1,
  },
  loadingTextStyle: {
    fontStyle: "italic",
  },
  debugCardStyle: {
    marginBottom: spacing[6],
    backgroundColor: colors.background.secondary,
    borderColor: colors.neutral[300],
  },
  debugSection: {
    marginBottom: spacing[3],
    paddingBottom: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  debugLabel: {
    marginBottom: spacing[1],
    color: colors.text.primary,
  },
  debugValue: {
    marginBottom: spacing[1],
  },
  debugTokenStyle: {
    marginBottom: spacing[1],
    fontSize: 12,
    lineHeight: 16,
    padding: spacing[2],
    backgroundColor: colors.success + "10",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.success + "30",
  },
  debugNote: {
    fontStyle: "italic",
    lineHeight: 16,
  },
  signOutButtonStyle: {
    marginTop: spacing[4],
  },
});
