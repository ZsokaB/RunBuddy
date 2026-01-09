import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Image,
  pickImage,
} from "react-native";
import mime from "mime";
import {
  Button,
  Text,
  TextInput,
  RadioButton,
  ActivityIndicator,
} from "react-native-paper";
import { v4 as uuidv4 } from "uuid";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../axiosInstance";
import { useAuth } from "../context/AuthContext";
import { config } from "../utils/config";
import LoadingIndicator from "../components/LoadingIndicator";
import { handleError } from "../utils/errorHandler";

const UpdateUserDataScreen = ({ route }) => {
  const { userId } = route.params;
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
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
      currentPassword: "",
      newPassword: "",
    },
  });
  const [gender, setGender] = useState("");
  const [image, setImage] = useState(null);
  const [profileImagePath, setProfileImagePath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileImageChanged, setProfileImageChanged] = useState(false);
  const { token } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (userId) {
          const response = await api.get(`/users/${userId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const userData = response.data;
          setProfileImagePath(response.data.profileImagePath);
          reset({
            username: userData.userName || "",
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            gender: userData.gender || "",
            weight: userData.weight?.toString() || "",
            height: userData.height?.toString() || "",
            birthdate: userData.birthdate
              ? userData.birthdate.slice(0, 10)
              : "",
            email: userData.email || "",
          });

          setLoading(false);
        }
      } catch (error) {
        handleError(error, "Fetching user data");
        setLoading(false);
      }
    };

    fetchUserData();
  }, [reset]);

  const onSubmit = async (data) => {
    const userId = await AsyncStorage.getItem("userId");
    try {
      setLoading(true);
      const response = await api.put("/users/update", data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response?.status === 200 && profileImageChanged === true) {
        console.log("Uploading image...");
        await uploadProfileImage(response.data.userId);
      }

      setLoading(false);
      navigation.push("ProfileScreen", { userId });
    } catch (error) {
      setLoading(false);
      handleError(error, "Updating user data");
      navigation.push("ProfileScreen", { userId });
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
      console.log("Uploading image with FormData:", formData);

      const response = await api.post("/users/updateProfileImage", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Image upload successful:", response.data);
    } catch (error) {
      handleError(error, "Image upload failed");
    }

    setProfileImageChanged(false);
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
      setProfileImageChanged(true);
    }
  };

  const streamProfileImage = (userId) =>
    `${config.baseURL}/users/StreamProfileImage/${userId}?access_token=${token}`;

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text variant="titleMedium" style={styles.title}>
            Update User Data
          </Text>
          <TouchableOpacity onPress={pickImage}>
            <View style={styles.imageContainer}>
              {profileImagePath && image === null ? (
                <Image
                  source={{ uri: `${streamProfileImage(userId)}` }}
                  style={styles.profileImage}
                />
              ) : (
                <Text style={styles.imagePlaceholder}>Select Image</Text>
              )}
              {image ? (
                <Image
                  source={{ uri: "data:image/jpeg;base64," + image.base64 }}
                  style={styles.profileImage}
                />
              ) : (
                <Text style={styles.imagePlaceholder}>
                  Select Image to Update
                </Text>
              )}
            </View>
          </TouchableOpacity>
          <Controller
            control={control}
            rules={{ required: "Username is required" }}
            render={({ field: { onChange, onBlur, value } }) => (
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
              >
                <View>
                  <TextInput
                    label="Username"
                    onBlur={onBlur}
                    value={value}
                    onChangeText={onChange}
                    mode="outlined"
                    style={styles.input}
                    outlineColor="grey"
                    activeOutlineColor="#6A1B9A"
                    autoCapitalize="none"
                  />
                </View>
              </KeyboardAvoidingView>
            )}
            name="username"
          />

          {errors.username && (
            <Text style={styles.error}>{errors.username.message}</Text>
          )}

          <Controller
            control={control}
            rules={{ required: "First name is required" }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="First Name"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                mode="outlined"
                style={styles.input}
                outlineColor="grey"
                activeOutlineColor="#6A1B9A"
              />
            )}
            name="firstName"
          />
          {errors.firstName && (
            <Text style={styles.error}>{errors.firstName.message}</Text>
          )}

          <Controller
            control={control}
            rules={{ required: "Last name is required" }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Last Name"
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
            name="lastName"
          />
          {errors.lastName && (
            <Text style={styles.error}>{errors.lastName.message}</Text>
          )}

          <Controller
            control={control}
            rules={{ required: "Gender is required" }}
            render={({ field: { onChange, value } }) => (
              <RadioButton.Group
                onValueChange={(newValue) => {
                  setGender(newValue);
                  onChange(newValue);
                }}
                value={value || gender}
              >
                <View style={styles.radioContainer}>
                  <View style={styles.radioButton}>
                    <RadioButton value="male" />
                    <Text>Male</Text>
                  </View>
                  <View style={styles.radioButton}>
                    <RadioButton value="female" />
                    <Text>Female</Text>
                  </View>
                </View>
              </RadioButton.Group>
            )}
            name="gender"
          />
          {errors.gender && (
            <Text style={styles.error}>{errors.gender.message}</Text>
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

          <Controller
            control={control}
            rules={{
              required: "Email is required",
              pattern: { value: /.+@.+\..+/, message: "Invalid email" },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Email"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                mode="outlined"
                style={styles.input}
                outlineColor="grey"
                activeOutlineColor="#6A1B9A"
                autoCapitalize="none"
                keyboardType="email-address"
              />
            )}
            name="email"
          />
          {errors.email && (
            <Text style={styles.error}>{errors.email.message}</Text>
          )}

          <Controller
            control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Current Password"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                mode="outlined"
                style={styles.input}
                outlineColor="grey"
                activeOutlineColor="#6A1B9A"
                autoCapitalize="none"
                secureTextEntry
              />
            )}
            name="currentPassword"
          />

          <Controller
            control={control}
            rules={{
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters",
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="New Password"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                mode="outlined"
                style={styles.input}
                outlineColor="grey"
                activeOutlineColor="#6A1B9A"
                autoCapitalize="none"
                secureTextEntry
              />
            )}
            name="newPassword"
          />
          {errors.newPassword && (
            <Text style={styles.error}>{errors.newPassword.message}</Text>
          )}
          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            style={styles.button}
          >
            Save Changes
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    paddingBottom: 10,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    marginBottom: 10,
  },
  error: { color: "red", marginBottom: 10 },
  button: { marginTop: 10 },
  scrollContainer: { flexGrow: 1, justifyContent: "center" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  radioContainer: { flexDirection: "row", marginBottom: 10 },
  radioButton: { flexDirection: "row", alignItems: "center", marginRight: 15 },
  profileImage: { width: 100, height: 100, borderRadius: 50 },
  imageContainer: { alignItems: "center", marginBottom: 15 },
});

export default UpdateUserDataScreen;
