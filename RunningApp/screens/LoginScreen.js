import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { TextInput, Button, Text, Title } from "react-native-paper";
import { useAuth } from "../context/AuthContext";
import { useForm, Controller } from "react-hook-form";

function LoginScreen({ navigation }) {
  const { login, message } = useAuth();
  const [error, setError] = useState(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const handleLogin = async (data) => {
    const { username, password } = data;
    try {
      await login(username, password);
      setError(null);
    } catch (error) {
      setError("Invalid credentials, please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Log In</Title>

      {/* Username Input */}
      <Controller
        control={control}
        name="username"
        rules={{
          required: "Username is required",
        }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            label="Username"
            value={value}
            onChangeText={onChange}
            mode="outlined"
            style={styles.input}
            outlineColor="grey"
            activeOutlineColor="#6A1B9A"
          />
        )}
      />
      {errors.username && (
        <Text style={styles.errorText}>{errors.username.message}</Text>
      )}

      {/* Password Input */}
      <Controller
        control={control}
        name="password"
        rules={{
          required: "Password is required",
          minLength: {
            value: 6,
            message: "Password must be at least 6 characters",
          },
          pattern: {
            value:
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*().\-_=+]).{6,}$/,
            message:
              "Password must include uppercase, lowercase, number, and symbol",
          },
        }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            label="Password"
            value={value}
            onChangeText={onChange}
            mode="outlined"
            style={styles.input}
            outlineColor="grey"
            activeOutlineColor="#6A1B9A"
            secureTextEntry
          />
        )}
      />
      {errors.password && (
        <Text style={styles.errorText}>{errors.password.message}</Text>
      )}

      {/* Login Button */}
      <Button
        mode="contained"
        onPress={handleSubmit(handleLogin)}
        style={styles.button}
        buttonColor="#5335DA"
        contentStyle={styles.buttonContent}
        color="#6A1B9A"
      >
        <Text style={styles.buttonText}>Log in</Text>
      </Button>

      {/* Register Link */}
      <Button
        mode="text"
        onPress={() => navigation.navigate("Register")}
        labelStyle={styles.linkText}
      >
        <Text>Don't have an account? </Text> Register
      </Button>

      {/* Error Message */}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "black",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    borderRadius: 25,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  linkText: {
    color: "#6A1B9A",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginTop: 5,
  },
});

export default LoginScreen;
