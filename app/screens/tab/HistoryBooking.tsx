import { View, Text, StyleSheet } from "react-native";

export default function HistoryBooking() {
  return (
    <View style={styles.container}>
      <Text>Tab History</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
