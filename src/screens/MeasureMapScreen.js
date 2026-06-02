import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Location from "expo-location";
import MapView, { Marker, Polygon, Polyline } from "react-native-maps";

import AccuracyBadge from "../components/AccuracyBadge";
import InfoCard from "../components/InfoCard";
import PrimaryButton from "../components/PrimaryButton";
import colors from "../constants/colors";
import {
  calculateAreaM2,
  calculateAverageAccuracy,
  calculateSegmentDistances,
  calculateMaxAccuracy,
  calculateMinAccuracy,
  calculatePerimeterM,
  m2ToHectares,
} from "../utils/geoUtils";
import screenStyles from "./screenStyles";

const POSITION_UNAVAILABLE_MESSAGE =
  "Position GPS indisponible. Vérifiez que le GPS est activé et réessayez en extérieur.";
const MAX_SAVED_POINTS = 100;
const MAP_TYPE_OPTIONS = [
  { label: "Standard", value: "standard" },
  { label: "Satellite", value: "satellite" },
  { label: "Hybride", value: "hybrid" },
];

function formatCoordinate(value) {
  return typeof value === "number" ? value.toFixed(7) : "Indisponible";
}

function formatAccuracy(value) {
  return typeof value === "number" ? `${Math.round(value)} m` : "Indisponible";
}

function formatTimestamp(value) {
  return typeof value === "number"
    ? new Date(value).toLocaleString("fr-FR")
    : "Indisponible";
}

function getAccuracyStatus(accuracy) {
  if (typeof accuracy !== "number") {
    return "idle";
  }

  return accuracy <= 10 ? "good" : "warning";
}

function buildGpsPoint(position) {
  if (!position?.coords) {
    return null;
  }

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    timestamp: position.timestamp,
  };
}

function isValidMapCoordinate(point) {
  return Number.isFinite(point?.latitude) && Number.isFinite(point?.longitude);
}

function toMapCoordinate(point) {
  if (!isValidMapCoordinate(point)) {
    return null;
  }

  return {
    latitude: point.latitude,
    longitude: point.longitude,
  };
}

function buildMapRegion(points, currentPoint) {
  const coordinates = [
    ...points.map(toMapCoordinate),
    toMapCoordinate(currentPoint),
  ].filter(Boolean);

  if (coordinates.length === 0) {
    return {
      latitude: 0,
      longitude: 0,
      latitudeDelta: 60,
      longitudeDelta: 60,
    };
  }

  const latitudes = coordinates.map((coordinate) => coordinate.latitude);
  const longitudes = coordinates.map((coordinate) => coordinate.longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);

  return {
    latitude: (minLatitude + maxLatitude) / 2,
    longitude: (minLongitude + maxLongitude) / 2,
    latitudeDelta: Math.max((maxLatitude - minLatitude) * 1.6, 0.005),
    longitudeDelta: Math.max((maxLongitude - minLongitude) * 1.6, 0.005),
  };
}

function SegmentDistanceRow({ segment }) {
  return (
    <Text style={styles.segmentText}>
      Point {segment.from} → Point {segment.to} :{" "}
      {formatAccuracy(segment.distanceM)}
    </Text>
  );
}

function areSamePoint(firstPoint, secondPoint) {
  return (
    firstPoint?.latitude === secondPoint?.latitude &&
    firstPoint?.longitude === secondPoint?.longitude &&
    firstPoint?.accuracy === secondPoint?.accuracy &&
    firstPoint?.timestamp === secondPoint?.timestamp
  );
}

