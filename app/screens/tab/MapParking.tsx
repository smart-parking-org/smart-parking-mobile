import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  FlatList,
  Keyboard,
  Image,
} from "react-native";
import MapView, { type MapMarker, Marker, Region } from "react-native-maps";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import {
  getParkingLots,
  getParkingLotStatistics,
  type ParkingLotStats,
  type ParkingLot,
} from "@/lib/api/parking-lots";
import DetailMarkerPanel from "@/app/components/map/DetailMarkerPanel";
import { mapLightStyle } from "@/lib/mapLightStyle";
import { router, useFocusEffect } from "expo-router";
import { AppColor } from "@/lib/utils/color";

const normalizeText = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export default function MapParking() {
  const [region] = useState<Region>({
    latitude: 10.778768,
    longitude: 106.632945,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(true);

  // SEARCH
  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // CHỌN BÃI (lưu thẳng object)
  const [selectedLot, setSelectedLot] = useState<ParkingLot | null>(null);
  const [statistics, setStatistics] = useState<ParkingLotStats | null>(null);

  const mapRef = useRef<MapView>(null);
  const inputRef = useRef<TextInput>(null);
  const myLocationRef = useRef<MapMarker>(null);

  const loadParkingLots = async () => {
    try {
      setLoading(true);
      const lots = await getParkingLots();
      setParkingLots(lots);
    } catch (error: any) {
      console.error("Error loading parking lots:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParkingLots();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setSelectedLot(null);
      loadParkingLots();
      setQuery("");
      mapRef.current?.animateToRegion(
        { ...region, latitudeDelta: 0.008, longitudeDelta: 0.008 },
        500
      );
    }, [region])
  );

  useEffect(() => {
    if (selectedLot) {
      (async () => {
        try {
          const statistics = await getParkingLotStatistics(selectedLot?.id);
          setStatistics(statistics || []);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [selectedLot]);

  const filteredLots = useMemo(() => {
    const q = normalizeText(query);
    if (!q) return [];
    return parkingLots
      .filter((lot) => normalizeText(lot.name).includes(q))
      .slice(0, 10);
  }, [query, parkingLots]);

  const flyToLot = (lot: ParkingLot, zoom = 0.01) => {
    const latitude = parseFloat((lot as any).gate_pos_x);
    const longitude = parseFloat((lot as any).gate_pos_y);
    if (isNaN(latitude) || isNaN(longitude)) return;
    mapRef.current?.animateToRegion(
      { latitude, longitude, latitudeDelta: zoom, longitudeDelta: zoom },
      500
    );
  };

  const handleSubmitSearch = () => {
    if (filteredLots.length > 0) {
      flyToLot(filteredLots[0]);
      setDropdownOpen(false);
      Keyboard.dismiss();
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={region}
        onPanDrag={() => setSelectedLot(null)}
        onPress={() => {
          inputRef.current?.blur();
          if (selectedLot) {
            setSelectedLot(null);
          }
        }}
        customMapStyle={mapLightStyle}
      >
        {parkingLots.map((lot) => {
          const latitude = parseFloat((lot as any).gate_pos_x);
          const longitude = parseFloat((lot as any).gate_pos_y);
          if (isNaN(latitude) || isNaN(longitude)) return null;

          const isSelected = selectedLot
            ? String(selectedLot.id) === String(lot.id)
            : false;

          return (
            <Marker
              key={String(lot.id)}
              coordinate={{ latitude, longitude }}
              title={lot.name}
              description={`Bãi đỗ xe ${lot.name}`}
              pinColor={isSelected ? "red" : "#2b7fff"}
              onPress={() => {
                setSelectedLot(lot);
                flyToLot(lot, 0.008);
              }}
            >
              <Image
                source={require("@/assets/images/marker.png")}
                style={{
                  width: isSelected ? 50 : 40,
                  height: isSelected ? 50 : 40,
                }}
                resizeMode="contain"
              />
            </Marker>
          );
        })}

        <Marker
          ref={myLocationRef}
          title="Vị trí của bạn"
          description="Vị trí hiện tại của bạn"
          coordinate={region}
          onPress={() =>
            mapRef.current?.animateToRegion(
              { ...region, latitudeDelta: 0.008, longitudeDelta: 0.008 },
              500
            )
          }
        >
          <Ionicons name="pin-sharp" color={AppColor.DANGER} size={28} />
        </Marker>
      </MapView>

      {/* Search overlay */}
      <View className="absolute left-4 right-4 top-4">
        <View className="bg-white rounded-2xl px-4 pt-3 pb-2 shadow border border-gray-300">
          <View className="flex-row items-center gap-2">
            <Ionicons name="search" size={18} color="#6b7280" />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={(t) => {
                setQuery(t);
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
              onSubmitEditing={handleSubmitSearch}
              placeholder="Bạn muốn gửi xe ở bãi đỗ nào?"
              placeholderTextColor="#9ca3af"
              className="flex-1 text-[15px] text-gray-800 py-1.5 border-b border-b-gray-400"
              returnKeyType="search"
            />
            {query ? (
              <TouchableOpacity
                onPress={() => {
                  setQuery("");
                  setDropdownOpen(false);
                }}
                className="p-1"
              >
                <Ionicons name="close-circle" size={18} color="#9ca3af" />
              </TouchableOpacity>
            ) : null}
          </View>

          <View className="mt-3">
            <View className="flex-row items-center mb-2">
              <MaterialIcons
                name="lightbulb-outline"
                size={14}
                color="#9ca3af"
              />
              <Text className="ml-1 text-sm text-gray-400">Gợi ý cho bạn:</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {parkingLots.map((lot) => {
                const lotName =
                  lot.name.charAt(0).toUpperCase() + lot.name.slice(1);
                return (
                  <TouchableOpacity
                    key={lot.id}
                    onPress={() => {
                      setQuery(lotName.toLowerCase());
                      inputRef.current?.focus();
                    }}
                    className="bg-gray-100 rounded-full px-3 py-1 active:opacity-80"
                  >
                    <Text className="text-gray-600 text-xs line-clamp-1 max-w-[100px]">
                      {lotName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Kết quả tìm kiếm (chỉ bay tới, không mở panel) */}
          {dropdownOpen && (
            <View className="mt-3 -mx-4">
              {query && (
                <Text className="ml-5 mb-1 text-sm text-gray-400">
                  Kết quả tìm kiếm:{" "}
                </Text>
              )}
              <FlatList
                keyboardShouldPersistTaps="handled"
                data={filteredLots}
                keyExtractor={(item) => String(item.id)}
                style={{ maxHeight: 220 }}
                ListEmptyComponent={
                  query ? (
                    <Text className="px-5 py-2 text-center text-gray-500">
                      Không tìm thấy kết quả
                    </Text>
                  ) : null
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className="active:bg-gray-100 px-4"
                    onPress={() => {
                      flyToLot(item);
                      setDropdownOpen(false);
                      Keyboard.dismiss();
                      // Không setSelectedLot -> phải bấm Marker để mở panel
                    }}
                  >
                    <Text
                      className="text-gray-900 font-medium bg-blue-50 py-3 px-2 rounded-xl"
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>
      </View>

      {/* Floating buttons */}
      <View className="absolute right-4 bottom-14 items-center">
        <TouchableOpacity
          onPress={() => {
            mapRef.current?.animateToRegion(region, 500);
            myLocationRef.current?.showCallout();
          }}
          className="w-12 h-12 rounded-full bg-white items-center justify-center shadow-md active:opacity-80"
        >
          <MaterialIcons name="my-location" size={20} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* PANEL CHI TIẾT + Nút ĐẶT CHỖ: chỉ hiện khi bấm Marker */}
      {selectedLot && statistics && (
        <DetailMarkerPanel
          lot={selectedLot}
          statistics={statistics}
          onClose={() => setSelectedLot(null)}
          onReserve={() => {
            router.push({
              pathname: "/screens/parking/VehicleSlotScreen",
              params: {
                lotId: String(selectedLot.id),
                lotName: selectedLot.name,
              },
            });
          }}
        />
      )}
    </View>
  );
}
