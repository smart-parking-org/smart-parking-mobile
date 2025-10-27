import { View, Text, StyleSheet } from "react-native";

export default function MapParking() {
  return (
    <View style={styles.container}>
      <Text>Tab Map</Text>
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