export default function MeasureMapScreen({ navigation, route }) {
  const measurementInfo = route.params?.measurementInfo;
  const [currentPosition, setCurrentPosition] = useState(null);
  const [isLoadingPosition, setIsLoadingPosition] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [savedPoints, setSavedPoints] = useState([]);
  const [mapType, setMapType] = useState("standard");

  const requestCurrentPosition = useCallback(async () => {
    setIsLoadingPosition(true);
    setLocationError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        setCurrentPosition(null);
        setLocationError(
          "Permission GPS refusée. Autorisez la localisation pour lire votre position actuelle.",
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      setCurrentPosition(position);
    } catch {
      setCurrentPosition(null);
      setLocationError(POSITION_UNAVAILABLE_MESSAGE);
    } finally {
      setIsLoadingPosition(false);
    }
  }, []);

  useEffect(() => {
    requestCurrentPosition();
  }, [requestCurrentPosition]);

  const addPoint = useCallback(() => {
    const nextPoint = buildGpsPoint(currentPosition);

    if (!nextPoint) {
      Alert.alert(
        "Position indisponible",
        "Aucune position GPS disponible. Actualisez la position avant d’ajouter un point.",
      );
      return;
    }

    if (savedPoints.length >= MAX_SAVED_POINTS) {
      Alert.alert(
        "Limite atteinte",
        "Vous ne pouvez pas enregistrer plus de 100 points GPS pour une mesure.",
      );
      return;
    }

    const lastPoint = savedPoints[savedPoints.length - 1];

    if (areSamePoint(lastPoint, nextPoint)) {
      Alert.alert(
        "Point déjà enregistré",
        "Ce point GPS est exactement identique au dernier point enregistré.",
      );
      return;
    }

    const savePoint = () => {
      setSavedPoints((previousPoints) => [...previousPoints, nextPoint]);
      Alert.alert("Point ajouté", "Le point GPS a été ajouté avec succès.");
    };

    if (typeof nextPoint.accuracy === "number" && nextPoint.accuracy > 15) {
      Alert.alert(
        "Précision GPS faible",
        `La précision actuelle est de ${formatAccuracy(nextPoint.accuracy)}. Voulez-vous quand même ajouter ce point ?`,
        [
          { text: "Annuler", style: "cancel" },
          { text: "Ajouter", onPress: savePoint },
        ],
      );
      return;
    }

    savePoint();
  }, [currentPosition, savedPoints]);

  const deleteLastPoint = useCallback(() => {
    if (savedPoints.length === 0) {
      Alert.alert("Aucun point", "Aucun point GPS enregistré à supprimer.");
      return;
    }

    setSavedPoints((previousPoints) => previousPoints.slice(0, -1));
    Alert.alert(
      "Point supprimé",
      "Le dernier point GPS enregistré a été supprimé.",
    );
  }, [savedPoints.length]);

  const resetPoints = useCallback(() => {
    if (savedPoints.length === 0) {
      Alert.alert("Aucun point", "Aucun point GPS enregistré à réinitialiser.");
      return;
    }

    Alert.alert(
      "Réinitialiser les points",
      "Voulez-vous vraiment supprimer tous les points GPS enregistrés pour cette mesure ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Réinitialiser",
          style: "destructive",
          onPress: () => {
            setSavedPoints([]);
            Alert.alert(
              "Points réinitialisés",
              "Tous les points GPS enregistrés ont été supprimés.",
            );
          },
        },
      ],
    );
  }, [savedPoints.length]);

  const calculateSurface = useCallback(() => {
    if (savedPoints.length < 3) {
      Alert.alert(
        "Points insuffisants",
        "Ajoutez au moins 3 points pour calculer la superficie.",
      );
      return;
    }

    const areaM2 = calculateAreaM2(savedPoints);
    const areaHa = m2ToHectares(areaM2);
    const perimeterM = calculatePerimeterM(savedPoints);
    const averageAccuracy = calculateAverageAccuracy(savedPoints);
    const minAccuracy = calculateMinAccuracy(savedPoints);
    const maxAccuracy = calculateMaxAccuracy(savedPoints);

    navigation.navigate("Result", {
      measurementInfo,
      points: savedPoints,
      areaM2,
      areaHa,
      perimeterM,
      averageAccuracy,
      minAccuracy,
      maxAccuracy,
      createdAt: new Date().toISOString(),
    });
  }, [measurementInfo, navigation, savedPoints]);

  const currentMapPoint = buildGpsPoint(currentPosition);
  const mapPointItems = useMemo(
    () =>
      savedPoints
        .map((point, index) => ({ coordinate: toMapCoordinate(point), index }))
        .filter((item) => item.coordinate),
    [savedPoints],
  );
  const mapPoints = useMemo(
    () => mapPointItems.map((item) => item.coordinate),
    [mapPointItems],
  );
  const currentMapCoordinate = useMemo(
    () => toMapCoordinate(currentMapPoint),
    [currentMapPoint],
  );
  const mapRegion = useMemo(
    () => buildMapRegion(savedPoints, currentMapPoint),
    [currentMapPoint, savedPoints],
  );
  const segmentDistances = useMemo(
    () => calculateSegmentDistances(savedPoints),
    [savedPoints],
  );
  const accuracy = currentPosition?.coords?.accuracy;
  const accuracyBadge = useMemo(() => {
    if (isLoadingPosition) {
      return { label: "Recherche du signal GPS…", status: "idle" };
    }

    if (locationError) {
      return { label: "GPS indisponible", status: "warning" };
    }

    if (typeof accuracy === "number") {
      return {
        label: `Précision GPS : ${formatAccuracy(accuracy)}`,
        status: getAccuracyStatus(accuracy),
      };
    }

    return { label: "Précision GPS indisponible", status: "idle" };
  }, [accuracy, isLoadingPosition, locationError]);

  return (
    <ScrollView
      contentContainerStyle={screenStyles.content}
      style={screenStyles.container}
    >
      <Text style={screenStyles.title}>Carte de mesure</Text>
      <Text style={screenStyles.subtitle}>
        Écran réservé au suivi GPS et à l’affichage de la trace.
      </Text>

      <AccuracyBadge
        label={accuracyBadge.label}
        status={accuracyBadge.status}
      />

      {measurementInfo ? (
        <View style={screenStyles.measurementSummary}>
          <Text style={screenStyles.summaryTitle}>
            Informations de la mesure
          </Text>

          <View style={screenStyles.summaryItem}>
            <Text style={screenStyles.summaryLabel}>Nom du client</Text>
            <Text style={screenStyles.summaryValue}>
              {measurementInfo.clientName}
            </Text>
          </View>

          <View style={screenStyles.summaryItem}>
            <Text style={screenStyles.summaryLabel}>Localisation</Text>
            <Text style={screenStyles.summaryValue}>
              {measurementInfo.locationName}
            </Text>
          </View>

          <View style={screenStyles.summaryItem}>
            <Text style={screenStyles.summaryLabel}>Type de projet</Text>
            <Text style={screenStyles.summaryValue}>
              {measurementInfo.projectType}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.gpsCard}>
        <View style={styles.gpsHeader}>
          <Text style={styles.gpsTitle}>Position GPS actuelle</Text>
          {isLoadingPosition ? (
            <Text style={styles.loadingText}>Lecture en cours…</Text>
          ) : null}
        </View>

        <Text style={styles.helpText}>
          Attendez quelques secondes que le signal GPS se stabilise avant de
          commencer la mesure.
        </Text>

        {locationError ? (
          <Text style={styles.errorText}>{locationError}</Text>
        ) : null}

        <View style={styles.gpsDataGrid}>
          <View style={styles.gpsDataItem}>
            <Text style={screenStyles.summaryLabel}>Latitude</Text>
            <Text style={styles.gpsValue}>
              {formatCoordinate(currentPosition?.coords?.latitude)}
            </Text>
          </View>

          <View style={styles.gpsDataItem}>
            <Text style={screenStyles.summaryLabel}>Longitude</Text>
            <Text style={styles.gpsValue}>
              {formatCoordinate(currentPosition?.coords?.longitude)}
            </Text>
          </View>

          <View style={styles.gpsDataItem}>
            <Text style={screenStyles.summaryLabel}>Accuracy</Text>
            <Text style={styles.gpsValue}>{formatAccuracy(accuracy)}</Text>
          </View>

          <View style={styles.gpsDataItem}>
            <Text style={screenStyles.summaryLabel}>Timestamp</Text>
            <Text style={styles.gpsValue}>
              {formatTimestamp(currentPosition?.timestamp)}
            </Text>
          </View>
        </View>

        {typeof accuracy === "number" && accuracy > 10 ? (
          <Text style={styles.warningText}>
            Attention : la précision GPS est faible. Déplacez-vous en zone
            dégagée si possible avant d’ajouter un point.
          </Text>
        ) : null}

        <PrimaryButton
          disabled={isLoadingPosition}
          label={
            isLoadingPosition
              ? "Actualisation en cours…"
              : "Actualiser la position"
          }
          onPress={requestCurrentPosition}
        />
      </View>

      <View style={styles.mapCard}>
        <View style={styles.pointsHeader}>
          <Text style={styles.pointsTitle}>Carte du terrain</Text>
          <Text style={styles.pointsCount}>
            Visualisation des points GPS enregistrés
          </Text>
        </View>

        <View style={styles.mapTypeSelector}>
          {MAP_TYPE_OPTIONS.map((option) => {
            const isSelected = mapType === option.value;

            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => setMapType(option.value)}
                style={[
                  styles.mapTypeButton,
                  isSelected ? styles.mapTypeButtonSelected : null,
                ]}
              >
                <Text
                  style={[
                    styles.mapTypeButtonText,
                    isSelected ? styles.mapTypeButtonTextSelected : null,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.mapTypeNote}>
          Le mode satellite dépend de la disponibilité des données
          cartographiques et de la connexion Internet.
        </Text>

        <View style={styles.mapContainer}>
          <MapView
            key={`${savedPoints.length}-${mapRegion.latitude}-${mapRegion.longitude}`}
            style={styles.map}
            initialRegion={mapRegion}
            mapType={mapType}
          >
            {currentMapCoordinate ? (
              <Marker
                coordinate={currentMapCoordinate}
                pinColor="#2563EB"
                title="Position actuelle"
              />
            ) : null}

            {mapPointItems.map(({ coordinate, index }) => (
              <Marker
                key={`saved-marker-${index}-${coordinate.latitude}-${coordinate.longitude}`}
                coordinate={coordinate}
                title={`Point ${index + 1}`}
                description="Point GPS enregistré"
              >
                <View style={styles.numberedMarker}>
                  <Text style={styles.numberedMarkerText}>{index + 1}</Text>
                </View>
              </Marker>
            ))}

            {mapPoints.length >= 2 ? (
              <Polyline
                coordinates={mapPoints}
                strokeColor={colors.primary}
                strokeWidth={4}
              />
            ) : null}

            {mapPoints.length >= 3 ? (
              <Polygon
                coordinates={mapPoints}
                fillColor="rgba(47, 133, 90, 0.20)"
                strokeColor={colors.primaryDark}
                strokeWidth={2}
              />
            ) : null}
          </MapView>
        </View>

        <View style={styles.mapLegend}>
          <Text style={styles.legendText}>
            • Marqueur vert : point GPS enregistré
          </Text>
          <Text style={styles.legendText}>
            • Marqueur bleu : position actuelle du téléphone
          </Text>
          <Text style={styles.legendText}>
            • La surface verte apparaît dès 3 points enregistrés.
          </Text>
        </View>
      </View>

      <View style={styles.pointsCard}>
        <View style={styles.pointsHeader}>
          <Text style={styles.pointsTitle}>Points GPS enregistrés</Text>
          <Text style={styles.pointsCount}>
            {savedPoints.length} / {MAX_SAVED_POINTS} points
          </Text>
        </View>

        <View style={styles.pointsActions}>
          <PrimaryButton label="Ajouter ce point" onPress={addPoint} />
          <PrimaryButton
            label="Supprimer le dernier point"
            onPress={deleteLastPoint}
            variant="secondary"
          />
          <PrimaryButton
            label="Réinitialiser les points"
            onPress={resetPoints}
            variant="secondary"
          />
        </View>

        {savedPoints.length === 0 ? (
          <Text style={styles.emptyPointsText}>
            Aucun point GPS enregistré pour le moment.
          </Text>
        ) : (
          <View style={styles.pointsList}>
            {savedPoints.map((point, index) => (
              <View
                // Les points peuvent être exactement identiques à d’anciens points non consécutifs.
                // L’index garde donc une clé stable dans cette liste locale.
                key={`${point.timestamp}-${index}`}
                style={styles.pointItem}
              >
                <Text style={styles.pointTitle}>Point {index + 1}</Text>
                <Text style={styles.pointValue}>
                  Latitude : {formatCoordinate(point.latitude)}
                </Text>
                <Text style={styles.pointValue}>
                  Longitude : {formatCoordinate(point.longitude)}
                </Text>
                <Text style={styles.pointValue}>
                  Accuracy : {formatAccuracy(point.accuracy)}
                </Text>
                <Text style={styles.pointValue}>
                  Timestamp : {formatTimestamp(point.timestamp)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {segmentDistances.length >= 1 ? (
        <View style={styles.segmentsCard}>
          <Text style={styles.pointsTitle}>Distances des côtés</Text>
          <View style={styles.segmentList}>
            {segmentDistances.map((segment) => (
              <SegmentDistanceRow
                key={`segment-${segment.from}-${segment.to}`}
                segment={segment}
              />
            ))}
          </View>
        </View>
      ) : null}

      <InfoCard
        title="Calcul disponible"
        description="Dès que 3 points GPS au minimum sont enregistrés, calculez la superficie et le périmètre du terrain."
      />

      <View style={screenStyles.buttonGroup}>
        <PrimaryButton
          label="Calculer la superficie"
          onPress={calculateSurface}
        />
        <PrimaryButton
          label="Annuler"
          onPress={() => navigation.navigate("MainTabs", { screen: "Home" })}
          variant="secondary"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  gpsCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
    padding: 18,
  },
  gpsHeader: {
    gap: 4,
  },
  gpsTitle: {
    color: colors.primaryDark,
    fontSize: 18,
    fontWeight: "800",
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700",
  },
  helpText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  warningText: {
    backgroundColor: "#FFF3CD",
    borderRadius: 12,
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    padding: 12,
  },
  gpsDataGrid: {
    gap: 12,
  },
  gpsDataItem: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    gap: 6,
    padding: 14,
  },
  gpsValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },

  mapCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  mapTypeSelector: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    flexDirection: "row",
    gap: 8,
    padding: 6,
  },
  mapTypeButton: {
    alignItems: "center",
    borderRadius: 12,
    flex: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  mapTypeButtonSelected: {
    backgroundColor: colors.primary,
  },
  mapTypeButtonText: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  mapTypeButtonTextSelected: {
    color: colors.surface,
  },
  mapTypeNote: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
  },
  mapContainer: {
    borderRadius: 18,
    height: 300,
    overflow: "hidden",
  },
  map: {
    height: "100%",
    width: "100%",
  },
  numberedMarker: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  numberedMarkerText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: "900",
  },
  mapLegend: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    gap: 4,
    padding: 12,
  },
  legendText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  segmentsCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  segmentList: {
    gap: 8,
  },
  segmentText: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
    padding: 12,
  },
  pointsCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
    padding: 18,
  },
  pointsHeader: {
    gap: 4,
  },
  pointsTitle: {
    color: colors.primaryDark,
    fontSize: 18,
    fontWeight: "800",
  },
  pointsCount: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700",
  },
  pointsActions: {
    gap: 10,
  },
  emptyPointsText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  pointsList: {
    gap: 10,
  },
  pointItem: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    gap: 5,
    padding: 14,
  },
  pointTitle: {
    color: colors.primaryDark,
    fontSize: 16,
    fontWeight: "800",
  },
  pointValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
});
