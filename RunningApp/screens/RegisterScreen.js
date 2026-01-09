import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import {
  TextInput,
  Button,
  Text,
  Title,
  RadioButton,
} from "react-native-paper";
import mime from "mime";
import * as ImagePicker from "expo-image-picker";
import api from "../axiosInstance";
import { v4 as uuidv4 } from "uuid";
import { useForm, Controller } from "react-hook-form";
import { handleError } from "../utils/errorHandler";
import LoadingIndicator from "../components/LoadingIndicator";
const RegisterScreen = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm({
    defaultValues: {
      username: "",
      firstName: "",
      lastName: "",
      gender: "",
      weight: "",
      height: "",
      birthdate: "",
      email: "",
      password: "",
    },
  });

  const watchStep1Fields = watch([
    "firstName",
    "lastName",
    "username",
    "email",
    "password",
  ]);
  const watchStep2Fields = watch(["gender", "weight", "height", "birthdate"]);

  const isStep1Valid = watchStep1Fields.every((field) => field?.trim() !== "");
  const isStep2Valid = watchStep2Fields.every((field) => field?.trim() !== "");

  const validateStep1 = async () => {
    const isValid = await trigger([
      "firstName",
      "lastName",
      "username",
      "email",
      "password",
    ]);
    if (isValid) {
      setStep(2);
    }
  };

  const uploadProfileImage = async (userId) => {
    if (!image) {
      console.warn("No image selected. Skipping upload.");
      return;
    }

    let localUri = image.uri;
    if (!localUri.startsWith("file://")) {
      localUri = "file://" + localUri;
    }

    const fileExtension = localUri.split(".").pop();

    const mimeType = mime.getType(localUri) || "application/octet-stream";

    const fileName = image.fileName || `${uuidv4()}.${fileExtension}`;

    const formData = new FormData();

    formData.append("file", {
      uri: localUri,
      type: mimeType,
      name: fileName,
    });

    formData.append("userId", userId);

    try {
      const response = await api.post("/auth/uploadProfileImage", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Image upload successful:", response.data);
    } catch (error) {
      handleError(error, "Image upload failed:");
    }
  };

  const handleRegister = async (data) => {
    try {
      const response = await api.post("/auth/register", data);
      if (response?.status === 200 && response?.data?.userId) {
        await uploadProfileImage(response.data.userId);
      }
      alert("Registration successful. You can now log in.");
      navigation.navigate("Login");
    } catch (error) {
      Alert.alert(
        "Registration failed",
        error.response?.data?.message ||
          error.message ||
          "Something went wrong."
      );
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {step === 1 ? (
        <View>
          <Title style={styles.title}>Register</Title>

          <View>
            <Controller
              control={control}
              rules={{ required: "First name is required" }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="First name"
                  value={value}
                  onChangeText={onChange}
                  mode="outlined"
                  style={styles.input}
                />
              )}
              name="firstName"
            />
            {errors.firstName && (
              <Text style={styles.errorText}>{errors.firstName.message}</Text>
            )}

            <Controller
              control={control}
              rules={{ required: "Last name is required" }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Last name"
                  value={value}
                  onChangeText={onChange}
                  mode="outlined"
                  style={styles.input}
                />
              )}
              name="lastName"
            />
            {errors.lastName && (
              <Text style={styles.errorText}>{errors.lastName.message}</Text>
            )}

            <Controller
              control={control}
              rules={{ required: "Username is required" }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Username"
                  value={value}
                  onChangeText={onChange}
                  mode="outlined"
                  style={styles.input}
                />
              )}
              name="username"
            />
            {errors.username && (
              <Text style={styles.errorText}>{errors.username.message}</Text>
            )}
            <Controller
              control={control}
              name="email"
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email format",
                },
              }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Email"
                  value={value}
                  onChangeText={onChange}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email.message}</Text>
            )}

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
                  secureTextEntry
                />
              )}
            />

            {errors.password && (
              <Text style={styles.errorText}>{errors.password.message}</Text>
            )}

            <Button
              mode="contained"
              onPress={validateStep1}
              style={styles.button}
              contentStyle={styles.buttonContent}
              buttonColor="#5335DA"
              disabled={!isStep1Valid}
            >
              <Text style={styles.buttonText}>Next</Text>
            </Button>

            <Button mode="text" onPress={() => navigation.navigate("Login")}>
              <Text> Already have an account? </Text> Log in
            </Button>
          </View>
        </View>
      ) : (
        <View>
          <Title style={styles.title}>Register</Title>

          <Text style={styles.label}>Gender</Text>

          <Controller
            control={control}
            rules={{ required: "Gender is required" }}
            render={({ field: { onChange, value } }) => (
              <RadioButton.Group onValueChange={onChange} value={value}>
                <View>
                  <RadioButton.Item label="Male" value="male" />
                  <RadioButton.Item label="Female" value="female" />
                </View>
              </RadioButton.Group>
            )}
            name="gender"
          />
          {errors.gender && (
            <Text style={styles.errorText}>{errors.gender.message}</Text>
          )}

          <Controller
            control={control}
            rules={{
              required: "Weight is required",
              min: { value: 30, message: "Too low" },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Weight"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                mode="outlined"
                style={styles.input}
                outlineColor="grey"
                activeOutlineColor="#6A1B9A"
                autoCapitalize="none"
                keyboardType="numeric"
              />
            )}
            name="weight"
          />
          {errors.weight && (
            <Text style={styles.error}>{errors.weight.message}</Text>
          )}

          <Controller
            control={control}
            rules={{
              required: "Height is required",
              min: { value: 100, message: "Too short" },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Height"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                mode="outlined"
                style={styles.input}
                outlineColor="grey"
                activeOutlineColor="#6A1B9A"
                autoCapitalize="none"
                keyboardType="numeric"
              />
            )}
            name="height"
          />
          {errors.height && (
            <Text style={styles.error}>{errors.height.message}</Text>
          )}

          <Controller
            control={control}
            name="birthdate"
            rules={{
              required: "Birthdate is required",
              pattern: {
                value: /^\d{4}-\d{2}-\d{2}$/,
                message: "Birthdate must be in YYYY-MM-DD format",
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Birthdate (YYYY-MM-DD)"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                mode="outlined"
                style={styles.input}
                outlineColor="grey"
                activeOutlineColor="#6A1B9A"
                autoCapitalize="none"
              />
            )}
          />

          {errors.birthdate && (
            <Text style={styles.error}>{errors.birthdate.message}</Text>
          )}

          <TouchableOpacity onPress={pickImage}>
            <View style={styles.imageContainer}>
              {image ? (
                <Image
                  source={{ uri: "data:image/jpeg;base64," + image.base64 }}
                  style={styles.profileImage}
                />
              ) : (
                <Text style={styles.imagePlaceholder}>Select Image</Text>
              )}
            </View>
          </TouchableOpacity>

          <Button
            mode="contained"
            onPress={() => setStep(1)}
            style={styles.buttonBack}
            contentStyle={styles.buttonContent}
            buttonColor="#999"
          >
            <Text style={styles.buttonText}>Back</Text>
          </Button>

          <Button
            mode="contained"
            onPress={handleSubmit(handleRegister)}
            style={styles.button}
            contentStyle={styles.buttonContent}
            buttonColor="#5335DA"
            disabled={!isStep2Valid}
          >
            <Text style={styles.buttonText}>Create account</Text>
          </Button>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  button: {
    marginTop: 16,
    borderRadius: 25,
  },
  error: { color: "red", marginBottom: 10 },
  buttonBack: {
    marginTop: 8,
    borderRadius: 25,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  imageContainer: { alignItems: "center", marginBottom: 15 },
  profileImage: { width: 100, height: 100, borderRadius: 50 },
  imagePlaceholder: { fontSize: 16, color: "#888" },
});

export default RegisterScreen;
