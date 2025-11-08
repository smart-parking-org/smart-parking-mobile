import React, { useCallback } from "react";
import { View, Text, FlatList } from "react-native";
import { CompactVehicleCard, type Vehicle } from "./VehicleCard";

type VehicleListProps = {
  vehicles: Vehicle[];
  filteredVehicles: Vehicle[];
  deletingId: number | null;
  settingDefaultId: number | null;
  onSetDefault: (vehicle: Vehicle) => void;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
  onOpenActions: (vehicle: Vehicle) => void; // Thêm prop mới
};

export function VehicleList({
  vehicles,
  filteredVehicles,
  deletingId,
  settingDefaultId,
  onSetDefault,
  onEdit,
  onDelete,
  onOpenActions, // Thêm prop mới
}: VehicleListProps) {
  const isBusy = useCallback(
    (v: Vehicle) => deletingId === v.id || settingDefaultId === v.id,
    [deletingId, settingDefaultId]
  );

  const renderItem = ({ item }: { item: Vehicle }) => (
    <View style={{ paddingVertical: 1 }}>
      <CompactVehicleCard
        vehicle={item}
        busy={isBusy(item)}
        onSetDefault={() => onSetDefault(item)}
        onEdit={() => onEdit(item)}
        onDelete={() => onDelete(item)}
        onOpenActions={() => onOpenActions(item)} // Thêm prop
      />
    </View>
  );

  return (
    <FlatList
      data={filteredVehicles}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 110,
      }}
      ListHeaderComponent={
        <View style={{ marginBottom: 4 }}>
          <Text style={{ fontSize: 12, color: "#6B7280", fontWeight: "600" }}>
            Đang hiển thị {filteredVehicles.length}
            {filteredVehicles.length !== vehicles.length
              ? ` / ${vehicles.length}`
              : ""}{" "}
            phương tiện
          </Text>
        </View>
      }
      showsVerticalScrollIndicator={false}
      initialNumToRender={8}
      windowSize={9}
      removeClippedSubviews
    />
  );
}
