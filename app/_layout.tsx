import { Stack, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import "../global.css";

export default function Root() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
