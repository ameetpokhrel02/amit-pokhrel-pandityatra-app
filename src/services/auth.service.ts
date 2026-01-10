import api from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 1️⃣ Send OTP
export const requestOtp = async (email: string, phone: string) => {
  const res = await api.post("/users/request-otp/", {
    email,
    phone,
  });
  return res.data;
};

// 2️⃣ Verify OTP
export const verifyOtp = async (email: string, otp: string) => {
  const res = await api.post("/users/verify-otp/", {
    email,
    otp,
  });
  return res.data;
};

// 3️⃣ Login (JWT)
export const login = async (phone: string, password: string) => {
  const res = await api.post("/token/", {
    phone,
    password,
  });

  await AsyncStorage.setItem("access_token", res.data.access);
  await AsyncStorage.setItem("refresh_token", res.data.refresh);

  return res.data;
};

// 4️⃣ Logged in user
export const getMe = async () => {
  const res = await api.get("/users/me/");
  return res.data;
};

// 5️⃣ Logout
export const logout = async () => {
  await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
};