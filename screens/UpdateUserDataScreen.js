import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { Button } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../axiosInstance";

const UpdateUserDataScreen = ({ route }) => {
  const { userId } = route.params;
  const { control, handleSubmit, formState: { errors }, reset } = useForm({
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

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (userId) {
          const response = await api.get(`/users/${userId}`);
          const userData = response.data;

          reset({
            username: userData.userName || "",
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            gender: userData.gender || "",
            weight: userData.weight?.toString() || "",
            height: userData.height?.toString() || "",
            birthdate: userData.birthdate || "",
            email: userData.email || "",
          });

          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [reset]);

  const onSubmit = async (data) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const response = await api.put("/user/update", data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("User updated:", response.data);
    } catch (error) {
      console.error("Error updating user data:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Update Profile</Text>

      {/* Username */}
      <Controller
        control={control}
        rules={{ required: "Username is required" }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Username"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
        name="username"
      />
      {errors.username && <Text style={styles.error}>{errors.username.message}</Text>}

      {/* First Name */}
      <Controller
        control={control}
        rules={{ required: "First name is required" }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="First Name"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
        name="firstName"
      />
      {errors.firstName && <Text style={styles.error}>{errors.firstName.message}</Text>}

      {/* Last Name */}
      <Controller
        control={control}
        rules={{ required: "Last name is required" }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
        name="lastName"
      />
      {errors.lastName && <Text style={styles.error}>{errors.lastName.message}</Text>}

      {/* Gender */}
      <Controller
        control={control}
        rules={{ required: "Gender is required" }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Gender (Male/Female)"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
        name="gender"
      />
      {errors.gender && <Text style={styles.error}>{errors.gender.message}</Text>}

      {/* Weight */}
      <Controller
        control={control}
        rules={{ required: "Weight is required", min: { value: 30, message: "Too low" } }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Weight (kg)"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            keyboardType="numeric"
          />
        )}
        name="weight"
      />
      {errors.weight && <Text style={styles.error}>{errors.weight.message}</Text>}

      {/* Height */}
      <Controller
        control={control}
        rules={{ required: "Height is required", min: { value: 100, message: "Too short" } }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Height (cm)"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            keyboardType="numeric"
          />
        )}
        name="height"
      />
      {errors.height && <Text style={styles.error}>{errors.height.message}</Text>}

      {/* Birthdate */}
      <Controller
        control={control}
        rules={{ required: "Birthdate is required" }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Birthdate (YYYY-MM-DD)"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
        name="birthdate"
      />
      {errors.birthdate && <Text style={styles.error}>{errors.birthdate.message}</Text>}

      {/* Email */}
      <Controller
        control={control}
        rules={{
          required: "Email is required",
          pattern: { value: /.+@.+\..+/, message: "Invalid email" },
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Email"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            keyboardType="email-address"
          />
        )}
        name="email"
      />
      {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}

      {/* Current Password */}
      <Controller
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Current Password"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            secureTextEntry
          />
        )}
        name="currentPassword"
      />

      {/* New Password */}
      <Controller
        control={control}
        rules={{ minLength: { value: 6, message: "Password must be at least 6 characters" } }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="New Password"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            secureTextEntry
          />
        )}
        name="newPassword"
      />
      {errors.newPassword && <Text style={styles.error}>{errors.newPassword.message}</Text>}

      <Button mode="contained" onPress={handleSubmit(onSubmit)} style={styles.button}>
        Save Changes
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 5, padding: 10, marginBottom: 10 },
  error: { color: "red", marginBottom: 10 },
  button: { marginTop: 10 },
});

export default UpdateUserDataScreen;
