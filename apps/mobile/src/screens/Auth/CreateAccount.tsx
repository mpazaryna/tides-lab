// BLUE

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../../context/AuthContext";
import { AuthStackParamList } from "../../navigation/types";
import { colors, spacing } from "../../design-system/tokens";
import { Container } from "../../components/Container";
import { Text } from "../../components/Text";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";

interface CreateAccountScreenProps {}

type NavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "CreateAccount"
>;

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
    gap: spacing[3],
  },
  passwordRequirements: {
    marginBottom: spacing[4],
    padding: spacing[3],
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
  },
  requirementItem: {
    marginBottom: 2,
  },
});

export default function CreateAccount({}: CreateAccountScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const navigation = useNavigation<NavigationProp>();
  const { signUp } = useAuth();
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
    if (passwordValue.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return false;
    }
    if (!/(?=.*[a-z])/.test(passwordValue)) {
      setPasswordError("Password must contain at least one lowercase letter");
      return false;
    }
    if (!/(?=.*[A-Z])/.test(passwordValue)) {
      setPasswordError("Password must contain at least one uppercase letter");
      return false;
    }
    if (!/(?=.*\d)/.test(passwordValue)) {
      setPasswordError("Password must contain at least one number");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const validateConfirmPassword = (confirmPasswordValue: string) => {
    if (!confirmPasswordValue) {
      setConfirmPasswordError("Please confirm your password");
      return false;
    }
    if (confirmPasswordValue !== password) {
      setConfirmPasswordError("Passwords do not match");
      return false;
    }
    setConfirmPasswordError("");
    return true;
  };

  const handleEmailBlur = () => {
    validateEmail(email);
  };

  const handlePasswordBlur = () => {
    validatePassword(password);
  };

  const handleConfirmPasswordBlur = () => {
    validateConfirmPassword(confirmPassword);
  };

  const getPasswordRequirements = () => {
    const requirements = [
      { text: "At least 8 characters", met: password.length >= 8 },
      { text: "One lowercase letter", met: /(?=.*[a-z])/.test(password) },
      { text: "One uppercase letter", met: /(?=.*[A-Z])/.test(password) },
      { text: "One number", met: /(?=.*\d)/.test(password) },
    ];
    return requirements;
  };

  async function createAccount() {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (!isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    setLoading(true);
    console.log('[CreateAccount] Calling AuthContext.signUp');
    
    try {
      await signUp(email.trim(), password);
      console.log('[CreateAccount] Sign up successful through AuthContext');
      // Navigation will happen automatically through AuthContext
    } catch (error) {
      console.error('[CreateAccount] Sign up failed:', error);
      Alert.alert("Error", error instanceof Error ? error.message : "Sign up failed");
    }
    
    setLoading(false);
  }

  return (
    <Container padding={5} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            navigation.goBack();
          }}
        >
          <Text variant="body" color={colors.primary[500]}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text variant="h2" style={{ marginLeft: spacing[4] }}>
          Create Account
        </Text>
      </View>

      <View style={styles.content}>
        <Input
          ref={emailRef}
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
          autoComplete="new-password"
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

        {password.length > 0 && (
          <View style={styles.passwordRequirements}>
            <Text variant="caption" color="secondary">
              Password Requirements:
            </Text>
            {getPasswordRequirements().map((req, index) => (
              <Text
                key={index}
                variant="caption"
                color={req.met ? colors.success : "tertiary"}
                style={styles.requirementItem}
              >
                {req.met ? "✓" : "○"} {req.text}
              </Text>
            ))}
          </View>
        )}

        <Input
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
          }}
          onBlur={handleConfirmPasswordBlur}
          placeholder="Confirm Password"
          secureTextEntry={!showConfirmPassword}
          autoCapitalize="none"
          autoComplete="new-password"
          error={confirmPasswordError}
          rightIcon={
            <TouchableOpacity
              onPress={() => {
                setShowConfirmPassword(!showConfirmPassword);
              }}
            >
              <Text variant="bodySmall" color={colors.primary[500]}>
                {showConfirmPassword ? "Hide" : "Show"}
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
            createAccount();
          }}
          disabled={loading}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </Button>
      </View>
    </Container>
  );
}
