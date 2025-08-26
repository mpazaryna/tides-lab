// BLUE

import React, { useState, useRef, useEffect } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { authService } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import { AuthNavigationParams } from "../../navigation/AuthNavigator";
import { colors, spacing } from "../../design-system/tokens.ts";
import { Text } from "../../components/Text.tsx";
import { Input } from "../../components/Input.tsx";
import { Button } from "../../components/Button.tsx";

interface InitialScreenProps {}

type NavigationProp = NativeStackNavigationProp<
  AuthNavigationParams,
  "Initial"
>;

export default function Initial({}: InitialScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const navigation = useNavigation<NavigationProp>();
  const { signIn } = useAuth();
  const emailRef = useRef<TextInput>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const validateEmail = (emailValue: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValue) {
      setEmailError("Email is required");
      return false;
    }
    if (!emailRegex.test(emailValue)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (passwordValue: string) => {
    if (!passwordValue) {
      setPasswordError("Password is required");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleEmailBlur = () => {
    validateEmail(email);
  };

  const handlePasswordBlur = () => {
    validatePassword(password);
  };

  async function signInWithEmail() {
    if (!validateEmail(email) || !validatePassword(password)) {
      return;
    }

    setLoading(true);
    console.log('[Initial] Calling AuthContext.signIn');
    
    try {
      await signIn(email.trim(), password);
      console.log('[Initial] Sign in successful through AuthContext');
      // Navigation will happen automatically through AuthContext
    } catch (error) {
      console.error('[Initial] Sign in failed:', error);
      // TODO: Show error to user
    }
    setLoading(false);
  }

  // async function signInWithProvider(provider: "google" | "github" | "apple") {
  //   setLoading(true);
  //   const { error } = await supabase.auth.signInWithOAuth({ provider });
  //   if (error) {
  //   } else {
  //   }
  //   setLoading(false);
  // }

  return (
    <View style={styles.container}>
      <Text variant="h2" align="center" style={styles.title}>
        Welcome to Tides
      </Text>

      <View style={styles.formContainer}>
        <Input
          label="Email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
          }}
          onBlur={handleEmailBlur}
          placeholder="email@address.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          error={emailError}
        />

        <Input
          label="Password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
          }}
          onBlur={handlePasswordBlur}
          placeholder="Password"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoComplete="password"
          error={passwordError}
          rightIcon={
            <TouchableOpacity
              onPress={() => {
                setShowPassword(!showPassword);
              }}
            >
              <Text variant="bodySmall" color={colors.primary[500]}>
                {showPassword ? "Hide" : "Show"}
              </Text>
            </TouchableOpacity>
          }
        />

        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          onPress={() => {
            signInWithEmail();
          }}
          disabled={loading}
          style={{ marginBottom: spacing[4] }}
        >
          Sign In
        </Button>

        <Button
          variant="ghost"
          size="md"
          fullWidth
          onPress={() => {
            navigation.navigate("CreateAccount");
          }}
          disabled={loading}
          style={{ marginBottom: spacing[6] }}
        >
          Create an Account
        </Button>

        {/* <View style={styles.dividerContainer}>
          <Text variant="bodySmall" color="secondary">
            Or continue with
          </Text>
        </View>

        <View style={styles.socialButtonsContainer}>
          <Button
            variant="outline"
            size="md"
            style={styles.socialButton}
            onPress={() => {
              signInWithProvider("apple");
            }}
            disabled={loading}
          >
            Apple
          </Button>

          <Button
            variant="outline"
            size="md"
            style={styles.socialButton}
            onPress={() => {
              signInWithProvider("google");
            }}
            disabled={loading}
          >
            Google
          </Button>

          <Button
            variant="outline"
            size="md"
            style={styles.socialButton}
            onPress={() => {
              signInWithProvider("github");
            }}
            disabled={loading}
          >
            GitHub
          </Button>
        </View> */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    justifyContent: "center",
    paddingHorizontal: spacing[4],
  },
  title: {
    marginBottom: spacing[8],
  },
  formContainer: {
    width: "100%",
  },
  dividerContainer: {
    alignItems: "center",
    marginBottom: spacing[4],
  },
  socialButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing[3],
  },
  socialButton: {
    flex: 1,
  },
});
