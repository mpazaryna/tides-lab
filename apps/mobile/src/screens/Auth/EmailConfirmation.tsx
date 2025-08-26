import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { supabase } from "../../config/supabase";
import { AuthStackParamList, Routes, EmailConfirmationScreenProps } from "../../navigation/types";
import { colors, spacing } from "../../design-system/tokens";
import { Container } from "../../components/Container";
import { Text } from "../../components/Text";
import { Button } from "../../components/Button";
import { useAuth } from "../../context/AuthContext";

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, "EmailConfirmation">;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingTop: spacing[12],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing[8],
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[6],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[100],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[6],
  },
  textContainer: {
    alignItems: "center",
    marginBottom: spacing[8],
  },
  emailText: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 8,
    marginVertical: spacing[4],
  },
  buttonContainer: {
    width: "100%",
    gap: spacing[3],
  },
  footerText: {
    marginTop: spacing[6],
    textAlign: "center",
  },
  centeredText: {
    textAlign: "center",
  },
  emailTextBold: {
    fontWeight: '600',
  },
  bodyTextCentered: {
    textAlign: "center",
    lineHeight: 22,
  },
  titleMargin: {
    marginBottom: spacing[3],
    textAlign: "center",
  },
  confirmationTextMargin: {
    textAlign: "center",
    marginBottom: spacing[2],
  },
});

export default function EmailConfirmation() {
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<EmailConfirmationScreenProps["route"]>();
  const { email } = route.params;
  const { user, session } = useAuth();

  // Auto-navigate to Main app when user is authenticated
  useEffect(() => {
    if (user && session) {
      // User has been authenticated, navigate to main app
      navigation.reset({
        index: 0,
        routes: [{ name: Routes.root.main as any }],
      });
    }
  }, [user, session, navigation]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;

    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert(
          "Email Sent", 
          "A new confirmation email has been sent to your inbox."
        );
        setResendCooldown(60); // 60 second cooldown
      }
    } catch (error) {
      Alert.alert("Error", "Failed to resend confirmation email. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    navigation.navigate(Routes.auth.initial);
  };

  const handleChangeEmail = () => {
    navigation.goBack();
  };

  return (
    <Container padding={5} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleChangeEmail}>
          <Text variant="body" color={colors.primary[500]}>
            � Back
          </Text>
        </TouchableOpacity>
        <Text variant="h2" style={{ marginLeft: spacing[4] }}>
          Email Confirmation
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text variant="h1" color={colors.primary[600]}>
            	
          </Text>
        </View>

        <View style={styles.textContainer}>
          <Text variant="h3" style={styles.titleMargin}>
            Check Your Email
          </Text>
          
          <Text variant="body" color="secondary" style={styles.confirmationTextMargin}>
            We've sent a confirmation link to:
          </Text>
          
          <View style={styles.emailText}>
            <Text variant="body" color={colors.primary[700]} style={styles.emailTextBold}>
              {email}
            </Text>
          </View>
          
          <Text variant="body" color="secondary" style={styles.bodyTextCentered}>
            Click the link in your email to verify your account and complete the registration process.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleResendEmail}
            loading={resendLoading}
            disabled={resendCooldown > 0}
          >
            {resendCooldown > 0 
              ? `Resend Email (${resendCooldown}s)` 
              : resendLoading 
                ? "Sending..." 
                : "Resend Email"
            }
          </Button>

          <Button
            variant="outline"
            size="lg"
            fullWidth
            onPress={handleBackToSignIn}
          >
            Back to Sign In
          </Button>
        </View>

        <Text variant="caption" color="tertiary" style={styles.footerText}>
          Didn't receive an email? Check your spam folder or try resending the confirmation email.
          {"\n\n"}
          Once you click the confirmation link, you'll be automatically signed in.
        </Text>
      </View>
    </Container>
  );
}